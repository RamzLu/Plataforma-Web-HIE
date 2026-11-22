// Archivos de una capacitación: el banner (se registra en la tabla "archivo") y el material (documento,
// video o imagen; solo se guarda su URL en el contenido).

import { generarNombreUnico, formatearTamano } from "../../../utils/file.utils.js";
import { subirArchivo, subirAlAlmacenamiento } from "../../../utils/almacenamiento.utils.js";
import { refDeArchivo, refDesdeUrl } from "../../../utils/archivos.utils.js";

export const BUCKET_DOCUMENTOS = "capacitaciones-documentos";
export const BUCKET_MEDIOS = "capacitaciones-imagenes-videos";

const EXTENSIONES_DOCUMENTO = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const EXTENSIONES_VIDEO = ["mp4", "webm"];
const EXTENSIONES_IMAGEN = ["jpg", "jpeg", "png", "webp", "gif"];

/** Separa lo que cargó el formulario en banner y material. */
export const separarArchivos = (files) => {
  const lista = Array.isArray(files) ? files : files ? [files] : [];
  return {
    banner: lista.find((f) => f.fieldname === "banner" || f.fieldname === "imagen"),
    material: lista.find((f) => f.fieldname === "archivo" || f.fieldname === "contenido" || f.fieldname === "material"),
  };
};

/** Sube el banner y lo registra. */
export const subirBanner = async (archivo) => {
  const { fila, url } = await subirArchivo({
    bucket: BUCKET_MEDIOS,
    prefijo: "cap_banner",
    archivo,
    mensajeError: "No se pudo almacenar el banner de la capacitación.",
  });
  return { imagenId: fila.id, bannerUrl: url, bannerNombre: archivo.originalname };
};

/**
 * Qué tipo de material es un archivo cargado. `tipo` es "documento", "video" o "imagen"
 * (null si no se reconoce: en ese caso no cambia el tipo que ya tenía la capacitación).
 */
export const clasificarMaterial = (archivo) => {
  const { extension } = generarNombreUnico(archivo.originalname, "cap_check", archivo.mimetype);
  const esDocumento =
    EXTENSIONES_DOCUMENTO.includes(extension) ||
    archivo.mimetype.includes("pdf") ||
    archivo.mimetype.includes("word") ||
    archivo.mimetype.includes("officedocument");
  const esVideo = EXTENSIONES_VIDEO.includes(extension) || archivo.mimetype.startsWith("video/");
  const esImagen = EXTENSIONES_IMAGEN.includes(extension) || archivo.mimetype.startsWith("image/");
  const tipo = esDocumento ? "documento" : esVideo ? "video" : esImagen ? "imagen" : null;
  return { esDocumento, esVideo, esImagen, tipo };
};

/** Sube el material (los documentos van a su bucket; el resto, al de imágenes y videos). */
export const subirMaterial = async (archivo, { esDocumento }, tipoParaNombre) => {
  const bucket = esDocumento ? BUCKET_DOCUMENTOS : BUCKET_MEDIOS;
  const { nombreUnico } = generarNombreUnico(archivo.originalname, `cap_${tipoParaNombre || "file"}`, archivo.mimetype);
  const url = await subirAlAlmacenamiento({
    bucket,
    nombre: nombreUnico,
    archivo,
    mensajeError: "No se pudo almacenar el archivo de la capacitación.",
  });
  return { archivoUrl: url, archivoNombre: archivo.originalname, archivoTamano: formatearTamano(archivo.size) };
};

// Archivos de una capacitación (o de su versión pública guardada): banner, material y video subidos.
// Los links externos (YouTube, etc.) no se tocan: refDesdeUrl solo reconoce nuestro almacenamiento.
export const archivosDeCapacitacion = ({ archivo, contenido, videoUrl }) => {
  const refs = [refDeArchivo(archivo), refDesdeUrl(videoUrl)];
  try {
    const extra = JSON.parse(contenido || "{}");
    for (const url of [extra.archivoUrl, extra.bannerUrl, extra.imagenUrl, extra.videoUrl]) {
      refs.push(refDesdeUrl(url));
    }
  } catch {
    // JSON inválido: solo cuentan el banner y el video guardados en las columnas.
  }
  return refs;
};
