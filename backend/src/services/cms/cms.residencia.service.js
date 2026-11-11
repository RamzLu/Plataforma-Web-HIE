import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { sanitizarUrlLectura, parsearIdBigInt } from "../../utils/sanitize.utils.js";

const RESIDENCIA_PENDING_META_PREFIX = "residencia_pending_meta_";
const RESIDENCIA_REJECTION_KEY_PREFIX = "residencia_rejection_reason_";

const formatBytes = (bytes) => {
  const n = Number(bytes || 0);
  if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n > 0) return `${(n / 1024).toFixed(0)} KB`;
  return "";
};

class CmsResidenciaService {
  async obtenerMapaMotivosRechazo() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: RESIDENCIA_REJECTION_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(RESIDENCIA_REJECTION_KEY_PREFIX, "");
        map.set(itemKey, item.valor);
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarMotivoRechazo(id, motivo) {
    const clave = `${RESIDENCIA_REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: motivo, updatedAt: new Date() },
      create: {
        clave,
        valor: motivo,
        descripcion: `Motivo de rechazo de residencia ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarMotivoRechazo(id) {
    const clave = `${RESIDENCIA_REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerMapaPendingMeta() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: RESIDENCIA_PENDING_META_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(RESIDENCIA_PENDING_META_PREFIX, "");
        try {
          map.set(itemKey, JSON.parse(item.valor));
        } catch (_) {}
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarPendingMeta(id, meta) {
    const clave = `${RESIDENCIA_PENDING_META_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: JSON.stringify(meta), updatedAt: new Date() },
      create: {
        clave,
        valor: JSON.stringify(meta),
        descripcion: `Metadatos de solicitud pendiente para residencia ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarPendingMeta(id) {
    const clave = `${RESIDENCIA_PENDING_META_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerResidencias(esVistaAdmin = false) {
    const [residencias, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.residencia.findMany({
        where: esVistaAdmin === true ? {} : { estado: { in: ["PUBLICADO", "PENDIENTE_APROBACION"] }, activo: true },
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    const resultado = [];
    for (const res of residencias) {
      const idStr = res.id.toString();
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      const motivoRechazo = motivosMap.get(idStr) || null;
      const estadoUpper = (res.estado || "").toUpperCase();

      if (!esVistaAdmin) {
        const esPublicadaDirecta = estadoUpper === "PUBLICADO";
        const mantienePublicacionPrevia =
          estadoUpper === "PENDIENTE_APROBACION" &&
          pendingMeta?.previousEstado === "PUBLICADO";

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          continue;
        }
      }

      resultado.push(this._formatResidencia(res, motivoRechazo, pendingMeta));
    }

    return resultado;
  }

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
        const error = new Error("No se pudo almacenar el banner de la residencia.");
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
        const error = new Error("No se pudo almacenar el documento adjunto de la residencia.");
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

  async actualizarResidencia(id, data, files) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");

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
        console.error("Error subiendo banner a Supabase:", storageError);
        const error = new Error("No se pudo almacenar el banner de la residencia.");
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

    let contenidoPrevio = {};
    if (residenciaExistente.contenido) {
      try {
        contenidoPrevio = JSON.parse(residenciaExistente.contenido);
      } catch (err) {
        contenidoPrevio = {};
      }
    }

    let documentoMeta = contenidoPrevio.documento || null;

    if (data.eliminarDocumento === "true" || data.eliminarDocumento === true) {
      if (documentoMeta?.documentoId) {
        try {
          if (documentoMeta.documentoArchivoNombre) {
            await supabase.storage
              .from("documentos")
              .remove([documentoMeta.documentoArchivoNombre]);
          }
          await prisma.archivo.delete({ where: { id: parsearIdBigInt(documentoMeta.documentoId, "ID de documento") } });
        } catch (e) {
          console.warn("No se pudo remover documento previo:", e.message);
        }
      }
      documentoMeta = null;
    }

    if (docFile) {
      if (documentoMeta?.documentoId) {
        try {
          if (documentoMeta.documentoArchivoNombre) {
            await supabase.storage
              .from("documentos")
              .remove([documentoMeta.documentoArchivoNombre]);
          }
          await prisma.archivo.delete({ where: { id: parsearIdBigInt(documentoMeta.documentoId, "ID de documento") } });
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
        console.error("Error subiendo documento a Supabase:", storageError);
        const error = new Error("No se pudo almacenar el documento de la residencia.");
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
    let activoFinal = data.activo !== undefined ? (data.activo === true || data.activo === "true") : residenciaExistente.activo;
    const estadoAnterior = (residenciaExistente.estado || "").toUpperCase();
    const provieneDePublicada = estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";
    const idStr = idBigInt.toString();

    if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (estadoUpper === "ARCHIVADO" && provieneDePublicada) {
        estadoNormalizado = "PENDIENTE_APROBACION";
        await this.guardarPendingMeta(idStr, {
          previousEstado: "PUBLICADO",
          targetEstado: "ARCHIVADO",
          updatedAt: new Date().toISOString(),
        });
        await this.limpiarMotivoRechazo(idStr);
      } else if (["PUBLICADO", "BORRADOR", "ARCHIVADO", "PENDIENTE_APROBACION", "PROGRAMADO"].includes(estadoUpper)) {
        estadoNormalizado = estadoUpper;
        if (estadoUpper === "ARCHIVADO") {
          activoFinal = false;
        }
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
        activo: activoFinal,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    return {
      message:
        data.estado && data.estado.toUpperCase() === "ARCHIVADO" && estadoNormalizado === "PENDIENTE_APROBACION"
          ? "Solicitud de archivado enviada a revisión del administrador."
          : "Residencia actualizada con éxito.",
      residencia: this._formatResidencia(actualizada, motivoActual, pendingMetaActual),
    };
  }

  async cambiarEstado(id, nuevoEstado, user = null, rejectionReason = null) {
    if (!nuevoEstado) {
      const error = new Error("El nuevo estado es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const estadoUpper = nuevoEstado.trim().toUpperCase();
    const estadosValidos = ["PUBLICADO", "BORRADOR", "ARCHIVADO", "APROBADO", "RECHAZADO", "PENDIENTE_APROBACION"];

    if (!estadosValidos.includes(estadoUpper)) {
      const error = new Error(
        `Estado no válido: '${nuevoEstado}'. Los estados permitidos son: ${estadosValidos.join(", ")}.`
      );
      error.statusCode = 400;
      throw error;
    }

    const idBigInt = parsearIdBigInt(id, "ID de residencia");
    const idStr = id.toString();

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const estadoAnterior = (residenciaExistente.estado || "").toUpperCase();
    const provieneDePublicada = estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";

    const pendingMap = await this.obtenerMapaPendingMeta();
    const metaExistente = pendingMap.get(idStr) || null;

    let finalEstado = estadoUpper;
    let motivoGuardado = null;
    let finalActivo = residenciaExistente.activo;

    // 1. Si el CM solicita ARCHIVAR una residencia que ya estaba publicada:
    // Requiere aprobación del administrador -> PENDIENTE_APROBACION
    if (estadoUpper === "ARCHIVADO" && provieneDePublicada) {
      finalEstado = "PENDIENTE_APROBACION";
      await this.guardarPendingMeta(idStr, {
        previousEstado: "PUBLICADO",
        targetEstado: "ARCHIVADO",
        updatedAt: new Date().toISOString(),
      });
      await this.limpiarMotivoRechazo(idStr);
    }
    // 2. Si el Admin aprueba la residencia (APROBADO o PUBLICADO):
    else if (estadoUpper === "APROBADO" || estadoUpper === "PUBLICADO") {
      if (metaExistente?.targetEstado === "ARCHIVADO") {
        finalEstado = "ARCHIVADO";
        finalActivo = false;
      } else {
        finalEstado = "PUBLICADO";
        finalActivo = true;
      }
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }
    // 3. Si el Admin rechaza la residencia:
    else if (estadoUpper === "RECHAZADO") {
      finalEstado = "RECHAZADO";
      motivoGuardado = (rejectionReason || "").trim() || "Solicitud rechazada por el administrador.";
      await this.guardarMotivoRechazo(idStr, motivoGuardado);
      await this.limpiarPendingMeta(idStr);
    }
    // 4. Si se archiva un borrador directamente:
    else if (estadoUpper === "ARCHIVADO") {
      finalEstado = "ARCHIVADO";
      finalActivo = false;
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }
    // 5. Otras transiciones (BORRADOR, etc.)
    else {
      finalEstado = estadoUpper;
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    }

    const residenciaActualizada = await prisma.residencia.update({
      where: { id: idBigInt },
      data: {
        estado: finalEstado,
        activo: finalActivo,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    let mensaje = `Estado actualizado a ${finalEstado} con éxito.`;
    if (estadoUpper === "ARCHIVADO" && finalEstado === "PENDIENTE_APROBACION") {
      mensaje = "Solicitud de archivado enviada a revisión del administrador.";
    }

    return {
      message: mensaje,
      residencia: this._formatResidencia(residenciaActualizada, motivoActual, pendingMetaActual),
    };
  }

  async eliminarResidencia(id) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");

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
          .from("noticias-imagenes")
          .remove([residencia.archivo.nombreArchivo]);
      } catch (e) {
        console.warn("No se pudo eliminar banner de storage:", e.message);
      }
    }

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
            where: { id: parsearIdBigInt(parsed.documento.documentoId, "ID de documento") },
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

  _formatResidencia(res, motivoRechazo = null, pendingMeta = null) {
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

    let bannerUrl = "";
    let bannerNombre = "";
    if (res.archivo) {
      bannerNombre = res.archivo.nombreOriginal || "";
      const { data } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(res.archivo.nombreArchivo);
      bannerUrl = data?.publicUrl || "";
    }

    const doc = extra.documento || {};
    const documentoUrl = sanitizarUrlLectura(doc.documentoUrl, "");
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

      categoria: extra.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: extra.descripcionPrograma || "",
      cupos: extra.cupos || "",
      duracion: extra.duracion || "",
      requisitos: extra.requisitos || "",
      reglamentoRotacion: extra.reglamentoRotacion || "",

      bannerId: res.imagenId ? res.imagenId.toString() : null,
      bannerNombre,
      bannerUrl,

      documentoId: doc.documentoId || null,
      documentoNombre,
      documentoTamano,
      documentoTipo,
      documentoUrl,

      archivoNombre: documentoNombre,
      archivoUrl: documentoUrl,
      archivoTamano: documentoTamano,
      archivoTipo: documentoTipo,

      requestedEstado: (res.estado || "").toUpperCase() === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
      motivoRechazo: motivoRechazo || null,
      rejectionReason: motivoRechazo || null,
    };
  }
}

export default new CmsResidenciaService();
