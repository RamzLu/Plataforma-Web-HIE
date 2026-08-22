import { Router } from 'express';
import { checkJwt, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta protegida: Solo accesible si envías un token válido Y tienes el rol 'admin'
router.get('/configuracion-critica', checkJwt, requireRole('admin'), (req, res) => {
  res.json({
    mensaje: '¡Bienvenido al panel de administración crítica!',
    usuarioId: req.auth.payload.sub,
    email: req.auth.payload.email
  });
});

export default router;