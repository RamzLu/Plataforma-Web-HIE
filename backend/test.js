import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Node v20+ permite cargar el archivo .env de forma nativa sin librerías de terceros
process.loadEnvFile()

// 1. Configuramos el Pool de conexiones nativo de Postgres usando tu URL de Supabase
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// 2. Le pasamos el Pool al adaptador de Prisma
const adapter = new PrismaPg(pool)

// 3. Instanciamos Prisma con el adaptador
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Conectando a Supabase...')
  
  const roles = await prisma.rol.findMany()
  console.log('Roles en la base de datos:', roles)
  
  const usuario = await prisma.usuario.findUnique({
    where: { username: 'admin' }
  })
  console.log('Usuario admin:', usuario)
}

main()
  .catch(console.error)
  .finally(async () => {
    // Es buena práctica cerrar tanto Prisma como el Pool de Postgres
    await prisma.$disconnect()
    await pool.end()
  })