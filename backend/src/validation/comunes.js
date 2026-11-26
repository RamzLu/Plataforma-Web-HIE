import { z } from "zod";

// Piezas comunes de los esquemas de validación. Los mensajes salen en español y nombran el campo
// ("El título no puede superar los 200 caracteres."), porque llegan tal cual al usuario del panel.

z.config(z.locales.es());

// Los formularios multipart mandan todo como texto; los números se aceptan y se pasan a texto.
const aTexto = (valor) => (typeof valor === "number" ? String(valor) : valor);

/** Texto opcional (puede faltar, ser null o ser ""). */
export const textoOpcional = (etiqueta, max) =>
  z.preprocess(
    aTexto,
    z
      .string({ error: `${etiqueta} debe ser un texto.` })
      .trim()
      .max(max, `${etiqueta} no puede superar los ${max} caracteres.`)
      .nullish()
  );

/** Texto obligatorio: tiene que venir y no estar vacío. */
export const textoObligatorio = (etiqueta, max) =>
  z.preprocess(
    aTexto,
    z
      .string({ error: `${etiqueta} es obligatorio.` })
      .trim()
      .min(1, `${etiqueta} es obligatorio.`)
      .max(max, `${etiqueta} no puede superar los ${max} caracteres.`)
  );

/** Verdadero/falso: acepta true, false, "true" y "false" (los formularios mandan texto). Devuelve un booleano. */
export const booleano = (etiqueta) =>
  z
    .union([z.boolean(), z.enum(["true", "false"])], { error: `${etiqueta} debe ser verdadero o falso.` })
    .transform((valor) => valor === true || valor === "true")
    .optional();

const esFechaValida = (valor) => valor === "" || !Number.isNaN(new Date(valor).getTime());

/** Fecha opcional: "" (para borrarla) o algo que JavaScript entienda como fecha (2026-12-01, ISO con hora...). */
export const fechaOpcional = (etiqueta) =>
  z
    .string({ error: `${etiqueta} debe ser una fecha.` })
    .trim()
    .refine(esFechaValida, `${etiqueta} no es una fecha válida.`)
    .nullish();

/** Id numérico (viene como texto o número). */
export const idObligatorio = (etiqueta) =>
  z.preprocess(
    aTexto,
    z
      .string({ error: `${etiqueta} es obligatorio.` })
      .trim()
      .regex(/^\d+$/, `${etiqueta} no es válido.`)
  );

// Lo que el CM puede pedir con el campo "estado". RECHAZADO solo lo decide el Admin al revisar.
export const ESTADOS_PEDIDOS = ["BORRADOR", "PENDIENTE_APROBACION", "PUBLICADO", "APROBADO", "PROGRAMADO", "ARCHIVADO"];

export const estadoPedido = z.preprocess(
  (valor) => {
    if (typeof valor !== "string") return valor;
    const limpio = valor.trim().toUpperCase();
    return limpio === "" ? undefined : limpio;
  },
  z
    .enum(ESTADOS_PEDIDOS, { error: `El estado no es válido. Opciones: ${ESTADOS_PEDIDOS.join(", ")}.` })
    .optional()
);

/** Para programar una publicación hay que decir cuándo. */
export const exigirFechaSiProgramado = (campoFecha = "fechaPublicacion") => (datos, ctx) => {
  if (datos.estado === "PROGRAMADO" && !datos[campoFecha]) {
    ctx.addIssue({ code: "custom", path: [campoFecha], message: "Para programar la publicación hay que indicar la fecha." });
  }
};
