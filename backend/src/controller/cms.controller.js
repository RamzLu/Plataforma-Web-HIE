import { prisma } from "../config/prisma.js";

// Obtener todas las publicaciones (puede ser público o privado según lo que necesites)
export const obtenerPublicacionesCMS = async (req, res) => {
  try {
    const publicaciones = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(publicaciones);
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res
      .status(500)
      .json({ error: "Error al obtener las publicaciones del CMS." });
  }
};

// Crear una nueva publicación (Exclusivo para CMD y Admin)
export const crearPublicacionCMS = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "El título y el contenido son obligatorios." });
    }

    // Obtenemos el ID del usuario directamente del Token JWT que validó Keycloak
    const authorId = req.auth?.payload?.sub;

    const nuevaPublicacion = await prisma.post.create({
      data: {
        title,
        content,
        category: category || "General",
        authorId: authorId || "desconocido",
      },
    });

    res.status(201).json({
      mensaje: "Publicación creada exitosamente",
      publicacion: nuevaPublicacion,
    });
  } catch (error) {
    console.error("Error al crear publicación:", error);
    res
      .status(500)
      .json({ error: "Error al guardar la publicación en la base de datos." });
  }
};

// Eliminar una publicación (Idealmente solo para Admin o el creador)
export const eliminarPublicacionCMS = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id: Number(id) },
    });

    res.json({ mensaje: "Publicación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar publicación:", error);
    res.status(500).json({ error: "No se pudo eliminar la publicación." });
  }
};
