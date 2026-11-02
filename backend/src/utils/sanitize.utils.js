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

