import api from "./axiosConfig.js";

export const getCapacitaciones = async () => {
  // Listado completo: el backend lo restringe al rol 'cm'; ?admin=true hace que se adjunte el token.
  const response = await api.get("/cms/capacitaciones?admin=true");
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

export const evaluarCapacitacion = async (id, payload, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.patch(`/cms/capacitaciones/${id}/revision`, payload, { headers });
  return response.data;
};

export const publicarCapacitacion = async (id, token) => {
  return cambiarEstadoCapacitacion(id, "PUBLICADO", token);
};
