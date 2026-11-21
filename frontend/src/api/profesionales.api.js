import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getProfesionales = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/profesionales" : "/portal/profesionales")).data;

export const createProfesional = async (formData) => (await api.post("/cms/profesionales", formData)).data;

export const updateProfesional = async (id, formData) =>
  (await api.put(`/cms/profesionales/${id}`, formData)).data;

export const evaluarProfesionalEstado = async (id, data) =>
  (await api.patch(`/cms/profesionales/${id}/estado`, data)).data;

export const deleteProfesional = async (id) => (await api.delete(`/cms/profesionales/${id}`)).data;
