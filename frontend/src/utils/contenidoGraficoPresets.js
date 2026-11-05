import carruselImg1 from "../assets/fondoHospitalCarrusel1.jpg";
import carruselImg2 from "../assets/fondoHospitalCarrusel2.jpg";
import carruselImg3 from "../assets/fondoHospitalCarrusel3.jpg";
import carruselImg4 from "../assets/fondoHospitalCarrusel4.jpg";
import imgPacientesAtencion from "../assets/imagenPacientes.jpg";
import imgPacientesVisita from "../assets/imgVisita.jpg";
import imgPacientesAdmision from "../assets/imgAdmision.jpg";
import imgPacientesTurnos from "../assets/imgTurnos.jpg";
import imgPacientesLaboratorio from "../assets/imgLaboratorio.jpg";
import aprendeMainImg from "../assets/aprendeMain.jpg";
import aprendeDengueImg from "../assets/aprendeDengue.jpg";
import aprendeLaboratorioImg from "../assets/aprendeLaboratorio.jpg";
import aprendeCapacitacionImg from "../assets/aprendeCapacitacion.jpg";
import bannerEspecialidades from "../assets/banner_especialidades.png";
import bannerCapacitaciones from "../assets/banner_capacitaciones.png";
import bannerNoticias from "../assets/banner_noticias.png";
import bannerDocumentacion from "../assets/banner_documentacion.png";
import bannerResidencias from "../assets/banner_residencias.png";
import medicosResidencias from "../assets/medicos-residencias.jpg";

/**
 * Mapa de imágenes institucionales predeterminadas por clave estable.
 */
export const PRESET_IMAGES_MAP = {
  "carrusel-inicio-1": carruselImg1,
  "carrusel-inicio-2": carruselImg2,
  "carrusel-inicio-3": carruselImg3,
  "carrusel-inicio-4": carruselImg4,
  "pacientes-atencion": imgPacientesAtencion,
  "pacientes-visita": imgPacientesVisita,
  "pacientes-admision": imgPacientesAdmision,
  "pacientes-turnos": imgPacientesTurnos,
  "pacientes-laboratorio": imgPacientesLaboratorio,
  "aprende-main": aprendeMainImg,
  "aprende-dengue": aprendeDengueImg,
  "aprende-laboratorio": aprendeLaboratorioImg,
  "aprende-capacitacion": aprendeCapacitacionImg,
  "banner-especialidades": bannerEspecialidades,
  "banner-capacitaciones": bannerCapacitaciones,
  "banner-noticias": bannerNoticias,
  "banner-documentacion": bannerDocumentacion,
  "banner-residencias": bannerResidencias,
  "residencias-hero": medicosResidencias,
};

/**
 * Secciones reales del portal público disponibles para redirección de botones y tarjetas.
 */
export const PORTAL_INTERNAL_ROUTES = [
  { value: "/acerca-de", label: "Acerca del Hospital (/acerca-de)" },
  {
    value: "/especialidades",
    label: "Especialidades y Servicios (/especialidades)",
  },
  {
    value: "/profesionales",
    label: "Directorio de Profesionales (/profesionales)",
  },
  { value: "/noticias", label: "Noticias Generales (/noticias)" },
  {
    value: "/noticias/dengue",
    label: "Noticias • Prevención del Dengue (/noticias/dengue)",
  },
  {
    value: "/noticias/cancer-mama",
    label: "Noticias • Cáncer de Mama (/noticias/cancer-mama)",
  },
  {
    value: "/noticias/tu-corazon",
    label: "Noticias • Tu Corazón (/noticias/tu-corazon)",
  },
  {
    value: "/noticias/donacion",
    label: "Noticias • Donación (/noticias/donacion)",
  },
  { value: "/documentacion", label: "Documentación (/documentacion)" },
  { value: "/capacitacion", label: "Capacitación y Docencia (/capacitacion)" },
  { value: "/residencias", label: "Residencias Médicas (/residencias)" },
  { value: "/plano", label: "Plano Institucional (/plano)" },
];

