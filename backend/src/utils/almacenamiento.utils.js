// Subida de archivos al almacenamiento (Supabase Storage) y registro en la tabla "archivo".
// Es lo que antes estaba copiado en cada módulo (banners, fotos, documentos, imágenes).
//
// Para borrar los archivos que ya no usa nadie ver utils/archivos.utils.js.

import { supabase } from "../config/supabase.js";
import { prisma } from "../config/prisma.js";
import { generarNombreUnico } from "./file.utils.js";

const errorDeAlmacenamiento = (mensaje) => Object.assign(new Error(mensaje), { statusCode: 500 });

/**
 * Sube el buffer de un archivo cargado (Multer) a un bucket y devuelve su URL pública.
 * Si el almacenamiento falla lanza un error 500 con `mensajeError`.
 */
export const subirAlAlmacenamiento = async ({ bucket, nombre, archivo, mensajeError }) => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(nombre, archivo.buffer, { contentType: archivo.mimetype, upsert: true });

  if (error) {
    console.error(`Error al subir "${nombre}" a Supabase (${bucket}):`, error.message);
    throw errorDeAlmacenamiento(mensajeError);
  }
  return supabase.storage.from(bucket).getPublicUrl(nombre).data?.publicUrl || "";
};

/** Registra un archivo ya subido en la tabla "archivo" (la ruta es "bucket/nombre"). */
export const registrarArchivo = ({ bucket, nombre, archivo, extension }) =>
  prisma.archivo.create({
    data: {
      nombreOriginal: archivo.originalname,
      nombreArchivo: nombre,
      ruta: `${bucket}/${nombre}`,
      extension,
      mimeType: archivo.mimetype,
      tamanioBytes: BigInt(archivo.size || 0),
    },
  });

/**
 * Genera un nombre único, sube el archivo y lo registra en la base.
 * @returns {{ fila, nombre, extension, url }} fila de "archivo", nombre en el bucket, extensión y URL pública
 */
export const subirArchivo = async ({ bucket, prefijo, archivo, mensajeError, extensionPorDefecto }) => {
  const { nombreUnico, extension } = generarNombreUnico(archivo.originalname, prefijo, archivo.mimetype);
  const url = await subirAlAlmacenamiento({ bucket, nombre: nombreUnico, archivo, mensajeError });
  const fila = await registrarArchivo({
    bucket,
    nombre: nombreUnico,
    archivo,
    extension: extension || extensionPorDefecto,
  });
  return { fila, nombre: nombreUnico, extension, url };
};
