import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import rolesRoutes from './routes/roles.routes.js'
import adminRoutes from './routes/admin.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import errorHandler from './middlewares/error.middleware.js';

// Importaciones para el CRON JOB
import cron from 'node-cron';
import CmsNoticiaService from './services/cms/cms.noticia.service.js';

const app = express()
const PORT = process.env.PORT || 3000
const PORT_frontend = process.env.PORT_FRONTEND || 5173

// --- Configuracion de CORS (V8: Lista blanca de origenes del frontend) ---
const normalizarOrigen = (url = '') => url.trim().replace(/\/+$/, '');

const origenesConfigurados = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(normalizarOrigen)
  .filter(Boolean);

const allowedOrigins = new Set(
  origenesConfigurados.length > 0
    ? origenesConfigurados
    : [
        `http://localhost:${PORT_frontend}`,
        `http://127.0.0.1:${PORT_frontend}`,
      ]
);

export const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin cabecera Origin (ej. navegacion directa o clientes server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const origenNormalizado = normalizarOrigen(origin);
    if (allowedOrigins.has(origenNormalizado)) {
      return callback(null, true);
    }

    const corsError = new Error('Origen no permitido por la política de CORS.');
    corsError.statusCode = 403;
    return callback(corsError, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

// Desactivar cabecera X-Powered-By para no exponer la tecnologia del servidor (V9)
app.disable('x-powered-by');

// --- Rate Limiting (V9: Proteccion contra abuso y fuerza bruta) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // maximo 300 solicitudes por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde esta dirección IP. Por favor, intente nuevamente más tarde.',
  },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 60, // maximo 60 operaciones de escritura por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: {
    error: 'Se superó el límite de operaciones de escritura. Por favor, espere unos minutos.',
  },
});

// --- Middlewares de Seguridad y Parseo (V9) ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors(corsOptions));
app.use('/api', apiLimiter);
app.use('/api', writeLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Conectamos las rutas
app.use('/api/roles', rolesRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);

app.use(errorHandler);

// --- TAREAS PROGRAMADAS (CRON JOB) ---
cron.schedule('* * * * *', async () => {
  await CmsNoticiaService.publicarNoticiasProgramadas();
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`)
  console.log(` Frontend corriendo en http://localhost:${PORT_frontend}`)
})