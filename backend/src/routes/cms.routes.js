import { Router } from 'express';
import multer from 'multer';
import { crearNoticia, obtenerNoticias } from '../controller/cms.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Guarda temporalmente en memoria para procesarlo

// Ruta POST con 'upload.array('imagenes', 10)' para recibir hasta 10 fotos
router.post('/noticias', verifyToken, upload.array('imagenes', 10), crearNoticia);

// Ruta GET para leer noticias con sus imágenes de respaldo
router.get('/noticias', obtenerNoticias);

export default router;