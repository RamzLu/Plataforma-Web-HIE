import { prisma } from "../config/prisma.js";

// Metadatos editoriales que los servicios del CMS guardan en la tabla "configuracion"
// (una fila por registro, con la clave "<prefijo><id>"):
//   - motivo de rechazo         -> texto
//   - cambios pendientes        -> JSON (estado anterior, estado pedido, cambios, snapshot público...)
//   - editor responsable        -> JSON { editor, updatedAt } (o texto plano en filas viejas)
// Antes cada servicio repetía estas funciones; ahora todos usan crearMetaEditorial().

const leerMapa = async (prefijo, convertir) => {
  try {
    const filas = await prisma.configuracion.findMany({
      where: { clave: { startsWith: prefijo } },
    });
    const mapa = new Map();
    for (const fila of filas) {
      const valor = convertir(fila);
      if (valor !== undefined) mapa.set(fila.clave.replace(prefijo, ""), valor);
    }
    return mapa;
  } catch {
    // Si la tabla no responde, se trabaja como si no hubiera metadatos.
    return new Map();
  }
};

const leerUno = async (clave, convertir) => {
  try {
    const fila = await prisma.configuracion.findUnique({ where: { clave } });
    return fila ? convertir(fila) ?? null : null;
  } catch {
    return null;
  }
};

const guardar = (clave, valor, descripcion) =>
  prisma.configuracion.upsert({
    where: { clave },
    update: { valor, updatedAt: new Date() },
    create: { clave, valor, descripcion, updatedAt: new Date() },
  });

const borrar = (clave) => prisma.configuracion.deleteMany({ where: { clave } });

const comoJson = (fila) => {
  try {
    return JSON.parse(fila.valor);
  } catch {
    return undefined; // JSON inválido: se ignora
  }
};

const comoEditor = (fila) => {
  try {
    return JSON.parse(fila.valor);
  } catch {
    // Filas viejas: el valor era solo el nombre del editor.
    return { editor: fila.valor, updatedAt: fila.updatedAt };
  }
};

/**
 * entidad: nombre legible para la columna "descripcion" (ej. "profesional").
 * rechazo / pendiente / editor: prefijos de clave de cada tipo de metadato (editor es opcional).
 * Las funciones reciben la "clave" del registro (normalmente su id como texto).
 */
export const crearMetaEditorial = ({ entidad, rechazo, pendiente, editor = null }) => ({
  obtenerMapaMotivosRechazo: () => leerMapa(rechazo, (fila) => fila.valor),
  obtenerMotivoRechazo: (clave) => leerUno(`${rechazo}${clave}`, (fila) => fila.valor),
  guardarMotivoRechazo: (clave, motivo) =>
    guardar(`${rechazo}${clave}`, motivo, `Motivo de rechazo de ${entidad} ID ${clave}`),
  limpiarMotivoRechazo: (clave) => borrar(`${rechazo}${clave}`),

  obtenerMapaPendingMeta: () => leerMapa(pendiente, comoJson),
  obtenerPendingMeta: (clave) => leerUno(`${pendiente}${clave}`, comoJson),
  guardarPendingMeta: (clave, meta) =>
    guardar(`${pendiente}${clave}`, JSON.stringify(meta), `Metadatos de solicitud pendiente para ${entidad} ID ${clave}`),
  limpiarPendingMeta: (clave) => borrar(`${pendiente}${clave}`),

  obtenerMapaEditorMeta: () => (editor ? leerMapa(editor, comoEditor) : Promise.resolve(new Map())),
  guardarEditorMeta: (clave, meta) =>
    guardar(
      `${editor}${clave}`,
      typeof meta === "string"
        ? JSON.stringify({ editor: meta, updatedAt: new Date().toISOString() })
        : JSON.stringify(meta),
      `Editor responsable de ${entidad} ID ${clave}`
    ),
  limpiarEditorMeta: (clave) => borrar(`${editor}${clave}`),
});
