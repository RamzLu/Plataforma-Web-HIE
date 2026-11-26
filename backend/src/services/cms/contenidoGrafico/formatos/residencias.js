import { sanitizarUrlLectura } from "../../../../utils/sanitize.utils.js";
import { resolverUrlPublicaArchivo } from "../almacenamiento.js";
import { PRESET_KEYS_VALIDAS, RUTAS_INTERNAS_PERMITIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { parsearMetadatosDescripcion } from "../metadatos.js";

/** Sección destacada de Residencias (1 tarjeta informativa con imagen y botón de redirección). */
export function formatearTarjetaResidencias(def, filas = []) {
  const filasOrdenadas = Array.isArray(filas)
    ? [...filas].sort((a, b) => (a.orden || 0) - (b.orden || 0))
    : [];
  const primeraFila = filasOrdenadas[0] || null;

  if (!primeraFila) {
    const imgDefault = def.defaults.imagenes[0];
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
      esTarjetaResidencias: true,
      cantidadItemsFijos: 1,
      estado: "PUBLICADO",
      activo: true,
      rejectionReason: null,
      altText: def.defaults.altText,
      titulo: def.defaults.titulo,
      parrafoDescripcion: def.defaults.parrafoDescripcion,
      textoBoton: def.defaults.textoBoton,
      enlaceUrl: def.defaults.enlaceUrl,
      textoSuperpuesto: "",
      updatedAt: null,
      imagenes: [
        {
          id: `preset-${def.id}-1`,
          archivoId: null,
          url: null,
          presetKey: imgDefault.presetKey,
          fileName: imgDefault.fileName,
          orden: 1,
          titulo: imgDefault.titulo,
          parrafoDescripcion: imgDefault.parrafoDescripcion,
          textoBoton: imgDefault.textoBoton,
          enlaceUrl: imgDefault.enlaceUrl,
          altText: imgDefault.altText,
        },
      ],
    };
  }

  const metaFila = parsearMetadatosDescripcion(primeraFila.descripcion);
  const urlPublica = resolverUrlPublicaArchivo(primeraFila.archivo);
  const presetKey =
    !urlPublica &&
    metaFila.presetKey &&
    PRESET_KEYS_VALIDAS.has(metaFila.presetKey)
      ? metaFila.presetKey
      : !urlPublica
        ? def.defaults.imagenes[0].presetKey
        : null;

  const titulo = primeraFila.titulo || def.defaults.titulo;
  const parrafoDescripcion =
    typeof metaFila.parrafoDescripcion === "string" &&
    metaFila.parrafoDescripcion.trim()
      ? metaFila.parrafoDescripcion
      : def.defaults.parrafoDescripcion;
  const textoBoton =
    typeof metaFila.textoBoton === "string" && metaFila.textoBoton.trim()
      ? metaFila.textoBoton
      : def.defaults.textoBoton;
  const enlaceSaneado = normalizarRutaInternaPortal(
    sanitizarUrlLectura(primeraFila.enlaceUrl, def.defaults.enlaceUrl, true),
  );
  const enlaceUrl =
    enlaceSaneado && RUTAS_INTERNAS_PERMITIDAS.has(enlaceSaneado)
      ? enlaceSaneado
      : def.defaults.enlaceUrl;
  const altText = primeraFila.altText || def.defaults.altText;

  const itemImagen = {
    id: primeraFila.id.toString(),
    archivoId: primeraFila.archivoId
      ? primeraFila.archivoId.toString()
      : null,
    url: urlPublica,
    presetKey,
    fileName:
      primeraFila.archivo?.nombreOriginal ||
      metaFila.fileName ||
      def.defaults.imagenes[0].fileName,
    orden: 1,
    titulo,
    parrafoDescripcion,
    textoBoton,
    enlaceUrl,
    altText,
  };

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
    esTarjetaResidencias: true,
    cantidadItemsFijos: 1,
    estado: primeraFila.estado || "PUBLICADO",
    activo: primeraFila.activo !== false,
    rejectionReason: primeraFila.rejectionReason || null,
    altText,
    titulo,
    parrafoDescripcion,
    textoBoton,
    enlaceUrl,
    textoSuperpuesto: "",
    updatedAt: primeraFila.updatedAt
      ? primeraFila.updatedAt.toISOString()
      : null,
    imagenes: [itemImagen],
  };
}
