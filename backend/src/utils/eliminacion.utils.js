// Reglas comunes para eliminar contenido del CMS.
//
// Lo que nunca fue público (borradores, rechazados, archivados, pendientes nuevos) se borra directamente.
// Lo que está visible en el portal no se borra: queda una "solicitud de eliminación" que el administrador
// aprueba (y recién ahí se borra) o rechaza (y el contenido queda como estaba). Mientras tanto sigue visible.
// Las solicitudes se guardan como JSON en la columna "solicitudEliminacion" de la tabla de cada entidad.

import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { registrarAuditoria } from "./auditoria.utils.js";
import { registrarFalla } from "./log.utils.js";
import { escribirColumnaEditorial } from "./metaEditorial.utils.js";

const ESTADOS_VISIBLES = ["PUBLICADO", "APROBADO", "PROGRAMADO"];

// El nombre de cada entidad coincide con el de su modelo de Prisma.
export const ENTIDADES_ELIMINABLES = ["noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion"];

const modeloDe = (entidad) => {
  if (!ENTIDADES_ELIMINABLES.includes(entidad)) {
    throw new Error(`Entidad no válida para solicitudes de eliminación: "${entidad}".`);
  }
  return prisma[entidad];
};

const leerSolicitud = async (entidad, id) => {
  const fila = await modeloDe(entidad).findUnique({
    where: { id: BigInt(id) },
    select: { solicitudEliminacion: true },
  });
  return fila?.solicitudEliminacion ?? null;
};

const escribirSolicitud = (entidad, id, valor) => {
  modeloDe(entidad);
  return escribirColumnaEditorial(entidad, id, "solicitudEliminacion", valor);
};

/**
 * true si el registro es una edición en revisión (pendiente) o rechazada de algo que ya estaba publicado
 * y todavía tiene guardada la versión pública anterior. En ese caso el portal sigue mostrando la versión
 * publicada hasta que el administrador apruebe el cambio.
 */
export const conservaVersionPublica = (registro, pendingMeta = null) => {
  const estado = String(registro?.estado || "").toUpperCase();
  return (
    (estado === "PENDIENTE_APROBACION" || estado === "RECHAZADO") &&
    ["PUBLICADO", "APROBADO"].includes(pendingMeta?.previousEstado) &&
    Boolean(pendingMeta?.snapshotPublico)
  );
};

/**
 * Nombre (título) con el que está publicado hoy un registro que se está editando, o null si no hay edición en curso
 * sobre una versión pública. `clave` es el campo del nombre en la versión guardada ("titulo" o "nombre").
 */
export const nombreDeLaVersionPublica = (registro, pendingMeta = null, clave = "titulo") =>
  conservaVersionPublica(registro, pendingMeta) ? pendingMeta.snapshotPublico?.[clave] ?? null : null;

/** Motivo que ve el CM cuando su edición pendiente queda reemplazada por un pedido de eliminación. */
export const MOTIVO_EDICION_REEMPLAZADA =
  "Esta edición quedó reemplazada por tu pedido de eliminación de este contenido.";

/** true si el registro es una edición pendiente de revisión sobre una versión que ya estaba publicada. */
export const tieneEdicionPendiente = (registro, pendingMeta = null) =>
  String(registro?.estado || "").toUpperCase() === "PENDIENTE_APROBACION" && conservaVersionPublica(registro, pendingMeta);

/**
 * true si el contenido está (o va a estar) visible en el portal: publicado, aprobado, programado,
 * o con una edición pendiente sobre una versión pública.
 */
export const tieneVersionPublica = (registro, pendingMeta = null) => {
  const estado = String(registro?.estado || "").toUpperCase();
  const pendienteConVersionPublica =
    estado === "PENDIENTE_APROBACION" &&
    (registro?.activo === true || ["PUBLICADO", "APROBADO"].includes(pendingMeta?.previousEstado));
  return ESTADOS_VISIBLES.includes(estado) || pendienteConVersionPublica || conservaVersionPublica(registro, pendingMeta);
};

/**
 * true si el portal está mostrando hoy este contenido: publicado, o con una edición en revisión o rechazada
 * encima de una versión que sigue pública. El panel lo usa para no dar a entender que algo dejó de estar publicado
 * solo porque se está editando.
 */
export const estaVisibleEnPortal = (registro, pendingMeta = null) =>
  ["PUBLICADO", "APROBADO"].includes(String(registro?.estado || "").toUpperCase()) || conservaVersionPublica(registro, pendingMeta);

/** Guarda la solicitud (si no existe ya) y devuelve la respuesta para el CMS. */
export const solicitarEliminacion = async ({ entidad, id, titulo, user, reemplazaEdicion = false }) => {
  const existente = await leerSolicitud(entidad, id);
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
  await escribirSolicitud(entidad, id, solicitud);
  await registrarAuditoria(user, { entidad, id, accion: "SOLICITAR_ELIMINACION", descripcion: `Solicitud de eliminación de "${solicitud.titulo}".${reemplazaEdicion ? " Reemplaza a su edición pendiente." : ""}`,
  });

  return {
    solicitudEliminacion: true,
    message:
      "El contenido está publicado: se envió una solicitud de eliminación al administrador. " +
      (reemplazaEdicion ? "Tu edición pendiente quedó reemplazada por este pedido. " : "") +
      "Seguirá visible hasta que la apruebe.",
  };
};

export const obtenerSolicitudEliminacion = (entidad, id) => leerSolicitud(entidad, id);

export const listarSolicitudesEliminacion = async () => {
  const porEntidad = await Promise.all(
    ENTIDADES_ELIMINABLES.map((entidad) =>
      prisma[entidad].findMany({
        where: { solicitudEliminacion: { not: Prisma.DbNull } },
        select: { solicitudEliminacion: true },
      })
    )
  );
  return porEntidad
    .flat()
    .map((fila) => fila.solicitudEliminacion)
    .filter((s) => s && typeof s === "object")
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
};

/**
 * Marca en cada registro si tiene una solicitud de eliminación pendiente (campo "solicitudEliminacion").
 * Se usa solo en las vistas internas del CMS y del Admin. entidadDe(item) devuelve la entidad del registro.
 */
export const agregarSolicitudesEliminacion = async (items, entidadDe) => {
  if (!Array.isArray(items)) return items;
  try {
    const mapa = new Map((await listarSolicitudesEliminacion()).map((s) => [`${s.entidad}_${s.id}`, s]));
    return items.map((item) => ({
      ...item,
      solicitudEliminacion: mapa.get(`${entidadDe(item)}_${item.id}`) || null,
    }));
  } catch (error) {
    registrarFalla("Solicitudes de eliminación", error);
    return items;
  }
};

export const limpiarSolicitudEliminacion = (entidad, id) => escribirSolicitud(entidad, id, null);

export const registrarResolucionEliminacion = (user, solicitud, aprobada, motivo = "") =>
  registrarAuditoria(user, { entidad: solicitud.entidad, id: solicitud.id, accion: aprobada ? "APROBAR_ELIMINACION" : "RECHAZAR_ELIMINACION", descripcion: aprobada
      ? `Eliminación aprobada de "${solicitud.titulo}".`
      : `Eliminación rechazada de "${solicitud.titulo}".${motivo ? ` Motivo: ${motivo}` : ""}`,
  });
