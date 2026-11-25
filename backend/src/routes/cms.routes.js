import { Router } from 'express';

import {
  obtenerContenidosGraficos,
  actualizarEspacioGrafico,
} from "../controllers/cms/cms.contenidoGrafico.controller.js";
import { 
  obtenerInstitucional, 
  crearAutoridad, 
  actualizarAutoridad, 
  eliminarAutoridad, 
  reordenarAutoridades,
  actualizarRedesSociales,
  actualizarSedeCentral
} from "../controllers/cms/cms.institucional.controller.js";
import { crearControladorEditorial } from "../controllers/cms/editorial.controller.js";
import { MODULOS_EDITORIALES } from "../services/cms/editorial.modulos.js";
import { validar } from "../middlewares/validar.middleware.js";
import { ESQUEMAS_EDITORIALES, esquemaRevision } from "../validation/editorial.schemas.js";
import { obtenerSolicitudesEliminacion, resolverSolicitudEliminacion } from "../controllers/cms/cms.eliminaciones.controller.js";
import { obtenerActividadReciente } from "../controllers/cms/cms.actividad.controller.js";
import { requireCmsAccess, requireAdminAccess, requireCmsOrAdminAccess, vistaCmsAccess } from '../middlewares/auth.middleware.js';
import { parsearIdBigInt } from '../utils/sanitize.utils.js';
import { uploadImagenSingle, uploadImagenesArray } from '../middlewares/upload.middleware.js';

// Panel CMS y Admin: todas las rutas requieren token. El portal público usa /api/portal (portal.routes.js).
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
// MÓDULOS CON FLUJO EDITORIAL (noticias, documentación, profesionales, especialidades, residencias, capacitaciones)
// Todos exponen las mismas rutas. El CM pide (crear / editar con el campo "estado") y el Admin revisa:
//   GET    /<módulo>                listado (?admin=true: vista interna)
//   POST   /<módulo>                crear
//   PUT    /<módulo>/:id            editar o pedir un cambio de estado (publicar, archivar...)
//   PATCH  /<módulo>/:id/revision   Admin: { decision: "APROBAR" | "RECHAZAR", motivo }
// Cada cuerpo se valida con su esquema (validation/editorial.schemas.js) antes de llegar al controlador.
//   DELETE /<módulo>/:id            eliminar (si está publicado queda una solicitud para el Admin)
//   PATCH  /<módulo>/:id/descartar  CM: manda a la Papelera algo rechazado (/restaurar lo devuelve a Rechazados)
// ==========================================
for (const modulo of MODULOS_EDITORIALES) {
  const controlador = crearControladorEditorial(modulo);
  const archivos = modulo.archivos ? [modulo.archivos] : [];
  const esquemas = ESQUEMAS_EDITORIALES[modulo.ruta];
  router.get(`/${modulo.ruta}`, vistaCmsAccess, controlador.listar);
  // La validación va después de la carga de archivos: en los formularios con archivos el cuerpo se arma ahí.
  router.post(`/${modulo.ruta}`, requireCmsAccess, ...archivos, validar(esquemas.crear), controlador.crear);
  router.put(`/${modulo.ruta}/:id`, requireCmsAccess, ...archivos, validar(esquemas.actualizar), controlador.actualizar);
  router.patch(`/${modulo.ruta}/:id/revision`, requireAdminAccess, validar(esquemaRevision), controlador.revisar);
  router.delete(`/${modulo.ruta}/:id`, requireCmsAccess, controlador.eliminar);
  // Papelera de lo rechazado: solo el CM (requireCmsAccess no admite al Admin). Se vacía sola a los 15 días.
  router.patch(`/${modulo.ruta}/:id/descartar`, requireCmsAccess, controlador.descartar);
  router.patch(`/${modulo.ruta}/:id/restaurar`, requireCmsAccess, controlador.restaurar);
}

// ==========================================
// MÓDULO: CONTENIDO GRÁFICO
// ==========================================
router.get("/contenido-grafico", vistaCmsAccess, obtenerContenidosGraficos);
router.put(
  "/contenido-grafico/espacio/:espacioKey",
  requireCmsAccess,
  uploadImagenesArray("imagenes", 15),
  actualizarEspacioGrafico
);

// ==========================================
// MÓDULO: INSTITUCIONAL (AUTORIDADES, REDES Y SEDE)
// ==========================================
router.get('/institucional', vistaCmsAccess, obtenerInstitucional);
router.put('/institucional/sede', requireCmsAccess, uploadImagenSingle('archivo'), actualizarSedeCentral);
router.put('/institucional/autoridades/reordenar', requireCmsAccess, reordenarAutoridades);
router.post('/institucional/autoridades', requireCmsAccess, uploadImagenSingle('archivo'), crearAutoridad);
router.put('/institucional/autoridades/:id', requireCmsAccess, uploadImagenSingle('archivo'), actualizarAutoridad);
router.delete('/institucional/autoridades/:id', requireCmsAccess, eliminarAutoridad);
router.put('/institucional/redes', requireCmsAccess, actualizarRedesSociales);

// ==========================================
// SOLICITUDES DE ELIMINACIÓN (contenido publicado que el CM pidió borrar)
// ==========================================
router.get('/solicitudes-eliminacion', requireAdminAccess, obtenerSolicitudesEliminacion);
router.patch('/solicitudes-eliminacion/:entidad/:id', requireAdminAccess, resolverSolicitudEliminacion);

// ==========================================
// ACTIVIDAD RECIENTE (tabla auditoria)
// ==========================================
router.get('/actividad', requireCmsOrAdminAccess, obtenerActividadReciente);

export default router;
