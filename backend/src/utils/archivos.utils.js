// Limpieza de archivos (banners, fotos, documentos, imágenes) que ya no usa nadie.
//
// Cuando el CM edita algo publicado y sube un archivo nuevo, el archivo anterior NO se borra: el portal lo sigue
// mostrando mientras el administrador revisa. Al aprobar la edición, esa versión pública queda reemplazada y sus
// archivos viejos pasan a ser huérfanos. Acá se identifican (por bucket + nombre) y se borran.
//
// Un archivo se identifica por { bucket, nombre }, que es lo que tienen en común todos los módulos:
//   - filas de la tabla "archivo": ruta = "bucket/nombre"            -> refDeArchivo
//   - URLs públicas de Supabase:   .../object/public/bucket/nombre   -> refDesdeUrl

import { supabase } from "../config/supabase.js";
import { prisma } from "../config/prisma.js";
import { registrarFalla } from "./log.utils.js";

const RUTA_PUBLICA = /\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(?:\?.*)?$/;

const origenDe = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

/** { bucket, nombre } de una URL pública de NUESTRO Supabase; null para cualquier otra URL (links externos, blob:...). */
export const refDesdeUrl = (url, supabaseUrl = process.env.SUPABASE_URL) => {
  if (typeof url !== "string") return null;
  const coincidencia = url.match(RUTA_PUBLICA);
  if (!coincidencia) return null;
  const origenPropio = origenDe(supabaseUrl);
  if (!origenPropio || origenDe(url) !== origenPropio) return null;
  try {
    return { bucket: coincidencia[1], nombre: decodeURIComponent(coincidencia[2]) };
  } catch {
    return null;
  }
};

/** { bucket, nombre } de una fila de la tabla "archivo" (el bucket es el primer tramo de su ruta). */
export const refDeArchivo = (archivo) => {
  if (!archivo?.nombreArchivo) return null;
  const bucket = String(archivo.ruta || "").split("/")[0];
  return bucket ? { bucket, nombre: archivo.nombreArchivo } : null;
};

const clave = (ref) => `${ref.bucket}/${ref.nombre}`;

/** Los archivos de la versión anterior que la versión vigente ya no usa (sin repetidos ni nulos). */
export const archivosHuerfanos = (anteriores = [], vigentes = []) => {
  const enUso = new Set(vigentes.filter(Boolean).map(clave));
  const vistos = new Set();
  const resultado = [];
  for (const ref of anteriores) {
    if (!ref) continue;
    const k = clave(ref);
    if (enUso.has(k) || vistos.has(k)) continue;
    vistos.add(k);
    resultado.push(ref);
  }
  return resultado;
};

/**
 * Borra de la base y del almacenamiento los archivos de `anteriores` que `vigentes` ya no usa.
 * Nunca falla: si algo sale mal se registra y se sigue (es limpieza, no puede trabar una aprobación).
 * Si la fila de "archivo" todavía la usa otro registro (clave foránea), no se toca nada.
 */
export const eliminarArchivosReemplazados = async ({ anteriores = [], vigentes = [] }) => {
  for (const ref of archivosHuerfanos(anteriores, vigentes)) {
    try {
      const fila = await prisma.archivo.findFirst({ where: { nombreArchivo: ref.nombre } });
      if (fila) {
        try {
          await prisma.archivo.delete({ where: { id: fila.id } });
        } catch {
          continue; // sigue en uso por otro registro: se conserva
        }
      }
      await supabase.storage.from(ref.bucket).remove([ref.nombre]);
    } catch (error) {
      registrarFalla("Archivos", error);
    }
  }
};
