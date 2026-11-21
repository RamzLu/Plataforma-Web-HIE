import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getEspecialidades = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/especialidades" : "/portal/especialidades")).data;

export const createEspecialidad = async (data) => (await api.post("/cms/especialidades", data)).data;

export const updateEspecialidad = async (id, data) => (await api.put(`/cms/especialidades/${id}`, data)).data;

export const evaluarEspecialidadEstado = async (id, payload) =>
  (await api.patch(`/cms/especialidades/${id}/estado`, payload)).data;

export const deleteEspecialidad = async (id, isServicio) =>
  (await api.delete(`/cms/especialidades/${id}`, { params: { isServicio } })).data;
