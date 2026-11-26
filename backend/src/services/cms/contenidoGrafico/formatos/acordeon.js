import { resolverUrlPublicaArchivo } from "../almacenamiento.js";
import { PRESET_KEYS_VALIDAS } from "../definiciones.js";
import { parsearMetadatosDescripcion } from "../metadatos.js";

/** Sección de desplegables fijos (ej. Información para Pacientes con 5 ítems fijos). */
export function formatearAcordeonFijo(def, filas = []) {
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

  const imagenesAcordeon = def.defaults.imagenes.map((presetItem, idx) => {
    const ordenEsperado = idx + 1;
    const fila = filaPorOrden.get(ordenEsperado) || null;

    if (!fila) {
      return {
        id: `preset-${def.id}-${ordenEsperado}`,
        archivoId: null,
        url: null,
        presetKey: presetItem.presetKey,
        fileName: presetItem.fileName,
        orden: ordenEsperado,
        titulo: presetItem.titulo,
        textoDesplegable: presetItem.textoDesplegable,
        altText: presetItem.altText,
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
      titulo: fila.titulo || presetItem.titulo,
      textoDesplegable:
        typeof metaFila.textoDesplegable === "string" &&
        metaFila.textoDesplegable.trim()
          ? metaFila.textoDesplegable
          : presetItem.textoDesplegable,
      altText: fila.altText || presetItem.altText,
    };
  });

  const primeraFila = filasOrdenadas[0] || null;

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
    esAcordeonFijo: true,
    cantidadItemsFijos: def.cantidadItemsFijos,
    estado: primeraFila?.estado || "PUBLICADO",
    activo: primeraFila ? primeraFila.activo !== false : true,
    rejectionReason: primeraFila?.rejectionReason || null,
    altText: imagenesAcordeon[0]?.altText || def.defaults.altText,
    textoSuperpuesto: "",
    textoBoton: "",
    enlaceUrl: "",
    updatedAt: primeraFila?.updatedAt
      ? primeraFila.updatedAt.toISOString()
      : null,
    imagenes: imagenesAcordeon,
  };
}
