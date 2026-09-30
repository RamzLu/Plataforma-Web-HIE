import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

class CmsProfesionalService {
  async obtenerProfesionales() {
    const profesionales = await prisma.profesional.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        especialidad: true,
        archivo: true
      },
    });

    return profesionales.map((prof) => {
      let pubUrl = "";
      if (prof.archivo) {
        const { data } = supabase.storage
          .from("noticias-imagenes")
          .getPublicUrl(prof.archivo.nombreArchivo);
        pubUrl = data.publicUrl;
      }

      return {
        id: prof.id.toString(),
        nombre: prof.nombre,
        apellido: prof.apellido,
        matricula: prof.matricula || "",
        cargo: prof.cargo || "",
        descripcion: prof.descripcion || "",
        especialidadNombre: prof.especialidad?.nombre || "Sin Asignar",
        esServicioClave: prof.especialidad?.esServicio || false,
        especialidadId: prof.especialidadId.toString(),
        publicado: prof.activo,
        imagenUrl: pubUrl
      };
    });
  }

  async crearProfesional(data, file) {
    // Recibimos especialidadId desde el frontend
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId } = data;

    if (!nombre || !apellido || !especialidadId) {
      const error = new Error("Nombre, apellido y especialidad son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    // Verificamos que la especialidad/servicio exista
    const especialidad = await prisma.especialidad.findUnique({
      where: { id: BigInt(especialidadId) }
    });

    if (!especialidad) {
      const error = new Error("El área seleccionada no existe.");
      error.statusCode = 404;
      throw error;
    }

    let archivoId = null;

    if (file) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'prof');
      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const error = new Error("Error subiendo imagen: " + storageError.message);
        error.statusCode = 500;
        throw error;
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
      archivoId = archivoDb.id;
    }

    const nuevoProfesional = await prisma.profesional.create({
      data: {
        nombre,
        apellido,
        matricula,
        cargo,
        descripcion,
        especialidadId: especialidad.id,
        archivoId: archivoId,
        activo: true,
        updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true }
    });

    let pubUrl = "";
    if (nuevoProfesional.archivo) {
      const { data } = supabase.storage
        .from("noticias-imagenes")
        .getPublicUrl(nuevoProfesional.archivo.nombreArchivo);
      pubUrl = data.publicUrl;
    }

    return {
      message: "¡Profesional creado con éxito!",
      profesional: {
        id: nuevoProfesional.id.toString(),
        nombre: nuevoProfesional.nombre,
        apellido: nuevoProfesional.apellido,
        matricula: nuevoProfesional.matricula,
        cargo: nuevoProfesional.cargo,
        descripcion: nuevoProfesional.descripcion,
        especialidadNombre: nuevoProfesional.especialidad.nombre,
        esServicioClave: nuevoProfesional.especialidad.esServicio,
        publicado: nuevoProfesional.activo,
        imagenUrl: pubUrl
      }
    };
  }

  async eliminarProfesional(id) {
    const profesional = await prisma.profesional.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!profesional) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (profesional.archivo) {
      await supabase.storage.from("noticias-imagenes").remove([profesional.archivo.nombreArchivo]);
      await prisma.archivo.delete({ where: { id: profesional.archivo.id } });
    }

    await prisma.profesional.delete({ where: { id: BigInt(id) } });

    return { message: "¡Profesional eliminado con éxito!" };
  }
}

export default new CmsProfesionalService();