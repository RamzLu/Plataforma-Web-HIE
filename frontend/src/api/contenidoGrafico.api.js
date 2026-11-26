import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

/** Lista de espacios gráficos fijos para el CMS y el Admin. */
export const getContenidosGraficos = async () => (await api.get("/cms/contenido-grafico")).data;

/** Datos publicados de un espacio gráfico puntual, para el portal público. */
export const getEspacioGraficoPublico = async (espacioKey) =>
  (await api.get(`/portal/contenido-grafico/${encodeURIComponent(espacioKey)}`)).data;

/** Actualiza un espacio gráfico fijo (FormData con metadatos e imágenes recortadas). */
export const updateContenidoGrafico = async (espacioKey, formData) =>
  (await api.put(`/cms/contenido-grafico/espacio/${encodeURIComponent(espacioKey)}`, formData)).data;
