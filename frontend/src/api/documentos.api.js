import api from "./axiosConfig.js";

export const getDocumentos = async () => {
  const response = await api.get("/cms/documentacion");
  return response.data;
};

export const createDocumento = async (formData, token) => {
  const response = await api.post("/cms/documentacion", formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateDocumento = async (id, formData, token) => {
  const response = await api.put(`/cms/documentacion/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteDocumento = async (id, token) => {
  const response = await api.delete(`/cms/documentacion/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};