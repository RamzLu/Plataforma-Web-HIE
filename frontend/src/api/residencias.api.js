import api from "./axiosConfig.js";

export const getResidencias = async () => {
  const response = await api.get("/cms/residencias");
  return response.data;
};

export const createResidencia = async (formData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.post("/cms/residencias", formData, { headers });
  return response.data;
};

export const updateResidencia = async (id, formData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.put(`/cms/residencias/${id}`, formData, { headers });
  return response.data;
};

export const deleteResidencia = async (id, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.delete(`/cms/residencias/${id}`, { headers });
  return response.data;
};

export const cambiarEstadoResidencia = async (id, estado, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.patch(`/cms/residencias/${id}/estado`, { estado }, { headers });
  return response.data;
};

