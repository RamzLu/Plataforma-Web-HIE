import { test } from "node:test";
import assert from "node:assert/strict";

// Las rutas importan Supabase, Prisma y Keycloak; se dan valores de relleno para poder armar el router sin conectarse.
process.env.SUPABASE_URL ||= "https://ejemplo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "clave-de-prueba";
process.env.DATABASE_URL ||= "postgresql://u:p@localhost:5432/db";
process.env.KEYCLOAK_URL ||= "http://localhost:8080";
process.env.KEYCLOAK_REALM ||= "prueba";
process.env.KEYCLOAK_CLIENT_ID ||= "prueba";

const { leerRevision, unificarRespuesta, crearControladorEditorial } = await import("../src/controllers/cms/editorial.controller.js");
const { MODULOS_EDITORIALES } = await import("../src/services/cms/editorial.modulos.js");
const { default: cmsRouter } = await import("../src/routes/cms.routes.js");
const { default: portalRouter } = await import("../src/routes/portal.routes.js");

const rutasDe = (router) =>
  router.stack
    .filter((capa) => capa.route)
    .flatMap((capa) => Object.keys(capa.route.methods).map((metodo) => `${metodo.toUpperCase()} ${capa.route.path}`));

test("los 6 módulos del CMS exponen exactamente las mismas 5 rutas", () => {
  const rutas = rutasDe(cmsRouter);
  assert.deepEqual(
    MODULOS_EDITORIALES.map((m) => m.ruta),
    ["noticias", "documentacion", "profesionales", "especialidades", "residencias", "capacitaciones"]
  );
  for (const { ruta } of MODULOS_EDITORIALES) {
    for (const esperada of [`GET /${ruta}`, `POST /${ruta}`, `PUT /${ruta}/:id`, `PATCH /${ruta}/:id/revision`, `DELETE /${ruta}/:id`]) {
      assert.ok(rutas.includes(esperada), `falta ${esperada}`);
    }
    // No quedan las rutas anteriores (/estado, y el /revision especial de capacitaciones era el único de su tipo).
    assert.ok(!rutas.includes(`PATCH /${ruta}/:id/estado`), `sobra PATCH /${ruta}/:id/estado`);
  }
});

test("el portal expone el listado público de los mismos módulos", () => {
  const rutas = rutasDe(portalRouter);
  for (const { ruta } of MODULOS_EDITORIALES) assert.ok(rutas.includes(`GET /${ruta}`), `falta GET /${ruta} en el portal`);
});

test("cada módulo define todo lo que necesita el controlador común", () => {
  for (const m of MODULOS_EDITORIALES) {
    for (const campo of ["listar", "crear", "actualizar", "revisar", "eliminar", "entidad"]) {
      assert.equal(typeof m[campo], "function", `${m.ruta}.${campo}`);
    }
    assert.equal(typeof m.clave, "string", `${m.ruta}.clave`);
  }
});

test("leerRevision: acepta APROBAR o RECHAZAR y exige motivo al rechazar", () => {
  assert.deepEqual(leerRevision({ decision: "APROBAR" }), { decision: "APROBAR", motivo: null });
  assert.deepEqual(leerRevision({ decision: "aprobar" }), { decision: "APROBAR", motivo: null });
  assert.deepEqual(leerRevision({ decision: "RECHAZAR", motivo: "  Falta información  " }), { decision: "RECHAZAR", motivo: "Falta información" });
  assert.throws(() => leerRevision({ decision: "RECHAZAR" }), /motivo de rechazo/);
  assert.throws(() => leerRevision({ decision: "RECHAZAR", motivo: "   " }), /motivo de rechazo/);
  assert.throws(() => leerRevision({ decision: "APROBADO" }), /APROBAR o RECHAZAR/);
  assert.throws(() => leerRevision({}), /APROBAR o RECHAZAR/);
  assert.throws(() => leerRevision(undefined), /APROBAR o RECHAZAR/);
});

test("unificarRespuesta: el registro siempre va en data, sea cual sea la clave del servicio", () => {
  assert.deepEqual(unificarRespuesta({ message: "ok", noticia: { id: 1 } }, "noticia"), { message: "ok", data: { id: 1 } });
  assert.deepEqual(unificarRespuesta({ message: "ok", data: { id: 2 } }, "profesional"), { message: "ok", data: { id: 2 } });
  assert.deepEqual(unificarRespuesta({ message: "ok" }, "noticia"), { message: "ok", data: null });
});

const respuestaFalsa = () => {
  const res = { codigo: null, cuerpo: null };
  res.status = (c) => { res.codigo = c; return res; };
  res.json = (b) => { res.cuerpo = b; return res; };
  return res;
};

test("el controlador común: crea con 201, edita con 200 y unifica la respuesta", async () => {
  const modulo = {
    clave: "cosa",
    entidad: () => "cosa",
    listar: async (admin) => [{ id: 1, admin }],
    crear: async () => ({ message: "creada", cosa: { id: 9 } }),
    actualizar: async () => ({ message: "editada", cosa: { id: 9 } }),
    revisar: async (_req, d) => ({ message: "revisada", cosa: { id: 9, d } }),
    eliminar: async () => ({ message: "pedido", solicitudEliminacion: true }),
  };
  const c = crearControladorEditorial(modulo);

  let res = respuestaFalsa();
  await c.crear({}, res, assert.fail);
  assert.equal(res.codigo, 201);
  assert.deepEqual(res.cuerpo, { message: "creada", data: { id: 9 } });

  res = respuestaFalsa();
  await c.actualizar({}, res, assert.fail);
  assert.equal(res.codigo, 200);

  res = respuestaFalsa();
  await c.revisar({ body: { decision: "APROBAR" } }, res, assert.fail);
  assert.deepEqual(res.cuerpo, { message: "revisada", data: { id: 9, d: { decision: "APROBAR", motivo: null } } });

  res = respuestaFalsa();
  await c.eliminar({}, res, assert.fail);
  assert.equal(res.codigo, 202, "si queda una solicitud de eliminación responde 202");
});

test("el controlador común: un decisión inválida llega a next() como error 400 y no toca el servicio", async () => {
  let llamado = false;
  const c = crearControladorEditorial({ clave: "x", entidad: () => "x", revisar: async () => { llamado = true; return {}; } });
  let error = null;
  await c.revisar({ body: { decision: "NADA" } }, respuestaFalsa(), (e) => { error = e; });
  assert.equal(error?.statusCode, 400);
  assert.equal(llamado, false);
});
