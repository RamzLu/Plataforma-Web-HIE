
import { prisma } from "../../../../config/prisma.js";
import { supabase } from "../../../../config/supabase.js";
import { generarNombreUnico } from "../../../../utils/file.utils.js";
import { parsearArregloJson } from "../../../../utils/sanitize.utils.js";
import { eliminarArchivoAlmacenado, obtenerBucketSubida } from "../almacenamiento.js";
import { formatearEspacioDesdeFilas, resolverFuenteImagenItem } from "../formato.js";
import { crearError, limpiarTextoPlanoMultilinea, limpiarTextoSimple } from "../texto.js";

/**
 * Sección de desplegables fijos (por ejemplo, Información para Pacientes).
 * @param contexto { def, body, files, user, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId, espacioKey }
 */
export async function actualizarAcordeonFijo(contexto) {
  const { def, body, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId } = contexto;
    const slidesDescriptor = parsearArregloJson(
      body.slides,
      "desplegables de la sección",
    );

    if (
      !Array.isArray(slidesDescriptor) ||
      slidesDescriptor.length !== def.cantidadItemsFijos
    ) {
      throw crearError(
        `La sección "${def.nombre}" cuenta con exactamente ${def.cantidadItemsFijos} desplegables fijos; no se permite agregar ni eliminar ítems.`,
      );
    }

    const slidesResueltos = [];

    for (let i = 0; i < slidesDescriptor.length; i++) {
      const item = slidesDescriptor[i];
      if (!item || typeof item !== "object") {
        throw crearError(`Datos inválidos en el desplegable #${i + 1}.`);
      }

      const itemTitulo = limpiarTextoSimple(item.titulo, 120);
      if (!itemTitulo) {
        throw crearError(
          `El título del desplegable #${i + 1} es obligatorio.`,
        );
      }

      const itemTextoDesplegable = limpiarTextoPlanoMultilinea(
        item.textoDesplegable,
        600,
      );
      if (!itemTextoDesplegable) {
        throw crearError(
          `El texto informativo del desplegable #${i + 1} ("${itemTitulo}") es obligatorio.`,
        );
      }

      const itemAltText = limpiarTextoSimple(item.altText, 300);
      if (!itemAltText) {
        throw crearError(
          `El Texto Alternativo (ALT) de la imagen en el desplegable #${i + 1} ("${itemTitulo}") es obligatorio.`,
        );
      }

      const baseImg = resolverFuenteImagenItem(
        item,
        `el desplegable #${i + 1}`,
        filasPorId,
        uploadedFiles,
      );

      slidesResueltos.push({
        ...baseImg,
        titulo: itemTitulo,
        textoDesplegable: itemTextoDesplegable,
        altText: itemAltText,
      });
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
          "cg_pacientes",
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
            "[Storage] Error al subir imagen de Pacientes:",
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

      const ahora = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.contenido_grafico.deleteMany({
          where: { ubicacionId: ubicacionDb.id },
        });

        for (let idx = 0; idx < slidesResueltos.length; idx++) {
          const s = slidesResueltos[idx];
          const metaJson = JSON.stringify({
            textoDesplegable: s.textoDesplegable,
            presetKey: s.presetKey || null,
            fileName: s.fileName || null,
          });

          await tx.contenido_grafico.create({
            data: {
              titulo: s.titulo.slice(0, 200),
              descripcion: metaJson,
              altText: s.altText,
              archivoId: s.archivoId || null,
              enlaceUrl: null,
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
          descripcion: `Actualizó "${def.nombre}" (${slidesResueltos.length} desplegables)`,
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
