import { agregarSolicitudesEliminacion } from "../../utils/eliminacion.utils.js";
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
    const noticias = await CmsNoticiaService.obtenerNoticias(req.adminView === true);
    return res.status(200).json(
      req.adminView === true ? await agregarSolicitudesEliminacion(noticias, () => "noticia") : noticias
    );
  } catch (error) {
    next(error);
  }
};

export const eliminarNoticia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsNoticiaService.eliminarNoticia(id, { user: req.user });
    return res.status(result?.solicitudEliminacion ? 202 : 200).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarNoticia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsNoticiaService.actualizarNoticia(
      id,
      req.body,
      req.files || [],
      req.user
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const evaluarNoticia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsNoticiaService.evaluarNoticia(id, req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
