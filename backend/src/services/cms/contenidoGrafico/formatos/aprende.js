import { sanitizarUrlLectura } from "../../../../utils/sanitize.utils.js";
import { resolverUrlPublicaArchivo } from "../almacenamiento.js";
import { COLORES_TARJETA_APRENDE, PRESET_KEYS_VALIDAS, RUTAS_INTERNAS_PERMITIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { parsearMetadatosDescripcion } from "../metadatos.js";

/** Sección "Aprendé con el Evita" (1 bloque principal + 3 tarjetas fijas = 4 elementos). */
export function formatearSeccionAprende(def, filas = []) {
  const filasOrdenadas = Array.isArray(filas)
    ? [...filas].sort((a, b) => (a.orden || 0) - (b.orden || 0))
    : [];

  const filaPorOrden = new Map();
  filasOrdenadas.forEach((f, i) => {
    const ord = Number.isInteger(f.orden) && f.orden >= 1 ? f.orden : i + 1;
    if (!filaPorOrden.has(ord)) {
      filaPorOrden.set(ord, f);
    }
  });

  const itemsAprende = def.defaults.imagenes.map((presetItem, idx) => {
    const ordenEsperado = idx + 1;
    const esPrincipal = idx === 0;
    const fila = filaPorOrden.get(ordenEsperado) || null;

    if (!fila) {
      return {
        id: `preset-${def.id}-${ordenEsperado}`,
        archivoId: null,
        url: null,
        presetKey: presetItem.presetKey,
        fileName: presetItem.fileName,
        orden: ordenEsperado,
        rolItem: esPrincipal ? "principal" : "tarjeta",
        subtituloEncabezado: esPrincipal
          ? presetItem.subtituloEncabezado
          : undefined,
        parrafoDescripcion: esPrincipal
          ? presetItem.parrafoDescripcion
          : undefined,
        etiquetaSuperior: !esPrincipal
          ? presetItem.etiquetaSuperior
          : undefined,
        badgeColor: !esPrincipal
          ? COLORES_TARJETA_APRENDE[idx - 1] || "blue"
          : undefined,
        titulo: presetItem.titulo,
        altText: presetItem.altText,
        enlaceUrl: presetItem.enlaceUrl || "",
      };
    }

    const metaFila = parsearMetadatosDescripcion(fila.descripcion);
    const urlPublica = resolverUrlPublicaArchivo(fila.archivo);
    const presetKey =
      !urlPublica &&
      metaFila.presetKey &&
      PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
        ? metaFila.presetKey
        : !urlPublica
          ? presetItem.presetKey
          : null;

    if (esPrincipal) {
      return {
        id: fila.id.toString(),
        archivoId: fila.archivoId ? fila.archivoId.toString() : null,
        url: urlPublica,
        presetKey,
        fileName:
          fila.archivo?.nombreOriginal ||
          metaFila.fileName ||
          presetItem.fileName,
        orden: ordenEsperado,
        rolItem: "principal",
        subtituloEncabezado:
          typeof metaFila.subtituloEncabezado === "string" &&
          metaFila.subtituloEncabezado.trim()
            ? metaFila.subtituloEncabezado
            : presetItem.subtituloEncabezado,
        titulo: fila.titulo || presetItem.titulo,
        parrafoDescripcion:
          typeof metaFila.parrafoDescripcion === "string" &&
          metaFila.parrafoDescripcion.trim()
            ? metaFila.parrafoDescripcion
            : presetItem.parrafoDescripcion,
        altText: fila.altText || presetItem.altText,
        enlaceUrl: "",
      };
    }

    const enlaceSaneado = normalizarRutaInternaPortal(
      sanitizarUrlLectura(fila.enlaceUrl, presetItem.enlaceUrl, true),
    );

    return {
      id: fila.id.toString(),
      archivoId: fila.archivoId ? fila.archivoId.toString() : null,
      url: urlPublica,
      presetKey,
      fileName:
        fila.archivo?.nombreOriginal ||
        metaFila.fileName ||
        presetItem.fileName,
      orden: ordenEsperado,
      rolItem: "tarjeta",
      etiquetaSuperior:
        typeof metaFila.etiquetaSuperior === "string" &&
        metaFila.etiquetaSuperior.trim()
          ? metaFila.etiquetaSuperior
          : presetItem.etiquetaSuperior,
      badgeColor: COLORES_TARJETA_APRENDE[idx - 1] || "blue",
      titulo: fila.titulo || presetItem.titulo,
      altText: fila.altText || presetItem.altText,
      enlaceUrl:
        enlaceSaneado && RUTAS_INTERNAS_PERMITIDAS.has(enlaceSaneado)
          ? enlaceSaneado
          : presetItem.enlaceUrl,
    };
  });

  const primeraFila = filasOrdenadas[0] || null;
  const itemPrincipal = itemsAprende[0];

  return {
    id: def.id,
    orden: def.orden,
    nombre: def.nombre,
    descripcion: def.descripcion,
    tipo: def.tipo,
    page: def.page,
    ubicacion: def.tipo,
    dimensiones: def.dimensiones,
    aspectRatio: def.aspectRatio,
    esSeccionAprende: true,
    cantidadItemsFijos: def.cantidadItemsFijos,
    estado: primeraFila?.estado || "PUBLICADO",
    activo: primeraFila ? primeraFila.activo !== false : true,
    rejectionReason: primeraFila?.rejectionReason || null,
    altText: itemPrincipal?.altText || def.defaults.altText,
    subtituloEncabezado:
      itemPrincipal?.subtituloEncabezado || def.defaults.subtituloEncabezado,
    tituloEncabezado: itemPrincipal?.titulo || def.defaults.tituloEncabezado,
    parrafoDescripcion:
      itemPrincipal?.parrafoDescripcion || def.defaults.parrafoDescripcion,
    textoSuperpuesto: "",
    textoBoton: "",
    enlaceUrl: "",
    updatedAt: primeraFila?.updatedAt
      ? primeraFila.updatedAt.toISOString()
      : null,
    imagenes: itemsAprende,
  };
}
