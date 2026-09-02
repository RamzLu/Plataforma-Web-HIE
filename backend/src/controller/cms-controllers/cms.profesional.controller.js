import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
);

// ==========================================
// 1. OBTENER PROFESIONALES (CMS)
// ==========================================
export const obtenerProfesionales = async (req, res) => {
  try {
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

    const profesionalesFormateados = profesionales.map((prof) => {
      let pubUrl = "";
      if (prof.archivo) {
        const { data } = supabase.storage.from("noticias-imagenes").getPublicUrl(prof.archivo.nombreArchivo);
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

    return res.status(200).json(profesionalesFormateados);
  } catch (error) {
    console.error("Error al obtener profesionales:", error);
    return res.status(500).json({ error: "Error al cargar los profesionales." });
  }
};

// ==========================================
// 2. CREAR PROFESIONAL
// ==========================================
export const crearProfesional = async (req, res) => {
  try {
    const { nombre, apellido, matricula, cargo, descripcion, especialidadNombre, areaNombre } = req.body;
    const archivoSubido = req.file; // Imagen de perfil

    if (!nombre || !apellido) {
      return res.status(400).json({ error: "Nombre y apellido son obligatorios." });
    }

    // Buscar o crear la especialidad por defecto
    let especialidad = await prisma.especialidad.findFirst({
      where: { nombre: especialidadNombre || "Especialidad médica" }
    });
    if (!especialidad) {
      especialidad = await prisma.especialidad.create({
        data: { nombre: especialidadNombre || "Especialidad médica", descripcion: "Creada automáticamente" }
      });
    }

    let archivoId = null;

    // Subir imagen a Supabase si existe
    if (archivoSubido) {
      const extension = archivoSubido.originalname.split(".").pop().toLowerCase() || "png";
      const nombreUnico = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("noticias-imagenes") // Puedes usar un bucket propio de profesionales si prefieres
        .upload(nombreUnico, archivoSubido.buffer, { contentType: archivoSubido.mimetype, upsert: true });

      if (storageError) {
        return res.status(500).json({ error: "Error subiendo imagen: " + storageError.message });
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: archivoSubido.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension,
          mimeType: archivoSubido.mimetype,
          tamanioBytes: BigInt(archivoSubido.size),
        },
      });
      archivoId = archivoDb.id;
    }

    // Crear el profesional en la BD
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

    // Si viene un área específica, la vinculamos
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
      const { data } = supabase.storage.from("noticias-imagenes").getPublicUrl(nuevoProfesional.archivo.nombreArchivo);
      pubUrl = data.publicUrl;
    }

    return res.status(201).json({
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
    });

  } catch (error) {
    console.error("Error al crear profesional:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
};

// ==========================================
// 3. ELIMINAR PROFESIONAL
// ==========================================
export const eliminarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const profesional = await prisma.profesional.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!profesional) return res.status(404).json({ error: "Profesional no encontrado." });

    if (profesional.archivo) {
      await supabase.storage.from("noticias-imagenes").remove([profesional.archivo.nombreArchivo]);
      await prisma.archivo.delete({ where: { id: profesional.archivo.id } });
    }

    await prisma.profesional.delete({ where: { id: BigInt(id) } });

    return res.status(200).json({ message: "¡Profesional eliminado con éxito!" });
  } catch (error) {
    console.error("Error al eliminar profesional:", error);
    return res.status(500).json({ error: "Error al eliminar: " + error.message });
  }
};