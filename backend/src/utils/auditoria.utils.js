import { prisma } from "../config/prisma.js";
import { obtenerOCrearUsuarioLocal } from "./user.utils.js";
import { registrarFalla } from "./log.utils.js";

/**
 * Acciones registradas en la tabla auditoria (mismo vocabulario en todos los módulos):
 *   CREAR, MODIFICAR, ELIMINAR, SOLICITAR_REVISION, APROBAR, RECHAZAR, ARCHIVAR,
 *   SOLICITAR_ELIMINACION, APROBAR_ELIMINACION, RECHAZAR_ELIMINACION.
 */
export const ACCIONES = Object.freeze({
  CREAR: "CREAR",
  MODIFICAR: "MODIFICAR",
  ELIMINAR: "ELIMINAR",
  SOLICITAR_REVISION: "SOLICITAR_REVISION",
  APROBAR: "APROBAR",
  RECHAZAR: "RECHAZAR",
  ARCHIVAR: "ARCHIVAR",
  SOLICITAR_ELIMINACION: "SOLICITAR_ELIMINACION",
  APROBAR_ELIMINACION: "APROBAR_ELIMINACION",
  RECHAZAR_ELIMINACION: "RECHAZAR_ELIMINACION",
});

/**
 * Registra una acción en la auditoría. Nunca corta la operación principal: si falla, solo se informa en el log.
 * user: req.user (sin usuario, por ejemplo el cron, no se registra nada).
 */
export const registrarAuditoria = async (user, { entidad, id, accion, descripcion = null }) => {
  if (!user) return;
  try {
    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
    await prisma.auditoria.create({
      data: {
        usuarioId: usuarioLocal.id,
        entidad,
        entidadId: id == null ? null : String(id),
        accion,
        descripcion,
      },
    });
  } catch (error) {
    registrarFalla("Auditoría", error);
  }
};
