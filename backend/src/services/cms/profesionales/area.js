// El área de un profesional: una especialidad o un servicio clave.
//
// Un servicio clave no es una especialidad: el profesional queda asignado a la especialidad genérica
// "Servicio Clave" y el nombre del servicio se guarda en la tabla "area" (puente profesional_area).

import { prisma } from "../../../config/prisma.js";
import { parsearIdBigInt } from "../../../utils/sanitize.utils.js";

const NOMBRE_SERVICIO_CLAVE = "Servicio Clave";

const noEncontrado = (mensaje) => Object.assign(new Error(mensaje), { statusCode: 404 });

/**
 * Valida el área elegida y devuelve la especialidad a guardar y el nombre del área.
 * @returns {{ especialidadId: bigint, areaNombre: string }}
 */
export const resolverArea = async (especialidadId, esServicio) => {
  const id = parsearIdBigInt(especialidadId, "ID de área o especialidad");

  if (esServicio) {
    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) throw noEncontrado("El servicio seleccionado no existe.");

    let generica = await prisma.especialidad.findFirst({ where: { nombre: NOMBRE_SERVICIO_CLAVE } });
    if (!generica) {
      generica = await prisma.especialidad.create({
        data: {
          nombre: NOMBRE_SERVICIO_CLAVE,
          estado: "PUBLICADO",
          descripcion: "Clasificación interna para servicios",
        },
      });
    }
    return { especialidadId: generica.id, areaNombre: servicio.nombre };
  }

  const especialidad = await prisma.especialidad.findUnique({ where: { id } });
  if (!especialidad) throw noEncontrado("La especialidad seleccionada no existe.");
  return { especialidadId: especialidad.id, areaNombre: especialidad.nombre };
};

/** Asigna el área (por nombre) al profesional, creándola si no existe. */
export const asignarArea = async (profesionalId, areaNombre) => {
  if (!areaNombre) return;
  let area = await prisma.area.findFirst({ where: { nombre: areaNombre } });
  if (!area) area = await prisma.area.create({ data: { nombre: areaNombre } });
  await prisma.profesional_area.create({ data: { profesionalId, areaId: area.id } });
};

/** Quita las áreas asignadas al profesional (antes de asignarle la nueva al editar). */
export const quitarAreas = (profesionalId) => prisma.profesional_area.deleteMany({ where: { profesionalId } });
