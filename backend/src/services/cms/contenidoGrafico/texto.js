// Limpieza de texto que escribe el CM antes de guardarlo (sin HTML ni caracteres de control).

export const crearError = (mensaje, statusCode = 400) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

/**
 * Limpia texto plano conservando saltos de línea (\n) para textos multilínea,
 * eliminando caracteres de control peligrosos y etiquetas HTML.
 */
export const limpiarTextoPlanoMultilinea = (valor, maxLen = 300) => {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
};

export const limpiarTextoSimple = (valor, maxLen = 250) => {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
};
