import { Router } from 'express';

import { crearControladorEditorial } from '../controllers/cms/editorial.controller.js';
import { MODULOS_EDITORIALES } from '../services/cms/editorial.modulos.js';
import { obtenerInstitucional } from '../controllers/cms/cms.institucional.controller.js';
import { obtenerEspacioPublico } from '../controllers/cms/cms.contenidoGrafico.controller.js';

// Portal público: solo lectura y solo contenido publicado. No acepta token ni vista de administración;
// todo lo que necesita sesión (borradores, pendientes, escritura) vive en /api/cms.
const router = Router();

router.use((req, _res, next) => {
  req.adminView = false;
  next();
});

// Mismos módulos que el CMS, solo el listado (con req.adminView = false devuelven solo lo publicado).
for (const modulo of MODULOS_EDITORIALES) {
  router.get(`/${modulo.ruta}`, crearControladorEditorial(modulo).listar);
}
router.get('/institucional', obtenerInstitucional);
router.get('/contenido-grafico/:espacioKey', obtenerEspacioPublico);

export default router;
