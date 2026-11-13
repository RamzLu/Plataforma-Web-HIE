// Reglas comunes para eliminar contenido del CMS.
//
// Lo que nunca fue público (borradores, rechazados, archivados, pendientes nuevos) se borra directamente.
// Lo que está visible en el portal no se borra: queda una "solicitud de eliminación" que el administrador
// aprueba (y recién ahí se borra) o rechaza (y el contenido queda como estaba). Mientras tanto sigue visible.
// Las solicitudes se guardan en la tabla configuracion con la clave "eliminacion_<entidad>_<id>".

import { prisma } from "../config/prisma.js";
import { obtenerOCrearUsuarioLocal } from "./user.utils.js";
import { registrarFalla } from "./log.utils.js";

const ESTADOS_VISIBLES = ["PUBLICADO", "APROBADO", "PROGRAMADO"];
const PREFIJO = "eliminacion_";

export const ENTIDADES_ELIMINABLES = ["noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion"];

const claveDe = (entidad, id) => `${PREFIJO}${entidad}_${id}`;

/**
 * true si el contenido está (o va a estar) visible en el portal: publicado, aprobado, programado,
 * o con una edición pendiente sobre una versión pública.
 */
export const tieneVersionPublica = (registro, pendingMeta = null) => {
  const estado = String(registro?.estado || "").toUpperCase();
  const pendienteConVersionPublica =
    estado === "PENDIENTE_APROBACION" &&
    (registro?.activo === true || ["PUBLICADO", "APROBADO"].includes(pendingMeta?.previousEstado));
  return ESTADOS_VISIBLES.includes(estado) || pendienteConVersionPublica;
};

const registrarAuditoria = async (user, entidad, id, accion, descripcion) => {
  if (!user) return;
  try {
    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
    await prisma.auditoria.create({
      data: { usuarioId: usuarioLocal.id, entidad, entidadId: String(id), accion, descripcion },
    });
  } catch (error) {
    registrarFalla("Auditoría", error);
  }
};

/** Guarda la solicitud (si no existe ya) y devuelve la respuesta para el CMS. */
export const solicitarEliminacion = async ({ entidad, id, titulo, user }) => {
  const clave = claveDe(entidad, id);
  const existente = await prisma.configuracion.findUnique({ where: { clave } });
  if (existente) {
    return {
      solicitudEliminacion: true,
      message: "Ya hay una solicitud de eliminación pendiente para este contenido.",
    };
  }

  const solicitud = {
    entidad,
    id: String(id),
    titulo: titulo || "(sin título)",
    solicitadoPor: user?.name || user?.username || "Editor CMS",
    fecha: new Date().toISOString(),
  };
  await prisma.configuracion.upsert({
    where: { clave },
    update: { valor: JSON.stringify(solicitud), updatedAt: new Date() },
    create: {
      clave,
      valor: JSON.stringify(solicitud),
      descripcion: `Solicitud de eliminación de ${entidad} ID ${id}`,
      updatedAt: new Date(),
    },
  });
  await registrarAuditoria(user, entidad, id, "SOLICITAR_ELIMINACION", `Solicitud de eliminación de "${solicitud.titulo}".`);

  return {
    solicitudEliminacion: true,
    message:
      "El contenido está publicado: se envió una solicitud de eliminación al administrador. Seguirá visible hasta que la apruebe.",
  };
};

export const obtenerSolicitudEliminacion = async (entidad, id) => {
  const fila = await prisma.configuracion.findUnique({ where: { clave: claveDe(entidad, id) } });
  if (!fila) return null;
  try {
    return JSON.parse(fila.valor);
  } catch {
    return { entidad, id: String(id), titulo: "(sin título)", solicitadoPor: "Editor CMS", fecha: fila.updatedAt };
  }
};

export const listarSolicitudesEliminacion = async () => {
  const filas = await prisma.configuracion.findMany({ where: { clave: { startsWith: PREFIJO } } });
  return filas
    .map((fila) => {
      try {
        return JSON.parse(fila.valor);
      } catch {
        return null; // fila corrupta: se omite
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
};

export const limpiarSolicitudEliminacion = (entidad, id) =>
  prisma.configuracion.deleteMany({ where: { clave: claveDe(entidad, id) } });

export const registrarResolucionEliminacion = (user, solicitud, aprobada, motivo = "") =>
  registrarAuditoria(
    user,
    solicitud.entidad,
    solicitud.id,
    aprobada ? "APROBAR_ELIMINACION" : "RECHAZAR_ELIMINACION",
    aprobada
      ? `Eliminación aprobada de "${solicitud.titulo}".`
      : `Eliminación rechazada de "${solicitud.titulo}".${motivo ? ` Motivo: ${motivo}` : ""}`
  );
