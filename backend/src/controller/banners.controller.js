import { prisma } from "../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY
);

export const obtenerBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { orden: "asc" },
      include: {
        archivo: true,
      },
    });

    const bannersFormateados = banners.map((banner) => {
      let imageUrl = null;
      if (banner.archivo) {
        const { data } = supabase.storage
          .from("banners-imagenes")
          .getPublicUrl(banner.archivo.nombreArchivo);
        imageUrl = data.publicUrl;
      }

      let pageName = "Inicio";
      let realDescription = banner.descripcion;
      if (banner.descripcion && banner.descripcion.startsWith("[PAGE:")) {
        const parts = banner.descripcion.split("]");
        pageName = parts[0].replace("[PAGE:", "");
        realDescription = parts[1] || "";
      }

      return {
        ...banner,
        id: banner.id.toString(),
        titulo: banner.titulo,
        descripcion: realDescription,
        page: pageName,
        imageUrl,
      };
    });

    return res.status(200).json(bannersFormateados);
  } catch (error) {
    console.error("Error al obtener banners:", error);
    return res.status(500).json({ error: "Error al obtener banners" });
  }
};

export const crearBanner = async (req, res) => {
  try {
    const { titulo, descripcion, enlace, page, orden, activo } = req.body;
    const file = req.file;

    if (!titulo || titulo.trim() === "") {
      return res.status(400).json({ error: "El título del banner es obligatorio para garantizar la accesibilidad." });
    }

    if (!file) {
      return res.status(400).json({ error: "Es obligatorio subir una imagen para el banner." });
    }

    const keycloakSub = req.user.keycloakId;
    let usuarioLocal = await prisma.usuario.findFirst({
      where: { keycloakId: keycloakSub },
    });

    const extension = file.originalname.split(".").pop().toLowerCase() || "png";
    const nombreUnico = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from("banners-imagenes")
      .upload(nombreUnico, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (storageError) {
      console.error("❌ Error en Supabase:", storageError.message);
      return res.status(500).json({ error: "Error al subir imagen: " + storageError.message });
    }

    const archivoDb = await prisma.archivo.create({
      data: {
        nombreOriginal: file.originalname,
        nombreArchivo: nombreUnico,
        ruta: `banners-imagenes/${nombreUnico}`,
        extension: extension,
        mimeType: file.mimetype,
        tamanioBytes: BigInt(file.size),
      },
    });

    const targetPage = page || "Inicio";
    const descripcionConPage = `[PAGE:${targetPage}]${descripcion || ""}`;

    const ultimoBanner = await prisma.banner.findFirst({
      orderBy: { orden: "desc" },
    });
    const nuevoOrden = orden ? parseInt(orden, 10) : (ultimoBanner ? ultimoBanner.orden + 1 : 1);

    const nuevoBanner = await prisma.banner.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcionConPage,
        enlace: enlace || null,
        orden: nuevoOrden,
        activo: activo === "true" || activo === true,
        archivo: {
          connect: { id: archivoDb.id }
        },
        ...(usuarioLocal && {
          usuario_banner_createdByTousuario: {
            connect: { id: usuarioLocal.id }
          }
        }),
        updatedAt: new Date(),
      },
      include: {
        archivo: true,
      },
    });

    const { data: publicUrlData } = supabase.storage
      .from("banners-imagenes")
      .getPublicUrl(nombreUnico);

    return res.status(201).json({
      message: "¡Banner creado exitosamente!",
      banner: {
        ...nuevoBanner,
        id: nuevoBanner.id.toString(),
        titulo: nuevoBanner.titulo,
        descripcion: descripcion || "",
        page: targetPage,
        imageUrl: publicUrlData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Error al crear banner:", error);
    return res.status(500).json({ error: "Error interno al crear el banner." });
  }
};

export const actualizarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, enlace, page, activo } = req.body;
    const file = req.file;

    const bannerExistente = await prisma.banner.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!bannerExistente) {
      return res.status(404).json({ error: "Banner no encontrado." });
    }

    let nuevoArchivoId = bannerExistente.archivoId;

    // Si el usuario subió una nueva imagen recortada, reemplazamos la anterior en Supabase y BD
    if (file) {
      const extension = file.originalname.split(".").pop().toLowerCase() || "png";
      const nombreUnico = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("banners-imagenes")
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (storageError) {
        return res.status(500).json({ error: "Error al subir nueva imagen: " + storageError.message });
      }

      // Creamos el nuevo archivo
      const nuevoArchivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `banners-imagenes/${nombreUnico}`,
          extension: extension,
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size),
        },
      });

      nuevoArchivoId = nuevoArchivoDb.id;

      // Opcional: Borramos el archivo viejo de Supabase si existía
      if (bannerExistente.archivo) {
        await supabase.storage.from("banners-imagenes").remove([bannerExistente.archivo.nombreArchivo]);
        await prisma.archivo.delete({ where: { id: bannerExistente.archivo.id } }).catch(() => {});
      }
    }

    const targetPage = page || "Inicio";
    const descripcionConPage = `[PAGE:${targetPage}]${descripcion || ""}`;

    const bannerActualizado = await prisma.banner.update({
      where: { id: BigInt(id) },
      data: {
        titulo: titulo ? titulo.trim() : bannerExistente.titulo,
        descripcion: descripcionConPage,
        enlace: enlace !== undefined ? enlace : bannerExistente.enlace,
        activo: activo !== undefined ? (activo === "true" || activo === true) : bannerExistente.activo,
        archivo: {
          connect: { id: nuevoArchivoId }
        },
        updatedAt: new Date(),
      },
      include: { archivo: true },
    });

    let imageUrl = null;
    if (bannerActualizado.archivo) {
      const { data } = supabase.storage
        .from("banners-imagenes")
        .getPublicUrl(bannerActualizado.archivo.nombreArchivo);
      imageUrl = data.publicUrl;
    }

    return res.status(200).json({
      message: "¡Banner actualizado correctamente!",
      banner: {
        ...bannerActualizado,
        id: bannerActualizado.id.toString(),
        titulo: bannerActualizado.titulo,
        descripcion: descripcion || "",
        page: targetPage,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("Error al actualizar banner:", error);
    return res.status(500).json({ error: "Error al actualizar el banner: " + error.message });
  }
};

export const eliminarBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!banner) {
      return res.status(404).json({ error: "Banner no encontrado." });
    }

    // Borramos el archivo físico en Supabase si existe asociado
    if (banner.archivo) {
      await supabase.storage.from("banners-imagenes").remove([banner.archivo.nombreArchivo]);
    }

    // Eliminamos el banner de la base de datos
    await prisma.banner.delete({
      where: { id: BigInt(id) },
    });

    // Limpiamos la tabla archivo asociada si es necesario
    if (banner.archivo) {
      await prisma.archivo.delete({ where: { id: banner.archivo.id } }).catch(() => {});
    }

    return res.status(200).json({ message: "¡Banner eliminado con éxito!" });
  } catch (error) {
    console.error("Error al eliminar banner:", error);
    return res.status(500).json({ error: "Error al eliminar el banner: " + error.message });
  }
};