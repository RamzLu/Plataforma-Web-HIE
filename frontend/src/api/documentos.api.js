import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getDocumentos = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/documentacion" : "/portal/documentacion")).data;

export const createDocumento = async (formData) => (await api.post("/cms/documentacion", formData)).data;

export const updateDocumento = async (id, formData) =>
  (await api.put(`/cms/documentacion/${id}`, formData)).data;

export const evaluarDocumentoEstado = async (id, payload) =>
  (await api.patch(`/cms/documentacion/${id}/estado`, payload)).data;

export const deleteDocumento = async (id) => (await api.delete(`/cms/documentacion/${id}`)).data;
