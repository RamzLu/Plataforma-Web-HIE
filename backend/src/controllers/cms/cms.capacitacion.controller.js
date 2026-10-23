import CmsCapacitacionService from "../../services/cms/cms.capacitacion.service.js";

export const obtenerCapacitaciones = async (req, res, next) => {
  try {
    const capacitaciones = await CmsCapacitacionService.obtenerCapacitaciones();
    return res.status(200).json(capacitaciones);
  } catch (error) {
    next(error);
  }
};

export const obtenerCapacitacionesPublicas = async (req, res, next) => {
  try {
    const capacitaciones = await CmsCapacitacionService.obtenerCapacitacionesPublicas();
    return res.status(200).json(capacitaciones);
  } catch (error) {
    next(error);
  }
};

export const crearCapacitacion = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]) || null;
    const result = await CmsCapacitacionService.crearCapacitacion(req.body, file);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarCapacitacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file || (req.files && req.files[0]) || null;
    const result = await CmsCapacitacionService.actualizarCapacitacion(id, req.body, file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoCapacitacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await CmsCapacitacionService.cambiarEstado(id, estado);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarCapacitacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsCapacitacionService.eliminarCapacitacion(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
