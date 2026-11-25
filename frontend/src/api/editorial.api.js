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
export const crearApiEditorial = (ruta) => ({
  listar: async (isAdmin = false) => (await api.get(isAdmin ? `/cms/${ruta}` : `/portal/${ruta}`)).data,
  crear: async (datos) => (await api.post(`/cms/${ruta}`, datos)).data,
  actualizar: async (id, datos) => (await api.put(`/cms/${ruta}/${id}`, datos)).data,
  revisar: async (id, decision, motivo = "", extra = {}) =>
    (await api.patch(`/cms/${ruta}/${id}/revision`, { decision, motivo, ...extra })).data,
  eliminar: async (id, params) => (await api.delete(`/cms/${ruta}/${id}`, params ? { params } : undefined)).data,
  // Papelera de lo rechazado (solo el CM). En especialidades/servicios, `extra.esServicio` dice a cuál se refiere.
  descartar: async (id, extra = {}) => (await api.patch(`/cms/${ruta}/${id}/descartar`, extra)).data,
  restaurar: async (id, extra = {}) => (await api.patch(`/cms/${ruta}/${id}/restaurar`, extra)).data,
});
