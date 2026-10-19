import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd3Vwd21ieWd0eWlsdWV6emxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDM2MDUsImV4cCI6MjEwMjcxOTYwNX0.ytya9DiAojD-DbQ0kDmr_nojF4GUp7XaFLsUIRH2sWE"
);

const formatBytes = (bytes) => {
  const n = Number(bytes || 0);
  if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n > 0) return `${(n / 1024).toFixed(0)} KB`;
  return "";
};

class CmsResidenciaService {
  /**
   * Obtener todas las residencias con su archivo y datos formateados
   */
  async obtenerResidencias() {
    const residencias = await prisma.residencia.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        archivo: true,
      },
    });

    return residencias.map((res) => this._formatResidencia(res));
  }

  /**
   * Crear una nueva residencia (soporta Banner y Documento adjunto)
   */
  async crearResidencia(data, files) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error("El nombre de la residencia es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    const bannerFile = filesArray.find((f) => f.fieldname === "banner" || f.fieldname === "imagen");
    const docFile = filesArray.find((f) => f.fieldname === "archivo" || f.fieldname === "documento");

    let imagenId = null;

    // 1. Procesar Imagen de Banner si existe
    if (bannerFile) {
      const { nombreUnico, extension } = generarNombreUnico(bannerFile.originalname, "residencia_banner");
      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, bannerFile.buffer, {
          contentType: bannerFile.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo imagen de banner a Supabase:", storageError);
        const error = new Error("Error al subir imagen de banner: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const archivoBannerDb = await prisma.archivo.create({
        data: {
          nombreOriginal: bannerFile.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension || "jpg",
          mimeType: bannerFile.mimetype,
          tamanioBytes: BigInt(bannerFile.size || 0),
        },
      });

      imagenId = archivoBannerDb.id;
    }

    // 2. Procesar Documento adjunto (PDF / Word) si existe
    let documentoMeta = null;
    if (docFile) {
      const { nombreUnico, extension } = generarNombreUnico(docFile.originalname, "residencia_doc");
      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, docFile.buffer, {
          contentType: docFile.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo documento a Supabase:", storageError);
        const error = new Error("Error al subir documento adjunto: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const archivoDocDb = await prisma.archivo.create({
        data: {
          nombreOriginal: docFile.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension: extension || "pdf",
          mimeType: docFile.mimetype,
          tamanioBytes: BigInt(docFile.size || 0),
        },
      });

      const { data: pubUrlData } = supabase.storage.from("documentos").getPublicUrl(nombreUnico);

      documentoMeta = {
        documentoId: archivoDocDb.id.toString(),
        documentoNombre: docFile.originalname,
        documentoTamano: formatBytes(docFile.size),
        documentoTipo: (extension || "pdf").toUpperCase(),
        documentoUrl: pubUrlData?.publicUrl || "",
        documentoArchivoNombre: nombreUnico,
      };
    }

    // 3. Estructurar el contenido en JSON
    const contenidoPayload = {
      categoria: data.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: data.descripcionPrograma || "",
      cupos: data.cupos || "",
      duracion: data.duracion || "",
      requisitos: data.requisitos || "",
      reglamentoRotacion: data.reglamentoRotacion || "",
      documento: documentoMeta,
    };

    let fechaConvocatoriaDate = null;
    if (data.fechaConvocatoria) {
      const parsed = new Date(data.fechaConvocatoria);
      if (!isNaN(parsed.getTime())) {
        fechaConvocatoriaDate = parsed;
      }
    }

    let estadoNormalizado = "PUBLICADO";
    if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (["PUBLICADO", "BORRADOR", "ARCHIVADO", "PENDIENTE_APROBACION", "PROGRAMADO"].includes(estadoUpper)) {
        estadoNormalizado = estadoUpper;
      }
    }

    const nueva = await prisma.residencia.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        convocatoria: data.convocatoria ? data.convocatoria.trim() : "Convocatoria Abierta",
        fechaConvocatoria: fechaConvocatoriaDate,
        estado: estadoNormalizado,
        activo: data.activo !== undefined ? (data.activo === true || data.activo === "true") : true,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    return {
      message: "Residencia creada con éxito.",
      residencia: this._formatResidencia(nueva),
    };
  }

  /**
   * Actualizar una residencia existente
   */
  async actualizarResidencia(id, data, files) {
    const idBigInt = BigInt(id);

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
    const bannerFile = filesArray.find((f) => f.fieldname === "banner" || f.fieldname === "imagen");
    const docFile = filesArray.find((f) => f.fieldname === "archivo" || f.fieldname === "documento");

    let finalImagenId = residenciaExistente.imagenId;

    // Manejo de eliminación explícita de Banner
    if (data.eliminarBanner === "true" || data.eliminarBanner === true) {
      if (residenciaExistente.archivo) {
        try {
          await supabase.storage
            .from("noticias-imagenes")
            .remove([residenciaExistente.archivo.nombreArchivo]);
          await prisma.archivo.delete({ where: { id: residenciaExistente.archivo.id } });
        } catch (e) {
          console.warn("No se pudo remover el banner anterior:", e.message);
        }
      }
      finalImagenId = null;
    }

    // Si se subió un nuevo Banner
    if (bannerFile) {
      if (residenciaExistente.archivo) {
        try {
          await supabase.storage
            .from("noticias-imagenes")
            .remove([residenciaExistente.archivo.nombreArchivo]);
          await prisma.archivo.delete({ where: { id: residenciaExistente.archivo.id } });
        } catch (e) {
          console.warn("No se pudo remover banner previo:", e.message);
        }
      }

      const { nombreUnico, extension } = generarNombreUnico(bannerFile.originalname, "residencia_banner");
      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, bannerFile.buffer, {
          contentType: bannerFile.mimetype,
          upsert: true,
        });

      if (storageError) {
        const error = new Error("Error al subir banner a Supabase: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const nuevoArchivoBanner = await prisma.archivo.create({
        data: {
          nombreOriginal: bannerFile.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension || "jpg",
          mimeType: bannerFile.mimetype,
          tamanioBytes: BigInt(bannerFile.size || 0),
        },
      });

      finalImagenId = nuevoArchivoBanner.id;
    }

    // Parsear contenido previo
    let contenidoPrevio = {};
    if (residenciaExistente.contenido) {
      try {
        contenidoPrevio = JSON.parse(residenciaExistente.contenido);
      } catch (err) {
        contenidoPrevio = {};
      }
    }

    let documentoMeta = contenidoPrevio.documento || null;

    // Manejo de eliminación explícita de Documento
    if (data.eliminarDocumento === "true" || data.eliminarDocumento === true) {
      if (documentoMeta?.documentoId) {
        try {
          if (documentoMeta.documentoArchivoNombre) {
            await supabase.storage
              .from("documentos")
              .remove([documentoMeta.documentoArchivoNombre]);
          }
          await prisma.archivo.delete({ where: { id: BigInt(documentoMeta.documentoId) } });
        } catch (e) {
          console.warn("No se pudo remover documento previo:", e.message);
        }
      }
      documentoMeta = null;
    }

    // Si se subió un nuevo Documento
    if (docFile) {
      if (documentoMeta?.documentoId) {
        try {
          if (documentoMeta.documentoArchivoNombre) {
            await supabase.storage
              .from("documentos")
              .remove([documentoMeta.documentoArchivoNombre]);
          }
          await prisma.archivo.delete({ where: { id: BigInt(documentoMeta.documentoId) } });
        } catch (e) {
          console.warn("No se pudo remover documento previo:", e.message);
        }
      }

      const { nombreUnico, extension } = generarNombreUnico(docFile.originalname, "residencia_doc");
      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, docFile.buffer, {
          contentType: docFile.mimetype,
          upsert: true,
        });

      if (storageError) {
        const error = new Error("Error al subir documento a Supabase: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const nuevoArchivoDoc = await prisma.archivo.create({
        data: {
          nombreOriginal: docFile.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension: extension || "pdf",
          mimeType: docFile.mimetype,
          tamanioBytes: BigInt(docFile.size || 0),
        },
      });

      const { data: pubUrlData } = supabase.storage.from("documentos").getPublicUrl(nombreUnico);

      documentoMeta = {
        documentoId: nuevoArchivoDoc.id.toString(),
        documentoNombre: docFile.originalname,
        documentoTamano: formatBytes(docFile.size),
        documentoTipo: (extension || "pdf").toUpperCase(),
        documentoUrl: pubUrlData?.publicUrl || "",
        documentoArchivoNombre: nombreUnico,
      };
    }

    const contenidoPayload = {
      categoria: data.categoria !== undefined ? data.categoria : (contenidoPrevio.categoria || ""),
      descripcionPrograma: data.descripcionPrograma !== undefined ? data.descripcionPrograma : (contenidoPrevio.descripcionPrograma || ""),
      cupos: data.cupos !== undefined ? data.cupos : (contenidoPrevio.cupos || ""),
      duracion: data.duracion !== undefined ? data.duracion : (contenidoPrevio.duracion || ""),
      requisitos: data.requisitos !== undefined ? data.requisitos : (contenidoPrevio.requisitos || ""),
      reglamentoRotacion: data.reglamentoRotacion !== undefined ? data.reglamentoRotacion : (contenidoPrevio.reglamentoRotacion || ""),
      documento: documentoMeta,
    };

    let fechaConvocatoriaDate = residenciaExistente.fechaConvocatoria;
    if (data.fechaConvocatoria !== undefined) {
      if (data.fechaConvocatoria && data.fechaConvocatoria !== "") {
        const parsed = new Date(data.fechaConvocatoria);
        fechaConvocatoriaDate = !isNaN(parsed.getTime()) ? parsed : null;
      } else {
        fechaConvocatoriaDate = null;
      }
    }

    let estadoNormalizado = residenciaExistente.estado;
    if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (["PUBLICADO", "BORRADOR", "ARCHIVADO", "PENDIENTE_APROBACION", "PROGRAMADO"].includes(estadoUpper)) {
        estadoNormalizado = estadoUpper;
      }
    }

    const actualizada = await prisma.residencia.update({
      where: { id: idBigInt },
      data: {
        nombre: data.nombre !== undefined ? data.nombre.trim() : residenciaExistente.nombre,
        descripcion: data.descripcion !== undefined ? data.descripcion : residenciaExistente.descripcion,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: finalImagenId,
        convocatoria: data.convocatoria !== undefined ? (data.convocatoria ? data.convocatoria.trim() : null) : residenciaExistente.convocatoria,
        fechaConvocatoria: fechaConvocatoriaDate,
        estado: estadoNormalizado,
        activo: data.activo !== undefined ? (data.activo === true || data.activo === "true") : residenciaExistente.activo,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    return {
      message: "Residencia actualizada con éxito.",
      residencia: this._formatResidencia(actualizada),
    };
  }

  /**
   * Cambiar el estado editorial de una residencia (PUBLICADO, BORRADOR, ARCHIVADO)
   */
  async cambiarEstado(id, nuevoEstado) {
    if (!nuevoEstado) {
      const error = new Error("El nuevo estado es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const estadoUpper = nuevoEstado.trim().toUpperCase();
    const estadosValidos = ["PUBLICADO", "BORRADOR", "ARCHIVADO"];

    if (!estadosValidos.includes(estadoUpper)) {
      const error = new Error(
        `Estado no válido: '${nuevoEstado}'. Los estados permitidos son: ${estadosValidos.join(", ")}.`
      );
      error.statusCode = 400;
      throw error;
    }

    const idBigInt = BigInt(id);

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const residenciaActualizada = await prisma.residencia.update({
      where: { id: idBigInt },
      data: {
        estado: estadoUpper,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    return {
      message: `Estado actualizado a ${estadoUpper} con éxito.`,
      residencia: this._formatResidencia(residenciaActualizada),
    };
  }

  /**
   * Eliminar una residencia y sus archivos (banner y documento)
   */
  async eliminarResidencia(id) {
    const idBigInt = BigInt(id);

    const residencia = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residencia) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    // 1. Eliminar banner
    if (residencia.archivo) {
      try {
        await supabase.storage
          .from("noticias-imagenes")
          .remove([residencia.archivo.nombreArchivo]);
      } catch (e) {
        console.warn("No se pudo eliminar banner de storage:", e.message);
      }
    }

    // 2. Eliminar documento si existe en contenido
    if (residencia.contenido) {
      try {
        const parsed = JSON.parse(residencia.contenido);
        if (parsed.documento?.documentoArchivoNombre) {
          await supabase.storage
            .from("documentos")
            .remove([parsed.documento.documentoArchivoNombre]);
        }
        if (parsed.documento?.documentoId) {
          await prisma.archivo.delete({
            where: { id: BigInt(parsed.documento.documentoId) },
          }).catch(() => {});
        }
      } catch (e) {}
    }

    await prisma.residencia.delete({
      where: { id: idBigInt },
    });

    if (residencia.imagenId) {
      try {
        await prisma.archivo.delete({
          where: { id: residencia.imagenId },
        });
      } catch (e) {
        console.warn("No se pudo eliminar el registro de archivo del banner:", e.message);
      }
    }

    return {
      message: "Residencia eliminada correctamente.",
      id: id.toString(),
    };
  }

  /**
   * Formatear el registro de residencia para el cliente
   */
  _formatResidencia(res) {
    let extra = {
      categoria: "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: "",
      cupos: "",
      duracion: "",
      requisitos: "",
      reglamentoRotacion: "",
      documento: null,
    };

    if (res.contenido) {
      try {
        const parsed = JSON.parse(res.contenido);
        if (typeof parsed === "object" && parsed !== null) {
          extra = { ...extra, ...parsed };
        }
      } catch (e) {}
    }

    // Banner URL e Info
    let bannerUrl = "";
    let bannerNombre = "";
    if (res.archivo) {
      bannerNombre = res.archivo.nombreOriginal || "";
      const { data } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(res.archivo.nombreArchivo);
      bannerUrl = data?.publicUrl || "";
    }

    // Documento adjunto (PDF / Word)
    const doc = extra.documento || {};
    const documentoUrl = doc.documentoUrl || "";
    const documentoNombre = doc.documentoNombre || "";
    const documentoTamano = doc.documentoTamano || "";
    const documentoTipo = doc.documentoTipo || (documentoNombre ? documentoNombre.split(".").pop().toUpperCase() : "PDF");

    return {
      id: res.id.toString(),
      nombre: res.nombre,
      descripcion: res.descripcion || "",
      convocatoria: res.convocatoria || "Convocatoria Abierta",
      fechaConvocatoria: res.fechaConvocatoria
        ? res.fechaConvocatoria.toISOString().split("T")[0]
        : "",
      estado: res.estado,
      activo: res.activo,
      createdAt: res.createdAt ? res.createdAt.toISOString() : "",
      updatedAt: res.updatedAt ? res.updatedAt.toISOString() : "",

      // Campos específicos solicitados por el usuario
      categoria: extra.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: extra.descripcionPrograma || "",
      cupos: extra.cupos || "",
      duracion: extra.duracion || "",
      requisitos: extra.requisitos || "",
      reglamentoRotacion: extra.reglamentoRotacion || "",

      // Imagen de Banner
      bannerId: res.imagenId ? res.imagenId.toString() : null,
      bannerNombre,
      bannerUrl,

      // Carga de Documentos
      documentoId: doc.documentoId || null,
      documentoNombre,
      documentoTamano,
      documentoTipo,
      documentoUrl,

      // Compatibilidad con tabla
      archivoNombre: documentoNombre,
      archivoUrl: documentoUrl,
      archivoTamano: documentoTamano,
      archivoTipo: documentoTipo,
    };
  }
}

export default new CmsResidenciaService();
