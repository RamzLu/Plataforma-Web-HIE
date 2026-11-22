import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { registrarFalla } from "../../utils/log.utils.js";
import { prisma } from "../../config/prisma.js";
import { tieneVersionPublica, conservaVersionPublica, tieneEdicionPendiente, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { nombreDeUsuario, obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado } from "../../utils/flujoEditorial.utils.js";

const metaEditorial = crearMetaEditorial({ entidad: "especialidad o servicio", modelos: { esp_: "especialidad", srv_: "servicio" } });

class CmsEspecialidadService {
  _metaKey(id, esServicio) {
    return `${esServicio ? "srv" : "esp"}_${id}`;
  }

  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  guardarMotivoRechazo(id, esServicio, motivo) { return metaEditorial.guardarMotivoRechazo(this._metaKey(id, esServicio), motivo); }
  limpiarMotivoRechazo(id, esServicio) { return metaEditorial.limpiarMotivoRechazo(this._metaKey(id, esServicio)); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  guardarPendingMeta(id, esServicio, meta) { return metaEditorial.guardarPendingMeta(this._metaKey(id, esServicio), meta); }
  limpiarPendingMeta(id, esServicio) { return metaEditorial.limpiarPendingMeta(this._metaKey(id, esServicio)); }
  obtenerMapaEditorMeta() { return metaEditorial.obtenerMapaEditorMeta(); }
  guardarEditorMeta(id, esServicio, meta) { return metaEditorial.guardarEditorMeta(this._metaKey(id, esServicio), meta); }
  limpiarEditorMeta(id, esServicio) { return metaEditorial.limpiarEditorMeta(this._metaKey(id, esServicio)); }

  async _resolverNombreEditor(user, payloadEditor = null) {
    if (
      payloadEditor &&
      typeof payloadEditor === "string" &&
      payloadEditor.trim() &&
      payloadEditor !== "Editor CMS"
    ) {
      return payloadEditor.trim();
    }
    if (user) {
      try {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        if (usuarioLocal?.nombre) {
          return nombreDeUsuario(usuarioLocal);
        }
      } catch (error) {
        registrarFalla("Usuario local", error);
      }
      if (user.name && user.name.trim()) return user.name.trim();
      if (user.preferred_username && user.preferred_username.trim()) return user.preferred_username.trim();
      if (user.username && user.username.trim()) return user.username.trim();
    }
    return "Editor CMS";
  }

  async crearEspecialidad(data, user) {
    const esServicio = data.esServicio === true || data.esServicio === "true";
    // Regla común (utils/flujoEditorial.utils.js). Sin estado, el CMS pide publicar.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(data.estado || "PUBLICADO"),
    });
    const estadoFinal = solicitud.estado;

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      ubicacion: data.ubicacion || null,
      horarios: data.horarios || null,
      requisitos: data.requisitos
        ? typeof data.requisitos === "string"
          ? data.requisitos
          : JSON.stringify(data.requisitos)
        : "[]",
      documentacionNecesaria: data.documentacionNecesaria || null,
      informacionDerivacion: data.informacionDerivacion || null,
      estado: estadoFinal,
    };

    const editorNombre = await this._resolverNombreEditor(user, data.editor || data.editorNombre);

    let nuevoRegistro;
    if (esServicio) {
      nuevoRegistro = await prisma.servicio.create({ data: payload });
    } else {
      nuevoRegistro = await prisma.especialidad.create({ data: payload });
    }

    const idStr = nuevoRegistro.id.toString();
    const nowIso = new Date().toISOString();

    await this.guardarEditorMeta(idStr, esServicio, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, esServicio, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
      });
    }

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: esServicio ? "servicio" : "especialidad",
            entidadId: idStr,
            accion: "CREAR",
            descripcion: `Creación de ${esServicio ? "servicio" : "especialidad"} "${data.nombre}".`,
          },
        });
      }
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    return {
      message: esServicio ? "Servicio creado con éxito" : "Especialidad creada con éxito",
      data: this._format(nuevoRegistro, esServicio, null, {
        editor: editorNombre,
        updatedAt: nowIso,
      }),
    };
  }

  async actualizarEspecialidad(id, data, user) {
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
    const esServicio = data.esServicio === true || data.esServicio === "true";
    const idStr = id.toString();

    let existente = esServicio
      ? await prisma.servicio.findUnique({ where: { id: idBigInt } })
      : await prisma.especialidad.findUnique({ where: { id: idBigInt } });

    if (!existente) {
      const error = new Error(`${esServicio ? "Servicio" : "Especialidad"} no encontrado/a.`);
      error.statusCode = 404;
      throw error;
    }

    const estadoAnterior = (existente.estado || "").toUpperCase();
    // Sin estado: se mantiene archivado lo archivado y todo lo demás pide publicar.
    const estadoSolicitado = data.estado ? data.estado.toUpperCase() : estadoAnterior === "ARCHIVADO" ? "ARCHIVADO" : "PUBLICADO";

    const editorNombre = await this._resolverNombreEditor(user, data.editor || data.editorNombre);

    const metaMap = await this.obtenerMapaPendingMeta();
    const metaExistente = metaMap.get(this._metaKey(idStr, esServicio)) || null;
    const armarSnapshotPublico = () => ({
      nombre: existente.nombre,
      descripcion: existente.descripcion,
      ubicacion: existente.ubicacion,
      horarios: existente.horarios,
      requisitos: existente.requisitos,
      documentacionNecesaria: existente.documentacionNecesaria,
      informacionDerivacion: existente.informacionDerivacion,
      estado: "PUBLICADO",
    });

    const nowIso = new Date().toISOString();

    // Validación: verificar si hubo cambios antes de modificar la base de datos
    const camposEsp = [
      { key: "nombre", label: "Nombre" },
      { key: "descripcion", label: "Descripción" },
      { key: "ubicacion", label: "Ubicación" },
      { key: "horarios", label: "Horarios" },
      { key: "requisitos", label: "Requisitos", tipo: "list" },
      { key: "documentacionNecesaria", label: "Documentación necesaria" },
      { key: "informacionDerivacion", label: "Información de derivación" },
    ];
    const cambiosEsp = calcularCambios(
      existente,
      {
        nombre: data.nombre !== undefined ? data.nombre : existente.nombre,
        descripcion: data.descripcion !== undefined ? data.descripcion : existente.descripcion,
        ubicacion: data.ubicacion !== undefined ? data.ubicacion : existente.ubicacion,
        horarios: data.horarios !== undefined ? data.horarios : existente.horarios,
        requisitos: data.requisitos !== undefined
          ? (typeof data.requisitos === "string" ? data.requisitos : JSON.stringify(data.requisitos))
          : existente.requisitos,
        documentacionNecesaria: data.documentacionNecesaria !== undefined ? data.documentacionNecesaria : existente.documentacionNecesaria,
        informacionDerivacion: data.informacionDerivacion !== undefined ? data.informacionDerivacion : existente.informacionDerivacion,
      },
      camposEsp
    );
    const estadoCambioEsp = Boolean(data.estado && data.estado.toUpperCase() !== estadoAnterior);

    if (cambiosEsp.length === 0 && !estadoCambioEsp) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    await this.guardarEditorMeta(idStr, esServicio, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público pasa por el administrador
    // (incluido despublicarlo o archivarlo) y el portal sigue mostrando la versión publicada mientras tanto.
    const solicitud = resolverSolicitud({
      estadoActual: estadoAnterior,
      meta: metaExistente,
      intencion: intencionDesdeEstado(estadoSolicitado),
      snapshotActual: armarSnapshotPublico,
      hayCambios: cambiosEsp.length > 0,
    });
    const estadoFinal = solicitud.estado;
    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, esServicio, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: nowIso,
      });
    } else {
      await this.limpiarPendingMeta(idStr, esServicio);
    }
    if (solicitud.limpiarMotivo) {
      await this.limpiarMotivoRechazo(idStr, esServicio);
    }

    const payload = {
      nombre: data.nombre || existente.nombre,
      descripcion: data.descripcion !== undefined ? data.descripcion : existente.descripcion,
      ubicacion: data.ubicacion !== undefined ? data.ubicacion : existente.ubicacion,
      horarios: data.horarios !== undefined ? data.horarios : existente.horarios,
      requisitos: data.requisitos
        ? typeof data.requisitos === "string"
          ? data.requisitos
          : JSON.stringify(data.requisitos)
        : existente.requisitos,
      documentacionNecesaria:
        data.documentacionNecesaria !== undefined
          ? data.documentacionNecesaria
          : existente.documentacionNecesaria,
      informacionDerivacion:
        data.informacionDerivacion !== undefined
          ? data.informacionDerivacion
          : existente.informacionDerivacion,
      estado: estadoFinal,
    };

    let actualizada;
    if (esServicio) {
      actualizada = await prisma.servicio.update({ where: { id: idBigInt }, data: payload });
    } else {
      actualizada = await prisma.especialidad.update({ where: { id: idBigInt }, data: payload });
    }

    // Detección automática de cambios para la revisión del Admin
    if (estadoFinal === "PENDIENTE_APROBACION") {
      const camposEsp = [
        { key: "nombre", label: "Nombre" },
        { key: "descripcion", label: "Descripción" },
        { key: "ubicacion", label: "Ubicación" },
        { key: "horarios", label: "Horarios" },
        { key: "requisitos", label: "Requisitos", tipo: "list" },
        { key: "documentacionNecesaria", label: "Documentación necesaria" },
        { key: "informacionDerivacion", label: "Información de derivación" },
      ];
      const nuevosCambios = calcularCambios(existente, actualizada, camposEsp);
      // Los cambios se acumulan contra la versión pública mientras la edición siga viva: si el Admin la rechazó y el CM
      // la vuelve a editar, lo que ya se había modificado (por ejemplo el título) tiene que seguir apareciendo.
      const cambiosPrevios = metaExistente?.cambios || [];
      const metaGuardada =
        (await this.obtenerMapaPendingMeta()).get(this._metaKey(idStr, esServicio)) || {};
      await this.guardarPendingMeta(idStr, esServicio, {
        ...metaGuardada,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      });
    }

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: esServicio ? "servicio" : "especialidad",
            entidadId: idStr,
            accion: "MODIFICAR",
            descripcion: `Actualización de ${esServicio ? "servicio" : "especialidad"} "${actualizada.nombre}".`,
          },
        });
      }
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    await limpiarSolicitudEliminacion(esServicio ? "servicio" : "especialidad", idStr); // editar después de pedir la baja anula el pedido
    return {
      message: esServicio ? "Servicio actualizado con éxito" : "Especialidad actualizada con éxito",
      data: this._format(actualizada, esServicio, null, {
        editor: editorNombre,
        updatedAt: nowIso,
      }),
    };
  }

  async evaluarEspecialidad(id, payload, user) {
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
    const esServicio =
      payload.isServicio === true ||
      payload.isServicio === "true" ||
      payload.esServicio === true ||
      payload.esServicio === "true";
    const idStr = id.toString();

    const { estado, rejectionReason } = payload;

    let existente = esServicio
      ? await prisma.servicio.findUnique({ where: { id: idBigInt } })
      : await prisma.especialidad.findUnique({ where: { id: idBigInt } });

    if (!existente) {
      const error = new Error(`${esServicio ? "Servicio" : "Especialidad"} no encontrado/a.`);
      error.statusCode = 404;
      throw error;
    }

    // Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido
    // (publicar, despublicar o archivar); rechazar exige motivo y conserva la versión publicada si la había.
    const pMeta = (await this.obtenerMapaPendingMeta()).get(this._metaKey(idStr, esServicio)) || null;
    const revision = resolverRevision({
      estadoActual: existente.estado,
      meta: pMeta,
      decision: decisionDesdeEstado(estado),
      motivo: rejectionReason,
    });
    const nuevoEstado = revision.estado;
    const motivoGuardado = revision.motivo;

    if (revision.motivo) {
      await this.guardarMotivoRechazo(idStr, esServicio, revision.motivo);
    } else {
      if (pMeta?.editor && pMeta.editor !== "Editor CMS") {
        await this.guardarEditorMeta(idStr, esServicio, {
          editor: pMeta.editor,
          updatedAt: pMeta.updatedAt || new Date().toISOString(),
        });
      }
      await this.limpiarMotivoRechazo(idStr, esServicio);
    }
    if (revision.meta === null) {
      await this.limpiarPendingMeta(idStr, esServicio);
    }

    let actualizado;
    if (esServicio) {
      actualizado = await prisma.servicio.update({
        where: { id: idBigInt },
        data: { estado: nuevoEstado },
      });
    } else {
      actualizado = await prisma.especialidad.update({
        where: { id: idBigInt },
        data: { estado: nuevoEstado },
      });
    }

    try {
      const usuarioAdmin = await obtenerOCrearUsuarioLocal(user);
      await prisma.auditoria.create({
        data: {
          usuarioId: usuarioAdmin.id,
          entidad: esServicio ? "servicio" : "especialidad",
          entidadId: idStr,
          accion:
            nuevoEstado === "RECHAZADO"
              ? "RECHAZAR"
              : nuevoEstado === "ARCHIVADO"
              ? "ARCHIVAR"
              : "APROBAR",
          descripcion:
            nuevoEstado === "RECHAZADO"
              ? `${esServicio ? "Servicio" : "Especialidad"} "${existente.nombre}" rechazado/a. Motivo: ${motivoGuardado}`
              : `${esServicio ? "Servicio" : "Especialidad"} "${existente.nombre}" evaluado/a como ${nuevoEstado}.`,
        },
      });
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    const editorMetaMap = await this.obtenerMapaEditorMeta();
    const eMeta = editorMetaMap.get(this._metaKey(idStr, esServicio));

    return {
      message: "Estado actualizado con éxito",
      data: this._format(actualizado, esServicio, motivoGuardado, null, eMeta?.editor, eMeta?.updatedAt),
    };
  }

  async obtenerEspecialidades(esVistaAdmin = false) {
    const esConsultaInterna = esVistaAdmin === true;

    const [especialidades, servicios, motivosMap, pendingMetaMap, editorMetaMap, auditorias] = await Promise.all([
      prisma.especialidad.findMany({
        where: esConsultaInterna ? {} : { estado: { in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION", "RECHAZADO"] } },
      }),
      prisma.servicio.findMany({
        where: esConsultaInterna ? {} : { estado: { in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION", "RECHAZADO"] } },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
      this.obtenerMapaEditorMeta(),
      // La auditoría (con datos de usuarios) solo se consulta para la vista interna del CMS/Admin.
      esConsultaInterna
        ? prisma.auditoria.findMany({
            where: { entidad: { in: ["especialidad", "servicio"] } },
            include: { usuario: true },
            orderBy: { fechaHora: "desc" },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const auditMap = new Map();
    for (const aud of auditorias) {
      const isSrv = aud.entidad === "servicio";
      const key = this._metaKey(aud.entidadId, isSrv);
      if (!auditMap.has(key)) {
        auditMap.set(key, aud);
      }
    }

    const resultado = [];

    const procesar = (item, esServicio) => {
      const key = this._metaKey(item.id.toString(), esServicio);
      const pendingMeta = pendingMetaMap.get(key) || null;
      const editorMeta = editorMetaMap.get(key) || null;
      const motivoRechazo = motivosMap.get(key) || null;
      const auditItem = auditMap.get(key) || null;
      const estadoUpper = (item.estado || "").toUpperCase();

      let resolvedEditor = null;
      let resolvedUpdatedAt = null;

      if (pendingMeta?.editor && pendingMeta.editor !== "Editor CMS") {
        resolvedEditor = pendingMeta.editor;
        resolvedUpdatedAt = pendingMeta.updatedAt || null;
      } else if (editorMeta?.editor && editorMeta.editor !== "Editor CMS") {
        resolvedEditor = editorMeta.editor;
        resolvedUpdatedAt = editorMeta.updatedAt || null;
      } else if (auditItem?.usuario) {
        const u = auditItem.usuario;
        resolvedEditor = nombreDeUsuario(u);
        resolvedUpdatedAt = auditItem.fechaHora;
      } else if (pendingMeta?.editor) {
        resolvedEditor = pendingMeta.editor;
        resolvedUpdatedAt = pendingMeta.updatedAt || null;
      } else if (editorMeta?.editor) {
        resolvedEditor = editorMeta.editor;
        resolvedUpdatedAt = editorMeta.updatedAt || null;
      } else {
        // Sin registro de quién lo editó: no se le atribuye a ningún usuario en particular.
        resolvedEditor = "Editor CMS";
      }

      if (!esConsultaInterna) {
        const esPublicadaDirecta = estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO";
        const mantienePublicacionPrevia = conservaVersionPublica(item, pendingMeta);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          return;
        }

        if (mantienePublicacionPrevia) {
          const snap = pendingMeta.snapshotPublico;
          resultado.push(
            this._format({ ...item, ...snap }, esServicio, null, null, resolvedEditor, resolvedUpdatedAt)
          );
          return;
        }
      }

      resultado.push(
        this._format(item, esServicio, motivoRechazo, pendingMeta, resolvedEditor, resolvedUpdatedAt)
      );
    };

    for (const esp of especialidades) {
      procesar(esp, false);
    }
    for (const srv of servicios) {
      procesar(srv, true);
    }

    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // El portal público no necesita saber quién editó cada registro: no se envían nombres del equipo.
    if (!esConsultaInterna) {
      return resultado.map(({ editor, ...publico }) => publico);
    }
    return resultado;
  }

  async eliminarEspecialidad(id, isServicio, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
    const esServicio = isServicio === "true" || isServicio === true;
    const idStr = id.toString();

    const registro = esServicio
      ? await prisma.servicio.findUnique({ where: { id: idBigInt } })
      : await prisma.especialidad.findUnique({ where: { id: idBigInt } });
    if (!registro) {
      const error = new Error(esServicio ? "Servicio no encontrado." : "Especialidad no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const entidad = esServicio ? "servicio" : "especialidad";
    const pendingMeta = (await this.obtenerMapaPendingMeta()).get(this._metaKey(idStr, esServicio)) || null;
    if (!forzar && tieneVersionPublica(registro, pendingMeta)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(registro, pendingMeta);
      if (reemplazaEdicion) {
        const modelo = esServicio ? prisma.servicio : prisma.especialidad;
        await modelo.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(idStr, esServicio, MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad, id: idStr, titulo: registro.nombre, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion(entidad, idStr);

    if (esServicio) {
      await prisma.servicio.delete({ where: { id: idBigInt } });
    } else {
      const profAsignados = await prisma.profesional.count({ where: { especialidadId: idBigInt } });
      if (profAsignados > 0) {
        const error = new Error(`No se puede eliminar porque tiene ${profAsignados} profesional(es) asignado(s).`);
        error.statusCode = 400;
        throw error;
      }
      await prisma.especialidad.delete({ where: { id: idBigInt } });
    }

    await this.limpiarMotivoRechazo(idStr, esServicio);
    await this.limpiarPendingMeta(idStr, esServicio);
    await this.limpiarEditorMeta(idStr, esServicio);

    await registrarAuditoria(user, { entidad, id: idStr, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó ${esServicio ? "el servicio" : "la especialidad"} "${registro.nombre}".` });
    return { message: "Eliminado con éxito" };
  }

  _format(registro, esServicio, rejectionReason = null, meta = null, editorOverride = null, updatedAtOverride = null) {
    let requisitosProcesados = [];
    if (registro.requisitos) {
      try {
        const parsed = JSON.parse(registro.requisitos);
        requisitosProcesados = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        requisitosProcesados =
          typeof registro.requisitos === "string"
            ? registro.requisitos
                .split("\n")
                .map((r) => r.trim())
                .filter((r) => r !== "")
            : [];
      }
    }
    const finalEditor = editorOverride || meta?.editor || "Editor CMS";
    const finalDateRaw = updatedAtOverride || meta?.updatedAt || null;
    let finalDateFormat = "Reciente";
    if (finalDateRaw) {
      try {
        const d = new Date(finalDateRaw);
        if (!isNaN(d.getTime())) {
          finalDateFormat = d.toLocaleDateString("es-AR");
        }
      } catch {
        // Fecha inválida: se muestra el texto por defecto.
      }
    }
    const esPendiente = (registro.estado || "").toUpperCase() === "PENDIENTE_APROBACION";
    return {
      ...registro,
      id: registro.id.toString(),
      esServicio,
      requisitos: requisitosProcesados,
      rejectionReason: rejectionReason || null,
      editor: finalEditor,
      updatedAtFormatted: finalDateFormat,
      cambios: esPendiente ? cambiosParaCliente(meta?.cambios) : [],
      esActualizacion: esPendiente && Boolean(meta?.esActualizacion),
      requestedEstado: esPendiente ? meta?.targetEstado || null : null,
    };
  }
}

export default new CmsEspecialidadService();
