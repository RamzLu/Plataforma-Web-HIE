import { agregarSolicitudesEliminacion } from "../../utils/eliminacion.utils.js";
import { usuarioTieneRol, ROLES_ADMIN } from "../../middlewares/auth.middleware.js";
import CmsResidenciaService from "../../services/cms/cms.residencia.service.js";

export const obtenerResidencias = async (req, res, next) => {
  try {
    const residencias = await CmsResidenciaService.obtenerResidencias(req.adminView === true);
    return res.status(200).json(
      req.adminView === true ? await agregarSolicitudesEliminacion(residencias, () => "residencia") : residencias
    );
  } catch (error) {
    next(error);
  }
};

export const crearResidencia = async (req, res, next) => {
  try {
    const files = req.files || req.file;
    const result = await CmsResidenciaService.crearResidencia(req.body, files, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files || req.file;
    const result = await CmsResidenciaService.actualizarResidencia(id, req.body, files, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsResidenciaService.eliminarResidencia(id, { user: req.user });
    return res.status(result?.solicitudEliminacion ? 202 : 200).json(result);
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, rejectionReason, motivoRechazo } = req.body;
    const result = await CmsResidenciaService.cambiarEstado(
      id,
      estado,
      req.user,
      rejectionReason || motivoRechazo,
      { esAdmin: usuarioTieneRol(req.user, ROLES_ADMIN) }
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

