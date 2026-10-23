import api from "./axiosConfig.js";

export const getCapacitaciones = async () => {
  const response = await api.get("/cms/capacitaciones");
  return response.data;
};

export const getCapacitacionesPublicas = async () => {
  const response = await api.get("/cms/capacitaciones/publicas");
  return response.data;
};

export const createCapacitacion = async (formData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.post("/cms/capacitaciones", formData, { headers });
  return response.data;
};

export const updateCapacitacion = async (id, formData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.put(`/cms/capacitaciones/${id}`, formData, { headers });
  return response.data;
};

export const deleteCapacitacion = async (id, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.delete(`/cms/capacitaciones/${id}`, { headers });
  return response.data;
};

export const cambiarEstadoCapacitacion = async (id, estado, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.patch(`/cms/capacitaciones/${id}/estado`, { estado }, { headers });
  return response.data;
};
