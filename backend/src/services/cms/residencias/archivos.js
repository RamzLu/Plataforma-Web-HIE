// Archivos de una residencia: el banner (columna imagenId) y el documento adjunto (se guarda en el JSON
// de contenido). Los dos viven en la tabla "archivo" y en el almacenamiento.

import { supabase } from "../../../config/supabase.js";
import { prisma } from "../../../config/prisma.js";
import { formatearTamano } from "../../../utils/file.utils.js";
import { parsearIdBigInt } from "../../../utils/sanitize.utils.js";
import { subirArchivo } from "../../../utils/almacenamiento.utils.js";
import { refDeArchivo } from "../../../utils/archivos.utils.js";

export const BUCKET_BANNER = "noticias-imagenes";
export const BUCKET_DOCUMENTO = "documentos";

/** Separa lo que cargó el formulario en banner y documento. */
export const separarArchivos = (files) => {
  const lista = Array.isArray(files) ? files : files ? [files] : [];
  return {
    banner: lista.find((f) => f.fieldname === "banner" || f.fieldname === "imagen"),
    documento: lista.find((f) => f.fieldname === "archivo" || f.fieldname === "documento"),
  };
};

/** Sube el banner y lo registra; devuelve el id de la fila de "archivo". */
export const subirBanner = async (archivo) => {
  const { fila } = await subirArchivo({
    bucket: BUCKET_BANNER,
    prefijo: "residencia_banner",
    archivo,
    mensajeError: "No se pudo almacenar el banner de la residencia.",
    extensionPorDefecto: "jpg",
  });
  return fila.id;
};

/** Sube el documento adjunto y devuelve los datos que se guardan en el contenido de la residencia. */
export const subirDocumento = async (archivo) => {
  const { fila, nombre, extension, url } = await subirArchivo({
    bucket: BUCKET_DOCUMENTO,
    prefijo: "residencia_doc",
    archivo,
    mensajeError: "No se pudo almacenar el documento adjunto de la residencia.",
    extensionPorDefecto: "pdf",
  });
  return {
    documentoId: fila.id.toString(),
    documentoNombre: archivo.originalname,
    documentoTamano: formatearTamano(archivo.size),
    documentoTipo: (extension || "pdf").toUpperCase(),
    documentoUrl: url,
    documentoArchivoNombre: nombre,
  };
};

/**
 * Qué archivos usa hoy la versión pública de la residencia. Esos NO se borran al editar: el portal los sigue
 * mostrando hasta que el administrador apruebe. Si hay una edición en revisión, la pública es la guardada en
 * "snapshotPublico"; si no, es la del registro actual.
 */
export const archivosPublicos = ({ provieneDePublicada, snapshotPublico, residencia }) => {
  const bannerId = provieneDePublicada ? (snapshotPublico ? snapshotPublico.imagenId : residencia.imagenId) : null;
  let documentoId = null;
  if (provieneDePublicada) {
    try {
      const contenido = JSON.parse((snapshotPublico ? snapshotPublico.contenido : residencia.contenido) || "{}");
      documentoId = contenido?.documento?.documentoId ?? null;
    } catch {
      // JSON inválido: no hay documento público que proteger.
    }
  }
  return {
    esBannerPublico: (archivoId) => bannerId != null && String(archivoId) === String(bannerId),
    esDocumentoPublico: (archivoId) => documentoId != null && String(archivoId) === String(documentoId),
  };
};

/** Borra el banner anterior (almacenamiento y fila), salvo que siga siendo el público. Nunca falla. */
export const quitarBannerAnterior = async (archivo, esBannerPublico) => {
  if (!archivo || esBannerPublico(archivo.id)) return;
  try {
    await supabase.storage.from(BUCKET_BANNER).remove([archivo.nombreArchivo]);
    await prisma.archivo.delete({ where: { id: archivo.id } });
  } catch (e) {
    console.warn("No se pudo remover el banner anterior:", e.message);
  }
};

/** Borra el documento anterior (almacenamiento y fila), salvo que siga siendo el público. Nunca falla. */
export const quitarDocumentoAnterior = async (documentoMeta, esDocumentoPublico) => {
  if (!documentoMeta?.documentoId || esDocumentoPublico(documentoMeta.documentoId)) return;
  try {
    if (documentoMeta.documentoArchivoNombre) {
      await supabase.storage.from(BUCKET_DOCUMENTO).remove([documentoMeta.documentoArchivoNombre]);
    }
    await prisma.archivo.delete({ where: { id: parsearIdBigInt(documentoMeta.documentoId, "ID de documento") } });
  } catch (e) {
    console.warn("No se pudo remover documento previo:", e.message);
  }
};

// Archivos de una residencia (o de su versión pública guardada): el banner y el documento adjunto.
export const archivosDeResidencia = ({ archivo, contenido }) => {
  const refs = [refDeArchivo(archivo)];
  try {
    const nombre = JSON.parse(contenido || "{}")?.documento?.documentoArchivoNombre;
    if (nombre) refs.push({ bucket: BUCKET_DOCUMENTO, nombre });
  } catch {
    // JSON inválido: no hay documento adjunto que considerar.
  }
  return refs;
};
