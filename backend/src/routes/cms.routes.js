import { Router } from 'express';

import { obtenerBanners, crearBanner, actualizarBanner, eliminarBanner } from "../controllers/cms/cms.banners.controller.js";
import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from "../controllers/cms/cms.noticia.controller.js";
import { obtenerDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento } from "../controllers/cms/cms.doc.controller.js";
import { obtenerProfesionales, crearProfesional, eliminarProfesional, actualizarProfesional } from "../controllers/cms/cms.profesional.controller.js";
import * as especialidadCtrl from '../controllers/cms/cms.especialidad.controller.js';
import { 
  obtenerInstitucional, 
  crearAutoridad, 
  actualizarAutoridad, 
  eliminarAutoridad, 
  reordenarAutoridades,
  actualizarRedesSociales 
} from "../controllers/cms/cms.institucional.controller.js";
import {
  obtenerResidencias,
  crearResidencia,
  actualizarResidencia,
  eliminarResidencia,
  cambiarEstadoResidencia
} from "../controllers/cms/cms.residencia.controller.js";


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
router.put("/profesionales/:id", verifyToken, uploadMemory.single("archivo"), actualizarProfesional);
router.delete("/profesionales/:id", verifyToken, eliminarProfesional);

// ==========================================
// MÓDULO: ESPECIALIDADES
// ==========================================
router.get('/especialidades', especialidadCtrl.obtenerEspecialidades);
router.post('/especialidades', verifyToken, especialidadCtrl.crearEspecialidad);
router.put('/especialidades/:id', verifyToken, especialidadCtrl.actualizarEspecialidad);
router.delete('/especialidades/:id', verifyToken, especialidadCtrl.eliminarEspecialidad);

// ==========================================
// MÓDULO: INSTITUCIONAL (AUTORIDADES Y REDES)
// ==========================================
router.get('/institucional', obtenerInstitucional);
router.put('/institucional/autoridades/reordenar', verifyToken, reordenarAutoridades);
router.post('/institucional/autoridades', verifyToken, uploadMemory.single('archivo'), crearAutoridad);
router.put('/institucional/autoridades/:id', verifyToken, uploadMemory.single('archivo'), actualizarAutoridad);
router.delete('/institucional/autoridades/:id', verifyToken, eliminarAutoridad);
router.put('/institucional/redes', verifyToken, actualizarRedesSociales);

// ==========================================
// MÓDULO: RESIDENCIAS
// ==========================================
router.get('/residencias', obtenerResidencias);
router.post('/residencias', verifyToken, uploadMemory.any(), crearResidencia);
router.put('/residencias/:id', verifyToken, uploadMemory.any(), actualizarResidencia);
router.patch('/residencias/:id/estado', verifyToken, cambiarEstadoResidencia);
router.delete('/residencias/:id', verifyToken, eliminarResidencia);

export default router;