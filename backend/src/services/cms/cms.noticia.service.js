import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

class CmsNoticiaService {
  async crearNoticia(data, archivosSubidos, user) {
    // NUEVO: Extraemos fechaPublicacion
    const { titulo, contenido, estado, fechaPublicacion } = data;

    if (!titulo || !contenido) {
      const error = new Error("Faltan campos obligatorios: titulo y contenido.");
      error.statusCode = 400;
      throw error;
    }

    const estadoFinal = estado ? estado.toUpperCase() : "BORRADOR";

    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: "Noticias" } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({
        data: { nombre: "Noticias", descripcion: "Por defecto" },
      });
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    // NUEVO: Agregamos fechaPublicacion si el estado es PROGRAMADO
    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo, 
        contenido, 
        categoriaId: categoria.id, 
        createdBy: usuarioLocal.id, 
        estado: estadoFinal, 
        updatedAt: new Date(),
        ...(estadoFinal === "PROGRAMADO" && fechaPublicacion ? { fechaPublicacion: new Date(fechaPublicacion) } : {})
      },
      include: { usuario_noticia_createdByTousuario: true },
    });

    const imagenesUrlsGuardadas = [];
    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'img');

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
          nombreOriginal: file.originalname, nombreArchivo: nombreUnico, ruta: `noticias-imagenes/${nombreUnico}`,
          extension, mimeType: file.mimetype, tamanioBytes: BigInt(file.size),
        },
      });

      await prisma.noticia_archivo.create({ data: { noticiaId: nuevaNoticia.id, archivoId: archivoDb.id } });

      const { data: publicUrlData } = supabase.storage.from("noticias-imagenes").getPublicUrl(nombreUnico);
      imagenesUrlsGuardadas.push(publicUrlData.publicUrl);
    }

    const editorNombre = nuevaNoticia.usuario_noticia_createdByTousuario
      ? `${nuevaNoticia.usuario_noticia_createdByTousuario.nombre} ${nuevaNoticia.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
      : "Editor CMS";

    return {
      message: "¡Noticia y archivos subidos al Bucket y respaldados en la BD!",
      noticia: {
        ...nuevaNoticia,
        id: nuevaNoticia.id.toString(),
        categoriaId: nuevaNoticia.categoriaId.toString(),
        estado: nuevaNoticia.estado,
        isDraft: nuevaNoticia.estado === "BORRADOR",
        images: imagenesUrlsGuardadas,
        editor: editorNombre,
        editedBy: null
      }
    };
  }

  async obtenerNoticias(isAdmin) {
    const whereClause = isAdmin === "true" ? {} : { estado: "PUBLICADO" };

    const noticias = await prisma.noticia.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        usuario_noticia_createdByTousuario: true,
        usuario_noticia_updatedByTousuario: true,
        noticia_archivo: { include: { archivo: true } },
      },
    });

    return noticias.map((noticia) => {
      const imgs = noticia.noticia_archivo.map((na) => {
        const { data } = supabase.storage.from("noticias-imagenes").getPublicUrl(na.archivo.nombreArchivo);
        return data.publicUrl;
      });

      const editorNombre = noticia.usuario_noticia_createdByTousuario
        ? `${noticia.usuario_noticia_createdByTousuario.nombre} ${noticia.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
        : "Editor CMS";

      const editadoPorNombre = noticia.usuario_noticia_updatedByTousuario
        ? `${noticia.usuario_noticia_updatedByTousuario.nombre} ${noticia.usuario_noticia_updatedByTousuario.apellido || ""}`.trim()
        : null;

      return {
        id: noticia.id.toString(),
        title: noticia.titulo,
        body: [noticia.contenido],
        date: new Date(noticia.createdAt).toLocaleDateString("es-AR"),
        fechaPublicacion: noticia.fechaPublicacion, // Agregado para el frontend
        createdAt: noticia.createdAt,
        updatedAt: noticia.updatedAt,
        category: "Noticias",
        estado: noticia.estado,
        isDraft: noticia.estado === "BORRADOR",
        images: imgs,
        editor: editorNombre,
        editedBy: editadoPorNombre
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
    return { message: "¡Noticia eliminada con éxito!" };
  }

  async actualizarNoticia(id, data, archivosSubidos, user) {
    // NUEVO: Extraemos fechaPublicacion
    const { titulo, contenido, imagenesExistentes, estado, fechaPublicacion } = data;
    
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
      updatedBy: usuarioEditor.id
    };

    if (estado) {
      dataUpdate.estado = estado.toUpperCase();
    }
    
    // NUEVO: Guardar fechaPublicacion si se reprograma
    if (dataUpdate.estado === "PROGRAMADO" && fechaPublicacion) {
      dataUpdate.fechaPublicacion = new Date(fechaPublicacion);
    } else if (dataUpdate.estado !== "PROGRAMADO") {
      dataUpdate.fechaPublicacion = null; // Limpiar si se pasa a publicado/borrador
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: BigInt(id) },
      data: dataUpdate,
    });

    const urlsConservadas = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];
    for (const na of noticiaExistente.noticia_archivo) {
      const archivo = na.archivo;
      const { data: urlData } = supabase.storage.from("noticias-imagenes").getPublicUrl(archivo.nombreArchivo);
      
      if (!urlsConservadas.includes(urlData.publicUrl)) {
        await supabase.storage.from("noticias-imagenes").remove([archivo.nombreArchivo]);
        await prisma.noticia_archivo.deleteMany({ where: { archivoId: archivo.id } });
        await prisma.archivo.delete({ where: { id: archivo.id } });
      }
    }

    for (const file of archivosSubidos) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'img');
      
      const { error: storageError } = await supabase.storage.from("noticias-imagenes").upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const err = new Error("Error al subir imagen: " + storageError.message);
        err.statusCode = 500;
        throw err;
      }

      const archivoDb = await prisma.archivo.create({
        data: { nombreOriginal: file.originalname, nombreArchivo: nombreUnico, ruta: `noticias-imagenes/${nombreUnico}`, extension, mimeType: file.mimetype, tamanioBytes: BigInt(file.size) },
      });
      await prisma.noticia_archivo.create({ data: { noticiaId: noticiaActualizada.id, archivoId: archivoDb.id } });
    }

    const noticiaConArchivos = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { 
        usuario_noticia_createdByTousuario: true,
        usuario_noticia_updatedByTousuario: true,
        noticia_archivo: { include: { archivo: true } } 
      },
    });

    const imgs = noticiaConArchivos.noticia_archivo.map((na) => supabase.storage.from("noticias-imagenes").getPublicUrl(na.archivo.nombreArchivo).data.publicUrl);
    
    const editorOriginal = noticiaConArchivos.usuario_noticia_createdByTousuario ? `${noticiaConArchivos.usuario_noticia_createdByTousuario.nombre} ${noticiaConArchivos.usuario_noticia_createdByTousuario.apellido || ""}`.trim() : "Editor CMS";
    const editadoPorNombre = noticiaConArchivos.usuario_noticia_updatedByTousuario ? `${noticiaConArchivos.usuario_noticia_updatedByTousuario.nombre} ${noticiaConArchivos.usuario_noticia_updatedByTousuario.apellido || ""}`.trim() : null;

    return {
      message: "¡Noticia y galería actualizadas correctamente!",
      noticia: {
        ...noticiaActualizada,
        id: noticiaActualizada.id.toString(),
        categoriaId: noticiaActualizada.categoriaId.toString(),
        estado: noticiaActualizada.estado,
        isDraft: noticiaActualizada.estado === "BORRADOR",
        images: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre
      },
    };
  }

  async publicarNoticiasProgramadas() {
    try {
      const ahora = new Date();
      const result = await prisma.noticia.updateMany({
        where: {
          estado: "PROGRAMADO",
          fechaPublicacion: { lte: ahora },
        },
        data: { estado: "PUBLICADO" },
      });

      if (result.count > 0) {
        console.log(`⏰ [CRON] Se publicaron automáticamente ${result.count} noticias programadas.`);
      }
    } catch (error) {
      console.error("❌ [CRON] Error al ejecutar publicación programada:", error);
    }
  }
}

export default new CmsNoticiaService();