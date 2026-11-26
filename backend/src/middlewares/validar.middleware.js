// Valida (y normaliza) el cuerpo de la solicitud con un esquema de zod antes de llegar al controlador.
// Si no es válido responde 400 con un mensaje legible; si lo es, req.body pasa a ser el resultado ya
// normalizado (textos sin espacios de más, booleanos de verdad, estados en mayúsculas...).
//
// Va después de Multer: en los formularios con archivos el cuerpo recién se arma ahí.

const MAX_MENSAJES = 4;

/** Convierte los problemas de zod en un error 400 con un mensaje para el usuario y el detalle por campo. */
export const errorDeValidacion = (errorZod) => {
  const detalles = errorZod.issues.map((problema) => ({
    campo: problema.path.join("."),
    mensaje: problema.message,
  }));
  const mensajes = [...new Set(detalles.map((d) => d.mensaje))];
  const extra = mensajes.length > MAX_MENSAJES ? ` (y ${mensajes.length - MAX_MENSAJES} más)` : "";
  const error = new Error(`${mensajes.slice(0, MAX_MENSAJES).join(" ")}${extra}`);
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.details = detalles;
  return error;
};

export const validar = (esquema) => (req, _res, next) => {
  const resultado = esquema.safeParse(req.body ?? {});
  if (!resultado.success) return next(errorDeValidacion(resultado.error));
  req.body = resultado.data;
  next();
};
