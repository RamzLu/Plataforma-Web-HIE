import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { registrarFalla } from "../../utils/log.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { tieneVersionPublica, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { nombreDeUsuario, obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";

const REJECTION_KEY_PREFIX = "profesional_rejection_";
const PENDING_META_KEY_PREFIX = "profesional_pending_meta_";
const EDITOR_META_KEY_PREFIX = "profesional_editor_meta_";
const metaEditorial = crearMetaEditorial({ entidad: "profesional", rechazo: REJECTION_KEY_PREFIX, pendiente: PENDING_META_KEY_PREFIX, editor: EDITOR_META_KEY_PREFIX });

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

  _formatearFecha(fecha) {
    if (!fecha) return "Reciente";
    try {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch {
      // Fecha inválida: se muestra el texto por defecto.
    }
    return "Reciente";
  }

  // Estado tal como lo entiende el CMS: APROBADO cuenta como publicado y BORRADOR como archivado.
  _estadoDe(prof) {
    const estado = (prof?.estado || "").toUpperCase();
    if (estado === "APROBADO") return "PUBLICADO";
    if (estado === "BORRADOR") return "ARCHIVADO";
    return estado || "PENDIENTE_APROBACION";
  }

  _construirItemProfesional(prof, servicios, options = {}) {
    let pubUrl = "";
    if (prof.archivo) {
      const { data } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(prof.archivo.nombreArchivo);
      pubUrl = data.publicUrl;
    }

    // Lógica Puente: Verificamos si está guardado como un Servicio en la tabla Area
    const isServicio = prof.especialidad?.nombre === "Servicio Clave";
    let nombreMostrar = prof.especialidad?.nombre || "Sin Asignar";
    let realIdForFrontend = prof.especialidadId ? prof.especialidadId.toString() : "";

    if (isServicio && prof.profesional_area && prof.profesional_area.length > 0) {
      nombreMostrar = prof.profesional_area[0].area.nombre;
      const matchedServicio = servicios.find((s) => s.nombre === nombreMostrar);
      if (matchedServicio) {
        realIdForFrontend = matchedServicio.id.toString();
      }
    }

    const estado = options.estado || this._estadoDe(prof);
    const editor = options.editor || "Editor CMS";
    const fechaCarga = this._formatearFecha(prof.createdAt);
    const fechaActualizacion = this._formatearFecha(options.updatedAt || prof.updatedAt || prof.createdAt);

    return {
      id: prof.id.toString(),
      nombre: prof.nombre,
      apellido: prof.apellido,
      matricula: prof.matricula || "",
      cargo: prof.cargo || "",
      descripcion: prof.descripcion || "",
      especialidadNombre: nombreMostrar,
      esServicioClave: isServicio,
      especialidadId: realIdForFrontend,
      estado,
      publicado: estado === "PUBLICADO",
      activo: prof.activo !== false,
      rejectionReason: options.rejectionReason || null,
      editor,
      fechaCarga,
      fechaActualizacion,
      imagenUrl: pubUrl,
      cambios: options.cambios || [],
      esActualizacion: Boolean(options.esActualizacion),
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
    };
  }

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
                  accion: { in: ["CREAR", "ACTUALIZAR"] },
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

      const estado = this._estadoDe(prof);

      if (!esVistaAdmin) {
        if (estado === "PUBLICADO") {
          resultado.push(
            this._construirItemProfesional(prof, servicios, {
              estado: "PUBLICADO",
              editor: editorMeta?.editor,
              updatedAt: editorMeta?.updatedAt || prof.updatedAt,
            })
          );
        } else if (estado === "PENDIENTE_APROBACION" && pendingMeta?.snapshotPublico) {
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
        this._construirItemProfesional(prof, servicios, {
          estado,
          rejectionReason,
          editor: pendingMeta?.editor || editorMeta?.editor || "Editor CMS",
          updatedAt: pendingMeta?.updatedAt || editorMeta?.updatedAt || prof.updatedAt,
          cambios: estado === "PENDIENTE_APROBACION" ? cambiosParaCliente(pendingMeta?.cambios) : [],
          esActualizacion: estado === "PENDIENTE_APROBACION" && Boolean(pendingMeta?.esActualizacion),
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
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId, esServicio } = data;

    if (!nombre || !apellido || !especialidadId) {
      const error = new Error("Nombre, apellido y área asignada son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    const espIdBigInt = parsearIdBigInt(especialidadId, "ID de área o especialidad");
    let finalEspecialidadId;
    let finalAreaNombre = null;

    // Lógica Puente: Si es servicio, validamos en tabla Servicio y usamos puente en Area
    if (esServicio === "true" || esServicio === true) {
      const servicio = await prisma.servicio.findUnique({ where: { id: espIdBigInt } });
      if (!servicio) {
        const error = new Error("El servicio clave seleccionado no existe.");
        error.statusCode = 404;
        throw error;
      }
      finalAreaNombre = servicio.nombre;

      let genEsp = await prisma.especialidad.findFirst({ where: { nombre: "Servicio Clave" } });
      if (!genEsp) {
        genEsp = await prisma.especialidad.create({
          data: {
            nombre: "Servicio Clave",
            descripcion: "Clasificación interna para servicios",
          },
        });
      }
      finalEspecialidadId = genEsp.id;
    } else {
      const esp = await prisma.especialidad.findUnique({ where: { id: espIdBigInt } });
      if (!esp) {
        const error = new Error("La especialidad seleccionada no existe.");
        error.statusCode = 404;
        throw error;
      }
      finalEspecialidadId = esp.id;
    }

    let archivoId = null;
    if (file) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "prof");
      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        console.error("Error subiendo imagen de profesional a Supabase:", storageError.message);
        const error = new Error("No se pudo almacenar la fotografía del profesional.");
        error.statusCode = 500;
        throw error;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });
      archivoId = archivoDb.id;
    }

    const estadoSolicitado = data.estado ? data.estado.toUpperCase() : "PUBLICADO";
    const esArchivado = estadoSolicitado === "ARCHIVADO" || estadoSolicitado === "BORRADOR";
    const estadoFinal = esArchivado ? "ARCHIVADO" : "PENDIENTE_APROBACION";

    const nuevoProfesional = await prisma.profesional.create({
      data: {
        nombre,
        apellido,
        matricula,
        cargo,
        descripcion,
        especialidadId: finalEspecialidadId,
        archivoId,
        activo: false,
        estado: estadoFinal,
        updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true },
    });

    // Guardamos el nombre del servicio en el Area conectada
    if (finalAreaNombre) {
      let areaDb = await prisma.area.findFirst({ where: { nombre: finalAreaNombre } });
      if (!areaDb) areaDb = await prisma.area.create({ data: { nombre: finalAreaNombre } });
      await prisma.profesional_area.create({
        data: { profesionalId: nuevoProfesional.id, areaId: areaDb.id },
      });
    }

    const idStr = nuevoProfesional.id.toString();
    const nowIso = new Date().toISOString();
    const editorNombre = await this._resolverNombreEditor(user, data.editor || data.editorNombre);

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    if (estadoFinal === "PENDIENTE_APROBACION") {
      await this.guardarPendingMeta(idStr, {
        previousEstado: null,
        targetEstado: "PUBLICADO",
        editor: editorNombre,
        updatedAt: nowIso,
        snapshotPublico: null,
      });
    }

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "profesional",
            entidadId: idStr,
            accion: "CREAR",
            descripcion: `Creación de profesional "${nombre} ${apellido}".`,
          },
        });
      }
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    let pubUrl = "";
    if (nuevoProfesional.archivo) {
      pubUrl = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(nuevoProfesional.archivo.nombreArchivo).data.publicUrl;
    }

    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Profesional enviado a revisión del administrador para su aprobación."
          : "¡Profesional guardado como archivado!",
      profesional: {
        id: idStr,
        nombre: nuevoProfesional.nombre,
        apellido: nuevoProfesional.apellido,
        matricula: nuevoProfesional.matricula || "",
        cargo: nuevoProfesional.cargo || "",
        descripcion: nuevoProfesional.descripcion || "",
        especialidadNombre: finalAreaNombre || nuevoProfesional.especialidad.nombre,
        esServicioClave: esServicio === "true" || esServicio === true,
        especialidadId: especialidadId.toString(),
        estado: estadoFinal,
        publicado: false,
        activo: false,
        rejectionReason: null,
        editor: editorNombre,
        fechaCarga: this._formatearFecha(nuevoProfesional.createdAt),
        fechaActualizacion: this._formatearFecha(nowIso),
        imagenUrl: pubUrl,
      },
    };
  }

  async actualizarProfesional(id, data, file, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de profesional");
    const idStr = idBigInt.toString();
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId, esServicio } = data;
    const espIdBigInt = parsearIdBigInt(especialidadId, "ID de área o especialidad");

    const [profesionalExistente, servicios, pendingMap, rejectionMap] = await Promise.all([
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
      this.obtenerMapaMotivosRechazo(),
    ]);

    if (!profesionalExistente) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const existingPending = pendingMap.get(idStr) || null;
    const existingRejection = rejectionMap.get(idStr) || null;
    const provieneDePublicado = this._estadoDe(profesionalExistente) === "PUBLICADO";

    let snapshotPublico = existingPending?.snapshotPublico || null;
    if (provieneDePublicado && !snapshotPublico) {
      snapshotPublico = this._construirItemProfesional(profesionalExistente, servicios, {
        estado: "PUBLICADO",
      });
    }

    let finalEspecialidadId;
    let finalAreaNombre = null;

    if (esServicio === "true" || esServicio === true) {
      const servicio = await prisma.servicio.findUnique({ where: { id: espIdBigInt } });
      if (!servicio) {
        const error = new Error("El servicio seleccionado no existe.");
        error.statusCode = 404;
        throw error;
      }
      finalAreaNombre = servicio.nombre;

      let genEsp = await prisma.especialidad.findFirst({ where: { nombre: "Servicio Clave" } });
      if (!genEsp) genEsp = await prisma.especialidad.create({ data: { nombre: "Servicio Clave" } });
      finalEspecialidadId = genEsp.id;
    } else {
      const esp = await prisma.especialidad.findUnique({ where: { id: espIdBigInt } });
      if (!esp) {
        const error = new Error("La especialidad seleccionada no existe.");
        error.statusCode = 404;
        throw error;
      }
      finalEspecialidadId = esp.id;
      finalAreaNombre = esp.nombre;
    }

    // Validación: verificar si hubo cambios antes de procesar archivos o base de datos
    const versionAnteriorCheck = this._construirItemProfesional(profesionalExistente, servicios, {});
    const camposProfCheck = [
      { key: "nombre", label: "Nombre" },
      { key: "apellido", label: "Apellido" },
      { key: "matricula", label: "Matrícula" },
      { key: "cargo", label: "Cargo o función" },
      { key: "especialidadNombre", label: "Área asignada" },
      { key: "esServicioClave", label: "Es servicio clave", tipo: "boolean" },
      { key: "descripcion", label: "Descripción / perfil" },
    ];
    const cambiosProf = calcularCambios(
      versionAnteriorCheck,
      {
        nombre: nombre !== undefined ? nombre.trim() : versionAnteriorCheck.nombre,
        apellido: apellido !== undefined ? apellido.trim() : versionAnteriorCheck.apellido,
        matricula: matricula !== undefined ? matricula.trim() : versionAnteriorCheck.matricula,
        cargo: cargo !== undefined ? cargo.trim() : versionAnteriorCheck.cargo,
        descripcion: descripcion !== undefined ? (descripcion || "").trim() : versionAnteriorCheck.descripcion,
        especialidadNombre: finalAreaNombre || versionAnteriorCheck.especialidadNombre,
        esServicioClave: esServicio === "true" || esServicio === true,
      },
      camposProfCheck
    );
    const estadoCambioProf = Boolean(data.estado && data.estado.toUpperCase() !== (profesionalExistente.estado || "").toUpperCase());

    if (cambiosProf.length === 0 && !file && !estadoCambioProf) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    let archivoId = profesionalExistente.archivoId;

    if (file) {
      if (profesionalExistente.archivo && !snapshotPublico) {
        await supabase.storage
          .from("noticias-imagenes")
          .remove([profesionalExistente.archivo.nombreArchivo]);
        await prisma.archivo.delete({ where: { id: profesionalExistente.archivo.id } });
      }

      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "prof");
      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        console.error("Error subiendo imagen de profesional a Supabase:", storageError.message);
        const err = new Error("No se pudo almacenar la fotografía del profesional.");
        err.statusCode = 500;
        throw err;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });
      archivoId = archivoDb.id;
    }

    const estadoSolicitado = data.estado ? data.estado.toUpperCase() : "PUBLICADO";
    const esArchivado =
      (estadoSolicitado === "ARCHIVADO" || estadoSolicitado === "BORRADOR") &&
      !provieneDePublicado;
    const estadoFinal = esArchivado ? "ARCHIVADO" : "PENDIENTE_APROBACION";

    const profActualizado = await prisma.profesional.update({
      where: { id: idBigInt },
      data: {
        nombre,
        apellido,
        matricula,
        cargo,
        descripcion,
        especialidadId: finalEspecialidadId,
        archivoId,
        activo: esArchivado ? false : profesionalExistente.activo,
        estado: estadoFinal,
        updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true },
    });

    await prisma.profesional_area.deleteMany({ where: { profesionalId: profActualizado.id } });
    if (finalAreaNombre) {
      let areaDb = await prisma.area.findFirst({ where: { nombre: finalAreaNombre } });
      if (!areaDb) areaDb = await prisma.area.create({ data: { nombre: finalAreaNombre } });
      await prisma.profesional_area.create({
        data: { profesionalId: profActualizado.id, areaId: areaDb.id },
      });
    }

    const nowIso = new Date().toISOString();
    const editorNombre = await this._resolverNombreEditor(user, data.editor || data.editorNombre);

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    if (esArchivado) {
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    } else {
      // Detección automática de cambios para la revisión del Admin
      const versionAnterior = this._construirItemProfesional(profesionalExistente, servicios, {});
      let urlNueva = versionAnterior.imagenUrl;
      if (profActualizado.archivo) {
        urlNueva = supabase.storage
          .from("noticias-imagenes")
          .getPublicUrl(profActualizado.archivo.nombreArchivo).data.publicUrl;
      }
      const nuevosCambios = calcularCambios(
        versionAnterior,
        {
          nombre: profActualizado.nombre,
          apellido: profActualizado.apellido,
          matricula: profActualizado.matricula,
          cargo: profActualizado.cargo,
          descripcion: profActualizado.descripcion,
          especialidadNombre: finalAreaNombre || profActualizado.especialidad?.nombre,
          esServicioClave: esServicio === "true" || esServicio === true,
          imagenUrl: urlNueva,
        },
        [
          { key: "nombre", label: "Nombre" },
          { key: "apellido", label: "Apellido" },
          { key: "matricula", label: "Matrícula" },
          { key: "cargo", label: "Cargo o función" },
          { key: "especialidadNombre", label: "Área asignada" },
          { key: "esServicioClave", label: "Es servicio clave", tipo: "boolean" },
          { key: "descripcion", label: "Descripción / perfil" },
          { key: "imagenUrl", label: "Fotografía", tipo: "image" },
        ]
      );
      const cambiosPrevios = existingPending?.cambios || [];

      await this.guardarPendingMeta(idStr, {
        previousEstado: provieneDePublicado ? "PUBLICADO" : existingRejection ? "RECHAZADO" : null,
        targetEstado: estadoSolicitado === "ARCHIVADO" ? "ARCHIVADO" : "PUBLICADO",
        editor: editorNombre,
        updatedAt: nowIso,
        snapshotPublico,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      });
      await this.limpiarMotivoRechazo(idStr);
    }

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "profesional",
            entidadId: idStr,
            accion: "ACTUALIZAR",
            descripcion: `Actualización de profesional "${nombre} ${apellido}".`,
          },
        });
      }
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    let pubUrl = "";
    if (profActualizado.archivo) {
      pubUrl = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(profActualizado.archivo.nombreArchivo).data.publicUrl;
    }

    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Modificaciones enviadas a revisión del administrador."
          : "¡Profesional actualizado con éxito!",
      profesional: {
        id: idStr,
        nombre: profActualizado.nombre,
        apellido: profActualizado.apellido,
        matricula: profActualizado.matricula || "",
        cargo: profActualizado.cargo || "",
        descripcion: profActualizado.descripcion || "",
        especialidadNombre: finalAreaNombre || profActualizado.especialidad.nombre,
        esServicioClave: esServicio === "true" || esServicio === true,
        especialidadId: especialidadId.toString(),
        estado: estadoFinal,
        publicado: false,
        activo: profActualizado.activo,
        rejectionReason: null,
        editor: editorNombre,
        fechaCarga: this._formatearFecha(profActualizado.createdAt),
        fechaActualizacion: this._formatearFecha(nowIso),
        imagenUrl: pubUrl,
      },
    };
  }

  async evaluarProfesional(id, payload = {}, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de profesional");
    const idStr = idBigInt.toString();
    const nuevoEstado = (payload.estado || "").toUpperCase();
    const rejectionReason = payload.rejectionReason ? payload.rejectionReason.trim() : null;

    if (!["APROBADO", "PUBLICADO", "RECHAZADO"].includes(nuevoEstado)) {
      const error = new Error("El estado de evaluación debe ser APROBADO, PUBLICADO o RECHAZADO.");
      error.statusCode = 400;
      throw error;
    }

    if (nuevoEstado === "RECHAZADO" && !rejectionReason) {
      const error = new Error("Debe proporcionar un motivo de rechazo.");
      error.statusCode = 400;
      throw error;
    }

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

    if (nuevoEstado === "RECHAZADO") {
      const profRechazado = await prisma.profesional.update({
        where: { id: idBigInt },
        data: { activo: false, estado: "RECHAZADO", updatedAt: new Date() },
        include: {
          especialidad: true,
          archivo: true,
          profesional_area: { include: { area: true } },
        },
      });

      await this.guardarMotivoRechazo(idStr, rejectionReason);
      await this.limpiarPendingMeta(idStr);

      try {
        if (user) {
          const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
          await prisma.auditoria.create({
            data: {
              usuarioId: usuarioLocal.id,
              entidad: "profesional",
              entidadId: idStr,
              accion: "RECHAZAR",
              descripcion: `Rechazo de profesional "${profRechazado.nombre} ${profRechazado.apellido}". Motivo: ${rejectionReason}`,
            },
          });
        }
      } catch (error) {
        registrarFalla("Auditoría", error);
      }

      return {
        message: "Profesional rechazado.",
        data: this._construirItemProfesional(profRechazado, servicios, {
          estado: "RECHAZADO",
          rejectionReason,
          editor: preservedEditor,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    // APROBADO / PUBLICADO
    const targetArchivado = pendingMeta?.targetEstado === "ARCHIVADO";
    const profAprobado = await prisma.profesional.update({
      where: { id: idBigInt },
      data: {
        activo: !targetArchivado,
        estado: targetArchivado ? "ARCHIVADO" : "PUBLICADO",
        updatedAt: new Date(),
      },
      include: {
        especialidad: true,
        archivo: true,
        profesional_area: { include: { area: true } },
      },
    });

    await this.limpiarMotivoRechazo(idStr);
    await this.limpiarPendingMeta(idStr);
    await this.guardarEditorMeta(idStr, {
      editor: preservedEditor,
      updatedAt: pendingMeta?.updatedAt || new Date().toISOString(),
    });

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "profesional",
            entidadId: idStr,
            accion: "APROBAR",
            descripcion: `Aprobación y publicación de profesional "${profAprobado.nombre} ${profAprobado.apellido}".`,
          },
        });
      }
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    return {
      message: "Profesional aprobado y publicado con éxito.",
      data: this._construirItemProfesional(profAprobado, servicios, {
        estado: targetArchivado ? "ARCHIVADO" : "PUBLICADO",
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
    if (!forzar && tieneVersionPublica(profesional, (await this.obtenerMapaPendingMeta()).get(idStr) || null)) {
      return solicitarEliminacion({ entidad: "profesional", id: idStr, titulo: `${profesional.nombre} ${profesional.apellido}`.trim(), user });
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

    return { message: "¡Profesional eliminado con éxito!" };
  }
}

export default new CmsProfesionalService();