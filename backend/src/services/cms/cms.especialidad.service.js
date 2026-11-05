import { prisma } from "../../config/prisma.js";
import { parsearIdBigInt } from "../../utils/sanitize.utils.js";

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
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
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
      const actualizada = await prisma.servicio.update({ where: { id: idBigInt }, data: payload });
      return { message: "Servicio actualizado", data: this._format(actualizada, true) };
    } else {
      const actualizada = await prisma.especialidad.update({ where: { id: idBigInt }, data: payload });
      return { message: "Especialidad actualizada", data: this._format(actualizada, false) };
    }
  }

  async obtenerEspecialidades(esVistaAdmin = false) {
    const whereClause = esVistaAdmin === true ? {} : { estado: "PUBLICADO" };
    const especialidades = await prisma.especialidad.findMany({ where: whereClause });
    const servicios = await prisma.servicio.findMany({ where: whereClause });

    const combinados = [
      ...especialidades.map(e => this._format(e, false)),
      ...servicios.map(s => this._format(s, true))
    ];

    return combinados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async eliminarEspecialidad(id, isServicio) {
    const idBigInt = parsearIdBigInt(id, "ID de especialidad o servicio");
    if (isServicio === "true" || isServicio === true) {
      await prisma.servicio.delete({ where: { id: idBigInt } });
    } else {
      const profAsignados = await prisma.profesional.count({ where: { especialidadId: idBigInt } });
      if (profAsignados > 0) {
        const error = new Error(`No se puede eliminar porque tiene ${profAsignados} profesional(es) asignado(s).`);
        error.statusCode = 400; throw error;
      }
      await prisma.especialidad.delete({ where: { id: idBigInt } });
    }
    return { message: "Eliminado con éxito" };
  }

  _format(registro, esServicio) {
    let requisitosProcesados = [];
    if (registro.requisitos) {
      try {
        const parsed = JSON.parse(registro.requisitos);
        requisitosProcesados = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        requisitosProcesados = typeof registro.requisitos === 'string' ? registro.requisitos.split('\n').map(r => r.trim()).filter(r => r !== '') : [];
      }
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