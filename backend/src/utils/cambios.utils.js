/**
 * Utilidades para detectar automáticamente qué campos se modificaron al
 * actualizar un contenido desde el CMS, de modo que el Administrador pueda
 * ver resaltado "antes → después" al momento de revisar la solicitud.
 */

const MAX_TEXTO = 600;

const quitarHtml = (valor) =>
  String(valor)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Normaliza un valor a texto comparable/visualizable.
 * @param {*} valor
 * @param {"text"|"html"|"list"|"date"|"datetime"|"boolean"|"image"|"images"} tipo
 */
export const normalizarValorCambio = (valor, tipo = "text") => {
  if (valor === undefined || valor === null) return "";

  if (tipo === "list" || tipo === "images") {
    let lista = valor;
    if (typeof lista === "string") {
      try {
        const parsed = JSON.parse(lista);
        lista = Array.isArray(parsed) ? parsed : lista.split("\n");
      } catch (_) {
        lista = lista.split("\n");
      }
    }
    if (!Array.isArray(lista)) lista = [lista];
    return lista
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join("\n");
  }

  if (tipo === "html") return quitarHtml(valor);

  if (tipo === "boolean") return valor ? "Sí" : "No";

  if (tipo === "date" || tipo === "datetime") {
    const d = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(d.getTime())) return "";
    const fecha = d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });
    if (tipo === "date") return fecha;
    const hora = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    });
    return `${fecha} - ${hora} hs`;
  }

  return String(valor).replace(/\r\n/g, "\n").trim();
};

const recortar = (texto) =>
  texto.length > MAX_TEXTO ? `${texto.slice(0, MAX_TEXTO).trim()}…` : texto;

const describirImagenes = (antes, despues) => {
  const listaAntes = antes ? antes.split("\n") : [];
  const listaDespues = despues ? despues.split("\n") : [];
  const agregadas = listaDespues.filter((u) => !listaAntes.includes(u)).length;
  const quitadas = listaAntes.filter((u) => !listaDespues.includes(u)).length;
  const partes = [];
  if (agregadas) partes.push(`${agregadas} ${agregadas === 1 ? "imagen agregada" : "imágenes agregadas"}`);
  if (quitadas) partes.push(`${quitadas} ${quitadas === 1 ? "imagen quitada" : "imágenes quitadas"}`);
  return {
    antes: `${listaAntes.length} ${listaAntes.length === 1 ? "imagen" : "imágenes"}`,
    despues: `${listaDespues.length} ${listaDespues.length === 1 ? "imagen" : "imágenes"}${partes.length ? ` (${partes.join(", ")})` : ""}`,
  };
};

/**
 * Compara dos versiones de un contenido y devuelve la lista de campos modificados.
 * @param {object} antes  Valores previos (clave -> valor)
 * @param {object} despues Valores nuevos (clave -> valor)
 * @param {Array<{key:string,label:string,tipo?:string}>} campos
 * @returns {Array<{campo:string,label:string,tipo:string,antes:string,despues:string}>}
 */
const construirCambio = (key, label, tipo, valorAntes, valorDespues) => {
  if (valorAntes === valorDespues) return null;

  const base = { campo: key, label, tipo, valorAntes, valorDespues };

  if (tipo === "image") {
    return {
      ...base,
      antes: valorAntes ? "Fotografía anterior" : "Sin fotografía",
      despues: valorDespues ? "Nueva fotografía cargada" : "Fotografía eliminada",
    };
  }

  if (tipo === "images") {
    const desc = describirImagenes(valorAntes, valorDespues);
    return { ...base, antes: desc.antes, despues: desc.despues };
  }

  return { ...base, antes: recortar(valorAntes), despues: recortar(valorDespues) };
};

/**
 * HTML comparable conservando el formato (negritas, listas, títulos, alineación): solo unifica espacios.
 * El texto que ve el Admin sale de quitarHtml; esto sirve para no perder los cambios que son solo de formato.
 */
// &nbsp; escrito o como carácter (U+00A0): los dos son el mismo espacio.
const ESPACIO_DURO = new RegExp("&nbsp;|" + String.fromCharCode(160), "gi");

export const formatoHtml = (valor) =>
  String(valor ?? "")
    .replace(ESPACIO_DURO, " ")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

const LEYENDA_FORMATO = " (formato)";
const etiquetaBase = (label = "") => String(label).replace(LEYENDA_FORMATO, "");

