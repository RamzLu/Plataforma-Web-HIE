import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Cargar variables de entorno. 
// Usamos un try-catch porque en producción (Docker/Vercel/Render) 
// el archivo .env no existirá, las variables se inyectan en el servidor.
try {
  process.loadEnvFile()
} catch (error) {
  // Se ignora silenciosamente si no hay archivo .env
}

// ----------------------------------------------------------------------
// PARCHE TEMPORAL: BigInt a JSON
// TODO: Eliminar cuando se cambien los IDs de int8 a UUID/Int normales
BigInt.prototype.toJSON = function () {
  return this.toString()
}
// ----------------------------------------------------------------------

// 1. Configuramos el Pool de conexiones nativo
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// 2. Le pasamos el Pool al adaptador de Prisma
const adapter = new PrismaPg(pool)

// 3. Instanciamos Prisma
const prisma = new PrismaClient({ adapter })

// Al exportarlo por defecto, Node.js lo mantendrá en caché ("Singleton pattern")
export default prisma