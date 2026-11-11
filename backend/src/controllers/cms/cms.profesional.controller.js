import CmsProfesionalService from "../../services/cms/cms.profesional.service.js";

export const obtenerProfesionales = async (req, res, next) => {
  try {
    const result = await CmsProfesionalService.obtenerProfesionales(req.adminView === true);
    return res.status(200).json(result);
  } catch (error) {
    next(error); 
  }
};

export const crearProfesional = async (req, res, next) => {
  try {
    const result = await CmsProfesionalService.crearProfesional(req.body, req.file, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarProfesional = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsProfesionalService.actualizarProfesional(id, req.body, req.file, req.user);
    return res.status(200).json(result);
  } catch (error) { next(error); }
};

export const evaluarProfesional = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsProfesionalService.evaluarProfesional(id, req.body, req.user);
    return res.status(200).json(result);
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