import CmsDocService from "../../services/cms/cms.doc.service.js";

export const obtenerDocumentos = async (req, res, next) => {
  try {
    const result = await CmsDocService.obtenerDocumentos();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const crearDocumento = async (req, res, next) => {
  try {
    const result = await CmsDocService.crearDocumento(req.body, req.file, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsDocService.actualizarDocumento(id, req.body, req.file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarDocumento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsDocService.eliminarDocumento(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};