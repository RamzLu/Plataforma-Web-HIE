import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

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
        archivo: true,
        profesional_area: {
          include: { area: true }
        }
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
        tipo: prof.especialidad?.nombre || "Especialidad médica",
        area: prof.profesional_area[0]?.area?.nombre || "General",
        especialidadId: prof.especialidadId.toString(),
        publicado: prof.activo,
        imagenUrl: pubUrl
      };
    });
  }

  async crearProfesional(data, file) {
    const { nombre, apellido, matricula, cargo, descripcion, especialidadNombre, areaNombre } = data;

    if (!nombre || !apellido) {
      const error = new Error("Nombre y apellido son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    let especialidad = await prisma.especialidad.findFirst({
      where: { nombre: especialidadNombre || "Especialidad médica" }
    });
    if (!especialidad) {
      especialidad = await prisma.especialidad.create({
        data: { nombre: especialidadNombre || "Especialidad médica", descripcion: "Creada automáticamente" }
      });
    }

    let archivoId = null;

    if (file) {
      const extension = file.originalname.split(".").pop().toLowerCase() || "png";
      const nombreUnico = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

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
          extension,
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

    if (areaNombre) {
      let areaDb = await prisma.area.findFirst({ where: { nombre: areaNombre } });
      if (!areaDb) {
        areaDb = await prisma.area.create({ data: { nombre: areaNombre } });
      }
      await prisma.profesional_area.create({
        data: {
          profesionalId: nuevoProfesional.id,
          areaId: areaDb.id
        }
      });
    }

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
        tipo: nuevoProfesional.especialidad.nombre,
        area: areaNombre || "General",
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