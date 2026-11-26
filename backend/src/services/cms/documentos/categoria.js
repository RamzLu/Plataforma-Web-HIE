import { prisma } from "../../../config/prisma.js";

/** La categoría con ese nombre (sin distinguir mayúsculas); se crea si no existe. */
export const buscarOCrearCategoria = async (nombre) => {
  let categoria = await prisma.categoria_documento.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" } },
  });
  if (!categoria) {
    categoria = await prisma.categoria_documento.create({
      data: { nombre, descripcion: "Generada automáticamente", activo: true },
    });
  }
  return categoria;
};
