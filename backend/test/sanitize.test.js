import { test } from "node:test";
import assert from "node:assert/strict";
import { parsearIdBigInt, validarUrlHttp, sanitizarHtmlNoticia } from "../src/utils/sanitize.utils.js";

const esError400 = (err) => err.statusCode === 400;

test("parsearIdBigInt acepta ids positivos y los devuelve como BigInt", () => {
  assert.equal(parsearIdBigInt("15"), 15n);
  assert.equal(parsearIdBigInt(" 7 "), 7n);
  assert.equal(parsearIdBigInt(3n), 3n);
});

test("parsearIdBigInt rechaza valores inválidos con 400", () => {
  for (const valor of [null, undefined, "", "0", "-1", "abc", "1.5", "01", "1e3", "99999999999999999999"]) {
    assert.throws(() => parsearIdBigInt(valor), esError400, `debería rechazar ${String(valor)}`);
  }
});

test("validarUrlHttp solo acepta http y https", () => {
  assert.equal(validarUrlHttp("https://hospital.gob.ar/x"), "https://hospital.gob.ar/x");
  assert.equal(validarUrlHttp(""), "");
  assert.equal(validarUrlHttp(null), "");
  for (const url of ["javascript:alert(1)", "//evil.com", "ftp://x.com", "no es una url", "data:text/html,hola"]) {
    assert.throws(() => validarUrlHttp(url), esError400, `debería rechazar ${url}`);
  }
});

test("validarUrlHttp permite rutas relativas solo si se pide", () => {
  assert.equal(validarUrlHttp("/documentos/a.pdf", "URL", true), "/documentos/a.pdf");
  assert.throws(() => validarUrlHttp("/documentos/a.pdf"), esError400);
});

test("sanitizarHtmlNoticia quita scripts y atributos peligrosos", () => {
  const limpio = sanitizarHtmlNoticia('<p onclick="x()">Hola</p><script>alert(1)</script><a href="javascript:x">y</a>');
  assert.match(limpio, /<p>Hola<\/p>/);
  assert.doesNotMatch(limpio, /script|onclick|javascript:/i);
});
