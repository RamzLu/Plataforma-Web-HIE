import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd3Vwd21ieWd0eWlsdWV6emxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDM2MDUsImV4cCI6MjEwMjcxOTYwNX0.ytya9DiAojD-DbQ0kDmr_nojF4GUp7XaFLsUIRH2sWE"
);

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
   * Crear una nueva residencia
   */
  async crearResidencia(data, file) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error("El nombre de la residencia es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    let imagenId = null;

    // Si se subió un archivo (PDF, DOC, DOCX, imagen)
    if (file) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "residencia");

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo archivo a Supabase:", storageError);
        const error = new Error("Error al subir archivo adjunto: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension: extension || "bin",
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size || 0),
        },
      });

      imagenId = archivoDb.id;
    }

    // Estructurar el contenido en JSON para persistir los campos complementarios
    const contenidoPayload = {
      tipo: data.tipo || "Básica",
      especialidad: data.especialidad || "",
      duracion: data.duracion || "3 años",
      cupos: data.cupos || "",
      requisitos: data.requisitos || "",
      contenidoDetallado: data.contenidoDetallado || data.contenido || "",
    };

    let fechaConvocatoriaDate = null;
    if (data.fechaConvocatoria) {
      const parsed = new Date(data.fechaConvocatoria);
      if (!isNaN(parsed.getTime())) {
        fechaConvocatoriaDate = parsed;
      }
    }

    // Normalizar estado editorial
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
        descripcion: data.descripcion || null,
        contenido: JSON.stringify(contenidoPayload),
        imagenId: imagenId,
        videoUrl: data.videoUrl ? data.videoUrl.trim() : null,
        convocatoria: data.convocatoria ? data.convocatoria.trim() : null,
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
  async actualizarResidencia(id, data, file) {
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

    let finalImagenId = residenciaExistente.imagenId;

    // Si se envía eliminarArchivo = 'true'
    if (data.eliminarArchivo === "true" || data.eliminarArchivo === true) {
      if (residenciaExistente.archivo) {
        try {
          await supabase.storage
            .from("documentos")
            .remove([residenciaExistente.archivo.nombreArchivo]);
        } catch (e) {
          console.warn("No se pudo eliminar el archivo anterior en storage:", e.message);
        }
      }
      finalImagenId = null;
    }

    // Si se subió un nuevo archivo para reemplazar
    if (file) {
      if (residenciaExistente.archivo) {
        try {
          await supabase.storage
            .from("documentos")
            .remove([residenciaExistente.archivo.nombreArchivo]);
        } catch (e) {
          console.warn("No se pudo remover el archivo previo:", e.message);
        }
      }

      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "residencia");

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (storageError) {
        const error = new Error("Error al subir archivo a Supabase: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const nuevoArchivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension: extension || "bin",
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size || 0),
        },
      });

      finalImagenId = nuevoArchivoDb.id;
    }

    // Estructurar el contenido en JSON
    let contenidoPrevio = {};
    if (residenciaExistente.contenido) {
      try {
        contenidoPrevio = JSON.parse(residenciaExistente.contenido);
      } catch (err) {
        contenidoPrevio = { contenidoDetallado: residenciaExistente.contenido };
      }
    }

    const contenidoPayload = {
      tipo: data.tipo !== undefined ? data.tipo : (contenidoPrevio.tipo || "Básica"),
      especialidad: data.especialidad !== undefined ? data.especialidad : (contenidoPrevio.especialidad || ""),
      duracion: data.duracion !== undefined ? data.duracion : (contenidoPrevio.duracion || "3 años"),
      cupos: data.cupos !== undefined ? data.cupos : (contenidoPrevio.cupos || ""),
      requisitos: data.requisitos !== undefined ? data.requisitos : (contenidoPrevio.requisitos || ""),
      contenidoDetallado: data.contenidoDetallado !== undefined 
        ? data.contenidoDetallado 
        : (data.contenido !== undefined ? data.contenido : (contenidoPrevio.contenidoDetallado || "")),
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
        videoUrl: data.videoUrl !== undefined ? (data.videoUrl ? data.videoUrl.trim() : null) : residenciaExistente.videoUrl,
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
   * Eliminar una residencia y su archivo si existe
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

    if (residencia.archivo) {
      try {
        await supabase.storage
          .from("documentos")
          .remove([residencia.archivo.nombreArchivo]);
      } catch (e) {
        console.warn("No se pudo eliminar el archivo de storage:", e.message);
      }
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
        console.warn("No se pudo eliminar el registro de archivo:", e.message);
      }
    }

    return {
      message: "Residencia eliminada correctamente.",
      id: id.toString(),
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
   * Formatear el registro de residencia para el cliente
   */
  _formatResidencia(res) {
    let extra = {
      tipo: "Básica",
      especialidad: "",
      duracion: "3 años",
      cupos: "",
      requisitos: "",
      contenidoDetallado: "",
    };

    if (res.contenido) {
      try {
        const parsed = JSON.parse(res.contenido);
        if (typeof parsed === "object" && parsed !== null) {
          extra = { ...extra, ...parsed };
        } else {
          extra.contenidoDetallado = String(res.contenido);
        }
      } catch (e) {
        extra.contenidoDetallado = String(res.contenido);
      }
    }

    let archivoUrl = "";
    let archivoNombre = "";
    let archivoTamano = "";
    let archivoTipo = "";

    if (res.archivo) {
      archivoNombre = res.archivo.nombreOriginal || "";
      archivoTipo = res.archivo.extension ? res.archivo.extension.toUpperCase() : "PDF";

      const bytes = Number(res.archivo.tamanioBytes || 0);
      if (bytes > 1024 * 1024) {
        archivoTamano = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      } else if (bytes > 0) {
        archivoTamano = `${(bytes / 1024).toFixed(0)} KB`;
      }

      const { data } = supabase.storage
        .from("documentos")
        .getPublicUrl(res.archivo.nombreArchivo);
      archivoUrl = data?.publicUrl || "";
    }

    return {
      id: res.id.toString(),
      nombre: res.nombre,
      descripcion: res.descripcion || "",
      videoUrl: res.videoUrl || "",
      convocatoria: res.convocatoria || "",
      fechaConvocatoria: res.fechaConvocatoria
        ? res.fechaConvocatoria.toISOString().split("T")[0]
        : "",
      estado: res.estado,
      activo: res.activo,
      createdAt: res.createdAt ? res.createdAt.toISOString() : "",
      updatedAt: res.updatedAt ? res.updatedAt.toISOString() : "",
      // Campos complementarios del contenido
      tipo: extra.tipo || "Básica",
      especialidad: extra.especialidad || "",
      duracion: extra.duracion || "3 años",
      cupos: extra.cupos || "",
      requisitos: extra.requisitos || "",
      contenidoDetallado: extra.contenidoDetallado || "",
      // Archivo adjunto
      archivoId: res.imagenId ? res.imagenId.toString() : null,
      archivoNombre,
      archivoTamano,
      archivoTipo,
      archivoUrl,
    };
  }
}

export default new CmsResidenciaService();
