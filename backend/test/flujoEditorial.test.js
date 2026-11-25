import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INTENCION,
  DECISION,
  intencionDesdeEstado,
  decisionDesdeEstado,
  resolverSolicitud,
  resolverRevision,
  estadoVigente,
  pideCambioDeEstado,
  mensajeSinCambios,
} from "../src/utils/flujoEditorial.utils.js";

const snapshot = () => ({ titulo: "Versión publicada" });
const esError400 = (e) => e.statusCode === 400;

// ── Intenciones ───────────────────────────────────────────
test("el estado que manda el CMS se traduce a una intención", () => {
  assert.equal(intencionDesdeEstado("BORRADOR"), INTENCION.BORRADOR);
  assert.equal(intencionDesdeEstado(undefined), INTENCION.BORRADOR);
  assert.equal(intencionDesdeEstado("PUBLICADO"), INTENCION.PUBLICAR);
  assert.equal(intencionDesdeEstado("PENDIENTE_APROBACION"), INTENCION.PUBLICAR);
  assert.equal(intencionDesdeEstado("PROGRAMADO", { tieneFecha: true }), INTENCION.PROGRAMAR);
  assert.equal(intencionDesdeEstado("PENDIENTE_APROBACION", { tieneFecha: true }), INTENCION.PROGRAMAR);
  assert.equal(intencionDesdeEstado("PUBLICADO", { tieneFecha: true }), INTENCION.PUBLICAR);
  assert.equal(intencionDesdeEstado("ARCHIVADO"), INTENCION.ARCHIVAR);
  assert.throws(() => intencionDesdeEstado("CUALQUIERA"), esError400);
});

// ── CM: lo que nunca fue público ──────────────────────────
test("nuevo como borrador queda en borrador y sin metadatos", () => {
  const r = resolverSolicitud({ estadoActual: null, intencion: INTENCION.BORRADOR });
  assert.deepEqual([r.estado, r.meta], ["BORRADOR", null]);
});

test("nuevo pidiendo publicar o programar queda pendiente con el destino anotado", () => {
  const pub = resolverSolicitud({ estadoActual: null, intencion: INTENCION.PUBLICAR });
  assert.equal(pub.estado, "PENDIENTE_APROBACION");
  assert.deepEqual(pub.meta, { previousEstado: null, targetEstado: "PUBLICADO", snapshotPublico: null });
  const prog = resolverSolicitud({ estadoActual: "BORRADOR", intencion: INTENCION.PROGRAMAR });
  assert.equal(prog.meta.targetEstado, "PROGRAMADO");
  assert.equal(prog.meta.previousEstado, "BORRADOR");
});

test("un rechazado que nunca fue público vuelve a borrador sin revisión", () => {
  const r = resolverSolicitud({ estadoActual: "RECHAZADO", meta: { previousEstado: "BORRADOR" }, intencion: INTENCION.BORRADOR });
  assert.equal(r.estado, "BORRADOR");
});

test("archivar algo que nunca fue público es directo", () => {
  const r = resolverSolicitud({ estadoActual: "BORRADOR", intencion: INTENCION.ARCHIVAR });
  assert.deepEqual([r.estado, r.meta], ["ARCHIVADO", null]);
});

// ── CM: lo que es o fue público ───────────────────────────
test("editar algo publicado pasa a pendiente y guarda la versión pública", () => {
  const r = resolverSolicitud({ estadoActual: "PUBLICADO", intencion: INTENCION.PUBLICAR, snapshotActual: snapshot });
  assert.equal(r.estado, "PENDIENTE_APROBACION");
  assert.deepEqual(r.meta, { previousEstado: "PUBLICADO", targetEstado: "PUBLICADO", snapshotPublico: snapshot() });
});

test("despublicar (pasar a borrador) algo publicado requiere aprobación", () => {
  const r = resolverSolicitud({ estadoActual: "PUBLICADO", intencion: INTENCION.BORRADOR, snapshotActual: snapshot });
  assert.equal(r.estado, "PENDIENTE_APROBACION");
  assert.equal(r.meta.targetEstado, "BORRADOR");
});

test("archivar algo publicado requiere aprobación", () => {
  const r = resolverSolicitud({ estadoActual: "PUBLICADO", intencion: INTENCION.ARCHIVAR, snapshotActual: snapshot });
  assert.equal(r.meta.targetEstado, "ARCHIVADO");
});

test("volver a editar algo ya pendiente conserva el origen y la versión pública original", () => {
  const meta = { previousEstado: "PUBLICADO", targetEstado: "PUBLICADO", snapshotPublico: { titulo: "Original" }, cambios: [1] };
  const r = resolverSolicitud({ estadoActual: "PENDIENTE_APROBACION", meta, intencion: INTENCION.PROGRAMAR, snapshotActual: snapshot });
  assert.equal(r.meta.previousEstado, "PUBLICADO");
  assert.deepEqual(r.meta.snapshotPublico, { titulo: "Original" });
  assert.equal(r.meta.targetEstado, "PROGRAMADO");
  assert.deepEqual(r.meta.cambios, [1]);
});

test("algo programado (todavía no visible) pasa a pendiente sin versión pública", () => {
  const r = resolverSolicitud({ estadoActual: "PROGRAMADO", intencion: INTENCION.PUBLICAR, snapshotActual: snapshot });
  assert.equal(r.estado, "PENDIENTE_APROBACION");
  assert.equal(r.meta.snapshotPublico, null);
});

