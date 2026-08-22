import prisma from './src/config/database.js'

async function main() {
  console.log('Probando conexión modularizada a Supabase...\n')
  
  const roles = await prisma.rol.findMany()
  
  // Imprimimos usando JSON.stringify para comprobar que el parche del BigInt funciona
  console.log('Roles:', JSON.stringify(roles, null, 2))
  
  console.log('\n----------------------------------------\n')

  const usuario = await prisma.usuario.findUnique({
    where: { username: 'admin' }
  })
  console.log('Usuario admin:', JSON.stringify(usuario, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    // Forzamos el cierre del proceso para no dejar el Pool de pg colgando en scripts aislados
    process.exit(0) 
  })