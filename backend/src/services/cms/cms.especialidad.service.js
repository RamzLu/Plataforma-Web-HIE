import { prisma } from "../../config/prisma.js";

class CmsEspecialidadService {
  
  async crearEspecialidad(data) {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      horarios: data.horarios,
      requisitos: data.requisitos ? (typeof data.requisitos === 'string' ? data.requisitos : JSON.stringify(data.requisitos)) : "[]",
      documentacionNecesaria: data.documentacionNecesaria,
      informacionDerivacion: data.informacionDerivacion,
      estado: data.estado || "PUBLICADO"
    };

    if (data.esServicio === true || data.esServicio === 'true') {
      const nuevo = await prisma.servicio.create({ data: payload });
      return { message: "Servicio creado", data: this._format(nuevo, true) };
    } else {
      const nueva = await prisma.especialidad.create({ data: payload });
      return { message: "Especialidad creada", data: this._format(nueva, false) };
    }
  }

  async actualizarEspecialidad(id, data) {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      horarios: data.horarios,
      requisitos: data.requisitos ? (typeof data.requisitos === 'string' ? data.requisitos : JSON.stringify(data.requisitos)) : "[]",
      documentacionNecesaria: data.documentacionNecesaria,
      informacionDerivacion: data.informacionDerivacion,
      estado: data.estado
    };

    if (data.esServicio === true || data.esServicio === 'true') {
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
      requisitos: requisitosProcesados
    };
  }
}

export default new CmsEspecialidadService();