test("pedir el mismo estado sin cambios de contenido no genera revisión", () => {
  const r = resolverSolicitud({ estadoActual: "PUBLICADO", intencion: INTENCION.PUBLICAR, hayCambios: false });
  assert.equal(r.sinCambios, true);
  assert.equal(r.estado, "PUBLICADO");
});

// ── Admin ─────────────────────────────────────────────────
test("la decisión del Admin se traduce desde el estado que manda el panel", () => {
  assert.equal(decisionDesdeEstado("APROBADO"), DECISION.APROBAR);
  assert.equal(decisionDesdeEstado("PUBLICADO"), DECISION.APROBAR);
  assert.equal(decisionDesdeEstado("RECHAZADO"), DECISION.RECHAZAR);
  assert.throws(() => decisionDesdeEstado(""), esError400);
});

test("solo se revisa lo pendiente", () => {
  assert.throws(() => resolverRevision({ estadoActual: "PUBLICADO", decision: DECISION.APROBAR }), esError400);
});

test("aprobar publica, o programa si la fecha es futura", () => {
  const ahora = new Date("2026-01-01T00:00:00Z");
  const pub = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado: "PUBLICADO" }, decision: DECISION.APROBAR, ahora });
  assert.deepEqual([pub.estado, pub.activo, pub.meta], ["PUBLICADO", true, null]);
  const prog = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado: "PROGRAMADO" }, decision: DECISION.APROBAR, fechaProgramada: "2026-02-01", ahora });
  assert.equal(prog.estado, "PROGRAMADO");
  const vencida = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado: "PROGRAMADO" }, decision: DECISION.APROBAR, fechaProgramada: "2025-12-01", ahora });
  assert.equal(vencida.estado, "PUBLICADO");
});

test("aprobar un pedido de despublicar o archivar aplica ese destino", () => {
  const borrador = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado: "BORRADOR" }, decision: DECISION.APROBAR });
  assert.deepEqual([borrador.estado, borrador.limpiarFecha], ["BORRADOR", true]);
  const archivo = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado: "ARCHIVADO" }, decision: DECISION.APROBAR });
  assert.deepEqual([archivo.estado, archivo.activo], ["ARCHIVADO", false]);
});

test("rechazar exige motivo", () => {
  assert.throws(() => resolverRevision({ estadoActual: "PENDIENTE_APROBACION", decision: DECISION.RECHAZAR, motivo: "  " }), esError400);
});

test("rechazar una edición de algo publicado conserva la versión pública", () => {
  const meta = { previousEstado: "PUBLICADO", snapshotPublico: snapshot() };
  const r = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta, decision: DECISION.RECHAZAR, motivo: "Falta la fuente" });
  assert.deepEqual([r.estado, r.meta, r.motivo], ["RECHAZADO", "conservar", "Falta la fuente"]);
  const nuevo = resolverRevision({ estadoActual: "PENDIENTE_APROBACION", meta: { previousEstado: null }, decision: DECISION.RECHAZAR, motivo: "No" });
  assert.equal(nuevo.meta, null);
});

// ── Reenviar sin cambios ──────────────────────────────────
test("estado vigente: si está pendiente es lo pedido; si no, el guardado", () => {
  assert.equal(estadoVigente("PENDIENTE_APROBACION", { targetEstado: "ARCHIVADO" }), "ARCHIVADO");
  assert.equal(estadoVigente("PENDIENTE_APROBACION", null), "PUBLICADO");
  assert.equal(estadoVigente("publicado"), "PUBLICADO");
});

test("reenviar lo mismo que ya está pendiente no es un cambio de estado", () => {
  const pendiente = (targetEstado) => ({ estadoActual: "PENDIENTE_APROBACION", meta: { targetEstado } });
  assert.equal(pideCambioDeEstado("PUBLICADO", pendiente("PUBLICADO")), false);
  assert.equal(pideCambioDeEstado("pendiente_aprobacion", pendiente("PUBLICADO")), false);
  assert.equal(pideCambioDeEstado("PROGRAMADO", { ...pendiente("PROGRAMADO"), tieneFecha: true }), false);
  assert.equal(pideCambioDeEstado("ARCHIVADO", pendiente("ARCHIVADO")), false);
  // Pedir otra cosa sí es un cambio.
  assert.equal(pideCambioDeEstado("ARCHIVADO", pendiente("PUBLICADO")), true);
  assert.equal(pideCambioDeEstado("BORRADOR", pendiente("PUBLICADO")), true);
  assert.equal(pideCambioDeEstado("PROGRAMADO", { ...pendiente("PUBLICADO"), tieneFecha: true }), true);
  assert.equal(pideCambioDeEstado("PROGRAMADO", pendiente("PROGRAMADO")), true); // sin fecha pide publicar ya
});

test("fuera de pendiente, se compara con el estado guardado como siempre", () => {
  assert.equal(pideCambioDeEstado(undefined, { estadoActual: "PUBLICADO" }), false);
  assert.equal(pideCambioDeEstado("PUBLICADO", { estadoActual: "PUBLICADO" }), false);
  assert.equal(pideCambioDeEstado("PUBLICADO", { estadoActual: "RECHAZADO" }), true);
  assert.equal(pideCambioDeEstado("BORRADOR", { estadoActual: "PUBLICADO" }), true);
  assert.equal(pideCambioDeEstado("CUALQUIERA", { estadoActual: "PENDIENTE_APROBACION" }), true);
});

test("el aviso de sin cambios le explica al CM que ya está pendiente", () => {
  assert.match(mensajeSinCambios("PENDIENTE_APROBACION"), /ya está pendiente de aprobación/);
  assert.equal(mensajeSinCambios("PUBLICADO"), "No se detectaron cambios para actualizar.");
});
