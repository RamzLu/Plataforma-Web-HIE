import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularCambios, combinarCambios, cambiosParaCliente, formatoHtml } from "../src/utils/cambios.utils.js";

const campos = [
  { key: "titulo", label: "Título" },
  { key: "images", label: "Imágenes", tipo: "images" },
];

test("al editar de nuevo algo rechazado, los cambios anteriores se conservan y se suman los nuevos", () => {
  // Primera edición (publicado -> título nuevo); el Admin la rechaza.
  const primera = calcularCambios({ titulo: "Original", images: [] }, { titulo: "Nuevo", images: [] }, campos);
  // Segunda edición, ya sobre lo rechazado: solo se agrega una imagen.
  const segunda = calcularCambios({ titulo: "Nuevo", images: [] }, { titulo: "Nuevo", images: ["a.jpg"] }, campos);

  const acumulados = combinarCambios(primera, segunda);
  assert.deepEqual(acumulados.map((c) => c.campo).sort(), ["images", "titulo"]);
  const titulo = acumulados.find((c) => c.campo === "titulo");
  assert.equal(titulo.antes, "Original", "el 'antes' sigue siendo lo que está publicado");
  assert.equal(titulo.despues, "Nuevo");
});

test("si un campo vuelve a su valor original, deja de figurar como cambio", () => {
  const primera = calcularCambios({ titulo: "Original" }, { titulo: "Nuevo" }, campos);
  const vuelta = calcularCambios({ titulo: "Nuevo" }, { titulo: "Original" }, campos);
  assert.deepEqual(combinarCambios(primera, vuelta), []);
});

test("sin cambios anteriores, quedan solo los nuevos", () => {
  const nuevos = calcularCambios({ titulo: "A" }, { titulo: "B" }, campos);
  assert.equal(combinarCambios([], nuevos).length, 1);
  assert.equal(combinarCambios(undefined, nuevos).length, 1);
});

test("para el frontend, los cambios de imágenes traen las URLs de antes y después (para mostrarlas)", () => {
  const cambios = calcularCambios(
    { titulo: "A", images: ["https://x.co/a.jpg", "https://x.co/b.jpg"] },
    { titulo: "B", images: ["https://x.co/b.jpg", "https://x.co/c.jpg"] },
    campos
  );
  const [titulo, imagenes] = cambiosParaCliente(cambios);
  assert.equal(titulo.imagenes, undefined, "los cambios de texto no llevan imágenes");
  assert.deepEqual(imagenes.imagenes, {
    antes: ["https://x.co/a.jpg", "https://x.co/b.jpg"],
    despues: ["https://x.co/b.jpg", "https://x.co/c.jpg"],
  });
  assert.equal(imagenes.valorAntes, undefined, "no se envían los valores crudos");
});

test("para el frontend, solo pasan las URLs http(s) (nada de javascript: ni rutas raras)", () => {
  const [cambio] = cambiosParaCliente(
    calcularCambios({ images: [] }, { images: ["javascript:alert(1)", "data:image/png;base64,AAA", "https://x.co/ok.png"] }, [
      { key: "images", label: "Imágenes", tipo: "images" },
    ])
  );
  assert.deepEqual(cambio.imagenes.despues, ["https://x.co/ok.png"]);
});

test("una foto única (tipo image) también trae su URL de antes y después", () => {
  const [cambio] = cambiosParaCliente(
    calcularCambios({ foto: "https://x.co/vieja.jpg" }, { foto: "https://x.co/nueva.jpg" }, [{ key: "foto", label: "Fotografía", tipo: "image" }])
  );
  assert.deepEqual(cambio.imagenes, { antes: ["https://x.co/vieja.jpg"], despues: ["https://x.co/nueva.jpg"] });
});

// ── Contenido con formato (HTML) ──────────────────────────
const camposHtml = [{ key: "contenido", label: "Contenido", tipo: "html" }];

test("un cambio solo de formato (negrita) cuenta como cambio y se marca como tal", () => {
  const cambios = calcularCambios({ contenido: "<p>Hola mundo</p>" }, { contenido: "<p>Hola <strong>mundo</strong></p>" }, camposHtml);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].soloFormato, true);
  assert.equal(cambios[0].label, "Contenido (formato)");
  assert.equal(cambiosParaCliente(cambios)[0].soloFormato, true);
});

test("espacios o &nbsp; distintos no son un cambio de formato", () => {
  assert.equal(formatoHtml("<p>Hola&nbsp;mundo</p>\n<p>Chau</p>"), formatoHtml("<p>Hola mundo</p><p>Chau</p>"));
  assert.deepEqual(calcularCambios({ contenido: "<p>Hola&nbsp; mundo</p>" }, { contenido: "<p>Hola mundo</p>\n" }, camposHtml), []);
});

test("un cambio de texto sigue siendo un cambio normal (no solo de formato)", () => {
  const [cambio] = calcularCambios({ contenido: "<p>Hola</p>" }, { contenido: "<p><em>Chau</em></p>" }, camposHtml);
  assert.equal(cambio.label, "Contenido");
  assert.equal(cambio.soloFormato, undefined);
});

test("si el texto vuelve al original pero queda otro formato, el cambio se conserva", () => {
  const primera = calcularCambios({ contenido: "<p>Hola</p>" }, { contenido: "<p>Chau</p>" }, camposHtml);
  const vuelta = calcularCambios({ contenido: "<p>Chau</p>" }, { contenido: "<p><strong>Hola</strong></p>" }, camposHtml);
  const acumulados = combinarCambios(primera, vuelta);
  assert.equal(acumulados.length, 1);
  assert.equal(acumulados[0].soloFormato, true);
});
