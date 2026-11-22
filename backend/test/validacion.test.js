import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL ||= "https://ejemplo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "clave-de-prueba";
process.env.DATABASE_URL ||= "postgresql://u:p@localhost:5432/db";
process.env.KEYCLOAK_URL ||= "http://localhost:8080";
process.env.KEYCLOAK_REALM ||= "prueba";
process.env.KEYCLOAK_CLIENT_ID ||= "prueba";

const { ESQUEMAS_EDITORIALES, esquemaRevision } = await import("../src/validation/editorial.schemas.js");
const { validar, errorDeValidacion } = await import("../src/middlewares/validar.middleware.js");
const { default: manejarError } = await import("../src/middlewares/error.middleware.js");
const { MODULOS_EDITORIALES } = await import("../src/services/cms/editorial.modulos.js");

const ok = (esquema, datos) => {
  const r = esquema.safeParse(datos);
  assert.ok(r.success, r.success ? "" : JSON.stringify(r.error.issues));
  return r.data;
};
const falla = (esquema, datos, mensaje) => {
  const r = esquema.safeParse(datos);
  assert.equal(r.success, false, "tendría que haber fallado");
  const mensajes = r.error.issues.map((i) => i.message).join(" | ");
  if (mensaje) assert.match(mensajes, mensaje);
  return r.error;
};

test("hay esquemas de crear y editar para cada módulo", () => {
  for (const { ruta } of MODULOS_EDITORIALES) {
    assert.ok(ESQUEMAS_EDITORIALES[ruta]?.crear, `${ruta}.crear`);
    assert.ok(ESQUEMAS_EDITORIALES[ruta]?.actualizar, `${ruta}.actualizar`);
  }
});

test("al crear, los campos obligatorios tienen que venir y no estar vacíos", () => {
  falla(ESQUEMAS_EDITORIALES.noticias.crear, { contenido: "x" }, /título es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "   ", contenido: "x" }, /título es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "t" }, /contenido es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.documentacion.crear, {}, /título es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.profesionales.crear, { especialidadId: "3" }, /nombre es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.profesionales.crear, { nombre: "A", especialidadId: "3" }, /apellido es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.especialidades.crear, {}, /nombre es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.residencias.crear, {}, /nombre es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.capacitaciones.crear, {}, /título es obligatorio/);
});

test("al editar solo se valida lo que viene (pero lo que viene no puede estar vacío si es obligatorio)", () => {
  ok(ESQUEMAS_EDITORIALES.noticias.actualizar, { contenido: "nuevo" });
  ok(ESQUEMAS_EDITORIALES.residencias.actualizar, { descripcion: "otra" });
  ok(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, {});
  falla(ESQUEMAS_EDITORIALES.noticias.actualizar, { titulo: "" }, /título es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { titulo: "  " }, /título es obligatorio/);
});

test("profesionales: el área es obligatoria al crear y al editar, y tiene que ser un id", () => {
  ok(ESQUEMAS_EDITORIALES.profesionales.crear, { nombre: "A", apellido: "B", especialidadId: 3 });
  falla(ESQUEMAS_EDITORIALES.profesionales.actualizar, { nombre: "A" }, /área o especialidad es obligatorio/);
  falla(ESQUEMAS_EDITORIALES.profesionales.actualizar, { especialidadId: "abc" }, /no es válido/);
});

test("los largos respetan los de la base y el mensaje nombra el campo", () => {
  falla(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "x".repeat(201), contenido: "c" }, /título no puede superar los 200 caracteres/);
  falla(ESQUEMAS_EDITORIALES.profesionales.crear, { nombre: "x".repeat(101), apellido: "B", especialidadId: "1" }, /nombre no puede superar los 100/);
  falla(ESQUEMAS_EDITORIALES.profesionales.actualizar, { especialidadId: "1", matricula: "1".repeat(51) }, /matrícula no puede superar los 50/);
  falla(ESQUEMAS_EDITORIALES.residencias.actualizar, { cupos: "1".repeat(51) }, /cupos no puede superar los 50/);
});