const LEGACY_CATEGORY_QUERY_MAP = {
  "/noticias?categoria=dengue": "/noticias/dengue",
  "/noticias?categoria=cancer-mama": "/noticias/cancer-mama",
  "/noticias?categoria=tu-corazon": "/noticias/tu-corazon",
  "/noticias?categoria=donacion": "/noticias/donacion",
};

/**
 * Normaliza enlaces internos heredados (ej. `/noticias?categoria=dengue` -> `/noticias/dengue`)
 * para que coincidan con el enrutador real de `App.jsx` (`/noticias/:categoria`).
 */
export const normalizeInternalPortalPath = (path) => {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  return LEGACY_CATEGORY_QUERY_MAP[trimmed] || trimmed;
};

export const getPortalRouteLabel = (path) => {
  const normalized = normalizeInternalPortalPath(path);
  if (!normalized) return "";
  const found = PORTAL_INTERNAL_ROUTES.find((r) => r.value === normalized);
  return found ? found.label : normalized;
};

/**
 * Resuelve la URL visual de un elemento de imagen (sea URL pública de Supabase,
 * blob temporal en edición o clave de imagen predeterminada del portal).
 */
export const resolveGraphicImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (img.url) return img.url;
  if (img.imageUrl) return img.imageUrl;
  if (img.presetKey && PRESET_IMAGES_MAP[img.presetKey]) {
    return PRESET_IMAGES_MAP[img.presetKey];
  }
  return null;
};

/**
 * Configuración predeterminada del Carrusel Principal de Inicio (coincide 1:1 con el portal).
 */
export const DEFAULT_CARRUSEL_INICIO = {
  id: "espacio-banner-inicio",
  orden: 1,
  nombre: "Carrusel Principal de Inicio",
  descripcion: "Carrusel hero de bienvenida en la portada principal del portal",
  tipo: "Carrusel Principal",
  page: "Inicio",
  ubicacion: "Carrusel Principal",
  dimensiones: "1920x820px",
  aspectRatio: 1501 / 641,
  estado: "PUBLICADO",
  activo: true,
  rejectionReason: null,
  altText:
    "Carrusel principal de bienvenida del Hospital Interdistrital Evita de Formosa",
  textoSuperpuesto: "6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL",
  textoBoton: "CONOCENOS",
  enlaceUrl: "/acerca-de",
  imagenes: [
    {
      id: "preset-espacio-banner-inicio-1",
      url: null,
      presetKey: "carrusel-inicio-1",
      fileName: "fondoHospitalCarrusel1.jpg",
      orden: 1,
    },
    {
      id: "preset-espacio-banner-inicio-2",
      url: null,
      presetKey: "carrusel-inicio-2",
      fileName: "fondoHospitalCarrusel2.jpg",
      orden: 2,
    },
    {
      id: "preset-espacio-banner-inicio-3",
      url: null,
      presetKey: "carrusel-inicio-3",
      fileName: "fondoHospitalCarrusel3.jpg",
      orden: 3,
    },
    {
      id: "preset-espacio-banner-inicio-4",
      url: null,
      presetKey: "carrusel-inicio-4",
      fileName: "fondoHospitalCarrusel4.jpg",
      orden: 4,
    },
  ],
};

/**
 * Configuración predeterminada de la sección "Información para Pacientes" (5 desplegables fijos).
 */
