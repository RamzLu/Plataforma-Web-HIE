import CmsNoticiaService from "../../services/cms/cms.noticia.service.js";
import CmsDocService from "../../services/cms/cms.doc.service.js";
import CmsProfesionalService from "../../services/cms/cms.profesional.service.js";
import CmsEspecialidadService from "../../services/cms/cms.especialidad.service.js";
import CmsResidenciaService from "../../services/cms/cms.residencia.service.js";
import CmsCapacitacionService from "../../services/cms/cms.capacitacion.service.js";
import {
  ENTIDADES_ELIMINABLES,
  listarSolicitudesEliminacion,
  obtenerSolicitudEliminacion,
  limpiarSolicitudEliminacion,
  registrarResolucionEliminacion,
} from "../../utils/eliminacion.utils.js";

// Cómo se borra de verdad cada tipo de contenido cuando el administrador aprueba la solicitud.
const ELIMINAR = {
  noticia: (id, opciones) => CmsNoticiaService.eliminarNoticia(id, opciones),
  documento: (id, opciones) => CmsDocService.eliminarDocumento(id, opciones),
  profesional: (id, opciones) => CmsProfesionalService.eliminarProfesional(id, opciones),
  especialidad: (id, opciones) => CmsEspecialidadService.eliminarEspecialidad(id, false, opciones),
  servicio: (id, opciones) => CmsEspecialidadService.eliminarEspecialidad(id, true, opciones),
  residencia: (id, opciones) => CmsResidenciaService.eliminarResidencia(id, opciones),
  capacitacion: (id, opciones) => CmsCapacitacionService.eliminarCapacitacion(id, opciones),
};

export const obtenerSolicitudesEliminacion = async (_req, res, next) => {
  try {
    return res.status(200).json(await listarSolicitudesEliminacion());
  } catch (error) {
    next(error);
  }
};

export const resolverSolicitudEliminacion = async (req, res, next) => {
  try {
    const { entidad, id } = req.params;
    const { aprobar, motivo } = req.body || {};

    if (!ENTIDADES_ELIMINABLES.includes(entidad)) {
      const error = new Error("Tipo de contenido no válido.");
      error.statusCode = 400;
      throw error;
    }
    if (typeof aprobar !== "boolean") {
      const error = new Error("Indique si aprueba (true) o rechaza (false) la eliminación.");
      error.statusCode = 400;
      throw error;
    }

    const solicitud = await obtenerSolicitudEliminacion(entidad, id);
    if (!solicitud) {
      const error = new Error("La solicitud de eliminación no existe o ya fue resuelta.");
      error.statusCode = 404;
      throw error;
    }

    if (aprobar) {
      try {
        await ELIMINAR[entidad](id, { user: req.user, forzar: true });
      } catch (error) {
        // Si el contenido ya no existe, la solicitud queda sin efecto.
        if (error.statusCode !== 404) throw error;
      }
    }
    await limpiarSolicitudEliminacion(entidad, id);
    await registrarResolucionEliminacion(req.user, solicitud, aprobar, typeof motivo === "string" ? motivo.trim() : "");

    return res.status(200).json({
      message: aprobar
        ? `Se eliminó "${solicitud.titulo}".`
        : `Se rechazó la eliminación de "${solicitud.titulo}". El contenido sigue publicado.`,
    });
  } catch (error) {
    next(error);
  }
};
