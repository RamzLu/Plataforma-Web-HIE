// Datos de una capacitación que llegan del formulario: URLs, fechas y el contenido (JSON) que se guarda.

import { validarUrlHttp } from "../../../utils/sanitize.utils.js";
import { parsearFecha } from "../../../utils/fechas.utils.js";

/** URL opcional: vacía si no viene o es un blob: del navegador; si viene, tiene que ser http(s). */
export const normalizarUrlOpcional = (rawUrl, nombreCampo) => {
  if (rawUrl === null || rawUrl === undefined) return "";
  if (typeof rawUrl === "string" && rawUrl.trim().startsWith("blob:")) return "";
  return validarUrlHttp(rawUrl, nombreCampo);
};

/** Al editar: sin dato queda la actual; vacío la borra; con un valor inválido queda la actual. */
export const fechaEditada = (valor, actual) => {
  if (valor === undefined) return actual;
  if (!valor) return null;
  return parsearFecha(valor) ?? actual;
};

/** Contenido guardado de una capacitación (JSON en la columna "contenido"). */
export const leerContenido = (contenido) => {
  if (!contenido) return {};
  try {
    return JSON.parse(contenido);
  } catch {
    return { temario: contenido };
  }
};

/** El video guardado en la columna: el propio, o el material si es un video. */
export const videoFinalDe = (videoUrl, archivoTipo, archivoUrl) => videoUrl || (archivoTipo === "video" ? archivoUrl : null);

const TIPO_RECURSO_POR_ARCHIVO = { video: "video", documento: "pdf", imagen: "imagen" };

/** Contenido de una capacitación nueva. */
export const armarContenidoNuevo = ({ data, archivoTipo, archivoNombre, archivoTamano, archivoUrl, videoUrl, bannerUrl, bannerNombre }) => ({
  temario: data.contenido || data.temario || "",
  modalidad: data.modalidad || "Presencial",
  tipoRecurso: data.tipoRecurso || TIPO_RECURSO_POR_ARCHIVO[archivoTipo] || "presencial",
  horario: data.horario || "10:00",
  ubicacion: data.ubicacion || "Hospital Interdistrital Evita",
  disertantes: data.disertantes || "",
  archivoTipo,
  archivoNombre,
  archivoTamano,
  archivoUrl,
  videoUrl: videoUrl || "",
  imagenUrl: bannerUrl,
  bannerUrl,
  bannerNombre,
});

/** Contenido de una capacitación editada: lo que no se manda queda como estaba (extra). */
export const armarContenidoEditado = ({ data, extra, archivoTipo, archivoNombre, archivoTamano, archivoUrl, videoUrl, bannerUrl, bannerNombre }) => ({
  temario: data.contenido !== undefined ? data.contenido : extra.temario || "",
  modalidad: data.modalidad || extra.modalidad || "Presencial",
  tipoRecurso: archivoTipo
    ? TIPO_RECURSO_POR_ARCHIVO[archivoTipo] || archivoTipo
    : data.tipoRecurso || extra.tipoRecurso || "presencial",
  horario: data.horario || extra.horario || "10:00",
  ubicacion: data.ubicacion || extra.ubicacion || "Hospital Interdistrital Evita",
  disertantes: data.disertantes !== undefined ? data.disertantes : extra.disertantes || "",
  archivoTipo,
  archivoNombre,
  archivoTamano,
  archivoUrl,
  videoUrl: videoUrl || "",
  imagenUrl: bannerUrl,
  bannerUrl,
  bannerNombre,
});
