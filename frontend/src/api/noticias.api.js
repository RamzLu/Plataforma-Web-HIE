import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getNoticias = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/noticias" : "/portal/noticias")).data;

export const createNoticia = async (formData) => (await api.post("/cms/noticias", formData)).data;

export const updateNoticia = async (id, formData) => (await api.put(`/cms/noticias/${id}`, formData)).data;

export const evaluarNoticiaEstado = async (id, payload) =>
  (await api.patch(`/cms/noticias/${id}/estado`, payload)).data;

export const deleteNoticia = async (id) => (await api.delete(`/cms/noticias/${id}`)).data;
