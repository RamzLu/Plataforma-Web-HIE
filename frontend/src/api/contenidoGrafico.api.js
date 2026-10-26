import api from "./axiosConfig.js";

export const getContenidosGraficos = async () => {
  try {
    const response = await api.get("/cms/contenido-grafico");
    return response.data;
  } catch (error) {
    // Si la ruta nueva no existe aún en el backend, intentar con la ruta compatible de banners
    try {
      const fallback = await api.get("/cms/banners");
      return fallback.data;
    } catch {
      throw error;
    }
  }
};

export const createContenidoGrafico = async (formData, token) => {
  try {
    const response = await api.post("/cms/contenido-grafico", formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    return response.data;
  } catch (error) {
    const fallback = await api.post("/cms/banners", formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    return fallback.data;
  }
};

export const updateContenidoGrafico = async (id, formData, token) => {
  try {
    const response = await api.put(`/cms/contenido-grafico/${id}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    return response.data;
  } catch (error) {
    const fallback = await api.put(`/cms/banners/${id}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    return fallback.data;
  }
};

export const deleteContenidoGrafico = async (id, token) => {
  try {
    const response = await api.delete(`/cms/contenido-grafico/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    const fallback = await api.delete(`/cms/banners/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return fallback.data;
  }
};
