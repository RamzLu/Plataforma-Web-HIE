// Papelera de lo rechazado (solo la maneja el CM).
//
// Un contenido rechazado que nunca se publicó puede mandarse a la Papelera en vez de quedar en "Rechazados":
//   - desde ahí se puede restaurar (vuelve a "Rechazados" con su motivo) o eliminar definitivamente;
//   - no hay un "vaciar todo": ni el CM ni el Admin deciden cuándo se vacía, para que ninguno pierda autoridad;
//   - lo que lleva 15 días en la Papelera se elimina solo (ver server.js). Se cuenta por ítem, desde que se descartó.
// El Admin no interviene: no confirma nada (la ve en solo lectura, con los días que le quedan a cada ítem).
//
// La marca vive dentro de la columna "pendingMeta" del registro ({ papelera: { desde, por } }), sin columnas nuevas.
// Descartar una edición rechazada de algo ya publicado todavía no se admite (primero hay que restaurar la versión publicada).

import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { escribirColumnaEditorial } from "../../utils/metaEditorial.utils.js";
import { conservaVersionPublica } from "../../utils/eliminacion.utils.js";
import { registrarAuditoria } from "../../utils/auditoria.utils.js";
import { registrarFalla } from "../../utils/log.utils.js";
import CmsNoticiaService from "./cms.noticia.service.js";
import CmsDocService from "./cms.doc.service.js";
import CmsProfesionalService from "./cms.profesional.service.js";
import CmsEspecialidadService from "./cms.especialidad.service.js";
import CmsResidenciaService from "./cms.residencia.service.js";
import CmsCapacitacionService from "./cms.capacitacion.service.js";

export const DIAS_EN_PAPELERA = 15;
const DIA_MS = 24 * 60 * 60 * 1000;

export const MODELOS_CON_PAPELERA = ["noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion"];

// Cómo se elimina de verdad cada tipo de contenido (borra también sus archivos).
const ELIMINAR = {
  noticia: (id, opciones) => CmsNoticiaService.eliminarNoticia(id, opciones),
  documento: (id, opciones) => CmsDocService.eliminarDocumento(id, opciones),
  profesional: (id, opciones) => CmsProfesionalService.eliminarProfesional(id, opciones),
  especialidad: (id, opciones) => CmsEspecialidadService.eliminarEspecialidad(id, false, opciones),
  servicio: (id, opciones) => CmsEspecialidadService.eliminarEspecialidad(id, true, opciones),
  residencia: (id, opciones) => CmsResidenciaService.eliminarResidencia(id, opciones),
  capacitacion: (id, opciones) => CmsCapacitacionService.eliminarCapacitacion(id, opciones),
};

const error = (mensaje, statusCode) => Object.assign(new Error(mensaje), { statusCode });

export const estaEnPapelera = (meta) => Boolean(meta?.papelera?.desde);

/** Cuándo se elimina solo un ítem que entró a la Papelera en `desde`. */
export const venceEl = (desde) => new Date(new Date(desde).getTime() + DIAS_EN_PAPELERA * DIA_MS).toISOString();

const leer = async (modelo, id) => {
  if (!MODELOS_CON_PAPELERA.includes(modelo)) throw error("Tipo de contenido no válido.", 400);
  let idBigInt;
  try {
    idBigInt = BigInt(id);
  } catch {
    throw error("ID no válido.", 400);
  }
  const fila = await prisma[modelo].findUnique({ where: { id: idBigInt }, select: { id: true, estado: true, pendingMeta: true } });
  if (!fila) throw error("El contenido no existe.", 404);
  return fila;
};

const guardarMeta = (modelo, id, meta) => {
  const hayAlgo = meta && Object.keys(meta).length > 0;
  return escribirColumnaEditorial(modelo, id, "pendingMeta", hayAlgo ? meta : null);
};

