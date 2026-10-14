import { Router } from 'express';

import { obtenerBanners, crearBanner, actualizarBanner, eliminarBanner } from "../controllers/cms/cms.banners.controller.js";
import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from "../controllers/cms/cms.noticia.controller.js";
import { obtenerDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento } from "../controllers/cms/cms.doc.controller.js";
import { obtenerProfesionales, crearProfesional, eliminarProfesional, actualizarProfesional } from "../controllers/cms/cms.profesional.controller.js";
import * as especialidadCtrl from '../controllers/cms/cms.especialidad.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js'; 
import { uploadMemory } from '../middlewares/upload.middleware.js'; 

const router = Router();

// ==========================================
// MÓDULO: NOTICIAS
// ==========================================
router.get('/noticias', obtenerNoticias);
router.post('/noticias', verifyToken, uploadMemory.array('imagenes', 10), crearNoticia);
router.put('/noticias/:id', verifyToken, uploadMemory.array('imagenes', 10), actualizarNoticia);
router.delete('/noticias/:id', verifyToken, eliminarNoticia);

// ==========================================
// MÓDULO: DOCUMENTACIÓN
// ==========================================
router.get('/documentacion', obtenerDocumentos);
router.post('/documentacion', verifyToken, uploadMemory.single('archivo'), crearDocumento);
router.put('/documentacion/:id', verifyToken, uploadMemory.single('archivo'), actualizarDocumento);
router.delete('/documentacion/:id', verifyToken, eliminarDocumento);

// ==========================================
// MÓDULO: BANNERS
// ==========================================
router.get("/banners", obtenerBanners);
router.post("/banners", verifyToken, uploadMemory.single("imagen"), crearBanner);
router.put("/banners/:id", verifyToken, uploadMemory.single("imagen"), actualizarBanner); 
router.delete("/banners/:id", verifyToken, eliminarBanner); 

// ==========================================
// MÓDULO: PROFESIONALES
// ==========================================
router.get("/profesionales", obtenerProfesionales);
router.post("/profesionales", verifyToken, uploadMemory.single("archivo"), crearProfesional);
router.put("/profesionales/:id", verifyToken, uploadMemory.single("archivo"), actualizarProfesional); // NUEVA LÍNEA
router.delete("/profesionales/:id", verifyToken, eliminarProfesional);

// ==========================================
// MÓDULO: ESPECIALIDADES
// ==========================================
router.get('/especialidades', especialidadCtrl.obtenerEspecialidades);
router.post('/especialidades', verifyToken, especialidadCtrl.crearEspecialidad);
router.put('/especialidades/:id', verifyToken, especialidadCtrl.actualizarEspecialidad);
router.delete('/especialidades/:id', verifyToken, especialidadCtrl.eliminarEspecialidad);



export default router;