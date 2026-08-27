import { Router } from 'express';
import multer from 'multer';
import { obtenerBanners, crearBanner,actualizarBanner, eliminarBanner } from "../controller/banners.controller.js";
import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from '../controller/cms.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.post('/noticias', verifyToken, upload.array('imagenes', 10), crearNoticia);
router.get('/noticias', obtenerNoticias);
router.delete('/noticias/:id', verifyToken, eliminarNoticia);
router.put('/noticias/:id', verifyToken, upload.array('imagenes', 10), actualizarNoticia);

router.get("/banners", obtenerBanners);
router.post("/banners", verifyToken, upload.single("imagen"), crearBanner);
router.put("/banners/:id", verifyToken, upload.single("imagen"), actualizarBanner); 
router.delete("/banners/:id", verifyToken, eliminarBanner); 

export default router;