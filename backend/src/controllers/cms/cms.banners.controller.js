import CmsBannersService from "../../services/cms/cms.banners.service.js";

/**
 * Obtiene la lista de Espacios Fijos del portal para el módulo CMS (`GET /api/cms/contenido-grafico`)
 */
export const obtenerEspaciosGraficos = async (req, res, next) => {
  try {
    const result = await CmsBannersService.obtenerEspaciosGraficos();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene los slides activos/publicados para el portal público (`GET /api/cms/banners`)
 */
export const obtenerBanners = async (req, res, next) => {
  try {
    const result = await CmsBannersService.obtenerBanners(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el arreglo de imágenes (carrusel) y metadatos de un Espacio Fijo (`PUT /api/cms/contenido-grafico/:id`)
 */
export const actualizarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files || req.file;
    const result = await CmsBannersService.actualizarBanner(
      id,
      req.body,
      files,
      req.user
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado editorial (Aprobar / Rechazar con motivo) de un Espacio Fijo (`PATCH /api/cms/contenido-grafico/:id/estado`)
 */
export const cambiarEstadoEspacioGrafico = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsBannersService.cambiarEstadoEspacio(
      id,
      req.body,
      req.user
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
