import { prisma } from "../../config/prisma.js";

class CmsEspecialidadService {
  async crearEspecialidad(data) {
    const nueva = await prisma.especialidad.create({
      data: {
        ...data,
        requisitos: data.requisitos ? JSON.stringify(data.requisitos) : "[]"
      }
    });
    return { message: "Creada con éxito", data: this._format(nueva) };
  }

  async obtenerEspecialidades(isAdmin) {
    const whereClause = isAdmin === "true" ? {} : { activo: true };
    const registros = await prisma.especialidad.findMany({
      where: whereClause,
      orderBy: { nombre: 'asc' }
    });
    return registros.map(r => this._format(r));
  }

  async actualizarEspecialidad(id, data) {
    const updateData = { ...data };
    if (data.requisitos) {
      updateData.requisitos = JSON.stringify(data.requisitos);
    }
    const actualizada = await prisma.especialidad.update({
      where: { id: BigInt(id) },
      data: updateData
    });
    return { message: "Actualizada con éxito", data: this._format(actualizada) };
  }

async eliminarEspecialidad(id) {
    const profesionalesAsignados = await prisma.profesional.count({
      where: { especialidadId: BigInt(id) }
    });

    if (profesionalesAsignados > 0) {
      const error = new Error(`No se puede eliminar la especialidad porque tiene ${profesionalesAsignados} profesional(es) asignado(s). Por favor, cambie la especialidad de esos profesionales o elimínelos primero.`);
      error.statusCode = 400;
      throw error;
    }

    await prisma.especialidad.delete({ where: { id: BigInt(id) } });
    
    return { message: "Eliminada con éxito" };
  }

  _format(registro) {
    return {
      ...registro,
      id: registro.id.toString(),
      requisitos: registro.requisitos ? JSON.parse(registro.requisitos) : []
    };
  }
}
export default new CmsEspecialidadService();