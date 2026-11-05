import { Router } from 'express';

import { obtenerBanners, crearBanner, actualizarBanner, eliminarBanner } from "../controllers/cms/cms.banners.controller.js";
import {
  obtenerContenidosGraficos,
  obtenerEspacioPublico,
  actualizarEspacioGrafico,
} from "../controllers/cms/cms.contenidoGrafico.controller.js";
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
import {
  obtenerCapacitaciones,
  obtenerCapacitacionesPublicas,
  crearCapacitacion,
  actualizarCapacitacion,
  cambiarEstadoCapacitacion,
  eliminarCapacitacion
} from "../controllers/cms/cms.capacitacion.controller.js";


import { requireCmsAccess, adminViewAccess } from '../middlewares/auth.middleware.js'; 
import { parsearIdBigInt } from '../utils/sanitize.utils.js';
import {
  uploadImagenSingle,
  uploadImagenesArray,
  uploadDocumentoSingle,
  uploadResidenciaFiles,
  uploadCapacitacionFiles,
} from '../middlewares/upload.middleware.js'; 

const router = Router();

router.param('id', (req, _res, next, id) => {
  try {
    parsearIdBigInt(id, 'ID del recurso');
    next();
  } catch (err) {
    next(err);
  }
});

// ==========================================
// MÓDULO: NOTICIAS
// ==========================================
router.get('/noticias', adminViewAccess, obtenerNoticias);
router.post('/noticias', requireCmsAccess, uploadImagenesArray('imagenes', 10), crearNoticia);
router.put('/noticias/:id', requireCmsAccess, uploadImagenesArray('imagenes', 10), actualizarNoticia);
router.delete('/noticias/:id', requireCmsAccess, eliminarNoticia);

// ==========================================
// MÓDULO: DOCUMENTACIÓN
// ==========================================
router.get('/documentacion', adminViewAccess, obtenerDocumentos);
router.post('/documentacion', requireCmsAccess, uploadDocumentoSingle('archivo'), crearDocumento);
router.put('/documentacion/:id', requireCmsAccess, uploadDocumentoSingle('archivo'), actualizarDocumento);
router.delete('/documentacion/:id', requireCmsAccess, eliminarDocumento);

// ==========================================
// MÓDULO: BANNERS Y CONTENIDO GRÁFICO
// ==========================================
router.get("/banners", adminViewAccess, obtenerBanners);
router.post("/banners", requireCmsAccess, crearBanner);
router.put("/banners/:espacioKey", requireCmsAccess, uploadImagenesArray("imagenes", 15), actualizarBanner);
router.delete("/banners/:espacioKey", requireCmsAccess, eliminarBanner);

router.get("/contenido-grafico", adminViewAccess, obtenerContenidosGraficos);
router.get("/contenido-grafico/publico/:espacioKey", obtenerEspacioPublico);
router.put(
  "/contenido-grafico/espacio/:espacioKey",
  requireCmsAccess,
  uploadImagenesArray("imagenes", 15),
  actualizarEspacioGrafico
);
router.put(
  "/contenido-grafico/:espacioKey",
  requireCmsAccess,
  uploadImagenesArray("imagenes", 15),
  actualizarEspacioGrafico
);

// ==========================================
// MÓDULO: PROFESIONALES
// ==========================================
router.get("/profesionales", adminViewAccess, obtenerProfesionales);
router.post("/profesionales", requireCmsAccess, uploadImagenSingle("archivo"), crearProfesional);
router.put("/profesionales/:id", requireCmsAccess, uploadImagenSingle("archivo"), actualizarProfesional);
router.delete("/profesionales/:id", requireCmsAccess, eliminarProfesional);

// ==========================================
// MÓDULO: ESPECIALIDADES
// ==========================================
router.get('/especialidades', adminViewAccess, especialidadCtrl.obtenerEspecialidades);
router.post('/especialidades', requireCmsAccess, especialidadCtrl.crearEspecialidad);
router.put('/especialidades/:id', requireCmsAccess, especialidadCtrl.actualizarEspecialidad);
router.delete('/especialidades/:id', requireCmsAccess, especialidadCtrl.eliminarEspecialidad);

// ==========================================
// MÓDULO: INSTITUCIONAL (AUTORIDADES Y REDES)
// ==========================================
router.get('/institucional', obtenerInstitucional);
router.put('/institucional/autoridades/reordenar', requireCmsAccess, reordenarAutoridades);
router.post('/institucional/autoridades', requireCmsAccess, uploadImagenSingle('archivo'), crearAutoridad);
router.put('/institucional/autoridades/:id', requireCmsAccess, uploadImagenSingle('archivo'), actualizarAutoridad);
router.delete('/institucional/autoridades/:id', requireCmsAccess, eliminarAutoridad);
router.put('/institucional/redes', requireCmsAccess, actualizarRedesSociales);

// ==========================================
// MÓDULO: RESIDENCIAS
// ==========================================
router.get('/residencias', adminViewAccess, obtenerResidencias);
router.post('/residencias', requireCmsAccess, uploadResidenciaFiles, crearResidencia);
router.put('/residencias/:id', requireCmsAccess, uploadResidenciaFiles, actualizarResidencia);
router.patch('/residencias/:id/estado', requireCmsAccess, cambiarEstadoResidencia);
router.delete('/residencias/:id', requireCmsAccess, eliminarResidencia);

// ==========================================
// MÓDULO: CAPACITACIONES
// ==========================================
// Listado completo (borradores/archivadas): solo CMS. El portal publico usa /capacitaciones/publicas.
router.get('/capacitaciones', requireCmsAccess, obtenerCapacitaciones);
router.get('/capacitaciones/publicas', obtenerCapacitacionesPublicas);
router.post('/capacitaciones', requireCmsAccess, uploadCapacitacionFiles, crearCapacitacion);
router.put('/capacitaciones/:id', requireCmsAccess, uploadCapacitacionFiles, actualizarCapacitacion);
router.patch('/capacitaciones/:id/estado', requireCmsAccess, cambiarEstadoCapacitacion);
router.delete('/capacitaciones/:id', requireCmsAccess, eliminarCapacitacion);

export default router;