import CmsProfesionalService from "../../services/cms/cms.profesional.service.js";

export const obtenerProfesionales = async (req, res, next) => {
  try {
    const result = await CmsProfesionalService.obtenerProfesionales();
    return res.status(200).json(result);
  } catch (error) {
    next(error); 
  }
};

export const crearProfesional = async (req, res, next) => {
  try {
    const result = await CmsProfesionalService.crearProfesional(req.body, req.file);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarProfesional = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsProfesionalService.eliminarProfesional(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};