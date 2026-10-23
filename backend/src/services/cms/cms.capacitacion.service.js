import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd3Vwd21ieWd0eWlsdWV6emxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDM2MDUsImV4cCI6MjEwMjcxOTYwNX0.ytya9DiAojD-DbQ0kDmr_nojF4GUp7XaFLsUIRH2sWE"
);

const DOCS_BUCKET = "capacitaciones-documentos";
const MEDIA_BUCKET = "capacitaciones-imagenes-videos";

const formatBytes = (bytes) => {
  const n = Number(bytes || 0);
  if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n > 0) return `${(n / 1024).toFixed(0)} KB`;
  return "";
};

const INITIAL_SEED_CAPACITACIONES = [
  {
    titulo: "Abordaje Inicial del ACV Isquémico en Guardia",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    temario:
      "Módulo 1: Reconocimiento precoz y aplicación de Escala Cincinnati.\nMódulo 2: Criterios clínicos de inclusión/exclusión para trombolisis endovenosa.\nMódulo 3: Activación del protocolo Código ACV institucional del HIE.\nMódulo 4: Cuidados de enfermería crítica y monitoreo en shock room.",
    modalidad: "Virtual",
    tipoRecurso: "video",
    fechaInicio: new Date("2026-05-20T10:00:00Z"),
    fechaFin: new Date("2026-05-20T13:00:00Z"),
    horario: "10:00",
    ubicacion: "Plataforma Telesalud HIE (Video On-Demand)",
    disertantes: "Dr. Marcelo Morales, Dra. Elena Vega",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    archivoTipo: "video",
    archivoNombre: "Protocolo_ACV_VideoClase.mp4",
    archivoTamano: "14.2 MB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Uso de la Plataforma de Telesalud y Teleconsultas",
    descripcion:
      "Taller práctico para el manejo del sistema institucional de teleconsultas, carga de historias clínicas virtuales y atención remota de pacientes.",
    temario:
      "Módulo 1: Acceso, roles y permisos en el sistema Telesalud Formosa.\nMódulo 2: Coordinación de turnos virtuales y sala de espera digital.\nMódulo 3: Confección de historia clínica electrónica y recetas digitales.\nMódulo 4: Aspectos médico-legales y resguardo de datos sensibles.",
    modalidad: "Virtual",
    tipoRecurso: "pdf",
    fechaInicio: new Date("2026-05-22T11:30:00Z"),
    fechaFin: new Date("2026-05-22T13:00:00Z"),
    horario: "11:30",
    ubicacion: "Virtual - Plataforma Telesalud HIE",
    disertantes: "Lic. Carlos Benítez, Lic. Romina Soto",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Guia_Operativa_Teleconsultas_HIE.pdf",
    archivoTamano: "2.1 MB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Gestión Basada en Datos Clínicos para Enfermería",
    descripcion:
      "Capacitación para jefes de enfermería en la transformación de registros administrativos en datos clínicos útiles para la toma de decisiones.",
    temario:
      "Módulo 1: Indicadores clave de calidad en enfermería hospitalaria.\nMódulo 2: Registro estructurado en salas de internación general.\nMódulo 3: Auditoría concurrente y detección de eventos adversos.\nMódulo 4: Análisis de datos para asignación de dotaciones de guardia.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-05-20T10:00:00Z"),
    fechaFin: new Date("2026-05-20T14:00:00Z"),
    horario: "10:00",
    ubicacion: "SUM Hospital Interdistrital Evita",
    disertantes: "Lic. Patricia Romero, Enf. Esp. Claudio Ruiz",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Programa_Gestion_Enfermeria.pdf",
    archivoTamano: "980 KB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Reanimación Cardiopulmonar (RCP) Avanzada",
    descripcion:
      "Actualización en maniobras de RCP avanzada, uso de desfibrilador externo automático (DEA) y manejo de vía aérea en emergencias médicas.",
    temario:
      "Módulo 1: Algoritmos actualizados de Soporte Vital Cardiovascular Avanzado (ACLS).\nMódulo 2: Farmacología en paro cardiorrespiratorio y ritmos desfibrilables.\nMódulo 3: Práctica con simuladores de vía aérea avanzada y capnografía.\nMódulo 4: Dinámica y liderazgo de equipo en código azul.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-05T08:30:00Z"),
    fechaFin: new Date("2026-06-05T12:30:00Z"),
    horario: "08:30",
    ubicacion: "Gimnasio de Rehabilitación HIE",
    disertantes: "Dr. Martín Almada, Dra. Sofía Albornoz",
    videoUrl: "",
    archivoTipo: "imagen",
    archivoNombre: "Afiche_Convocatoria_RCP_2026.png",
    archivoTamano: "1.8 MB",
    estado: "BORRADOR",
    activo: true,
  },
  {
    titulo: "Control y Prevención de Infecciones Intrahospitalarias",
    descripcion:
      "Estrategias y medidas de bioseguridad para la prevención de infecciones asociadas al cuidado de la salud (IACS) en servicios críticos.",
    temario:
      "Módulo 1: Higiene de manos y paquete de medidas para bacteriemia cero.\nMódulo 2: Prevención de neumonía asociada a ventilación mecánica (NAVM).\nMódulo 3: Manejo de catéteres urinarios y prevención de ITU.\nMódulo 4: Aislamiento por cohortes y desinfección ambiental hospitalaria.",
    modalidad: "Híbrida",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-12T09:00:00Z"),
    fechaFin: new Date("2026-06-12T13:00:00Z"),
    horario: "09:00",
    ubicacion: "Híbrida - Aula Magna y Zoom",
    disertantes: "Dra. María Laura Giménez, Dr. Roberto Méndez",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Protocolo_IACS_Hospital_Evita.pdf",
    archivoTamano: "3.2 MB",
    estado: "ARCHIVADO",
    activo: true,
  },
  {
    titulo: "Bioética y Derechos del Paciente en el Ámbito Público",
    descripcion:
      "Análisis de casos dilemáticos en la práctica médica diaria, consentimiento informado y marco legal de la atención en el hospital público.",
    temario:
      "Módulo 1: Principios bioéticos aplicados a la medicina intensiva y de urgencias.\nMódulo 2: Directivas médicas anticipadas y adecuación del esfuerzo terapéutico.\nMódulo 3: Confidencialidad y secreto médico en equipos interdisciplinarios.\nMódulo 4: Dictámenes del Comité de Bioética Asistencial.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-18T11:00:00Z"),
    fechaFin: new Date("2026-06-18T14:00:00Z"),
    horario: "11:00",
    ubicacion: "Auditorio Principal HIE",
    disertantes: "Dra. Valeria Fontana, Dr. Hernán Castro",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Temario_Bioetica_Hospitalaria.pdf",
    archivoTamano: "1.1 MB",
    estado: "PUBLICADO",
    activo: true,
  },
];