export const DEFAULT_PACIENTES_INICIO = {
  id: "espacio-seccion-pacientes",
  orden: 2,
  nombre: "Sección Información para Pacientes",
  descripcion:
    "Sección interactiva de 5 desplegables informativos con sus imágenes asociadas en Inicio",
  tipo: "Acordeón Informativo",
  page: "Inicio",
  ubicacion: "Acordeón Informativo",
  dimensiones: "1200x900px",
  aspectRatio: 4 / 3,
  esAcordeonFijo: true,
  cantidadItemsFijos: 5,
  estado: "PUBLICADO",
  activo: true,
  rejectionReason: null,
  altText: "Sección de orientación e información útil para pacientes",
  textoSuperpuesto: "",
  textoBoton: "",
  enlaceUrl: "",
  imagenes: [
    {
      id: "preset-espacio-seccion-pacientes-1",
      url: null,
      presetKey: "pacientes-atencion",
      fileName: "imagenPacientes.jpg",
      orden: 1,
      titulo: "HORARIOS DE ATENCIÓN",
      textoDesplegable:
        "Estamos disponibles de 06:00 a 20:00 hs. para ayudarte a agendar citas y responder tus dudas generales.",
      altText:
        "Profesional de salud brindando acompañamiento y orientación al paciente",
    },
    {
      id: "preset-espacio-seccion-pacientes-2",
      url: null,
      presetKey: "pacientes-visita",
      fileName: "imgVisita.jpg",
      orden: 2,
      titulo: "VISITAR A UN PACIENTE",
      textoDesplegable:
        "Por favor, consulte los horarios y protocolos vigentes en recepción para la visita a pacientes internados.",
      altText:
        "Orientación sobre horarios y protocolos de visita a pacientes internados",
    },
    {
      id: "preset-espacio-seccion-pacientes-3",
      url: null,
      presetKey: "pacientes-admision",
      fileName: "imgAdmision.jpg",
      orden: 3,
      titulo: "CRITERIOS DE ADMISIÓN",
      textoDesplegable:
        "Conozca los requisitos y documentación necesaria para la admisión en nuestras instalaciones.",
      altText:
        "Requisitos y documentación para admisión de pacientes en el hospital",
    },
    {
      id: "preset-espacio-seccion-pacientes-4",
      url: null,
      presetKey: "pacientes-turnos",
      fileName: "imgTurnos.jpg",
      orden: 4,
      titulo: "TURNOS Y CONTACTO",
      textoDesplegable:
        "Comuníquese a través de nuestras vías oficiales para agendar o modificar su turno de atención.",
      altText: "Canales oficiales para gestión de turnos médicos y contacto",
    },
    {
      id: "preset-espacio-seccion-pacientes-5",
      url: null,
      presetKey: "pacientes-laboratorio",
      fileName: "imgLaboratorio.jpg",
      orden: 5,
      titulo: "LABORATORIO",
      textoDesplegable:
        "Información detallada sobre preparación previa, ayuno y horarios de extracción para análisis clínicos.",
      altText: "Servicio de laboratorio y extracciones para análisis clínicos",
    },
  ],
};

/**
 * Configuración predeterminada de la sección "Aprendé con el Evita"
 * (1 bloque general con imagen principal izquierda + 3 tarjetas fijas con redirección).
 */
