// Reglas comunes para eliminar contenido del CMS.

const ESTADOS_VISIBLES = ["PUBLICADO", "APROBADO", "PROGRAMADO"];

/**
 * Impide borrar contenido que está (o va a estar) visible en el portal.
 * Archivar algo publicado requiere aprobación del administrador, así que borrarlo directamente
 * saltearía esa revisión: primero hay que archivarlo y recién después eliminarlo.
 *
 * - registro: la fila de la base (con "estado" y, si el modelo lo tiene, "activo").
 * - pendingMeta: los cambios pendientes guardados en la tabla configuracion, si los hay.
 */
export const asegurarQueSePuedeEliminar = (registro, pendingMeta = null) => {
  const estado = String(registro?.estado || "").toUpperCase();
  const pendienteConVersionPublica =
    estado === "PENDIENTE_APROBACION" &&
    (registro?.activo === true || ["PUBLICADO", "APROBADO"].includes(pendingMeta?.previousEstado));

  if (ESTADOS_VISIBLES.includes(estado) || pendienteConVersionPublica) {
    const error = new Error(
      "Este contenido está publicado en el portal. Primero solicitá archivarlo (lo aprueba el administrador) y después vas a poder eliminarlo."
    );
    error.statusCode = 409;
    throw error;
  }
};
