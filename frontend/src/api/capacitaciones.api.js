import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

// Listado completo (borradores, pendientes, archivadas) para el CMS y el Admin.
export const getCapacitaciones = async () => (await api.get("/cms/capacitaciones")).data;

export const getCapacitacionesPublicas = async () => (await api.get("/portal/capacitaciones")).data;

export const createCapacitacion = async (formData) => (await api.post("/cms/capacitaciones", formData)).data;

export const updateCapacitacion = async (id, formData) =>
  (await api.put(`/cms/capacitaciones/${id}`, formData)).data;

export const deleteCapacitacion = async (id) => (await api.delete(`/cms/capacitaciones/${id}`)).data;

export const cambiarEstadoCapacitacion = async (id, estado) =>
  (await api.patch(`/cms/capacitaciones/${id}/estado`, { estado })).data;

export const revisarCapacitacion = async (id, estado, motivoRechazo = "") =>
  (await api.patch(`/cms/capacitaciones/${id}/revision`, { estado, motivoRechazo })).data;
