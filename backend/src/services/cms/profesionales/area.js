// El área de un profesional: una especialidad o un servicio clave.
//
// Un servicio clave no es una especialidad: el profesional queda asignado a la especialidad genérica
// "Servicio Clave" y el nombre del servicio se guarda en la tabla "area" (puente profesional_area).

import { prisma } from "../../../config/prisma.js";
import { parsearIdBigInt } from "../../../utils/sanitize.utils.js";
import { tieneVersionPublica } from "../../../utils/eliminacion.utils.js";

const NOMBRE_SERVICIO_CLAVE = "Servicio Clave";

const noEncontrado = (mensaje) => Object.assign(new Error(mensaje), { statusCode: 404 });

/**
 * Un profesional solo se asigna a algo que el portal ya muestra (publicado, o publicado con una edición en revisión).
 * Si el área ya era la del profesional, se deja pasar: editarle otros datos no debe fallar porque su área se despublicó.
 * Las consultas piden pendingMeta a propósito: se omite por defecto (config/prisma.js).
 */
const exigirPublicada = (registro, tipo, yaAsignada) => {
  if (yaAsignada || tieneVersionPublica(registro, registro.pendingMeta)) return;
  throw Object.assign(
    new Error(`${tipo === "servicio" ? "El servicio" : "La especialidad"} "${registro.nombre}" todavía no fue aprobad${tipo === "servicio" ? "o" : "a"} por el Administrador. Elegí ${tipo === "servicio" ? "un servicio publicado" : "una especialidad publicada"}.`),
    { statusCode: 400 }
  );
};

/**
 * Valida el área elegida y devuelve la especialidad a guardar y el nombre del área.
 * `actual` ({ especialidadId, areaNombre }) es el área que ya tiene el profesional, al editar.
 * @returns {{ especialidadId: bigint, areaNombre: string }}
 */
export const resolverArea = async (especialidadId, esServicio, actual = null) => {
  const id = parsearIdBigInt(especialidadId, "ID de área o especialidad");

  if (esServicio) {
    const servicio = await prisma.servicio.findUnique({ where: { id }, omit: { pendingMeta: false } });
    if (!servicio) throw noEncontrado("El servicio seleccionado no existe.");
    exigirPublicada(servicio, "servicio", actual?.areaNombre === servicio.nombre);

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

  const especialidad = await prisma.especialidad.findUnique({ where: { id }, omit: { pendingMeta: false } });
  if (!especialidad) throw noEncontrado("La especialidad seleccionada no existe.");
  exigirPublicada(especialidad, "especialidad", actual?.especialidadId === especialidad.id);
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
