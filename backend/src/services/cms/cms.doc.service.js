import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { registrarFalla } from "../../utils/log.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { nombreDeUsuario, obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { tieneVersionPublica, conservaVersionPublica, tieneEdicionPendiente, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { eliminarArchivosReemplazados, refDeArchivo, refDesdeUrl } from "../../utils/archivos.utils.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado, fuePublico } from "../../utils/flujoEditorial.utils.js";

const metaEditorial = crearMetaEditorial({ entidad: "documento", modelos: { "": "documento" } });

class CmsDocService {
  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  guardarMotivoRechazo(id, motivo) { return metaEditorial.guardarMotivoRechazo(id, motivo); }
  limpiarMotivoRechazo(id) { return metaEditorial.limpiarMotivoRechazo(id); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  guardarPendingMeta(id, meta) { return metaEditorial.guardarPendingMeta(id, meta); }
  limpiarPendingMeta(id) { return metaEditorial.limpiarPendingMeta(id); }

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

    const creatorName = doc.creador
      ? nombreDeUsuario(doc.creador)
      : pendingMeta?.editor || "Editor CMS";

    const updaterName = doc.editor
      ? nombreDeUsuario(doc.editor)
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
          where: { estado: { in: ["PUBLICADO", "PENDIENTE_APROBACION", "RECHAZADO"] } },
          orderBy: { createdAt: "desc" },
          include: {
            archivo: true,
            categoria_documento: true,
            creador: true,
            editor: true,
          },
        }),
        this.obtenerMapaPendingMeta(),
      ]);

      const lista = [];
      for (const doc of documentosPublicos) {
        if (doc.estado === "PUBLICADO") {
          lista.push(this._format(doc));
        } else if (doc.estado === "PENDIENTE_APROBACION" || doc.estado === "RECHAZADO") {
          // Edición en revisión o rechazada: el portal sigue mostrando la versión publicada anterior.
          const meta = pendingMetaMap.get(doc.id.toString());
          if (conservaVersionPublica(doc, meta)) {
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
          creador: true,
          editor: true,
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

    // Regla común (utils/flujoEditorial.utils.js). Sin estado, el CMS de documentos pide publicar.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(estado || "PUBLICADO"),
    });
    const estadoFinal = solicitud.estado;

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
        creador: true,
      },
    });

    const idStr = nuevoDocumento.id.toString();
    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";

    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
      });
    }

    await registrarAuditoria(user, { entidad: "documento", id: nuevoDocumento.id, accion: ACCIONES.CREAR, descripcion: `Creó el documento "${nuevoDocumento.titulo}".` });
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
        creador: true,
        editor: true,
      },
    });

    if (!docExistente) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const estadoAnterior = (docExistente.estado || "").toUpperCase();
    const estadoSolicitado = estado ? estado.toUpperCase() : estadoAnterior;

    const editorNombre = user?.name || user?.preferred_username || "Editor CMS";
    const usuarioLocal = user ? await obtenerOCrearUsuarioLocal(user) : null;

    // Preservar snapshot si estaba publicado para no romper la visualización pública mientras se revisa
    const metaMap = await this.obtenerMapaPendingMeta();
    const metaExistente = metaMap.get(idStr) || null;
    // Es o fue público (también una edición rechazada de algo publicado): sus archivos se conservan.
    const provieneDePublicada = fuePublico(estadoAnterior, metaExistente);
    const armarSnapshotPublico = () => {
      const pubUrlAnterior = docExistente.archivo
        ? supabase.storage.from("documentos").getPublicUrl(docExistente.archivo.nombreArchivo).data.publicUrl
        : "";

      return {
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
    };

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

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público pasa por el administrador
    // (incluido despublicarlo) y el portal sigue mostrando la versión publicada mientras tanto.
    const solicitud = resolverSolicitud({
      estadoActual: estadoAnterior,
      meta: metaExistente,
      intencion: intencionDesdeEstado(estadoSolicitado),
      snapshotActual: armarSnapshotPublico,
    });
    const estadoFinal = solicitud.estado;
    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, {
        ...solicitud.meta,
        editor: editorNombre,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await this.limpiarPendingMeta(idStr);
    }
    if (solicitud.limpiarMotivo) {
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
        creador: true,
        editor: true,
      },
    });

    if (oldArchivoIdAEliminar) {
      try {
        await prisma.archivo.delete({ where: { id: oldArchivoIdAEliminar } });
      } catch (error) {
        registrarFalla("Archivos", error);
      }
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
      // Los cambios se acumulan contra la versión pública mientras la edición siga viva: si el Admin la rechazó y el CM
      // la vuelve a editar, lo que ya se había modificado (por ejemplo el título) tiene que seguir apareciendo.
      const cambiosPrevios = metaExistente?.cambios || [];
      const metaGuardada = (await this.obtenerMapaPendingMeta()).get(idStr) || {};
      await this.guardarPendingMeta(idStr, {
        ...metaGuardada,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      });
    }

    await limpiarSolicitudEliminacion("documento", idStr); // editar después de pedir la baja anula el pedido
    await registrarAuditoria(user, { entidad: "documento", id: idStr, accion: ACCIONES.MODIFICAR, descripcion: `Modificó el documento "${documentoActualizado.titulo}".` });
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
        creador: true,
      },
    });

    if (!existente) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido
    // (publicar o despublicar); rechazar exige motivo y conserva la versión publicada si la había.
    const pendingMeta = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    const revision = resolverRevision({
      estadoActual: existente.estado,
      meta: pendingMeta,
      decision: decisionDesdeEstado(estado),
      motivo: rejectionReason,
    });
    const nuevoEstado = revision.estado;
    const motivoGuardado = revision.motivo;

    if (revision.motivo) {
      await this.guardarMotivoRechazo(idStr, revision.motivo);
    } else {
      await this.limpiarMotivoRechazo(idStr);
    }
    if (revision.meta === null) {
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
        creador: true,
        editor: true,
      },
    });

    // Aprobada la edición, el archivo de la versión pública anterior que ya no se usa se borra.
    if (nuevoEstado !== "RECHAZADO" && pendingMeta?.snapshotPublico) {
      await eliminarArchivosReemplazados({
        anteriores: [refDesdeUrl(pendingMeta.snapshotPublico.fileUrl)],
        vigentes: [refDeArchivo(actualizado.archivo)],
      });
    }

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
              : `Documento "${existente.titulo}" aprobado (estado resultante: ${nuevoEstado}).`,
        },
      });
    } catch (error) {
      registrarFalla("Auditoría", error);
    }

    return {
      message:
        nuevoEstado === "RECHAZADO"
          ? "Documento rechazado con éxito."
          : nuevoEstado === "BORRADOR"
          ? "Solicitud aprobada: el documento se retiró del portal y quedó como borrador."
          : "Documento aprobado y publicado con éxito.",
      documento: this._format(actualizado, motivoGuardado),
    };
  }

  async eliminarDocumento(id, { user = null, forzar = false } = {}) {
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

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(idStr) || null;
    if (!forzar && tieneVersionPublica(doc, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(doc, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.documento.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(idStr, MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "documento", id: idStr, titulo: doc.titulo, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("documento", idStr);

    await this.limpiarPendingMeta(idStr);
    await this.limpiarMotivoRechazo(idStr);

    if (doc.archivo) {
      await supabase.storage.from("documentos").remove([doc.archivo.nombreArchivo]);
    }

    await prisma.documento.delete({ where: { id: idBigInt } });

    if (doc.archivoId) {
      try {
        await prisma.archivo.delete({ where: { id: doc.archivoId } });
      } catch (error) {
        registrarFalla("Archivos", error);
      }
    }

    await registrarAuditoria(user, { entidad: "documento", id: idStr, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó el documento "${doc.titulo}".` });
    return { message: "Documento eliminado con éxito" };
  }
}

export default new CmsDocService();
