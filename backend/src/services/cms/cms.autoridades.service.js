import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const BUCKET_NAME = "autoridades-imagenes";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Serializa una autoridad de BD a formato JSON seguro (BigInt → string)
const serializarAutoridad = (autoridad) => {
  let imagenUrl = null;
  if (autoridad.archivo) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(autoridad.archivo.nombreArchivo);
    imagenUrl = data.publicUrl;
  }

  return {
    id: autoridad.id.toString(),
    nombre: autoridad.nombre,
    cargo: autoridad.cargo,
    descripcion: autoridad.descripcion || "",
    orden: autoridad.orden,
    activo: autoridad.activo,
    imagenId: autoridad.imagenId ? autoridad.imagenId.toString() : null,
    imagenUrl,
    nombreArchivo: autoridad.archivo?.nombreOriginal || null,
  };
};

/**
 * Sube una imagen al bucket de Supabase y registra el archivo en la tabla `archivo`.
 * @param {Express.Multer.File} file
 * @returns {Promise<import("@prisma/client").archivo>}
 */
async function subirImagenYRegistrar(file) {
  const { nombreUnico, extension } = generarNombreUnico(file.originalname, "aut");

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(nombreUnico, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (storageError) {
    const err = new Error("Error al subir imagen a Supabase: " + storageError.message);
    err.statusCode = 500;
    throw err;
  }

  const archivoDb = await prisma.archivo.create({
    data: {
      nombreOriginal: file.originalname,
      nombreArchivo: nombreUnico,
      ruta: `${BUCKET_NAME}/${nombreUnico}`,
      extension,
      mimeType: file.mimetype,
      tamanioBytes: BigInt(file.size),
    },
  });

  return archivoDb;
}

/**
 * Elimina una imagen del Storage y su registro en tabla `archivo` (best-effort, no lanza errores).
 * @param {{ id: BigInt, nombreArchivo: string }|null} archivo
 */
async function limpiarImagenAnterior(archivo) {
  if (!archivo) return;
  await supabase.storage.from(BUCKET_NAME).remove([archivo.nombreArchivo]).catch(() => {});
  await prisma.archivo.delete({ where: { id: archivo.id } }).catch(() => {});
}

class CmsAutoridadesService {
  // ─── LISTAR AUTORIDADES ───────────────────────────────────────────────────

  async obtenerAutoridades() {
    const autoridades = await prisma.autoridad.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { archivo: true },
    });

    return autoridades.map(serializarAutoridad);
  }

  // ─── OBTENER DATOS INSTITUCIONALES (autoridades + redes) ──────────────────

  async obtenerInstitucional() {
    const [autoridades, configs] = await Promise.all([
      prisma.autoridad.findMany({
        where: { activo: true },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
        include: { archivo: true },
      }),
      prisma.configuracion.findMany({
        where: { clave: { in: ["SOCIAL_FACEBOOK", "SOCIAL_INSTAGRAM"] } },
      }),
    ]);

    const redesSociales = {
      facebook: configs.find((c) => c.clave === "SOCIAL_FACEBOOK")?.valor || "",
      instagram: configs.find((c) => c.clave === "SOCIAL_INSTAGRAM")?.valor || "",
    };

    return {
      autoridades: autoridades.map(serializarAutoridad),
      redesSociales,
    };
  }

  // ─── CREAR AUTORIDAD ──────────────────────────────────────────────────────

  async crearAutoridad(data, file) {
    const { nombre, cargo, descripcion, orden } = data;

    if (!nombre?.trim() || !cargo?.trim()) {
      const err = new Error("El nombre y el cargo de la autoridad son obligatorios.");
      err.statusCode = 400;
      throw err;
    }

    // Orden automático si no se especifica
    const ordenFinal =
      orden !== undefined && orden !== ""
        ? Number(orden)
        : (await prisma.autoridad.count()) + 1;

    let imagenId = null;
    if (file) {
      const archivoDb = await subirImagenYRegistrar(file);
      imagenId = archivoDb.id;
    }

    const nueva = await prisma.autoridad.create({
      data: {
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        descripcion: descripcion?.trim() || null,
        orden: ordenFinal,
        activo: true,
        ...(imagenId && { archivo: { connect: { id: imagenId } } }),
      },
      include: { archivo: true },
    });

    return {
      message: "¡Autoridad creada correctamente!",
      autoridad: serializarAutoridad(nueva),
    };
  }

  // ─── ACTUALIZAR AUTORIDAD ─────────────────────────────────────────────────

  async actualizarAutoridad(id, data, file) {
    const { nombre, cargo, descripcion, orden } = data;

    const existente = await prisma.autoridad.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!existente) {
      const err = new Error("Autoridad no encontrada.");
      err.statusCode = 404;
      throw err;
    }

    // Si llega nueva imagen: subir la nueva y limpiar la anterior
    let nuevoArchivoId = existente.imagenId;
    if (file) {
      const archivoDb = await subirImagenYRegistrar(file);
      nuevoArchivoId = archivoDb.id;
      await limpiarImagenAnterior(existente.archivo);
    }

    const actualizada = await prisma.autoridad.update({
      where: { id: BigInt(id) },
      data: {
        nombre: nombre?.trim() ?? existente.nombre,
        cargo: cargo?.trim() ?? existente.cargo,
        descripcion:
          descripcion !== undefined
            ? descripcion.trim() || null
            : existente.descripcion,
        orden:
          orden !== undefined && orden !== ""
            ? Number(orden)
            : existente.orden,
        // Solo reconectar si cambió la imagen
        ...(nuevoArchivoId !== existente.imagenId && {
          archivo: nuevoArchivoId
            ? { connect: { id: nuevoArchivoId } }
            : { disconnect: true },
        }),
      },
      include: { archivo: true },
    });

    return {
      message: "¡Autoridad actualizada correctamente!",
      autoridad: serializarAutoridad(actualizada),
    };
  }

  // ─── ELIMINAR AUTORIDAD ───────────────────────────────────────────────────

  async eliminarAutoridad(id) {
    const existente = await prisma.autoridad.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true },
    });

    if (!existente) {
      const err = new Error("Autoridad no encontrada.");
      err.statusCode = 404;
      throw err;
    }

    // Primero eliminar la autoridad (para liberar FK), luego limpiar imagen
    await prisma.autoridad.delete({ where: { id: BigInt(id) } });
    await limpiarImagenAnterior(existente.archivo);

    return { message: "¡Autoridad eliminada correctamente!" };
  }

  // ─── REORDENAR AUTORIDADES ─────────────────────────────────────────────────

  async reordenarAutoridades(ordenIds) {
    if (!Array.isArray(ordenIds) || ordenIds.length === 0) {
      const err = new Error("Se requiere un arreglo de IDs para reordenar.");
      err.statusCode = 400;
      throw err;
    }

    // Se utiliza Promise.all para compatibilidad con el pooler de Supabase
    await Promise.all(
      ordenIds.map((id, index) =>
        prisma.autoridad.update({
          where: { id: BigInt(id) },
          data: { orden: index + 1 },
        })
      )
    );

    return { message: "¡Orden de autoridades actualizado correctamente!" };
  }

  // ─── REDES SOCIALES ───────────────────────────────────────────────────────

  async actualizarRedesSociales({ facebook, instagram }) {
    const now = new Date();

    await Promise.all([
      prisma.configuracion.upsert({
        where: { clave: "SOCIAL_FACEBOOK" },
        update: { valor: facebook || "", updatedAt: now },
        create: {
          clave: "SOCIAL_FACEBOOK",
          valor: facebook || "",
          descripcion: "Enlace oficial de Facebook",
          updatedAt: now,
        },
      }),
      prisma.configuracion.upsert({
        where: { clave: "SOCIAL_INSTAGRAM" },
        update: { valor: instagram || "", updatedAt: now },
        create: {
          clave: "SOCIAL_INSTAGRAM",
          valor: instagram || "",
          descripcion: "Enlace oficial de Instagram",
          updatedAt: now,
        },
      }),
    ]);

    return { facebook: facebook || "", instagram: instagram || "" };
  }
}

export default new CmsAutoridadesService();