/** Cambio de un campo HTML cuyo texto es el mismo pero el formato no (por ejemplo, una palabra en negrita). */
const cambioDeFormato = (campo, label, valorAntes, valorDespues, htmlAntes, htmlDespues) => ({
  campo,
  label: `${etiquetaBase(label)}${LEYENDA_FORMATO}`,
  tipo: "html",
  valorAntes,
  valorDespues,
  antes: recortar(valorAntes),
  despues: recortar(valorDespues),
  soloFormato: true,
  htmlAntes,
  htmlDespues,
});

export const calcularCambios = (antes = {}, despues = {}, campos = []) => {
  const cambios = [];
  for (const { key, label, tipo = "text" } of campos) {
    const valorAntes = normalizarValorCambio(antes?.[key], tipo);
    const valorDespues = normalizarValorCambio(despues?.[key], tipo);
    let cambio = construirCambio(key, label, tipo, valorAntes, valorDespues);
    if (tipo === "html") {
      // En los campos con formato se guarda también el HTML, para poder comparar el formato al combinar ediciones.
      const htmlAntes = formatoHtml(antes?.[key]);
      const htmlDespues = formatoHtml(despues?.[key]);
      if (cambio) cambio = { ...cambio, htmlAntes, htmlDespues };
      else if (htmlAntes !== htmlDespues) cambio = cambioDeFormato(key, label, valorAntes, valorDespues, htmlAntes, htmlDespues);
    }
    if (cambio) cambios.push(cambio);
  }
  return cambios;
};

/**
 * Combina los cambios acumulados de una solicitud aún pendiente con los de una
 * nueva edición: conserva el valor "antes" original y toma el "después" más reciente.
 * Si un campo vuelve a su valor original, se descarta (en los campos con formato, solo si también vuelve el formato).
 */
export const combinarCambios = (cambiosPrevios = [], cambiosNuevos = []) => {
  const mapa = new Map();
  for (const c of Array.isArray(cambiosPrevios) ? cambiosPrevios : []) {
    if (c?.campo) mapa.set(c.campo, { ...c });
  }
  for (const c of Array.isArray(cambiosNuevos) ? cambiosNuevos : []) {
    if (!c?.campo) continue;
    const previo = mapa.get(c.campo);
    if (!previo) {
      mapa.set(c.campo, { ...c });
      continue;
    }
    const valorAntes = previo.valorAntes ?? previo.antes ?? "";
    const valorDespues = c.valorDespues ?? c.despues ?? "";
    const combinado = construirCambio(c.campo, etiquetaBase(c.label), c.tipo, valorAntes, valorDespues);
    const conHtml = c.tipo === "html" && previo.htmlAntes !== undefined && c.htmlDespues !== undefined;

    if (combinado) {
      mapa.set(c.campo, conHtml ? { ...combinado, htmlAntes: previo.htmlAntes, htmlDespues: c.htmlDespues } : combinado);
    } else if (conHtml && previo.htmlAntes !== c.htmlDespues) {
      // El texto volvió al original, pero el formato sigue distinto.
      mapa.set(c.campo, cambioDeFormato(c.campo, c.label, valorAntes, valorDespues, previo.htmlAntes, c.htmlDespues));
    } else {
      mapa.delete(c.campo);
    }
  }
  return Array.from(mapa.values());
};

/** Las URLs http(s) de un valor de tipo "image" / "images" (una por línea). */
const urlsDeImagenes = (valor) =>
  String(valor ?? "")
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url));

/**
 * Versión para enviar al frontend (sin los valores crudos).
 * En los cambios de imágenes se agregan las URLs de antes y después, para que el Admin vea las imágenes
 * (las agregadas y las quitadas) y no solo "3 imágenes (1 agregada)".
 */
export const cambiosParaCliente = (cambios = []) =>
  (Array.isArray(cambios) ? cambios : []).map(({ campo, label, tipo, antes, despues, valorAntes, valorDespues, soloFormato }) => ({
    campo,
    label,
    tipo,
    // Mismo texto con otro formato (negritas, listas...): el panel lo avisa en vez de mostrar dos textos iguales.
    ...(soloFormato ? { soloFormato: true } : {}),
    // En los textos se envía el valor completo (el guardado para mostrar está recortado) para poder marcar la diferencia exacta.
    antes: tipo === "images" || tipo === "image" ? antes : valorAntes ?? antes,
    despues: tipo === "images" || tipo === "image" ? despues : valorDespues ?? despues,
    ...(tipo === "images" || tipo === "image"
      ? { imagenes: { antes: urlsDeImagenes(valorAntes), despues: urlsDeImagenes(valorDespues) } }
      : {}),
  }));
