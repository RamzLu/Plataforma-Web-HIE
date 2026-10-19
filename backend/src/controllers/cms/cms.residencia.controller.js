import CmsResidenciaService from "../../services/cms/cms.residencia.service.js";

export const obtenerResidencias = async (req, res, next) => {
  try {
    const residencias = await CmsResidenciaService.obtenerResidencias();
    return res.status(200).json(residencias);
  } catch (error) {
    next(error);
  }
};

export const crearResidencia = async (req, res, next) => {
  try {
    const result = await CmsResidenciaService.crearResidencia(req.body, req.file);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsResidenciaService.actualizarResidencia(id, req.body, req.file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsResidenciaService.eliminarResidencia(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoResidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await CmsResidenciaService.cambiarEstado(id, estado);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

