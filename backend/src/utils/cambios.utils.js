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

export const calcularCambios = (antes = {}, despues = {}, campos = []) => {
  const cambios = [];
  for (const { key, label, tipo = "text" } of campos) {
    const cambio = construirCambio(
      key,
      label,
      tipo,
      normalizarValorCambio(antes?.[key], tipo),
      normalizarValorCambio(despues?.[key], tipo)
    );
    if (cambio) cambios.push(cambio);
  }
  return cambios;
};

/**
 * Combina los cambios acumulados de una solicitud aún pendiente con los de una
 * nueva edición: conserva el valor "antes" original y toma el "después" más reciente.
 * Si un campo vuelve a su valor original, se descarta.
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
    const combinado = construirCambio(
      c.campo,
      c.label,
      c.tipo,
      previo.valorAntes ?? previo.antes ?? "",
      c.valorDespues ?? c.despues ?? ""
    );
    if (combinado) mapa.set(c.campo, combinado);
    else mapa.delete(c.campo);
  }
  return Array.from(mapa.values());
};

/**
 * Versión pública (sin valores crudos) para enviar al frontend.
 */
export const cambiosParaCliente = (cambios = []) =>
  (Array.isArray(cambios) ? cambios : []).map(({ campo, label, tipo, antes, despues }) => ({
    campo,
    label,
    tipo,
    antes,
    despues,
  }));
