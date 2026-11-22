import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { registrarFalla } from "../../utils/log.utils.js";
import { tieneVersionPublica, tieneEdicionPendiente, conservaVersionPublica, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { sanitizarUrlLectura, parsearIdBigInt, esVerdadero } from "../../utils/sanitize.utils.js";
import { combinarCambios } from "../../utils/cambios.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { eliminarArchivosReemplazados } from "../../utils/archivos.utils.js";
import { parsearFecha } from "../../utils/fechas.utils.js";
import { sembrarCapacitacionesIniciales } from "./capacitaciones/seed.js";
import { formatearCapacitacion } from "./capacitaciones/formato.js";
import {
  BUCKET_DOCUMENTOS,
  BUCKET_MEDIOS,
  separarArchivos,
  subirBanner,
  clasificarMaterial,
  subirMaterial,
  archivosDeCapacitacion,
} from "./capacitaciones/archivos.js";
import {
  normalizarUrlOpcional,
  fechaEditada,
  leerContenido,
  videoFinalDe,
  armarContenidoNuevo,
  armarContenidoEditado,
} from "./capacitaciones/datos.js";
import { cambiosDeCapacitacion } from "./capacitaciones/cambios.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado, fuePublico } from "../../utils/flujoEditorial.utils.js";

const metaEditorial = crearMetaEditorial({ entidad: "capacitación", modelos: { "": "capacitacion" } });


class CmsCapacitacionService {
  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  guardarMotivoRechazo(id, motivo) { return metaEditorial.guardarMotivoRechazo(id, motivo); }
  limpiarMotivoRechazo(id) { return metaEditorial.limpiarMotivoRechazo(id); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  guardarPendingMeta(id, meta) { return metaEditorial.guardarPendingMeta(id, meta); }
  limpiarPendingMeta(id) { return metaEditorial.limpiarPendingMeta(id); }

  _nombreEditor(user) {
    return user?.name || user?.preferred_username || user?.username || "Editor CMS";
  }

  // Versión pública de una capacitación, tal como se guarda para que el portal la siga mostrando
  // mientras hay una edición en revisión.
  _armarSnapshotPublico(c) {
    return {
      titulo: c.titulo,
      descripcion: c.descripcion,
      contenido: c.contenido,
      imagenId: c.imagenId,
      videoUrl: c.videoUrl,
      enlaceUrl: c.enlaceUrl,
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      archivo: c.archivo,
    };
  }

  async obtenerCapacitaciones() {
    await sembrarCapacitacionesIniciales();
    const [capacitaciones, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.capacitacion.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    return capacitaciones.map((c) => {
      const idStr = c.id.toString();
      return formatearCapacitacion(c, motivosMap.get(idStr), pendingMetaMap.get(idStr));
    });
  }

  async obtenerCapacitacionesPublicas() {
    await sembrarCapacitacionesIniciales();
    const [capacitaciones, pendingMetaMap] = await Promise.all([
      prisma.capacitacion.findMany({
        where: {
          activo: true,
          estado: { in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION", "RECHAZADO"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
        },
      }),
      this.obtenerMapaPendingMeta(),
    ]);

    const resultado = [];
    for (const c of capacitaciones) {
      const pMeta = pendingMetaMap.get(c.id.toString()) || null;
      const esPedidoViejo =
        c.estado === "PENDIENTE_APROBACION" && pMeta?.previousEstado === "PUBLICADO" && !pMeta?.snapshotPublico;
      if (c.estado === "PUBLICADO" || c.estado === "APROBADO" || esPedidoViejo) {
        // Los pedidos de archivado anteriores al módulo común no guardaron la versión pública: su contenido
        // no cambió, así que se sigue mostrando el registro actual.
        resultado.push(formatearCapacitacion(c, null, null));
      } else if (conservaVersionPublica(c, pMeta)) {
        // Edición en revisión o rechazada: el portal sigue mostrando la versión publicada anterior.
        const snap = pMeta.snapshotPublico;
        resultado.push(
          formatearCapacitacion(
            {
              ...c,
              ...snap,
              estado: "PUBLICADO",
              fechaInicio: snap.fechaInicio ? new Date(snap.fechaInicio) : null,
              fechaFin: snap.fechaFin ? new Date(snap.fechaFin) : null,
            },
            null,
            null
          )
        );
      }
    }
    return resultado;
  }

  async crearCapacitacion(data, files, user = null) {
    if (!data.titulo || !data.titulo.trim()) {
      const error = new Error("El título de la capacitación es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const { banner: bannerFile, material: materialFile } = separarArchivos(files);

    let imagenId = null;
    const bannerEntrante = data.bannerUrl !== undefined ? data.bannerUrl : data.imagenUrl;
    let bannerUrl = bannerEntrante !== undefined ? normalizarUrlOpcional(bannerEntrante, "URL de banner") : "";
    let bannerNombre = data.bannerNombre || "";
    if (bannerFile) ({ imagenId, bannerUrl, bannerNombre } = await subirBanner(bannerFile));

    let archivoTipo = data.archivoTipo || "";
    let videoUrl = normalizarUrlOpcional(data.videoUrl, "URL de video");
    let archivoUrl = normalizarUrlOpcional(data.archivoUrl, "URL de archivo");
    const enlaceUrl = normalizarUrlOpcional(data.enlaceUrl, "URL de enlace") || null;
    let archivoNombre = data.archivoNombre || "";
    let archivoTamano = data.archivoTamano || "";

    if (materialFile) {
      const clasificacion = clasificarMaterial(materialFile);
      archivoTipo = clasificacion.tipo ?? archivoTipo;
      ({ archivoUrl, archivoNombre, archivoTamano } = await subirMaterial(materialFile, clasificacion, archivoTipo));
      if (clasificacion.esVideo) videoUrl = archivoUrl;
    }

    // Regla común (utils/flujoEditorial.utils.js). Sin estado, el CMS pide publicar.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(data.estado || "PUBLICADO"),
    });

    const videoFinal = videoFinalDe(videoUrl, archivoTipo, archivoUrl);
    const contenido = armarContenidoNuevo({
      data,
      archivoTipo,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: videoFinal,
      bannerUrl,
      bannerNombre,
    });

    const nueva = await prisma.capacitacion.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        contenido: JSON.stringify(contenido),
        imagenId,
        videoUrl: videoFinal,
        enlaceUrl,
        fechaInicio: parsearFecha(data.fechaInicio),
        fechaFin: parsearFecha(data.fechaFin),
        estado: solicitud.estado,
        activo: data.activo !== undefined ? esVerdadero(data.activo) : true,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    let pendingMeta = null;
    if (solicitud.meta) {
      pendingMeta = {
        ...solicitud.meta,
        editor: this._nombreEditor(user),
        updatedAt: new Date().toISOString(),
      };
      await this.guardarPendingMeta(nueva.id.toString(), pendingMeta);
    }

    await registrarAuditoria(user, { entidad: "capacitacion", id: nueva.id, accion: ACCIONES.CREAR, descripcion: `Creó la capacitación "${nueva.titulo}".` });
    return {
      message: solicitud.meta
        ? "Capacitación enviada a revisión del administrador para su aprobación."
        : "Capacitación creada con éxito.",
      capacitacion: formatearCapacitacion(nueva, null, pendingMeta),
    };
  }

  async actualizarCapacitacion(id, data, files, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de capacitación");
    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("La capacitación solicitada no existe.");
      error.statusCode = 404;
      throw error;
    }

    const extra = leerContenido(existing.contenido);
    const { banner: bannerFile, material: materialFile } = separarArchivos(files);

    // Banner
    let imagenId = existing.imagenId;
    let bannerUrl = sanitizarUrlLectura(extra.bannerUrl || extra.imagenUrl || "", "");
    if (data.bannerUrl !== undefined) {
      bannerUrl = normalizarUrlOpcional(data.bannerUrl, "URL de banner");
    }
    let bannerNombre = extra.bannerNombre || existing.archivo?.nombreOriginal || "";
    if (esVerdadero(data.eliminarBanner)) {
      imagenId = null;
      bannerUrl = "";
      bannerNombre = "";
    }
    if (bannerFile) ({ imagenId, bannerUrl, bannerNombre } = await subirBanner(bannerFile));

    // Material y video
    let archivoTipo = data.archivoTipo !== undefined ? data.archivoTipo : extra.archivoTipo || "";
    let archivoUrl =
      data.archivoUrl !== undefined
        ? normalizarUrlOpcional(data.archivoUrl, "URL de archivo")
        : sanitizarUrlLectura(extra.archivoUrl || "", "");
    let archivoNombre = data.archivoNombre !== undefined ? data.archivoNombre : extra.archivoNombre || "";
    let archivoTamano = data.archivoTamano !== undefined ? data.archivoTamano : extra.archivoTamano || "";
    if (esVerdadero(data.eliminarArchivo)) {
      archivoTipo = "";
      archivoUrl = "";
      archivoNombre = "";
      archivoTamano = "";
    }

    const videoExistente =
      existing.videoUrl && !existing.videoUrl.startsWith("blob:") ? sanitizarUrlLectura(existing.videoUrl, "") : "";
    let videoUrl = data.videoUrl !== undefined ? normalizarUrlOpcional(data.videoUrl, "URL de video") : videoExistente;
    const enlaceUrl =
      data.enlaceUrl !== undefined
        ? normalizarUrlOpcional(data.enlaceUrl, "URL de enlace") || null
        : sanitizarUrlLectura(existing.enlaceUrl, null) || null;

    if (materialFile) {
      const clasificacion = clasificarMaterial(materialFile);
      if (clasificacion.tipo) archivoTipo = clasificacion.tipo;
      // Un documento o una imagen como material reemplaza al video.
      if (archivoTipo === "documento" || archivoTipo === "imagen") videoUrl = "";
      ({ archivoUrl, archivoNombre, archivoTamano } = await subirMaterial(materialFile, clasificacion, archivoTipo));
      if (clasificacion.esVideo) videoUrl = archivoUrl;
    } else if (archivoTipo === "documento" || archivoTipo === "imagen") {
      videoUrl = "";
    }

    const fechaInicio = fechaEditada(data.fechaInicio, existing.fechaInicio);
    const fechaFin = fechaEditada(data.fechaFin, existing.fechaFin);

    const videoFinal = videoFinalDe(videoUrl, archivoTipo, archivoUrl);
    const contenido = armarContenidoEditado({
      data,
      extra,
      archivoTipo,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: videoFinal,
      bannerUrl,
      bannerNombre,
    });

    const idStr = id.toString();
    const estadoAnterior = (existing.estado || "").toUpperCase();
    const metaExistente = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    // Es o fue público (también una edición rechazada de algo publicado).
    const provieneDePublicada = fuePublico(estadoAnterior, metaExistente);

    // Validación: verificar si hubo cambios reales antes de actualizar la capacitación
    const cambiosCap = cambiosDeCapacitacion(existing, extra, {
      titulo: data.titulo !== undefined ? data.titulo.trim() : existing.titulo || "",
      descripcion:
        data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : "") : existing.descripcion || "",
      contenido,
      fechaInicio,
      fechaFin,
      videoUrl: videoFinal,
      enlaceUrl,
    });

    const bannerModificado = Boolean(bannerFile || esVerdadero(data.eliminarBanner));
    const archivoModificado = Boolean(materialFile || esVerdadero(data.eliminarArchivo));
    const estadoModificado = Boolean(data.estado && data.estado.toUpperCase() !== estadoAnterior);

    if (cambiosCap.length === 0 && !bannerModificado && !archivoModificado && !estadoModificado) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público pasa por el administrador
    // (incluido despublicarlo o archivarlo) y el portal sigue mostrando la versión publicada mientras tanto.
    // Sin estado: lo archivado o en borrador se mantiene y el resto pide publicar.
    const estadoPedido = data.estado
      ? data.estado
      : ["ARCHIVADO", "BORRADOR"].includes(estadoAnterior)
      ? estadoAnterior
      : "PUBLICADO";
    const solicitud = resolverSolicitud({
      estadoActual: estadoAnterior,
      meta: metaExistente,
      intencion: intencionDesdeEstado(estadoPedido),
      snapshotActual: () => this._armarSnapshotPublico(existing),
      hayCambios: cambiosCap.length > 0 || bannerModificado || archivoModificado,
    });
    const estadoNormalizado = solicitud.estado;
    const targetEstado = solicitud.meta?.targetEstado || null;
    const activoFinal =
      estadoNormalizado === "ARCHIVADO"
        ? false
        : data.activo !== undefined
        ? esVerdadero(data.activo)
        : existing.activo;

    if (solicitud.sinCambios) {
      // Pidió el mismo estado que ya tiene, sin tocar el contenido: no se genera una revisión.
    } else if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: this._nombreEditor(user),
        updatedAt: new Date().toISOString(),
        cambios: combinarCambios(metaExistente?.cambios || [], cambiosCap),
        esActualizacion: provieneDePublicada || Boolean(metaExistente?.esActualizacion),
      });
    } else {
      await this.limpiarPendingMeta(idStr);
    }
    if (solicitud.limpiarMotivo) {
      await this.limpiarMotivoRechazo(idStr);
    }

    const updated = await prisma.capacitacion.update({
      where: { id: idBigInt },
      data: {
        titulo: data.titulo ? data.titulo.trim() : existing.titulo,
        descripcion: data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : null) : existing.descripcion,
        contenido: JSON.stringify(contenido),
        imagenId,
        videoUrl: videoFinal,
        enlaceUrl,
        fechaInicio,
        fechaFin,
        estado: estadoNormalizado,
        activo: activoFinal,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    await registrarAuditoria(user, { entidad: "capacitacion", id: updated.id, accion: ACCIONES.MODIFICAR, descripcion: `Modificó la capacitación "${updated.titulo}".` });
    return {
      message:
        estadoNormalizado === "PENDIENTE_APROBACION" && targetEstado === "ARCHIVADO"
          ? "Solicitud de archivado enviada a revisión del administrador."
          : estadoNormalizado === "PENDIENTE_APROBACION" && targetEstado === "BORRADOR"
          ? "Solicitud para retirar la capacitación del portal enviada a revisión del administrador."
          : estadoNormalizado === "PENDIENTE_APROBACION"
          ? "Modificaciones enviadas a revisión del administrador."
          : "Capacitación actualizada con éxito.",
      capacitacion: formatearCapacitacion(updated, motivoActual, pendingMetaActual),
    };
  }

  /**
   * Revisión del administrador (PATCH /capacitaciones/:id/revision).
   * Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido (publicar,
   * despublicar o archivar); rechazar exige motivo y conserva la versión publicada si la había.
   * @param decision "APROBAR" | "RECHAZAR"
   */
  async revisar(id, { decision, motivo = null } = {}, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de capacitación");
    const idStr = id.toString();

    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("Capacitación no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const metaExistente = (await this.obtenerMapaPendingMeta()).get(idStr) || null;

    const revision = resolverRevision({
      estadoActual: existing.estado,
      meta: metaExistente,
      decision: decisionDesdeEstado(decision),
      motivo,
    });
    const finalEstado = revision.estado;
    const finalActivo = revision.activo !== undefined ? revision.activo : existing.activo;

    if (finalEstado === "RECHAZADO") {
      await this.guardarMotivoRechazo(idStr, revision.motivo);
      // Si era una edición de algo ya publicado se conservan los metadatos (y la versión pública anterior).
      if (revision.meta === null) await this.limpiarPendingMeta(idStr);
    } else {
      // Aprobada la edición, los archivos de la versión pública anterior que ya no se usan se borran.
      if (metaExistente?.snapshotPublico) {
        await eliminarArchivosReemplazados({
          anteriores: archivosDeCapacitacion(metaExistente.snapshotPublico),
          vigentes: archivosDeCapacitacion(existing),
        });
      }
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }

    const updated = await prisma.capacitacion.update({
      where: { id: idBigInt },
      data: {
        estado: finalEstado,
        activo: finalActivo,
        updatedAt: new Date(),
      },
      include: { archivo: true },
    });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    await registrarAuditoria(user, {
      entidad: "capacitacion",
      id: idStr,
      accion: finalEstado === "RECHAZADO" ? ACCIONES.RECHAZAR : ACCIONES.APROBAR,
      descripcion: `Capacitación "${updated.titulo}": estado ${finalEstado}.`,
    });
    return {
      message: finalEstado === "RECHAZADO" ? "Capacitación rechazada." : `Estado actualizado a ${finalEstado}.`,
      capacitacion: formatearCapacitacion(updated, motivoActual, pendingMetaActual),
    };
  }

  async eliminarCapacitacion(id, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de capacitación");
    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("Capacitación no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(id.toString()) || null;
    if (!forzar && tieneVersionPublica(existing, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(existing, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.capacitacion.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(id.toString(), MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "capacitacion", id: id.toString(), titulo: existing.titulo, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("capacitacion", id.toString());

    if (existing.archivo?.nombreArchivo) {
      try {
        const bucket = existing.archivo.ruta?.startsWith(BUCKET_DOCUMENTOS) ? BUCKET_DOCUMENTOS : BUCKET_MEDIOS;
        await supabase.storage.from(bucket).remove([existing.archivo.nombreArchivo]);
      } catch (err) {
        console.warn("Aviso al remover archivo en Supabase:", err.message);
      }
    }

    await prisma.capacitacion.delete({
      where: { id: idBigInt },
    });

    if (existing.imagenId) {
      try {
        await prisma.archivo.delete({ where: { id: existing.imagenId } });
      } catch (error) {
        registrarFalla("Archivos", error);
      }
    }

    await registrarAuditoria(user, { entidad: "capacitacion", id, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó la capacitación "${existing.titulo}".` });
    return {
      message: "Capacitación eliminada con éxito.",
      id: id.toString(),
    };
  }

}

export default new CmsCapacitacionService();
