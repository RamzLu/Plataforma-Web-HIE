import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";

const REJECTION_KEY_PREFIX = "documento_rejection_";
const PENDING_META_KEY_PREFIX = "documento_pending_meta_";

class CmsDocService {
  async obtenerMapaMotivosRechazo() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: REJECTION_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(REJECTION_KEY_PREFIX, "");
        map.set(itemKey, item.valor);
      }
      return map;
    } catch (_) {
      return new Map();
    }
  }

  async guardarMotivoRechazo(id, motivo) {
    const clave = `${REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: motivo, updatedAt: new Date() },
      create: {
        clave,
        valor: motivo,
        descripcion: `Motivo de rechazo para documento ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarMotivoRechazo(id) {
    const clave = `${REJECTION_KEY_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  async obtenerMapaPendingMeta() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: { clave: { startsWith: PENDING_META_KEY_PREFIX } },
      });
      const map = new Map();
      for (const item of configs) {
        const itemKey = item.clave.replace(PENDING_META_KEY_PREFIX, "");
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
    const clave = `${PENDING_META_KEY_PREFIX}${id}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: JSON.stringify(meta), updatedAt: new Date() },
      create: {
        clave,
        valor: JSON.stringify(meta),
        descripcion: `Metadatos de solicitud pendiente para documento ID ${id}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarPendingMeta(id) {
    const clave = `${PENDING_META_KEY_PREFIX}${id}`;
    await prisma.configuracion.deleteMany({ where: { clave } });
  }

  _format(doc, motivoRechazo = null, pendingMeta = null) {
    const pubUrl = doc.archivo
      ? supabase.storage.from("documentos").getPublicUrl(doc.archivo.nombreArchivo).data.publicUrl
      : "";

    const estadoUpper = (doc.estado || "PENDIENTE_APROBACION").toUpperCase();

    let statusMapped = "borrador";
    if (estadoUpper === "PUBLICADO") statusMapped = "publicado";
    else if (estadoUpper === "APROBADO") statusMapped = "aprobado";
    else if (estadoUpper === "PENDIENTE_APROBACION") statusMapped = "pendiente";
    else if (estadoUpper === "RECHAZADO") statusMapped = "rechazado";
    else if (estadoUpper === "PROGRAMADO") statusMapped = "programado";
    else if (estadoUpper === "ARCHIVADO") statusMapped = "archivado";

    const creatorName = doc.usuario_documento_createdByTousuario
      ? `${doc.usuario_documento_createdByTousuario.nombre} ${doc.usuario_documento_createdByTousuario.apellido || ""}`.trim()
      : pendingMeta?.editor || "Editor CMS";

    const updaterName = doc.usuario_documento_updatedByTousuario
      ? `${doc.usuario_documento_updatedByTousuario.nombre} ${doc.usuario_documento_updatedByTousuario.apellido || ""}`.trim()
      : null;

    return {
      id: doc.id.toString(),
      title: doc.titulo,
      description: doc.descripcion || "",
      category: doc.categoria_documento?.nombre || "Información institucional",
      status: statusMapped,
      estado: estadoUpper,
      creator: creatorName,
      editor: creatorName,
      editedBy: updaterName,
      fileName: doc.archivo?.nombreOriginal || "",
      fileType: doc.archivo?.extension ? doc.archivo.extension.toUpperCase() : "PDF",
      fileSize: doc.archivo?.tamanioBytes
        ? `${(Number(doc.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB`
        : "",
      fileUrl: pubUrl,
      rejectionReason: motivoRechazo,
      requestedEstado: pendingMeta?.targetEstado || null,
      previousEstado: pendingMeta?.previousEstado || null,
      cambios: estadoUpper === "PENDIENTE_APROBACION" ? cambiosParaCliente(pendingMeta?.cambios) : [],
      esActualizacion: estadoUpper === "PENDIENTE_APROBACION" && Boolean(pendingMeta?.esActualizacion),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || doc.createdAt,
    };
  }

  async obtenerDocumentos(esVistaAdmin = false) {
    if (!esVistaAdmin) {
      // Vista pública: documentos con estado PUBLICADO, o snapshots de documentos publicados en revisión
      const [documentosPublicos, pendingMetaMap] = await Promise.all([
        prisma.documento.findMany({
          where: { estado: { in: ["PUBLICADO", "PENDIENTE_APROBACION"] } },
          orderBy: { createdAt: "desc" },
          include: {
            archivo: true,
            categoria_documento: true,
            usuario_documento_createdByTousuario: true,
            usuario_documento_updatedByTousuario: true,
          },
        }),
        this.obtenerMapaPendingMeta(),
      ]);

      const lista = [];
      for (const doc of documentosPublicos) {
        if (doc.estado === "PUBLICADO") {
          lista.push(this._format(doc));
        } else if (doc.estado === "PENDIENTE_APROBACION") {
          const meta = pendingMetaMap.get(doc.id.toString());
          if (meta?.snapshotPublico) {
            lista.push({
              id: doc.id.toString(),
              title: meta.snapshotPublico.titulo || doc.titulo,
              description: meta.snapshotPublico.descripcion || doc.descripcion || "",
              category: meta.snapshotPublico.category || doc.categoria_documento?.nombre || "Información institucional",
              status: "publicado",
              estado: "PUBLICADO",
              creator: meta.editor || "Editor CMS",
              editor: meta.editor || "Editor CMS",
              editedBy: null,
              fileName: meta.snapshotPublico.fileName || doc.archivo?.nombreOriginal || "",
              fileType: meta.snapshotPublico.fileType || (doc.archivo?.extension ? doc.archivo.extension.toUpperCase() : "PDF"),
              fileSize: meta.snapshotPublico.fileSize || (doc.archivo?.tamanioBytes ? `${(Number(doc.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB` : ""),
              fileUrl: meta.snapshotPublico.fileUrl || (doc.archivo ? supabase.storage.from("documentos").getPublicUrl(doc.archivo.nombreArchivo).data.publicUrl : ""),
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt || doc.createdAt,
            });
          }
        }
      }
      return lista;
    }

    // Vista interna de gestión (Admin o CMS)
    const [documentos, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.documento.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          archivo: true,
          categoria_documento: true,
          usuario_documento_createdByTousuario: true,
          usuario_documento_updatedByTousuario: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    return documentos.map((doc) => {
      const idStr = doc.id.toString();
      const motivo = motivosMap.get(idStr) || null;
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      return this._format(doc, motivo, pendingMeta);
    });
  }

  async crearDocumento(data, archivoSubido, user) {
    const { titulo, descripcion, categoria, estado } = data;

    if (!titulo || !archivoSubido) {
      const error = new Error("El título y el archivo son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    const estadoSolicitado = estado ? estado.toUpperCase() : "PUBLICADO";
    // Si el CM solicita 'BORRADOR', se guarda como borrador.
    // De lo contrario, pasa obligatoriamente por aprobación del administrador: PENDIENTE_APROBACION.
    const estadoFinal =
      estadoSolicitado === "BORRADOR" ? "BORRADOR" : "PENDIENTE_APROBACION";

    let categoriaDb = await prisma.categoria_documento.findFirst({
      where: { nombre: { equals: categoria || "Información institucional", mode: "insensitive" } },
    });
    if (!categoriaDb) {
      categoriaDb = await prisma.categoria_documento.create({
        data: {
          nombre: categoria || "Información institucional",
          descripcion: "Generada automáticamente",
          activo: true,
        },
      });
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
    const { nombreUnico, extension } = generarNombreUnico(archivoSubido.originalname, "doc");

    const { error: storageError } = await supabase.storage
      .from("documentos")
      .upload(nombreUnico, archivoSubido.buffer, {
        contentType: archivoSubido.mimetype,
        upsert: true,
      });

    if (storageError) {
      console.error("Error subiendo documento a Supabase:", storageError.message);
      const error = new Error("No se pudo almacenar el documento.");
      error.statusCode = 500;
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("documentos")
      .getPublicUrl(nombreUnico);

    const archivoDb = await prisma.archivo.create({
      data: {
        nombreOriginal: archivoSubido.originalname,
        nombreArchivo: nombreUnico,
        ruta: `documentos/${nombreUnico}`,
        extension,
        mimeType: archivoSubido.mimetype,
        tamanioBytes: BigInt(archivoSubido.size),
      },
    });

    const nuevoDocumento = await prisma.documento.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        categoriaId: categoriaDb.id,
        archivoId: archivoDb.id,
        createdBy: usuarioLocal.id,
        estado: estadoFinal,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
        categoria_documento: true,
        usuario_documento_createdByTousuario: true,
      },
    });

    const idStr = nuevoDocumento.id.toString();
    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";

    if (estadoFinal === "PENDIENTE_APROBACION") {
      await this.guardarPendingMeta(idStr, {
        previousEstado: null,
        targetEstado: "PUBLICADO",
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
        snapshotPublico: null,
      });
    }

    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Documento enviado a revisión del administrador para su aprobación."
          : "Documento guardado como borrador con éxito.",
      documento: {
        ...this._format(nuevoDocumento, null, { editor: editorNombre }),
        fileUrl: publicUrlData.publicUrl,
      },
    };
  }

  async actualizarDocumento(id, data, archivoSubido, user) {
    const idBigInt = parsearIdBigInt(id, "ID de documento");
    const idStr = id.toString();
    const { titulo, descripcion, categoria, estado } = data;

    const docExistente = await prisma.documento.findUnique({
      where: { id: idBigInt },
      include: {
        archivo: true,
        categoria_documento: true,
        usuario_documento_createdByTousuario: true,
        usuario_documento_updatedByTousuario: true,
      },
    });

    if (!docExistente) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const estadoAnterior = (docExistente.estado || "").toUpperCase();
    const provieneDePublicada =
      estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO";
    const estadoSolicitado = estado ? estado.toUpperCase() : estadoAnterior;

    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";
    const usuarioLocal = user ? await obtenerOCrearUsuarioLocal(user) : null;

    // Preservar snapshot si estaba publicado para no romper la visualización pública mientras se revisa
    const metaMap = await this.obtenerMapaPendingMeta();
    const metaExistente = metaMap.get(idStr) || null;
    let snapshotPublico = metaExistente?.snapshotPublico || null;

    if (provieneDePublicada && !snapshotPublico) {
      const pubUrlAnterior = docExistente.archivo
        ? supabase.storage.from("documentos").getPublicUrl(docExistente.archivo.nombreArchivo).data.publicUrl
        : "";

      snapshotPublico = {
        titulo: docExistente.titulo,
        descripcion: docExistente.descripcion || "",
        category: docExistente.categoria_documento?.nombre || "Información institucional",
        fileName: docExistente.archivo?.nombreOriginal || "",
        fileType: docExistente.archivo?.extension ? docExistente.archivo.extension.toUpperCase() : "PDF",
        fileSize: docExistente.archivo?.tamanioBytes
          ? `${(Number(docExistente.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB`
          : "",
        fileUrl: pubUrlAnterior,
      };
    }

    // Validación: verificar si hubo cambios antes de procesar archivos o base de datos
    const catAnteriorNombre = docExistente.categoria_documento?.nombre || "Información institucional";
    const catNuevaNombre = categoria ? categoria.trim() : catAnteriorNombre;

    const camposDocCheck = [
      { key: "titulo", label: "Título del documento" },
      { key: "descripcion", label: "Descripción" },
      { key: "categoria", label: "Categoría" },
    ];
    const cambiosDoc = calcularCambios(
      {
        titulo: docExistente.titulo,
        descripcion: docExistente.descripcion || "",
        categoria: catAnteriorNombre,
      },
      {
        titulo: titulo !== undefined ? titulo.trim() : docExistente.titulo,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : "") : (docExistente.descripcion || ""),
        categoria: catNuevaNombre,
      },
      camposDocCheck
    );
    const estadoCambioDoc = Boolean(estado && estado.toUpperCase() !== estadoAnterior);

    if (cambiosDoc.length === 0 && !archivoSubido && !estadoCambioDoc) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    let estadoFinal = "PENDIENTE_APROBACION";
    if (estadoSolicitado === "BORRADOR" && !provieneDePublicada) {
      estadoFinal = "BORRADOR";
      await this.limpiarPendingMeta(idStr);
      await this.limpiarMotivoRechazo(idStr);
    } else {
      estadoFinal = "PENDIENTE_APROBACION";
      await this.guardarPendingMeta(idStr, {
        previousEstado: provieneDePublicada ? "PUBLICADO" : estadoAnterior,
        targetEstado: "PUBLICADO",
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
        snapshotPublico,
      });
      await this.limpiarMotivoRechazo(idStr);
    }

    let categoriaId = docExistente.categoriaId;
    if (categoria) {
      let categoriaDb = await prisma.categoria_documento.findFirst({
        where: { nombre: { equals: categoria, mode: "insensitive" } },
      });
      if (!categoriaDb) {
        categoriaDb = await prisma.categoria_documento.create({
          data: {
            nombre: categoria,
            descripcion: "Generada automáticamente",
            activo: true,
          },
        });
      }
      categoriaId = categoriaDb.id;
    }

    let archivoId = docExistente.archivoId;
    let oldArchivoIdAEliminar = null;

    if (archivoSubido) {
      const { nombreUnico, extension } = generarNombreUnico(archivoSubido.originalname, "doc");

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, archivoSubido.buffer, {
          contentType: archivoSubido.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo archivo nuevo a Supabase:", storageError.message);
        const error = new Error("No se pudo almacenar el nuevo documento.");
        error.statusCode = 500;
        throw error;
      }

      const nuevoArchivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: archivoSubido.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension,
          mimeType: archivoSubido.mimetype,
          tamanioBytes: BigInt(archivoSubido.size),
        },
      });

      archivoId = nuevoArchivoDb.id;

      // Si no proviene de publicada (por ejemplo era un borrador o rechazado), podemos borrar el archivo anterior
      if (!provieneDePublicada && docExistente.archivo) {
        await supabase.storage.from("documentos").remove([docExistente.archivo.nombreArchivo]);
        oldArchivoIdAEliminar = docExistente.archivoId;
      }
    }

    const documentoActualizado = await prisma.documento.update({
      where: { id: idBigInt },
      data: {
        titulo: titulo !== undefined ? titulo.trim() : docExistente.titulo,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : docExistente.descripcion,
        categoriaId,
        archivoId,
        estado: estadoFinal,
        updatedBy: usuarioLocal ? usuarioLocal.id : docExistente.updatedBy,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
        categoria_documento: true,
        usuario_documento_createdByTousuario: true,
        usuario_documento_updatedByTousuario: true,
      },
    });

    if (oldArchivoIdAEliminar) {
      try {
        await prisma.archivo.delete({ where: { id: oldArchivoIdAEliminar } });
      } catch (_) {}
    }

    // Detección automática de cambios para la revisión del Admin
    if (estadoFinal === "PENDIENTE_APROBACION") {
      const nuevosCambios = calcularCambios(
        {
          titulo: docExistente.titulo,
          descripcion: docExistente.descripcion,
          categoria: docExistente.categoria_documento?.nombre || "Información institucional",
          archivo: docExistente.archivo?.nombreOriginal || "",
        },
        {
          titulo: documentoActualizado.titulo,
          descripcion: documentoActualizado.descripcion,
          categoria: documentoActualizado.categoria_documento?.nombre || "Información institucional",
          archivo: archivoSubido
            ? `${documentoActualizado.archivo?.nombreOriginal || "Archivo"} (nuevo archivo)`
            : documentoActualizado.archivo?.nombreOriginal || "",
        },
        [
          { key: "titulo", label: "Título" },
          { key: "descripcion", label: "Descripción" },
          { key: "categoria", label: "Categoría" },
          { key: "archivo", label: "Archivo adjunto" },
        ]
      );
      const cambiosPrevios =
        estadoAnterior === "PENDIENTE_APROBACION" ? metaExistente?.cambios || [] : [];
      const metaGuardada = (await this.obtenerMapaPendingMeta()).get(idStr) || {};
      await this.guardarPendingMeta(idStr, {
        ...metaGuardada,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      });
    }

    return {
      message:
        estadoFinal === "PENDIENTE_APROBACION"
          ? "Modificaciones enviadas a revisión del administrador."
          : "Documento actualizado como borrador con éxito.",
      documento: this._format(documentoActualizado, null, { editor: editorNombre }),
    };
  }

  async evaluarDocumento(id, payload, user) {
    const idBigInt = parsearIdBigInt(id, "ID de documento");
    const idStr = id.toString();
    const { estado, rejectionReason } = payload;

    if (!estado) {
      const error = new Error("Debe indicar el estado de evaluación.");
      error.statusCode = 400;
      throw error;
    }

    const existente = await prisma.documento.findUnique({
      where: { id: idBigInt },
      include: {
        archivo: true,
        categoria_documento: true,
        usuario_documento_createdByTousuario: true,
      },
    });

    if (!existente) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // El administrador únicamente puede aprobar o rechazar documentos que estén pendientes
    if (existente.estado !== "PENDIENTE_APROBACION") {
      const error = new Error("Solo se pueden aprobar o rechazar documentos que estén pendientes de aprobación.");
      error.statusCode = 400;
      throw error;
    }

    const estadoUpper = estado.toUpperCase();
    if (estadoUpper !== "APROBADO" && estadoUpper !== "PUBLICADO" && estadoUpper !== "RECHAZADO") {
      const error = new Error(
        "Acción no permitida: el administrador únicamente puede aprobar o rechazar el documento."
      );
      error.statusCode = 400;
      throw error;
    }

    let nuevoEstado = existente.estado;
    let motivoGuardado = null;

    if (estadoUpper === "RECHAZADO") {
      if (!rejectionReason || !rejectionReason.trim()) {
        const error = new Error("Debe especificar un motivo de rechazo.");
        error.statusCode = 400;
        throw error;
      }
      nuevoEstado = "RECHAZADO";
      motivoGuardado = rejectionReason.trim();
      await this.guardarMotivoRechazo(idStr, motivoGuardado);
    } else {
      // APROBADO o PUBLICADO -> pasa a estar publicado en el portal
      nuevoEstado = "PUBLICADO";
      await this.limpiarMotivoRechazo(idStr);
      await this.limpiarPendingMeta(idStr);
    }

    const actualizado = await prisma.documento.update({
      where: { id: idBigInt },
      data: {
        estado: nuevoEstado,
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
        categoria_documento: true,
        usuario_documento_createdByTousuario: true,
        usuario_documento_updatedByTousuario: true,
      },
    });

    // Registrar auditoría
    try {
      const usuarioAdmin = await obtenerOCrearUsuarioLocal(user);
      await prisma.auditoria.create({
        data: {
          usuarioId: usuarioAdmin.id,
          entidad: "documento",
          entidadId: idStr,
          accion: nuevoEstado === "RECHAZADO" ? "RECHAZAR" : "APROBAR",
          descripcion:
            nuevoEstado === "RECHAZADO"
              ? `Documento "${existente.titulo}" rechazado. Motivo: ${motivoGuardado}`
              : `Documento "${existente.titulo}" aprobado y publicado.`,
        },
      });
    } catch (_) {}

    return {
      message:
        nuevoEstado === "RECHAZADO"
          ? "Documento rechazado con éxito."
          : "Documento aprobado y publicado con éxito.",
      documento: this._format(actualizado, motivoGuardado),
    };
  }

  async eliminarDocumento(id) {
    const idBigInt = parsearIdBigInt(id, "ID de documento");
    const idStr = id.toString();

    const doc = await prisma.documento.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!doc) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    await this.limpiarPendingMeta(idStr);
    await this.limpiarMotivoRechazo(idStr);

    if (doc.archivo) {
      await supabase.storage.from("documentos").remove([doc.archivo.nombreArchivo]);
    }

    await prisma.documento.delete({ where: { id: idBigInt } });

    if (doc.archivoId) {
      try {
        await prisma.archivo.delete({ where: { id: doc.archivoId } });
      } catch (_) {}
    }

    return { message: "Documento eliminado con éxito" };
  }
}

export default new CmsDocService();
