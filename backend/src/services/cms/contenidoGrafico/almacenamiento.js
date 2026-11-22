// Imágenes de los espacios gráficos: en qué bucket se suben, su URL pública y cómo se borran.

import { prisma } from "../../../config/prisma.js";
import { supabase } from "../../../config/supabase.js";

export const PRIMARY_BUCKET = "banners-imagenes";
export const FALLBACK_BUCKET = "noticias-imagenes";

let resolvedUploadBucket = null;

/**
 * Determina y garantiza un bucket público válido en Supabase Storage para guardar imágenes.
 */
export async function obtenerBucketSubida() {
  if (resolvedUploadBucket) return resolvedUploadBucket;

  try {
    const { data, error } = await supabase.storage.getBucket(PRIMARY_BUCKET);
    if (!error && data) {
      resolvedUploadBucket = PRIMARY_BUCKET;
      return resolvedUploadBucket;
    }

    const { error: createErr } = await supabase.storage.createBucket(
      PRIMARY_BUCKET,
      {
        public: true,
      },
    );
    if (
      !createErr ||
      String(createErr.message || "")
        .toLowerCase()
        .includes("already exists")
    ) {
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
export function resolverUrlPublicaArchivo(archivo) {
  if (!archivo || !archivo.nombreArchivo) return null;
  let bucket = PRIMARY_BUCKET;
  if (typeof archivo.ruta === "string" && archivo.ruta.includes("/")) {
    bucket = archivo.ruta.split("/")[0] || PRIMARY_BUCKET;
  }
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(archivo.nombreArchivo);
  return data?.publicUrl || null;
}

/**
 * Elimina un archivo de Supabase Storage y de la tabla `archivo` (best-effort).
 */
export async function eliminarArchivoAlmacenado(archivo) {
  if (!archivo) return;
  let bucket = PRIMARY_BUCKET;
  if (typeof archivo.ruta === "string" && archivo.ruta.includes("/")) {
    bucket = archivo.ruta.split("/")[0] || PRIMARY_BUCKET;
  }
  await supabase.storage
    .from(bucket)
    .remove([archivo.nombreArchivo])
    .catch(() => {});
  await prisma.archivo.delete({ where: { id: archivo.id } }).catch(() => {});
}
