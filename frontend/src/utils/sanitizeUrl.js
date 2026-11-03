/**
 * Valida y sanea URLs dinamicas antes de usarlas en atributos href o window.open().
 *
 * Segunda barrera de defensa (V10): aunque el backend valida al guardar y al leer,
 * esta utilidad garantiza en el cliente que nunca se renderice un esquema peligroso
 * como javascript:, data:, vbscript: o protocolo relativo (//evil.com).
 *
 * @param {unknown} rawUrl URL recibida de la API o estado del formulario
 * @param {string} fallback Valor a devolver si la URL es vacia o insegura
 * @param {{ allowRelative?: boolean, allowBlob?: boolean }} options
 * @returns {string} URL segura o fallback
 */
export const sanitizeUrl = (rawUrl, fallback = "", options = {}) => {
  if (typeof rawUrl !== "string") return fallback;

  // Eliminar caracteres de control que podrian ofuscar el protocolo (ej. "java\nscript:")
  const limpia = rawUrl.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!limpia) return fallback;

  // Bloquear siempre protocolo relativo (//evil.com)
  if (limpia.startsWith("//")) return fallback;

  if (options.allowRelative && limpia.startsWith("/")) {
    return limpia;
  }

  if (options.allowBlob && limpia.startsWith("blob:")) {
    return limpia;
  }

  try {
    const parsed = new URL(limpia);
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname) {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
};

