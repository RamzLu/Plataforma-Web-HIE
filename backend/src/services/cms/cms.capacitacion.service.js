import { registrarFalla } from "../../utils/log.utils.js";
import { asegurarQueSePuedeEliminar } from "../../utils/eliminacion.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { validarUrlHttp, sanitizarUrlLectura, parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { calcularCambios } from "../../utils/cambios.utils.js";

const DOCS_BUCKET = "capacitaciones-documentos";
const MEDIA_BUCKET = "capacitaciones-imagenes-videos";
const CAPACITACION_PENDING_META_PREFIX = "capacitacion_pending_meta_";
const CAPACITACION_REJECTION_KEY_PREFIX = "capacitacion_rejection_reason_";

const normalizarUrlOpcional = (rawUrl, nombreCampo) => {
  if (rawUrl === null || rawUrl === undefined) return "";
  if (typeof rawUrl === "string" && rawUrl.trim().startsWith("blob:")) return "";
  return validarUrlHttp(rawUrl, nombreCampo);
};

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
    ubicacion: "Plataforma Telesalud HIE (Video)",
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

  async obtenerMapaMotivosRechazo() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: CAPACITACION_REJECTION_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(CAPACITACION_REJECTION_KEY_PREFIX, "");
        map.set(itemKey, item.valor);
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarMotivoRechazo(id, motivo) {
    const clave = `${CAPACITACION_REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: motivo, updatedAt: new Date() },
      create: {
        clave,
        valor: motivo,
        descripcion: `Motivo de rechazo de capacitación ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarMotivoRechazo(id) {
    const clave = `${CAPACITACION_REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerMapaPendingMeta() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: CAPACITACION_PENDING_META_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(CAPACITACION_PENDING_META_PREFIX, "");
        try {
          map.set(itemKey, JSON.parse(item.valor));
        } catch {
          // JSON inválido: se ignora y se usa el valor por defecto.
        }
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarPendingMeta(id, meta) {
    const clave = `${CAPACITACION_PENDING_META_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: JSON.stringify(meta), updatedAt: new Date() },
      create: {
        clave,
        valor: JSON.stringify(meta),
        descripcion: `Metadatos de solicitud pendiente para capacitación ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarPendingMeta(id) {
    const clave = `${CAPACITACION_PENDING_META_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerCapacitaciones() {
    await this._asegurarDatosIniciales();
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
      return this._formatCapacitacion(c, motivosMap.get(idStr), pendingMetaMap.get(idStr));
    });
  }

  async obtenerCapacitacionesPublicas() {
    await this._asegurarDatosIniciales();
    const [capacitaciones, pendingMetaMap] = await Promise.all([
      prisma.capacitacion.findMany({
        where: {
          OR: [
            { estado: "PUBLICADO", activo: true },
            { estado: "PENDIENTE_APROBACION", activo: true },
          ],
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
      const idStr = c.id.toString();
      const pMeta = pendingMetaMap.get(idStr);
      if (c.estado === "PENDIENTE_APROBACION" && pMeta?.previousEstado !== "PUBLICADO") {
        continue;
      }
      resultado.push(this._formatCapacitacion(c, null, pMeta));
    }
    return resultado;
  }

  async crearCapacitacion(data, files) {
    if (!data.titulo || !data.titulo.trim()) {
      const error = new Error("El título de la capacitación es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    const bannerFile = filesArray.find((f) => f.fieldname === "banner" || f.fieldname === "imagen");
    const contenidoFile = filesArray.find((f) => f.fieldname === "archivo" || f.fieldname === "contenido" || f.fieldname === "material");

    let imagenId = null;
    const rawBannerInput = data.bannerUrl !== undefined ? data.bannerUrl : data.imagenUrl;
    let bannerUrl = rawBannerInput !== undefined ? normalizarUrlOpcional(rawBannerInput, "URL de banner") : "";
    let bannerNombre = data.bannerNombre || "";

    if (bannerFile) {
      const { nombreUnico, extension: ext } = generarNombreUnico(
        bannerFile.originalname,
        "cap_banner",
        bannerFile.mimetype
      );

      try {
        const { error: storageError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(nombreUnico, bannerFile.buffer, {
            contentType: bannerFile.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error("Error al subir banner a Supabase:", storageError.message);
          const err = new Error("No se pudo almacenar el banner de la capacitación.");
          err.statusCode = 500;
          throw err;
        }

        const { data: pubData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(nombreUnico);
        bannerUrl = pubData?.publicUrl || "";
        bannerNombre = bannerFile.originalname;

        const nuevoArchivoDb = await prisma.archivo.create({
          data: {
            nombreOriginal: bannerFile.originalname,
            nombreArchivo: nombreUnico,
            ruta: `${MEDIA_BUCKET}/${nombreUnico}`,
            extension: ext,
            mimeType: bannerFile.mimetype,
            tamanioBytes: BigInt(bannerFile.size || 0),
          },
        });
        imagenId = nuevoArchivoDb.id;
      } catch (err) {
        console.error("Excepción al subir banner a Supabase:", err);
        throw err;
      }
    }

    let archivoTipoDetectado = data.archivoTipo || "";
    let incomingVideoUrl = normalizarUrlOpcional(data.videoUrl, "URL de video");
    let incomingArchivoUrl = normalizarUrlOpcional(data.archivoUrl, "URL de archivo");
    const enlaceUrlValidado = normalizarUrlOpcional(data.enlaceUrl, "URL de enlace") || null;

    let archivoUrl = incomingArchivoUrl;
    let videoUrl = incomingVideoUrl;
    let archivoNombre = data.archivoNombre || "";
    let archivoTamano = data.archivoTamano || "";

    if (contenidoFile) {
      const { extension } = generarNombreUnico(
        contenidoFile.originalname,
        "cap_check",
        contenidoFile.mimetype
      );
      const isDoc =
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) ||
        contenidoFile.mimetype.includes("pdf") ||
        contenidoFile.mimetype.includes("word") ||
        contenidoFile.mimetype.includes("officedocument");
      const isVideo = ["mp4", "webm"].includes(extension) || contenidoFile.mimetype.startsWith("video/");
      const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) || contenidoFile.mimetype.startsWith("image/");

      if (isDoc) archivoTipoDetectado = "documento";
      else if (isVideo) archivoTipoDetectado = "video";
      else if (isImage) archivoTipoDetectado = "imagen";

      const bucket = isDoc ? DOCS_BUCKET : MEDIA_BUCKET;
      const { nombreUnico } = generarNombreUnico(
        contenidoFile.originalname,
        `cap_${archivoTipoDetectado || "file"}`,
        contenidoFile.mimetype
      );

      try {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .upload(nombreUnico, contenidoFile.buffer, {
            contentType: contenidoFile.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error(`Error en Supabase al subir contenido a ${bucket}:`, storageError.message);
          const err = new Error("No se pudo almacenar el archivo de la capacitación.");
          err.statusCode = 500;
          throw err;
        } else {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(nombreUnico);
          archivoUrl = pubData?.publicUrl || "";
          if (isVideo) {
            videoUrl = archivoUrl;
          }
        }
      } catch (err) {
        console.error("Excepción al subir contenido a Supabase:", err);
        throw err;
      }

      archivoNombre = contenidoFile.originalname;
      archivoTamano = formatBytes(contenidoFile.size);
    }

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

    let estadoNormalizado = "PUBLICADO";
    if (data.estado) {
      const upper = data.estado.toUpperCase();
      if (["PUBLICADO", "BORRADOR", "ARCHIVADO"].includes(upper)) {
        estadoNormalizado = upper;
      }
    }

    const finalVideoUrl = videoUrl || (archivoTipoDetectado === "video" ? archivoUrl : null);

    const contenidoPayload = {
      temario: data.contenido || data.temario || "",
      modalidad: data.modalidad || "Presencial",
      tipoRecurso: data.tipoRecurso || (archivoTipoDetectado === "video" ? "video" : archivoTipoDetectado === "documento" ? "pdf" : archivoTipoDetectado === "imagen" ? "imagen" : "presencial"),
      horario: data.horario || "10:00",
      ubicacion: data.ubicacion || "Hospital Interdistrital Evita",
      disertantes: data.disertantes || "",
      archivoTipo: archivoTipoDetectado,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: finalVideoUrl || "",
      imagenUrl: bannerUrl,
      bannerUrl: bannerUrl,
      bannerNombre,
    };

    const nueva = await prisma.capacitacion.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        videoUrl: finalVideoUrl,
        enlaceUrl: enlaceUrlValidado,
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

  async actualizarCapacitacion(id, data, files) {
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

    let extra = {};
    if (existing.contenido) {
      try {
        extra = JSON.parse(existing.contenido);
      } catch {
        extra = { temario: existing.contenido };
      }
    }

    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    const bannerFile = filesArray.find((f) => f.fieldname === "banner" || f.fieldname === "imagen");
    const contenidoFile = filesArray.find((f) => f.fieldname === "archivo" || f.fieldname === "contenido" || f.fieldname === "material");

    let imagenId = existing.imagenId;
    let bannerUrl = sanitizarUrlLectura(extra.bannerUrl || extra.imagenUrl || "", "");
    if (data.bannerUrl !== undefined) {
      bannerUrl = normalizarUrlOpcional(data.bannerUrl, "URL de banner");
    }
    let bannerNombre = extra.bannerNombre || (existing.archivo?.nombreOriginal || "");

    if (data.eliminarBanner === "true" || data.eliminarBanner === true) {
      imagenId = null;
      bannerUrl = "";
      bannerNombre = "";
    }

    if (bannerFile) {
      const { nombreUnico, extension: ext } = generarNombreUnico(
        bannerFile.originalname,
        "cap_banner",
        bannerFile.mimetype
      );

      try {
        const { error: storageError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(nombreUnico, bannerFile.buffer, {
            contentType: bannerFile.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error("Error al subir banner a Supabase:", storageError.message);
          const err = new Error("No se pudo almacenar el banner de la capacitación.");
          err.statusCode = 500;
          throw err;
        }

        const { data: pubData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(nombreUnico);
        bannerUrl = pubData?.publicUrl || "";
        bannerNombre = bannerFile.originalname;

        const nuevoArchivoDb = await prisma.archivo.create({
          data: {
            nombreOriginal: bannerFile.originalname,
            nombreArchivo: nombreUnico,
            ruta: `${MEDIA_BUCKET}/${nombreUnico}`,
            extension: ext,
            mimeType: bannerFile.mimetype,
            tamanioBytes: BigInt(bannerFile.size || 0),
          },
        });
        imagenId = nuevoArchivoDb.id;
      } catch (err) {
        console.error("Excepción al subir banner a Supabase:", err);
        throw err;
      }
    }

    let archivoTipoDetectado = data.archivoTipo !== undefined ? data.archivoTipo : (extra.archivoTipo || "");
    let archivoUrl =
      data.archivoUrl !== undefined
        ? normalizarUrlOpcional(data.archivoUrl, "URL de archivo")
        : sanitizarUrlLectura(extra.archivoUrl || "", "");
    let archivoNombre = data.archivoNombre !== undefined ? data.archivoNombre : (extra.archivoNombre || "");
    let archivoTamano = data.archivoTamano !== undefined ? data.archivoTamano : (extra.archivoTamano || "");

    if (data.eliminarArchivo === "true" || data.eliminarArchivo === true) {
      archivoTipoDetectado = "";
      archivoUrl = "";
      archivoNombre = "";
      archivoTamano = "";
    }

    const cleanExistingVideo =
      existing.videoUrl && !existing.videoUrl.startsWith("blob:")
        ? sanitizarUrlLectura(existing.videoUrl, "")
        : "";
    let videoUrl =
      data.videoUrl !== undefined
        ? normalizarUrlOpcional(data.videoUrl, "URL de video")
        : cleanExistingVideo;
    const enlaceUrlActualizado =
      data.enlaceUrl !== undefined
        ? normalizarUrlOpcional(data.enlaceUrl, "URL de enlace") || null
        : (sanitizarUrlLectura(existing.enlaceUrl, null) || null);

    if (contenidoFile) {
      const { extension } = generarNombreUnico(
        contenidoFile.originalname,
        "cap_check",
        contenidoFile.mimetype
      );
      const isDoc =
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) ||
        contenidoFile.mimetype.includes("pdf") ||
        contenidoFile.mimetype.includes("word") ||
        contenidoFile.mimetype.includes("officedocument");
      const isVideo = ["mp4", "webm"].includes(extension) || contenidoFile.mimetype.startsWith("video/");
      const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) || contenidoFile.mimetype.startsWith("image/");

      if (isDoc) {
        archivoTipoDetectado = "documento";
        videoUrl = "";
      } else if (isVideo) {
        archivoTipoDetectado = "video";
      } else if (isImage) {
        archivoTipoDetectado = "imagen";
        videoUrl = "";
      }

      const bucket = isDoc ? DOCS_BUCKET : MEDIA_BUCKET;
      const { nombreUnico } = generarNombreUnico(
        contenidoFile.originalname,
        `cap_${archivoTipoDetectado || "file"}`,
        contenidoFile.mimetype
      );

      try {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .upload(nombreUnico, contenidoFile.buffer, {
            contentType: contenidoFile.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error(`Error en Supabase al subir a ${bucket}:`, storageError.message);
          const err = new Error("No se pudo almacenar el archivo de la capacitación.");
          err.statusCode = 500;
          throw err;
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

      archivoNombre = contenidoFile.originalname;
      archivoTamano = formatBytes(contenidoFile.size);
    } else if (archivoTipoDetectado === "documento" || archivoTipoDetectado === "imagen") {
      videoUrl = "";
    }

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

    const finalVideoUrl = videoUrl || (archivoTipoDetectado === "video" ? archivoUrl : null);

    const contenidoPayload = {
      temario: data.contenido !== undefined ? data.contenido : (extra.temario || ""),
      modalidad: data.modalidad || extra.modalidad || "Presencial",
      tipoRecurso: archivoTipoDetectado
        ? (archivoTipoDetectado === "video" ? "video" : archivoTipoDetectado === "documento" ? "pdf" : archivoTipoDetectado === "imagen" ? "imagen" : archivoTipoDetectado)
        : (data.tipoRecurso || extra.tipoRecurso || "presencial"),
      horario: data.horario || extra.horario || "10:00",
      ubicacion: data.ubicacion || extra.ubicacion || "Hospital Interdistrital Evita",
      disertantes: data.disertantes !== undefined ? data.disertantes : (extra.disertantes || ""),
      archivoTipo: archivoTipoDetectado,
      archivoNombre,
      archivoTamano,
      archivoUrl,
      videoUrl: finalVideoUrl || "",
      imagenUrl: bannerUrl,
      bannerUrl: bannerUrl,
      bannerNombre,
    };

    const idStr = id.toString();
    const estadoAnterior = (existing.estado || "").toUpperCase();
    const provieneDePublicada = estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";

    // Validación: verificar si hubo cambios reales antes de actualizar la capacitación
    const camposCapCheck = [
      { key: "titulo", label: "Título de la capacitación" },
      { key: "descripcion", label: "Descripción" },
      { key: "modalidad", label: "Modalidad" },
      { key: "horario", label: "Horario" },
      { key: "ubicacion", label: "Ubicación" },
      { key: "disertantes", label: "Disertantes" },
      { key: "temario", label: "Temario" },
      { key: "fechaInicio", label: "Fecha de inicio", tipo: "date" },
      { key: "fechaFin", label: "Fecha de fin", tipo: "date" },
      { key: "videoUrl", label: "URL de video" },
      { key: "enlaceUrl", label: "URL de enlace" },
    ];

    const cambiosCap = calcularCambios(
      {
        titulo: existing.titulo || "",
        descripcion: existing.descripcion || "",
        modalidad: extra.modalidad || "Presencial",
        horario: extra.horario || "10:00",
        ubicacion: extra.ubicacion || "Hospital Interdistrital Evita",
        disertantes: extra.disertantes || "",
        temario: extra.temario || "",
        fechaInicio: existing.fechaInicio,
        fechaFin: existing.fechaFin,
        videoUrl: existing.videoUrl || "",
        enlaceUrl: existing.enlaceUrl || "",
      },
      {
        titulo: data.titulo !== undefined ? data.titulo.trim() : (existing.titulo || ""),
        descripcion: data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : "") : (existing.descripcion || ""),
        modalidad: contenidoPayload.modalidad,
        horario: contenidoPayload.horario,
        ubicacion: contenidoPayload.ubicacion,
        disertantes: contenidoPayload.disertantes,
        temario: contenidoPayload.temario,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        videoUrl: finalVideoUrl || "",
        enlaceUrl: enlaceUrlActualizado || "",
      },
      camposCapCheck
    );

    const bannerModificado = Boolean(bannerFile || data.eliminarBanner === "true" || data.eliminarBanner === true);
    const archivoModificado = Boolean(contenidoFile || data.eliminarArchivo === "true" || data.eliminarArchivo === true);
    const estadoModificado = Boolean(data.estado && data.estado.toUpperCase() !== estadoAnterior);

    if (cambiosCap.length === 0 && !bannerModificado && !archivoModificado && !estadoModificado) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    let estadoNormalizado = existing.estado;
    let activoFinal = data.activo !== undefined ? (data.activo === true || data.activo === "true") : existing.activo;

    if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (estadoUpper === "ARCHIVADO" && provieneDePublicada) {
        estadoNormalizado = "PENDIENTE_APROBACION";
        await this.guardarPendingMeta(idStr, {
          previousEstado: "PUBLICADO",
          targetEstado: "ARCHIVADO",
          updatedAt: new Date().toISOString(),
        });
        await this.limpiarMotivoRechazo(idStr);
      } else if (["PUBLICADO", "BORRADOR", "ARCHIVADO", "PENDIENTE_APROBACION", "PROGRAMADO"].includes(estadoUpper)) {
        estadoNormalizado = estadoUpper;
        if (estadoUpper === "ARCHIVADO") {
          activoFinal = false;
        }
      }
    }

    const updated = await prisma.capacitacion.update({
      where: { id: idBigInt },
      data: {
        titulo: data.titulo ? data.titulo.trim() : existing.titulo,
        descripcion: data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : null) : existing.descripcion,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        videoUrl: finalVideoUrl,
        enlaceUrl: enlaceUrlActualizado,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
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

    return {
      message:
        data.estado && data.estado.toUpperCase() === "ARCHIVADO" && estadoNormalizado === "PENDIENTE_APROBACION"
          ? "Solicitud de archivado enviada a revisión del administrador."
          : "Capacitación actualizada con éxito.",
      capacitacion: this._formatCapacitacion(updated, motivoActual, pendingMetaActual),
    };
  }

  async cambiarEstado(id, nuevoEstado, user = null, rejectionReason = null, { esAdmin = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de capacitación");
    const idStr = id.toString();
    const upper = (nuevoEstado || "").toUpperCase();
    const estadosValidos = ["PUBLICADO", "BORRADOR", "ARCHIVADO", "APROBADO", "RECHAZADO", "PENDIENTE_APROBACION"];
    if (!estadosValidos.includes(upper)) {
      const error = new Error(`Estado no válido: ${nuevoEstado}`);
      error.statusCode = 400;
      throw error;
    }

    const existing = await prisma.capacitacion.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existing) {
      const error = new Error("Capacitación no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const estadoAnterior = (existing.estado || "").toUpperCase();
    const provieneDePublicada = estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";

    const pendingMap = await this.obtenerMapaPendingMeta();
    const metaExistente = pendingMap.get(idStr) || null;

    // Solo el administrador aprueba o rechaza. Si el CM pide publicar, se envía a revisión.
    if (!esAdmin && (upper === "APROBADO" || upper === "RECHAZADO")) {
      const error = new Error("Solo el administrador puede aprobar o rechazar.");
      error.statusCode = 403;
      throw error;
    }
    const esSolicitudDeRevision =
      !esAdmin && ["PUBLICADO", "PROGRAMADO", "PENDIENTE_APROBACION"].includes(upper);

    let finalEstado = upper;
    let finalActivo = existing.activo;

    // 0. El CM pide publicar: queda pendiente hasta que el administrador lo apruebe.
    if (esSolicitudDeRevision) {
      finalEstado = provieneDePublicada && upper !== "PENDIENTE_APROBACION" ? estadoAnterior : "PENDIENTE_APROBACION";
      if (finalEstado === "PENDIENTE_APROBACION") {
        await this.guardarPendingMeta(idStr, {
          ...(metaExistente || {}),
          previousEstado: metaExistente?.previousEstado ?? (estadoAnterior || null),
          targetEstado: upper === "PROGRAMADO" ? "PROGRAMADO" : "PUBLICADO",
          updatedAt: new Date().toISOString(),
        });
        await this.limpiarMotivoRechazo(idStr);
      }
    }
    // 1. Solicitud de archivado de algo publicado -> requiere aprobación Admin
    else if (upper === "ARCHIVADO" && provieneDePublicada) {
      finalEstado = "PENDIENTE_APROBACION";
      await this.guardarPendingMeta(idStr, {
        previousEstado: "PUBLICADO",
        targetEstado: "ARCHIVADO",
        updatedAt: new Date().toISOString(),
      });
      await this.limpiarMotivoRechazo(idStr);
    }
    // 2. Aprobación por parte de Admin (APROBADO o PUBLICADO):
    else if (upper === "APROBADO" || upper === "PUBLICADO") {
      if (metaExistente?.targetEstado === "ARCHIVADO") {
        finalEstado = "ARCHIVADO";
        finalActivo = false;
      } else {
        finalEstado = "PUBLICADO";
        finalActivo = true;
      }
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }
    // 3. Rechazo por parte de Admin:
    else if (upper === "RECHAZADO") {
      finalEstado = "RECHAZADO";
      const motivo = (rejectionReason || "").trim() || "Solicitud rechazada por el administrador.";
      await this.guardarMotivoRechazo(idStr, motivo);
      await this.limpiarPendingMeta(idStr);
    }
    // 4. Archivado de un borrador directamente:
    else if (upper === "ARCHIVADO") {
      finalEstado = "ARCHIVADO";
      finalActivo = false;
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }
    // 5. Otros:
    else {
      finalEstado = upper;
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

    let mensaje = `Estado actualizado a ${finalEstado}.`;
    if (upper === "ARCHIVADO" && finalEstado === "PENDIENTE_APROBACION") {
      mensaje = "Solicitud de archivado enviada a revisión del administrador.";
    } else if (esSolicitudDeRevision && finalEstado === "PENDIENTE_APROBACION") {
      mensaje = "Capacitación enviada a revisión del administrador para su publicación.";
    } else if (esSolicitudDeRevision) {
      mensaje = "La capacitación ya está publicada.";
    }

    return {
      message: mensaje,
      capacitacion: this._formatCapacitacion(updated, motivoActual, pendingMetaActual),
    };
  }

  async eliminarCapacitacion(id) {
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

    asegurarQueSePuedeEliminar(existing, (await this.obtenerMapaPendingMeta()).get(id.toString()) || null);

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
      } catch (error) {
        registrarFalla("Archivos", error);
      }
    }

    return {
      message: "Capacitación eliminada con éxito.",
      id: id.toString(),
    };
  }

  _formatCapacitacion(c, motivoRechazo = null, pendingMeta = null) {
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

    let bannerUrl = extra.bannerUrl || extra.imagenUrl || "";
    let bannerNombre = extra.bannerNombre || "";

    if (c.archivo && !bannerUrl) {
      const { data: pubData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(c.archivo.nombreArchivo);
      bannerUrl = pubData?.publicUrl || "";
      if (!bannerNombre) bannerNombre = c.archivo.nombreOriginal || "";
    }
    if (bannerUrl && bannerUrl.startsWith("blob:")) {
      bannerUrl = "";
    }

    let archivoUrl = extra.archivoUrl || "";
    let archivoNombre = extra.archivoNombre || "";
    let archivoTamano = extra.archivoTamano || "";
    let archivoTipo = extra.archivoTipo || "";

    if (archivoUrl && archivoUrl.startsWith("blob:")) {
      archivoUrl = "";
    }

    if (!archivoTipo && archivoUrl) {
      if (archivoUrl.match(/\.(mp4|webm|mov|mkv)$/i)) archivoTipo = "video";
      else if (archivoUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) archivoTipo = "imagen";
      else if (archivoUrl.match(/\.(pdf|doc|docx)$/i)) archivoTipo = "documento";
    }

    let rawVideo;
    if (archivoTipo === "documento" || archivoTipo === "imagen") {
      rawVideo = "";
    } else if (archivoTipo === "video") {
      rawVideo = extra.videoUrl || archivoUrl || c.videoUrl || "";
    } else {
      rawVideo = c.videoUrl || extra.videoUrl || "";
    }
    if (rawVideo && rawVideo.startsWith("blob:")) {
      rawVideo = "";
    }
    const finalVideoUrl = sanitizarUrlLectura(rawVideo, "");
    const safeArchivoUrl = sanitizarUrlLectura(archivoUrl, "");
    const safeBannerUrl = sanitizarUrlLectura(bannerUrl, "");

    const resolvedTipoRecurso = archivoTipo === "video"
      ? "video"
      : archivoTipo === "documento"
      ? "pdf"
      : archivoTipo === "imagen"
      ? "imagen"
      : (extra.tipoRecurso || "presencial");

    return {
      id: c.id.toString(),
      titulo: c.titulo,
      descripcion: c.descripcion || "",
      contenido: extra.temario || c.descripcion || "",
      temario: extra.temario || "",
      modalidad: extra.modalidad || "Presencial",
      tipoRecurso: resolvedTipoRecurso,
      fechaInicio: c.fechaInicio ? c.fechaInicio.toISOString().split("T")[0] : "",
      fechaFin: c.fechaFin ? c.fechaFin.toISOString().split("T")[0] : "",
      horario: extra.horario || "10:00",
      ubicacion: extra.ubicacion || "Hospital Interdistrital Evita",
      disertantes: extra.disertantes || "",
      videoUrl: finalVideoUrl,
      archivoTipo,
      archivoNombre,
      archivoTamano,
      archivoUrl: safeArchivoUrl,
      bannerUrl: safeBannerUrl,
      bannerNombre,
      imagenUrl: safeBannerUrl,
      estado: c.estado,
      activo: c.activo,
      createdAt: c.createdAt ? c.createdAt.toISOString() : "",
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : "",

      requestedEstado: (c.estado || "").toUpperCase() === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
      motivoRechazo: motivoRechazo || null,
      rejectionReason: motivoRechazo || null,
    };
  }
}

export default new CmsCapacitacionService();
