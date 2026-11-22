// Catálogo de los espacios gráficos fijos del portal (banners, carrusel, secciones) y sus reglas.

/**
 * Rutas internas válidas del portal público a las que puede redirigir un botón o tarjeta.
 */
export const RUTAS_INTERNAS_PERMITIDAS = new Set([
  "/",
  "/acerca-de",
  "/especialidades",
  "/profesionales",
  "/noticias",
  "/noticias/dengue",
  "/noticias/cancer-mama",
  "/noticias/tu-corazon",
  "/noticias/donacion",
  "/documentacion",
  "/capacitacion",
  "/residencias",
  "/plano",
]);

export const MAPA_RUTAS_LEGADAS_NOTICIAS = {
  "/noticias?categoria=dengue": "/noticias/dengue",
  "/noticias?categoria=cancer-mama": "/noticias/cancer-mama",
  "/noticias?categoria=tu-corazon": "/noticias/tu-corazon",
  "/noticias?categoria=donacion": "/noticias/donacion",
};

export const normalizarRutaInternaPortal = (rawUrl) => {
  if (typeof rawUrl !== "string") return "";
  const limpia = rawUrl.trim();
  return MAPA_RUTAS_LEGADAS_NOTICIAS[limpia] || limpia;
};

/**
 * Catálogo canónico de espacios gráficos fijos del portal.
 * El CM no puede crear nuevas secciones, únicamente editar las predefinidas.
 */
