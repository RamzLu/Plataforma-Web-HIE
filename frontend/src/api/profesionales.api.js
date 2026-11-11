import api from "./axiosConfig.js";

export const getProfesionales = async (isAdmin = false) => {
  const response = await api.get(isAdmin ? "/cms/profesionales?admin=true" : "/cms/profesionales");
  return response.data;
};

export const createProfesional = async (formData, token) => {
  const response = await api.post("/cms/profesionales", formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateProfesional = async (id, formData, token) => {
  const response = await api.put(`/cms/profesionales/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const evaluarProfesionalEstado = async (id, data, token) => {
  const response = await api.patch(`/cms/profesionales/${id}/estado`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteProfesional = async (id, token) => {
  const response = await api.delete(`/cms/profesionales/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};