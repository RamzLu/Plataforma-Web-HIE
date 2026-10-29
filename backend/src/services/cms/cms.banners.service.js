import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd3Vwd21ieWd0eWlsdWV6emxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDM2MDUsImV4cCI6MjEwMjcxOTYwNX0.ytya9DiAojD-DbQ0kDmr_nojF4GUp7XaFLsUIRH2sWE"
);

const BANNERS_BUCKET = "banners-imagenes";
const DEFAULT_SYSTEM_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ESTADOS_VALIDOS = [
  "BORRADOR",
  "PENDIENTE_APROBACION",
  "RECHAZADO",
  "APROBADO",
  "PUBLICADO",
  "ARCHIVADO",
  "PROGRAMADO",
];

/**
 * Definición semilla de los 8 Espacios Fijos del portal (Placeholders)
 */
const INITIAL_ESPACIOS_FIJOS = [
  {
    espacioKey: "espacio-banner-inicio",
    orden: 1,
    nombre: "Banner Principal de Inicio",
    descripcion: "Carrusel hero de bienvenida en la portada principal del portal",
    tipo: "Banner Principal",
    ubicacion: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Inicio",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-ini-1",
        url: "",
        altText:
          "Fachada principal del Hospital Interdistrital Evita de Formosa al amanecer",
        titulo:
          "Atención Médica de Alta Complejidad al Servicio de la Comunidad",
        enlaceTexto: "Conocer especialidades",
        enlaceUrl: "/especialidades",
        fileName: "portada_hospital_evita_1.jpg",
      },
      {
        id: "img-ini-2",
        url: "",
        altText:
          "Enfermera aplicando vacuna antigripal a adulto mayor en consultorio",
        titulo: "Campaña Provincial de Vacunación y Prevención 2026",
        enlaceTexto: "Ver cronograma",
        enlaceUrl: "/noticias",
        fileName: "campana_vacunacion_2026.jpg",
      },
      {
        id: "img-ini-3",
        url: "",
        altText:
          "Profesionales médicos realizando control clínico en sala equipada",
        titulo: "Gestión de Turnos y Consultorios Externos",
        enlaceTexto: "Solicitar información",
        enlaceUrl: "/documentacion",
        fileName: "consultorios_externos.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-seccion-pacientes",
    orden: 2,
    nombre: "Sección Pacientes y Comunidad",
    descripcion:
      "Contenedor visual destinado a guías de atención, turnos y orientación al paciente",
    tipo: "Sección Pacientes",
    ubicacion: "Sección Pacientes",
    dimensiones: "1200x675px",
    page: "Inicio",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-pac-1",
        url: "",
        altText:
          "Paciente recibiendo orientación en mesa de entradas del hospital",
        titulo: "",
        enlaceTexto: "Guía para el paciente",
        enlaceUrl: "/documentacion",
        fileName: "orientacion_pacientes.jpg",
      },
      {
        id: "img-pac-2",
        url: "",
        altText:
          "Donantes voluntarios en el Centro Provincial de Hemoterapia",
        titulo: "",
        enlaceTexto: "Requisitos para donar sangre",
        enlaceUrl: "/noticias",
        fileName: "banco_de_sangre.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-banner-especialidades",
    orden: 3,
    nombre: "Banner Principal de Especialidades",
    descripcion:
      "Cabecera visual de la página de Especialidades Médicas y Servicios",
    tipo: "Banner Principal",
    ubicacion: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Especialidades",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-esp-1",
        url: "",
        altText:
          "Sala de hemodinamia y equipamiento cardiovascular de última generación",
        titulo: "Servicios Médicos y Unidades de Alta Complejidad",
        enlaceTexto: "Explorar cartelera médica",
        enlaceUrl: "/profesionales",
        fileName: "cabecera_especialidades.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-galeria-especialidades",
    orden: 4,
    nombre: "Imagen de Pacientes y Consultorios",
    descripcion:
      "Espacio gráfico en sección media de Especialidades y Diagnóstico por Imágenes",
    tipo: "Sección Media",
    ubicacion: "Sección Media",
    dimensiones: "1280x720px",
    page: "Especialidades",
    estado: "RECHAZADO",
    activo: false,
    rejectionReason:
      "Falta incorporar el isologo institucional en la esquina inferior y verificar contraste de la segunda imagen del carrusel.",
    imagenes: [
      {
        id: "img-esp-med-1",
        url: "",
        altText:
          "Médica pediatra atendiendo a un paciente infantil en consultorio",
        titulo: "",
        enlaceTexto: "Ver servicio de pediatría",
        enlaceUrl: "/especialidades",
        fileName: "atencion_pediatrica.jpg",
      },
      {
        id: "img-esp-med-2",
        url: "",
        altText: "Equipo de resonancia magnética nuclear y consola técnica",
        titulo: "",
        enlaceTexto: "Diagnóstico por imágenes",
        enlaceUrl: "/especialidades",
        fileName: "resonador_magnetico.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-banner-capacitacion",
    orden: 5,
    nombre: "Banner Principal de Capacitación",
    descripcion:
      "Carrusel principal del área de Docencia, Investigación y Residencias",
    tipo: "Banner Principal",
    ubicacion: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Capacitación",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-cap-1",
        url: "",
        altText:
          "Equipo quirúrgico entrenando en centro de simulación clínica",
        titulo: "Formación Continua y Residencias Médicas de Excelencia",
        enlaceTexto: "Inscripciones abiertas",
        enlaceUrl: "/residencias",
        fileName: "residencias_cirugia.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-actividades-docencia",
    orden: 6,
    nombre: "Espacio Talleres y Simulación Clínica",
    descripcion:
      "Contenedor visual para jornadas hospitalarias y talleres de enfermería",
    tipo: "Sección Media",
    ubicacion: "Sección Media",
    dimensiones: "1200x675px",
    page: "Capacitación",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-cap-med-1",
        url: "",
        altText:
          "Auditorio institucional durante las jornadas de bioética hospitalaria",
        titulo: "",
        enlaceTexto: "Ver programa académico",
        enlaceUrl: "/capacitacion",
        fileName: "jornadas_bioetica.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-banner-institucional",
    orden: 7,
    nombre: "Banner Principal Institucional",
    descripcion: "Portada fija de la sección Acerca del Hospital y Autoridades",
    tipo: "Banner Principal",
    ubicacion: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Institucional",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-inst-1",
        url: "",
        altText:
          "Vista panorámica del edificio del Hospital Interdistrital Evita",
        titulo:
          "Nuestra Misión: Salud Pública con Equidad y Calidad Humana",
        enlaceTexto: "Conocer plano del hospital",
        enlaceUrl: "/plano",
        fileName: "institucional_fachada.jpg",
      },
    ],
  },
  {
    espacioKey: "espacio-derechos-pacientes",
    orden: 8,
    nombre: "Espacio Derechos de Pacientes y Bioseguridad",
    descripcion:
      "Contenedor gráfico informativo en pie de sección institucional",
    tipo: "Sección Pacientes",
    ubicacion: "Sección Pacientes",
    dimensiones: "1200x675px",
    page: "Institucional",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-inst-pac-1",
        url: "",
        altText:
          "Infografía sobre los derechos del paciente y consentimiento informado",
        titulo: "",
        enlaceTexto: "Descargar guía en PDF",
        enlaceUrl: "/documentacion",
        fileName: "derechos_paciente.jpg",
      },
    ],
  },
];

