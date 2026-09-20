import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY
);

class CmsBannersService {
  async obtenerBanners() {
    const banners = await prisma.banner.findMany({
      orderBy: { orden: "asc" },
      include: { archivo: true },
    });

    return banners.map((banner) => {
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
  }

  async crearBanner(data, file, user) {
    const { titulo, descripcion, enlace, page, orden, activo } = data;

    if (!titulo || titulo.trim() === "") {
      const error = new Error("El título del banner es obligatorio para garantizar la accesibilidad.");
      error.statusCode = 400;
      throw error;
    }

    if (!file) {
      const error = new Error("Es obligatorio subir una imagen para el banner.");
      error.statusCode = 400;
      throw error;
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'banner');

    const { error: storageError } = await supabase.storage
      .from("banners-imagenes")
      .upload(nombreUnico, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (storageError) {
      const error = new Error("Error al subir imagen a Supabase: " + storageError.message);
      error.statusCode = 500;
      throw error;
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
        archivo: { connect: { id: archivoDb.id } },
        ...(usuarioLocal && {
          usuario_banner_createdByTousuario: { connect: { id: usuarioLocal.id } }
        }),
        updatedAt: new Date(),
      },
      include: { archivo: true },
    });

    const { data: publicUrlData } = supabase.storage
      .from("banners-imagenes")
      .getPublicUrl(nombreUnico);

    return {
      message: "¡Banner creado exitosamente!",
      banner: {
        ...nuevoBanner,
        id: nuevoBanner.id.toString(),
        titulo: nuevoBanner.titulo,
        descripcion: descripcion || "",
        page: targetPage,
        imageUrl: publicUrlData.publicUrl,
      },
    };
  }

  async actualizarBanner(id, data, file) {
    const { titulo, descripcion, enlace, page, activo } = data;

    const bannerExistente = await prisma.banner.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!bannerExistente) {
      const error = new Error("Banner no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    let nuevoArchivoId = bannerExistente.archivoId;

    if (file) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'banner');

      const { error: storageError } = await supabase.storage
        .from("banners-imagenes")
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (storageError) {
        const error = new Error("Error al subir nueva imagen: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

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
        archivo: { connect: { id: nuevoArchivoId } },
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

    return {
      message: "¡Banner actualizado correctamente!",
      banner: {
        ...bannerActualizado,
        id: bannerActualizado.id.toString(),
        titulo: bannerActualizado.titulo,
        descripcion: descripcion || "",
        page: targetPage,
        imageUrl,
      },
    };
  }

  async eliminarBanner(id) {
    if (!id || !/^\d+$/.test(id)) {
      const error = new Error("ID de banner inválido o malformado.");
      error.statusCode = 400;
      throw error;
    }

    const banner = await prisma.banner.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!banner) {
      const error = new Error("Banner no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (banner.archivo) {
      await supabase.storage.from("banners-imagenes").remove([banner.archivo.nombreArchivo]);
    }

    await prisma.banner.delete({
      where: { id: BigInt(id) },
    });

    if (banner.archivo) {
      await prisma.archivo.delete({ where: { id: banner.archivo.id } }).catch(() => {});
    }

    return { message: "¡Banner eliminado con éxito!" };
  }
}

export default new CmsBannersService();