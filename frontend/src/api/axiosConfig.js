import axios from "axios";
import keycloak from "../config/keycloak";

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000, 
});

// Toda llamada a /cms/... (panel CMS y Admin) lleva el token de Keycloak, renovado si está por vencer.
// Las del portal público (/portal/...) van sin token.
const esRutaDelPanel = (config) => /^\/?cms\//.test(config.url || "");

api.interceptors.request.use(
  async (config) => {
    if (esRutaDelPanel(config) && keycloak.token) {
      const hasAuth =
        Boolean(config.headers?.Authorization) ||
        Boolean(config.headers?.authorization) ||
        (typeof config.headers?.has === "function" && config.headers.has("Authorization"));

      if (!hasAuth) {
        try {
          await keycloak.updateToken(10);
        } catch {
          // Si no se pudo renovar se usa el token actual; si vencio, el backend responde 401.
        }
        if (typeof config.headers?.set === "function") {
          config.headers.set("Authorization", `Bearer ${keycloak.token}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${keycloak.token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;