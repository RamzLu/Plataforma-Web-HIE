
import { prisma } from "../../../../config/prisma.js";
import { supabase } from "../../../../config/supabase.js";
import { generarNombreUnico } from "../../../../utils/file.utils.js";
import { parsearArregloJson, validarUrlHttp } from "../../../../utils/sanitize.utils.js";
import { eliminarArchivoAlmacenado, obtenerBucketSubida } from "../almacenamiento.js";
import { RUTAS_INTERNAS_PERMITIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { formatearEspacioDesdeFilas, resolverFuenteImagenItem } from "../formato.js";
import { crearError, limpiarTextoPlanoMultilinea, limpiarTextoSimple } from "../texto.js";

/**
 * Sección Residencias: tarjeta destacada con 1 imagen y botón.
 * @param contexto { def, body, files, user, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId, espacioKey }
 */
export async function actualizarTarjetaResidencias(contexto) {
  const { def, body, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId } = contexto;
    const slidesDescriptor = parsearArregloJson(
      body.slides,
      "imagen de la tarjeta de Residencias",
    );

    if (!Array.isArray(slidesDescriptor) || slidesDescriptor.length !== 1) {
      throw crearError(
        `La sección "${def.nombre}" requiere exactamente 1 imagen asociada.`,
      );
    }

    const item = slidesDescriptor[0];
    if (!item || typeof item !== "object") {
      throw crearError("Datos inválidos de la imagen de Residencias.");
    }

    const baseImg = resolverFuenteImagenItem(
      item,
      "la tarjeta de Residencias",
      filasPorId,
      uploadedFiles,
    );

    const titulo = limpiarTextoSimple(body.titulo || item.titulo, 150);
    if (!titulo) {
      throw crearError("El título de la sección es obligatorio.");
    }

    const parrafoDescripcion = limpiarTextoPlanoMultilinea(
      body.parrafoDescripcion || item.parrafoDescripcion,
      600,
    );
    if (!parrafoDescripcion) {
      throw crearError(
        "El párrafo descriptivo de la sección es obligatorio.",
      );
    }

    const textoBoton = limpiarTextoSimple(
      body.textoBoton || item.textoBoton,
      80,
    );
    if (!textoBoton) {
      throw crearError("El texto del botón es obligatorio.");
    }

    const rawEnlace = normalizarRutaInternaPortal(
      body.enlaceUrl || item.enlaceUrl,
    );
    if (!rawEnlace) {
      throw crearError(
        "Debe seleccionar la sección del portal a la que redirige el botón.",
      );
    }
    if (!RUTAS_INTERNAS_PERMITIDAS.has(rawEnlace)) {
      throw crearError(
        "La redirección seleccionada no pertenece a una sección válida del portal.",
      );
    }

    const enlaceValidado = validarUrlHttp(
      rawEnlace,
      "redirección del botón",
      true,
    );

    const altText = limpiarTextoSimple(body.altText || item.altText, 300);
    if (!altText) {
      throw crearError("El Texto Alternativo (ALT) es obligatorio.");
    }

    const slideResuelto = {
      ...baseImg,
      titulo,
      parrafoDescripcion,
      textoBoton,
      enlaceUrl: enlaceValidado,
      altText,
    };

    const archivosNuevosCreados = [];
    let bucketSubida = null;

    try {
      if (slideResuelto.kind === "new") {
        bucketSubida = await obtenerBucketSubida();
        const file = slideResuelto.file;
        const { nombreUnico, extension } = generarNombreUnico(
          file.originalname,
          "cg_residencias",
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
            "[Storage] Error al subir imagen de Residencias:",
            storageError.message,
          );
          throw crearError(
            "No se pudo almacenar la imagen en el servidor.",
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
        slideResuelto.archivoId = archivoDb.id;
        slideResuelto.fileName = file.originalname;
      }

      const ahora = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.contenido_grafico.deleteMany({
          where: { ubicacionId: ubicacionDb.id },
        });

        const metaJson = JSON.stringify({
          parrafoDescripcion: slideResuelto.parrafoDescripcion,
          textoBoton: slideResuelto.textoBoton,
          presetKey: slideResuelto.presetKey || null,
          fileName: slideResuelto.fileName || null,
        });

        await tx.contenido_grafico.create({
          data: {
            titulo: slideResuelto.titulo.slice(0, 200),
            descripcion: metaJson,
            altText: slideResuelto.altText,
            archivoId: slideResuelto.archivoId || null,
            enlaceUrl: slideResuelto.enlaceUrl,
            orden: 1,
            activo: true,
            tipoId: tipoDb.id,
            ubicacionId: ubicacionDb.id,
            estado: "PUBLICADO",
            createdBy: slideResuelto.createdByOriginal || usuarioLocal.id,
            updatedBy: usuarioLocal.id,
            rejectionReason: null,
            pagina: def.page,
            updatedAt: ahora,
          },
        });
      });
    } catch (err) {
      for (const arch of archivosNuevosCreados) {
        await eliminarArchivoAlmacenado(arch);
      }
      throw err;
    }

    if (slideResuelto.archivoId) {
      for (const filaAntigua of filasExistentes) {
        if (
          filaAntigua.archivo &&
          filaAntigua.archivo.id.toString() !==
            slideResuelto.archivoId.toString()
        ) {
          await eliminarArchivoAlmacenado(filaAntigua.archivo);
        }
      }
    }

    await prisma.auditoria
      .create({
        data: {
          usuarioId: usuarioLocal.id,
          accion: "MODIFICAR",
          entidad: "contenido_grafico",
          entidadId: def.id,
          descripcion: `Actualizó "${def.nombre}" en Residencias`,
        },
      })
      .catch(() => {});

    const filasActualizadas = await prisma.contenido_grafico.findMany({
      where: { ubicacionId: ubicacionDb.id },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { archivo: true },
    });

    return {
      message: `Sección "${def.nombre}" actualizada correctamente.`,
      espacio: formatearEspacioDesdeFilas(def, filasActualizadas),
    };
}
