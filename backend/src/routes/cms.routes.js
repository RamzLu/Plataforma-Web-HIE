import { Router } from 'express';
import multer from 'multer';
import { obtenerBanners, crearBanner,actualizarBanner, eliminarBanner } from "../controllers/cms/cms.banners.controller.js";;
import { crearNoticia, obtenerNoticias, eliminarNoticia, actualizarNoticia } from "../controllers/cms/cms.noticia.controller.js";
import { obtenerDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento } from "../controllers/cms/cms.doc.controller.js";
import { obtenerProfesionales, crearProfesional, eliminarProfesional } from "../controllers/cms/cms.profesional.controller.js";
import { verifyToken } from '../middlewares/auth.middleware.js';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

// ==========================================
// MÓDULO: NOTICIAS
// ==========================================
router.get('/noticias', obtenerNoticias);
router.post('/noticias', verifyToken, upload.array('imagenes', 10), crearNoticia);
router.put('/noticias/:id', verifyToken, upload.array('imagenes', 10), actualizarNoticia);
router.delete('/noticias/:id', verifyToken, eliminarNoticia);


// ==========================================
// MÓDULO: DOCUMENTACIÓN
// ==========================================
router.get('/documentacion', obtenerDocumentos);
router.post('/documentacion', verifyToken, upload.single('archivo'), crearDocumento);
router.put('/documentacion/:id', verifyToken, upload.single('archivo'), actualizarDocumento);
router.delete('/documentacion/:id', verifyToken, eliminarDocumento);


// ==========================================
// MÓDULO: DOCUMENTACIÓN (incompleto)
// ==========================================
router.get("/banners", obtenerBanners);
router.post("/banners", verifyToken, upload.single("imagen"), crearBanner);
router.put("/banners/:id", verifyToken, upload.single("imagen"), actualizarBanner); 
router.delete("/banners/:id", verifyToken, eliminarBanner); 


// ==========================================
// MÓDULO: PROFESIONALES
// ==========================================
router.get("/profesionales", obtenerProfesionales);
router.post("/profesionales", upload.single("archivo"), crearProfesional);
router.delete("/profesionales/:id", eliminarProfesional);

export default router;