class CmsCapacitacionService {
  /**
   * Auto-sembrado si la tabla está vacía para que el CMS arranque con datos iniciales
   */
  async _asegurarDatosIniciales() {
    try {
      const count = await prisma.capacitacion.count();
      if (count === 0) {
        console.log("Inicializando capacitaciones institucionales en base de datos...");
        for (const item of INITIAL_SEED_CAPACITACIONES) {
          const contenidoPayload = {
            temario: item.temario,
            modalidad: item.modalidad,
            tipoRecurso: item.tipoRecurso,
            horario: item.horario,
            ubicacion: item.ubicacion,
            disertantes: item.disertantes,
            archivoTipo: item.archivoTipo,
            archivoNombre: item.archivoNombre,
            archivoTamano: item.archivoTamano,
            archivoUrl: "",
            videoUrl: item.videoUrl || "",
            imagenUrl: "",
          };

          await prisma.capacitacion.create({
            data: {
              titulo: item.titulo,
              descripcion: item.descripcion,
              contenido: JSON.stringify(contenidoPayload),
              videoUrl: item.videoUrl || null,
              enlaceUrl: null,
              fechaInicio: item.fechaInicio,
              fechaFin: item.fechaFin,
              estado: item.estado,
              activo: item.activo,
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.warn("Aviso en auto-seed de capacitaciones:", error.message);
    }
  }

  /**
   * Obtener todas las capacitaciones para el CMS
   */
  async obtenerCapacitaciones() {
    await this._asegurarDatosIniciales();
    const capacitaciones = await prisma.capacitacion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        archivo: true,
      },
    });

    return capacitaciones.map((c) => this._formatCapacitacion(c));
  }

  /**
   * Obtener capacitaciones publicadas para el Portal Público
   */
  async obtenerCapacitacionesPublicas() {
    await this._asegurarDatosIniciales();
    const capacitaciones = await prisma.capacitacion.findMany({
      where: {
        estado: "PUBLICADO",
        activo: true,
      },
      orderBy: { createdAt: "desc" },
      include: {
        archivo: true,
      },
    });

    return capacitaciones.map((c) => this._formatCapacitacion(c));
  }

  /**
   * Crear una capacitación desde el CMS
   */
  async crearCapacitacion(data, file) {
    if (!data.titulo || !data.titulo.trim()) {
      const error = new Error("El título de la capacitación es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    let imagenId = null;
    let archivoTipoDetectado = data.archivoTipo || "";
    let incomingVideoUrl = (data.videoUrl && typeof data.videoUrl === "string" && !data.videoUrl.startsWith("blob:")) ? data.videoUrl.trim() : "";
    let incomingArchivoUrl = (data.archivoUrl && typeof data.archivoUrl === "string" && !data.archivoUrl.startsWith("blob:")) ? data.archivoUrl.trim() : "";

    let archivoUrl = incomingArchivoUrl;
    let videoUrl = incomingVideoUrl;
    let archivoNombre = data.archivoNombre || "";
    let archivoTamano = data.archivoTamano || "";

    // 1. Procesar archivo si se subió documento, imagen o video
    if (file) {
      const extension = (file.originalname.split(".").pop() || "").toLowerCase();
      const isDoc =
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(extension) ||
        file.mimetype.includes("pdf") ||
        file.mimetype.includes("word") ||
        file.mimetype.includes("officedocument");
      const isVideo = ["mp4", "webm", "mov", "avi", "mkv"].includes(extension) || file.mimetype.startsWith("video/");
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension) || file.mimetype.startsWith("image/");

      if (isDoc) archivoTipoDetectado = "documento";
      else if (isVideo) archivoTipoDetectado = "video";
      else if (isImage) archivoTipoDetectado = "imagen";

      const bucket = isDoc ? DOCS_BUCKET : MEDIA_BUCKET;
      const { nombreUnico } = generarNombreUnico(file.originalname, `cap_${archivoTipoDetectado || "file"}`);

      try {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .upload(nombreUnico, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error(`Error en Supabase al subir a ${bucket}:`, storageError.message);
          throw new Error(`Error en Supabase Storage (${bucket}): ${storageError.message}`);
        } else {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(nombreUnico);
          archivoUrl = pubData?.publicUrl || "";
          if (isVideo) {
            videoUrl = archivoUrl;
          }
        }
      } catch (err) {
        console.error("Excepción al subir archivo a Supabase:", err);
        throw err;
      }

      archivoNombre = file.originalname;
      archivoTamano = formatBytes(file.size);

      // Guardar en tabla archivo
      try {
        const nuevoArchivoDb = await prisma.archivo.create({
          data: {
            nombreOriginal: file.originalname,
            nombreArchivo: nombreUnico,
            ruta: `${bucket}/${nombreUnico}`,
            extension: extension || "bin",
            mimeType: file.mimetype,
            tamanioBytes: BigInt(file.size || 0),
          },
        });
        imagenId = nuevoArchivoDb.id;
      } catch (err) {
        console.warn("Aviso al guardar en tabla archivo:", err.message);
      }
    }

    // 2. Fechas
    let fechaInicioDate = null;
    if (data.fechaInicio) {
      const parsed = new Date(data.fechaInicio);
      if (!isNaN(parsed.getTime())) fechaInicioDate = parsed;
    }

    let fechaFinDate = null;
    if (data.fechaFin) {
      const parsed = new Date(data.fechaFin);
      if (!isNaN(parsed.getTime())) fechaFinDate = parsed;
    }

    // 3. Normalizar estado
    let estadoNormalizado = "PUBLICADO";
    if (data.estado) {
      const upper = data.estado.toUpperCase();
      if (["PUBLICADO", "BORRADOR", "ARCHIVADO"].includes(upper)) {
        estadoNormalizado = upper;
      }
    }

    const finalVideoUrl = videoUrl || (archivoTipoDetectado === "video" ? archivoUrl : null);

    // 4. Payload extendido en campo contenido (JSON)
    const contenidoPayload = {
      temario: data.contenido || data.temario || "",
      modalidad: data.modalidad || "Presencial",
      tipoRecurso: data.tipoRecurso || (archivoTipoDetectado === "video" ? "video" : archivoTipoDetectado === "documento" ? "pdf" : "presencial"),
      horario: data.horario || "10:00",
      ubicacion: data.ubicacion || "Hospital Interdistrital Evita",
      disertantes: data.disertantes || "",
      archivoTipo: archivoTipoDetectado,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: finalVideoUrl || "",
      imagenUrl: archivoTipoDetectado === "imagen" ? archivoUrl : (data.imagenUrl || ""),
    };

    const nueva = await prisma.capacitacion.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        videoUrl: finalVideoUrl,
        enlaceUrl: data.enlaceUrl || null,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        estado: estadoNormalizado,
        activo: data.activo !== undefined ? (data.activo === true || data.activo === "true") : true,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    return {
      message: "Capacitación creada con éxito.",
      capacitacion: this._formatCapacitacion(nueva),
    };
  }

  /**
   * Actualizar una capacitación existente
   */
  async actualizarCapacitacion(id, data, file) {
    const idBigInt = BigInt(id);
    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("La capacitación solicitada no existe.");
      error.statusCode = 404;
      throw error;
    }

    let extra = {};
    if (existing.contenido) {
      try {
        extra = JSON.parse(existing.contenido);
      } catch {
        extra = { temario: existing.contenido };
      }
    }

    let imagenId = existing.imagenId;
    let archivoTipoDetectado = data.archivoTipo || extra.archivoTipo || "";
    let cleanExistingArchivo = extra.archivoUrl && !extra.archivoUrl.startsWith("blob:") ? extra.archivoUrl : "";
    let cleanIncomingArchivo = data.archivoUrl && !data.archivoUrl.startsWith("blob:") ? data.archivoUrl : "";
    let archivoUrl = cleanIncomingArchivo || cleanExistingArchivo || "";
    let archivoNombre = extra.archivoNombre || data.archivoNombre || "";
    let archivoTamano = extra.archivoTamano || data.archivoTamano || "";

    let cleanExistingVideo = existing.videoUrl && !existing.videoUrl.startsWith("blob:") ? existing.videoUrl : "";
    let cleanIncomingVideo = data.videoUrl && !data.videoUrl.startsWith("blob:") ? data.videoUrl : "";
    let videoUrl = cleanIncomingVideo !== undefined ? cleanIncomingVideo : cleanExistingVideo;

    // Si se subió un nuevo archivo
    if (file) {
      const extension = (file.originalname.split(".").pop() || "").toLowerCase();
      const isDoc =
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(extension) ||
        file.mimetype.includes("pdf") ||
        file.mimetype.includes("word") ||
        file.mimetype.includes("officedocument");
      const isVideo = ["mp4", "webm", "mov", "avi", "mkv"].includes(extension) || file.mimetype.startsWith("video/");
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension) || file.mimetype.startsWith("image/");

      if (isDoc) archivoTipoDetectado = "documento";
      else if (isVideo) archivoTipoDetectado = "video";
      else if (isImage) archivoTipoDetectado = "imagen";

      const bucket = isDoc ? DOCS_BUCKET : MEDIA_BUCKET;
      const { nombreUnico } = generarNombreUnico(file.originalname, `cap_${archivoTipoDetectado || "file"}`);

      try {
        if (existing.archivo?.nombreArchivo) {
          const prevBucket = existing.archivo.ruta?.startsWith(DOCS_BUCKET) ? DOCS_BUCKET : MEDIA_BUCKET;
          await supabase.storage.from(prevBucket).remove([existing.archivo.nombreArchivo]).catch(() => {});
        }

        const { error: storageError } = await supabase.storage
          .from(bucket)
          .upload(nombreUnico, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error(`Error en Supabase al subir a ${bucket}:`, storageError.message);
          throw new Error(`Error en Supabase Storage (${bucket}): ${storageError.message}`);
        } else {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(nombreUnico);
          archivoUrl = pubData?.publicUrl || "";
          if (isVideo) {
            videoUrl = archivoUrl;
          }
        }
      } catch (err) {
        console.error("Excepción al subir archivo a Supabase:", err);
        throw err;
      }

      archivoNombre = file.originalname;
      archivoTamano = formatBytes(file.size);

      try {
        const nuevoArchivoDb = await prisma.archivo.create({
          data: {
            nombreOriginal: file.originalname,
            nombreArchivo: nombreUnico,
            ruta: `${bucket}/${nombreUnico}`,
            extension: extension || "bin",
            mimeType: file.mimetype,
            tamanioBytes: BigInt(file.size || 0),
          },
        });
        imagenId = nuevoArchivoDb.id;
      } catch (err) {
        console.warn("Aviso al registrar archivo en base de datos:", err.message);
      }
    }

    // Fechas
    let fechaInicioDate = existing.fechaInicio;
    if (data.fechaInicio !== undefined) {
      if (data.fechaInicio) {
        const parsed = new Date(data.fechaInicio);
        if (!isNaN(parsed.getTime())) fechaInicioDate = parsed;
      } else {
        fechaInicioDate = null;
      }
    }

    let fechaFinDate = existing.fechaFin;
    if (data.fechaFin !== undefined) {
      if (data.fechaFin) {
        const parsed = new Date(data.fechaFin);
        if (!isNaN(parsed.getTime())) fechaFinDate = parsed;
      } else {
        fechaFinDate = null;
      }
    }

    // Normalizar estado
    let estadoNormalizado = existing.estado;
    if (data.estado) {
      const upper = data.estado.toUpperCase();
      if (["PUBLICADO", "BORRADOR", "ARCHIVADO"].includes(upper)) {
        estadoNormalizado = upper;
      }
    }

    const finalVideoUrl = videoUrl || (archivoTipoDetectado === "video" ? archivoUrl : null);

    const contenidoPayload = {
      temario: data.contenido !== undefined ? data.contenido : (extra.temario || ""),
      modalidad: data.modalidad || extra.modalidad || "Presencial",
      tipoRecurso: data.tipoRecurso || extra.tipoRecurso || "presencial",
      horario: data.horario || extra.horario || "10:00",
      ubicacion: data.ubicacion || extra.ubicacion || "Hospital Interdistrital Evita",
      disertantes: data.disertantes !== undefined ? data.disertantes : (extra.disertantes || ""),
      archivoTipo: archivoTipoDetectado,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: finalVideoUrl || "",
      imagenUrl: archivoTipoDetectado === "imagen" ? archivoUrl : (data.imagenUrl || extra.imagenUrl || ""),
    };

    const updated = await prisma.capacitacion.update({
      where: { id: idBigInt },
      data: {
        titulo: data.titulo ? data.titulo.trim() : existing.titulo,
        descripcion: data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : null) : existing.descripcion,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        videoUrl: finalVideoUrl,
        enlaceUrl: data.enlaceUrl !== undefined ? data.enlaceUrl : existing.enlaceUrl,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        estado: estadoNormalizado,
        activo: data.activo !== undefined ? (data.activo === true || data.activo === "true") : existing.activo,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    return {
      message: "Capacitación actualizada con éxito.",
      capacitacion: this._formatCapacitacion(updated),
    };
  }

  /**
   * Cambiar estado directamente (Publicado, Borrador, Archivado)
   */
  async cambiarEstado(id, nuevoEstado) {
    const idBigInt = BigInt(id);
    const upper = (nuevoEstado || "").toUpperCase();
    if (!["PUBLICADO", "BORRADOR", "ARCHIVADO"].includes(upper)) {
      const error = new Error("Estado no válido.");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.capacitacion.update({
      where: { id: idBigInt },
      data: {
        estado: upper,
        updatedAt: new Date(),
      },
      include: { archivo: true },
    });

    return {
      message: `Estado actualizado a ${upper}.`,
      capacitacion: this._formatCapacitacion(updated),
    };
  }

  /**
   * Eliminar una capacitación
   */
  async eliminarCapacitacion(id) {
    const idBigInt = BigInt(id);
    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("Capacitación no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Intentar limpiar archivo de Supabase si existe
    if (existing.archivo?.nombreArchivo) {
      try {
        const bucket = existing.archivo.ruta?.startsWith(DOCS_BUCKET) ? DOCS_BUCKET : MEDIA_BUCKET;
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
      } catch {}
    }

    return {
      message: "Capacitación eliminada con éxito.",
      id: id.toString(),
    };
  }

  /**
   * Formateador unificado de capacitación para CMS y Frontend
   */
  _formatCapacitacion(c) {
    let extra = {
      temario: "",
      modalidad: "Presencial",
      tipoRecurso: "presencial",
      horario: "10:00",
      ubicacion: "Hospital Interdistrital Evita",
      disertantes: "",
      archivoTipo: "",
      archivoNombre: "",
      archivoTamano: "",
      archivoUrl: "",
      videoUrl: "",
      imagenUrl: "",
    };

    if (c.contenido) {
      try {
        const parsed = JSON.parse(c.contenido);
        if (typeof parsed === "object" && parsed !== null) {
          extra = { ...extra, ...parsed };
        }
      } catch {
        extra.temario = c.contenido;
      }
    }

    // Resolver URL pública en Supabase si c.archivo existe y falta archivoUrl
    let archivoUrl = extra.archivoUrl || "";
    let archivoNombre = extra.archivoNombre || c.archivo?.nombreOriginal || "";
    let archivoTamano = extra.archivoTamano || (c.archivo?.tamanioBytes ? formatBytes(c.archivo.tamanioBytes) : "");
    let archivoTipo = extra.archivoTipo || "";

    if (c.archivo && !archivoUrl) {
      const bucket = c.archivo.ruta && c.archivo.ruta.startsWith(DOCS_BUCKET) ? DOCS_BUCKET : MEDIA_BUCKET;
      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(c.archivo.nombreArchivo);
      archivoUrl = pubData?.publicUrl || "";
    }

    if (!archivoTipo) {
      if (c.archivo?.extension) {
        const ext = c.archivo.extension.toLowerCase();
        if (["mp4", "webm", "mov"].includes(ext)) archivoTipo = "video";
        else if (["jpg", "jpeg", "png", "webp"].includes(ext)) archivoTipo = "imagen";
        else archivoTipo = "documento";
      } else if (c.videoUrl) {
        archivoTipo = "video";
      }
    }

    if (archivoUrl && archivoUrl.startsWith("blob:")) {
      archivoUrl = "";
    }

    let rawVideo = c.videoUrl || extra.videoUrl || (archivoTipo === "video" ? archivoUrl : "");
    if (rawVideo && rawVideo.startsWith("blob:")) {
      rawVideo = "";
    }
    const finalVideoUrl = rawVideo;
    const finalImagenUrl = (archivoTipo === "imagen" ? archivoUrl : "") || extra.imagenUrl || "";

    return {
      id: c.id.toString(),
      titulo: c.titulo,
      descripcion: c.descripcion || "",
      contenido: extra.temario || c.descripcion || "",
      temario: extra.temario || "",
      modalidad: extra.modalidad || "Presencial",
      tipoRecurso: extra.tipoRecurso || (archivoTipo === "video" ? "video" : archivoTipo === "documento" ? "pdf" : "presencial"),
      fechaInicio: c.fechaInicio ? c.fechaInicio.toISOString().split("T")[0] : "",
      fechaFin: c.fechaFin ? c.fechaFin.toISOString().split("T")[0] : "",
      horario: extra.horario || "10:00",
      ubicacion: extra.ubicacion || "Hospital Interdistrital Evita",
      disertantes: extra.disertantes || "",
      videoUrl: finalVideoUrl,
      archivoTipo,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      imagenUrl: finalImagenUrl,
      estado: c.estado,
      activo: c.activo,
      createdAt: c.createdAt ? c.createdAt.toISOString() : "",
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : "",
    };
  }
}

export default new CmsCapacitacionService();
