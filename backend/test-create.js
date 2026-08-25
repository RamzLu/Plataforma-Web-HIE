import { prisma } from './src/config/prisma.js';

async function testCreate() {
  console.log("🔌 Iniciando prueba de inyección en Supabase...");

  try {
    // 1. Crear Categoría
    console.log("1️⃣ Buscando o creando Categoría...");
    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: 'Noticias' } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({ data: { nombre: 'Noticias', descripcion: 'Por defecto' } });
    }
    console.log("   ✔️ Categoría lista. ID:", categoria.id.toString());

    // 2. Crear Rol
    console.log("2️⃣ Buscando o creando Rol ADMIN...");
    let rol = await prisma.rol.findFirst({ where: { nombre: 'ADMIN' } });
    if (!rol) {
      rol = await prisma.rol.create({ data: { nombre: 'ADMIN', descripcion: 'Admin' } });
    }
    console.log("   ✔️ Rol listo. ID:", rol.id.toString());

    // 3. Crear Usuario (Usamos un UUID real de prueba válido para PostgreSQL)
    console.log("3️⃣ Buscando o creando Usuario...");
    const dummyUUID = "123e4567-e89b-12d3-a456-426614174000";
    let usuario = await prisma.usuario.findUnique({ where: { keycloakId: dummyUUID } });
    
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          id: dummyUUID,
          keycloakId: dummyUUID,
          username: "test_admin",
          email: "test@hospital.com",
          nombre: "Test",
          apellido: "Admin",
          rolId: rol.id,
          updatedAt: new Date()
        }
      });
    }
    console.log("   ✔️ Usuario listo. ID:", usuario.id);

    // 4. Crear Noticia
    console.log("4️⃣ Intentando guardar la Noticia...");
    const noticia = await prisma.noticia.create({
      data: {
        titulo: "Noticia de Prueba Directa",
        contenido: "<p>Esto es una prueba saltando React y Keycloak.</p>",
        categoriaId: categoria.id,
        createdBy: usuario.id,
        estado: 'PUBLICADO', // Según tu esquema, esto es un ENUM (USER-DEFINED)
        updatedAt: new Date()
      }
    });

    console.log("\n✅ ¡ÉXITO ROTUNDO! La base de datos aceptó la noticia:");
    console.log({
      id: noticia.id.toString(),
      titulo: noticia.titulo,
      estado: noticia.estado
    });

  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO DE LA BASE DE DATOS:");
    console.error(error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();