class CmsBannersService {
  /**
   * Resuelve un UUID válido para campos de auditoría (createdBy, updatedBy, approvedBy)
   */
  async _resolverUsuarioUuid(user) {
    if (user?.keycloakId && UUID_REGEX.test(user.keycloakId)) {
      return user.keycloakId;
    }
    try {
      const primerUsuario = await prisma.usuario.findFirst({
        select: { id: true },
      });
      if (primerUsuario?.id && UUID_REGEX.test(primerUsuario.id)) {
        return primerUsuario.id;
      }
    } catch {
      // Fallback silencioso a UUID de sistema
    }
    return DEFAULT_SYSTEM_UUID;
  }

  /**
   * Obtiene o crea un registro en `tipo_contenido_grafico`
   */
  async _obtenerOCrearTipo(nombre) {
    const cleanName = (nombre || "Banner Principal").trim();
    let tipo = await prisma.tipo_contenido_grafico.findUnique({
      where: { nombre: cleanName },
    });
    if (!tipo) {
      tipo = await prisma.tipo_contenido_grafico.create({
        data: {
          nombre: cleanName,
          descripcion: `Tipo de bloque gráfico: ${cleanName}`,
          activo: true,
        },
      });
    }
    return tipo;
  }

  /**
   * Obtiene o crea un registro en `ubicacion_contenido_grafico`
   */
  async _obtenerOCrearUbicacion(nombre) {
    const cleanName = (nombre || "Banner Principal").trim();
    let ubicacion = await prisma.ubicacion_contenido_grafico.findUnique({
      where: { nombre: cleanName },
    });
    if (!ubicacion) {
      ubicacion = await prisma.ubicacion_contenido_grafico.create({
        data: {
          nombre: cleanName,
          descripcion: `Ubicación fija en página: ${cleanName}`,
          activo: true,
        },
      });
    }
    return ubicacion;
  }

