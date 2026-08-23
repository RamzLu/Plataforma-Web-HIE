import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

// GET /api/roles - Obtiene todos los roles
router.get("/", async (req, res) => {
  try {
    // Usamos Prisma para buscar en la base de datos
    const roles = await prisma.rol.findMany();

    // Express usa JSON.stringify por debajo, así que nuestro parche del BigInt actuará aquí automáticamente
    res.json(roles);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
