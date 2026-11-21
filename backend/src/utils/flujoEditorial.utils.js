// Flujo editorial común a todos los módulos del CMS (noticias, documentos, profesionales,
// especialidades/servicios, residencias y capacitaciones).
//
// Son funciones puras: reciben el estado actual y lo que se pidió, y devuelven qué hay que guardar.
// Cada servicio se ocupa de leer y escribir (registro, metadatos, archivos); acá solo se decide.
//
// Reglas:
//  CM (resolverSolicitud)
//   - Lo que nunca fue público: BORRADOR queda en borrador; PUBLICAR/PROGRAMAR pasa a pendiente de aprobación;
//     ARCHIVAR se archiva directo.
//   - Lo que es o fue público (publicado, aprobado o programado): todo pasa a pendiente de aprobación.
//     Se conserva la versión pública ("snapshotPublico") para que el portal la siga mostrando mientras tanto,
//     y en "targetEstado" queda lo pedido: PUBLICADO, PROGRAMADO, BORRADOR (despublicar) o ARCHIVADO.
//  Admin (resolverRevision)
//   - Solo sobre lo pendiente de aprobación.
//   - APROBAR aplica lo pedido (PROGRAMADO solo si la fecha todavía no llegó; si ya pasó, PUBLICADO).
//   - RECHAZAR exige motivo; si era una edición de algo público se conserva la versión publicada.

const err = (mensaje, statusCode = 400) => Object.assign(new Error(mensaje), { statusCode });

export const ESTADOS_VISIBLES = ["PUBLICADO", "APROBADO"];
const ESTADOS_QUE_FUERON_PUBLICOS = ["PUBLICADO", "APROBADO", "PROGRAMADO"];

export const INTENCION = Object.freeze({
  BORRADOR: "BORRADOR",
  PUBLICAR: "PUBLICAR",
  PROGRAMAR: "PROGRAMAR",
  ARCHIVAR: "ARCHIVAR",
});

const ESTADO_DESTINO = {
  [INTENCION.BORRADOR]: "BORRADOR",
  [INTENCION.PUBLICAR]: "PUBLICADO",
  [INTENCION.PROGRAMAR]: "PROGRAMADO",
  [INTENCION.ARCHIVAR]: "ARCHIVADO",
};

/**
 * Traduce el "estado" que manda el CMS a una intención.
 * PROGRAMADO / PENDIENTE_APROBACION con fecha de publicación → PROGRAMAR; sin fecha → PUBLICAR.
 * PUBLICADO / APROBADO → PUBLICAR (la fecha se ignora: se pidió publicar ya).
 */
export const intencionDesdeEstado = (estado, { tieneFecha = false } = {}) => {
  const e = String(estado || "").trim().toUpperCase();
  if (!e || e === "BORRADOR") return INTENCION.BORRADOR;
  if (e === "ARCHIVADO") return INTENCION.ARCHIVAR;
  if (e === "PROGRAMADO" || e === "PENDIENTE_APROBACION") return tieneFecha ? INTENCION.PROGRAMAR : INTENCION.PUBLICAR;
  if (e === "PUBLICADO" || e === "APROBADO") return INTENCION.PUBLICAR;
  throw err(`Estado no válido: "${estado}".`);
};

/** true si el registro es (o fue) público, mirando su estado y el origen guardado en los metadatos. */
export const fuePublico = (estadoActual, meta = null) => {
  const e = String(estadoActual || "").toUpperCase();
  const origen = String(meta?.previousEstado || "").toUpperCase();
  return ESTADOS_QUE_FUERON_PUBLICOS.includes(e) || ESTADOS_QUE_FUERON_PUBLICOS.includes(origen);
};

/**
 * Decide qué pasa cuando el CM guarda o pide un cambio.
 * @param estadoActual  estado guardado del registro (null si es nuevo)
 * @param meta          pendingMeta actual (o null)
 * @param intencion     INTENCION.*
 * @param snapshotActual función que arma la versión pública desde el registro actual (solo se llama si hace falta)
 * @param hayCambios    false cuando solo se pide un cambio de estado sin tocar el contenido
 * @returns { estado, meta, limpiarMotivo, sinCambios }
 *          meta: objeto a guardar, o null para borrar los metadatos pendientes.
 */
