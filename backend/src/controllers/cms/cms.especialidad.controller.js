import CmsEspecialidadService from "../../services/cms/cms.especialidad.service.js";

export const obtenerEspecialidades = async (req, res, next) => {
  try {
    const result = await CmsEspecialidadService.obtenerEspecialidades(req.adminView === true);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const crearEspecialidad = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const result = await CmsEspecialidadService.crearEspecialidad(payload, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    const result = await CmsEspecialidadService.actualizarEspecialidad(id, payload, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const evaluarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsEspecialidadService.evaluarEspecialidad(id, req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isServicio } = req.query;
    const result = await CmsEspecialidadService.eliminarEspecialidad(id, isServicio, { user: req.user });
    return res.status(result?.solicitudEliminacion ? 202 : 200).json(result);
  } catch (error) {
    next(error);
  }
};
