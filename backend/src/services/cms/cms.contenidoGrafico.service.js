import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import {
  validarUrlHttp,
  sanitizarUrlLectura,
  parsearArregloJson,
} from "../../utils/sanitize.utils.js";

const PRIMARY_BUCKET = "banners-imagenes";
const FALLBACK_BUCKET = "noticias-imagenes";

let resolvedUploadBucket = null;

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

const MAPA_RUTAS_LEGADAS_NOTICIAS = {
  "/noticias?categoria=dengue": "/noticias/dengue",
  "/noticias?categoria=cancer-mama": "/noticias/cancer-mama",
  "/noticias?categoria=tu-corazon": "/noticias/tu-corazon",
  "/noticias?categoria=donacion": "/noticias/donacion",
};

const normalizarRutaInternaPortal = (rawUrl) => {
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
    descripcion: "Carrusel hero de bienvenida en la portada principal del portal",
    tipo: "Carrusel Principal",
    ubicacionClave: "espacio-banner-inicio",
    page: "Inicio",
    dimensiones: "1920x820px",
    aspectRatio: 1501 / 641,
    defaults: {
      altText:
        "Carrusel principal de bienvenida del Hospital Interdistrital Evita de Formosa",
      textoSuperpuesto:
        "6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL",
      textoBoton: "CONOCENOS",
      enlaceUrl: "/acerca-de",
      imagenes: [
        { presetKey: "carrusel-inicio-1", fileName: "fondoHospitalCarrusel1.jpg" },
        { presetKey: "carrusel-inicio-2", fileName: "fondoHospitalCarrusel2.jpg" },
        { presetKey: "carrusel-inicio-3", fileName: "fondoHospitalCarrusel3.jpg" },
        { presetKey: "carrusel-inicio-4", fileName: "fondoHospitalCarrusel4.jpg" },
      ],
    },
  },
  {
    id: "espacio-seccion-pacientes",
    orden: 2,
    nombre: "Información para Pacientes",
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
    nombre: "Aprendé con el Evita",
    descripcion:
      "Bloque de educación para la salud con imagen principal, textos y 3 tarjetas con redirección en Inicio",
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
    id: "espacio-banner-capacitacion",
    orden: 4,
    nombre: "Banner Principal de Capacitación",
    descripcion: "Cabecera visual del área de Docencia e Investigación",
    tipo: "Banner de Cabecera",
    ubicacionClave: "espacio-banner-capacitacion",
    page: "Capacitación",
    dimensiones: "1920x600px",
    aspectRatio: 16 / 5,
    defaults: {
      altText: "Cabecera de la sección de Capacitación y Docencia Hospitalaria",
      textoSuperpuesto: "CAPACITACIÓN Y DOCENCIA",
      textoBoton: "",
      enlaceUrl: "",
      imagenes: [
        { presetKey: "banner-capacitaciones", fileName: "banner_capacitaciones.png" },
      ],
    },
  },
  {
    id: "espacio-banner-institucional",
    orden: 5,
    nombre: "Banner Principal Institucional",
    descripcion: "Portada fija de la sección Acerca del Hospital y Autoridades",
    tipo: "Banner de Cabecera",
    ubicacionClave: "espacio-banner-institucional",
    page: "Institucional",
    dimensiones: "1920x820px",
    aspectRatio: 1501 / 641,
    defaults: {
      altText: "Vista panorámica del edificio del Hospital Interdistrital Evita",
      textoSuperpuesto: "ACERCA DEL HOSPITAL",
      textoBoton: "",
      enlaceUrl: "",
      imagenes: [
        { presetKey: "carrusel-inicio-1", fileName: "institucional_fachada.jpg" },
      ],
    },
  },
];

const ESPACIOS_MAP = new Map(
  ESPACIOS_FIJOS_DEFINICIONES.map((def) => [def.id, def])
);

const PRESET_KEYS_VALIDAS = new Set([
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
]);

const COLORES_TARJETA_APRENDE = ["green", "yellow", "blue"];

const crearError = (mensaje, statusCode = 400) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

/**
 * Limpia texto plano conservando saltos de línea (\n) para textos multilínea,
 * eliminando caracteres de control peligrosos y etiquetas HTML.
 */
const limpiarTextoPlanoMultilinea = (valor, maxLen = 300) => {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
};

const limpiarTextoSimple = (valor, maxLen = 250) => {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
};

/**
 * Determina y garantiza un bucket público válido en Supabase Storage para guardar imágenes.
 */
async function obtenerBucketSubida() {
  if (resolvedUploadBucket) return resolvedUploadBucket;

  try {
    const { data, error } = await supabase.storage.getBucket(PRIMARY_BUCKET);
    if (!error && data) {
      resolvedUploadBucket = PRIMARY_BUCKET;
      return resolvedUploadBucket;
    }

    const { error: createErr } = await supabase.storage.createBucket(PRIMARY_BUCKET, {
      public: true,
    });
    if (!createErr || String(createErr.message || "").toLowerCase().includes("already exists")) {
      resolvedUploadBucket = PRIMARY_BUCKET;
      return resolvedUploadBucket;
    }
  } catch {
    // Fallback al bucket existente de imágenes institucionales
  }

  resolvedUploadBucket = FALLBACK_BUCKET;
  return resolvedUploadBucket;
}

/**
 * Obtiene la URL pública de un registro `archivo` respetando el bucket guardado en `archivo.ruta`.
 */
