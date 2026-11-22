// El archivo de un documento (columna archivoId; vive en la tabla "archivo" y en el almacenamiento).

import { subirArchivo } from "../../../utils/almacenamiento.utils.js";

export const BUCKET_DOCUMENTOS = "documentos";

/** Sube el documento y lo registra; devuelve la fila de "archivo" y su URL pública. */
export const subirDocumento = async (archivo) => {
  const { fila, url } = await subirArchivo({
    bucket: BUCKET_DOCUMENTOS,
    prefijo: "doc",
    archivo,
    mensajeError: "No se pudo almacenar el documento.",
  });
  return { fila, url };
};
