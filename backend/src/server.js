import express from 'express'
import cors from 'cors'
import rolesRoutes from './routes/roles.routes.js'

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

// Conectamos las rutas de roles
app.use('/api/roles', rolesRoutes)

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`)
  console.log(` Healthcheck: http://localhost:${PORT}/api/health`)
  console.log(` Roles API:  http://localhost:${PORT}/api/roles`)
})