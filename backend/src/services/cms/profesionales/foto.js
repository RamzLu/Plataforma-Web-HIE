// La fotografía de un profesional (columna imagenId; vive en la tabla "archivo" y en el almacenamiento).

import { supabase } from "../../../config/supabase.js";
import { prisma } from "../../../config/prisma.js";
import { subirArchivo } from "../../../utils/almacenamiento.utils.js";

export const BUCKET_FOTOS = "noticias-imagenes";

/** Sube la foto y la registra; devuelve el id de la fila de "archivo". */
export const subirFoto = async (archivo) => {
  const { fila } = await subirArchivo({
    bucket: BUCKET_FOTOS,
    prefijo: "prof",
    archivo,
    mensajeError: "No se pudo almacenar la fotografía del profesional.",
  });
  return fila.id;
};

/** Borra la foto anterior (almacenamiento y fila). */
export const quitarFoto = async (archivo) => {
  await supabase.storage.from(BUCKET_FOTOS).remove([archivo.nombreArchivo]);
  await prisma.archivo.delete({ where: { id: archivo.id } });
};
