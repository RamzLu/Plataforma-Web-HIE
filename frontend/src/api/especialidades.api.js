import { crearApiEditorial } from "./editorial.api.js";

// Especialidades y servicios comparten ruta: "esServicio" dice a cuál se refiere (en el cuerpo, o en la URL al eliminar).
const especialidades = crearApiEditorial("especialidades");

export const getEspecialidades = especialidades.listar;
export const createEspecialidad = especialidades.crear;
export const updateEspecialidad = especialidades.actualizar;
export const revisarEspecialidad = (id, decision, motivo = "", esServicio = false) =>
  especialidades.revisar(id, decision, motivo, { esServicio });
export const deleteEspecialidad = (id, esServicio = false) => especialidades.eliminar(id, { esServicio });
