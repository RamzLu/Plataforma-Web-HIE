import keycloak from "../config/keycloak";

// Mismas listas que usa el backend (backend/src/middlewares/auth.middleware.js).
// Si se cambia una, hay que cambiar la otra para que frontend y backend coincidan.
export const ROLES_CMS = ["cm", "editor-cms", "cms"];
export const ROLES_ADMIN = ["admin-hief", "admin-hie", "admin", "administrator", "administrador"];

/**
 * Devuelve true si el usuario logueado en Keycloak tiene alguno de los roles indicados,
 * ya sea como rol del realm o como rol de algun cliente. No distingue mayusculas.
 */
export const tieneAlgunRol = (rolesBuscados) => {
  const token = keycloak?.tokenParsed;
  if (!token) return false;

  const rolesRealm = token.realm_access?.roles || [];
  const rolesCliente = Object.values(token.resource_access || {}).flatMap((r) => r?.roles || []);
  const rolesUsuario = new Set(
    [...rolesRealm, ...rolesCliente].map((r) => String(r).toLowerCase().trim())
  );

  return rolesBuscados.some((rol) => rolesUsuario.has(String(rol).toLowerCase().trim()));
};
