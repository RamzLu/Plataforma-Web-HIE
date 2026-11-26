import { prisma } from "../config/prisma.js";

// Rol local con los privilegios mínimos para quien opera el CMS.
// La autorización real se decide con los roles del token de Keycloak (ver auth.middleware.js);
// este rol solo es un registro local y NUNCA debe otorgar permisos de administración automáticamente.
const ROL_LOCAL_POR_DEFECTO = "Editor CMS";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const crearError = (mensaje, statusCode) => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
};

// Los usuarios que llegan de Keycloak sin apellido se crean con este apellido de relleno.
export const APELLIDO_RELLENO = "Sistema";

/** Nombre para mostrar de un usuario local, sin el apellido de relleno. */
export const nombreDeUsuario = (usuario) => {
  if (!usuario) return "";
  const apellido = usuario.apellido && usuario.apellido !== APELLIDO_RELLENO ? usuario.apellido : "";
  return `${usuario.nombre || ""} ${apellido}`.trim();
};

/**
 * Obtiene el usuario local asociado al usuario autenticado en Keycloak.
 * Si no existe, lo crea con el rol mínimo ("Editor CMS").
 *
 * La identidad se resuelve ÚNICAMENTE por keycloakId (el "sub" del token verificado), que es
 * inmutable y no controlable por el usuario. El username/email se usan solo como datos de perfil.
 *
 * user: el objeto req.user que viene del middleware de autenticación.
 * devuelve el usuario de la base de datos Prisma.
 */
export const obtenerOCrearUsuarioLocal = async (user) => {
  const keycloakSub = user?.keycloakId;

  if (!keycloakSub || !UUID_REGEX.test(keycloakSub)) {
    throw crearError("Identidad de usuario inválida.", 401);
  }

  const buscar = () => prisma.usuario.findUnique({ where: { keycloakId: keycloakSub } });

  let usuarioLocal = await buscar();

  if (!usuarioLocal) {
    let rolMinimo = await prisma.rol.findFirst({ where: { nombre: ROL_LOCAL_POR_DEFECTO } });
    if (!rolMinimo) {
      rolMinimo = await prisma.rol.create({
        data: { nombre: ROL_LOCAL_POR_DEFECTO, descripcion: "Editor de contenidos del CMS" },
      });
    }

    // username y email son únicos en la BD: si ya los usa OTRA persona, no se reutiliza su registro,
    // se genera un valor propio derivado del keycloakId.
    let username = (user?.username || `user_${keycloakSub.slice(0, 8)}`).slice(0, 100);
    if (await prisma.usuario.findUnique({ where: { username } })) {
      username = `${username.slice(0, 80)}_${keycloakSub.slice(0, 8)}`;
    }

    let email = (user?.email || `${username}@hospital.com`).slice(0, 150);
    if (await prisma.usuario.findUnique({ where: { email } })) {
      email = `${keycloakSub}@keycloak.local`;
    }

    try {
      usuarioLocal = await prisma.usuario.create({
        data: {
          id: keycloakSub,
          keycloakId: keycloakSub,
          username,
          email,
          nombre: (user?.name || "Editor CMS").slice(0, 100),
          apellido: APELLIDO_RELLENO,
          rolId: rolMinimo.id,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Dos requests simultáneos del mismo usuario nuevo: el segundo reutiliza el ya creado.
      if (error.code === "P2002") {
        usuarioLocal = await buscar();
      }
      if (!usuarioLocal) throw error;
    }
  }

  if (usuarioLocal.activo === false) {
    throw crearError("Tu usuario está desactivado.", 403);
  }

  return usuarioLocal;
};
