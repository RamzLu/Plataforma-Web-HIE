import keycloak from "../config/keycloak";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * fetch de LECTURA para el panel CMS: pide la vista de administracion
 * (borradores, programados, inactivos) agregando ?admin=true y el token de Keycloak.
 * El backend solo concede esa vista a usuarios con rol 'cm'; para el portal publico
 * se debe usar fetch/axios comun (sin ?admin=true), que solo recibe contenido publicado.
 */
export const adminFetch = async (path, options = {}) => {
  try {
    await keycloak.updateToken(10);
  } catch {
    // Si no se pudo renovar se usa el token actual; si vencio, el backend responde 401.
  }

  const url = path.includes("admin=")
    ? `${API_URL}${path}`
    : `${API_URL}${path}${path.includes("?") ? "&" : "?"}admin=true`;

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
};

