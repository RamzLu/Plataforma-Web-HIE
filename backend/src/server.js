import express from 'express'
import cors from 'cors'
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

// --- Middlewares ---
app.use(cors())
app.use(express.json())

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