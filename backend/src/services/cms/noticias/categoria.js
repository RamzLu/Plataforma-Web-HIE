import { prisma } from "../../../config/prisma.js";

/** Nombre con el que se muestra una categoría: sin categoría, o "Noticias"/"Noticia", es "General". */
export const nombreCategoriaVisible = (nombre) => {
  const limpio = nombre || "General";
  return ["noticias", "noticia"].includes(limpio.toLowerCase()) ? "General" : limpio;
};

/** La categoría con ese nombre (se crea si no existe). */
export const buscarOCrearCategoria = async (nombre, { sinDistinguirMayusculas = false } = {}) => {
  const where = sinDistinguirMayusculas ? { nombre: { equals: nombre, mode: "insensitive" } } : { nombre };
  let categoria = await prisma.categoria_noticia.findFirst({ where });
  if (!categoria) {
    categoria = await prisma.categoria_noticia.create({
      data: { nombre, descripcion: `Clasificación ${nombre}` },
    });
  }
  return categoria;
};
