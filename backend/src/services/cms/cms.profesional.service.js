import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { tieneVersionPublica, conservaVersionPublica, estaVisibleEnPortal, tieneEdicionPendiente, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { parsearIdBigInt, esVerdadero } from "../../utils/sanitize.utils.js";
import { nombreDeUsuario } from "../../utils/user.utils.js";
import { resolverNombreEditor } from "../../utils/editor.utils.js";
import { combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { eliminarArchivosReemplazados, refDeArchivo, refDesdeUrl } from "../../utils/archivos.utils.js";
import { estadoDe, construirItemProfesional, armarRespuestaGuardado, urlFoto } from "./profesionales/formato.js";
import { subirFoto, quitarFoto } from "./profesionales/foto.js";
import { resolverArea, asignarArea, quitarAreas } from "./profesionales/area.js";
import { cambiosDeProfesional, cambiosDeProfesionalConFoto } from "./profesionales/cambios.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado, fuePublico } from "../../utils/flujoEditorial.utils.js";

const metaEditorial = crearMetaEditorial({ entidad: "profesional", modelos: { "": "profesional" } });

class CmsProfesionalService {
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

  async obtenerProfesionales(esVistaAdmin = false) {
    const [profesionales, servicios, rejectionMap, pendingMap, editorMap, auditorias] =
      await Promise.all([
        prisma.profesional.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            especialidad: true,
            archivo: true,
            profesional_area: { include: { area: true } },
          },
        }),
        prisma.servicio.findMany(),
        this.obtenerMapaMotivosRechazo(),
        this.obtenerMapaPendingMeta(),
        this.obtenerMapaEditorMeta(),
        esVistaAdmin
          ? prisma.auditoria
              .findMany({
                where: {
                  entidad: "profesional",
                  accion: { in: ["CREAR", "ACTUALIZAR", "MODIFICAR"] }, // ACTUALIZAR: registros anteriores
                },
                include: { usuario: true },
                orderBy: { fechaHora: "desc" },
              })
              .catch(() => [])
          : Promise.resolve([]),
      ]);

    const auditoriaMap = new Map();
    if (esVistaAdmin && Array.isArray(auditorias)) {
      for (const aud of auditorias) {
        if (!aud.entidadId || auditoriaMap.has(aud.entidadId)) continue;
        let nombreUsuario = "Editor CMS";
        if (aud.usuario?.nombre) {
          nombreUsuario = nombreDeUsuario(aud.usuario);
        }
        auditoriaMap.set(aud.entidadId, {
          editor: nombreUsuario,
          updatedAt: aud.fechaHora,
        });
      }
    }

    const resultado = [];

    for (const prof of profesionales) {
      const idStr = prof.id.toString();
      const pendingMeta = pendingMap.get(idStr) || null;
      const rejectionReason = rejectionMap.get(idStr) || null;
      const editorMeta = editorMap.get(idStr) || auditoriaMap.get(idStr) || null;

      const estado = estadoDe(prof);

      if (!esVistaAdmin) {
        if (estado === "PUBLICADO") {
          resultado.push(
            construirItemProfesional(prof, servicios, {
              estado: "PUBLICADO",
              editor: editorMeta?.editor,
              updatedAt: editorMeta?.updatedAt || prof.updatedAt,
            })
          );
        } else if (conservaVersionPublica(prof, pendingMeta)) {
          // Edición en revisión o rechazada: el portal sigue mostrando la versión publicada anterior.
          resultado.push({
            ...pendingMeta.snapshotPublico,
            id: idStr,
            estado: "PUBLICADO",
            publicado: true,
            activo: true,
          });
        }
        continue;
      }

      resultado.push(
        construirItemProfesional(prof, servicios, {
          estado,
          visibleEnPortal: estaVisibleEnPortal(prof, pendingMeta),
          tituloPublicado: conservaVersionPublica(prof, pendingMeta)
            ? `${pendingMeta.snapshotPublico?.nombre || ""} ${pendingMeta.snapshotPublico?.apellido || ""}`.trim() || null
            : null,
          // Lo que ve hoy el portal, para poder mostrar la versión publicada mientras la actualización está en revisión.
          versionPublicada: conservaVersionPublica(prof, pendingMeta)
            ? { ...pendingMeta.snapshotPublico, id: idStr, estado: "PUBLICADO", publicado: true, activo: true }
            : null,
          rejectionReason,
          editor: pendingMeta?.editor || editorMeta?.editor || "Editor CMS",
          updatedAt: pendingMeta?.updatedAt || editorMeta?.updatedAt || prof.updatedAt,
          // Los cambios se ven mientras la edición esté en revisión y también si el Admin la rechazó.
          cambios: estado === "PENDIENTE_APROBACION" || conservaVersionPublica(prof, pendingMeta) ? cambiosParaCliente(pendingMeta?.cambios) : [],
          esActualizacion: (estado === "PENDIENTE_APROBACION" || conservaVersionPublica(prof, pendingMeta)) && Boolean(pendingMeta?.esActualizacion),
          requestedEstado: estado === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
        })
      );
    }

    // El portal público no necesita saber quién editó cada registro: no se envían nombres del equipo.
    if (!esVistaAdmin) {
      return resultado.map(({ editor, editedBy, ...publico }) => publico);
    }
    return resultado;
  }

  async crearProfesional(data, file, user = null) {
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId } = data;
    const esServicio = esVerdadero(data.esServicio);

    if (!nombre || !apellido || !especialidadId) {
      const error = new Error("Nombre, apellido y área asignada son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    const { especialidadId: finalEspecialidadId, areaNombre } = await resolverArea(especialidadId, esServicio);
    // Solo un servicio clave guarda su nombre como "área" (la especialidad ya queda en especialidadId).
    const areaAGuardar = esServicio ? areaNombre : null;

    const imagenId = file ? await subirFoto(file) : null;

    // Regla común (utils/flujoEditorial.utils.js). Sin estado, el CMS de profesionales pide publicar.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(data.estado || "PUBLICADO"),
    });
    const estadoFinal = solicitud.estado;

    const nuevoProfesional = await prisma.profesional.create({
      data: {
        nombre,
        apellido,
        matricula,
        cargo,
        descripcion,
        especialidadId: finalEspecialidadId,
        imagenId,
        activo: false,
        estado: estadoFinal,
        updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true },
    });

    await asignarArea(nuevoProfesional.id, areaAGuardar);

    const idStr = nuevoProfesional.id.toString();
    const nowIso = new Date().toISOString();
    const editorNombre = await resolverNombreEditor(user, data.editor || data.editorNombre);

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
      });
    }

    await registrarAuditoria(user, { entidad: "profesional", id: idStr, accion: ACCIONES.CREAR, descripcion: `Creación de profesional "${nombre} ${apellido}".` });

    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Profesional enviado a revisión del administrador para su aprobación."
          : estadoFinal === "BORRADOR"
          ? "¡Profesional guardado como borrador!"
          : "¡Profesional guardado como archivado!",
      profesional: armarRespuestaGuardado({
        prof: nuevoProfesional,
        areaNombre: areaAGuardar,
        esServicio,
        especialidadId,
        estado: estadoFinal,
        activo: false,
        editor: editorNombre,
        nowIso,
      }),
    };
  }

  async actualizarProfesional(id, data, file, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de profesional");
    const idStr = idBigInt.toString();
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId } = data;
    const esServicio = esVerdadero(data.esServicio);
    parsearIdBigInt(especialidadId, "ID de área o especialidad");

    const [profesionalExistente, servicios, pendingMap] = await Promise.all([
      prisma.profesional.findUnique({
        where: { id: idBigInt },
        include: {
          especialidad: true,
          archivo: true,
          profesional_area: { include: { area: true } },
        },
      }),
      prisma.servicio.findMany(),
      this.obtenerMapaPendingMeta(),
    ]);

    if (!profesionalExistente) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const existingPending = pendingMap.get(idStr) || null;
    // Es o fue público (también una edición rechazada de algo publicado): su foto se conserva.
    const provieneDePublicado = fuePublico(profesionalExistente.estado, existingPending);
    const armarSnapshotPublico = () =>
      construirItemProfesional(profesionalExistente, servicios, { estado: "PUBLICADO" });

    // El área que ya tenía (un servicio clave guarda su nombre en profesional_area) puede quedar aunque ya no esté publicada.
    const areaActual = {
      especialidadId: profesionalExistente.especialidadId,
      areaNombre: profesionalExistente.profesional_area?.[0]?.area?.nombre || null,
    };
    const { especialidadId: finalEspecialidadId, areaNombre: finalAreaNombre } = await resolverArea(especialidadId, esServicio, areaActual);

    // Validación: verificar si hubo cambios antes de procesar archivos o base de datos
    const versionAnteriorCheck = construirItemProfesional(profesionalExistente, servicios, {});
    const cambiosProf = cambiosDeProfesional(versionAnteriorCheck, {
      nombre: nombre !== undefined ? nombre.trim() : versionAnteriorCheck.nombre,
      apellido: apellido !== undefined ? apellido.trim() : versionAnteriorCheck.apellido,
      matricula: matricula !== undefined ? matricula.trim() : versionAnteriorCheck.matricula,
      cargo: cargo !== undefined ? cargo.trim() : versionAnteriorCheck.cargo,
      descripcion: descripcion !== undefined ? (descripcion || "").trim() : versionAnteriorCheck.descripcion,
      especialidadNombre: finalAreaNombre || versionAnteriorCheck.especialidadNombre,
      esServicioClave: esServicio,
    });
    const estadoCambioProf = Boolean(data.estado && data.estado.toUpperCase() !== (profesionalExistente.estado || "").toUpperCase());

    if (cambiosProf.length === 0 && !file && !estadoCambioProf) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público pasa por el administrador
    // (incluido despublicarlo o archivarlo) y el portal sigue mostrando la versión publicada mientras tanto.
    const solicitud = resolverSolicitud({
      estadoActual: profesionalExistente.estado,
      meta: existingPending,
      intencion: intencionDesdeEstado(data.estado || "PUBLICADO"),
      snapshotActual: armarSnapshotPublico,
      hayCambios: cambiosProf.length > 0 || Boolean(file),
    });
    const estadoFinal = solicitud.estado;

    let imagenId = profesionalExistente.imagenId;
    if (file) {
      if (profesionalExistente.archivo && !provieneDePublicado) {
        await quitarFoto(profesionalExistente.archivo);
      }
      imagenId = await subirFoto(file);
    }

    const profActualizado = await prisma.profesional.update({
      where: { id: idBigInt },
      data: {
        nombre,
        apellido,
        matricula,
        cargo,
        descripcion,
        especialidadId: finalEspecialidadId,
        imagenId,
        activo: solicitud.meta ? profesionalExistente.activo : false,
        estado: estadoFinal,
        updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true },
    });

    await quitarAreas(profActualizado.id);
    await asignarArea(profActualizado.id, finalAreaNombre);

    const nowIso = new Date().toISOString();
    const editorNombre = await resolverNombreEditor(user, data.editor || data.editorNombre);

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    if (!solicitud.meta) {
      await this.limpiarPendingMeta(idStr);
      if (solicitud.limpiarMotivo) await this.limpiarMotivoRechazo(idStr);
    } else if (!solicitud.sinCambios) {
      // Detección automática de cambios para la revisión del Admin
      const versionAnterior = construirItemProfesional(profesionalExistente, servicios, {});
      const nuevosCambios = cambiosDeProfesionalConFoto(versionAnterior, {
        nombre: profActualizado.nombre,
        apellido: profActualizado.apellido,
        matricula: profActualizado.matricula,
        cargo: profActualizado.cargo,
        descripcion: profActualizado.descripcion,
        especialidadNombre: finalAreaNombre || profActualizado.especialidad?.nombre,
        esServicioClave: esServicio,
        imagenUrl: profActualizado.archivo ? urlFoto(profActualizado.archivo) : versionAnterior.imagenUrl,
      });
      const cambiosPrevios = existingPending?.cambios || [];

      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      });
      await this.limpiarMotivoRechazo(idStr);
    }

    await registrarAuditoria(user, { entidad: "profesional", id: idStr, accion: ACCIONES.MODIFICAR, descripcion: `Actualización de profesional "${nombre} ${apellido}".` });

    await limpiarSolicitudEliminacion("profesional", idStr); // editar después de pedir la baja anula el pedido
    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Modificaciones enviadas a revisión del administrador."
          : estadoFinal === "BORRADOR"
          ? "¡Profesional guardado como borrador!"
          : "¡Profesional actualizado con éxito!",
      profesional: armarRespuestaGuardado({
        prof: profActualizado,
        areaNombre: finalAreaNombre,
        esServicio,
        especialidadId,
        estado: estadoFinal,
        activo: profActualizado.activo,
        editor: editorNombre,
        nowIso,
        // El portal sigue mostrando la versión publicada mientras la edición está en revisión.
        visibleEnPortal: estaVisibleEnPortal(profActualizado, (await this.obtenerMapaPendingMeta()).get(idStr) || null),
      }),
    };
  }

  async evaluarProfesional(id, payload = {}, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de profesional");
    const idStr = idBigInt.toString();
    const decision = decisionDesdeEstado(payload.estado);

    const [profesionalExistente, servicios, pendingMap, editorMap] = await Promise.all([
      prisma.profesional.findUnique({
        where: { id: idBigInt },
        include: {
          especialidad: true,
          archivo: true,
          profesional_area: { include: { area: true } },
        },
      }),
      prisma.servicio.findMany(),
      this.obtenerMapaPendingMeta(),
      this.obtenerMapaEditorMeta(),
    ]);

    if (!profesionalExistente) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const pendingMeta = pendingMap.get(idStr) || null;
    const editorMeta = editorMap.get(idStr) || null;
    const preservedEditor = pendingMeta?.editor || editorMeta?.editor || "Editor CMS";

    // Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido
    // (publicar, despublicar o archivar); rechazar exige motivo y conserva la versión publicada si la había.
    const revision = resolverRevision({
      estadoActual: profesionalExistente.estado,
      meta: pendingMeta,
      decision,
      motivo: payload.rejectionReason,
    });
    const rejectionReason = revision.motivo;

    if (revision.estado === "RECHAZADO") {
      // Si era una edición de algo ya publicado, se conserva la versión pública anterior (y sus metadatos)
      // para que el portal siga mostrándola; solo el contenido nuevo queda inactivo.
      const conservaPublica = revision.meta === "conservar";
      const profRechazado = await prisma.profesional.update({
        where: { id: idBigInt },
        data: conservaPublica
          ? { estado: "RECHAZADO", updatedAt: new Date() }
          : { activo: false, estado: "RECHAZADO", updatedAt: new Date() },
        include: {
          especialidad: true,
          archivo: true,
          profesional_area: { include: { area: true } },
        },
      });

      await this.guardarMotivoRechazo(idStr, rejectionReason);
      if (!conservaPublica) await this.limpiarPendingMeta(idStr);

      await registrarAuditoria(user, { entidad: "profesional", id: idStr, accion: ACCIONES.RECHAZAR, descripcion: `Rechazo de profesional "${profRechazado.nombre} ${profRechazado.apellido}". Motivo: ${rejectionReason}` });

      return {
        message: "Profesional rechazado.",
        data: construirItemProfesional(profRechazado, servicios, {
          estado: "RECHAZADO",
          rejectionReason,
          editor: preservedEditor,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    // Aprobado: PUBLICADO, BORRADOR (despublicar) o ARCHIVADO. Profesionales no tiene fecha de publicación.
    const estadoAprobado = revision.estado;
    const profAprobado = await prisma.profesional.update({
      where: { id: idBigInt },
      data: {
        activo: estadoAprobado === "PUBLICADO",
        estado: estadoAprobado,
        updatedAt: new Date(),
      },
      include: {
        especialidad: true,
        archivo: true,
        profesional_area: { include: { area: true } },
      },
    });

    // Aprobada la edición, la foto de la versión pública anterior que ya no se usa se borra.
    if (pendingMeta?.snapshotPublico) {
      await eliminarArchivosReemplazados({
        anteriores: [refDesdeUrl(pendingMeta.snapshotPublico.imagenUrl)],
        vigentes: [refDeArchivo(profAprobado.archivo)],
      });
    }

    await this.limpiarMotivoRechazo(idStr);
    await this.limpiarPendingMeta(idStr);
    await this.guardarEditorMeta(idStr, {
      editor: preservedEditor,
      updatedAt: pendingMeta?.updatedAt || new Date().toISOString(),
    });

    await registrarAuditoria(user, { entidad: "profesional", id: idStr, accion: ACCIONES.APROBAR, descripcion: `Aprobación de profesional "${profAprobado.nombre} ${profAprobado.apellido}" (estado resultante: ${estadoAprobado}).` });

    return {
      message:
        estadoAprobado === "PUBLICADO"
          ? "Profesional aprobado y publicado con éxito."
          : estadoAprobado === "BORRADOR"
          ? "Solicitud aprobada: el profesional se retiró del portal y quedó como borrador."
          : "Solicitud aprobada: el profesional se retiró del portal y quedó archivado.",
      data: construirItemProfesional(profAprobado, servicios, {
        rejectionReason: null,
        editor: preservedEditor,
        updatedAt: new Date().toISOString(),
      }),
    };
  }

  async eliminarProfesional(id, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de profesional");
    const idStr = idBigInt.toString();
    const profesional = await prisma.profesional.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!profesional) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    if (!forzar && tieneVersionPublica(profesional, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(profesional, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.profesional.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(idStr, MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "profesional", id: idStr, titulo: `${profesional.nombre} ${profesional.apellido}`.trim(), user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("profesional", idStr);

    if (profesional.archivo) {
      await supabase.storage
        .from("noticias-imagenes")
        .remove([profesional.archivo.nombreArchivo]);
      await prisma.archivo.delete({ where: { id: profesional.archivo.id } });
    }

    await prisma.profesional.delete({ where: { id: idBigInt } });
    await this.limpiarMotivoRechazo(idStr);
    await this.limpiarPendingMeta(idStr);
    await this.limpiarEditorMeta(idStr);

    await registrarAuditoria(user, { entidad: "profesional", id: idStr, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó al profesional "${`${profesional.nombre} ${profesional.apellido}`.trim()}".` });
    return { message: "¡Profesional eliminado con éxito!" };
  }
}

export default new CmsProfesionalService();