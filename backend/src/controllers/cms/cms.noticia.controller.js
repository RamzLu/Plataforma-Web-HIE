import CmsNoticiaService from "../../services/cms/cms.noticia.service.js";

export const crearNoticia = async (req, res, next) => {
  try {
    const result = await CmsNoticiaService.crearNoticia(req.body, req.files || [], req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error); 
  }
};

export const obtenerNoticias = async (req, res, next) => {
  try {
    const { admin } = req.query;
    const noticias = await CmsNoticiaService.obtenerNoticias(admin);
    return res.status(200).json(noticias);
  } catch (error) {
    next(error);
  }
};

export const eliminarNoticia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsNoticiaService.eliminarNoticia(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarNoticia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsNoticiaService.actualizarNoticia(id, req.body, req.files || [], req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};