  /**
   * Auto-sembrado de los 8 Espacios Fijos si la tabla `contenido_grafico` está vacía
   */
  async _asegurarEspaciosIniciales() {
    try {
      const count = await prisma.contenido_grafico.count();
      if (count > 0) return;

      console.log(
        "Inicializando los 8 espacios gráficos fijos en la base de datos..."
      );
      const systemUuid = await this._resolverUsuarioUuid(null);

      for (const item of INITIAL_ESPACIOS_FIJOS) {
        const tipoDb = await this._obtenerOCrearTipo(item.tipo);
        const ubicacionDb = await this._obtenerOCrearUbicacion(item.ubicacion);
        const primaryImg = item.imagenes[0] || {};

        const metadataJson = {
          espacioKey: item.espacioKey,
          nombre: item.nombre,
          descripcion: item.descripcion,
          tipo: item.tipo,
          ubicacion: item.ubicacion,
          dimensiones: item.dimensiones,
          enlaceTexto: primaryImg.enlaceTexto || "",
          imagenes: item.imagenes,
        };

        await prisma.contenido_grafico.create({
          data: {
            titulo: item.nombre,
            descripcion: JSON.stringify(metadataJson),
            altText: primaryImg.altText || item.nombre,
            enlaceUrl: primaryImg.enlaceUrl || null,
            orden: item.orden,
            activo: item.activo,
            tipoId: tipoDb.id,
            ubicacionId: ubicacionDb.id,
            estado: item.estado,
            createdBy: systemUuid,
            rejectionReason: item.rejectionReason,
            pagina: item.page,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.warn(
        "Aviso en auto-seed de espacios de contenido gráfico:",
        error.message
      );
    }
  }

  /**
   * Resuelve la URL pública de un archivo almacenado en Supabase Storage
   */
  _obtenerUrlPublica(nombreArchivo) {
    if (!nombreArchivo) return "";
    const { data } = supabase.storage
      .from(BANNERS_BUCKET)
      .getPublicUrl(nombreArchivo);
    return data?.publicUrl || "";
  }

  /**
   * Formatea una fila de `contenido_grafico` en la estructura de Espacio Fijo para el CMS
   */
  _formatEspacio(row) {
    let extra = {
      espacioKey: `espacio-${row.id.toString()}`,
      nombre: row.titulo,
      descripcion: "",
      tipo: row.tipo_contenido_grafico?.nombre || "Banner Principal",
      ubicacion: row.ubicacion_contenido_grafico?.nombre || "Banner Principal",
      dimensiones: "1920x1080px",
      enlaceTexto: "",
      imagenes: [],
    };

    if (row.descripcion) {
      try {
        const parsed = JSON.parse(row.descripcion);
        if (parsed && typeof parsed === "object") {
          extra = { ...extra, ...parsed };
        }
      } catch {
        // Soporte para registros antiguos con descripción en texto plano
        if (row.descripcion.startsWith("[PAGE:")) {
          const parts = row.descripcion.split("]");
          extra.descripcion = parts.slice(1).join("]") || "";
        } else {
          extra.descripcion = row.descripcion;
        }
      }
    }

    const isBanner =
      extra.tipo === "Banner Principal" ||
      row.tipo_contenido_grafico?.nombre === "Banner Principal";

    if (!extra.dimensiones) {
      extra.dimensiones = isBanner ? "1920x1080px" : "1200x675px";
    }

    const primaryFileUrl = row.archivo?.nombreArchivo
      ? this._obtenerUrlPublica(row.archivo.nombreArchivo)
      : "";

    let imagenesFormateadas = [];
    if (Array.isArray(extra.imagenes) && extra.imagenes.length > 0) {
      imagenesFormateadas = extra.imagenes.map((img, idx) => {
        let resolvedUrl = img.url || "";
        if (resolvedUrl.startsWith("blob:")) {
          resolvedUrl = "";
        }
        if (!resolvedUrl && img.nombreArchivo) {
          resolvedUrl = this._obtenerUrlPublica(img.nombreArchivo);
        }
        if (!resolvedUrl && idx === 0 && primaryFileUrl) {
          resolvedUrl = primaryFileUrl;
        }

        return {
          id: img.id || `img-${row.id.toString()}-${idx + 1}`,
          url: resolvedUrl,
          archivoId: img.archivoId ? img.archivoId.toString() : null,
          nombreArchivo: img.nombreArchivo || null,
          fileName:
            img.fileName ||
            row.archivo?.nombreOriginal ||
            `imagen_${idx + 1}.jpg`,
          altText: img.altText || row.altText || "",
          titulo: isBanner ? img.titulo || row.titulo || "" : img.titulo || "",
          enlaceTexto: img.enlaceTexto || "",
          enlaceUrl: img.enlaceUrl || "",
        };
      });
    } else {
      imagenesFormateadas = [
        {
          id: `img-${row.id.toString()}-1`,
          url: primaryFileUrl,
          archivoId: row.archivoId ? row.archivoId.toString() : null,
          nombreArchivo: row.archivo?.nombreArchivo || null,
          fileName: row.archivo?.nombreOriginal || "imagen_espacio.jpg",
          altText: row.altText || row.titulo || "",
          titulo: isBanner ? row.titulo || "" : "",
          enlaceTexto: extra.enlaceTexto || "",
          enlaceUrl: row.enlaceUrl || "",
        },
      ];
    }

    const coverSlide = imagenesFormateadas[0] || {};

    return {
      id: row.id.toString(),
      espacioKey: extra.espacioKey || `espacio-${row.id.toString()}`,
      orden: row.orden || 1,
      nombre: extra.nombre || row.titulo,
      titulo: extra.nombre || row.titulo,
      descripcion: extra.descripcion || "",
      tipo:
        extra.tipo || row.tipo_contenido_grafico?.nombre || "Banner Principal",
      ubicacion:
        extra.ubicacion ||
        row.ubicacion_contenido_grafico?.nombre ||
        "Banner Principal",
      dimensiones: extra.dimensiones,
      page: row.pagina || "Inicio",
      pagina: row.pagina || "Inicio",
      estado: row.estado || "APROBADO",
      activo: Boolean(row.activo),
      rejectionReason: row.rejectionReason || null,
      imageUrl: coverSlide.url || primaryFileUrl || "",
      altText: coverSlide.altText || row.altText || "",
      enlaceTexto: coverSlide.enlaceTexto || extra.enlaceTexto || "",
      enlaceUrl: coverSlide.enlaceUrl || row.enlaceUrl || "",
      imagenes: imagenesFormateadas,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Busca un espacio fijo tanto por ID numérico de base de datos como por su clave semántica (`espacioKey`)
   */
  async _buscarEspacioPorIdOClave(idOrKey) {
    await this._asegurarEspaciosIniciales();

    const raw = String(idOrKey || "").trim();
    if (/^\d+$/.test(raw)) {
      const found = await prisma.contenido_grafico.findUnique({
        where: { id: BigInt(raw) },
        include: {
          archivo: true,
          tipo_contenido_grafico: true,
          ubicacion_contenido_grafico: true,
        },
      });
      if (found) return found;
    }

    // Si se envió un espacioKey (ej. "espacio-banner-inicio"), buscar entre los espacios existentes
    const todos = await prisma.contenido_grafico.findMany({
      orderBy: { orden: "asc" },
      include: {
        archivo: true,
        tipo_contenido_grafico: true,
        ubicacion_contenido_grafico: true,
      },
    });

    for (const row of todos) {
      if (row.descripcion) {
        try {
          const parsed = JSON.parse(row.descripcion);
          if (parsed?.espacioKey === raw) {
            return row;
          }
        } catch {
          // Ignorar si no es JSON
        }
      }
    }

    // Fallback por coincidencia con la definición semilla
    const seedMatch = INITIAL_ESPACIOS_FIJOS.find((s) => s.espacioKey === raw);
    if (seedMatch) {
      const byOrder = todos.find(
        (r) =>
          r.orden === seedMatch.orden ||
          r.titulo.toLowerCase() === seedMatch.nombre.toLowerCase()
      );
      if (byOrder) return byOrder;
    }

    return null;
  }

  /**
   * Obtiene todos los Espacios Fijos para la tabla y el modal del CMS (`GET /api/cms/contenido-grafico`)
   */
  async obtenerEspaciosGraficos() {
    await this._asegurarEspaciosIniciales();

    const rows = await prisma.contenido_grafico.findMany({
      orderBy: { orden: "asc" },
      include: {
        archivo: true,
        tipo_contenido_grafico: true,
        ubicacion_contenido_grafico: true,
      },
    });

    return rows.map((row) => this._formatEspacio(row));
  }

  /**
   * Obtiene los slides activos/publicados para el portal público (`GET /api/cms/banners`)
   * Compatible con `Carousel.jsx` y componentes públicos que filtran por `page` y `activo`.
   */
  async obtenerBanners(query = {}) {
    const espacios = await this.obtenerEspaciosGraficos();

    // Si el cliente solicita explícitamente los contenedores fijos
    if (query?.modo === "espacios") {
      return espacios;
    }

    const slidesPublicos = [];

    for (const espacio of espacios) {
      const esPublicado =
        (espacio.estado === "APROBADO" || espacio.estado === "PUBLICADO") &&
        espacio.activo === true;

      if (!esPublicado) continue;

      const imgs = Array.isArray(espacio.imagenes) ? espacio.imagenes : [];
      imgs.forEach((slide, idx) => {
        if (!slide.url) return; // Solo emitir slides con URL real cargada si el portal filtra imágenes dinámicas

        slidesPublicos.push({
          id: `${espacio.id}-${slide.id || idx + 1}`,
          espacioId: espacio.id,
          espacioKey: espacio.espacioKey,
          nombreEspacio: espacio.nombre,
          tipo: espacio.tipo,
          ubicacion: espacio.ubicacion,
          dimensiones: espacio.dimensiones,
          page: espacio.page,
          pagina: espacio.page,
          orden: idx + 1,
          activo: true,
          estado: espacio.estado,
          imageUrl: slide.url,
          altText: slide.altText || espacio.nombre,
          titulo: slide.titulo || "",
          enlaceTexto: slide.enlaceTexto || "",
          enlaceUrl: slide.enlaceUrl || "",
          enlace: slide.enlaceUrl || "",
          descripcion: slide.enlaceTexto || espacio.descripcion || "",
        });
      });
    }

    return slidesPublicos;
  }

  /**
   * Sube un archivo binario a Supabase Storage (`banners-imagenes`) y registra su fila en `prisma.archivo`
   */
  async _subirImagenASupabase(file, prefix = "cg") {
    const { nombreUnico, extension } = generarNombreUnico(
      file.originalname || "imagen.jpg",
      prefix
    );

    const { error: storageError } = await supabase.storage
      .from(BANNERS_BUCKET)
      .upload(nombreUnico, file.buffer, {
        contentType: file.mimetype || "image/jpeg",
        upsert: true,
      });

    if (storageError) {
      const error = new Error(
        `Error al subir imagen a Supabase (${BANNERS_BUCKET}): ${storageError.message}`
      );
      error.statusCode = 500;
      throw error;
    }

    const archivoDb = await prisma.archivo.create({
      data: {
        nombreOriginal: file.originalname || nombreUnico,
        nombreArchivo: nombreUnico,
        ruta: `${BANNERS_BUCKET}/${nombreUnico}`,
        extension: extension || "jpg",
        mimeType: file.mimetype || "image/jpeg",
        tamanioBytes: BigInt(file.size || 0),
      },
    });

    const publicUrl = this._obtenerUrlPublica(nombreUnico);

    return {
      archivoDb,
      publicUrl,
      nombreUnico,
    };
  }

  /**
   * Actualiza el carrusel de imágenes y metadatos de un Espacio Fijo existente (`PUT /api/cms/contenido-grafico/:id`)
   */
  async actualizarBanner(idOrKey, data, files, user) {
    const espacioExistente = await this._buscarEspacioPorIdOClave(idOrKey);

    if (!espacioExistente) {
      const error = new Error("El espacio gráfico fijo solicitado no existe.");
      error.statusCode = 404;
      throw error;
    }

    const espacioFormateadoPrevio = this._formatEspacio(espacioExistente);
    const isBannerPrincipal =
      (data.tipo || espacioFormateadoPrevio.tipo) === "Banner Principal";

    // 1. Parsear arreglo `imagenes` enviado desde el modal (JSON string en FormData o Array directo)
    let incomingImagenes = [];
    if (typeof data.imagenes === "string") {
      try {
        incomingImagenes = JSON.parse(data.imagenes);
      } catch {
        incomingImagenes = [];
      }
    } else if (Array.isArray(data.imagenes)) {
      incomingImagenes = data.imagenes;
    } else {
      incomingImagenes = espacioFormateadoPrevio.imagenes;
    }

    if (!Array.isArray(incomingImagenes) || incomingImagenes.length === 0) {
      const error = new Error(
        "El espacio gráfico debe contener al menos una imagen en su carrusel."
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Normalizar archivos recibidos por Multer (`uploadMemory.any()` o `single`)
    const filesArray = Array.isArray(files)
      ? files
      : files
      ? [files]
      : [];

    // 3. Procesar cada slide del carrusel y subir los archivos nuevos/recortados (`imagen_0`, `imagen_1`, ...)
    const imagenesActualizadas = [];

    for (let idx = 0; idx < incomingImagenes.length; idx++) {
      const slide = incomingImagenes[idx] || {};

      // Buscar si se adjuntó un archivo binario para este índice (ej. `imagen_0`) o genérico (`imagen` en idx 0)
      const matchingFile = filesArray.find(
        (f) =>
          f.fieldname === `imagen_${idx}` ||
          (idx === 0 && (f.fieldname === "imagen" || f.fieldname === "archivo"))
      );

      let slideUrl =
        slide.url && !String(slide.url).startsWith("blob:") ? slide.url : "";
      let slideArchivoId = slide.archivoId || null;
      let slideNombreArchivo = slide.nombreArchivo || null;
      let slideFileName = slide.fileName || `imagen_${idx + 1}.jpg`;

      if (matchingFile) {
        const uploaded = await this._subirImagenASupabase(
          matchingFile,
          `espacio_${espacioExistente.id}_${idx + 1}`
        );
        slideUrl = uploaded.publicUrl;
        slideArchivoId = uploaded.archivoDb.id.toString();
        slideNombreArchivo = uploaded.nombreUnico;
        slideFileName = matchingFile.originalname || slideFileName;
      }

      const altTextLimpio = (slide.altText || "").trim();
      if (!altTextLimpio) {
        const error = new Error(
          `El Texto Alternativo (ALT) es obligatorio en la imagen #${idx + 1}.`
        );
        error.statusCode = 400;
        throw error;
      }

      const tituloLimpio = (slide.titulo || "").trim();
      if (isBannerPrincipal && !tituloLimpio) {
        const error = new Error(
          `El Título es obligatorio en la imagen #${idx + 1} para un Banner Principal.`
        );
        error.statusCode = 400;
        throw error;
      }

      imagenesActualizadas.push({
        id: slide.id || `img-${espacioExistente.id.toString()}-${idx + 1}`,
        url: slideUrl,
        archivoId: slideArchivoId ? String(slideArchivoId) : null,
        nombreArchivo: slideNombreArchivo || null,
        fileName: slideFileName,
        altText: altTextLimpio,
        titulo: isBannerPrincipal ? tituloLimpio : "",
        enlaceTexto: (slide.enlaceTexto || "").trim(),
        enlaceUrl: (slide.enlaceUrl || "").trim(),
      });
    }

    // 4. Limpiar de Supabase y de la tabla `archivo` aquellas imágenes que fueron eliminadas o reemplazadas
    const archivosPrevios = (espacioFormateadoPrevio.imagenes || [])
      .filter((img) => img.archivoId)
      .map((img) => ({
        archivoId: String(img.archivoId),
        nombreArchivo: img.nombreArchivo,
      }));

    const archivosNuevosSet = new Set(
      imagenesActualizadas
        .filter((img) => img.archivoId)
        .map((img) => String(img.archivoId))
    );

    // Determinar el archivoId principal (primera imagen del carrusel)
    const primarySlide = imagenesActualizadas[0];
    let nuevoArchivoPrincipalId = primarySlide?.archivoId
      ? BigInt(primarySlide.archivoId)
      : null;

    // Actualizar `contenido_grafico` primero para liberar posibles FKs antes de borrar archivos huérfanos
    const estadoSolicitado = (
      data.estado ||
      espacioExistente.estado ||
      "APROBADO"
    ).toUpperCase();
    const estadoFinal = ESTADOS_VALIDOS.includes(estadoSolicitado)
      ? estadoSolicitado
      : espacioExistente.estado;

    const nuevoActivo =
      data.activo !== undefined
        ? data.activo === true || data.activo === "true"
        : estadoFinal === "APROBADO" || estadoFinal === "PUBLICADO";

    const nuevoRejectionReason =
      estadoFinal === "APROBADO" ||
      estadoFinal === "PUBLICADO" ||
      estadoFinal === "PENDIENTE_APROBACION"
        ? null
        : data.rejectionReason !== undefined
        ? data.rejectionReason
        : espacioExistente.rejectionReason;

    const metadataJson = {
      espacioKey:
        data.espacioKey ||
        espacioFormateadoPrevio.espacioKey ||
        `espacio-${espacioExistente.id.toString()}`,
      nombre:
        data.nombre ||
        espacioFormateadoPrevio.nombre ||
        espacioExistente.titulo,
      descripcion:
        data.descripcionEspacio ||
        espacioFormateadoPrevio.descripcion ||
        "",
      tipo: data.tipo || espacioFormateadoPrevio.tipo || "Banner Principal",
      ubicacion:
        data.ubicacion ||
        espacioFormateadoPrevio.ubicacion ||
        "Banner Principal",
      dimensiones:
        data.dimensiones ||
        espacioFormateadoPrevio.dimensiones ||
        (isBannerPrincipal ? "1920x1080px" : "1200x675px"),
      enlaceTexto: primarySlide?.enlaceTexto || "",
      imagenes: imagenesActualizadas,
    };

    const usuarioUuid = await this._resolverUsuarioUuid(user);

    const rowActualizada = await prisma.contenido_grafico.update({
      where: { id: espacioExistente.id },
      data: {
        titulo: metadataJson.nombre,
        descripcion: JSON.stringify(metadataJson),
        altText: primarySlide?.altText || espacioExistente.altText,
        enlaceUrl: primarySlide?.enlaceUrl || null,
        archivoId: nuevoArchivoPrincipalId,
        estado: estadoFinal,
        activo: nuevoActivo,
        rejectionReason: nuevoRejectionReason,
        updatedBy: usuarioUuid,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
        tipo_contenido_grafico: true,
        ubicacion_contenido_grafico: true,
      },
    });

    // Eliminar de Supabase y `archivo` los archivos que ya no pertenecen al carrusel
    for (const prev of archivosPrevios) {
      if (!archivosNuevosSet.has(prev.archivoId)) {
        try {
          if (prev.nombreArchivo) {
            await supabase.storage
              .from(BANNERS_BUCKET)
              .remove([prev.nombreArchivo]);
          }
          await prisma.archivo.delete({
            where: { id: BigInt(prev.archivoId) },
          });
        } catch {
          // Ignorar si otro registro aún referencia el archivo
        }
      }
    }

    const espacioFormateado = this._formatEspacio(rowActualizada);

    return {
      message: "¡Espacio gráfico actualizado correctamente!",
      espacio: espacioFormateado,
      banner: espacioFormateado,
    };
  }

  /**
   * Dictamen de revisión editorial o cambio de estado (`PATCH /api/cms/contenido-grafico/:id/estado`)
   */
  async cambiarEstadoEspacio(idOrKey, body = {}, user) {
    const espacioExistente = await this._buscarEspacioPorIdOClave(idOrKey);

    if (!espacioExistente) {
      const error = new Error("El espacio gráfico fijo solicitado no existe.");
      error.statusCode = 404;
      throw error;
    }

    const estadoSolicitado = (body.estado || "APROBADO").toUpperCase();
    if (!ESTADOS_VALIDOS.includes(estadoSolicitado)) {
      const error = new Error(`Estado editorial no válido: ${estadoSolicitado}`);
      error.statusCode = 400;
      throw error;
    }

    if (
      estadoSolicitado === "RECHAZADO" &&
      (!body.rejectionReason || !String(body.rejectionReason).trim())
    ) {
      const error = new Error(
        "Debe especificar obligatoriamente el motivo del rechazo editorial."
      );
      error.statusCode = 400;
      throw error;
    }

    const esAprobado =
      estadoSolicitado === "APROBADO" || estadoSolicitado === "PUBLICADO";
    const usuarioUuid = await this._resolverUsuarioUuid(user);

    const rowActualizada = await prisma.contenido_grafico.update({
      where: { id: espacioExistente.id },
      data: {
        estado: estadoSolicitado,
        activo: esAprobado,
        rejectionReason:
          estadoSolicitado === "RECHAZADO"
            ? String(body.rejectionReason).trim()
            : null,
        approvedBy: esAprobado ? usuarioUuid : espacioExistente.approvedBy,
        approvedAt: esAprobado ? new Date() : espacioExistente.approvedAt,
        updatedBy: usuarioUuid,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
        tipo_contenido_grafico: true,
        ubicacion_contenido_grafico: true,
      },
    });

    return {
      message: esAprobado
        ? "Espacio gráfico aprobado y publicado."
        : estadoSolicitado === "RECHAZADO"
        ? "Espacio gráfico observado para corrección."
        : `Estado actualizado a ${estadoSolicitado}.`,
      espacio: this._formatEspacio(rowActualizada),
    };
  }
}

export default new CmsBannersService();
