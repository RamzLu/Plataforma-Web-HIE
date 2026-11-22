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

test("estaVisibleEnPortal: lo publicado y las ediciones sobre una versión pública siguen a la vista", async () => {
  const { estaVisibleEnPortal } = await import("../src/utils/eliminacion.utils.js");
  assert.equal(estaVisibleEnPortal({ estado: "PUBLICADO" }), true);
  assert.equal(estaVisibleEnPortal({ estado: "APROBADO" }), true);
  assert.equal(estaVisibleEnPortal({ estado: "PENDIENTE_APROBACION" }, metaConVersionPublica), true, "edición en revisión");
  assert.equal(estaVisibleEnPortal({ estado: "RECHAZADO" }, metaConVersionPublica), true, "edición rechazada");
});

test("estaVisibleEnPortal: lo que nunca fue público, o está archivado o programado, no", async () => {
  const { estaVisibleEnPortal } = await import("../src/utils/eliminacion.utils.js");
  assert.equal(estaVisibleEnPortal({ estado: "PENDIENTE_APROBACION" }, null), false, "pendiente nuevo");
  assert.equal(estaVisibleEnPortal({ estado: "PENDIENTE_APROBACION" }, { previousEstado: "BORRADOR" }), false);
  assert.equal(estaVisibleEnPortal({ estado: "RECHAZADO" }, null), false, "rechazado que nunca fue público");
  for (const estado of ["BORRADOR", "ARCHIVADO", "PROGRAMADO"]) assert.equal(estaVisibleEnPortal({ estado }), false, estado);
});
