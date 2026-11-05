import carruselImg1 from "../assets/fondoHospitalCarrusel1.jpg";
import carruselImg2 from "../assets/fondoHospitalCarrusel2.jpg";
import carruselImg3 from "../assets/fondoHospitalCarrusel3.jpg";
import carruselImg4 from "../assets/fondoHospitalCarrusel4.jpg";
import bannerEspecialidades from "../assets/banner_especialidades.png";
import bannerCapacitaciones from "../assets/banner_capacitaciones.png";
import bannerNoticias from "../assets/banner_noticias.png";
import bannerDocumentacion from "../assets/banner_documentacion.png";
import bannerResidencias from "../assets/banner_residencias.png";

/**
 * Mapa de imágenes institucionales predeterminadas por clave estable.
 */
export const PRESET_IMAGES_MAP = {
  "carrusel-inicio-1": carruselImg1,
  "carrusel-inicio-2": carruselImg2,
  "carrusel-inicio-3": carruselImg3,
  "carrusel-inicio-4": carruselImg4,
  "banner-especialidades": bannerEspecialidades,
  "banner-capacitaciones": bannerCapacitaciones,
  "banner-noticias": bannerNoticias,
  "banner-documentacion": bannerDocumentacion,
  "banner-residencias": bannerResidencias,
};

/**
 * Secciones reales del portal público disponibles para redirección de botones.
 */
export const PORTAL_INTERNAL_ROUTES = [
  { value: "/acerca-de", label: "Acerca del Hospital (/acerca-de)" },
  { value: "/especialidades", label: "Especialidades y Servicios (/especialidades)" },
  { value: "/profesionales", label: "Directorio de Profesionales (/profesionales)" },
  { value: "/noticias", label: "Noticias (/noticias)" },
  { value: "/documentacion", label: "Documentación (/documentacion)" },
  { value: "/capacitacion", label: "Capacitación y Docencia (/capacitacion)" },
  { value: "/residencias", label: "Residencias Médicas (/residencias)" },
  { value: "/plano", label: "Plano Institucional (/plano)" },
];

export const getPortalRouteLabel = (path) => {
  if (!path) return "";
  const found = PORTAL_INTERNAL_ROUTES.find((r) => r.value === path);
  return found ? found.label : path;
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
  textoSuperpuesto:
    "6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL",
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

