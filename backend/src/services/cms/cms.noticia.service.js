import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { tieneVersionPublica, tieneEdicionPendiente, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { nombreDeUsuario, obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { sanitizarHtmlNoticia, parsearIdBigInt, parsearArregloJson } from "../../utils/sanitize.utils.js";
import { calcularCambios, combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { limitePublicacionProgramada } from "../../utils/programacion.utils.js";

const REJECTION_KEY_PREFIX = "noticia_rejection_";
const PENDING_META_KEY_PREFIX = "noticia_pending_meta_";
const metaEditorial = crearMetaEditorial({ entidad: "noticia", rechazo: REJECTION_KEY_PREFIX, pendiente: PENDING_META_KEY_PREFIX });

class CmsNoticiaService {
  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  obtenerMotivoRechazo(id) { return metaEditorial.obtenerMotivoRechazo(id); }
  guardarMotivoRechazo(id, motivo) { return metaEditorial.guardarMotivoRechazo(id, motivo); }
  limpiarMotivoRechazo(id) { return metaEditorial.limpiarMotivoRechazo(id); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  obtenerPendingMeta(id) { return metaEditorial.obtenerPendingMeta(id); }
  guardarPendingMeta(id, meta) { return metaEditorial.guardarPendingMeta(id, meta); }
  limpiarPendingMeta(id) { return metaEditorial.limpiarPendingMeta(id); }

  async crearNoticia(data, archivosSubidos, user) {
    const { titulo, estado, fechaPublicacion, categoriaNombre } = data;
    // El cuerpo es HTML que luego se muestra en el portal: se sanea antes de validarlo y guardarlo.
    const contenido = sanitizarHtmlNoticia(data.contenido);

    if (!titulo || !contenido) {
      const error = new Error("Faltan campos obligatorios: titulo y contenido.");
      error.statusCode = 400;
      throw error;
    }

    const estadoSolicitado = estado ? estado.toUpperCase() : "BORRADOR";
    // Cuando el CM crea una noticia nueva como BORRADOR queda en BORRADOR; si solicita publicar o programar pasa a PENDIENTE_APROBACION
    const estadoFinal =
      estadoSolicitado === "BORRADOR" ? "BORRADOR" : "PENDIENTE_APROBACION";

    let nombreCat = categoriaNombre || "General";
    if (nombreCat.toLowerCase() === "noticias" || nombreCat.toLowerCase() === "noticia") {
      nombreCat = "General";
    }

    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: nombreCat } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({
        data: { nombre: nombreCat, descripcion: `Clasificación ${nombreCat}` },
      });
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    const tieneFechaProgramada =
      (estadoSolicitado === "PROGRAMADO" || estadoSolicitado === "PENDIENTE_APROBACION") &&
      Boolean(fechaPublicacion);

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        categoriaId: categoria.id,
        createdBy: usuarioLocal.id,
        estado: estadoFinal,
        updatedAt: new Date(),
        ...(tieneFechaProgramada ? { fechaPublicacion: new Date(fechaPublicacion) } : {}),
      },
      include: {
        usuario_noticia_createdByTousuario: true,
        categoria_noticia: true,
      },
    });

    if (estadoFinal === "PENDIENTE_APROBACION") {
      const targetNormalizado = tieneFechaProgramada ? "PROGRAMADO" : "PUBLICADO";
      await this.guardarPendingMeta(nuevaNoticia.id.toString(), {
        previousEstado: null,
        targetEstado: targetNormalizado,
        snapshotPublico: null,
      });
    }

    const imagenesUrlsGuardadas = [];

    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "img");

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        console.error("Error al subir imagen de noticia a Supabase:", storageError.message);
        const error = new Error("No se pudo almacenar la imagen de la noticia.");
        error.statusCode = 500;
        throw error;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });

      await prisma.noticia_archivo.create({
        data: { noticiaId: nuevaNoticia.id, archivoId: archivoDb.id },
      });

      const { data: publicUrlData } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(nombreUnico);
      imagenesUrlsGuardadas.push(publicUrlData.publicUrl);
    }

    const editorNombre = nuevaNoticia.usuario_noticia_createdByTousuario
      ? nombreDeUsuario(nuevaNoticia.usuario_noticia_createdByTousuario)
      : "Editor CMS";

    const requestedEstado =
      estadoFinal === "PENDIENTE_APROBACION"
        ? tieneFechaProgramada
          ? "PROGRAMADO"
          : "PUBLICADO"
        : null;

    return {
      message: "Exito",
      noticia: {
        ...nuevaNoticia,
        id: nuevaNoticia.id.toString(),
        categoriaId: nuevaNoticia.categoriaId.toString(),
        category: nuevaNoticia.categoria_noticia.nombre,
        estado: nuevaNoticia.estado,
        requestedEstado,
        previousEstado: null,
        isDraft: nuevaNoticia.estado === "BORRADOR",
        images: imagenesUrlsGuardadas,
        editor: editorNombre,
        editedBy: null,
        rejectionReason: null,
      },
    };
  }

  async obtenerNoticias(esVistaAdmin = false) {
    const esConsultaInterna = esVistaAdmin === true;

    const [noticias, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.noticia.findMany({
        where: esConsultaInterna
          ? {}
          : {
              estado: {
                in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION", "RECHAZADO"],
              },
            },
        orderBy: { createdAt: "desc" },
        include: {
          usuario_noticia_createdByTousuario: true,
          usuario_noticia_updatedByTousuario: true,
          noticia_archivo: { include: { archivo: true } },
          categoria_noticia: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    const resultado = [];

    for (const noticia of noticias) {
      const idStr = noticia.id.toString();
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      const estadoUpper = (noticia.estado || "").toUpperCase();

      if (!esConsultaInterna) {
        const esPublicadaDirecta =
          estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO";
        const mantienePublicacionPrevia =
          (estadoUpper === "PENDIENTE_APROBACION" || estadoUpper === "RECHAZADO") &&
          (pendingMeta?.previousEstado === "PUBLICADO" ||
            pendingMeta?.previousEstado === "APROBADO") &&
          Boolean(pendingMeta?.snapshotPublico);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          continue;
        }

        if (mantienePublicacionPrevia) {
          const snap = pendingMeta.snapshotPublico;
          const editorNombreSnap = noticia.usuario_noticia_createdByTousuario
            ? nombreDeUsuario(noticia.usuario_noticia_createdByTousuario)
            : "Editor CMS";

          resultado.push({
            id: idStr,
            title: snap.titulo,
            titulo: snap.titulo,
            body: [snap.contenido],
            contenido: snap.contenido,
            date: new Date(noticia.createdAt).toLocaleDateString("es-AR"),
            fechaPublicacion: noticia.fechaPublicacion,
            createdAt: noticia.createdAt,
            updatedAt: noticia.updatedAt,
            category: snap.category || "General",
            estado: "PUBLICADO",
            isDraft: false,
            images: snap.images || [],
            editor: editorNombreSnap,
            editedBy: null,
            rejectionReason: null,
          });
          continue;
        }
      }

      const imgs = noticia.noticia_archivo.map((na) => {
        const { data } = supabase.storage
          .from("noticias-imagenes")
          .getPublicUrl(na.archivo.nombreArchivo);
        return data.publicUrl;
      });

      const editorNombre = noticia.usuario_noticia_createdByTousuario
        ? nombreDeUsuario(noticia.usuario_noticia_createdByTousuario)
        : "Editor CMS";

      const editadoPorNombre = noticia.usuario_noticia_updatedByTousuario
        ? nombreDeUsuario(noticia.usuario_noticia_updatedByTousuario)
        : null;

      let catName = noticia.categoria_noticia ? noticia.categoria_noticia.nombre : "General";
      if (catName.toLowerCase() === "noticias" || catName.toLowerCase() === "noticia") {
        catName = "General";
      }

      resultado.push({
        id: idStr,
        title: noticia.titulo,
        titulo: noticia.titulo,
        body: [noticia.contenido],
        contenido: noticia.contenido,
        date: new Date(noticia.createdAt).toLocaleDateString("es-AR"),
        fechaPublicacion: noticia.fechaPublicacion,
        createdAt: noticia.createdAt,
        updatedAt: noticia.updatedAt,
        category: catName,
        estado: noticia.estado,
        requestedEstado:
          estadoUpper === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
        previousEstado: pendingMeta?.previousEstado || null,
        isDraft: noticia.estado === "BORRADOR",
        images: imgs,
        editor: editorNombre,
        editedBy: editadoPorNombre,
        rejectionReason: motivosMap.get(idStr) || null,
        cambios:
          estadoUpper === "PENDIENTE_APROBACION" ? cambiosParaCliente(pendingMeta?.cambios) : [],
        esActualizacion:
          estadoUpper === "PENDIENTE_APROBACION" && Boolean(pendingMeta?.esActualizacion),
      });
    }

    // El portal público no necesita saber quién editó cada registro: no se envían nombres del equipo.
    if (!esConsultaInterna) {
      return resultado.map(({ editor, editedBy, ...publico }) => publico);
    }
    return resultado;
  }

  async eliminarNoticia(id, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const noticia = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticia) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(id.toString()) || null;
    if (!forzar && tieneVersionPublica(noticia, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(noticia, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.noticia.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(id.toString(), MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "noticia", id: id.toString(), titulo: noticia.titulo, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("noticia", id.toString());

    for (const na of noticia.noticia_archivo) {
      await supabase.storage.from("noticias-imagenes").remove([na.archivo.nombreArchivo]);
      await prisma.noticia_archivo.deleteMany({ where: { archivoId: na.archivo.id } });
      await prisma.archivo.delete({ where: { id: na.archivo.id } });
    }

    await prisma.noticia.delete({ where: { id: idBigInt } });
    await this.limpiarMotivoRechazo(id.toString());
    await this.limpiarPendingMeta(id.toString());
    return { message: "Exito" };
  }

  async actualizarNoticia(id, data, archivosSubidos, user) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const { titulo, imagenesExistentes, estado, fechaPublicacion, categoriaNombre } = data;
    const urlsConservadas = parsearArregloJson(imagenesExistentes, "imagenesExistentes");
    // El cuerpo es HTML que luego se muestra en el portal: se sanea antes de guardarlo.
    const contenido = data.contenido ? sanitizarHtmlNoticia(data.contenido) : data.contenido;
    const usuarioEditor = await obtenerOCrearUsuarioLocal(user);

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: {
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const idStr = id.toString();
    const metaExistente = await this.obtenerPendingMeta(idStr);
    const estadoAnterior = (noticiaExistente.estado || "").toUpperCase();
    const estadoSolicitado = estado ? estado.toUpperCase() : estadoAnterior;

    // Determinamos si la noticia ya había sido aprobada/publicada previamente
    const origenPrevio = metaExistente?.previousEstado || estadoAnterior;
    const provieneDePublicada =
      estadoAnterior === "PUBLICADO" ||
      estadoAnterior === "APROBADO" ||
      estadoAnterior === "PROGRAMADO" ||
      origenPrevio === "PUBLICADO" ||
      origenPrevio === "APROBADO" ||
      origenPrevio === "PROGRAMADO";

    // Construimos o preservamos el snapshot público si la noticia estaba PUBLICADO/APROBADO en el portal
    let snapshotPublico = metaExistente?.snapshotPublico || null;
    const imgsPrevias = noticiaExistente.noticia_archivo.map((na) => {
      const { data: pubData } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(na.archivo.nombreArchivo);
      return pubData.publicUrl;
    });
    let catPrevia = noticiaExistente.categoria_noticia
      ? noticiaExistente.categoria_noticia.nombre
      : "General";
    if (catPrevia.toLowerCase() === "noticias" || catPrevia.toLowerCase() === "noticia") {
      catPrevia = "General";
    }

    if (estadoAnterior === "PUBLICADO" || estadoAnterior === "APROBADO") {
      snapshotPublico = {
        titulo: noticiaExistente.titulo,
        contenido: noticiaExistente.contenido,
        category: catPrevia,
        images: imgsPrevias,
      };
    }

    // Validación: verificar si hubo cambios reales antes de modificar la noticia
    const camposNoticiaPre = [
      { key: "titulo", label: "Título" },
      { key: "category", label: "Categoría" },
      { key: "contenido", label: "Contenido", tipo: "html" },
      { key: "fechaPublicacion", label: "Fecha de publicación programada", tipo: "datetime" },
    ];
    let catNuevaCheck = (categoriaNombre ? categoriaNombre.trim() : catPrevia);
    if (["noticias", "noticia"].includes(catNuevaCheck.toLowerCase())) catNuevaCheck = "General";

    const cambiosTexto = calcularCambios(
      {
        titulo: noticiaExistente.titulo,
        category: catPrevia,
        contenido: noticiaExistente.contenido,
        fechaPublicacion: noticiaExistente.fechaPublicacion,
      },
      {
        titulo: titulo !== undefined ? titulo : noticiaExistente.titulo,
        category: catNuevaCheck,
        contenido: contenido !== undefined ? contenido : noticiaExistente.contenido,
        fechaPublicacion: fechaPublicacion !== undefined ? (fechaPublicacion ? new Date(fechaPublicacion) : null) : noticiaExistente.fechaPublicacion,
      },
      camposNoticiaPre
    );

    const hayNuevasImagenes = Array.isArray(archivosSubidos) && archivosSubidos.length > 0;
    const imagenesCambiaron = hayNuevasImagenes || (
      Array.isArray(urlsConservadas) && (
        urlsConservadas.length !== imgsPrevias.length ||
        urlsConservadas.some((url, i) => url !== imgsPrevias[i])
      )
    );
    const estadoCambio = Boolean(estado && estado.toUpperCase() !== estadoAnterior);

    if (cambiosTexto.length === 0 && !imagenesCambiaron && !estadoCambio) {
      const error = new Error("No se detectaron cambios para actualizar.");
      error.statusCode = 400;
      throw error;
    }

    const dataUpdate = {
      titulo: titulo || noticiaExistente.titulo,
      contenido: contenido || noticiaExistente.contenido,
      updatedAt: new Date(),
      updatedBy: usuarioEditor.id,
    };

    let requestedEstadoFinal = null;

    if (estadoSolicitado === "BORRADOR" && !provieneDePublicada) {
      // Solo puede guardarse directamente como BORRADOR si aún nunca estuvo publicada/aprobada
      dataUpdate.estado = "BORRADOR";
      dataUpdate.fechaPublicacion = null;
      await this.limpiarPendingMeta(idStr);
    } else {
      // Si proviene de una noticia ya PUBLICADO/PROGRAMADO (incluso si el CM elige pasarla a BORRADOR)
      // o si solicita publicar/programar, requiere obligatoriamente aprobación del Admin
      dataUpdate.estado = "PENDIENTE_APROBACION";

      if (estadoSolicitado === "BORRADOR") {
        dataUpdate.fechaPublicacion = null;
        requestedEstadoFinal = "BORRADOR";
      } else if (
        (estadoSolicitado === "PROGRAMADO" || estadoSolicitado === "PENDIENTE_APROBACION") &&
        fechaPublicacion
      ) {
        dataUpdate.fechaPublicacion = new Date(fechaPublicacion);
        requestedEstadoFinal = "PROGRAMADO";
      } else {
        dataUpdate.fechaPublicacion = null;
        requestedEstadoFinal = "PUBLICADO";
      }

      await this.guardarPendingMeta(idStr, {
        previousEstado: provieneDePublicada ? origenPrevio : estadoAnterior,
        targetEstado: requestedEstadoFinal,
        snapshotPublico,
      });

      await this.limpiarMotivoRechazo(idStr);
    }

    if (categoriaNombre) {
      let nombreCatActualizar = categoriaNombre.trim();

      if (
        nombreCatActualizar.toLowerCase() === "noticias" ||
        nombreCatActualizar.toLowerCase() === "noticia"
      ) {
        nombreCatActualizar = "General";
      }

      let categoria = await prisma.categoria_noticia.findFirst({
        where: {
          nombre: {
            equals: nombreCatActualizar,
            mode: "insensitive",
          },
        },
      });

      if (!categoria) {
        categoria = await prisma.categoria_noticia.create({
          data: {
            nombre: nombreCatActualizar,
            descripcion: `Clasificación ${nombreCatActualizar}`,
          },
        });
      }
      dataUpdate.categoriaId = categoria.id;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: idBigInt },
      data: dataUpdate,
    });

    const urlsProtegidasSnapshot = snapshotPublico?.images || [];

    for (const na of noticiaExistente.noticia_archivo) {
      const archivo = na.archivo;
      const { data: urlData } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(archivo.nombreArchivo);

      if (!urlsConservadas.includes(urlData.publicUrl)) {
        await prisma.noticia_archivo.deleteMany({
          where: { noticiaId: noticiaActualizada.id, archivoId: archivo.id },
        });
        if (!urlsProtegidasSnapshot.includes(urlData.publicUrl)) {
          await supabase.storage.from("noticias-imagenes").remove([archivo.nombreArchivo]);
          await prisma.archivo.delete({ where: { id: archivo.id } }).catch(() => {});
        }
      }
    }

    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "img");

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        console.error("Error al subir imagen de noticia a Supabase:", storageError.message);
        const err = new Error("No se pudo almacenar la imagen de la noticia.");
        err.statusCode = 500;
        throw err;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });
      await prisma.noticia_archivo.create({
        data: { noticiaId: noticiaActualizada.id, archivoId: archivoDb.id },
      });
    }

    const noticiaConArchivos = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: {
        usuario_noticia_createdByTousuario: true,
        usuario_noticia_updatedByTousuario: true,
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    const imgs = noticiaConArchivos.noticia_archivo.map(
      (na) =>
        supabase.storage.from("noticias-imagenes").getPublicUrl(na.archivo.nombreArchivo).data
          .publicUrl
    );

    const editorOriginal = noticiaConArchivos.usuario_noticia_createdByTousuario
      ? nombreDeUsuario(noticiaConArchivos.usuario_noticia_createdByTousuario)
      : "Editor CMS";
    const editadoPorNombre = noticiaConArchivos.usuario_noticia_updatedByTousuario
      ? nombreDeUsuario(noticiaConArchivos.usuario_noticia_updatedByTousuario)
      : null;

    let catFinal = noticiaConArchivos.categoria_noticia
      ? noticiaConArchivos.categoria_noticia.nombre
      : "General";
    if (catFinal.toLowerCase() === "noticias" || catFinal.toLowerCase() === "noticia") {
      catFinal = "General";
    }

    const motivoActual = await this.obtenerMotivoRechazo(idStr);
    let metaActual = await this.obtenerPendingMeta(idStr);

    // Detección automática de cambios para que el Admin vea qué se modificó
    if (noticiaActualizada.estado === "PENDIENTE_APROBACION" && metaActual) {
      const imgsPreviasCambio = noticiaExistente.noticia_archivo.map(
        (na) =>
          supabase.storage.from("noticias-imagenes").getPublicUrl(na.archivo.nombreArchivo).data
            .publicUrl
      );
      let catPreviaCambio = noticiaExistente.categoria_noticia
        ? noticiaExistente.categoria_noticia.nombre
        : "General";
      if (["noticias", "noticia"].includes(catPreviaCambio.toLowerCase())) {
        catPreviaCambio = "General";
      }
      const camposNoticia = [
        { key: "titulo", label: "Título" },
        { key: "category", label: "Categoría" },
        { key: "contenido", label: "Contenido", tipo: "html" },
        { key: "fechaPublicacion", label: "Fecha de publicación programada", tipo: "datetime" },
        { key: "images", label: "Imágenes", tipo: "images" },
      ];
      const nuevosCambios = calcularCambios(
        {
          titulo: noticiaExistente.titulo,
          category: catPreviaCambio,
          contenido: noticiaExistente.contenido,
          fechaPublicacion: noticiaExistente.fechaPublicacion,
          images: imgsPreviasCambio,
        },
        {
          titulo: noticiaActualizada.titulo,
          category: catFinal,
          contenido: noticiaActualizada.contenido,
          fechaPublicacion: noticiaActualizada.fechaPublicacion,
          images: imgs,
        },
        camposNoticia
      );
      const cambiosPrevios =
        metaExistente && noticiaExistente.estado === "PENDIENTE_APROBACION"
          ? metaExistente.cambios || []
          : [];
      metaActual = {
        ...metaActual,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      };
      await this.guardarPendingMeta(idStr, metaActual);
    }

    await limpiarSolicitudEliminacion("noticia", id.toString()); // editar después de pedir la baja anula el pedido
    return {
      message: "Exito",
      noticia: {
        ...noticiaActualizada,
        id: noticiaActualizada.id.toString(),
        categoriaId: noticiaActualizada.categoriaId.toString(),
        category: catFinal,
        estado: noticiaActualizada.estado,
        requestedEstado:
          noticiaActualizada.estado === "PENDIENTE_APROBACION"
            ? metaActual?.targetEstado || null
            : null,
        previousEstado: metaActual?.previousEstado || null,
        isDraft: noticiaActualizada.estado === "BORRADOR",
        images: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre,
        rejectionReason: motivoActual,
      },
    };
  }

  async evaluarNoticia(id, data, user) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const { estado, rejectionReason } = data;

    if (!estado) {
      const error = new Error("Debe indicar el estado de evaluación (APROBADO o RECHAZADO).");
      error.statusCode = 400;
      throw error;
    }

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: idBigInt },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // El administrador únicamente puede aprobar o rechazar solicitudes pendientes enviadas desde el CMS
    if (noticiaExistente.estado !== "PENDIENTE_APROBACION") {
      const error = new Error(
        "Solo se pueden aprobar o rechazar noticias que estén pendientes de aprobación."
      );
      error.statusCode = 400;
      throw error;
    }

    const idStr = id.toString();
    const pendingMeta = await this.obtenerPendingMeta(idStr);
    const usuarioAdmin = await obtenerOCrearUsuarioLocal(user);
    const estadoUpper = estado.toUpperCase();

    let nuevoEstado = noticiaExistente.estado;
    let motivoGuardado = null;
    const extraUpdateData = {};

    if (estadoUpper === "RECHAZADO") {
      if (!rejectionReason || !rejectionReason.trim()) {
        const error = new Error("Debe especificar un motivo de rechazo.");
        error.statusCode = 400;
        throw error;
      }
      nuevoEstado = "RECHAZADO";
      motivoGuardado = rejectionReason.trim();
      await this.guardarMotivoRechazo(idStr, motivoGuardado);
    } else if (
      estadoUpper === "APROBADO" ||
      estadoUpper === "PUBLICADO" ||
      estadoUpper === "PROGRAMADO"
    ) {
      if (pendingMeta?.targetEstado === "BORRADOR") {
        // El Admin aprobó la solicitud del CM de pasar una noticia publicada a BORRADOR
        nuevoEstado = "BORRADOR";
        extraUpdateData.fechaPublicacion = null;
      } else {
        const ahora = new Date();
        const tieneProgramacionFutura =
          noticiaExistente.fechaPublicacion && new Date(noticiaExistente.fechaPublicacion) > ahora;

        nuevoEstado = tieneProgramacionFutura ? "PROGRAMADO" : "PUBLICADO";
      }

      await this.limpiarMotivoRechazo(idStr);
      await this.limpiarPendingMeta(idStr);
    } else {
      nuevoEstado = estadoUpper;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: idBigInt },
      data: {
        estado: nuevoEstado,
        updatedAt: new Date(),
        ...extraUpdateData,
      },
      include: {
        usuario_noticia_createdByTousuario: true,
        usuario_noticia_updatedByTousuario: true,
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    try {
      await prisma.auditoria.create({
        data: {
          usuarioId: usuarioAdmin.id,
          entidad: "noticia",
          entidadId: idStr,
          accion: nuevoEstado === "RECHAZADO" ? "RECHAZAR" : "APROBAR",
          descripcion:
            nuevoEstado === "RECHAZADO"
              ? `Noticia rechazada. Motivo: ${motivoGuardado}`
              : `Solicitud aprobada (estado resultante: ${nuevoEstado}).`,
        },
      });
    } catch (_) {
      // No bloquear si falla el registro de auditoría
    }

    const imgs = noticiaActualizada.noticia_archivo.map(
      (na) =>
        supabase.storage.from("noticias-imagenes").getPublicUrl(na.archivo.nombreArchivo).data
          .publicUrl
    );

    const editorOriginal = noticiaActualizada.usuario_noticia_createdByTousuario
      ? nombreDeUsuario(noticiaActualizada.usuario_noticia_createdByTousuario)
      : "Editor CMS";
    const editadoPorNombre = noticiaActualizada.usuario_noticia_updatedByTousuario
      ? nombreDeUsuario(noticiaActualizada.usuario_noticia_updatedByTousuario)
      : null;

    let catFinal = noticiaActualizada.categoria_noticia
      ? noticiaActualizada.categoria_noticia.nombre
      : "General";
    if (catFinal.toLowerCase() === "noticias" || catFinal.toLowerCase() === "noticia") {
      catFinal = "General";
    }

    const metaRestante = await this.obtenerPendingMeta(idStr);

    return {
      message: "Exito",
      noticia: {
        id: noticiaActualizada.id.toString(),
        title: noticiaActualizada.titulo,
        titulo: noticiaActualizada.titulo,
        body: [noticiaActualizada.contenido],
        contenido: noticiaActualizada.contenido,
        date: new Date(noticiaActualizada.createdAt).toLocaleDateString("es-AR"),
        fechaPublicacion: noticiaActualizada.fechaPublicacion,
        createdAt: noticiaActualizada.createdAt,
        updatedAt: noticiaActualizada.updatedAt,
        category: catFinal,
        estado: noticiaActualizada.estado,
        requestedEstado: null,
        previousEstado: metaRestante?.previousEstado || null,
        isDraft: noticiaActualizada.estado === "BORRADOR",
        images: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre,
        rejectionReason: motivoGuardado,
      },
    };
  }

  // Lo ejecuta el cron de server.js cada minuto. Los errores se propagan para que el cron los informe.
  async publicarNoticiasProgramadas() {
    const limite = limitePublicacionProgramada();
    // SQL directo a propósito: con @updatedAt, un updateMany de Prisma cambiaría también "updatedAt"
    // y las noticias programadas aparecerían como "Editado" al publicarse solas.
    await prisma.$executeRaw`
      UPDATE "noticia"
      SET "estado" = 'PUBLICADO'::"EstadoEditorial"
      WHERE "estado" = 'PROGRAMADO'::"EstadoEditorial"
        AND "fechaPublicacion" <= ${limite}
    `;
  }
}

export default new CmsNoticiaService();