function resolverUrlPublicaArchivo(archivo) {
  if (!archivo || !archivo.nombreArchivo) return null;
  let bucket = PRIMARY_BUCKET;
  if (typeof archivo.ruta === "string" && archivo.ruta.includes("/")) {
    bucket = archivo.ruta.split("/")[0] || PRIMARY_BUCKET;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(archivo.nombreArchivo);
  return data?.publicUrl || null;
}

/**
 * Elimina un archivo de Supabase Storage y de la tabla `archivo` (best-effort).
 */
async function eliminarArchivoAlmacenado(archivo) {
  if (!archivo) return;
  let bucket = PRIMARY_BUCKET;
  if (typeof archivo.ruta === "string" && archivo.ruta.includes("/")) {
    bucket = archivo.ruta.split("/")[0] || PRIMARY_BUCKET;
  }
  await supabase.storage.from(bucket).remove([archivo.nombreArchivo]).catch(() => {});
  await prisma.archivo.delete({ where: { id: archivo.id } }).catch(() => {});
}

/**
 * Extrae metadatos estructurados almacenados en `contenido_grafico.descripcion`.
 */
function parsearMetadatosDescripcion(rawDesc) {
  if (!rawDesc || typeof rawDesc !== "string") return {};
  try {
    const parsed = JSON.parse(rawDesc);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Si fuera texto plano heredado, se ignora como JSON
  }
  return {};
}

/**
 * Construye la representación de un espacio fijo combinando su definición con las filas en BD.
 */
function formatearEspacioDesdeFilas(def, filas = []) {
  // Caso 1: Sección "Aprendé con el Evita" (1 bloque principal + 3 tarjetas fijas = 4 elementos)
  if (def.esSeccionAprende) {
    const filasOrdenadas = Array.isArray(filas)
      ? [...filas].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    const filaPorOrden = new Map();
    filasOrdenadas.forEach((f, i) => {
      const ord = Number.isInteger(f.orden) && f.orden >= 1 ? f.orden : i + 1;
      if (!filaPorOrden.has(ord)) {
        filaPorOrden.set(ord, f);
      }
    });

    const itemsAprende = def.defaults.imagenes.map((presetItem, idx) => {
      const ordenEsperado = idx + 1;
      const esPrincipal = idx === 0;
      const fila = filaPorOrden.get(ordenEsperado) || null;

      if (!fila) {
        return {
          id: `preset-${def.id}-${ordenEsperado}`,
          archivoId: null,
          url: null,
          presetKey: presetItem.presetKey,
          fileName: presetItem.fileName,
          orden: ordenEsperado,
          rolItem: esPrincipal ? "principal" : "tarjeta",
          subtituloEncabezado: esPrincipal
            ? presetItem.subtituloEncabezado
            : undefined,
          parrafoDescripcion: esPrincipal
            ? presetItem.parrafoDescripcion
            : undefined,
          etiquetaSuperior: !esPrincipal
            ? presetItem.etiquetaSuperior
            : undefined,
          badgeColor: !esPrincipal
            ? COLORES_TARJETA_APRENDE[idx - 1] || "blue"
            : undefined,
          titulo: presetItem.titulo,
          altText: presetItem.altText,
          enlaceUrl: presetItem.enlaceUrl || "",
        };
      }

      const metaFila = parsearMetadatosDescripcion(fila.descripcion);
      const urlPublica = resolverUrlPublicaArchivo(fila.archivo);
      const presetKey =
        !urlPublica && metaFila.presetKey && PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
          ? metaFila.presetKey
          : !urlPublica
          ? presetItem.presetKey
          : null;

      if (esPrincipal) {
        return {
          id: fila.id.toString(),
          archivoId: fila.archivoId ? fila.archivoId.toString() : null,
          url: urlPublica,
          presetKey,
          fileName:
            fila.archivo?.nombreOriginal ||
            metaFila.fileName ||
            presetItem.fileName,
          orden: ordenEsperado,
          rolItem: "principal",
          subtituloEncabezado:
            typeof metaFila.subtituloEncabezado === "string" &&
            metaFila.subtituloEncabezado.trim()
              ? metaFila.subtituloEncabezado
              : presetItem.subtituloEncabezado,
          titulo: fila.titulo || presetItem.titulo,
          parrafoDescripcion:
            typeof metaFila.parrafoDescripcion === "string" &&
            metaFila.parrafoDescripcion.trim()
              ? metaFila.parrafoDescripcion
              : presetItem.parrafoDescripcion,
          altText: fila.altText || presetItem.altText,
          enlaceUrl: "",
        };
      }

      const enlaceSaneado = normalizarRutaInternaPortal(
        sanitizarUrlLectura(fila.enlaceUrl, presetItem.enlaceUrl, true)
      );

      return {
        id: fila.id.toString(),
        archivoId: fila.archivoId ? fila.archivoId.toString() : null,
        url: urlPublica,
        presetKey,
        fileName:
          fila.archivo?.nombreOriginal ||
          metaFila.fileName ||
          presetItem.fileName,
        orden: ordenEsperado,
        rolItem: "tarjeta",
        etiquetaSuperior:
          typeof metaFila.etiquetaSuperior === "string" &&
          metaFila.etiquetaSuperior.trim()
            ? metaFila.etiquetaSuperior
            : presetItem.etiquetaSuperior,
        badgeColor: COLORES_TARJETA_APRENDE[idx - 1] || "blue",
        titulo: fila.titulo || presetItem.titulo,
        altText: fila.altText || presetItem.altText,
        enlaceUrl:
          enlaceSaneado && RUTAS_INTERNAS_PERMITIDAS.has(enlaceSaneado)
            ? enlaceSaneado
            : presetItem.enlaceUrl,
      };
    });

    const primeraFila = filasOrdenadas[0] || null;
    const itemPrincipal = itemsAprende[0];

    return {
      id: def.id,
      orden: def.orden,
      nombre: def.nombre,
      descripcion: def.descripcion,
      tipo: def.tipo,
      page: def.page,
      ubicacion: def.tipo,
      dimensiones: def.dimensiones,
      aspectRatio: def.aspectRatio,
      esSeccionAprende: true,
      cantidadItemsFijos: def.cantidadItemsFijos,
      estado: primeraFila?.estado || "PUBLICADO",
      activo: primeraFila ? primeraFila.activo !== false : true,
      rejectionReason: primeraFila?.rejectionReason || null,
      altText: itemPrincipal?.altText || def.defaults.altText,
      subtituloEncabezado:
        itemPrincipal?.subtituloEncabezado || def.defaults.subtituloEncabezado,
      tituloEncabezado: itemPrincipal?.titulo || def.defaults.tituloEncabezado,
      parrafoDescripcion:
        itemPrincipal?.parrafoDescripcion || def.defaults.parrafoDescripcion,
      textoSuperpuesto: "",
      textoBoton: "",
      enlaceUrl: "",
      updatedAt: primeraFila?.updatedAt ? primeraFila.updatedAt.toISOString() : null,
      imagenes: itemsAprende,
    };
  }

  // Caso 2: Sección de desplegables fijos (ej. Información para Pacientes con 5 ítems fijos)
  if (def.esAcordeonFijo) {
    const filasOrdenadas = Array.isArray(filas)
      ? [...filas].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : [];

    const filaPorOrden = new Map();
    filasOrdenadas.forEach((f, i) => {
      const ord = Number.isInteger(f.orden) && f.orden >= 1 ? f.orden : i + 1;
      if (!filaPorOrden.has(ord)) {
        filaPorOrden.set(ord, f);
      }
    });

    const imagenesAcordeon = def.defaults.imagenes.map((presetItem, idx) => {
      const ordenEsperado = idx + 1;
      const fila = filaPorOrden.get(ordenEsperado) || null;

      if (!fila) {
        return {
          id: `preset-${def.id}-${ordenEsperado}`,
          archivoId: null,
          url: null,
          presetKey: presetItem.presetKey,
          fileName: presetItem.fileName,
          orden: ordenEsperado,
          titulo: presetItem.titulo,
          textoDesplegable: presetItem.textoDesplegable,
          altText: presetItem.altText,
        };
      }

      const metaFila = parsearMetadatosDescripcion(fila.descripcion);
      const urlPublica = resolverUrlPublicaArchivo(fila.archivo);
      const presetKey =
        !urlPublica && metaFila.presetKey && PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
          ? metaFila.presetKey
          : !urlPublica
          ? presetItem.presetKey
          : null;

      return {
        id: fila.id.toString(),
        archivoId: fila.archivoId ? fila.archivoId.toString() : null,
        url: urlPublica,
        presetKey,
        fileName:
          fila.archivo?.nombreOriginal ||
          metaFila.fileName ||
          presetItem.fileName,
        orden: ordenEsperado,
        titulo: fila.titulo || presetItem.titulo,
        textoDesplegable:
          typeof metaFila.textoDesplegable === "string" && metaFila.textoDesplegable.trim()
            ? metaFila.textoDesplegable
            : presetItem.textoDesplegable,
        altText: fila.altText || presetItem.altText,
      };
    });

    const primeraFila = filasOrdenadas[0] || null;

    return {
      id: def.id,
      orden: def.orden,
      nombre: def.nombre,
      descripcion: def.descripcion,
      tipo: def.tipo,
      page: def.page,
      ubicacion: def.tipo,
      dimensiones: def.dimensiones,
      aspectRatio: def.aspectRatio,
      esAcordeonFijo: true,
      cantidadItemsFijos: def.cantidadItemsFijos,
      estado: primeraFila?.estado || "PUBLICADO",
      activo: primeraFila ? primeraFila.activo !== false : true,
      rejectionReason: primeraFila?.rejectionReason || null,
      altText: imagenesAcordeon[0]?.altText || def.defaults.altText,
      textoSuperpuesto: "",
      textoBoton: "",
      enlaceUrl: "",
      updatedAt: primeraFila?.updatedAt ? primeraFila.updatedAt.toISOString() : null,
      imagenes: imagenesAcordeon,
    };
  }

  // Caso 3: Espacios de tipo carrusel o banner
  if (!Array.isArray(filas) || filas.length === 0) {
    const imagenesDefault = def.defaults.imagenes.map((preset, idx) => ({
      id: `preset-${def.id}-${idx + 1}`,
      url: null,
      presetKey: preset.presetKey,
      fileName: preset.fileName,
      orden: idx + 1,
    }));

    return {
      id: def.id,
      orden: def.orden,
      nombre: def.nombre,
      descripcion: def.descripcion,
      tipo: def.tipo,
      page: def.page,
      ubicacion: def.tipo,
      dimensiones: def.dimensiones,
      aspectRatio: def.aspectRatio,
      estado: "PUBLICADO",
      activo: true,
      rejectionReason: null,
      altText: def.defaults.altText,
      textoSuperpuesto: def.defaults.textoSuperpuesto,
      textoBoton: def.defaults.textoBoton,
      enlaceUrl: def.defaults.enlaceUrl,
      updatedAt: null,
      imagenes: imagenesDefault,
    };
  }

  const filasOrdenadas = [...filas].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const primeraFila = filasOrdenadas[0];
  const metaPrincipal = parsearMetadatosDescripcion(primeraFila.descripcion);

  const textoSuperpuesto =
    typeof metaPrincipal.textoSuperpuesto === "string"
      ? metaPrincipal.textoSuperpuesto
      : primeraFila.titulo || def.defaults.textoSuperpuesto;

  const textoBoton =
    typeof metaPrincipal.textoBoton === "string"
      ? metaPrincipal.textoBoton
      : "";

  const enlaceSaneado = textoBoton
    ? normalizarRutaInternaPortal(
        sanitizarUrlLectura(primeraFila.enlaceUrl, "", true)
      )
    : "";

  const imagenes = filasOrdenadas.map((fila, idx) => {
    const metaFila = parsearMetadatosDescripcion(fila.descripcion);
    const urlPublica = resolverUrlPublicaArchivo(fila.archivo);
    const presetKey =
      !urlPublica && metaFila.presetKey && PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
        ? metaFila.presetKey
        : null;

    return {
      id: fila.id.toString(),
      archivoId: fila.archivoId ? fila.archivoId.toString() : null,
      url: urlPublica,
      presetKey,
      fileName:
        fila.archivo?.nombreOriginal ||
        metaFila.fileName ||
        `imagen_${idx + 1}.jpg`,
      orden: fila.orden || idx + 1,
    };
  });

  return {
    id: def.id,
    orden: def.orden,
    nombre: def.nombre,
    descripcion: def.descripcion,
    tipo: def.tipo,
    page: def.page,
    ubicacion: def.tipo,
    dimensiones: def.dimensiones,
    aspectRatio: def.aspectRatio,
    estado: primeraFila.estado || "PUBLICADO",
    activo: primeraFila.activo !== false,
    rejectionReason: primeraFila.rejectionReason || null,
    altText: primeraFila.altText || def.defaults.altText,
    textoSuperpuesto,
    textoBoton,
    enlaceUrl: enlaceSaneado || "",
    updatedAt: primeraFila.updatedAt ? primeraFila.updatedAt.toISOString() : null,
    imagenes,
  };
}

/**
 * Resuelve la referencia de archivo/preset de un ítem enviado en `slides`.
 */
function resolverFuenteImagenItem(item, etiquetaPosicion, filasPorId, uploadedFiles) {
  if (item.kind === "existing") {
    const filaPrev = filasPorId.get(String(item.id || ""));
    if (!filaPrev) {
      throw crearError(
        `La imagen existente de ${etiquetaPosicion} ya no se encuentra disponible. Recargue la vista e intente nuevamente.`
      );
    }
    const metaPrev = parsearMetadatosDescripcion(filaPrev.descripcion);
    return {
      kind: "existing",
      archivoId: filaPrev.archivoId,
      presetKey: metaPrev.presetKey || null,
      fileName:
        filaPrev.archivo?.nombreOriginal ||
        metaPrev.fileName ||
        "imagen.jpg",
      createdByOriginal: filaPrev.createdBy,
    };
  }

  if (item.kind === "preset") {
    const presetKey = String(item.presetKey || "").trim();
    if (!PRESET_KEYS_VALIDAS.has(presetKey)) {
      throw crearError(`Imagen predeterminada inválida en ${etiquetaPosicion}.`);
    }
    return {
      kind: "preset",
      archivoId: null,
      presetKey,
      fileName: limpiarTextoSimple(item.fileName || `${presetKey}.jpg`, 150),
      createdByOriginal: null,
    };
  }

  if (item.kind === "new") {
    const fileIndex = Number(item.fileIndex);
    if (
      !Number.isInteger(fileIndex) ||
      fileIndex < 0 ||
      fileIndex >= uploadedFiles.length
    ) {
      throw crearError(
        `No se recibió el archivo correspondiente a la nueva imagen de ${etiquetaPosicion}.`
      );
    }
    return {
      kind: "new",
      file: uploadedFiles[fileIndex],
      presetKey: null,
      createdByOriginal: null,
    };
  }

  throw crearError(`Tipo de imagen desconocido en ${etiquetaPosicion}.`);
}

class CmsContenidoGraficoService {
  /**
   * Lista todos los espacios gráficos fijos del portal junto con sus imágenes y textos actuales.
   */
  async obtenerEspaciosGraficos(esVistaAdmin = false) {
    const ubicacionesClaves = ESPACIOS_FIJOS_DEFINICIONES.map((d) => d.ubicacionClave);

    const filas = await prisma.contenido_grafico.findMany({
      where: {
        ubicacion_contenido_grafico: {
          nombre: { in: ubicacionesClaves },
        },
        ...(esVistaAdmin
          ? {}
          : {
              activo: true,
              estado: { in: ["PUBLICADO", "APROBADO"] },
            }),
      },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        archivo: true,
        ubicacion_contenido_grafico: true,
      },
    });

    const filasPorEspacio = new Map();
    for (const fila of filas) {
      const clave = fila.ubicacion_contenido_grafico?.nombre;
      if (!clave) continue;
      if (!filasPorEspacio.has(clave)) {
        filasPorEspacio.set(clave, []);
      }
      filasPorEspacio.get(clave).push(fila);
    }

    return ESPACIOS_FIJOS_DEFINICIONES.map((def) =>
      formatearEspacioDesdeFilas(def, filasPorEspacio.get(def.ubicacionClave) || [])
    );
  }

  /**
   * Obtiene la configuración pública vigente de un espacio gráfico fijo puntual.
   */
  async obtenerEspacioPublico(espacioKey) {
    const claveLimpia = String(espacioKey || "").trim();
    const def = ESPACIOS_MAP.get(claveLimpia);
    if (!def) {
      throw crearError("El espacio gráfico solicitado no existe.", 404);
    }

    const filas = await prisma.contenido_grafico.findMany({
      where: {
        ubicacion_contenido_grafico: {
          nombre: def.ubicacionClave,
        },
        activo: true,
        estado: { in: ["PUBLICADO", "APROBADO"] },
      },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        archivo: true,
      },
    });

    return formatearEspacioDesdeFilas(def, filas);
  }

  /**
   * Actualiza un espacio gráfico fijo existente.
   */
  async actualizarEspacioGrafico(espacioKey, body, files, user) {
    const claveLimpia = String(espacioKey || "").trim();
    const def = ESPACIOS_MAP.get(claveLimpia);
    if (!def) {
      throw crearError(
        "El espacio gráfico no existe. No está permitido crear nuevas secciones.",
        404
      );
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
    const uploadedFiles = Array.isArray(files) ? files : files ? [files] : [];

    // Asegurar registros de catálogo tipo y ubicación
    const tipoDb = await prisma.tipo_contenido_grafico.upsert({
      where: { nombre: def.tipo },
      update: { activo: true },
      create: {
        nombre: def.tipo,
        descripcion: `Bloque de tipo ${def.tipo}`,
        activo: true,
      },
    });

    const ubicacionDb = await prisma.ubicacion_contenido_grafico.upsert({
      where: { nombre: def.ubicacionClave },
      update: { descripcion: def.nombre, activo: true },
      create: {
        nombre: def.ubicacionClave,
        descripcion: def.nombre,
        activo: true,
      },
    });

    const filasExistentes = await prisma.contenido_grafico.findMany({
      where: { ubicacionId: ubicacionDb.id },
      include: { archivo: true },
    });

    const filasPorId = new Map(
      filasExistentes.map((f) => [f.id.toString(), f])
    );

    // =========================================================================
    // FLUJO A: SECCIÓN "APRENDÉ CON EL EVITA" (1 BLOQUE PRINCIPAL + 3 TARJETAS)
    // =========================================================================
    if (def.esSeccionAprende) {
      const slidesDescriptor = parsearArregloJson(
        body.slides,
        "elementos de Aprendé con el Evita"
      );

      if (
        !Array.isArray(slidesDescriptor) ||
        slidesDescriptor.length !== def.cantidadItemsFijos
      ) {
        throw crearError(
          `La sección "${def.nombre}" requiere exactamente su imagen principal y sus 3 tarjetas fijas.`
        );
      }

      const slidesResueltos = [];

      for (let i = 0; i < slidesDescriptor.length; i++) {
        const item = slidesDescriptor[i];
        const esPrincipal = i === 0;
        const nombreElemento = esPrincipal
          ? "la imagen principal izquierda"
          : `la tarjeta #${i}`;

        if (!item || typeof item !== "object") {
          throw crearError(`Datos inválidos en ${nombreElemento}.`);
        }

        const baseImg = resolverFuenteImagenItem(
          item,
          nombreElemento,
          filasPorId,
          uploadedFiles
        );

        const itemAltText = limpiarTextoSimple(item.altText, 300);
        if (!itemAltText) {
          throw crearError(
            `El Texto Alternativo (ALT) de ${nombreElemento} es obligatorio.`
          );
        }

        if (esPrincipal) {
          const subtituloEncabezado = limpiarTextoSimple(
            item.subtituloEncabezado,
            100
          );
          if (!subtituloEncabezado) {
            throw crearError(
              "El subtítulo superior del encabezado (ej. EDUCACIÓN PARA LA SALUD) es obligatorio."
            );
          }

          const tituloEncabezado = limpiarTextoSimple(item.titulo, 150);
          if (!tituloEncabezado) {
            throw crearError(
              "El título principal de la sección (ej. APRENDÉ CON EL EVITA) es obligatorio."
            );
          }

          const parrafoDescripcion = limpiarTextoPlanoMultilinea(
            item.parrafoDescripcion,
            650
          );
          if (!parrafoDescripcion) {
            throw crearError(
              "El párrafo descriptivo de Aprendé con el Evita es obligatorio."
            );
          }

          slidesResueltos.push({
            ...baseImg,
            rolItem: "principal",
            subtituloEncabezado,
            titulo: tituloEncabezado,
            parrafoDescripcion,
            altText: itemAltText,
            enlaceUrl: null,
          });
        } else {
          const etiquetaSuperior = limpiarTextoSimple(
            item.etiquetaSuperior,
            60
          );
          if (!etiquetaSuperior) {
            throw crearError(
              `La etiqueta superior de la tarjeta #${i} (ej. TIP DE SALUD) es obligatoria.`
            );
          }

          const tituloTarjeta = limpiarTextoSimple(item.titulo, 120);
          if (!tituloTarjeta) {
            throw crearError(
              `El título de la tarjeta #${i} es obligatorio.`
            );
          }

          const rawEnlace = normalizarRutaInternaPortal(item.enlaceUrl);
          if (!rawEnlace) {
            throw crearError(
              `Seleccione a qué sección del portal redirige "MÁS INFORMACIÓN" en la tarjeta #${i} ("${tituloTarjeta}").`
            );
          }
          if (!RUTAS_INTERNAS_PERMITIDAS.has(rawEnlace)) {
            throw crearError(
              `La redirección seleccionada en la tarjeta #${i} no pertenece a una sección válida del portal.`
            );
          }

          const enlaceValidado = validarUrlHttp(
            rawEnlace,
            `redirección de tarjeta #${i}`,
            true
          );

          slidesResueltos.push({
            ...baseImg,
            rolItem: "tarjeta",
            etiquetaSuperior,
            badgeColor: COLORES_TARJETA_APRENDE[i - 1] || "blue",
            titulo: tituloTarjeta,
            altText: itemAltText,
            enlaceUrl: enlaceValidado,
          });
        }
      }

      const archivosNuevosCreados = [];
      let bucketSubida = null;

      try {
        for (const slide of slidesResueltos) {
          if (slide.kind !== "new") continue;
          if (!bucketSubida) {
            bucketSubida = await obtenerBucketSubida();
          }

          const file = slide.file;
          const { nombreUnico, extension } = generarNombreUnico(
            file.originalname,
            "cg_aprende",
            file.mimetype
          );

          const { error: storageError } = await supabase.storage
            .from(bucketSubida)
            .upload(nombreUnico, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (storageError) {
            console.error(
              "[Storage] Error al subir imagen de Aprendé con el Evita:",
              storageError.message
            );
            throw crearError(
              "No se pudo almacenar una de las imágenes en el servidor.",
              500
            );
          }

          const archivoDb = await prisma.archivo.create({
            data: {
              nombreOriginal: file.originalname,
              nombreArchivo: nombreUnico,
              ruta: `${bucketSubida}/${nombreUnico}`,
              extension,
              mimeType: file.mimetype,
              tamanioBytes: BigInt(file.size),
            },
          });

          archivosNuevosCreados.push(archivoDb);
          slide.archivoId = archivoDb.id;
          slide.fileName = file.originalname;
        }

        const ahora = new Date();

        await prisma.$transaction(async (tx) => {
          await tx.contenido_grafico.deleteMany({
            where: { ubicacionId: ubicacionDb.id },
          });

          for (let idx = 0; idx < slidesResueltos.length; idx++) {
            const s = slidesResueltos[idx];
            const metaJson =
              s.rolItem === "principal"
                ? JSON.stringify({
                    rolItem: "principal",
                    subtituloEncabezado: s.subtituloEncabezado,
                    parrafoDescripcion: s.parrafoDescripcion,
                    presetKey: s.presetKey || null,
                    fileName: s.fileName || null,
                  })
                : JSON.stringify({
                    rolItem: "tarjeta",
                    etiquetaSuperior: s.etiquetaSuperior,
                    badgeColor: s.badgeColor,
                    presetKey: s.presetKey || null,
                    fileName: s.fileName || null,
                  });

            await tx.contenido_grafico.create({
              data: {
                titulo: s.titulo.slice(0, 200),
                descripcion: metaJson,
                altText: s.altText,
                archivoId: s.archivoId || null,
                enlaceUrl: s.enlaceUrl || null,
                orden: idx + 1,
                activo: true,
                tipoId: tipoDb.id,
                ubicacionId: ubicacionDb.id,
                estado: "PUBLICADO",
                createdBy: s.createdByOriginal || usuarioLocal.id,
                updatedBy: usuarioLocal.id,
                rejectionReason: null,
                pagina: def.page,
                updatedAt: ahora,
              },
            });
          }
        });
      } catch (err) {
        for (const arch of archivosNuevosCreados) {
          await eliminarArchivoAlmacenado(arch);
        }
        throw err;
      }

      const archivosConservadosIds = new Set(
        slidesResueltos
          .filter((s) => s.archivoId)
          .map((s) => s.archivoId.toString())
      );

      for (const filaAntigua of filasExistentes) {
        if (
          filaAntigua.archivo &&
          !archivosConservadosIds.has(filaAntigua.archivo.id.toString())
        ) {
          await eliminarArchivoAlmacenado(filaAntigua.archivo);
        }
      }

      await prisma.auditoria
        .create({
          data: {
            usuarioId: usuarioLocal.id,
            accion: "ACTUALIZAR",
            entidad: "contenido_grafico",
            entidadId: def.id,
            descripcion: `Actualizó "${def.nombre}" (encabezado, imagen principal y 3 tarjetas)`,
          },
        })
        .catch(() => {});

      const filasActualizadas = await prisma.contenido_grafico.findMany({
        where: { ubicacionId: ubicacionDb.id },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        include: { archivo: true },
      });

      return {
        message: `Sección "${def.nombre}" actualizada correctamente.`,
        espacio: formatearEspacioDesdeFilas(def, filasActualizadas),
      };
    }

    // =========================================================================
    // FLUJO B: SECCIÓN DE DESPLEGABLES FIJOS (ej. Información para Pacientes)
    // =========================================================================
    if (def.esAcordeonFijo) {
      const slidesDescriptor = parsearArregloJson(
        body.slides,
        "desplegables de la sección"
      );

      if (
        !Array.isArray(slidesDescriptor) ||
        slidesDescriptor.length !== def.cantidadItemsFijos
      ) {
        throw crearError(
          `La sección "${def.nombre}" cuenta con exactamente ${def.cantidadItemsFijos} desplegables fijos; no se permite agregar ni eliminar ítems.`
        );
      }

      const slidesResueltos = [];

      for (let i = 0; i < slidesDescriptor.length; i++) {
        const item = slidesDescriptor[i];
        if (!item || typeof item !== "object") {
          throw crearError(`Datos inválidos en el desplegable #${i + 1}.`);
        }

        const itemTitulo = limpiarTextoSimple(item.titulo, 120);
        if (!itemTitulo) {
          throw crearError(
            `El título del desplegable #${i + 1} es obligatorio.`
          );
        }

        const itemTextoDesplegable = limpiarTextoPlanoMultilinea(
          item.textoDesplegable,
          600
        );
        if (!itemTextoDesplegable) {
          throw crearError(
            `El texto informativo del desplegable #${i + 1} ("${itemTitulo}") es obligatorio.`
          );
        }

        const itemAltText = limpiarTextoSimple(item.altText, 300);
        if (!itemAltText) {
          throw crearError(
            `El Texto Alternativo (ALT) de la imagen en el desplegable #${i + 1} ("${itemTitulo}") es obligatorio.`
          );
        }

        const baseImg = resolverFuenteImagenItem(
          item,
          `el desplegable #${i + 1}`,
          filasPorId,
          uploadedFiles
        );

        slidesResueltos.push({
          ...baseImg,
          titulo: itemTitulo,
          textoDesplegable: itemTextoDesplegable,
          altText: itemAltText,
        });
      }

      const archivosNuevosCreados = [];
      let bucketSubida = null;

      try {
        for (const slide of slidesResueltos) {
          if (slide.kind !== "new") continue;
          if (!bucketSubida) {
            bucketSubida = await obtenerBucketSubida();
          }

          const file = slide.file;
          const { nombreUnico, extension } = generarNombreUnico(
            file.originalname,
            "cg_pacientes",
            file.mimetype
          );

          const { error: storageError } = await supabase.storage
            .from(bucketSubida)
            .upload(nombreUnico, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (storageError) {
            console.error(
              "[Storage] Error al subir imagen de Pacientes:",
              storageError.message
            );
            throw crearError(
              "No se pudo almacenar una de las imágenes en el servidor.",
              500
            );
          }

          const archivoDb = await prisma.archivo.create({
            data: {
              nombreOriginal: file.originalname,
              nombreArchivo: nombreUnico,
              ruta: `${bucketSubida}/${nombreUnico}`,
              extension,
              mimeType: file.mimetype,
              tamanioBytes: BigInt(file.size),
            },
          });

          archivosNuevosCreados.push(archivoDb);
          slide.archivoId = archivoDb.id;
          slide.fileName = file.originalname;
        }

        const ahora = new Date();

        await prisma.$transaction(async (tx) => {
          await tx.contenido_grafico.deleteMany({
            where: { ubicacionId: ubicacionDb.id },
          });

          for (let idx = 0; idx < slidesResueltos.length; idx++) {
            const s = slidesResueltos[idx];
            const metaJson = JSON.stringify({
              textoDesplegable: s.textoDesplegable,
              presetKey: s.presetKey || null,
              fileName: s.fileName || null,
            });

            await tx.contenido_grafico.create({
              data: {
                titulo: s.titulo.slice(0, 200),
                descripcion: metaJson,
                altText: s.altText,
                archivoId: s.archivoId || null,
                enlaceUrl: null,
                orden: idx + 1,
                activo: true,
                tipoId: tipoDb.id,
                ubicacionId: ubicacionDb.id,
                estado: "PUBLICADO",
                createdBy: s.createdByOriginal || usuarioLocal.id,
                updatedBy: usuarioLocal.id,
                rejectionReason: null,
                pagina: def.page,
                updatedAt: ahora,
              },
            });
          }
        });
      } catch (err) {
        for (const arch of archivosNuevosCreados) {
          await eliminarArchivoAlmacenado(arch);
        }
        throw err;
      }

      const archivosConservadosIds = new Set(
        slidesResueltos
          .filter((s) => s.archivoId)
          .map((s) => s.archivoId.toString())
      );

      for (const filaAntigua of filasExistentes) {
        if (
          filaAntigua.archivo &&
          !archivosConservadosIds.has(filaAntigua.archivo.id.toString())
        ) {
          await eliminarArchivoAlmacenado(filaAntigua.archivo);
        }
      }

      await prisma.auditoria
        .create({
          data: {
            usuarioId: usuarioLocal.id,
            accion: "ACTUALIZAR",
            entidad: "contenido_grafico",
            entidadId: def.id,
            descripcion: `Actualizó "${def.nombre}" (${slidesResueltos.length} desplegables)`,
          },
        })
        .catch(() => {});

      const filasActualizadas = await prisma.contenido_grafico.findMany({
        where: { ubicacionId: ubicacionDb.id },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        include: { archivo: true },
      });

      return {
        message: `Sección "${def.nombre}" actualizada correctamente.`,
        espacio: formatearEspacioDesdeFilas(def, filasActualizadas),
      };
    }

    // =========================================================================
    // FLUJO C: CARRUSEL PRINCIPAL / BANNERS
    // =========================================================================
    const altText = limpiarTextoSimple(body.altText, 300);
    if (!altText) {
      throw crearError(
        "El Texto Alternativo (ALT) es obligatorio para describir la sección a personas con discapacidad visual."
      );
    }

    const esCarruselInicio = def.id === "espacio-banner-inicio";
    const textoSuperpuesto = limpiarTextoPlanoMultilinea(body.textoSuperpuesto, 300);

    if (esCarruselInicio && !textoSuperpuesto) {
      throw crearError("El texto superpuesto del carrusel es obligatorio.");
    }

    const textoBoton = limpiarTextoSimple(body.textoBoton, 80);
    let enlaceValidado = null;

    if (textoBoton) {
      const rawUrl = normalizarRutaInternaPortal(body.enlaceUrl);
      if (!rawUrl) {
        throw crearError(
          "Debe seleccionar obligatoriamente a qué sección del portal redirecciona el botón."
        );
      }

      if (esCarruselInicio && !RUTAS_INTERNAS_PERMITIDAS.has(rawUrl)) {
        throw crearError(
          "La sección de redirección seleccionada no pertenece a una ruta válida del portal."
        );
      }

      enlaceValidado = validarUrlHttp(rawUrl, "redirección del botón", true);
    }

    const slidesDescriptor = parsearArregloJson(body.slides, "imágenes del carrusel");
    if (!Array.isArray(slidesDescriptor) || slidesDescriptor.length === 0) {
      throw crearError("El espacio debe contar con al menos una imagen.");
    }
    if (slidesDescriptor.length > 15) {
      throw crearError("Se permite un máximo de 15 imágenes en el carrusel.");
    }

    const slidesResueltos = [];
    for (let i = 0; i < slidesDescriptor.length; i++) {
      const item = slidesDescriptor[i];
      if (!item || typeof item !== "object") {
        throw crearError(`Descriptor de imagen inválido en la posición #${i + 1}.`);
      }

      const baseImg = resolverFuenteImagenItem(
        item,
        `la posición #${i + 1}`,
        filasPorId,
        uploadedFiles
      );

      slidesResueltos.push(baseImg);
    }

    const archivosNuevosCreados = [];
    let bucketSubida = null;

    try {
      for (const slide of slidesResueltos) {
        if (slide.kind !== "new") continue;
        if (!bucketSubida) {
          bucketSubida = await obtenerBucketSubida();
        }

        const file = slide.file;
        const { nombreUnico, extension } = generarNombreUnico(
          file.originalname,
          "cg_inicio",
          file.mimetype
        );

        const { error: storageError } = await supabase.storage
          .from(bucketSubida)
          .upload(nombreUnico, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (storageError) {
          console.error(
            "[Storage] Error al subir imagen de contenido gráfico:",
            storageError.message
          );
          throw crearError("No se pudo almacenar una de las imágenes en el servidor.", 500);
        }

        const archivoDb = await prisma.archivo.create({
          data: {
            nombreOriginal: file.originalname,
            nombreArchivo: nombreUnico,
            ruta: `${bucketSubida}/${nombreUnico}`,
            extension,
            mimeType: file.mimetype,
            tamanioBytes: BigInt(file.size),
          },
        });

        archivosNuevosCreados.push(archivoDb);
        slide.archivoId = archivoDb.id;
        slide.fileName = file.originalname;
      }

      const tituloColumna = (textoSuperpuesto || def.nombre).slice(0, 200);
      const ahora = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.contenido_grafico.deleteMany({
          where: { ubicacionId: ubicacionDb.id },
        });

        for (let idx = 0; idx < slidesResueltos.length; idx++) {
          const s = slidesResueltos[idx];
          const metaJson = JSON.stringify({
            textoSuperpuesto,
            textoBoton,
            presetKey: s.presetKey || null,
            fileName: s.fileName || null,
          });

          await tx.contenido_grafico.create({
            data: {
              titulo: tituloColumna,
              descripcion: metaJson,
              altText,
              archivoId: s.archivoId || null,
              enlaceUrl: enlaceValidado,
              orden: idx + 1,
              activo: true,
              tipoId: tipoDb.id,
              ubicacionId: ubicacionDb.id,
              estado: "PUBLICADO",
              createdBy: s.createdByOriginal || usuarioLocal.id,
              updatedBy: usuarioLocal.id,
              rejectionReason: null,
              pagina: def.page,
              updatedAt: ahora,
            },
          });
        }
      });
    } catch (err) {
      for (const arch of archivosNuevosCreados) {
        await eliminarArchivoAlmacenado(arch);
      }
      throw err;
    }

    const archivosConservadosIds = new Set(
      slidesResueltos
        .filter((s) => s.archivoId)
        .map((s) => s.archivoId.toString())
    );

    for (const filaAntigua of filasExistentes) {
      if (
        filaAntigua.archivo &&
        !archivosConservadosIds.has(filaAntigua.archivo.id.toString())
      ) {
        await eliminarArchivoAlmacenado(filaAntigua.archivo);
      }
    }

    await prisma.auditoria
      .create({
        data: {
          usuarioId: usuarioLocal.id,
          accion: "ACTUALIZAR",
          entidad: "contenido_grafico",
          entidadId: def.id,
          descripcion: `Actualizó "${def.nombre}" (${slidesResueltos.length} imágenes)`,
        },
      })
      .catch(() => {});

    const filasActualizadas = await prisma.contenido_grafico.findMany({
      where: { ubicacionId: ubicacionDb.id },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { archivo: true },
    });

    return {
      message: `Espacio "${def.nombre}" actualizado correctamente.`,
      espacio: formatearEspacioDesdeFilas(def, filasActualizadas),
    };
  }
}

export default new CmsContenidoGraficoService();
