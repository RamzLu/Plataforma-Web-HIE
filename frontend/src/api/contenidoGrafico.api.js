import api from "./axiosConfig.js";
import keycloak from "../config/keycloak.js";

/**
 * Obtiene la lista de espacios gráficos fijos predefinidos para el CMS.
 */
export const getContenidosGraficos = async () => {
  const response = await api.get("/cms/contenido-grafico?admin=true");
  return response.data;
};

/**
 * Obtiene los datos publicados de un espacio gráfico puntual para el portal público.
 */
export const getEspacioGraficoPublico = async (espacioKey) => {
  const response = await api.get(
    `/cms/contenido-grafico/publico/${encodeURIComponent(espacioKey)}`
  );
  return response.data;
};

/**
 * Actualiza un espacio gráfico fijo enviando FormData (metadatos + archivos de imagen recortados).
 */
export const updateContenidoGrafico = async (espacioKey, formData, explicitToken = null) => {
  let token = explicitToken;
  if (!token && keycloak?.authenticated) {
    try {
      await keycloak.updateToken(10);
    } catch {
      // Se usa el token vigente si no pudo renovarse
    }
    token = keycloak.token;
  }

  const response = await api.put(
    `/cms/contenido-grafico/espacio/${encodeURIComponent(espacioKey)}`,
    formData,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return response.data;
};
