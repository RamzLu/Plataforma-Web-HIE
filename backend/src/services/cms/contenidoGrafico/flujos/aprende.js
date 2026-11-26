
import { prisma } from "../../../../config/prisma.js";
import { supabase } from "../../../../config/supabase.js";
import { generarNombreUnico } from "../../../../utils/file.utils.js";
import { parsearArregloJson, validarUrlHttp } from "../../../../utils/sanitize.utils.js";
import { eliminarArchivoAlmacenado, obtenerBucketSubida } from "../almacenamiento.js";
import { COLORES_TARJETA_APRENDE, RUTAS_INTERNAS_PERMITIDAS, normalizarRutaInternaPortal } from "../definiciones.js";
import { formatearEspacioDesdeFilas, resolverFuenteImagenItem } from "../formato.js";
import { crearError, limpiarTextoPlanoMultilinea, limpiarTextoSimple } from "../texto.js";

/**
 * Sección "Aprendé con el Evita": 1 bloque principal + 3 tarjetas fijas.
 * @param contexto { def, body, files, user, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId, espacioKey }
 */
export async function actualizarSeccionAprende(contexto) {
  const { def, body, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId } = contexto;
    const slidesDescriptor = parsearArregloJson(
      body.slides,
      "elementos de Aprendé con el Evita",
    );

    if (
      !Array.isArray(slidesDescriptor) ||
      slidesDescriptor.length !== def.cantidadItemsFijos
    ) {
      throw crearError(
        `La sección "${def.nombre}" requiere exactamente su imagen principal y sus 3 tarjetas fijas.`,
      );
    }

    const slidesResueltos = [];

    for (let i = 0; i < slidesDescriptor.length; i++) {
      const item = slidesDescriptor[i];
      const esPrincipal = i === 0;
      const nombreElemento = esPrincipal
        ? "la imagen principal izquierda"
        : `la tarjeta #${i}`;

      if (!item || typeof item !== "object") {
        throw crearError(`Datos inválidos en ${nombreElemento}.`);
      }

      const baseImg = resolverFuenteImagenItem(
        item,
        nombreElemento,
        filasPorId,
        uploadedFiles,
      );

      const itemAltText = limpiarTextoSimple(item.altText, 300);
      if (!itemAltText) {
        throw crearError(
          `El Texto Alternativo (ALT) de ${nombreElemento} es obligatorio.`,
        );
      }

      if (esPrincipal) {
        const subtituloEncabezado = limpiarTextoSimple(
          item.subtituloEncabezado,
          100,
        );
        if (!subtituloEncabezado) {
          throw crearError(
            "El subtítulo superior del encabezado (ej. EDUCACIÓN PARA LA SALUD) es obligatorio.",
          );
        }

        const tituloEncabezado = limpiarTextoSimple(item.titulo, 150);
        if (!tituloEncabezado) {
          throw crearError(
            "El título principal de la sección (ej. APRENDÉ CON EL EVITA) es obligatorio.",
          );
        }

        const parrafoDescripcion = limpiarTextoPlanoMultilinea(
          item.parrafoDescripcion,
          650,
        );
        if (!parrafoDescripcion) {
          throw crearError(
            "El párrafo descriptivo de Aprendé con el Evita es obligatorio.",
          );
        }

        slidesResueltos.push({
          ...baseImg,
          rolItem: "principal",
          subtituloEncabezado,
          titulo: tituloEncabezado,
          parrafoDescripcion,
          altText: itemAltText,
          enlaceUrl: null,
        });
      } else {
        const etiquetaSuperior = limpiarTextoSimple(
          item.etiquetaSuperior,
          60,
        );
        if (!etiquetaSuperior) {
          throw crearError(
            `La etiqueta superior de la tarjeta #${i} (ej. TIP DE SALUD) es obligatoria.`,
          );
        }

        const tituloTarjeta = limpiarTextoSimple(item.titulo, 120);
        if (!tituloTarjeta) {
          throw crearError(`El título de la tarjeta #${i} es obligatorio.`);
        }

        const rawEnlace = normalizarRutaInternaPortal(item.enlaceUrl);
        if (!rawEnlace) {
          throw crearError(
            `Seleccione a qué sección del portal redirige "MÁS INFORMACIÓN" en la tarjeta #${i} ("${tituloTarjeta}").`,
          );
        }
        if (!RUTAS_INTERNAS_PERMITIDAS.has(rawEnlace)) {
          throw crearError(
            `La redirección seleccionada en la tarjeta #${i} no pertenece a una sección válida del portal.`,
          );
        }

        const enlaceValidado = validarUrlHttp(
          rawEnlace,
          `redirección de tarjeta #${i}`,
          true,
        );

        slidesResueltos.push({
          ...baseImg,
          rolItem: "tarjeta",
          etiquetaSuperior,
          badgeColor: COLORES_TARJETA_APRENDE[i - 1] || "blue",
          titulo: tituloTarjeta,
          altText: itemAltText,
          enlaceUrl: enlaceValidado,
        });
      }
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
          "cg_aprende",
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
            "[Storage] Error al subir imagen de Aprendé con el Evita:",
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
          const metaJson =
            s.rolItem === "principal"
              ? JSON.stringify({
                  rolItem: "principal",
                  subtituloEncabezado: s.subtituloEncabezado,
                  parrafoDescripcion: s.parrafoDescripcion,
                  presetKey: s.presetKey || null,
                  fileName: s.fileName || null,
                })
              : JSON.stringify({
                  rolItem: "tarjeta",
                  etiquetaSuperior: s.etiquetaSuperior,
                  badgeColor: s.badgeColor,
                  presetKey: s.presetKey || null,
                  fileName: s.fileName || null,
                });

          await tx.contenido_grafico.create({
            data: {
              titulo: s.titulo.slice(0, 200),
              descripcion: metaJson,
              altText: s.altText,
              archivoId: s.archivoId || null,
              enlaceUrl: s.enlaceUrl || null,
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
          descripcion: `Actualizó "${def.nombre}" (encabezado, imagen principal y 3 tarjetas)`,
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
