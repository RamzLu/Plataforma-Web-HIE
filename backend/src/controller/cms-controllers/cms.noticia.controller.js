import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
);

export const crearNoticia = async (req, res) => {
  try {
    // 🔥 1. Agregamos 'estado' a la extracción
    const { titulo, contenido, estado } = req.body; 
    const archivosSubidos = req.files || [];

    const keycloakSub = req.user.keycloakId;
    const username = req.user.username || `user_${Date.now()}`;
    const name = req.user.name || "Editor CMS";

    if (!titulo || !contenido) {
      return res.status(400).json({ error: "Faltan campos obligatorios: titulo y contenido." });
    }

    // 🔥 2. Evaluamos el estado que llega del frontend
    const estadoFinal = estado ? estado.toUpperCase() : "BORRADOR";

    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: "Noticias" } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({
        data: { nombre: "Noticias", descripcion: "Por defecto" },
      });
    }

    let usuarioLocal = await prisma.usuario.findFirst({
      where: { 
        OR: [{ keycloakId: keycloakSub }, { username: username }]
      },
    });

    if (!usuarioLocal) {
      let rolAdmin = await prisma.rol.findFirst({ where: { nombre: "ADMIN" } });
      if (!rolAdmin) {
        rolAdmin = await prisma.rol.create({
          data: { nombre: "ADMIN", descripcion: "Admin" },
        });
      }
      usuarioLocal = await prisma.usuario.create({
        data: {
          id: keycloakSub,
          keycloakId: keycloakSub,
          username: username,
          email: `${username}@hospital.com`,
          nombre: name,
          apellido: "Sistema",
          rolId: rolAdmin.id,
          updatedAt: new Date(),
        },
      });
    }

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        categoriaId: categoria.id,
        createdBy: usuarioLocal.id,
        // 🔥 3. Usamos la variable dinámica en lugar de "PUBLICADO"
        estado: estadoFinal, 
        updatedAt: new Date(),
      },
      include: {
        usuario_noticia_createdByTousuario: true,
      },
    });

    const imagenesUrlsGuardadas = [];

    for (const file of archivosSubidos) {
      const extension = file.originalname.split(".").pop().toLowerCase() || "png";
      const nombreUnico = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        console.error("❌ Error subiendo al bucket de Supabase:", storageError.message);
        return res.status(500).json({ error: "Error al subir imagen: " + storageError.message });
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });

      await prisma.noticia_archivo.create({
        data: { noticiaId: nuevaNoticia.id, archivoId: archivoDb.id },
      });

      const { data: publicUrlData } = supabase.storage.from("noticias-imagenes").getPublicUrl(nombreUnico);
      imagenesUrlsGuardadas.push(publicUrlData.publicUrl);
    }

    const editorNombre = nuevaNoticia.usuario_noticia_createdByTousuario
      ? `${nuevaNoticia.usuario_noticia_createdByTousuario.nombre} ${nuevaNoticia.usuario_noticia_createdByTousuario.apellido || ""}`.trim()
      : "Editor CMS";

    return res.status(201).json({
      message: "¡Noticia y archivos subidos al Bucket y respaldados en la BD!",
      noticia: {
        ...nuevaNoticia,
        id: nuevaNoticia.id.toString(),
        categoriaId: nuevaNoticia.categoriaId.toString(),
        estado: nuevaNoticia.estado, // Devolvemos el estado al frontend
        isDraft: nuevaNoticia.estado === "BORRADOR",
        images: imagenesUrlsGuardadas,
        editor: editorNombre,
        editedBy: null 
      },
    });
  } catch (error) {
    console.error("Error al crear la noticia con archivos:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
};

export const obtenerNoticias = async (req, res) => {
  try {
    const { admin } = req.query;
    const whereClause = admin === "true" ? {} : { estado: "PUBLICADO" };

    const noticias = await prisma.noticia.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        usuario_noticia_createdByTousuario: true,
        usuario_noticia_updatedByTousuario: true, 
        noticia_archivo: { include: { archivo: true } },
      },
    });

    const noticiasFormateadas = noticias.map((noticia) => {
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

    return res.status(200).json(noticiasFormateadas);
  } catch (error) {
    return res.status(500).json({ error: "Error al cargar las noticias." });
  }
};

export const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const noticia = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada." });

    for (const na of noticia.noticia_archivo) {
      await supabase.storage.from("noticias-imagenes").remove([na.archivo.nombreArchivo]);
      await prisma.noticia_archivo.deleteMany({ where: { archivoId: na.archivo.id } });
      await prisma.archivo.delete({ where: { id: na.archivo.id } });
    }

    await prisma.noticia.delete({ where: { id: BigInt(id) } });

    return res.status(200).json({ message: "¡Noticia eliminada con éxito!" });
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar: " + error.message });
  }
};

export const actualizarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    // 🔥 1. Agregamos 'estado' a la extracción
    const { titulo, contenido, imagenesExistentes, estado } = req.body;
    const archivosSubidos = req.files || [];

    const keycloakSub = req.user.keycloakId;
    const username = req.user.username || `user_${Date.now()}`;
    const name = req.user.name || "Editor CMS";

    let usuarioEditor = await prisma.usuario.findFirst({
      where: { OR: [{ keycloakId: keycloakSub }, { username: username }] },
    });

    if (!usuarioEditor) {
      let rolAdmin = await prisma.rol.findFirst({ where: { nombre: "ADMIN" } });
      if (!rolAdmin) rolAdmin = await prisma.rol.create({ data: { nombre: "ADMIN", descripcion: "Admin" } });
      usuarioEditor = await prisma.usuario.create({
        data: {
          id: keycloakSub, keycloakId: keycloakSub, username: username, email: `${username}@hospital.com`,
          nombre: name, apellido: "Sistema", rolId: rolAdmin.id, updatedAt: new Date(),
        },
      });
    }

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticiaExistente) return res.status(404).json({ error: "Noticia no encontrada." });

    // 🔥 2. Preparamos el objeto de datos dinámico
    const dataUpdate = {
      titulo: titulo || noticiaExistente.titulo,
      contenido: contenido || noticiaExistente.contenido,
      updatedAt: new Date(),
      updatedBy: usuarioEditor.id 
    };

    if (estado) dataUpdate.estado = estado.toUpperCase();

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: BigInt(id) },
      data: dataUpdate,
    });

    const urlsConservadas = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];
    for (const na of noticiaExistente.noticia_archivo) {
      const archivo = na.archivo;
      const { data } = supabase.storage.from("noticias-imagenes").getPublicUrl(archivo.nombreArchivo);
      if (!urlsConservadas.includes(data.publicUrl)) {
        await supabase.storage.from("noticias-imagenes").remove([archivo.nombreArchivo]);
        await prisma.noticia_archivo.deleteMany({ where: { archivoId: archivo.id } });
        await prisma.archivo.delete({ where: { id: archivo.id } });
      }
    }

    for (const file of archivosSubidos) {
      const extension = file.originalname.split(".").pop().toLowerCase() || "png";
      const nombreUnico = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const { error: storageError } = await supabase.storage.from("noticias-imagenes").upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) return res.status(500).json({ error: "Error al subir imagen: " + storageError.message });

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

    return res.status(200).json({
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
    });
  } catch (error) {
    console.error("Error al actualizar la noticia:", error);
    return res.status(500).json({ error: "Error al actualizar: " + error.message });
  }
};