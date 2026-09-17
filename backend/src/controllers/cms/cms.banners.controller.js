import CmsBannersService from "../../services/cms/cms.banners.service.js";

export const obtenerBanners = async (req, res, next) => {
  try {
    const result = await CmsBannersService.obtenerBanners();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const crearBanner = async (req, res, next) => {
  try {
    const result = await CmsBannersService.crearBanner(req.body, req.file, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsBannersService.actualizarBanner(id, req.body, req.file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsBannersService.eliminarBanner(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};