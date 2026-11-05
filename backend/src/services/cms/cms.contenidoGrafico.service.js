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
 * Rutas internas válidas del portal público a las que puede redirigir un botón.
 */
export const RUTAS_INTERNAS_PERMITIDAS = new Set([
  "/",
  "/acerca-de",
  "/especialidades",
  "/profesionales",
  "/noticias",
  "/documentacion",
  "/capacitacion",
  "/residencias",
  "/plano",
]);

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
    nombre: "Sección Pacientes y Comunidad",
    descripcion: "Contenedor visual destinado a guías de atención, turnos y orientación al paciente",
    tipo: "Sección Pacientes",
    ubicacionClave: "espacio-seccion-pacientes",
    page: "Inicio",
    dimensiones: "1200x675px",
    aspectRatio: 16 / 9,
    defaults: {
      altText: "Orientación e información útil para pacientes y familiares",
      textoSuperpuesto: "",
      textoBoton: "",
      enlaceUrl: "",
      imagenes: [
        { presetKey: "carrusel-inicio-2", fileName: "orientacion_pacientes.jpg" },
      ],
    },
  },
  {
    id: "espacio-banner-especialidades",
    orden: 3,
    nombre: "Banner Principal de Especialidades",
    descripcion: "Cabecera visual de la página de Especialidades Médicas y Servicios",
    tipo: "Banner de Cabecera",
    ubicacionClave: "espacio-banner-especialidades",
    page: "Especialidades",
    dimensiones: "1920x600px",
    aspectRatio: 16 / 5,
    defaults: {
      altText: "Cabecera de la sección de Especialidades Médicas y Servicios",
      textoSuperpuesto: "ESPECIALIDADES Y SERVICIOS",
      textoBoton: "",
      enlaceUrl: "",
      imagenes: [
        { presetKey: "banner-especialidades", fileName: "banner_especialidades.png" },
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
  "banner-especialidades",
  "banner-capacitaciones",
  "banner-noticias",
  "banner-documentacion",
  "banner-residencias",
]);

const crearError = (mensaje, statusCode = 400) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

/**
 * Limpia texto plano conservando saltos de línea (\n) para textos multilínea como el del carrusel,
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
    ? sanitizarUrlLectura(primeraFila.enlaceUrl, "", true)
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
   * Obtiene la configuración pública vigente de un espacio gráfico fijo puntual (ej. `espacio-banner-inicio`).
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
   * Actualiza un espacio gráfico fijo existente (texto superpuesto, ALT, botón, redirección e imágenes).
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
      const rawUrl = typeof body.enlaceUrl === "string" ? body.enlaceUrl.trim() : "";
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

    // Consultar filas actuales de este espacio fijo
    const filasExistentes = await prisma.contenido_grafico.findMany({
      where: { ubicacionId: ubicacionDb.id },
      include: { archivo: true },
    });

    const filasPorId = new Map(
      filasExistentes.map((f) => [f.id.toString(), f])
    );

    // Validar descriptores antes de tocar Storage o BD
    const slidesResueltos = [];
    for (let i = 0; i < slidesDescriptor.length; i++) {
      const item = slidesDescriptor[i];
      if (!item || typeof item !== "object") {
        throw crearError(`Descriptor de imagen inválido en la posición #${i + 1}.`);
      }

      if (item.kind === "existing") {
        const filaPrev = filasPorId.get(String(item.id || ""));
        if (!filaPrev) {
          throw crearError(
            `La imagen existente #${i + 1} ya no se encuentra disponible. Recargue la vista e intente nuevamente.`
          );
        }
        const metaPrev = parsearMetadatosDescripcion(filaPrev.descripcion);
        slidesResueltos.push({
          kind: "existing",
          archivoId: filaPrev.archivoId,
          presetKey: metaPrev.presetKey || null,
          fileName:
            filaPrev.archivo?.nombreOriginal ||
            metaPrev.fileName ||
            `imagen_${i + 1}.jpg`,
          createdByOriginal: filaPrev.createdBy,
        });
      } else if (item.kind === "preset") {
        const presetKey = String(item.presetKey || "").trim();
        if (!PRESET_KEYS_VALIDAS.has(presetKey)) {
          throw crearError(`Imagen predeterminada inválida en la posición #${i + 1}.`);
        }
        slidesResueltos.push({
          kind: "preset",
          archivoId: null,
          presetKey,
          fileName: limpiarTextoSimple(item.fileName || `${presetKey}.jpg`, 150),
          createdByOriginal: null,
        });
      } else if (item.kind === "new") {
        const fileIndex = Number(item.fileIndex);
        if (
          !Number.isInteger(fileIndex) ||
          fileIndex < 0 ||
          fileIndex >= uploadedFiles.length
        ) {
          throw crearError(
            `No se recibió el archivo correspondiente a la nueva imagen en la posición #${i + 1}.`
          );
        }
        slidesResueltos.push({
          kind: "new",
          file: uploadedFiles[fileIndex],
          presetKey: null,
          createdByOriginal: null,
        });
      } else {
        throw crearError(`Tipo de imagen desconocido en la posición #${i + 1}.`);
      }
    }

    // Subir las imágenes nuevas a Supabase Storage y registrarlas en `archivo`
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

      // Reemplazar atómicamente las filas del espacio fijo manteniendo el orden exacto
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
      // Rollback de archivos recién subidos si falló la transacción en BD
      for (const arch of archivosNuevosCreados) {
        await eliminarArchivoAlmacenado(arch);
      }
      throw err;
    }

    // Limpiar archivos antiguos que fueron quitados del carrusel
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

    // Registrar auditoría (no bloqueante)
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

