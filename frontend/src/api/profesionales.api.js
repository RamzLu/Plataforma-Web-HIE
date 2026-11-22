import { crearApiEditorial } from "./editorial.api.js";

const profesionales = crearApiEditorial("profesionales");

export const getProfesionales = profesionales.listar;
export const createProfesional = profesionales.crear;
export const updateProfesional = profesionales.actualizar;
export const revisarProfesional = profesionales.revisar;
export const deleteProfesional = profesionales.eliminar;
