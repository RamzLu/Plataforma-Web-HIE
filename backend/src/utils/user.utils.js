import { prisma } from "../config/prisma.js";

/**
 * Verifica si el usuario autenticado existe en la BD local. Si no existe, lo crea con rol ADMIN.
 * user: el objeto req.user que viene del middleware de autenticación.
 * devuelve el usuario de la base de datos Prisma.
 */
export const obtenerOCrearUsuarioLocal = async (user) => {
  const keycloakSub = user?.keycloakId;
  const username = user?.username || `user_${Date.now()}`;
  const name = user?.name || "Editor CMS";

  let usuarioLocal = await prisma.usuario.findFirst({
    where: { OR: [{ keycloakId: keycloakSub }, { username: username }] },
  });

  // Si no existe, lo creamos como fallback
  if (!usuarioLocal) {
    let rolAdmin = await prisma.rol.findFirst({ where: { nombre: "ADMIN" } });
    if (!rolAdmin) {
      rolAdmin = await prisma.rol.create({ data: { nombre: "ADMIN", descripcion: "Admin" } });
    }
    usuarioLocal = await prisma.usuario.create({
      data: {
        id: keycloakSub,
        keycloakId: keycloakSub,
        username: username,
        email: `${username}@hospital.com`,
        nombre: name,
        apellido: "Sistema",
        rolId: rolAdmin?.id,
        updatedAt: new Date(),
      },
    });
  }

  return usuarioLocal;
};