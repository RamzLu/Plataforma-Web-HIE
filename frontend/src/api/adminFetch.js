import keycloak from "../config/keycloak";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * fetch de LECTURA para el panel CMS y Admin (rutas /cms/...): renueva y adjunta el token de Keycloak.
 * El portal público no usa esto: lee de /portal/... sin token.
 */
export const adminFetch = async (path, options = {}) => {
  try {
    await keycloak.updateToken(10);
  } catch {
    // Si no se pudo renovar se usa el token actual; si vencio, el backend responde 401.
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
};
