import DOMPurify from "dompurify";

/**
 * Saneamiento del HTML de las noticias antes de mostrarlo con dangerouslySetInnerHTML.
 *
 * Es la segunda barrera (la primera es el backend, que sanea al guardar): protege tambien
 * ante contenido viejo ya almacenado en la base de datos.
 *
 * Solo se permite el formato que produce el editor del CMS (parrafos, titulos h2-h4,
 * negrita/cursiva/subrayado/tachado, listas, citas, enlaces y alineacion de texto).
 * Se descartan scripts, iframes, imagenes, manejadores on*="...", estilos distintos de
 * text-align y URLs con esquemas peligrosos (javascript:, data:, vbscript:).
 */
const TAGS_PERMITIDOS = ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "h2", "h3", "h4"];
const ATRIBUTOS_PERMITIDOS = ["href", "target", "rel", "style"];

let hooksRegistrados = false;
const registrarHooks = () => {
  if (hooksRegistrados) return;
  hooksRegistrados = true;

  // Filtrado granular de atributos individuales
  DOMPurify.addHook("uponSanitizeAttribute", (_nodo, datos) => {
    // Prohibir enlaces con protocolo relativo (//evil.com)
    if (datos.attrName === "href" && typeof datos.attrValue === "string" && datos.attrValue.trim().startsWith("//")) {
      datos.keepAttr = false;
      return;
    }

    // El atributo style solo puede contener text-align con un valor conocido.
    if (datos.attrName === "style") {
      const coincidencia = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i.exec(datos.attrValue);
      if (coincidencia) {
        datos.attrValue = `text-align:${coincidencia[1].toLowerCase()}`;
      } else {
        datos.keepAttr = false;
      }
    }
  });

  // Los enlaces que abren en otra pestana no deben poder manipular la pagina de origen.
  DOMPurify.addHook("afterSanitizeAttributes", (nodo) => {
    if (nodo.tagName !== "A") return;
    if (nodo.getAttribute("target")) {
      nodo.setAttribute("target", "_blank");
      nodo.setAttribute("rel", "noopener noreferrer");
    } else {
      nodo.removeAttribute("target");
      nodo.removeAttribute("rel");
    }
  });
};

/**
 * @param {unknown} html HTML proveniente de la API
 * @returns {string} HTML seguro para dangerouslySetInnerHTML (cadena vacia si no es texto)
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== "string" || !html) return "";
  registrarHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_PERMITIDOS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
};
