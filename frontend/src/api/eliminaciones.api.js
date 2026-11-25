import api from "./axiosConfig.js";
import { invalidarListados } from "./editorial.api.js";

// Solicitudes de eliminación de contenido publicado (solo administradores).
// Las llamadas a /cms/... llevan el token de Keycloak automáticamente (ver axiosConfig.js).

export const getSolicitudesEliminacion = async () => (await api.get("/cms/solicitudes-eliminacion")).data;

export const resolverSolicitudEliminacion = async (entidad, id, aprobar, motivo = "") => {
  const resultado = (await api.patch(`/cms/solicitudes-eliminacion/${entidad}/${id}`, { aprobar, motivo })).data;
  // Resolver el pedido cambia las listas (el contenido se borra o deja de pedir eliminación).
  invalidarListados();
  return resultado;
};
