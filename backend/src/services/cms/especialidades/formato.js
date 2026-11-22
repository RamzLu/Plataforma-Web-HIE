// Cómo se le muestra una especialidad o un servicio al panel y al portal.

import { cambiosParaCliente } from "../../../utils/cambios.utils.js";
import { estaVisibleEnPortal, nombreDeLaVersionPublica } from "../../../utils/eliminacion.utils.js";

/** Los requisitos se guardan como JSON (lista) o, en registros viejos, como texto con un requisito por línea. */
const leerRequisitos = (requisitos) => {
  if (!requisitos) return [];
  try {
    const parsed = JSON.parse(requisitos);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof requisitos === "string"
      ? requisitos
          .split("\n")
          .map((r) => r.trim())
          .filter((r) => r !== "")
      : [];
  }
};

const fechaLegible = (valor) => {
  if (!valor) return "Reciente";
  try {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("es-AR");
  } catch {
    // Fecha inválida: se muestra el texto por defecto.
  }
  return "Reciente";
};

/** Una especialidad o un servicio tal como lo lee el panel y el portal. */
export const formatearEspecialidad = (registro, esServicio, rejectionReason = null, meta = null, editorOverride = null, updatedAtOverride = null) => {
  const esPendiente = (registro.estado || "").toUpperCase() === "PENDIENTE_APROBACION";
  return {
    ...registro,
    id: registro.id.toString(),
    esServicio,
    visibleEnPortal: estaVisibleEnPortal(registro, meta),
    tituloPublicado: nombreDeLaVersionPublica(registro, meta, "nombre"),
    requisitos: leerRequisitos(registro.requisitos),
    rejectionReason: rejectionReason || null,
    editor: editorOverride || meta?.editor || "Editor CMS",
    updatedAtFormatted: fechaLegible(updatedAtOverride || meta?.updatedAt || null),
    cambios: esPendiente ? cambiosParaCliente(meta?.cambios) : [],
    esActualizacion: esPendiente && Boolean(meta?.esActualizacion),
    requestedEstado: esPendiente ? meta?.targetEstado || null : null,
  };
};
