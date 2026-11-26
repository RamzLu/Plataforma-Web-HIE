// Datos de una residencia que llegan del formulario: fechas y el contenido (JSON) que se guarda.

import { parsearFecha } from "../../../utils/fechas.utils.js";

const CATEGORIA_POR_DEFECTO = "Formación Médica de Posgrado - Ministerio de Desarrollo Humano";

/** Contenido guardado de una residencia (JSON en la columna "contenido"). */
export const leerContenido = (contenido) => {
  if (!contenido) return {};
  try {
    return JSON.parse(contenido);
  } catch {
    return {};
  }
};

/** Solo se guarda la fecha de publicación si se pidió programar (o enviar a revisión con fecha). */
export const tieneFechaProgramada = (data) => {
  const estado = data.estado?.toUpperCase();
  return (estado === "PROGRAMADO" || estado === "PENDIENTE_APROBACION") && Boolean(data.fechaPublicacion);
};

/** Contenido de una residencia nueva. */
export const armarContenidoNuevo = (data, documento) => ({
  categoria: data.categoria || CATEGORIA_POR_DEFECTO,
  descripcionPrograma: data.descripcionPrograma || "",
  cupos: data.cupos || "",
  duracion: data.duracion || "",
  requisitos: data.requisitos || "",
  reglamentoRotacion: data.reglamentoRotacion || "",
  fechaInicio: data.fechaInicio || "",
  fechaPublicacion: tieneFechaProgramada(data) ? data.fechaPublicacion : null,
  documento,
});

/** Contenido de una residencia editada: lo que no se manda queda como estaba (previo). */
export const armarContenidoEditado = (data, previo, documento) => ({
  categoria: data.categoria !== undefined ? data.categoria : previo.categoria || "",
  descripcionPrograma: data.descripcionPrograma !== undefined ? data.descripcionPrograma : previo.descripcionPrograma || "",
  cupos: data.cupos !== undefined ? data.cupos : previo.cupos || "",
  duracion: data.duracion !== undefined ? data.duracion : previo.duracion || "",
  requisitos: data.requisitos !== undefined ? data.requisitos : previo.requisitos || "",
  reglamentoRotacion: data.reglamentoRotacion !== undefined ? data.reglamentoRotacion : previo.reglamentoRotacion || "",
  fechaInicio: data.fechaInicio !== undefined ? data.fechaInicio : previo.fechaInicio || "",
  fechaPublicacion: data.fechaPublicacion !== undefined ? data.fechaPublicacion || null : previo.fechaPublicacion || null,
  documento,
});

/** Fecha de la convocatoria al editar: sin dato queda la actual; vacío la borra; inválido también la borra. */
export const fechaConvocatoriaEditada = (valor, actual) => {
  if (valor === undefined) return actual;
  if (!valor) return null;
  return parsearFecha(valor);
};
