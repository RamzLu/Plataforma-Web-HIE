import api from "./axiosConfig.js";

export const getResidencias = async (isAdmin = false) => {
  const response = await api.get(isAdmin ? "/cms/residencias?admin=true" : "/cms/residencias");
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

export const cambiarEstadoResidencia = async (id, estado, token, rejectionReason = '') => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await api.patch(
    `/cms/residencias/${id}/estado`,
    { estado, rejectionReason, motivoRechazo: rejectionReason },
    { headers }
  );
  return response.data;
};

