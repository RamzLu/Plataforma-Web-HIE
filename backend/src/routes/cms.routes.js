import { Router } from 'express';
// Agregamos obtenerNoticias a la importación
import { crearNoticia, obtenerNoticias } from '../controller/cms.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta para CREAR una noticia (POST)
router.post('/noticias', verifyToken, crearNoticia);

// NUEVA Ruta para LEER las noticias (GET) - La dejamos pública para que el portal pueda verlas
router.get('/noticias', obtenerNoticias);

export default router;