test("los textos se normalizan: sin espacios de más, y los números pasan a texto", () => {
  const datos = ok(ESQUEMAS_EDITORIALES.residencias.crear, { nombre: "  Clínica Médica  ", cupos: 4 });
  assert.equal(datos.nombre, "Clínica Médica");
  assert.equal(datos.cupos, "4");
});

test("estado: se pasa a mayúsculas, '' cuenta como no enviado y RECHAZADO no lo puede pedir el CM", () => {
  assert.equal(ok(ESQUEMAS_EDITORIALES.documentacion.actualizar, { estado: " publicado " }).estado, "PUBLICADO");
  assert.equal(ok(ESQUEMAS_EDITORIALES.documentacion.actualizar, { estado: "" }).estado, undefined);
  falla(ESQUEMAS_EDITORIALES.documentacion.actualizar, { estado: "RECHAZADO" }, /estado no es válido/);
  falla(ESQUEMAS_EDITORIALES.documentacion.actualizar, { estado: "cualquiera" }, /estado no es válido/);
});

test("booleanos: aceptan true/false y 'true'/'false' y devuelven un booleano", () => {
  assert.equal(ok(ESQUEMAS_EDITORIALES.especialidades.actualizar, { esServicio: "true" }).esServicio, true);
  assert.equal(ok(ESQUEMAS_EDITORIALES.especialidades.actualizar, { esServicio: false }).esServicio, false);
  assert.equal(ok(ESQUEMAS_EDITORIALES.residencias.actualizar, { activo: "false" }).activo, false);
  falla(ESQUEMAS_EDITORIALES.especialidades.actualizar, { esServicio: "quizás" }, /verdadero o falso/);
});

test("fechas: válidas, vacías (para borrarlas) o error; programar exige fecha", () => {
  ok(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { fechaInicio: "2026-12-01", fechaFin: "" });
  ok(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "t", contenido: "c", estado: "PROGRAMADO", fechaPublicacion: "2026-12-01T10:00:00.000Z" });
  falla(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { fechaInicio: "ayer" }, /fecha de inicio no es una fecha válida/);
  falla(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "t", contenido: "c", estado: "PROGRAMADO" }, /indicar la fecha/);
  falla(ESQUEMAS_EDITORIALES.residencias.actualizar, { estado: "PROGRAMADO" }, /indicar la fecha/);
  ok(ESQUEMAS_EDITORIALES.noticias.crear, { titulo: "t", contenido: "c", estado: "PUBLICADO" });
});

test("capacitaciones: modalidad conocida y la fecha de fin no puede ser anterior al inicio", () => {
  ok(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { modalidad: "Híbrida" });
  falla(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { modalidad: "Telepática" }, /modalidad no es válida/);
  falla(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { fechaInicio: "2026-12-10", fechaFin: "2026-12-01" }, /fecha de fin no puede ser anterior/);
  ok(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { fechaInicio: "2026-12-10", fechaFin: "2026-12-10" });
});

test("noticias: la lista de imágenes existentes tiene que ser un JSON con textos", () => {
  ok(ESQUEMAS_EDITORIALES.noticias.actualizar, { imagenesExistentes: '["https://a/b.jpg"]' });
  ok(ESQUEMAS_EDITORIALES.noticias.actualizar, { imagenesExistentes: "[]" });
  falla(ESQUEMAS_EDITORIALES.noticias.actualizar, { imagenesExistentes: "no es json" }, /imágenes existentes no es válido/);
  falla(ESQUEMAS_EDITORIALES.noticias.actualizar, { imagenesExistentes: "[1,2]" }, /imágenes existentes no es válido/);
});

test("especialidades: los requisitos pueden ser texto o lista de textos", () => {
  ok(ESQUEMAS_EDITORIALES.especialidades.actualizar, { requisitos: "a\nb" });
  ok(ESQUEMAS_EDITORIALES.especialidades.actualizar, { requisitos: ["a", "b"] });
  falla(ESQUEMAS_EDITORIALES.especialidades.actualizar, { requisitos: [1, 2] }, /requisitos no son válidos/);
});

