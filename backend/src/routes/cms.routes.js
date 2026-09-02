import { Router } from 'express';
import multer from 'multer';
import { obtenerBanners, crearBanner,actualizarBanner, eliminarBanner } from "../controller/cms-controllers/cms.banners.controller.js";;
import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from "../controller/cms-controllers/cms.noticia.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js';
import { obtenerDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento } from "../controller/cms-controllers/cms.doc.controller.js";


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

router.get("/banners", obtenerBanners);
router.post("/banners", verifyToken, upload.single("imagen"), crearBanner);
router.put("/banners/:id", verifyToken, upload.single("imagen"), actualizarBanner); 
router.delete("/banners/:id", verifyToken, eliminarBanner); 

export default router;