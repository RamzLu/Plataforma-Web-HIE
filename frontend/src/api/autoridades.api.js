import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

/**
 * Retorna { autoridades: [], redesSociales: { facebook, instagram } }
 * Solo devuelve autoridades activas, ordenadas por campo `orden`.
 */
export const getInstitucional = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/institucional" : "/portal/institucional")).data;

export const createAutoridad = async (formData) =>
  (await api.post("/cms/institucional/autoridades", formData)).data;

export const updateAutoridad = async (id, formData) =>
  (await api.put(`/cms/institucional/autoridades/${id}`, formData)).data;

export const deleteAutoridad = async (id) => (await api.delete(`/cms/institucional/autoridades/${id}`)).data;

export const reordenarAutoridades = async (ordenIds) =>
  (await api.put("/cms/institucional/autoridades/reordenar", { ordenIds })).data;

export const updateRedesSociales = async (data) => (await api.put("/cms/institucional/redes", data)).data;

export const updateSedeCentral = async (formData) => (await api.put("/cms/institucional/sede", formData)).data;
