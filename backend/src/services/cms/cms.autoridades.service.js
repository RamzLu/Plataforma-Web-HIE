import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { generarNombreUnico } from "../../utils/file.utils.js";
import { validarUrlHttp, sanitizarUrlLectura, parsearIdBigInt } from "../../utils/sanitize.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const BUCKET_NAME = "autoridades-imagenes";

const UBICACION_SEDE_CENTRAL = "seccion-sede-central";
const TIPO_SEDE_CENTRAL = "Tarjeta Institucional";

export const DEFAULT_SEDE_CENTRAL = {
  id: null,
  titulo: "Edificio Principal - Hospital Evita",
  tagSuperior: "SEDE CENTRAL",
  direccion: "Av. José de Luca Barberis N° 250, Formosa, Argentina",
  parrafoDescripcion:
    "Infraestructura médica de vanguardia con 19.000 m² cubiertos diseñados bajo normas internacionales de arquitectura hospitalaria. Alberga la Guardia Central de Urgencias (24 hs), bloques quirúrgicos inteligentes, unidades de cuidados intensivos y el centro de diagnóstico por imágenes.",
  badgeAtencion: "Guardia Activa 24 Hs.",
  altText: "Edificio Principal Hospital Evita",
  presetKey: "foto-sede",
  imagenUrl: null,
  nombreArchivo: null,
};

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
    console.error("[Storage] Error al subir imagen de autoridad:", storageError.message);
    const err = new Error("No se pudo almacenar la imagen de la autoridad.");
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
    let institucion = await prisma.informacion_institucional.findFirst({
      include: { contacto_institucional: true },
    });

    if (!institucion) {
      institucion = await prisma.informacion_institucional.create({
        data: {
          nombre: "Hospital Interdistrital Evita",
          direccion: "Av. Principal 1234",
          localidad: "Formosa",
          provincia: "Formosa",
          updatedAt: new Date(),
        },
        include: { contacto_institucional: true },
      });
    }

    const contactos = institucion.contacto_institucional || [];
    const facebookContacto = contactos.find((c) => c.redSocial.toLowerCase() === "facebook");
    const instagramContacto = contactos.find((c) => c.redSocial.toLowerCase() === "instagram");

    const autoridades = await prisma.autoridad.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { archivo: true },
    });

    const sedeCentral = await this.obtenerSedeCentral();

    return {
      autoridades: autoridades.map(serializarAutoridad),
      redesSociales: {
        facebook: sanitizarUrlLectura(facebookContacto?.enlace, ""),
        instagram: sanitizarUrlLectura(instagramContacto?.enlace, ""),
      },
      sedeCentral,
    };
  }

  // ─── OBTENER SEDE CENTRAL (Tarjeta Institucional de Acerca de) ───────────

  async obtenerSedeCentral() {
    try {
      const ubicacion = await prisma.ubicacion_contenido_grafico.findUnique({
        where: { nombre: UBICACION_SEDE_CENTRAL },
      });

      if (!ubicacion) {
        return { ...DEFAULT_SEDE_CENTRAL };
      }

      const fila = await prisma.contenido_grafico.findFirst({
        where: { ubicacionId: ubicacion.id, activo: true },
        include: { archivo: true },
        orderBy: { updatedAt: "desc" },
      });

      if (!fila) {
        return { ...DEFAULT_SEDE_CENTRAL };
      }

      let meta = {};
      try {
        if (fila.descripcion) {
          meta = JSON.parse(fila.descripcion);
        }
      } catch {
        // En caso de texto simple heredado
      }

      let imagenUrl = null;
      if (fila.archivo) {
        let bucket = BUCKET_NAME;
        if (typeof fila.archivo.ruta === "string" && fila.archivo.ruta.includes("/")) {
          bucket = fila.archivo.ruta.split("/")[0] || BUCKET_NAME;
        }
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(fila.archivo.nombreArchivo);
        imagenUrl = data?.publicUrl || null;
      }

      return {
        id: fila.id.toString(),
        titulo: fila.titulo || DEFAULT_SEDE_CENTRAL.titulo,
        tagSuperior: meta.tagSuperior || DEFAULT_SEDE_CENTRAL.tagSuperior,
        direccion: meta.direccion || DEFAULT_SEDE_CENTRAL.direccion,
        parrafoDescripcion:
          meta.parrafoDescripcion || DEFAULT_SEDE_CENTRAL.parrafoDescripcion,
        badgeAtencion: meta.badgeAtencion !== undefined ? meta.badgeAtencion : DEFAULT_SEDE_CENTRAL.badgeAtencion,
        altText: fila.altText || DEFAULT_SEDE_CENTRAL.altText,
        presetKey: meta.presetKey || (fila.archivo ? null : DEFAULT_SEDE_CENTRAL.presetKey),
        imagenUrl,
        nombreArchivo: fila.archivo?.nombreOriginal || null,
      };
    } catch (err) {
      console.error("[CmsAutoridadesService] Error al obtener sede central:", err);
      return { ...DEFAULT_SEDE_CENTRAL };
    }
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
    const idBigInt = parsearIdBigInt(id, "ID de autoridad");
    const { nombre, cargo, descripcion, orden } = data;

    const existente = await prisma.autoridad.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existente) {
      const err = new Error("Autoridad no encontrada.");
      err.statusCode = 404;
      throw err;
    }

    // Validación: verificar si hubo cambios antes de procesar archivos o base de datos
    const nombreIgual = nombre === undefined || nombre.trim() === (existente.nombre || "").trim();
    const cargoIgual = cargo === undefined || cargo.trim() === (existente.cargo || "").trim();
    const descIgual = descripcion === undefined || (descripcion ? descripcion.trim() : "") === (existente.descripcion || "").trim();
    const ordenIgual = orden === undefined || Number(orden) === Number(existente.orden);

    if (!file && nombreIgual && cargoIgual && descIgual && ordenIgual) {
      const err = new Error("No se detectaron cambios para actualizar.");
      err.statusCode = 400;
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
      where: { id: idBigInt },
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
    const idBigInt = parsearIdBigInt(id, "ID de autoridad");
    const existente = await prisma.autoridad.findUnique({
      where: { id: idBigInt },
      include: { archivo: true },
    });

    if (!existente) {
      const err = new Error("Autoridad no encontrada.");
      err.statusCode = 404;
      throw err;
    }

    // Primero eliminar la autoridad (para liberar FK), luego limpiar imagen
    await prisma.autoridad.delete({ where: { id: idBigInt } });
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

    const idsValidados = ordenIds.map((id) => parsearIdBigInt(id, "ID de autoridad"));

    // Se utiliza Promise.all para compatibilidad con el pooler de Supabase
    await Promise.all(
      idsValidados.map((idBigInt, index) =>
        prisma.autoridad.update({
          where: { id: idBigInt },
          data: { orden: index + 1 },
        })
      )
    );

    return { message: "¡Orden de autoridades actualizado correctamente!" };
  }

  // ─── REDES SOCIALES ───────────────────────────────────────────────────────

  async actualizarRedesSociales({ facebook, instagram }) {
    // Validar esquemas http(s) antes de persistir para impedir XSS via javascript: en href (V10)
    const fbEnlace = validarUrlHttp(facebook, "enlace de Facebook");
    const igEnlace = validarUrlHttp(instagram, "enlace de Instagram");

    let institucion = await prisma.informacion_institucional.findFirst();
    if (!institucion) {
      institucion = await prisma.informacion_institucional.create({
        data: {
          nombre: "Hospital Interdistrital Evita",
          direccion: "Av. Principal 1234",
          localidad: "Formosa",
          provincia: "Formosa",
          updatedAt: new Date(),
        },
      });
    }

    const institucionId = institucion.id;

    await Promise.all([
      prisma.contacto_institucional.upsert({
        where: {
          institucionId_redSocial: {
            institucionId,
            redSocial: "facebook",
          },
        },
        update: { enlace: fbEnlace },
        create: {
          institucionId,
          redSocial: "facebook",
          enlace: fbEnlace,
        },
      }),
      prisma.contacto_institucional.upsert({
        where: {
          institucionId_redSocial: {
            institucionId,
            redSocial: "instagram",
          },
        },
        update: { enlace: igEnlace },
        create: {
          institucionId,
          redSocial: "instagram",
          enlace: igEnlace,
        },
      }),
    ]);

    return { facebook: fbEnlace, instagram: igEnlace };
  }

  // ─── ACTUALIZAR SEDE CENTRAL (Tarjeta Institucional de Acerca de) ─────────

  async actualizarSedeCentral(data, file, user) {
    const titulo = (data.titulo || "").trim() || DEFAULT_SEDE_CENTRAL.titulo;
    const tagSuperior = (data.tagSuperior || "SEDE CENTRAL").trim();
    const direccion = (data.direccion || "").trim() || DEFAULT_SEDE_CENTRAL.direccion;
    const parrafoDescripcion = (data.parrafoDescripcion || "").trim() || DEFAULT_SEDE_CENTRAL.parrafoDescripcion;
    const badgeAtencion = data.badgeAtencion !== undefined ? (data.badgeAtencion || "").trim() : DEFAULT_SEDE_CENTRAL.badgeAtencion;
    const altText = (data.altText || "").trim() || DEFAULT_SEDE_CENTRAL.altText;
    const presetKey = (data.presetKey || "").trim() || (file ? null : DEFAULT_SEDE_CENTRAL.presetKey);

    // Validación: verificar si hubo cambios en los datos o fotografía
    const sedeExistente = await this.obtenerSedeCentral();
    const tituloIgual = titulo === (sedeExistente.titulo || DEFAULT_SEDE_CENTRAL.titulo);
    const tagIgual = tagSuperior === (sedeExistente.tagSuperior || DEFAULT_SEDE_CENTRAL.tagSuperior);
    const dirIgual = direccion === (sedeExistente.direccion || DEFAULT_SEDE_CENTRAL.direccion);
    const descIgual = parrafoDescripcion === (sedeExistente.parrafoDescripcion || DEFAULT_SEDE_CENTRAL.parrafoDescripcion);
    const badgeIgual = badgeAtencion === (sedeExistente.badgeAtencion || DEFAULT_SEDE_CENTRAL.badgeAtencion);
    const altIgual = altText === (sedeExistente.altText || DEFAULT_SEDE_CENTRAL.altText);

    if (!file && tituloIgual && tagIgual && dirIgual && descIgual && badgeIgual && altIgual) {
      const err = new Error("No se detectaron cambios para actualizar.");
      err.statusCode = 400;
      throw err;
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    // Asegurar registros de catálogo tipo y ubicación
    const tipoDb = await prisma.tipo_contenido_grafico.upsert({
      where: { nombre: TIPO_SEDE_CENTRAL },
      update: { activo: true },
      create: {
        nombre: TIPO_SEDE_CENTRAL,
        descripcion: "Tarjeta Institucional del Portal",
        activo: true,
      },
    });

    const ubicacionDb = await prisma.ubicacion_contenido_grafico.upsert({
      where: { nombre: UBICACION_SEDE_CENTRAL },
      update: { descripcion: "Sección Sede Central (Acerca de)", activo: true },
      create: {
        nombre: UBICACION_SEDE_CENTRAL,
        descripcion: "Sección Sede Central (Acerca de)",
        activo: true,
      },
    });

    const filaExistente = await prisma.contenido_grafico.findFirst({
      where: { ubicacionId: ubicacionDb.id },
      include: { archivo: true },
      orderBy: { updatedAt: "desc" },
    });

    let archivoId = filaExistente?.archivoId || null;
    if (file) {
      const archivoNuevo = await subirImagenYRegistrar(file);
      archivoId = archivoNuevo.id;
      if (filaExistente?.archivo) {
        await limpiarImagenAnterior(filaExistente.archivo);
      }
    }

    const metaJson = JSON.stringify({
      tagSuperior,
      direccion,
      parrafoDescripcion,
      badgeAtencion,
      presetKey: archivoId ? null : presetKey,
    });

    if (filaExistente) {
      await prisma.contenido_grafico.update({
        where: { id: filaExistente.id },
        data: {
          titulo,
          descripcion: metaJson,
          altText,
          archivoId,
          updatedBy: usuarioLocal.id,
          updatedAt: new Date(),
          activo: true,
          estado: "PUBLICADO",
        },
      });
    } else {
      await prisma.contenido_grafico.create({
        data: {
          titulo,
          descripcion: metaJson,
          altText,
          archivoId,
          orden: 1,
          activo: true,
          pagina: "Acerca de",
          tipoId: tipoDb.id,
          ubicacionId: ubicacionDb.id,
          estado: "PUBLICADO",
          createdBy: usuarioLocal.id,
          updatedBy: usuarioLocal.id,
          updatedAt: new Date(),
        },
      });
    }

    await prisma.auditoria
      .create({
        data: {
          usuarioId: usuarioLocal.id,
          accion: "ACTUALIZAR",
          entidad: "informacion_institucional",
          entidadId: UBICACION_SEDE_CENTRAL,
          descripcion: "Actualizó los datos y fotografía de la Sede Central en Acerca de",
        },
      })
      .catch(() => {});

    const sedeCentralActualizada = await this.obtenerSedeCentral();

    return {
      message: "¡Sede Central actualizada correctamente!",
      sedeCentral: sedeCentralActualizada,
    };
  }
}

export default new CmsAutoridadesService();
