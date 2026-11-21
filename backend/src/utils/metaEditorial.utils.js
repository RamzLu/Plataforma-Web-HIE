import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

// Metadatos editoriales de cada registro del CMS, guardados en columnas de su propia tabla:
//   - rejectionReason -> motivo de rechazo (texto)
//   - pendingMeta     -> cambios pendientes (JSON: estado anterior, estado pedido, cambios, snapshot público...)
//   - editorMeta      -> editor responsable (JSON { editor, updatedAt })
// Antes se guardaban como filas sueltas en la tabla "configuracion"; ver la migración 1_metadatos_editoriales.

const COLUMNAS_JSON = new Set(["pendingMeta", "editorMeta", "solicitudEliminacion"]);
// En columnas Json, "sin valor" se expresa con Prisma.DbNull (un null común da error).
const nulo = (columna) => (COLUMNAS_JSON.has(columna) ? Prisma.DbNull : null);

const MODELOS_EDITORIALES = new Set(["noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion"]);
const COLUMNAS_EDITORIALES = new Set(["rejectionReason", "pendingMeta", "editorMeta", "solicitudEliminacion"]);

/**
 * Escribe (o borra, con null) una columna editorial sin tocar "updatedAt": guardar un motivo de rechazo
 * o un pedido de baja no es una edición del contenido. Si el registro ya no existe no hace nada.
 * Tabla y columna salen de las listas fijas de arriba, nunca de datos del usuario.
 */
export const escribirColumnaEditorial = (modelo, id, columna, valor) => {
  if (!MODELOS_EDITORIALES.has(modelo) || !COLUMNAS_EDITORIALES.has(columna)) {
    throw new Error(`Columna editorial no válida: ${modelo}.${columna}`);
  }
  const tabla = Prisma.raw(`"${modelo}"`);
  const col = Prisma.raw(`"${columna}"`);
  const dato =
    valor == null
      ? Prisma.sql`NULL`
      : COLUMNAS_JSON.has(columna)
      ? Prisma.sql`${JSON.stringify(valor)}::jsonb`
      : Prisma.sql`${String(valor)}`;
  return prisma.$executeRaw`UPDATE ${tabla} SET ${col} = ${dato} WHERE "id" = ${BigInt(id)}`;
};

const COLUMNA = {
  rechazo: "rejectionReason",
  pendiente: "pendingMeta",
  editor: "editorMeta",
};

/**
 * entidad: nombre legible del contenido (solo para mensajes).
 * modelos: { prefijoDeClave: nombreDelModeloPrisma }. La "clave" que reciben las funciones es
 *   prefijo + id. Con un solo modelo el prefijo es "" (la clave es el id). Especialidades usa
 *   { "esp_": "especialidad", "srv_": "servicio" } porque un mismo servicio maneja dos tablas.
 */
export const crearMetaEditorial = ({ entidad, modelos }) => {
  // Los prefijos más largos primero, para que "" quede como último recurso.
  const entradas = Object.entries(modelos).sort((a, b) => b[0].length - a[0].length);

  const resolver = (clave) => {
    const texto = String(clave);
    for (const [prefijo, modelo] of entradas) {
      if (!texto.startsWith(prefijo)) continue;
      const resto = texto.slice(prefijo.length);
      if (!/^\d+$/.test(resto)) break;
      return { modelo, delegate: prisma[modelo], id: BigInt(resto) };
    }
    throw new Error(`Clave de metadatos inválida para ${entidad}: "${texto}".`);
  };

  const leerMapa = async (columna) => {
    const mapa = new Map();
    for (const [prefijo, modelo] of entradas) {
      const filas = await prisma[modelo].findMany({
        where: { [columna]: { not: nulo(columna) } },
        select: { id: true, [columna]: true },
      });
      for (const fila of filas) mapa.set(`${prefijo}${fila.id}`, fila[columna]);
    }
    return mapa;
  };

  const leerUno = async (clave, columna) => {
    const { delegate, id } = resolver(clave);
    const fila = await delegate.findUnique({ where: { id }, select: { [columna]: true } });
    return fila?.[columna] ?? null;
  };

  const escribir = (clave, columna, valor) => {
    const { modelo, id } = resolver(clave);
    return escribirColumnaEditorial(modelo, id, columna, valor);
  };

  return {
    obtenerMapaMotivosRechazo: () => leerMapa(COLUMNA.rechazo),
    obtenerMotivoRechazo: (clave) => leerUno(clave, COLUMNA.rechazo),
    guardarMotivoRechazo: (clave, motivo) => escribir(clave, COLUMNA.rechazo, motivo == null ? null : String(motivo)),
    limpiarMotivoRechazo: (clave) => escribir(clave, COLUMNA.rechazo, null),

    obtenerMapaPendingMeta: () => leerMapa(COLUMNA.pendiente),
    obtenerPendingMeta: (clave) => leerUno(clave, COLUMNA.pendiente),
    guardarPendingMeta: (clave, meta) => escribir(clave, COLUMNA.pendiente, meta),
    limpiarPendingMeta: (clave) => escribir(clave, COLUMNA.pendiente, null),

    obtenerMapaEditorMeta: () => leerMapa(COLUMNA.editor),
    guardarEditorMeta: (clave, meta) =>
      escribir(
        clave,
        COLUMNA.editor,
        typeof meta === "string" ? { editor: meta, updatedAt: new Date().toISOString() } : meta
      ),
    limpiarEditorMeta: (clave) => escribir(clave, COLUMNA.editor, null),
  };
};
