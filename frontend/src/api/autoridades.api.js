import api from "./axiosConfig.js";

// ─── DATOS INSTITUCIONALES PÚBLICOS ──────────────────────────────────────────

/**
 * Retorna { autoridades: [], redesSociales: { facebook, instagram } }
 * Solo devuelve autoridades activas, ordenadas por campo `orden`.
 */
export const getInstitucional = async () => {
  const response = await api.get("/cms/institucional");
  return response.data;
};

// ─── CRUD (requiere token) ────────────────────────────────────────────────────

export const createAutoridad = async (formData, token) => {
  const response = await api.post("/cms/institucional/autoridades", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateAutoridad = async (id, formData, token) => {
  const response = await api.put(`/cms/institucional/autoridades/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteAutoridad = async (id, token) => {
  const response = await api.delete(`/cms/institucional/autoridades/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRedesSociales = async (data, token) => {
  const response = await api.put("/cms/institucional/redes", data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
