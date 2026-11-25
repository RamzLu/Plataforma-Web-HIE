import api from "./axiosConfig.js";

// Los módulos del CMS con flujo editorial (noticias, documentación, profesionales, especialidades,
// residencias y capacitaciones) comparten las mismas rutas y las mismas respuestas.
// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).
//
//   listar(isAdmin)             GET    /cms/<ruta> (vista interna) o /portal/<ruta> (solo lo publicado)
//   crear(datos)                POST   /cms/<ruta>                      -> { message, data }
//   actualizar(id, datos)       PUT    /cms/<ruta>/:id                  -> { message, data }
//                               (el CM pide un cambio de estado con el campo "estado": PUBLICADO, ARCHIVADO...)
//   revisar(id, decision, ...)  PATCH  /cms/<ruta>/:id/revision         -> { message, data }
//                               (solo el Admin; decision: "APROBAR" | "RECHAZAR", el rechazo lleva motivo)
//   eliminar(id, params)        DELETE /cms/<ruta>/:id
// Memoria de los listados: al volver a una sección o a la pestaña se reutiliza lo que ya se pidió hace poco, en vez de
// volver a pedirlo y mostrar "cargando". Se descarta al pasar el tiempo, al tocar "Actualizar" o al guardar algo.
const VIGENCIA_MS = 45_000;
const listadosGuardados = new Map(); // "ruta|admin" -> { hora, datos }
const listadosEnCurso = new Map(); // "ruta|admin" -> promesa (varias vistas piden lo mismo a la vez: se hace una sola llamada)
let version = 0; // sube con cada descarte, para no guardar una respuesta que ya quedó vieja

/** Descarta los listados guardados: lo siguiente que se pida va al servidor. */
export const invalidarListados = () => {
  version += 1;
  listadosGuardados.clear();
  listadosEnCurso.clear();
};

const conInvalidacion = (accion) => async (...args) => {
  const resultado = await accion(...args);
  invalidarListados();
  return resultado;
};

export const crearApiEditorial = (ruta) => ({
  listar: async (isAdmin = false) => {
    const clave = `${ruta}|${Boolean(isAdmin)}`;
    const guardado = listadosGuardados.get(clave);
    if (guardado && Date.now() - guardado.hora < VIGENCIA_MS) return guardado.datos;
    if (listadosEnCurso.has(clave)) return listadosEnCurso.get(clave);

    const versionAlPedir = version;
    const promesa = api
      .get(isAdmin ? `/cms/${ruta}` : `/portal/${ruta}`)
      .then(({ data }) => {
        if (versionAlPedir === version) listadosGuardados.set(clave, { hora: Date.now(), datos: data });
        return data;
      })
      .finally(() => {
        if (listadosEnCurso.get(clave) === promesa) listadosEnCurso.delete(clave);
      });
    listadosEnCurso.set(clave, promesa);
    return promesa;
  },
  crear: conInvalidacion(async (datos) => (await api.post(`/cms/${ruta}`, datos)).data),
  actualizar: conInvalidacion(async (id, datos) => (await api.put(`/cms/${ruta}/${id}`, datos)).data),
  revisar: conInvalidacion(async (id, decision, motivo = "", extra = {}) =>
    (await api.patch(`/cms/${ruta}/${id}/revision`, { decision, motivo, ...extra })).data),
  eliminar: conInvalidacion(async (id, params) => (await api.delete(`/cms/${ruta}/${id}`, params ? { params } : undefined)).data),
});
