
import { prisma } from "../../../../config/prisma.js";
import { supabase } from "../../../../config/supabase.js";
import { generarNombreUnico } from "../../../../utils/file.utils.js";
import { parsearArregloJson, validarUrlHttp } from "../../../../utils/sanitize.utils.js";
import { eliminarArchivoAlmacenado, obtenerBucketSubida } from "../almacenamiento.js";
import { RUTAS_INTERNAS_PERMITIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { formatearEspacioDesdeFilas, resolverFuenteImagenItem } from "../formato.js";
import { crearError, limpiarTextoPlanoMultilinea, limpiarTextoSimple } from "../texto.js";

/**
 * Carrusel principal y banners.
 * @param contexto { def, body, files, user, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId, espacioKey }
 */
export async function actualizarCarrusel(contexto) {
  const { def, body, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId } = contexto;
  const altText = limpiarTextoSimple(body.altText, 300);
  if (!altText) {
    throw crearError(
      "El Texto Alternativo (ALT) es obligatorio para describir la sección a personas con discapacidad visual.",
    );
  }

  const esCarruselInicio = def.id === "espacio-banner-inicio";
  const textoSuperpuesto = limpiarTextoPlanoMultilinea(
    body.textoSuperpuesto,
    300,
  );

  if (esCarruselInicio && !textoSuperpuesto) {
    throw crearError("El texto superpuesto del carrusel es obligatorio.");
  }

  const textoBoton = limpiarTextoSimple(body.textoBoton, 80);
  let enlaceValidado = null;

  if (textoBoton) {
    const rawUrl = normalizarRutaInternaPortal(body.enlaceUrl);
    if (!rawUrl) {
      throw crearError(
        "Debe seleccionar obligatoriamente a qué sección del portal redirecciona el botón.",
      );
    }

    if (esCarruselInicio && !RUTAS_INTERNAS_PERMITIDAS.has(rawUrl)) {
      throw crearError(
        "La sección de redirección seleccionada no pertenece a una ruta válida del portal.",
      );
    }

    enlaceValidado = validarUrlHttp(rawUrl, "redirección del botón", true);
  }

  const slidesDescriptor = parsearArregloJson(
    body.slides,
    "imágenes del carrusel",
  );
  if (!Array.isArray(slidesDescriptor) || slidesDescriptor.length === 0) {
    throw crearError("El espacio debe contar con al menos una imagen.");
  }
  if (slidesDescriptor.length > 15) {
    throw crearError("Se permite un máximo de 15 imágenes en el carrusel.");
  }

  const slidesResueltos = [];
  for (let i = 0; i < slidesDescriptor.length; i++) {
    const item = slidesDescriptor[i];
    if (!item || typeof item !== "object") {
      throw crearError(
        `Descriptor de imagen inválido en la posición #${i + 1}.`,
      );
    }

    const baseImg = resolverFuenteImagenItem(
      item,
      `la posición #${i + 1}`,
      filasPorId,
      uploadedFiles,
    );

    slidesResueltos.push(baseImg);
  }

  const archivosNuevosCreados = [];
  let bucketSubida = null;

  try {
    for (const slide of slidesResueltos) {
      if (slide.kind !== "new") continue;
      if (!bucketSubida) {
        bucketSubida = await obtenerBucketSubida();
      }

      const file = slide.file;
      const { nombreUnico, extension } = generarNombreUnico(
        file.originalname,
        "cg_inicio",
        file.mimetype,
      );

      const { error: storageError } = await supabase.storage
        .from(bucketSubida)
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error(
          "[Storage] Error al subir imagen de contenido gráfico:",
          storageError.message,
        );
        throw crearError(
          "No se pudo almacenar una de las imágenes en el servidor.",
          500,
        );
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `${bucketSubida}/${nombreUnico}`,
          extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });

      archivosNuevosCreados.push(archivoDb);
      slide.archivoId = archivoDb.id;
      slide.fileName = file.originalname;
    }

    const tituloColumna = (textoSuperpuesto || def.nombre).slice(0, 200);
    const ahora = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.contenido_grafico.deleteMany({
        where: { ubicacionId: ubicacionDb.id },
      });

      for (let idx = 0; idx < slidesResueltos.length; idx++) {
        const s = slidesResueltos[idx];
        const metaJson = JSON.stringify({
          textoSuperpuesto,
          textoBoton,
          presetKey: s.presetKey || null,
          fileName: s.fileName || null,
        });

        await tx.contenido_grafico.create({
          data: {
            titulo: tituloColumna,
            descripcion: metaJson,
            altText,
            archivoId: s.archivoId || null,
            enlaceUrl: enlaceValidado,
            orden: idx + 1,
            activo: true,
            tipoId: tipoDb.id,
            ubicacionId: ubicacionDb.id,
            estado: "PUBLICADO",
            createdBy: s.createdByOriginal || usuarioLocal.id,
            updatedBy: usuarioLocal.id,
            rejectionReason: null,
            pagina: def.page,
            updatedAt: ahora,
          },
        });
      }
    });
  } catch (err) {
    for (const arch of archivosNuevosCreados) {
      await eliminarArchivoAlmacenado(arch);
    }
    throw err;
  }

  const archivosConservadosIds = new Set(
    slidesResueltos
      .filter((s) => s.archivoId)
      .map((s) => s.archivoId.toString()),
  );

  for (const filaAntigua of filasExistentes) {
    if (
      filaAntigua.archivo &&
      !archivosConservadosIds.has(filaAntigua.archivo.id.toString())
    ) {
      await eliminarArchivoAlmacenado(filaAntigua.archivo);
    }
  }

  await prisma.auditoria
    .create({
      data: {
        usuarioId: usuarioLocal.id,
        accion: "MODIFICAR",
        entidad: "contenido_grafico",
        entidadId: def.id,
        descripcion: `Actualizó "${def.nombre}" (${slidesResueltos.length} imágenes)`,
      },
    })
    .catch(() => {});

  const filasActualizadas = await prisma.contenido_grafico.findMany({
    where: { ubicacionId: ubicacionDb.id },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    include: { archivo: true },
  });

  return {
    message: `Espacio "${def.nombre}" actualizado correctamente.`,
    espacio: formatearEspacioDesdeFilas(def, filasActualizadas),
  };
}
