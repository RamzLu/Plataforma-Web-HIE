import { test } from "node:test";
import assert from "node:assert/strict";

// El util importa Supabase y Prisma; se dan valores de relleno para poder probar solo las funciones puras.
process.env.SUPABASE_URL ||= "https://ejemplo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "clave-de-prueba";
process.env.DATABASE_URL ||= "postgresql://u:p@localhost:5432/db";

const { refDesdeUrl, refDeArchivo, archivosHuerfanos } = await import("../src/utils/archivos.utils.js");

const BASE = "https://ejemplo.supabase.co";

test("refDesdeUrl: reconoce las URLs públicas de nuestro Supabase", () => {
  assert.deepEqual(
    refDesdeUrl(`${BASE}/storage/v1/object/public/noticias-imagenes/prof_123.jpg`, BASE),
    { bucket: "noticias-imagenes", nombre: "prof_123.jpg" }
  );
  assert.deepEqual(
    refDesdeUrl(`${BASE}/storage/v1/object/public/documentos/mi%20archivo.pdf?t=1`, BASE),
    { bucket: "documentos", nombre: "mi archivo.pdf" }
  );
});

test("refDesdeUrl: ignora links externos, blob y valores vacíos", () => {
  assert.equal(refDesdeUrl("https://otro-sitio.com/storage/v1/object/public/documentos/a.pdf", BASE), null);
  assert.equal(refDesdeUrl("blob:http://localhost/123", BASE), null);
  assert.equal(refDesdeUrl("https://youtu.be/abc", BASE), null);
  assert.equal(refDesdeUrl("", BASE), null);
  assert.equal(refDesdeUrl(null, BASE), null);
});

test("refDeArchivo: toma el bucket del primer tramo de la ruta", () => {
  assert.deepEqual(refDeArchivo({ ruta: "documentos/abc.pdf", nombreArchivo: "abc.pdf" }), { bucket: "documentos", nombre: "abc.pdf" });
  assert.equal(refDeArchivo(null), null);
  assert.equal(refDeArchivo({ ruta: "", nombreArchivo: "x.jpg" }), null);
});

test("archivosHuerfanos: solo los anteriores que la versión vigente ya no usa", () => {
  const a = { bucket: "b", nombre: "a.jpg" };
  const b = { bucket: "b", nombre: "b.jpg" };
  const otroBucket = { bucket: "c", nombre: "a.jpg" };
  assert.deepEqual(archivosHuerfanos([a, b], [b]), [a]);
  assert.deepEqual(archivosHuerfanos([a, b], [a, b]), []);
  assert.deepEqual(archivosHuerfanos([a], [otroBucket]), [a]); // mismo nombre en otro bucket no cuenta
});

test("archivosHuerfanos: sin repetidos y tolera nulos", () => {
  const a = { bucket: "b", nombre: "a.jpg" };
  assert.deepEqual(archivosHuerfanos([a, a, null, undefined], [null]), [a]);
  assert.deepEqual(archivosHuerfanos([], [a]), []);
});
