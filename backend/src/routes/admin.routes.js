import { Router } from 'express';
import { requireAdminAccess } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/configuracion-critica', requireAdminAccess, (req, res) => {
  res.json({
    mensaje: '¡Bienvenido al panel de administración crítica!',
    usuarioId: req.user.keycloakId,
    email: req.user.email
  });
});

export default router;