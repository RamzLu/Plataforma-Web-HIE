import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { verifyToken, requireRole, ROLES_CMS, ROLES_ADMIN } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyToken, requireRole(...ROLES_CMS, ...ROLES_ADMIN), async (req, res) => {
  try {
    const roles = await prisma.rol.findMany();

    res.json(roles);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
