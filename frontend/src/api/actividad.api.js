import api from "./axiosConfig.js";

// Últimos movimientos registrados en la tabla de auditoría del backend.
export const getActividadReciente = async (limite = 30) =>
  (await api.get("/cms/actividad", { params: { limite } })).data;
