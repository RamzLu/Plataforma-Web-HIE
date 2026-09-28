import CmsEspecialidadService from "../../services/cms/cms.especialidad.service.js";

export const crearEspecialidad = async (req, res, next) => {
  try {
    const result = await CmsEspecialidadService.crearEspecialidad(req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const obtenerEspecialidades = async (req, res, next) => {
  try {
    const { admin } = req.query;
    const result = await CmsEspecialidadService.obtenerEspecialidades(admin);
    res.status(200).json(result);
  } catch (error) { next(error); }
};

export const actualizarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsEspecialidadService.actualizarEspecialidad(id, req.body);
    res.status(200).json(result);
  } catch (error) { next(error); }
};

export const eliminarEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsEspecialidadService.eliminarEspecialidad(id);
    res.status(200).json(result);
  } catch (error) { next(error); }
};