import { Router } from 'express';
import multer from 'multer';

import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from '../controller/cms.controller.js';
import { obtenerDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento } from '../controller/cms-controllers/doc.controler.js';

import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

// ==========================================
// 📰 MÓDULO: NOTICIAS
// ==========================================
router.get('/noticias', obtenerNoticias);
router.post('/noticias', verifyToken, upload.array('imagenes', 10), crearNoticia);
router.put('/noticias/:id', verifyToken, upload.array('imagenes', 10), actualizarNoticia);
router.delete('/noticias/:id', verifyToken, eliminarNoticia);


// ==========================================
// 📄 MÓDULO: DOCUMENTACIÓN
// ==========================================
router.get('/documentacion', obtenerDocumentos);
router.post('/documentacion', verifyToken, upload.single('archivo'), crearDocumento);
router.put('/documentacion/:id', verifyToken, upload.single('archivo'), actualizarDocumento); // <-- Ruta para actualizar
router.delete('/documentacion/:id', verifyToken, eliminarDocumento); // <-- Ruta para eliminar

export default router;