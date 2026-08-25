import { Router } from 'express';
import multer from 'multer';
import { crearNoticia, obtenerNoticias, eliminarNoticia } from '../controller/cms.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.post('/noticias', verifyToken, upload.array('imagenes', 10), crearNoticia);
router.get('/noticias', obtenerNoticias);
router.delete('/noticias/:id', verifyToken, eliminarNoticia);

export default router;