export const ESPACIOS_FIJOS_DEFINICIONES = [
  {
    id: "espacio-banner-inicio",
    orden: 1,
    nombre: "Carrusel Principal de Inicio",
    descripcion:
      "Carrusel hero de bienvenida en la portada principal del portal",
    tipo: "Carrusel Principal",
    ubicacionClave: "espacio-banner-inicio",
    page: "Inicio",
    dimensiones: "1920x820px",
    aspectRatio: 1501 / 641,
    defaults: {
      altText:
        "Carrusel principal de bienvenida del Hospital Interdistrital Evita de Formosa",
      textoSuperpuesto: "6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL",
      textoBoton: "CONOCENOS",
      enlaceUrl: "/acerca-de",
      imagenes: [
        {
          presetKey: "carrusel-inicio-1",
          fileName: "fondoHospitalCarrusel1.jpg",
        },
        {
          presetKey: "carrusel-inicio-2",
          fileName: "fondoHospitalCarrusel2.jpg",
        },
        {
          presetKey: "carrusel-inicio-3",
          fileName: "fondoHospitalCarrusel3.jpg",
        },
        {
          presetKey: "carrusel-inicio-4",
          fileName: "fondoHospitalCarrusel4.jpg",
        },
      ],
    },
  },
  {
    id: "espacio-seccion-pacientes",
    orden: 2,
    nombre: "Sección Información para Pacientes",
    descripcion:
      "Sección interactiva de 5 desplegables informativos con sus imágenes asociadas en Inicio",
    tipo: "Acordeón Informativo",
    ubicacionClave: "espacio-seccion-pacientes",
    page: "Inicio",
    dimensiones: "1200x900px",
    aspectRatio: 4 / 3,
    esAcordeonFijo: true,
    cantidadItemsFijos: 5,
    defaults: {
      altText: "Sección de orientación e información útil para pacientes",
      textoSuperpuesto: "",
      textoBoton: "",
      enlaceUrl: "",
      imagenes: [
        {
          titulo: "HORARIOS DE ATENCIÓN",
          textoDesplegable:
            "Estamos disponibles de 06:00 a 20:00 hs. para ayudarte a agendar citas y responder tus dudas generales.",
          altText:
            "Profesional de salud brindando acompañamiento y orientación al paciente",
          presetKey: "pacientes-atencion",
          fileName: "imagenPacientes.jpg",
        },
        {
          titulo: "VISITAR A UN PACIENTE",
          textoDesplegable:
            "Por favor, consulte los horarios y protocolos vigentes en recepción para la visita a pacientes internados.",
          altText:
            "Orientación sobre horarios y protocolos de visita a pacientes internados",
          presetKey: "pacientes-visita",
          fileName: "imgVisita.jpg",
        },
        {
          titulo: "CRITERIOS DE ADMISIÓN",
          textoDesplegable:
            "Conozca los requisitos y documentación necesaria para la admisión en nuestras instalaciones.",
          altText:
            "Requisitos y documentación para admisión de pacientes en el hospital",
          presetKey: "pacientes-admision",
          fileName: "imgAdmision.jpg",
        },
        {
          titulo: "TURNOS Y CONTACTO",
          textoDesplegable:
            "Comuníquese a través de nuestras vías oficiales para agendar o modificar su turno de atención.",
          altText:
            "Canales oficiales para gestión de turnos médicos y contacto",
          presetKey: "pacientes-turnos",
          fileName: "imgTurnos.jpg",
        },
        {
          titulo: "LABORATORIO",
          textoDesplegable:
            "Información detallada sobre preparación previa, ayuno y horarios de extracción para análisis clínicos.",
          altText:
            "Servicio de laboratorio y extracciones para análisis clínicos",
          presetKey: "pacientes-laboratorio",
          fileName: "imgLaboratorio.jpg",
        },
      ],
    },
  },
  {
    id: "espacio-aprende-inicio",
    orden: 3,
    nombre: "Sección Educación para la Salud",
    descripcion:
      "Bloque de educación médica y preventiva con imagen editorial y 3 tarjetas con redirección en Inicio",
    tipo: "Bloque Educativo + 3 Tarjetas",
    ubicacionClave: "espacio-aprende-inicio",
    page: "Inicio",
    dimensiones: "1260x960px / 600x600px",
    aspectRatio: 630 / 480,
    esSeccionAprende: true,
    cantidadItemsFijos: 4,
    defaults: {
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
          rolItem: "principal",
          subtituloEncabezado: "EDUCACIÓN PARA LA SALUD",
          titulo: "APRENDÉ CON EL EVITA",
          parrafoDescripcion:
            "Tu espacio de educación médica y preventiva. Encontrá información clara, consejos prácticos y guías de orientación en formato rápido para cuidar tu bienestar y el de tu familia.",
          altText: "Educación para la salud - Hospital Evita",
          presetKey: "aprende-main",
          fileName: "aprendeMain.jpg",
          enlaceUrl: "",
        },
        {
          rolItem: "tarjeta",
          etiquetaSuperior: "TIP DE SALUD",
          badgeColor: "green",
          titulo: "Prevención del Dengue",
          altText: "Prevención del Dengue",
          enlaceUrl: "/noticias/dengue",
          presetKey: "aprende-dengue",
          fileName: "aprendeDengue.jpg",
        },
        {
          rolItem: "tarjeta",
          etiquetaSuperior: "GUÍA PRÁCTICA",
          badgeColor: "yellow",
          titulo: "Ayuno para Laboratorio",
          altText: "Ayuno para laboratorio",
          enlaceUrl: "/documentacion",
          presetKey: "aprende-laboratorio",
          fileName: "aprendeLaboratorio.jpg",
        },
        {
          rolItem: "tarjeta",
          etiquetaSuperior: "FORMACIÓN",
          badgeColor: "blue",
          titulo: "Cursos y Jornadas HIE",
          altText: "Cursos y Jornadas HIE",
          enlaceUrl: "/capacitacion",
          presetKey: "aprende-capacitacion",
          fileName: "aprendeCapacitacion.jpg",
        },
      ],
    },
  },
  {
    id: "espacio-residencias-destacado",
    orden: 4,
    nombre: "Sección Bienvenida de Residencias",
    descripcion:
      "Tarjeta destacada de bienvenida y convocatoria de especialidades en Residencias",
    tipo: "Tarjeta Destacada",
    ubicacionClave: "espacio-residencias-destacado",
    page: "Residencias",
    dimensiones: "1350x1180px aprox.",
    aspectRatio: 1348 / 1181,
    esTarjetaResidencias: true,
    cantidadItemsFijos: 1,
    defaults: {
      altText: "Equipo médico y residentes del Hospital Interdistrital Evita",
      titulo: "Excelencia en Alta Complejidad & Vocación Pública",
      parrafoDescripcion:
        "El Hospital Interdistrital Evita convoca a profesionales de las ciencias médicas para integrarse a sus equipos interdisciplinarios. Formación tutelada en servicio, tecnología biomédica de vanguardia y dedicación humanizada al servicio de toda la región.",
      textoBoton: "Ver Especialidades Disponibles",
      enlaceUrl: "/especialidades",
      textoSuperpuesto: "",
      imagenes: [
        {
          presetKey: "residencias-hero",
          fileName: "medicos-residencias.jpg",
          titulo: "Excelencia en Alta Complejidad & Vocación Pública",
          parrafoDescripcion:
            "El Hospital Interdistrital Evita convoca a profesionales de las ciencias médicas para integrarse a sus equipos interdisciplinarios. Formación tutelada en servicio, tecnología biomédica de vanguardia y dedicación humanizada al servicio de toda la región.",
          textoBoton: "Ver Especialidades Disponibles",
          enlaceUrl: "/especialidades",
          altText:
            "Equipo médico y residentes del Hospital Interdistrital Evita",
        },
      ],
    },
  },
];

export const ALIASES_ESPACIOS = {
  "espacio-banner-capacitacion": "espacio-residencias-destacado",
  "espacio-banner-especialidades": "espacio-aprende-inicio",
};

export const ESPACIOS_MAP = new Map(
  ESPACIOS_FIJOS_DEFINICIONES.map((def) => [def.id, def]),
);

// Registrar alias en ESPACIOS_MAP
Object.entries(ALIASES_ESPACIOS).forEach(([alias, targetId]) => {
  const targetDef = ESPACIOS_MAP.get(targetId);
  if (targetDef) {
    ESPACIOS_MAP.set(alias, targetDef);
  }
});

export const PRESET_KEYS_VALIDAS = new Set([
  "carrusel-inicio-1",
  "carrusel-inicio-2",
  "carrusel-inicio-3",
  "carrusel-inicio-4",
  "pacientes-atencion",
  "pacientes-visita",
  "pacientes-admision",
  "pacientes-turnos",
  "pacientes-laboratorio",
  "aprende-main",
  "aprende-dengue",
  "aprende-laboratorio",
  "aprende-capacitacion",
  "banner-especialidades",
  "banner-capacitaciones",
  "banner-noticias",
  "banner-documentacion",
  "banner-residencias",
  "residencias-hero",
]);

export const COLORES_TARJETA_APRENDE = ["green", "yellow", "blue"];
