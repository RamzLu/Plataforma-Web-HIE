import { prisma } from "../../config/prisma.js";
import { nombreDeUsuario } from "../../utils/user.utils.js";

const LIMITE_MAXIMO = 50;

// Últimos movimientos registrados en la tabla "auditoria", para el panel de actividad del CMS.
// Reemplaza el registro que antes se guardaba solo en el navegador de cada editor.
export const obtenerActividadReciente = async (req, res, next) => {
  try {
    const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 20, 1), LIMITE_MAXIMO);

    const filas = await prisma.auditoria.findMany({
      orderBy: { fechaHora: "desc" },
      take: limite,
      include: { usuario: { select: { nombre: true, apellido: true } } },
    });

    return res.status(200).json(
      filas.map((fila) => ({
        id: fila.id,
        accion: fila.accion,
        entidad: fila.entidad,
        entidadId: fila.entidadId,
        descripcion: fila.descripcion,
        fechaHora: fila.fechaHora,
        usuario: nombreDeUsuario(fila.usuario),
      }))
    );
  } catch (error) {
    next(error);
  }
};
