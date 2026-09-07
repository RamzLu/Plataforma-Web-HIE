import api from "./axiosConfig.js";

export const getProfesionales = async () => {
  const response = await api.get("/cms/profesionales");
  return response.data;
};

export const createProfesional = async (formData, token) => {
  const response = await api.post("/cms/profesionales", formData, {
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