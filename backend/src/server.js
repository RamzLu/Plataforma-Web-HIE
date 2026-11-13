import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import rolesRoutes from './routes/roles.routes.js'
import adminRoutes from './routes/admin.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import errorHandler from './middlewares/error.middleware.js';

import cron from 'node-cron';
import CmsNoticiaService from './services/cms/cms.noticia.service.js';
import CmsResidenciaService from './services/cms/cms.residencia.service.js';

const app = express()
const PORT = process.env.PORT || 3000
const PORT_frontend = process.env.PORT_FRONTEND || 5173

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

app.disable('x-powered-by');

if (process.env.TRUST_PROXY !== undefined) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY === 'true' : hops);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde esta dirección IP. Por favor, intente nuevamente más tarde.',
  },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: {
    error: 'Se superó el límite de operaciones de escritura. Por favor, espere unos minutos.',
  },
});

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

app.use('/api/roles', rolesRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);

app.use(errorHandler);

// Cada minuto se publican las noticias y residencias programadas cuya fecha ya llegó.
// Cada tarea corre por separado: si una falla (por ejemplo, la base de Supabase está pausada)
// la otra sigue, y el error se avisa una sola vez hasta que la tarea vuelva a funcionar.
const tareasProgramadas = [
  { nombre: 'noticias programadas', ejecutar: () => CmsNoticiaService.publicarNoticiasProgramadas() },
  { nombre: 'residencias programadas', ejecutar: () => CmsResidenciaService.publicarResidenciasProgramadas() },
];
const tareasConError = new Set();

cron.schedule('* * * * *', async () => {
  for (const tarea of tareasProgramadas) {
    try {
      await tarea.ejecutar();
      if (tareasConError.delete(tarea.nombre)) {
        console.log(`[Cron] Publicación de ${tarea.nombre}: volvió a funcionar.`);
      }
    } catch (error) {
      if (!tareasConError.has(tarea.nombre)) {
        tareasConError.add(tarea.nombre);
        const motivo = String(error?.message || error).split('\n').filter(Boolean).pop();
        console.error(`[Cron] Error al publicar ${tarea.nombre}: ${motivo}. Se reintenta cada minuto; no se vuelve a avisar hasta que se recupere.`);
      }
    }
  }
}, { noOverlap: true });

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`)
  console.log(` Frontend corriendo en http://localhost:${PORT_frontend}`)
})