import { prisma } from "../../config/prisma.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const REJECTION_KEY_PREFIX = "especialidad_rejection_";
const PENDING_META_KEY_PREFIX = "especialidad_pending_meta_";

class CmsEspecialidadService {
  _metaKey(id, esServicio) {
    return `${esServicio ? "srv" : "esp"}_${id}`;
  }

  async obtenerMapaMotivosRechazo() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: REJECTION_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(REJECTION_KEY_PREFIX, "");
        map.set(itemKey, item.valor);
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarMotivoRechazo(id, esServicio, motivo) {
    const key = this._metaKey(id, esServicio);
    const clave = `${REJECTION_KEY_PREFIX}${key}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: motivo, updatedAt: new Date() },
      create: {
        clave,
        valor: motivo,
        descripcion: `Motivo de rechazo de ${esServicio ? "servicio" : "especialidad"} ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarMotivoRechazo(id, esServicio) {
    const key = this._metaKey(id, esServicio);
    const clave = `${REJECTION_KEY_PREFIX}${key}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerMapaPendingMeta() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: PENDING_META_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(PENDING_META_KEY_PREFIX, "");
        try {
          map.set(itemKey, JSON.parse(item.valor));
        } catch (_) {}
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarPendingMeta(id, esServicio, meta) {
    const key = this._metaKey(id, esServicio);
    const clave = `${PENDING_META_KEY_PREFIX}${key}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: JSON.stringify(meta), updatedAt: new Date() },
      create: {
        clave,
        valor: JSON.stringify(meta),
        descripcion: `Metadatos de solicitud pendiente para ${esServicio ? "servicio" : "especialidad"} ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarPendingMeta(id, esServicio) {
    const key = this._metaKey(id, esServicio);
    const clave = `${PENDING_META_KEY_PREFIX}${key}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async crearEspecialidad(data, user) {
    const esServicio = data.esServicio === true || data.esServicio === "true";
    const estadoSolicitado = data.estado ? data.estado.toUpperCase() : "PUBLICADO";
    const estadoFinal =
      estadoSolicitado === "ARCHIVADO" || estadoSolicitado === "BORRADOR"
        ? "ARCHIVADO"
        : "PENDIENTE_APROBACION";

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

    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";

    let nuevoRegistro;
    if (esServicio) {
      nuevoRegistro = await prisma.servicio.create({ data: payload });
    } else {
      nuevoRegistro = await prisma.especialidad.create({ data: payload });
    }

    const idStr = nuevoRegistro.id.toString();
    if (estadoFinal === "PENDIENTE_APROBACION") {
      await this.guardarPendingMeta(idStr, esServicio, {
        previousEstado: null,
        targetEstado: "PUBLICADO",
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
        snapshotPublico: null,
      });
    }

    return {
      message: esServicio ? "Servicio creado con éxito" : "Especialidad creada con éxito",
      data: this._format(nuevoRegistro, esServicio, null, {
        editor: editorNombre,
        updatedAt: new Date().toLocaleDateString("es-AR"),
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
    const estadoSolicitado = data.estado ? data.estado.toUpperCase() : estadoAnterior;
    const provieneDePublicada =
      estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";

    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";

    const metaMap = await this.obtenerMapaPendingMeta();
    const metaExistente = metaMap.get(this._metaKey(idStr, esServicio)) || null;

    let snapshotPublico = metaExistente?.snapshotPublico || null;
    if (provieneDePublicada && !snapshotPublico) {
      snapshotPublico = {
        nombre: existente.nombre,
        descripcion: existente.descripcion,
        ubicacion: existente.ubicacion,
        horarios: existente.horarios,
        requisitos: existente.requisitos,
        documentacionNecesaria: existente.documentacionNecesaria,
        informacionDerivacion: existente.informacionDerivacion,
        estado: "PUBLICADO",
      };
    }

    let estadoFinal = "PENDIENTE_APROBACION";
    if (estadoSolicitado === "ARCHIVADO" && !provieneDePublicada) {
      estadoFinal = "ARCHIVADO";
      await this.limpiarPendingMeta(idStr, esServicio);
      await this.limpiarMotivoRechazo(idStr, esServicio);
    } else {
      await this.guardarPendingMeta(idStr, esServicio, {
        previousEstado: provieneDePublicada ? "PUBLICADO" : estadoAnterior,
        targetEstado: estadoSolicitado === "ARCHIVADO" ? "ARCHIVADO" : "PUBLICADO",
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
        snapshotPublico,
      });
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

    return {
      message: esServicio ? "Servicio actualizado con éxito" : "Especialidad actualizada con éxito",
      data: this._format(actualizada, esServicio, null, {
        editor: editorNombre,
        updatedAt: new Date().toLocaleDateString("es-AR"),
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
    if (!estado) {
      const error = new Error("Debe indicar el estado de evaluación.");
      error.statusCode = 400;
      throw error;
    }

    let existente = esServicio
      ? await prisma.servicio.findUnique({ where: { id: idBigInt } })
      : await prisma.especialidad.findUnique({ where: { id: idBigInt } });

    if (!existente) {
      const error = new Error(`${esServicio ? "Servicio" : "Especialidad"} no encontrado/a.`);
      error.statusCode = 404;
      throw error;
    }

    // El administrador únicamente puede aprobar o rechazar solicitudes que estén pendientes
    if (existente.estado !== "PENDIENTE_APROBACION") {
      const error = new Error(
        "Solo se pueden aprobar o rechazar registros que estén pendientes de aprobación."
      );
      error.statusCode = 400;
      throw error;
    }

    const estadoUpper = estado.toUpperCase();
    if (estadoUpper !== "APROBADO" && estadoUpper !== "PUBLICADO" && estadoUpper !== "RECHAZADO") {
      const error = new Error(
        "Acción no permitida: el administrador solo puede aprobar o rechazar la solicitud."
      );
      error.statusCode = 400;
      throw error;
    }

    let nuevoEstado = existente.estado;
    let motivoGuardado = null;

    if (estadoUpper === "RECHAZADO") {
      if (!rejectionReason || !rejectionReason.trim()) {
        const error = new Error("Debe especificar un motivo de rechazo.");
        error.statusCode = 400;
        throw error;
      }
      nuevoEstado = "RECHAZADO";
      motivoGuardado = rejectionReason.trim();
      await this.guardarMotivoRechazo(idStr, esServicio, motivoGuardado);
    } else {
      // APROBADO o PUBLICADO
      nuevoEstado = "PUBLICADO";
      await this.limpiarMotivoRechazo(idStr, esServicio);
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

    // Auditoría
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
              ? "DESACTIVAR"
              : "APROBAR",
          descripcion:
            nuevoEstado === "RECHAZADO"
              ? `${esServicio ? "Servicio" : "Especialidad"} "${existente.nombre}" rechazado/a. Motivo: ${motivoGuardado}`
              : `${esServicio ? "Servicio" : "Especialidad"} "${existente.nombre}" evaluado/a como ${nuevoEstado}.`,
        },
      });
    } catch (_) {}

    return {
      message: "Estado actualizado con éxito",
      data: this._format(actualizado, esServicio, motivoGuardado),
    };
  }

  async obtenerEspecialidades(esVistaAdmin = false) {
    const esConsultaInterna = esVistaAdmin === true;

    const [especialidades, servicios, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.especialidad.findMany({
        where: esConsultaInterna ? {} : { estado: { in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION"] } },
      }),
      prisma.servicio.findMany({
        where: esConsultaInterna ? {} : { estado: { in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION"] } },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    const resultado = [];

    // Helper para procesar cada elemento
    const procesar = (item, esServicio) => {
      const key = this._metaKey(item.id.toString(), esServicio);
      const pendingMeta = pendingMetaMap.get(key) || null;
      const motivoRechazo = motivosMap.get(key) || null;
      const estadoUpper = (item.estado || "").toUpperCase();

      if (!esConsultaInterna) {
        const esPublicadaDirecta = estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO";
        const mantienePublicacionPrevia =
          estadoUpper === "PENDIENTE_APROBACION" &&
          pendingMeta?.previousEstado === "PUBLICADO" &&
          Boolean(pendingMeta?.snapshotPublico);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          return;
        }

        if (mantienePublicacionPrevia) {
          const snap = pendingMeta.snapshotPublico;
          resultado.push(this._format({ ...item, ...snap }, esServicio));
          return;
        }
      }

      resultado.push(this._format(item, esServicio, motivoRechazo, pendingMeta));
    };

    for (const esp of especialidades) {
      procesar(esp, false);
    }
    for (const srv of servicios) {
      procesar(srv, true);
    }

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async eliminarEspecialidad(id, isServicio) {
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
    const esServicio = isServicio === "true" || isServicio === true;
    const idStr = id.toString();

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

    return { message: "Eliminado con éxito" };
  }

  _format(registro, esServicio, rejectionReason = null, meta = null) {
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
    return {
      ...registro,
      id: registro.id.toString(),
      esServicio,
      requisitos: requisitosProcesados,
      rejectionReason: rejectionReason || null,
      editor: meta?.editor || "Editor CMS",
      updatedAtFormatted: meta?.updatedAt
        ? new Date(meta.updatedAt).toLocaleDateString("es-AR")
        : "Reciente",
    };
  }
}

export default new CmsEspecialidadService();
