import { useState } from "react";

// Texto comparable de los valores de un formulario. Los archivos se comparan por nombre, tamaño y fecha
// (un File se serializa como {} y dos archivos distintos parecerían iguales); las fechas, por su valor.
const claveDe = (valores) =>
  JSON.stringify(valores, function reemplazar(clave, valor) {
    const original = this[clave];
    if (typeof File !== "undefined" && original instanceof File) {
      return `archivo:${original.name}:${original.size}:${original.lastModified}`;
    }
    if (original instanceof Date) return `fecha:${original.getTime()}`;
    return valor;
  });

// &nbsp; escrito o como carácter (U+00A0): los dos son el mismo espacio.
const ESPACIO_DURO = new RegExp("&nbsp;|" + String.fromCharCode(160), "gi");

/**
 * HTML comparable conservando el formato (negritas, listas, títulos, alineación): solo unifica espacios.
 * Es la misma comparación que hace el backend (formatoHtml en backend/src/utils/cambios.utils.js),
 * así el botón de guardar y el aviso de "sin cambios" del servidor coinciden.
 */
export const formatoHtml = (valor) =>
  String(valor ?? "")
    .replace(ESPACIO_DURO, " ")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

/**
 * ¿El formulario quedó distinto de como se abrió?
 *
 * Las vistas del CMS marcan "hasUnsavedChanges" en cuanto se toca un campo, pero nunca lo vuelven a apagar si
 * el cambio se deshace. Este hook toma una foto de los valores mientras el formulario está limpio
 * (hasUnsavedChanges en false: recién abierto, reiniciado o guardado) y compara contra ella:
 * si se edita algo y se vuelve a dejar como estaba, deja de haber cambios.
 *
 * @param {boolean} tocado   el hasUnsavedChanges de la vista
 * @param {object}  valores  los valores que se guardan (los mismos campos que envía el formulario)
 * @returns {boolean} true si hay cambios reales para guardar
 */
export const useCambiosReales = (tocado, valores) => {
  const claveActual = claveDe(valores);
  const [claveLimpia, setClaveLimpia] = useState(claveActual);

  // Mientras el formulario está limpio, la foto sigue a los valores (se ajusta durante el render, sin efecto).
  if (!tocado && claveLimpia !== claveActual) {
    setClaveLimpia(claveActual);
  }

  return Boolean(tocado) && claveActual !== claveLimpia;
};

export default useCambiosReales;
