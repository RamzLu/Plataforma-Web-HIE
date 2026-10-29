import api from "./axiosConfig.js";

/**
 * Obtiene la lista de espacios gráficos fijos predefinidos en la base de datos.
 */
export const getContenidosGraficos = async () => {
  try {
    const response = await api.get("/cms/contenido-grafico");
    return response.data;
  } catch (error) {
    try {
      const fallback = await api.get("/cms/banners");
      return fallback.data;
    } catch {
      throw error;
    }
  }
};

/**
 * Actualiza el arreglo de imágenes (carrusel) y metadatos de un espacio fijo existente.
 */
export const updateContenidoGrafico = async (id, payload, token) => {
  try {
    const response = await api.put(`/cms/contenido-grafico/${id}`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    const fallback = await api.put(`/cms/banners/${id}`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return fallback.data;
  }
};
