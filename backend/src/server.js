import express from 'express'
import cors from 'cors'
import rolesRoutes from './routes/roles.routes.js'
import adminRoutes from './routes/admin.routes.js';
// 1. IMPORTAMOS LAS RUTAS DEL CMS
import cmsRoutes from './routes/cms.routes.js';

const app = express()
const PORT = process.env.PORT || 3000

// --- Middlewares ---
// Permite peticiones desde el frontend (React)
app.use(cors())
// Permite que Express entienda el JSON que envíes en peticiones POST/PUT
app.use(express.json())

// --- Rutas ---
// Ruta de prueba (Healthcheck) para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor Plataforma HIE funcionando correctamente' 
  })
})

// Conectamos las rutas
app.use('/api/roles', rolesRoutes)
app.use('/api/admin', adminRoutes);
// 2. CONECTAMOS LA RUTA DEL CMS AL SERVIDOR
app.use('/api/cms', cmsRoutes);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`)
  console.log(`👥 Roles API:  http://localhost:${PORT}/api/roles`)
  console.log(`📰 CMS API:    http://localhost:${PORT}/api/cms/noticias`)
})