/** Manda a la Papelera un contenido rechazado que nunca se publicó. */
export const descartar = async (modelo, id, user) => {
  const fila = await leer(modelo, id);
  const meta = fila.pendingMeta && typeof fila.pendingMeta === "object" ? fila.pendingMeta : {};
  if (estaEnPapelera(meta)) return { message: "Ya estaba en la Papelera.", papeleraDesde: meta.papelera.desde, papeleraVenceEl: venceEl(meta.papelera.desde) };
  if (String(fila.estado).toUpperCase() !== "RECHAZADO") throw error("Solo se puede mandar a la Papelera lo que fue rechazado.", 400);
  if (conservaVersionPublica(fila, meta)) {
    throw error("Esta es una edición rechazada de algo publicado: todavía no se puede mandar a la Papelera.", 400);
  }
  const papelera = { desde: new Date().toISOString(), por: user?.name || user?.username || "Editor CMS" };
  await guardarMeta(modelo, id, { ...meta, papelera });
  await registrarAuditoria(user, { entidad: modelo, id, accion: "DESCARTAR", descripcion: "Mandó a la Papelera un contenido rechazado." });
  return { message: `Se movió a la Papelera. Se elimina solo en ${DIAS_EN_PAPELERA} días.`, papeleraDesde: papelera.desde, papeleraVenceEl: venceEl(papelera.desde) };
};

/** Saca un contenido de la Papelera: vuelve a "Rechazados". */
export const restaurar = async (modelo, id, user) => {
  const fila = await leer(modelo, id);
  const meta = fila.pendingMeta && typeof fila.pendingMeta === "object" ? { ...fila.pendingMeta } : {};
  if (!estaEnPapelera(meta)) throw error("Este contenido no está en la Papelera.", 400);
  delete meta.papelera;
  await guardarMeta(modelo, id, meta);
  await registrarAuditoria(user, { entidad: modelo, id, accion: "RESTAURAR", descripcion: "Restauró un contenido de la Papelera." });
  return { message: "Se restauró: volvió a Rechazados." };
};

/** No deja editar ni reenviar un contenido que está en la Papelera: primero hay que restaurarlo. */
export const exigirFueraDePapelera = async (modelo, id) => {
  let fila;
  try {
    fila = await leer(modelo, id);
  } catch (e) {
    if (e.statusCode === 404) return; // que lo resuelva el servicio (mismo mensaje de siempre)
    throw e;
  }
  if (estaEnPapelera(fila.pendingMeta)) throw error("Este contenido está en la Papelera. Restauralo para poder editarlo.", 409);
};

const enPapelera = async (modelo) => {
  const filas = await prisma[modelo].findMany({ where: { pendingMeta: { not: Prisma.DbNull } }, select: { id: true, estado: true, pendingMeta: true } });
  return filas.filter((f) => estaEnPapelera(f.pendingMeta));
};

const eliminarDefinitivo = async (modelo, id) => {
  await ELIMINAR[modelo](String(id), { user: null });
};

/** Elimina lo que lleva más de 15 días en la Papelera. Lo corre el cron de server.js. */
export const purgarVencidos = async (ahora = new Date()) => {
  let eliminados = 0;
  for (const modelo of MODELOS_CON_PAPELERA) {
    for (const fila of await enPapelera(modelo)) {
      if (new Date(venceEl(fila.pendingMeta.papelera.desde)) > ahora) continue;
      try {
        await eliminarDefinitivo(modelo, fila.id);
        eliminados += 1;
      } catch (e) {
        registrarFalla("Papelera (vaciado automático)", e);
      }
    }
  }
  return eliminados;
};

/**
 * Agrega a cada registro de la vista interna si está en la Papelera y cuándo se elimina solo
 * ("enPapelera", "papeleraDesde", "papeleraVenceEl"). entidadDe(item) devuelve el modelo del registro.
 */
export const agregarPapelera = async (items, entidadDe) => {
  if (!Array.isArray(items)) return items;
  try {
    const mapa = new Map();
    for (const modelo of MODELOS_CON_PAPELERA) {
      for (const fila of await enPapelera(modelo)) mapa.set(`${modelo}_${fila.id}`, fila.pendingMeta.papelera);
    }
    return items.map((item) => {
      const marca = mapa.get(`${entidadDe(item)}_${item.id}`);
      return {
        ...item,
        enPapelera: Boolean(marca),
        papeleraDesde: marca?.desde || null,
        papeleraVenceEl: marca ? venceEl(marca.desde) : null,
      };
    });
  } catch (e) {
    registrarFalla("Papelera", e);
    return items;
  }
};
