// Diferencias entre dos textos, palabra por palabra, para mostrarle al Admin qué se cambió exactamente.

const CONTEXTO = 10; // palabras sin cambios que se muestran a cada lado de una diferencia
const LIMITE_CELDAS = 3_000_000; // tamaño máximo de la tabla de comparación; si se pasa, el bloque se marca entero

const dividir = (texto) => String(texto ?? "").match(/\s+|\S+/g) || [];

/** Compara dos listas de piezas y devuelve tramos { tipo: "igual" | "quitado" | "agregado", piezas }. */
const compararPiezas = (a, b) => {
  let inicio = 0;
  while (inicio < a.length && inicio < b.length && a[inicio] === b[inicio]) inicio++;
  let finA = a.length;
  let finB = b.length;
  while (finA > inicio && finB > inicio && a[finA - 1] === b[finB - 1]) {
    finA--;
    finB--;
  }

  const medioA = a.slice(inicio, finA);
  const medioB = b.slice(inicio, finB);
  const tramos = [];
  const agregar = (tipo, piezas) => {
    if (piezas.length === 0) return;
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.tipo === tipo) ultimo.piezas.push(...piezas);
    else tramos.push({ tipo, piezas: [...piezas] });
  };

  agregar("igual", a.slice(0, inicio));

  if (medioA.length * medioB.length > LIMITE_CELDAS) {
    agregar("quitado", medioA);
    agregar("agregado", medioB);
  } else {
    const n = medioA.length;
    const m = medioB.length;
    const ancho = m + 1;
    const tabla = new Uint32Array((n + 1) * ancho);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        tabla[i * ancho + j] =
          medioA[i] === medioB[j]
            ? tabla[(i + 1) * ancho + j + 1] + 1
            : Math.max(tabla[(i + 1) * ancho + j], tabla[i * ancho + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (medioA[i] === medioB[j]) {
        agregar("igual", [medioA[i]]);
        i++;
        j++;
      } else if (tabla[(i + 1) * ancho + j] >= tabla[i * ancho + j + 1]) {
        agregar("quitado", [medioA[i]]);
        i++;
      } else {
        agregar("agregado", [medioB[j]]);
        j++;
      }
    }
    agregar("quitado", medioA.slice(i));
    agregar("agregado", medioB.slice(j));
  }

  agregar("igual", a.slice(finA));
  return tramos;
};

const contarPalabras = (piezas) => piezas.filter((p) => /\S/.test(p)).length;

/** Las primeras / últimas `cantidad` palabras de una lista de piezas (conservando los espacios). */
const extremo = (piezas, cantidad, desdeElFinal) => {
  const orden = desdeElFinal ? [...piezas].reverse() : piezas;
  const salida = [];
  let palabras = 0;
  for (const pieza of orden) {
    if (/\S/.test(pieza)) {
      if (palabras === cantidad) break;
      palabras++;
    }
    salida.push(pieza);
  }
  return desdeElFinal ? salida.reverse() : salida;
};

/**
 * Segmentos para mostrar de un lado de la comparación.
 * lado "antes": muestra lo igual y lo quitado; lado "despues": lo igual y lo agregado.
 * Los tramos largos sin cambios se acortan con "…" para que las diferencias queden a la vista.
 * Devuelve [{ texto, marcado, omitido }]; si no hay diferencias, null.
 */
export const segmentosDeDiferencia = (antes, despues, lado) => {
  const tramos = compararPiezas(dividir(antes), dividir(despues));
  if (!tramos.some((t) => t.tipo !== "igual")) return null;

  const propio = lado === "antes" ? "quitado" : "agregado";
  const segmentos = [];
  tramos.forEach((tramo, indice) => {
    if (tramo.tipo === propio) {
      segmentos.push({ texto: tramo.piezas.join(""), marcado: true });
    } else if (tramo.tipo === "igual") {
      const esPrimero = indice === 0;
      const esUltimo = indice === tramos.length - 1;
      const palabras = contarPalabras(tramo.piezas);
      const margen = esPrimero || esUltimo ? CONTEXTO : CONTEXTO * 2;
      if (palabras <= margen) {
        segmentos.push({ texto: tramo.piezas.join("") });
        return;
      }
      if (!esPrimero) segmentos.push({ texto: extremo(tramo.piezas, CONTEXTO, false).join("") });
      segmentos.push({ texto: " … ", omitido: true });
      if (!esUltimo) segmentos.push({ texto: extremo(tramo.piezas, CONTEXTO, true).join("") });
    }
  });
  return segmentos;
};