export const resolverSolicitud = ({ estadoActual = null, meta = null, intencion, snapshotActual = () => null, hayCambios = true }) => {
  if (!Object.values(INTENCION).includes(intencion)) throw err(`Intención no válida: "${intencion}".`);
  const estado = String(estadoActual || "").toUpperCase() || null;

  if (!fuePublico(estado, meta)) {
    if (intencion === INTENCION.BORRADOR) return { estado: "BORRADOR", meta: null, limpiarMotivo: false, sinCambios: false };
    if (intencion === INTENCION.ARCHIVAR) return { estado: "ARCHIVADO", meta: null, limpiarMotivo: true, sinCambios: false };
    return {
      estado: "PENDIENTE_APROBACION",
      meta: { previousEstado: estado, targetEstado: ESTADO_DESTINO[intencion], snapshotPublico: null },
      limpiarMotivo: true,
      sinCambios: false,
    };
  }

  const destino = ESTADO_DESTINO[intencion];
  // Pedir el mismo estado que ya tiene, sin tocar el contenido, no genera una revisión.
  if (!hayCambios && estado === destino) {
    return { estado, meta, limpiarMotivo: false, sinCambios: true };
  }

  const origen = meta?.previousEstado || estado;
  const snapshotPublico = ESTADOS_VISIBLES.includes(estado) ? snapshotActual() : meta?.snapshotPublico ?? null;
  return {
    estado: "PENDIENTE_APROBACION",
    meta: { ...(meta || {}), previousEstado: origen, targetEstado: destino, snapshotPublico },
    limpiarMotivo: true,
    sinCambios: false,
  };
};

export const DECISION = Object.freeze({ APROBAR: "APROBAR", RECHAZAR: "RECHAZAR" });

/** Traduce lo que manda el panel Admin (APROBADO, PUBLICADO, PROGRAMADO, RECHAZADO...) a una decisión. */
export const decisionDesdeEstado = (estado) => {
  const e = String(estado || "").trim().toUpperCase();
  if (e === "RECHAZADO" || e === "RECHAZAR") return DECISION.RECHAZAR;
  if (["APROBADO", "APROBAR", "PUBLICADO", "PROGRAMADO"].includes(e)) return DECISION.APROBAR;
  throw err("Debe indicar la decisión de la revisión: APROBADO o RECHAZADO.");
};

/**
 * Decide el resultado de la revisión del administrador.
 * @param fechaProgramada fecha de publicación del registro (o null)
 * @returns { estado, activo, meta, motivo, limpiarFecha }
 *          meta: "conservar" para dejar los metadatos como están, o null para borrarlos.
 *          activo: true/false para los módulos que usan esa columna, o undefined si no cambia.
 */
export const resolverRevision = ({ estadoActual, meta = null, decision, motivo = "", fechaProgramada = null, ahora = new Date() }) => {
  if (String(estadoActual || "").toUpperCase() !== "PENDIENTE_APROBACION") {
    throw err("Solo se pueden aprobar o rechazar contenidos que estén pendientes de aprobación.");
  }

  if (decision === DECISION.RECHAZAR) {
    const texto = String(motivo || "").trim();
    if (!texto) throw err("Debe especificar un motivo de rechazo.");
    const conservaPublica = ESTADOS_VISIBLES.includes(meta?.previousEstado) && Boolean(meta?.snapshotPublico);
    return { estado: "RECHAZADO", activo: undefined, meta: conservaPublica ? "conservar" : null, motivo: texto, limpiarFecha: false };
  }

  if (decision !== DECISION.APROBAR) throw err(`Decisión no válida: "${decision}".`);

  const destino = meta?.targetEstado || "PUBLICADO";
  if (destino === "BORRADOR") return { estado: "BORRADOR", activo: undefined, meta: null, motivo: null, limpiarFecha: true };
  if (destino === "ARCHIVADO") return { estado: "ARCHIVADO", activo: false, meta: null, motivo: null, limpiarFecha: false };

  const fecha = fechaProgramada ? new Date(fechaProgramada) : null;
  const programada = Boolean(fecha && !Number.isNaN(fecha.getTime()) && fecha > ahora);
  return { estado: programada ? "PROGRAMADO" : "PUBLICADO", activo: true, meta: null, motivo: null, limpiarFecha: false };
};