export const DEFAULT_APRENDE_INICIO = {
  id: "espacio-aprende-inicio",
  orden: 3,
  nombre: "Sección Educación para la Salud",
  descripcion:
    "Bloque de educación médica y preventiva con imagen editorial y 3 tarjetas con redirección en Inicio",
  tipo: "Bloque Educativo + 3 Tarjetas",
  page: "Inicio",
  ubicacion: "Bloque Educativo + 3 Tarjetas",
  dimensiones: "1260x960px / 600x600px",
  aspectRatio: 630 / 480,
  esSeccionAprende: true,
  cantidadItemsFijos: 4,
  estado: "PUBLICADO",
  activo: true,
  rejectionReason: null,
  altText: "Educación para la salud - Hospital Evita",
  subtituloEncabezado: "EDUCACIÓN PARA LA SALUD",
  tituloEncabezado: "APRENDÉ CON EL EVITA",
  parrafoDescripcion:
    "Tu espacio de educación médica y preventiva. Encontrá información clara, consejos prácticos y guías de orientación en formato rápido para cuidar tu bienestar y el de tu familia.",
  textoSuperpuesto: "",
  textoBoton: "",
  enlaceUrl: "",
  imagenes: [
    {
      id: "preset-espacio-aprende-inicio-1",
      rolItem: "principal",
      url: null,
      presetKey: "aprende-main",
      fileName: "aprendeMain.jpg",
      orden: 1,
      subtituloEncabezado: "EDUCACIÓN PARA LA SALUD",
      titulo: "APRENDÉ CON EL EVITA",
      parrafoDescripcion:
        "Tu espacio de educación médica y preventiva. Encontrá información clara, consejos prácticos y guías de orientación en formato rápido para cuidar tu bienestar y el de tu familia.",
      altText: "Educación para la salud - Hospital Evita",
      enlaceUrl: "",
    },
    {
      id: "preset-espacio-aprende-inicio-2",
      rolItem: "tarjeta",
      url: null,
      presetKey: "aprende-dengue",
      fileName: "aprendeDengue.jpg",
      orden: 2,
      etiquetaSuperior: "TIP DE SALUD",
      badgeColor: "green",
      titulo: "Prevención del Dengue",
      altText: "Prevención del Dengue",
      enlaceUrl: "/noticias/dengue",
    },
    {
      id: "preset-espacio-aprende-inicio-3",
      rolItem: "tarjeta",
      url: null,
      presetKey: "aprende-laboratorio",
      fileName: "aprendeLaboratorio.jpg",
      orden: 3,
      etiquetaSuperior: "GUÍA PRÁCTICA",
      badgeColor: "yellow",
      titulo: "Ayuno para Laboratorio",
      altText: "Ayuno para laboratorio",
      enlaceUrl: "/documentacion",
    },
    {
      id: "preset-espacio-aprende-inicio-4",
      rolItem: "tarjeta",
      url: null,
      presetKey: "aprende-capacitacion",
      fileName: "aprendeCapacitacion.jpg",
      orden: 4,
      etiquetaSuperior: "FORMACIÓN",
      badgeColor: "blue",
      titulo: "Cursos y Jornadas HIE",
      altText: "Cursos y Jornadas HIE",
      enlaceUrl: "/capacitacion",
    },
  ],
};

/**
 * Configuración predeterminada de la tarjeta destacada de Residencias Médicas
 * ("Excelencia en Alta Complejidad & Vocación Pública").
 */
export const DEFAULT_RESIDENCIAS_HERO = {
  id: "espacio-residencias-destacado",
  orden: 4,
  nombre: "Sección Bienvenida de Residencias",
  descripcion:
    "Tarjeta destacada de bienvenida y convocatoria de especialidades en Residencias",
  tipo: "Tarjeta Destacada",
  page: "Residencias",
  ubicacion: "Tarjeta Destacada",
  dimensiones: "1350x1180px aprox.",
  aspectRatio: 1348 / 1181,
  esTarjetaResidencias: true,
  cantidadItemsFijos: 1,
  estado: "PUBLICADO",
  activo: true,
  rejectionReason: null,
  altText: "Equipo médico y residentes del Hospital Interdistrital Evita",
  titulo: "Excelencia en Alta Complejidad & Vocación Pública",
  parrafoDescripcion:
    "El Hospital Interdistrital Evita convoca a profesionales de las ciencias médicas para integrarse a sus equipos interdisciplinarios. Formación tutelada en servicio, tecnología biomédica de vanguardia y dedicación humanizada al servicio de toda la región.",
  textoBoton: "Ver Especialidades Disponibles",
  enlaceUrl: "/especialidades",
  textoSuperpuesto: "",
  imagenes: [
    {
      id: "preset-espacio-residencias-destacado-1",
      url: null,
      presetKey: "residencias-hero",
      fileName: "medicos-residencias.jpg",
      orden: 1,
      titulo: "Excelencia en Alta Complejidad & Vocación Pública",
      parrafoDescripcion:
        "El Hospital Interdistrital Evita convoca a profesionales de las ciencias médicas para integrarse a sus equipos interdisciplinarios. Formación tutelada en servicio, tecnología biomédica de vanguardia y dedicación humanizada al servicio de toda la región.",
      textoBoton: "Ver Especialidades Disponibles",
      enlaceUrl: "/especialidades",
      altText: "Equipo médico y residentes del Hospital Interdistrital Evita",
    },
  ],
};
