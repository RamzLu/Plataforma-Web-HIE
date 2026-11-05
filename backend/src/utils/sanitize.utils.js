import sanitizeHtml from 'sanitize-html';

/**
 * Saneamiento del HTML del cuerpo de las noticias (editor CKEditor del CMS).
 *
 * Solo se conserva el formato que el editor puede producir: parrafos, titulos (h2-h4),
 * negrita/cursiva/subrayado/tachado, listas, citas, enlaces y alineacion de texto.
 * Se eliminan <script>, <iframe>, <img>, <svg>, manejadores on*="..." (onerror, onclick...),
 * estilos distintos de text-align y URLs con esquemas peligrosos (javascript:, data:, vbscript:).
 *
 * Se aplica al GUARDAR, de modo que un editor malicioso (o un token robado) no pueda
 * dejar JavaScript almacenado que se ejecute en el navegador de los visitantes del portal.
 */
const TAGS_CON_ALINEACION = ['p', 'h2', 'h3', 'h4', 'li', 'blockquote'];

const OPCIONES_NOTICIA = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    ...Object.fromEntries(TAGS_CON_ALINEACION.map((tag) => [tag, ['style']])),
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/i] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  transformTags: {
    // Los enlaces que abren en otra pestana no deben poder manipular la pagina de origen.
    a: (tagName, attribs) => {
      const salida = { ...attribs };
      if (salida.target) {
        salida.target = '_blank';
        salida.rel = 'noopener noreferrer';
      } else {
        delete salida.target;
        delete salida.rel;
      }
      return { tagName, attribs: salida };
    },
  },
};

/**
 * @param {unknown} html HTML enviado por el cliente
 * @returns {string} HTML seguro (cadena vacia si no es texto)
 */
export const sanitizarHtmlNoticia = (html) => {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, OPCIONES_NOTICIA).trim();
};

/**
 * Valida que una URL opcional tenga esquema seguro http: o https: (o ruta interna /... si se habilita).
 * Rechaza esquemas peligrosos como javascript:, data:, vbscript:, blob: o protocolo relativo (//).
 * Lanza un Error con statusCode = 400 si la URL es invalida.
 *
 * @param {unknown} rawUrl URL enviada por el cliente
 * @param {string} nombreCampo Nombre descriptivo del campo para el mensaje de error
 * @param {boolean} permitirRutaRelativa Si es true, permite rutas internas que comiencen con un solo '/'
 * @returns {string} URL normalizada o cadena vacia si estaba vacia
 */
export const validarUrlHttp = (rawUrl, nombreCampo = 'URL', permitirRutaRelativa = false) => {
  if (rawUrl === null || rawUrl === undefined) return '';
  if (typeof rawUrl !== 'string') {
    const err = new Error(`El campo ${nombreCampo} debe ser una cadena de texto válida.`);
    err.statusCode = 400;
    throw err;
  }

  // Eliminar caracteres de control o espacios invisibles que intenten ofuscar el esquema
  const limpia = rawUrl.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!limpia) return '';

  // Prohibir siempre URLs con protocolo relativo (//evil.com)
  if (limpia.startsWith('//')) {
    const err = new Error(`La URL en ${nombreCampo} no es válida. Use http:// o https://.`);
    err.statusCode = 400;
    throw err;
  }

  if (permitirRutaRelativa && limpia.startsWith('/')) {
    return limpia;
  }

  let parsed;
  try {
    parsed = new URL(limpia);
  } catch {
    const err = new Error(`La URL en ${nombreCampo} no tiene un formato válido. Debe comenzar con http:// o https://.`);
    err.statusCode = 400;
    throw err;
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
    const err = new Error(`Protocolo no permitido en ${nombreCampo}. Solo se aceptan enlaces http:// o https://.`);
    err.statusCode = 400;
    throw err;
  }

  return parsed.toString();
};

/**
 * Sanea una URL almacenada al leerla de la base de datos (segunda capa de defensa).
 * Si la URL no cumple con http(s) (o ruta relativa interna cuando corresponde), devuelve el fallback.
 *
 * @param {unknown} rawUrl
 * @param {string|null} fallback
 * @param {boolean} permitirRutaRelativa
 * @returns {string|null}
 */
export const sanitizarUrlLectura = (rawUrl, fallback = '', permitirRutaRelativa = false) => {
  try {
    const validada = validarUrlHttp(rawUrl, 'URL', permitirRutaRelativa);
    return validada || fallback;
  } catch {
    return fallback;
  }
};

const MAX_POSTGRES_BIGINT = 9223372036854775807n;

export const parsearIdBigInt = (rawId, nombreCampo = 'ID') => {
  if (rawId === null || rawId === undefined) {
    const err = new Error(`El ${nombreCampo} es obligatorio.`);
    err.statusCode = 400;
    throw err;
  }

  if (typeof rawId === 'bigint') {
    if (rawId >= 1n && rawId <= MAX_POSTGRES_BIGINT) return rawId;
    const err = new Error(`El ${nombreCampo} proporcionado está fuera de rango.`);
    err.statusCode = 400;
    throw err;
  }

  const texto = String(rawId).trim();
  if (!/^[1-9]\d*$/.test(texto)) {
    const err = new Error(`El ${nombreCampo} proporcionado no tiene un formato numérico válido.`);
    err.statusCode = 400;
    throw err;
  }

  const valor = BigInt(texto);
  if (valor > MAX_POSTGRES_BIGINT) {
    const err = new Error(`El ${nombreCampo} proporcionado está fuera de rango.`);
    err.statusCode = 400;
    throw err;
  }

  return valor;
};

export const parsearArregloJson = (rawJson, nombreCampo = 'lista de datos') => {
  if (rawJson === null || rawJson === undefined || rawJson === '') return [];
  if (Array.isArray(rawJson)) return rawJson;
  if (typeof rawJson !== 'string') {
    const err = new Error(`El formato de ${nombreCampo} no es válido.`);
    err.statusCode = 400;
    throw err;
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      const err = new Error(`El campo ${nombreCampo} debe ser un arreglo JSON válido.`);
      err.statusCode = 400;
      throw err;
    }
    return parsed;
  } catch (error) {
    if (error.statusCode === 400) throw error;
    const err = new Error(`El contenido JSON en ${nombreCampo} está mal formado.`);
    err.statusCode = 400;
    throw err;
  }
};



