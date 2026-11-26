import { crearApiEditorial } from "./editorial.api.js";

const capacitaciones = crearApiEditorial("capacitaciones");

// Listado completo (borradores, pendientes, archivadas) para el CMS y el Admin.
export const getCapacitaciones = () => capacitaciones.listar(true);
export const getCapacitacionesPublicas = () => capacitaciones.listar(false);
export const createCapacitacion = capacitaciones.crear;
export const updateCapacitacion = capacitaciones.actualizar;
export const revisarCapacitacion = capacitaciones.revisar;
export const deleteCapacitacion = capacitaciones.eliminar;
export const descartarCapacitacion = capacitaciones.descartar;
export const restaurarCapacitacion = capacitaciones.restaurar;
