import { crearApiEditorial } from "./editorial.api.js";

const residencias = crearApiEditorial("residencias");

export const getResidencias = residencias.listar;
export const createResidencia = residencias.crear;
export const updateResidencia = residencias.actualizar;
export const revisarResidencia = residencias.revisar;
export const deleteResidencia = residencias.eliminar;
export const descartarResidencia = residencias.descartar;
export const restaurarResidencia = residencias.restaurar;
