import { Router } from 'express';

import { obtenerNoticias } from '../controllers/cms/cms.noticia.controller.js';
import { obtenerDocumentos } from '../controllers/cms/cms.doc.controller.js';
import { obtenerProfesionales } from '../controllers/cms/cms.profesional.controller.js';
import { obtenerEspecialidades } from '../controllers/cms/cms.especialidad.controller.js';
import { obtenerResidencias } from '../controllers/cms/cms.residencia.controller.js';
import { obtenerCapacitacionesPublicas } from '../controllers/cms/cms.capacitacion.controller.js';
import { obtenerInstitucional } from '../controllers/cms/cms.institucional.controller.js';
import { obtenerEspacioPublico } from '../controllers/cms/cms.contenidoGrafico.controller.js';

// Portal público: solo lectura y solo contenido publicado. No acepta token ni vista de administración;
// todo lo que necesita sesión (borradores, pendientes, escritura) vive en /api/cms.
const router = Router();

router.use((req, _res, next) => {
  req.adminView = false;
  next();
});

router.get('/noticias', obtenerNoticias);
router.get('/documentacion', obtenerDocumentos);
router.get('/profesionales', obtenerProfesionales);
router.get('/especialidades', obtenerEspecialidades);
router.get('/residencias', obtenerResidencias);
router.get('/capacitaciones', obtenerCapacitacionesPublicas);
router.get('/institucional', obtenerInstitucional);
router.get('/contenido-grafico/:espacioKey', obtenerEspacioPublico);

export default router;
