import api from "./axiosConfig.js";

// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getResidencias = async (isAdmin = false) =>
  (await api.get(isAdmin ? "/cms/residencias" : "/portal/residencias")).data;

export const createResidencia = async (formData) => (await api.post("/cms/residencias", formData)).data;

export const updateResidencia = async (id, formData) => (await api.put(`/cms/residencias/${id}`, formData)).data;

export const deleteResidencia = async (id) => (await api.delete(`/cms/residencias/${id}`)).data;

export const cambiarEstadoResidencia = async (id, estado, rejectionReason = "") =>
  (
    await api.patch(`/cms/residencias/${id}/estado`, {
      estado,
      rejectionReason,
      motivoRechazo: rejectionReason,
    })
  ).data;
