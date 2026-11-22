import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { tieneVersionPublica, conservaVersionPublica, tieneEdicionPendiente, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { parsearIdBigInt, esVerdadero } from "../../utils/sanitize.utils.js";
import { parsearFecha } from "../../utils/fechas.utils.js";
import { combinarCambios } from "../../utils/cambios.utils.js";
import { resolverNombreEditor, resolverEditorVisible } from "../../utils/editor.utils.js";
import { limitePublicacionProgramada } from "../../utils/programacion.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { eliminarArchivosReemplazados } from "../../utils/archivos.utils.js";
import { formatearResidencia } from "./residencias/formato.js";
import {
  separarArchivos,
  subirBanner,
  subirDocumento,
  archivosPublicos,
  quitarBannerAnterior,
  quitarDocumentoAnterior,
  archivosDeResidencia,
} from "./residencias/archivos.js";
import {
  leerContenido,
  tieneFechaProgramada,
  armarContenidoNuevo,
  armarContenidoEditado,
  fechaConvocatoriaEditada,
} from "./residencias/datos.js";
import { cambiosDeResidencia } from "./residencias/cambios.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado, fuePublico } from "../../utils/flujoEditorial.utils.js";

const metaEditorial = crearMetaEditorial({ entidad: "residencia", modelos: { "": "residencia" } });

class CmsResidenciaService {
  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  guardarMotivoRechazo(id, motivo) { return metaEditorial.guardarMotivoRechazo(id, motivo); }
  limpiarMotivoRechazo(id) { return metaEditorial.limpiarMotivoRechazo(id); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  guardarPendingMeta(id, meta) { return metaEditorial.guardarPendingMeta(id, meta); }
  limpiarPendingMeta(id) { return metaEditorial.limpiarPendingMeta(id); }
  obtenerMapaEditorMeta() { return metaEditorial.obtenerMapaEditorMeta(); }
  guardarEditorMeta(id, meta) { return metaEditorial.guardarEditorMeta(id, meta); }
  limpiarEditorMeta(id) { return metaEditorial.limpiarEditorMeta(id); }

  async obtenerResidencias(esVistaAdmin = false) {
    const [residencias, motivosMap, pendingMetaMap, editorMetaMap, auditorias] = await Promise.all([
      prisma.residencia.findMany({
        where: esVistaAdmin === true ? {} : { estado: { in: ["PUBLICADO", "PENDIENTE_APROBACION", "RECHAZADO"] } },
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
      this.obtenerMapaEditorMeta(),
      prisma.auditoria.findMany({
        where: { entidad: "residencia" },
        include: { usuario: true },
        orderBy: { fechaHora: "desc" },
      }).catch(() => []),
    ]);

    const auditMap = new Map();
    for (const aud of auditorias) {
      if (!auditMap.has(aud.entidadId)) {
        auditMap.set(aud.entidadId, aud);
      }
    }

    const resultado = [];
    for (const res of residencias) {
      const idStr = res.id.toString();
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      const editorMeta = editorMetaMap.get(idStr) || null;
      const motivoRechazo = motivosMap.get(idStr) || null;
      const auditItem = auditMap.get(idStr) || null;
      const estadoUpper = (res.estado || "").toUpperCase();

      const { editor: resolvedEditor, updatedAt: resolvedUpdatedAt } = resolverEditorVisible({
        pendingMeta,
        editorMeta,
        auditoria: auditItem,
      });

      if (!esVistaAdmin) {
        const esPublicadaDirecta = (estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO") && res.activo !== false;
        const mantienePublicacionPrevia = conservaVersionPublica(res, pendingMeta);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          continue;
        }

        if (mantienePublicacionPrevia) {
          const snap = pendingMeta.snapshotPublico;
          resultado.push(
            formatearResidencia(
              {
                ...res,
                ...snap,
                // La versión guardada vuelve de la base con las fechas como texto.
                fechaConvocatoria: snap.fechaConvocatoria ? new Date(snap.fechaConvocatoria) : null,
              },
              null,
              null,
              resolvedEditor,
              resolvedUpdatedAt
            )
          );
          continue;
        }
      }

      resultado.push(
        formatearResidencia(res, motivoRechazo, pendingMeta, resolvedEditor, resolvedUpdatedAt)
      );
    }

    return resultado;
  }

  async crearResidencia(data, files, user = null) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error("El nombre de la residencia es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const editorNombre = await resolverNombreEditor(user, data.editor);
    const nowIso = new Date().toISOString();
    const { banner: bannerFile, documento: docFile } = separarArchivos(files);

    const imagenId = bannerFile ? await subirBanner(bannerFile) : null;
    const documento = docFile ? await subirDocumento(docFile) : null;

    // Regla común (utils/flujoEditorial.utils.js). Sin estado, el CMS pide publicar.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(data.estado || "PUBLICADO", { tieneFecha: tieneFechaProgramada(data) }),
    });
    const estadoNormalizado = solicitud.estado;

    const nueva = await prisma.residencia.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        contenido: JSON.stringify(armarContenidoNuevo(data, documento)),
        imagenId,
        convocatoria: data.convocatoria ? data.convocatoria.trim() : "Convocatoria Abierta",
        fechaConvocatoria: parsearFecha(data.fechaConvocatoria),
        estado: estadoNormalizado,
        activo: data.activo !== undefined ? esVerdadero(data.activo) : true,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    const idStr = nueva.id.toString();

    // Guardar editor meta
    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    // Si entra como PENDIENTE_APROBACION, guardar pending meta
    let pendingMeta = null;
    if (solicitud.meta) {
      pendingMeta = {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
        cambios: null,
        esActualizacion: false,
      };
      await this.guardarPendingMeta(idStr, pendingMeta);
    }

    await registrarAuditoria(user, { entidad: "residencia", id: idStr, accion: ACCIONES.CREAR, descripcion: `Creación de residencia "${nueva.nombre}".` });

    return {
      message:
        estadoNormalizado === "PENDIENTE_APROBACION"
          ? "Residencia enviada a revisión del administrador para su aprobación."
          : "Residencia creada con éxito.",
      residencia: formatearResidencia(nueva, null, pendingMeta, editorNombre, nowIso),
    };
  }

  async actualizarResidencia(id, data, files, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");
    const idStr = idBigInt.toString();

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const editorNombre = await resolverNombreEditor(user, data.editor);
    const nowIso = new Date().toISOString();

    const estadoAnterior = (residenciaExistente.estado || "").toUpperCase();
    const pendingMap = await this.obtenerMapaPendingMeta();
    const metaExistente = pendingMap.get(idStr) || null;
    // Es o fue público (también una edición rechazada de algo publicado o programado).
    const provieneDePublicada = fuePublico(estadoAnterior, metaExistente);

    // El banner y el documento de la versión pública no se borran del almacenamiento mientras el portal
    // la siga mostrando (ver archivosPublicos).
    const { esBannerPublico, esDocumentoPublico } = archivosPublicos({
      provieneDePublicada,
      snapshotPublico: metaExistente?.snapshotPublico || null,
      residencia: residenciaExistente,
    });
    const { banner: bannerFile, documento: docFile } = separarArchivos(files);

    let imagenId = residenciaExistente.imagenId;
    if (esVerdadero(data.eliminarBanner)) {
      await quitarBannerAnterior(residenciaExistente.archivo, esBannerPublico);
      imagenId = null;
    }
    if (bannerFile) {
      await quitarBannerAnterior(residenciaExistente.archivo, esBannerPublico);
      imagenId = await subirBanner(bannerFile);
    }

    const contenidoPrevio = leerContenido(residenciaExistente.contenido);
    let documento = contenidoPrevio.documento || null;
    if (esVerdadero(data.eliminarDocumento)) {
      await quitarDocumentoAnterior(documento, esDocumentoPublico);
      documento = null;
    }
    if (docFile) {
      await quitarDocumentoAnterior(documento, esDocumentoPublico);
      documento = await subirDocumento(docFile);
    }

    const contenido = armarContenidoEditado(data, contenidoPrevio, documento);
    const fechaConvocatoria = fechaConvocatoriaEditada(data.fechaConvocatoria, residenciaExistente.fechaConvocatoria);

    const todosCambios = cambiosDeResidencia(residenciaExistente, contenidoPrevio, data, { banner: bannerFile, documento: docFile });
    const estadoCambio = Boolean(data.estado && data.estado.toUpperCase() !== estadoAnterior);
    const bannerModificado = Boolean(bannerFile || esVerdadero(data.eliminarBanner));
    const docModificado = Boolean(docFile || esVerdadero(data.eliminarDocumento));
    const fechaPubAnterior = contenidoPrevio.fechaPublicacion || null;
    const fechaPubNueva = data.fechaPublicacion !== undefined ? data.fechaPublicacion || null : fechaPubAnterior;
    const fechaPubCambio = fechaPubAnterior !== fechaPubNueva;

    if (todosCambios.length === 0 && !estadoCambio && !bannerModificado && !docModificado && !fechaPubCambio) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público pasa por el administrador
    // (incluido despublicarlo o archivarlo) y el portal sigue mostrando la versión publicada mientras tanto.
    // Sin estado: lo archivado o en borrador se mantiene, lo programado sigue programado y el resto pide publicar.
    const estadoPedido = data.estado
      ? data.estado
      : ["ARCHIVADO", "BORRADOR", "PROGRAMADO"].includes(estadoAnterior)
      ? estadoAnterior
      : "PUBLICADO";
    const solicitud = resolverSolicitud({
      estadoActual: estadoAnterior,
      meta: metaExistente,
      intencion: intencionDesdeEstado(estadoPedido, { tieneFecha: Boolean(contenido.fechaPublicacion) }),
      snapshotActual: () => ({
        nombre: residenciaExistente.nombre,
        descripcion: residenciaExistente.descripcion,
        contenido: residenciaExistente.contenido,
        imagenId: residenciaExistente.imagenId,
        convocatoria: residenciaExistente.convocatoria,
        fechaConvocatoria: residenciaExistente.fechaConvocatoria,
        archivo: residenciaExistente.archivo,
      }),
      hayCambios: todosCambios.length > 0 || bannerModificado || docModificado || fechaPubCambio,
    });
    const estadoNormalizado = solicitud.estado;
    const targetEstado = solicitud.meta?.targetEstado || null;
    const activoFinal =
      estadoNormalizado === "ARCHIVADO"
        ? false
        : data.activo !== undefined
        ? esVerdadero(data.activo)
        : residenciaExistente.activo;

    if (solicitud.sinCambios) {
      // Pidió el mismo estado que ya tiene, sin tocar el contenido: no se genera una revisión.
    } else if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
        cambios: combinarCambios(metaExistente?.cambios || [], todosCambios),
        esActualizacion: provieneDePublicada || Boolean(metaExistente?.esActualizacion),
      });
    } else {
      await this.limpiarPendingMeta(idStr);
    }
    if (solicitud.limpiarMotivo) {
      await this.limpiarMotivoRechazo(idStr);
    }

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    const actualizada = await prisma.residencia.update({
      where: { id: idBigInt },
      data: {
        nombre: data.nombre !== undefined ? data.nombre.trim() : residenciaExistente.nombre,
        descripcion: data.descripcion !== undefined ? data.descripcion : residenciaExistente.descripcion,
        contenido: JSON.stringify(contenido),
        imagenId,
        convocatoria: data.convocatoria !== undefined ? (data.convocatoria ? data.convocatoria.trim() : null) : residenciaExistente.convocatoria,
        fechaConvocatoria,
        estado: estadoNormalizado,
        activo: activoFinal,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    await registrarAuditoria(user, { entidad: "residencia", id: idStr, accion: ACCIONES.MODIFICAR, descripcion: `Actualización de residencia "${actualizada.nombre}".` });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    let mensaje = "Residencia actualizada con éxito.";
    if (targetEstado === "ARCHIVADO" && estadoNormalizado === "PENDIENTE_APROBACION") {
      mensaje = "Solicitud de archivado enviada a revisión del administrador.";
    } else if (targetEstado === "BORRADOR" && estadoNormalizado === "PENDIENTE_APROBACION") {
      mensaje = "Solicitud para retirar la residencia del portal enviada a revisión del administrador.";
    } else if (estadoNormalizado === "PENDIENTE_APROBACION" && provieneDePublicada) {
      mensaje = "Modificaciones enviadas a revisión del administrador.";
    }

    await limpiarSolicitudEliminacion("residencia", idStr); // editar después de pedir la baja anula el pedido
    return {
      message: mensaje,
      residencia: formatearResidencia(actualizada, motivoActual, pendingMetaActual, editorNombre, nowIso),
    };
  }

  /**
   * Revisión del administrador (PATCH /residencias/:id/revision).
   * Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido (publicar,
   * programar, despublicar o archivar); rechazar exige motivo y conserva la versión publicada si la había.
   * @param decision "APROBAR" | "RECHAZAR"
   */
  async revisar(id, { decision, motivo = null } = {}, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");
    const idStr = id.toString();

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const metaExistente = (await this.obtenerMapaPendingMeta()).get(idStr) || null;

    let contenidoParsed = {};
    if (residenciaExistente.contenido) {
      try {
        contenidoParsed = JSON.parse(residenciaExistente.contenido);
      } catch {
        // JSON inválido: se ignora y se usa el valor por defecto.
      }
    }

    const revision = resolverRevision({
      estadoActual: residenciaExistente.estado,
      meta: metaExistente,
      decision: decisionDesdeEstado(decision),
      motivo,
      fechaProgramada: metaExistente?.targetEstado === "PROGRAMADO" ? contenidoParsed.fechaPublicacion || null : null,
    });
    const finalEstado = revision.estado;
    const motivoGuardado = revision.motivo;
    const finalActivo = revision.activo !== undefined ? revision.activo : residenciaExistente.activo;

    if (finalEstado === "RECHAZADO") {
      await this.guardarMotivoRechazo(idStr, motivoGuardado);
      // Si era una edición de algo ya publicado se conservan los metadatos (y la versión pública anterior).
      if (revision.meta === null) await this.limpiarPendingMeta(idStr);
    } else {
      if (metaExistente?.editor && metaExistente.editor !== "Editor CMS") {
        await this.guardarEditorMeta(idStr, {
          editor: metaExistente.editor,
          updatedAt: metaExistente.updatedAt || new Date().toISOString(),
        });
      }
      // Aprobada la edición, los archivos de la versión pública anterior que ya no se usan se borran.
      if (metaExistente?.snapshotPublico) {
        await eliminarArchivosReemplazados({
          anteriores: archivosDeResidencia(metaExistente.snapshotPublico),
          vigentes: archivosDeResidencia(residenciaExistente),
        });
      }
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }

    const residenciaActualizada = await prisma.residencia.update({
      where: { id: idBigInt },
      data: {
        estado: finalEstado,
        activo: finalActivo,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    await registrarAuditoria(user, {
      entidad: "residencia",
      id: idStr,
      accion: finalEstado === "RECHAZADO" ? ACCIONES.RECHAZAR : finalEstado === "ARCHIVADO" ? ACCIONES.ARCHIVAR : ACCIONES.APROBAR,
      descripcion:
        finalEstado === "RECHAZADO"
          ? `Residencia "${residenciaExistente.nombre}" rechazada. Motivo: ${motivoGuardado}`
          : `Residencia "${residenciaExistente.nombre}" evaluada como ${finalEstado}.`,
    });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    return {
      message: finalEstado === "RECHAZADO" ? "Residencia rechazada." : `Estado actualizado a ${finalEstado} con éxito.`,
      residencia: formatearResidencia(residenciaActualizada, motivoActual, pendingMetaActual),
    };
  }

  async eliminarResidencia(id, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");

    const residencia = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residencia) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(id.toString()) || null;
    if (!forzar && tieneVersionPublica(residencia, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(residencia, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.residencia.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(id.toString(), MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "residencia", id: id.toString(), titulo: residencia.nombre, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("residencia", id.toString());

    if (residencia.archivo) {
      try {
        await supabase.storage
          .from("noticias-imagenes")
          .remove([residencia.archivo.nombreArchivo]);
      } catch (e) {
        console.warn("No se pudo eliminar banner de storage:", e.message);
      }
    }

    if (residencia.contenido) {
      try {
        const parsed = JSON.parse(residencia.contenido);
        if (parsed.documento?.documentoArchivoNombre) {
          await supabase.storage
            .from("documentos")
            .remove([parsed.documento.documentoArchivoNombre]);
        }
        if (parsed.documento?.documentoId) {
          await prisma.archivo.delete({
            where: { id: parsearIdBigInt(parsed.documento.documentoId, "ID de documento") },
          }).catch(() => {});
        }
      } catch {
        // JSON inválido: se ignora y se usa el valor por defecto.
      }
    }

    await prisma.residencia.delete({
      where: { id: idBigInt },
    });

    if (residencia.imagenId) {
      try {
        await prisma.archivo.delete({
          where: { id: residencia.imagenId },
        });
      } catch (e) {
        console.warn("No se pudo eliminar el registro de archivo del banner:", e.message);
      }
    }

    await registrarAuditoria(user, { entidad: "residencia", id, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó la residencia "${residencia.nombre}".` });
    return {
      message: "Residencia eliminada correctamente.",
      id: id.toString(),
    };
  }

  // Lo ejecuta el cron de server.js cada minuto. Los errores se propagan para que el cron los informe.
  async publicarResidenciasProgramadas() {
    const limite = limitePublicacionProgramada();
    const programadas = await prisma.residencia.findMany({
      where: { estado: "PROGRAMADO" },
    });

    for (const res of programadas) {
      let fechaPub = null;
      if (res.contenido) {
        try {
          const parsed = JSON.parse(res.contenido);
          if (parsed.fechaPublicacion) {
            fechaPub = new Date(parsed.fechaPublicacion);
          }
        } catch {
          // JSON inválido: se ignora y se usa el valor por defecto.
        }
      }

      if (fechaPub && fechaPub <= limite) {
        // updateMany con estado en el filtro: si alguien la cambió desde la lectura de arriba
        // (por ejemplo, la archivó), no se publica.
        await prisma.residencia.updateMany({
          where: { id: res.id, estado: "PROGRAMADO" },
          data: {
            estado: "PUBLICADO",
            activo: true,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

}

export default new CmsResidenciaService();
