import { sanitizarUrlLectura } from "../../../../utils/sanitize.utils.js";
import { resolverUrlPublicaArchivo } from "../almacenamiento.js";
import { PRESET_KEYS_VALIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { parsearMetadatosDescripcion } from "../metadatos.js";

/** Espacios de tipo carrusel o banner. */
export function formatearCarrusel(def, filas = []) {
  if (!Array.isArray(filas) || filas.length === 0) {
    const imagenesDefault = def.defaults.imagenes.map((preset, idx) => ({
      id: `preset-${def.id}-${idx + 1}`,
      url: null,
      presetKey: preset.presetKey,
      fileName: preset.fileName,
      orden: idx + 1,
    }));

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
      estado: "PUBLICADO",
      activo: true,
      rejectionReason: null,
      altText: def.defaults.altText,
      textoSuperpuesto: def.defaults.textoSuperpuesto,
      textoBoton: def.defaults.textoBoton,
      enlaceUrl: def.defaults.enlaceUrl,
      updatedAt: null,
      imagenes: imagenesDefault,
    };
  }

  const filasOrdenadas = [...filas].sort(
    (a, b) => (a.orden || 0) - (b.orden || 0),
  );
  const primeraFila = filasOrdenadas[0];
  const metaPrincipal = parsearMetadatosDescripcion(primeraFila.descripcion);

  const textoSuperpuesto =
    typeof metaPrincipal.textoSuperpuesto === "string"
      ? metaPrincipal.textoSuperpuesto
      : primeraFila.titulo || def.defaults.textoSuperpuesto;

  const textoBoton =
    typeof metaPrincipal.textoBoton === "string"
      ? metaPrincipal.textoBoton
      : "";

  const enlaceSaneado = textoBoton
    ? normalizarRutaInternaPortal(
        sanitizarUrlLectura(primeraFila.enlaceUrl, "", true),
      )
    : "";

  const imagenes = filasOrdenadas.map((fila, idx) => {
    const metaFila = parsearMetadatosDescripcion(fila.descripcion);
    const urlPublica = resolverUrlPublicaArchivo(fila.archivo);
    const presetKey =
      !urlPublica &&
      metaFila.presetKey &&
      PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
        ? metaFila.presetKey
        : null;

    return {
      id: fila.id.toString(),
      archivoId: fila.archivoId ? fila.archivoId.toString() : null,
      url: urlPublica,
      presetKey,
      fileName:
        fila.archivo?.nombreOriginal ||
        metaFila.fileName ||
        `imagen_${idx + 1}.jpg`,
      orden: fila.orden || idx + 1,
    };
  });

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
    estado: primeraFila.estado || "PUBLICADO",
    activo: primeraFila.activo !== false,
    rejectionReason: primeraFila.rejectionReason || null,
    altText: primeraFila.altText || def.defaults.altText,
    textoSuperpuesto,
    textoBoton,
    enlaceUrl: enlaceSaneado || "",
    updatedAt: primeraFila.updatedAt
      ? primeraFila.updatedAt.toISOString()
      : null,
    imagenes,
  };
}
