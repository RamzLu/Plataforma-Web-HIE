import { test } from "node:test";
import assert from "node:assert/strict";
import { conservaVersionPublica, tieneVersionPublica, tieneEdicionPendiente } from "../src/utils/eliminacion.utils.js";

const metaConVersionPublica = { previousEstado: "PUBLICADO", snapshotPublico: { titulo: "Versión publicada" } };

test("lo publicado, aprobado o programado se considera visible en el portal", () => {
  for (const estado of ["PUBLICADO", "APROBADO", "PROGRAMADO"]) {
    assert.equal(tieneVersionPublica({ estado }), true, estado);
  }
});

test("borradores, rechazados y archivados nunca fueron públicos", () => {
  for (const estado of ["BORRADOR", "RECHAZADO", "ARCHIVADO"]) {
    assert.equal(tieneVersionPublica({ estado }), false, estado);
  }
});

test("una edición pendiente de algo publicado conserva la versión pública", () => {
  const registro = { estado: "PENDIENTE_APROBACION" };
  assert.equal(conservaVersionPublica(registro, metaConVersionPublica), true);
  assert.equal(tieneEdicionPendiente(registro, metaConVersionPublica), true);
  assert.equal(tieneVersionPublica(registro, metaConVersionPublica), true);
});

test("un pendiente nuevo (nunca publicado) no tiene versión pública", () => {
  const registro = { estado: "PENDIENTE_APROBACION" };
  assert.equal(conservaVersionPublica(registro, null), false);
  assert.equal(tieneVersionPublica(registro, { previousEstado: "BORRADOR" }), false);
});

test("sin snapshot guardado no se conserva la versión pública", () => {
  assert.equal(conservaVersionPublica({ estado: "RECHAZADO" }, { previousEstado: "PUBLICADO" }), false);
});
