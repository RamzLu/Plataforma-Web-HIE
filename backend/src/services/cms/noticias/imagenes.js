// Las imágenes de una noticia: viven en la tabla "archivo" (y en el almacenamiento) y se vinculan a la
// noticia con la tabla noticia_archivo.

import { supabase } from "../../../config/supabase.js";
import { prisma } from "../../../config/prisma.js";
import { subirArchivo } from "../../../utils/almacenamiento.utils.js";

export const BUCKET_IMAGENES = "noticias-imagenes";

/** URL pública de una imagen (fila de "archivo"). */
export const urlImagen = (archivo) => supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(archivo.nombreArchivo).data.publicUrl;

/** URLs de las imágenes de una noticia (a partir de sus filas noticia_archivo con el archivo incluido). */
export const urlsDeImagenes = (noticiaArchivos) => noticiaArchivos.map((na) => urlImagen(na.archivo));

/** Sube las imágenes cargadas y las vincula a la noticia. Devuelve sus URLs. */
export const subirImagenes = async (noticiaId, archivos) => {
  const urls = [];
  for (const archivo of archivos) {
    const { fila, url } = await subirArchivo({
      bucket: BUCKET_IMAGENES,
      prefijo: "img",
      archivo,
      mensajeError: "No se pudo almacenar la imagen de la noticia.",
    });
    await prisma.noticia_archivo.create({ data: { noticiaId, archivoId: fila.id } });
    urls.push(url);
  }
  return urls;
};

/**
 * Desvincula las imágenes que el CM sacó de la noticia (las que ya no están en `urlsConservadas`).
 * El archivo solo se borra si la versión pública no lo está usando (`urlsProtegidas`): el portal lo sigue
 * mostrando hasta que el administrador apruebe la edición.
 */
export const quitarImagenesDescartadas = async ({ noticia, urlsConservadas, urlsProtegidas }) => {
  for (const na of noticia.noticia_archivo) {
    const archivo = na.archivo;
    const url = urlImagen(archivo);
    if (urlsConservadas.includes(url)) continue;

    await prisma.noticia_archivo.deleteMany({ where: { noticiaId: noticia.id, archivoId: archivo.id } });
    if (!urlsProtegidas.includes(url)) {
      await supabase.storage.from(BUCKET_IMAGENES).remove([archivo.nombreArchivo]);
      await prisma.archivo.delete({ where: { id: archivo.id } }).catch(() => {});
    }
  }
};
