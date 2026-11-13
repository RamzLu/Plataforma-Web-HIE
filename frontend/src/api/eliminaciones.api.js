import api from "./axiosConfig.js";
import keycloak from "../config/keycloak";

// Solicitudes de eliminación de contenido publicado (solo administradores).

const encabezados = async () => {
  try {
    await keycloak.updateToken(10);
  } catch {
    // Si no se pudo renovar se usa el token actual; si venció, el backend responde 401.
  }
  return { Authorization: `Bearer ${keycloak.token}` };
};

export const getSolicitudesEliminacion = async () => {
  const response = await api.get("/cms/solicitudes-eliminacion", { headers: await encabezados() });
  return response.data;
};

export const resolverSolicitudEliminacion = async (entidad, id, aprobar, motivo = "") => {
  const response = await api.patch(
    `/cms/solicitudes-eliminacion/${entidad}/${id}`,
    { aprobar, motivo },
    { headers: await encabezados() }
  );
  return response.data;
};
