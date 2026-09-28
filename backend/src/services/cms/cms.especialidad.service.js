import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";
import { generarNombreUnico } from "../../utils/file.utils.js";

// Configuración de Supabase (Misma clave que en Noticias)
const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Asegúrate de tener la key correcta
);

class CmsEspecialidadService {
  
  async crearEspecialidad(data, file) {
    let imagenBannerUrl = null;

    // Si viene un archivo, lo subimos a Supabase
    if (file) {
      const { nombreUnico } = generarNombreUnico(file.originalname, 'banner');
      const { error: storageError } = await supabase.storage
        .from("banners-imagenes") // ⚠️ Asegúrate de crear este bucket en tu proyecto de Supabase y hacerlo Público
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const err = new Error("Error al subir imagen a Supabase: " + storageError.message);
        err.statusCode = 500; throw err;
      }
      // Obtenemos la URL pública
      const { data: publicUrlData } = supabase.storage.from("banners-imagenes").getPublicUrl(nombreUnico);
      imagenBannerUrl = publicUrlData.publicUrl;
    }

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      horarios: data.horarios,
      requisitos: data.requisitos ? JSON.stringify(data.requisitos) : "[]",
      documentacionNecesaria: data.documentacionNecesaria,
      informacionDerivacion: data.informacionDerivacion,
      estado: data.estado || "PUBLICADO",
      imagenBanner: imagenBannerUrl
    };

    if (data.esServicio) {
      const nuevo = await prisma.servicio.create({ data: payload });
      return { message: "Servicio creado", data: this._format(nuevo, true) };
    } else {
      const nueva = await prisma.especialidad.create({ data: payload });
      return { message: "Especialidad creada", data: this._format(nueva, false) };
    }
  }

  async actualizarEspecialidad(id, data, file) {
    let imagenBannerUrl = data.imagenBanner; // Mantiene la existente si no se sube nada nuevo

    if (file) {
      const { nombreUnico } = generarNombreUnico(file.originalname, 'banner');
      const { error: storageError } = await supabase.storage
        .from("banners-imagenes")
        .upload(nombreUnico, file.buffer, { contentType: file.mimetype, upsert: true });

      if (storageError) {
        const err = new Error("Error al subir imagen a Supabase: " + storageError.message);
        err.statusCode = 500; throw err;
      }
      const { data: publicUrlData } = supabase.storage.from("banners-imagenes").getPublicUrl(nombreUnico);
      imagenBannerUrl = publicUrlData.publicUrl;
    }

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      horarios: data.horarios,
      requisitos: data.requisitos ? JSON.stringify(data.requisitos) : "[]",
      documentacionNecesaria: data.documentacionNecesaria,
      informacionDerivacion: data.informacionDerivacion,
      estado: data.estado
    };

    if (imagenBannerUrl !== undefined) {
      payload.imagenBanner = imagenBannerUrl;
    }

    if (data.esServicio) {
      const actualizada = await prisma.servicio.update({ where: { id: BigInt(id) }, data: payload });
      return { message: "Servicio actualizado", data: this._format(actualizada, true) };
    } else {
      const actualizada = await prisma.especialidad.update({ where: { id: BigInt(id) }, data: payload });
      return { message: "Especialidad actualizada", data: this._format(actualizada, false) };
    }
  }

  async obtenerEspecialidades(isAdmin) {
    const whereClause = isAdmin === "true" ? {} : { estado: "PUBLICADO" };
    const especialidades = await prisma.especialidad.findMany({ where: whereClause });
    const servicios = await prisma.servicio.findMany({ where: whereClause });

    const combinados = [
      ...especialidades.map(e => this._format(e, false)),
      ...servicios.map(s => this._format(s, true))
    ];

    return combinados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async eliminarEspecialidad(id, isServicio) {
    if (isServicio === "true" || isServicio === true) {
      await prisma.servicio.delete({ where: { id: BigInt(id) } });
    } else {
      const profAsignados = await prisma.profesional.count({ where: { especialidadId: BigInt(id) } });
      if (profAsignados > 0) {
        const error = new Error(`No se puede eliminar porque tiene ${profAsignados} profesional(es) asignado(s).`);
        error.statusCode = 400; throw error;
      }
      await prisma.especialidad.delete({ where: { id: BigInt(id) } });
    }
    return { message: "Eliminado con éxito" };
  }

  _format(registro, esServicio) {
    let requisitosProcesados = [];
    if (registro.requisitos) {
      try { requisitosProcesados = JSON.parse(registro.requisitos); } 
      catch (error) { requisitosProcesados = typeof registro.requisitos === 'string' ? registro.requisitos.split('\n').map(r => r.trim()).filter(r => r !== '') : []; }
    }
    return {
      ...registro,
      id: registro.id.toString(),
      esServicio,
      requisitos: requisitosProcesados,
      imagenBanner: registro.imagenBanner || null
    };
  }
}

export default new CmsEspecialidadService();