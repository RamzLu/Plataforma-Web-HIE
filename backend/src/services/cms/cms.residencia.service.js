import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { sanitizarUrlLectura, parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { limitePublicacionProgramada } from "../../utils/programacion.utils.js";

const RESIDENCIA_PENDING_META_PREFIX = "residencia_pending_meta_";
const RESIDENCIA_REJECTION_KEY_PREFIX = "residencia_rejection_reason_";
const RESIDENCIA_EDITOR_META_PREFIX = "residencia_editor_meta_";

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

  async obtenerMapaEditorMeta() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: RESIDENCIA_EDITOR_META_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(RESIDENCIA_EDITOR_META_PREFIX, "");
        try {
          map.set(itemKey, JSON.parse(item.valor));
        } catch (_) {
          map.set(itemKey, { editor: item.valor, updatedAt: item.updatedAt });
        }
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarEditorMeta(id, meta) {
    const clave = `${RESIDENCIA_EDITOR_META_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: JSON.stringify(meta), updatedAt: new Date() },
      create: {
        clave,
        valor: JSON.stringify(meta),
        descripcion: `Editor y fecha de residencia ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarEditorMeta(id) {
    const clave = `${RESIDENCIA_EDITOR_META_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async _resolverNombreEditor(user, payloadEditor = null) {
    if (
      payloadEditor &&
      typeof payloadEditor === "string" &&
      payloadEditor.trim() &&
      payloadEditor !== "Editor CMS"
    ) {
      return payloadEditor.trim();
    }
    if (user) {
      try {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        if (usuarioLocal?.nombre) {
          if (usuarioLocal.apellido && usuarioLocal.apellido !== "Sistema") {
            return `${usuarioLocal.nombre} ${usuarioLocal.apellido}`.trim();
          }
          return usuarioLocal.nombre.trim();
        }
      } catch (_) {}
      if (user.name && user.name.trim()) return user.name.trim();
      if (user.preferred_username && user.preferred_username.trim()) return user.preferred_username.trim();
      if (user.username && user.username.trim()) return user.username.trim();
    }
    return "Editor CMS";
  }

  async obtenerResidencias(esVistaAdmin = false) {
    const [residencias, motivosMap, pendingMetaMap, editorMetaMap, auditorias] = await Promise.all([
      prisma.residencia.findMany({
        where: esVistaAdmin === true ? {} : { estado: { in: ["PUBLICADO", "PENDIENTE_APROBACION"] } },
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
      this.obtenerMapaEditorMeta(),
      prisma.auditoria.findMany({
        where: { entidad: "residencia" },
        include: { usuario: true },
        orderBy: { fechaHora: "desc" },
      }).catch(() => []),
    ]);

    const auditMap = new Map();
    for (const aud of auditorias) {
      if (!auditMap.has(aud.entidadId)) {
        auditMap.set(aud.entidadId, aud);
      }
    }

    const resultado = [];
    for (const res of residencias) {
      const idStr = res.id.toString();
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      const editorMeta = editorMetaMap.get(idStr) || null;
      const motivoRechazo = motivosMap.get(idStr) || null;
      const auditItem = auditMap.get(idStr) || null;
      const estadoUpper = (res.estado || "").toUpperCase();

      let resolvedEditor = null;
      let resolvedUpdatedAt = null;

      if (pendingMeta?.editor && pendingMeta.editor !== "Editor CMS") {
        resolvedEditor = pendingMeta.editor;
        resolvedUpdatedAt = pendingMeta.updatedAt || null;
      } else if (editorMeta?.editor && editorMeta.editor !== "Editor CMS") {
        resolvedEditor = editorMeta.editor;
        resolvedUpdatedAt = editorMeta.updatedAt || null;
      } else if (auditItem?.usuario) {
        const u = auditItem.usuario;
        resolvedEditor = u.apellido && u.apellido !== "Sistema" ? `${u.nombre} ${u.apellido}`.trim() : u.nombre.trim();
        resolvedUpdatedAt = auditItem.fechaHora;
      } else if (pendingMeta?.editor) {
        resolvedEditor = pendingMeta.editor;
        resolvedUpdatedAt = pendingMeta.updatedAt || null;
      } else if (editorMeta?.editor) {
        resolvedEditor = editorMeta.editor;
        resolvedUpdatedAt = editorMeta.updatedAt || null;
      } else {
        resolvedEditor = "Editor CMS";
      }

      if (!esVistaAdmin) {
        const esPublicadaDirecta = (estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO") && res.activo !== false;
        const mantienePublicacionPrevia =
          estadoUpper === "PENDIENTE_APROBACION" &&
          pendingMeta?.previousEstado === "PUBLICADO" &&
          Boolean(pendingMeta?.snapshotPublico);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          continue;
        }

        if (mantienePublicacionPrevia) {
          const snap = pendingMeta.snapshotPublico;
          resultado.push(
            this._formatResidencia(
              { ...res, ...snap },
              null,
              null,
              resolvedEditor,
              resolvedUpdatedAt
            )
          );
          continue;
        }
      }

      resultado.push(
        this._formatResidencia(res, motivoRechazo, pendingMeta, resolvedEditor, resolvedUpdatedAt)
      );
    }

    return resultado;
  }

  async crearResidencia(data, files, user = null) {
    if (!data.nombre || !data.nombre.trim()) {
      const error = new Error("El nombre de la residencia es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const editorNombre = await this._resolverNombreEditor(user, data.editor);
    const nowIso = new Date().toISOString();

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

    const tieneFechaProgramada =
      (data.estado?.toUpperCase() === "PROGRAMADO" || data.estado?.toUpperCase() === "PENDIENTE_APROBACION") &&
      Boolean(data.fechaPublicacion);

    const contenidoPayload = {
      categoria: data.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: data.descripcionPrograma || "",
      cupos: data.cupos || "",
      duracion: data.duracion || "",
      requisitos: data.requisitos || "",
      reglamentoRotacion: data.reglamentoRotacion || "",
      fechaInicio: data.fechaInicio || "",
      fechaPublicacion: tieneFechaProgramada ? data.fechaPublicacion : null,
      documento: documentoMeta,
    };

    let fechaConvocatoriaDate = null;
    if (data.fechaConvocatoria) {
      const parsed = new Date(data.fechaConvocatoria);
      if (!isNaN(parsed.getTime())) {
        fechaConvocatoriaDate = parsed;
      }
    }

    let estadoNormalizado = "PENDIENTE_APROBACION";
    let targetEstado = "PUBLICADO";
    if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (estadoUpper === "BORRADOR") {
        estadoNormalizado = "BORRADOR";
        targetEstado = "BORRADOR";
      } else if (estadoUpper === "ARCHIVADO") {
        estadoNormalizado = "ARCHIVADO";
        targetEstado = "ARCHIVADO";
      } else if (estadoUpper === "PROGRAMADO") {
        estadoNormalizado = "PENDIENTE_APROBACION";
        targetEstado = "PROGRAMADO";
      } else {
        estadoNormalizado = "PENDIENTE_APROBACION";
        targetEstado = tieneFechaProgramada ? "PROGRAMADO" : "PUBLICADO";
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

    const idStr = nueva.id.toString();

    // Guardar editor meta
    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

    // Si entra como PENDIENTE_APROBACION, guardar pending meta
    let pendingMeta = null;
    if (estadoNormalizado === "PENDIENTE_APROBACION") {
      pendingMeta = {
        previousEstado: null,
        targetEstado: targetEstado,
        editor: editorNombre,
        updatedAt: nowIso,
        cambios: null,
        esActualizacion: false,
      };
      await this.guardarPendingMeta(idStr, pendingMeta);
    }

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "residencia",
            entidadId: idStr,
            accion: "CREAR",
            descripcion: `Creación de residencia "${nueva.nombre}".`,
          },
        });
      }
    } catch (_) {}

    return {
      message:
        estadoNormalizado === "PENDIENTE_APROBACION"
          ? "Residencia enviada a revisión del administrador para su aprobación."
          : "Residencia creada con éxito.",
      residencia: this._formatResidencia(nueva, null, pendingMeta, editorNombre, nowIso),
    };
  }

  async actualizarResidencia(id, data, files, user = null) {
    const idBigInt = parsearIdBigInt(id, "ID de residencia");
    const idStr = idBigInt.toString();

    const residenciaExistente = await prisma.residencia.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!residenciaExistente) {
      const error = new Error("La residencia no existe.");
      error.statusCode = 404;
      throw error;
    }

    const editorNombre = await this._resolverNombreEditor(user, data.editor);
    const nowIso = new Date().toISOString();

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

    const tieneFechaProgramada =
      (data.estado?.toUpperCase() === "PROGRAMADO" || data.estado?.toUpperCase() === "PENDIENTE_APROBACION") &&
      Boolean(data.fechaPublicacion);

    const contenidoPayload = {
      categoria: data.categoria !== undefined ? data.categoria : (contenidoPrevio.categoria || ""),
      descripcionPrograma: data.descripcionPrograma !== undefined ? data.descripcionPrograma : (contenidoPrevio.descripcionPrograma || ""),
      cupos: data.cupos !== undefined ? data.cupos : (contenidoPrevio.cupos || ""),
      duracion: data.duracion !== undefined ? data.duracion : (contenidoPrevio.duracion || ""),
      requisitos: data.requisitos !== undefined ? data.requisitos : (contenidoPrevio.requisitos || ""),
      reglamentoRotacion: data.reglamentoRotacion !== undefined ? data.reglamentoRotacion : (contenidoPrevio.reglamentoRotacion || ""),
      fechaInicio: data.fechaInicio !== undefined ? data.fechaInicio : (contenidoPrevio.fechaInicio || ""),
      fechaPublicacion: data.fechaPublicacion !== undefined ? (data.fechaPublicacion || null) : (contenidoPrevio.fechaPublicacion || null),
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

    const estadoAnterior = (residenciaExistente.estado || "").toUpperCase();
    const provieneDePublicada = estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";

    const pendingMap = await this.obtenerMapaPendingMeta();
    const metaExistente = pendingMap.get(idStr) || null;

    let estadoNormalizado = residenciaExistente.estado;
    let activoFinal = data.activo !== undefined ? (data.activo === true || data.activo === "true") : residenciaExistente.activo;
    let targetEstado = metaExistente?.targetEstado || "PUBLICADO";

    // Si la residencia ya estaba publicada y se modifica o se solicita archivar:
    if (provieneDePublicada) {
      estadoNormalizado = "PENDIENTE_APROBACION";
      if (data.estado && data.estado.toUpperCase() === "ARCHIVADO") {
        targetEstado = "ARCHIVADO";
      } else if (data.estado && data.estado.toUpperCase() === "PROGRAMADO") {
        targetEstado = "PROGRAMADO";
      } else {
        targetEstado = "PUBLICADO";
      }
    } else if (data.estado) {
      const estadoUpper = data.estado.toUpperCase();
      if (estadoUpper === "ARCHIVADO") {
        estadoNormalizado = "ARCHIVADO";
        activoFinal = false;
        targetEstado = "ARCHIVADO";
      } else if (estadoUpper === "PROGRAMADO") {
        estadoNormalizado = "PENDIENTE_APROBACION";
        targetEstado = "PROGRAMADO";
      } else if (["PUBLICADO", "BORRADOR", "ARCHIVADO", "PENDIENTE_APROBACION"].includes(estadoUpper)) {
        estadoNormalizado = estadoUpper;
        targetEstado = estadoUpper === "PENDIENTE_APROBACION" && tieneFechaProgramada ? "PROGRAMADO" : estadoUpper;
      }
    }

    // Preparar datos para comparación de cambios
    const antesData = {
      nombre: residenciaExistente.nombre || "",
      categoria: contenidoPrevio.categoria || "",
      convocatoria: residenciaExistente.convocatoria || "",
      fechaInicio: contenidoPrevio.fechaInicio || "",
      fechaConvocatoria: residenciaExistente.fechaConvocatoria
        ? residenciaExistente.fechaConvocatoria.toISOString().split("T")[0]
        : "",
      descripcion: residenciaExistente.descripcion || "",
      descripcionPrograma: contenidoPrevio.descripcionPrograma || "",
      duracion: contenidoPrevio.duracion || "",
      cupos: contenidoPrevio.cupos || "",
      requisitos: contenidoPrevio.requisitos || "",
      reglamentoRotacion: contenidoPrevio.reglamentoRotacion || "",
      bannerNombre: residenciaExistente.archivo?.nombreOriginal || "",
      documentoNombre: contenidoPrevio.documento?.documentoNombre || "",
    };

    const despuesData = {
      nombre: data.nombre !== undefined ? data.nombre.trim() : antesData.nombre,
      categoria: data.categoria !== undefined ? data.categoria.trim() : antesData.categoria,
      convocatoria: data.convocatoria !== undefined ? data.convocatoria.trim() : antesData.convocatoria,
      fechaInicio: data.fechaInicio !== undefined ? (data.fechaInicio || "") : antesData.fechaInicio,
      fechaConvocatoria: data.fechaConvocatoria !== undefined ? (data.fechaConvocatoria || "") : antesData.fechaConvocatoria,
      descripcion: data.descripcion !== undefined ? data.descripcion.trim() : antesData.descripcion,
      descripcionPrograma: data.descripcionPrograma !== undefined ? data.descripcionPrograma.trim() : antesData.descripcionPrograma,
      duracion: data.duracion !== undefined ? data.duracion.trim() : antesData.duracion,
      cupos: data.cupos !== undefined ? (data.cupos || "").trim() : antesData.cupos,
      requisitos: data.requisitos !== undefined ? data.requisitos.trim() : antesData.requisitos,
      reglamentoRotacion: data.reglamentoRotacion !== undefined ? data.reglamentoRotacion.trim() : antesData.reglamentoRotacion,
      bannerNombre: bannerFile ? bannerFile.originalname : (data.eliminarBanner ? "" : antesData.bannerNombre),
      documentoNombre: docFile ? docFile.originalname : (data.eliminarDocumento ? "" : antesData.documentoNombre),
    };

    const camposRes = [
      { key: "nombre", label: "Nombre de la residencia" },
      { key: "categoria", label: "Categoría institucional" },
      { key: "convocatoria", label: "Estado de convocatoria" },
      { key: "fechaInicio", label: "Fecha de inicio / apertura" },
      { key: "fechaConvocatoria", label: "Fecha límite / examen" },
      { key: "duracion", label: "Duración" },
      { key: "cupos", label: "Cupos" },
      { key: "descripcion", label: "Resumen breve" },
      { key: "descripcionPrograma", label: "Programa académico" },
      { key: "requisitos", label: "Requisitos de postulación", tipo: "list" },
      { key: "reglamentoRotacion", label: "Leyenda de reglamento" },
      { key: "bannerNombre", label: "Imagen de banner" },
      { key: "documentoNombre", label: "Documento adjunto" },
    ];

    const todosCambios = calcularCambios(antesData, despuesData, camposRes);
    const estadoCambio = Boolean(data.estado && data.estado.toUpperCase() !== estadoAnterior);
    const bannerModificado = Boolean(bannerFile || data.eliminarBanner === "true" || data.eliminarBanner === true);
    const docModificado = Boolean(docFile || data.eliminarDocumento === "true" || data.eliminarDocumento === true);
    const fechaPubAnterior = contenidoPrevio.fechaPublicacion || null;
    const fechaPubNueva = data.fechaPublicacion !== undefined ? (data.fechaPublicacion || null) : fechaPubAnterior;
    const fechaPubCambio = fechaPubAnterior !== fechaPubNueva;

    if (todosCambios.length === 0 && !estadoCambio && !bannerModificado && !docModificado && !fechaPubCambio) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    if (estadoNormalizado === "PENDIENTE_APROBACION") {
      const nuevosCambios = todosCambios;
      const cambiosPrevios = (metaExistente?.cambios) || [];
      const cambiosCombinados = combinarCambios(cambiosPrevios, nuevosCambios);
      const esActualizacion = provieneDePublicada || Boolean(metaExistente?.esActualizacion);

      let snapshotPublico = metaExistente?.snapshotPublico || null;
      if (provieneDePublicada && !snapshotPublico) {
        snapshotPublico = {
          nombre: residenciaExistente.nombre,
          descripcion: residenciaExistente.descripcion,
          contenido: residenciaExistente.contenido,
          imagenId: residenciaExistente.imagenId,
          convocatoria: residenciaExistente.convocatoria,
          fechaConvocatoria: residenciaExistente.fechaConvocatoria,
          archivo: residenciaExistente.archivo,
        };
      }

      await this.guardarPendingMeta(idStr, {
        previousEstado: provieneDePublicada ? "PUBLICADO" : (metaExistente?.previousEstado || null),
        targetEstado,
        snapshotPublico,
        editor: editorNombre,
        updatedAt: nowIso,
        cambios: cambiosCombinados,
        esActualizacion,
      });
      await this.limpiarMotivoRechazo(idStr);
    }

    await this.guardarEditorMeta(idStr, {
      editor: editorNombre,
      updatedAt: nowIso,
    });

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

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "residencia",
            entidadId: idStr,
            accion: "MODIFICAR",
            descripcion: `Actualización de residencia "${actualizada.nombre}".`,
          },
        });
      }
    } catch (_) {}

    const pendingMetaActual = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const motivoActual = (await this.obtenerMapaMotivosRechazo()).get(idStr) || null;

    let mensaje = "Residencia actualizada con éxito.";
    if (targetEstado === "ARCHIVADO" && estadoNormalizado === "PENDIENTE_APROBACION") {
      mensaje = "Solicitud de archivado enviada a revisión del administrador.";
    } else if (estadoNormalizado === "PENDIENTE_APROBACION" && provieneDePublicada) {
      mensaje = "Modificaciones enviadas a revisión del administrador.";
    }

    return {
      message: mensaje,
      residencia: this._formatResidencia(actualizada, motivoActual, pendingMetaActual, editorNombre, nowIso),
    };
  }

  async cambiarEstado(id, nuevoEstado, user = null, rejectionReason = null) {
    if (!nuevoEstado) {
      const error = new Error("El nuevo estado es obligatorio.");
      error.statusCode = 400;
      throw error;
    }

    const estadoUpper = nuevoEstado.trim().toUpperCase();
    const estadosValidos = ["PUBLICADO", "BORRADOR", "ARCHIVADO", "APROBADO", "RECHAZADO", "PENDIENTE_APROBACION", "PROGRAMADO"];

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
    // 2. Si el Admin aprueba la residencia (APROBADO, PUBLICADO o PROGRAMADO):
    else if (estadoUpper === "APROBADO" || estadoUpper === "PUBLICADO" || estadoUpper === "PROGRAMADO") {
      if (metaExistente?.targetEstado === "ARCHIVADO") {
        finalEstado = "ARCHIVADO";
        finalActivo = false;
      } else {
        let contenidoParsed = {};
        if (residenciaExistente.contenido) {
          try {
            contenidoParsed = JSON.parse(residenciaExistente.contenido);
          } catch (_) {}
        }
        const ahora = new Date();
        const fechaPub = contenidoParsed.fechaPublicacion ? new Date(contenidoParsed.fechaPublicacion) : null;
        const tieneProgramacionFutura =
          (metaExistente?.targetEstado === "PROGRAMADO" || estadoUpper === "PROGRAMADO") &&
          fechaPub &&
          fechaPub > ahora;

        finalEstado = tieneProgramacionFutura ? "PROGRAMADO" : "PUBLICADO";
        finalActivo = true;
      }
      if (metaExistente?.editor && metaExistente.editor !== "Editor CMS") {
        await this.guardarEditorMeta(idStr, {
          editor: metaExistente.editor,
          updatedAt: metaExistente.updatedAt || new Date().toISOString(),
        });
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

    try {
      if (user) {
        const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
        await prisma.auditoria.create({
          data: {
            usuarioId: usuarioLocal.id,
            entidad: "residencia",
            entidadId: idStr,
            accion:
              finalEstado === "RECHAZADO"
                ? "RECHAZAR"
                : finalEstado === "ARCHIVADO"
                ? "DESACTIVAR"
                : "APROBAR",
            descripcion:
              finalEstado === "RECHAZADO"
                ? `Residencia "${residenciaExistente.nombre}" rechazada. Motivo: ${motivoGuardado}`
                : `Residencia "${residenciaExistente.nombre}" evaluada como ${finalEstado}.`,
          },
        });
      }
    } catch (_) {}

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

  // Lo ejecuta el cron de server.js cada minuto. Los errores se propagan para que el cron los informe.
  async publicarResidenciasProgramadas() {
    const limite = limitePublicacionProgramada();
    const programadas = await prisma.residencia.findMany({
      where: { estado: "PROGRAMADO" },
    });

    for (const res of programadas) {
      let fechaPub = null;
      if (res.contenido) {
        try {
          const parsed = JSON.parse(res.contenido);
          if (parsed.fechaPublicacion) {
            fechaPub = new Date(parsed.fechaPublicacion);
          }
        } catch (_) {}
      }

      if (fechaPub && fechaPub <= limite) {
        await prisma.residencia.update({
          where: { id: res.id },
          data: {
            estado: "PUBLICADO",
            activo: true,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  _formatResidencia(res, motivoRechazo = null, pendingMeta = null, editor = null, updatedAtCustom = null) {
    let extra = {
      categoria: "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      descripcionPrograma: "",
      cupos: "",
      duracion: "",
      requisitos: "",
      reglamentoRotacion: "",
      fechaInicio: "",
      fechaPublicacion: null,
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

    const editorResolved = editor || pendingMeta?.editor || "Editor CMS";
    const rawUpdatedAt = updatedAtCustom || pendingMeta?.updatedAt || res.updatedAt || res.createdAt;
    let fechaActualizacion = "Reciente";
    if (rawUpdatedAt) {
      try {
        const d = new Date(rawUpdatedAt);
        if (!isNaN(d.getTime())) {
          fechaActualizacion = d.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      } catch (_) {}
    }

    let fechaCarga = "Reciente";
    if (res.createdAt) {
      try {
        const d = new Date(res.createdAt);
        if (!isNaN(d.getTime())) {
          fechaCarga = d.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      } catch (_) {}
    }

    const cambios = pendingMeta?.cambios ? cambiosParaCliente(pendingMeta.cambios) : [];
    const esActualizacion = Boolean(pendingMeta?.esActualizacion);

    return {
      id: res.id.toString(),
      nombre: res.nombre,
      descripcion: res.descripcion || "",
      convocatoria: res.convocatoria || "Convocatoria Abierta",
      fechaInicio: extra.fechaInicio || "",
      fechaInicioVigencia: extra.fechaInicio || "",
      fechaConvocatoria: res.fechaConvocatoria
        ? res.fechaConvocatoria.toISOString().split("T")[0]
        : "",
      fechaPublicacion: extra.fechaPublicacion || null,
      fechaProgramada: extra.fechaPublicacion || null,
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

      editor: editorResolved,
      fechaActualizacion,
      fechaCarga,
      cambios,
      esActualizacion,

      requestedEstado: (res.estado || "").toUpperCase() === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
      motivoRechazo: motivoRechazo || null,
      rejectionReason: motivoRechazo || null,
    };
  }
}

export default new CmsResidenciaService();
