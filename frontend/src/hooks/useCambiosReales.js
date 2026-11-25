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