test("los campos que el esquema no menciona pasan sin tocarse", () => {
  const datos = ok(ESQUEMAS_EDITORIALES.capacitaciones.actualizar, { archivoNombre: "x.pdf", cualquierCosa: 5 });
  assert.equal(datos.archivoNombre, "x.pdf");
  assert.equal(datos.cualquierCosa, 5);
});

test("revisión: APROBAR / RECHAZAR (en cualquier mayúscula) y el rechazo exige motivo", () => {
  assert.equal(ok(esquemaRevision, { decision: "aprobar" }).decision, "APROBAR");
  assert.equal(ok(esquemaRevision, { decision: "RECHAZAR", motivo: "  Falta info  " }).motivo, "Falta info");
  assert.equal(ok(esquemaRevision, { decision: "APROBAR", esServicio: "true" }).esServicio, true);
  falla(esquemaRevision, { decision: "RECHAZAR" }, /motivo de rechazo/);
  falla(esquemaRevision, { decision: "RECHAZAR", motivo: "   " }, /motivo de rechazo/);
  falla(esquemaRevision, { decision: "APROBADO" }, /APROBAR o RECHAZAR/);
  falla(esquemaRevision, {}, /APROBAR o RECHAZAR/);
});

test("el middleware: pasa el cuerpo normalizado, o corta con un 400 legible y el detalle por campo", () => {
  const req = { body: { titulo: "  Hola  ", contenido: "x" } };
  let siguio = false;
  validar(ESQUEMAS_EDITORIALES.noticias.crear)(req, {}, (e) => {
    assert.equal(e, undefined);
    siguio = true;
  });
  assert.ok(siguio);
  assert.equal(req.body.titulo, "Hola");

  const mala = { body: { contenido: "x", titulo: "t".repeat(300) } };
  let error = null;
  validar(ESQUEMAS_EDITORIALES.noticias.crear)(mala, {}, (e) => {
    error = e;
  });
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /título no puede superar los 200/);
  assert.deepEqual(error.details.map((d) => d.campo), ["titulo"]);

  const sinCuerpo = {};
  validar(ESQUEMAS_EDITORIALES.capacitaciones.actualizar)(sinCuerpo, {}, () => {});
  assert.deepEqual(sinCuerpo.body, {}, "sin cuerpo se valida como {}");
});

test("muchos errores: se muestran los primeros y se avisa cuántos más hay", () => {
  const r = ESQUEMAS_EDITORIALES.residencias.actualizar.safeParse({
    nombre: "x".repeat(300),
    descripcion: "x".repeat(6000),
    cupos: "9".repeat(60),
    duracion: "x".repeat(300),
    categoria: "x".repeat(300),
    convocatoria: "x".repeat(200),
  });
  assert.equal(r.success, false);
  const error = errorDeValidacion(r.error);
  assert.match(error.message, /\(y 2 más\)$/);
  assert.equal(error.details.length, 6);
});

test("el manejador de errores devuelve el código y el detalle por campo", () => {
  const r = ESQUEMAS_EDITORIALES.noticias.crear.safeParse({});
  const error = errorDeValidacion(r.error);
  let codigo;
  let cuerpo;
  const res = {
    status: (c) => {
      codigo = c;
      return res;
    },
    json: (b) => {
      cuerpo = b;
      return res;
    },
  };
  const consola = console.error;
  console.error = () => {};
  manejarError(error, {}, res, () => {});
  console.error = consola;
  assert.equal(codigo, 400);
  assert.equal(cuerpo.success, false);
  assert.equal(cuerpo.error.code, "VALIDATION_ERROR");
  assert.match(cuerpo.error.message, /título es obligatorio/);
  assert.ok(Array.isArray(cuerpo.error.details) && cuerpo.error.details.length >= 2);
});
