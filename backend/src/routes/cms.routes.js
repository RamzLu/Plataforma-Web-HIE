import { Router } from "express";
import { checkJwt, requireRole } from "../middlewares/auth.middleware.js";
import {
  obtenerPublicacionesCMS,
  crearPublicacionCMS,
  eliminarPublicacionCMS,
} from "../controllers/cms.controller.js";

const router = Router();

// Rutas protegidas del CMS
// 1. Ver lista: Requiere estar autenticado (cualquier rol de CMD o Admin)
router.get("/", checkJwt, obtenerPublicacionesCMS);

// 2. Crear noticia: Requiere estar autenticado y tener al menos rol 'cmd' (o 'admin')
router.post("/", checkJwt, requireRole("cmd"), crearPublicacionCMS);

// 3. Eliminar noticia: ¡Esta es crítica! Exigiremos que sea estrictamente 'admin'
router.delete("/:id", checkJwt, requireRole("admin"), eliminarPublicacionCMS);

export default router;
