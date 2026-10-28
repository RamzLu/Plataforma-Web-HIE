import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

const REJECTION_KEY_PREFIX = "noticia_rejection_";

class CmsNoticiaService {
  async obtenerMapaMotivosRechazo() {
    try {
      const configs = await prisma.configuracion.findMany({
        where: {
          clave: { startsWith: REJECTION_KEY_PREFIX },
        },
      });
      const map = new Map();
      for (const item of configs) {
        const noticiaId = item.clave.replace(REJECTION_KEY_PREFIX, "");
        map.set(noticiaId, item.valor);
      }
      return map;
    } catch (err) {
      return new Map();
    }
  }

  async obtenerMotivoRechazo(noticiaId) {
    try {
      const clave = `${REJECTION_KEY_PREFIX}${noticiaId}`;
      const config = await prisma.configuracion.findUnique({
        where: { clave },
      });
      return config ? config.valor : null;
    } catch (err) {
      return null;
    }
  }

  async guardarMotivoRechazo(noticiaId, motivo) {
    const clave = `${REJECTION_KEY_PREFIX}${noticiaId}`;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: motivo, updatedAt: new Date() },
      create: {
        clave,
        valor: motivo,
        descripcion: `Motivo de rechazo de la noticia ID ${noticiaId}`,
        updatedAt: new Date(),
      },
    });
  }

  async limpiarMotivoRechazo(noticiaId) {
    const clave = `${REJECTION_KEY_PREFIX}${noticiaId}`;
    await prisma.configuracion.deleteMany({
      where: { clave },
    });
  }

  async crearNoticia(data, archivosSubidos, user) {
    const { titulo, contenido, estado, fechaPublicacion, categoriaNombre } = data;

    if (!titulo || !contenido) {
      const error = new Error("Faltan campos obligatorios: titulo y contenido.");
      error.statusCode = 400;
      throw error;
    }

    const estadoSolicitado = estado ? estado.toUpperCase() : "BORRADOR";
    // Cuando el CM sube una noticia para publicar o programar, queda en PENDIENTE_APROBACION hasta que el Admin la apruebe
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

    const imagenesUrlsGuardadas = [];

    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "img");

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const error = new Error("Error al subir imagen: " + storageError.message);
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
      ? `${nuevaNoticia.usuario_noticia_createdByTousuario.nombre} ${nuevaNoticia.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
      : "Editor CMS";

    return {
      message: "Exito",
      noticia: {
        ...nuevaNoticia,
        id: nuevaNoticia.id.toString(),
        categoriaId: nuevaNoticia.categoriaId.toString(),
        category: nuevaNoticia.categoria_noticia.nombre,
        estado: nuevaNoticia.estado,
        isDraft: nuevaNoticia.estado === "BORRADOR",
        images: imagenesUrlsGuardadas,
        editor: editorNombre,
        editedBy: null,
        rejectionReason: null,
      },
    };
  }

  async obtenerNoticias(isAdmin) {
    const whereClause =
      isAdmin === "true"
        ? {}
        : {
            estado: {
              in: ["PUBLICADO", "APROBADO"],
            },
          };

    const [noticias, motivosMap] = await Promise.all([
      prisma.noticia.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          usuario_noticia_createdByTousuario: true,
          usuario_noticia_updatedByTousuario: true,
          noticia_archivo: { include: { archivo: true } },
          categoria_noticia: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
    ]);

    return noticias.map((noticia) => {
      const imgs = noticia.noticia_archivo.map((na) => {
        const { data } = supabase.storage
          .from("noticias-imagenes")
          .getPublicUrl(na.archivo.nombreArchivo);
        return data.publicUrl;
      });

      const editorNombre = noticia.usuario_noticia_createdByTousuario
        ? `${noticia.usuario_noticia_createdByTousuario.nombre} ${noticia.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
        : "Editor CMS";

      const editadoPorNombre = noticia.usuario_noticia_updatedByTousuario
        ? `${noticia.usuario_noticia_updatedByTousuario.nombre} ${noticia.usuario_noticia_updatedByTousuario.apellido || ""}`.trim()
        : null;

      let catName = noticia.categoria_noticia ? noticia.categoria_noticia.nombre : "General";
      if (catName.toLowerCase() === "noticias" || catName.toLowerCase() === "noticia") {
        catName = "General";
      }

      const idStr = noticia.id.toString();

      return {
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
        isDraft: noticia.estado === "BORRADOR",
        images: imgs,
        editor: editorNombre,
        editedBy: editadoPorNombre,
        rejectionReason: motivosMap.get(idStr) || null,
      };
    });
  }

  async eliminarNoticia(id) {
    const noticia = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticia) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    for (const na of noticia.noticia_archivo) {
      await supabase.storage.from("noticias-imagenes").remove([na.archivo.nombreArchivo]);
      await prisma.noticia_archivo.deleteMany({ where: { archivoId: na.archivo.id } });
      await prisma.archivo.delete({ where: { id: na.archivo.id } });
    }

    await prisma.noticia.delete({ where: { id: BigInt(id) } });
    await this.limpiarMotivoRechazo(id.toString());
    return { message: "Exito" };
  }

  async actualizarNoticia(id, data, archivosSubidos, user) {
    const { titulo, contenido, imagenesExistentes, estado, fechaPublicacion, categoriaNombre } = data;

    const usuarioEditor = await obtenerOCrearUsuarioLocal(user);

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const dataUpdate = {
      titulo: titulo || noticiaExistente.titulo,
      contenido: contenido || noticiaExistente.contenido,
      updatedAt: new Date(),
      updatedBy: usuarioEditor.id,
    };

    const estadoSolicitado = estado ? estado.toUpperCase() : noticiaExistente.estado;

    if (estadoSolicitado === "BORRADOR") {
      dataUpdate.estado = "BORRADOR";
      dataUpdate.fechaPublicacion = null;
    } else {
      // Cualquier envío a publicación o programación desde el CM requiere aprobación del Admin
      dataUpdate.estado = "PENDIENTE_APROBACION";
      if (
        (estadoSolicitado === "PROGRAMADO" || estadoSolicitado === "PENDIENTE_APROBACION") &&
        fechaPublicacion
      ) {
        dataUpdate.fechaPublicacion = new Date(fechaPublicacion);
      } else if (estadoSolicitado === "PUBLICADO") {
        dataUpdate.fechaPublicacion = null;
      }
      // Si se reenvía a aprobación, limpiamos el motivo de rechazo anterior
      await this.limpiarMotivoRechazo(id.toString());
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
          data: { nombre: nombreCatActualizar, descripcion: `Clasificación ${nombreCatActualizar}` },
        });
      }
      dataUpdate.categoriaId = categoria.id;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: BigInt(id) },
      data: dataUpdate,
    });

    const urlsConservadas = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];

    for (const na of noticiaExistente.noticia_archivo) {
      const archivo = na.archivo;
      const { data: urlData } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(archivo.nombreArchivo);

      if (!urlsConservadas.includes(urlData.publicUrl)) {
        await supabase.storage.from("noticias-imagenes").remove([archivo.nombreArchivo]);
        await prisma.noticia_archivo.deleteMany({ where: { archivoId: archivo.id } });
        await prisma.archivo.delete({ where: { id: archivo.id } });
      }
    }

    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, "img");

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const err = new Error("Error al subir imagen: " + storageError.message);
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
      where: { id: BigInt(id) },
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
      ? `${noticiaConArchivos.usuario_noticia_createdByTousuario.nombre} ${noticiaConArchivos.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
      : "Editor CMS";
    const editadoPorNombre = noticiaConArchivos.usuario_noticia_updatedByTousuario
      ? `${noticiaConArchivos.usuario_noticia_updatedByTousuario.nombre} ${noticiaConArchivos.usuario_noticia_updatedByTousuario.apellido || ""}`.trim()
      : null;

    let catFinal = noticiaConArchivos.categoria_noticia
      ? noticiaConArchivos.categoria_noticia.nombre
      : "General";
    if (catFinal.toLowerCase() === "noticias" || catFinal.toLowerCase() === "noticia") {
      catFinal = "General";
    }

    const motivoActual = await this.obtenerMotivoRechazo(id.toString());

    return {
      message: "Exito",
      noticia: {
        ...noticiaActualizada,
        id: noticiaActualizada.id.toString(),
        categoriaId: noticiaActualizada.categoriaId.toString(),
        category: catFinal,
        estado: noticiaActualizada.estado,
        isDraft: noticiaActualizada.estado === "BORRADOR",
        images: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre,
        rejectionReason: motivoActual,
      },
    };
  }

  async evaluarNoticia(id, data, user) {
    const { estado, rejectionReason } = data;

    if (!estado) {
      const error = new Error("Debe indicar el estado de evaluación (APROBADO o RECHAZADO).");
      error.statusCode = 400;
      throw error;
    }

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const usuarioAdmin = await obtenerOCrearUsuarioLocal(user);
    const estadoUpper = estado.toUpperCase();

    let nuevoEstado = noticiaExistente.estado;
    let motivoGuardado = null;

    if (estadoUpper === "RECHAZADO") {
      if (!rejectionReason || !rejectionReason.trim()) {
        const error = new Error("Debe especificar un motivo de rechazo.");
        error.statusCode = 400;
        throw error;
      }
      nuevoEstado = "RECHAZADO";
      motivoGuardado = rejectionReason.trim();
      await this.guardarMotivoRechazo(id.toString(), motivoGuardado);
    } else if (
      estadoUpper === "APROBADO" ||
      estadoUpper === "PUBLICADO" ||
      estadoUpper === "PROGRAMADO"
    ) {
      const ahora = new Date();
      const tieneProgramacionFutura =
        noticiaExistente.fechaPublicacion && new Date(noticiaExistente.fechaPublicacion) > ahora;

      nuevoEstado = tieneProgramacionFutura ? "PROGRAMADO" : "PUBLICADO";
      await this.limpiarMotivoRechazo(id.toString());
    } else {
      nuevoEstado = estadoUpper;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: BigInt(id) },
      data: {
        estado: nuevoEstado,
        updatedAt: new Date(),
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
          entidadId: id.toString(),
          accion: nuevoEstado === "RECHAZADO" ? "RECHAZAR" : "APROBAR",
          detalle:
            nuevoEstado === "RECHAZADO"
              ? `Noticia rechazada. Motivo: ${motivoGuardado}`
              : `Noticia aprobada (${nuevoEstado}).`,
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
      ? `${noticiaActualizada.usuario_noticia_createdByTousuario.nombre} ${noticiaActualizada.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
      : "Editor CMS";
    const editadoPorNombre = noticiaActualizada.usuario_noticia_updatedByTousuario
      ? `${noticiaActualizada.usuario_noticia_updatedByTousuario.nombre} ${noticiaActualizada.usuario_noticia_updatedByTousuario.apellido || ""}`.trim()
      : null;

    let catFinal = noticiaActualizada.categoria_noticia
      ? noticiaActualizada.categoria_noticia.nombre
      : "General";
    if (catFinal.toLowerCase() === "noticias" || catFinal.toLowerCase() === "noticia") {
      catFinal = "General";
    }

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
        isDraft: noticiaActualizada.estado === "BORRADOR",
        images: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre,
        rejectionReason: motivoGuardado,
      },
    };
  }

  async publicarNoticiasProgramadas() {
    try {
      const ahora = new Date();
      await prisma.noticia.updateMany({
        where: {
          estado: "PROGRAMADO",
          fechaPublicacion: { lte: ahora },
        },
        data: { estado: "PUBLICADO" },
      });
    } catch (error) {
      // Ignorar errores silenciosamente en el cron
    }
  }
}

export default new CmsNoticiaService();
