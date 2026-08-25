// En lugar de crear un cliente nuevo, importamos el que ya tienes configurado en tu proyecto
import { prisma } from './src/config/prisma.js';

async function main() {
  console.log("🔌 Probando conexión a la base de datos...");
  console.log("🔗 URL configurada:", process.env.DATABASE_URL);
  
  try {
    const noticias = await prisma.noticia.findMany();
    console.log("✅ Conexión exitosa.");
    console.log("📝 Noticias actuales en la BD:", noticias);
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });