// Cómo se le muestra un espacio gráfico al panel y al portal, y cómo se interpreta cada ítem que manda el formulario.

import { PRESET_KEYS_VALIDAS } from "./definiciones.js";
import { crearError, limpiarTextoSimple } from "./texto.js";
import { formatearSeccionAprende } from "./formatos/aprende.js";
import { formatearAcordeonFijo } from "./formatos/acordeon.js";
import { formatearTarjetaResidencias } from "./formatos/residencias.js";
import { formatearCarrusel } from "./formatos/carrusel.js";
import { parsearMetadatosDescripcion } from "./metadatos.js";

/**
 * Construye la representación de un espacio fijo combinando su definición con las filas en BD.
 */
export function formatearEspacioDesdeFilas(def, filas = []) {
  // Cada tipo de espacio se arma distinto (contenidoGrafico/formatos/).
  if (def.esSeccionAprende) return formatearSeccionAprende(def, filas);
  if (def.esAcordeonFijo) return formatearAcordeonFijo(def, filas);
  if (def.esTarjetaResidencias) return formatearTarjetaResidencias(def, filas);
  return formatearCarrusel(def, filas);
}

/**
 * Resuelve la referencia de archivo/preset de un ítem enviado en `slides`.
 */
export function resolverFuenteImagenItem(
  item,
  etiquetaPosicion,
  filasPorId,
  uploadedFiles,
) {
  if (item.kind === "existing") {
    const filaPrev = filasPorId.get(String(item.id || ""));
    if (!filaPrev) {
      throw crearError(
        `La imagen existente de ${etiquetaPosicion} ya no se encuentra disponible. Recargue la vista e intente nuevamente.`,
      );
    }
    const metaPrev = parsearMetadatosDescripcion(filaPrev.descripcion);
    return {
      kind: "existing",
      archivoId: filaPrev.archivoId,
      presetKey: metaPrev.presetKey || null,
      fileName:
        filaPrev.archivo?.nombreOriginal || metaPrev.fileName || "imagen.jpg",
      createdByOriginal: filaPrev.createdBy,
    };
  }

  if (item.kind === "preset") {
    const presetKey = String(item.presetKey || "").trim();
    if (!PRESET_KEYS_VALIDAS.has(presetKey)) {
      throw crearError(
        `Imagen predeterminada inválida en ${etiquetaPosicion}.`,
      );
    }
    return {
      kind: "preset",
      archivoId: null,
      presetKey,
      fileName: limpiarTextoSimple(item.fileName || `${presetKey}.jpg`, 150),
      createdByOriginal: null,
    };
  }

  if (item.kind === "new") {
    const fileIndex = Number(item.fileIndex);
    if (
      !Number.isInteger(fileIndex) ||
      fileIndex < 0 ||
      fileIndex >= uploadedFiles.length
    ) {
      throw crearError(
        `No se recibió el archivo correspondiente a la nueva imagen de ${etiquetaPosicion}.`,
      );
    }
    return {
      kind: "new",
      file: uploadedFiles[fileIndex],
      presetKey: null,
      createdByOriginal: null,
    };
  }

  throw crearError(`Tipo de imagen desconocido en ${etiquetaPosicion}.`);
}
