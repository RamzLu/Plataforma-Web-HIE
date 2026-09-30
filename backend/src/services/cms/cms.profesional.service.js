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
        archivo: true,
        profesional_area: { include: { area: true } }
      },
    });

    const servicios = await prisma.servicio.findMany();

    return profesionales.map((prof) => {
      let pubUrl = "";
      if (prof.archivo) {
        const { data } = supabase.storage
          .from("noticias-imagenes")
          .getPublicUrl(prof.archivo.nombreArchivo);
        pubUrl = data.publicUrl;
      }

      // Lógica Puente: Verificamos si está guardado como un Servicio en la tabla Area
      const isServicio = prof.especialidad?.nombre === "Servicio Clave";
      let nombreMostrar = prof.especialidad?.nombre || "Sin Asignar";
      let realIdForFrontend = prof.especialidadId.toString();

      if (isServicio && prof.profesional_area.length > 0) {
        nombreMostrar = prof.profesional_area[0].area.nombre;
        const matchedServicio = servicios.find(s => s.nombre === nombreMostrar);
        if (matchedServicio) {
          realIdForFrontend = matchedServicio.id.toString();
        }
      }

      return {
        id: prof.id.toString(),
        nombre: prof.nombre,
        apellido: prof.apellido,
        matricula: prof.matricula || "",
        cargo: prof.cargo || "",
        descripcion: prof.descripcion || "",
        especialidadNombre: nombreMostrar,
        esServicioClave: isServicio,
        especialidadId: realIdForFrontend,
        publicado: prof.activo,
        imagenUrl: pubUrl
      };
    });
  }

  async crearProfesional(data, file) {
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId, esServicio } = data;

    if (!nombre || !apellido || !especialidadId) {
      const error = new Error("Nombre, apellido y área asignada son obligatorios.");
      error.statusCode = 400; throw error;
    }

    let finalEspecialidadId;
    let finalAreaNombre = null;

    // Lógica Puente: Si es servicio, validamos en tabla Servicio y usamos puente en Area
    if (esServicio === 'true') {
      const servicio = await prisma.servicio.findUnique({ where: { id: BigInt(especialidadId) }});
      if (!servicio) {
        const error = new Error("El servicio clave seleccionado no existe.");
        error.statusCode = 404; throw error;
      }
      finalAreaNombre = servicio.nombre;
      
      let genEsp = await prisma.especialidad.findFirst({ where: { nombre: "Servicio Clave" }});
      if (!genEsp) genEsp = await prisma.especialidad.create({ data: { nombre: "Servicio Clave", descripcion: "Clasificación interna para servicios" }});
      finalEspecialidadId = genEsp.id;
    } else {
      const esp = await prisma.especialidad.findUnique({ where: { id: BigInt(especialidadId) }});
      if (!esp) {
        const error = new Error("La especialidad seleccionada no existe.");
        error.statusCode = 404; throw error;
      }
      finalEspecialidadId = esp.id;
    }

    let archivoId = null;
    if (file) {
      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'prof');
      const { error: storageError } = await supabase.storage.from("noticias-imagenes").upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const error = new Error("Error subiendo imagen: " + storageError.message);
        error.statusCode = 500; throw error;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname, nombreArchivo: nombreUnico, ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension, mimeType: file.mimetype, tamanioBytes: BigInt(file.size),
        },
      });
      archivoId = archivoDb.id;
    }

    const nuevoProfesional = await prisma.profesional.create({
      data: {
        nombre, apellido, matricula, cargo, descripcion, especialidadId: finalEspecialidadId, archivoId, activo: true, updatedAt: new Date(),
      },
      include: { especialidad: true, archivo: true }
    });

    // Guardamos el nombre del servicio en el Area conectada
    if (finalAreaNombre) {
      let areaDb = await prisma.area.findFirst({ where: { nombre: finalAreaNombre }});
      if (!areaDb) areaDb = await prisma.area.create({ data: { nombre: finalAreaNombre }});
      await prisma.profesional_area.create({ data: { profesionalId: nuevoProfesional.id, areaId: areaDb.id }});
    }

    let pubUrl = "";
    if (nuevoProfesional.archivo) {
      pubUrl = supabase.storage.from("noticias-imagenes").getPublicUrl(nuevoProfesional.archivo.nombreArchivo).data.publicUrl;
    }

    return {
      message: "¡Profesional creado con éxito!",
      profesional: {
        id: nuevoProfesional.id.toString(), nombre: nuevoProfesional.nombre, apellido: nuevoProfesional.apellido,
        matricula: nuevoProfesional.matricula, cargo: nuevoProfesional.cargo, descripcion: nuevoProfesional.descripcion,
        especialidadNombre: finalAreaNombre || nuevoProfesional.especialidad.nombre, 
        esServicioClave: esServicio === 'true',
        especialidadId: especialidadId.toString(),
        publicado: nuevoProfesional.activo, imagenUrl: pubUrl
      }
    };
  }

  async actualizarProfesional(id, data, file) {
    const { nombre, apellido, matricula, cargo, descripcion, especialidadId, esServicio } = data;

    const profesionalExistente = await prisma.profesional.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!profesionalExistente) {
      const error = new Error("Profesional no encontrado.");
      error.statusCode = 404; throw error;
    }

    let finalEspecialidadId;
    let finalAreaNombre = null;

    if (esServicio === 'true') {
      const servicio = await prisma.servicio.findUnique({ where: { id: BigInt(especialidadId) }});
      if (!servicio) throw new Error("El servicio seleccionado no existe.");
      finalAreaNombre = servicio.nombre;
      
      let genEsp = await prisma.especialidad.findFirst({ where: { nombre: "Servicio Clave" }});
      if (!genEsp) genEsp = await prisma.especialidad.create({ data: { nombre: "Servicio Clave" }});
      finalEspecialidadId = genEsp.id;
    } else {
      const esp = await prisma.especialidad.findUnique({ where: { id: BigInt(especialidadId) }});
      if (!esp) throw new Error("La especialidad seleccionada no existe.");
      finalEspecialidadId = esp.id;
    }

    let archivoId = profesionalExistente.archivoId;

    if (file) {
      if (profesionalExistente.archivo) {
        await supabase.storage.from("noticias-imagenes").remove([profesionalExistente.archivo.nombreArchivo]);
        await prisma.archivo.delete({ where: { id: profesionalExistente.archivo.id } });
      }

      const { nombreUnico, extension } = generarNombreUnico(file.originalname, 'prof');
      const { error: storageError } = await supabase.storage.from("noticias-imagenes").upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const err = new Error("Error subiendo imagen: " + storageError.message);
        err.statusCode = 500; throw err;
      }

      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname, nombreArchivo: nombreUnico, ruta: `noticias-imagenes/${nombreUnico}`,
          extension: extension, mimeType: file.mimetype, tamanioBytes: BigInt(file.size),
        },
      });
      archivoId = archivoDb.id;
    }

    const profActualizado = await prisma.profesional.update({
      where: { id: BigInt(id) },
      data: {
        nombre, apellido, matricula, cargo, descripcion, especialidadId: finalEspecialidadId, archivoId, updatedAt: new Date()
      },
      include: { especialidad: true, archivo: true }
    });

    await prisma.profesional_area.deleteMany({ where: { profesionalId: profActualizado.id }});
    if (finalAreaNombre) {
      let areaDb = await prisma.area.findFirst({ where: { nombre: finalAreaNombre }});
      if (!areaDb) areaDb = await prisma.area.create({ data: { nombre: finalAreaNombre }});
      await prisma.profesional_area.create({ data: { profesionalId: profActualizado.id, areaId: areaDb.id }});
    }

    let pubUrl = "";
    if (profActualizado.archivo) {
      pubUrl = supabase.storage.from("noticias-imagenes").getPublicUrl(profActualizado.archivo.nombreArchivo).data.publicUrl;
    }

    return {
      message: "¡Profesional actualizado con éxito!",
      profesional: {
        id: profActualizado.id.toString(), nombre: profActualizado.nombre, apellido: profActualizado.apellido,
        matricula: profActualizado.matricula, cargo: profActualizado.cargo, descripcion: profActualizado.descripcion,
        especialidadNombre: finalAreaNombre || profActualizado.especialidad.nombre, 
        esServicioClave: esServicio === 'true',
        especialidadId: especialidadId.toString(),
        publicado: profActualizado.activo, imagenUrl: pubUrl
      }
    };
  }

  async eliminarProfesional(id) {
    const profesional = await prisma.profesional.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!profesional) throw new Error("Profesional no encontrado.");

    if (profesional.archivo) {
      await supabase.storage.from("noticias-imagenes").remove([profesional.archivo.nombreArchivo]);
      await prisma.archivo.delete({ where: { id: profesional.archivo.id } });
    }

    await prisma.profesional.delete({ where: { id: BigInt(id) } });
    return { message: "¡Profesional eliminado con éxito!" };
  }
}

export default new CmsProfesionalService();