import CmsContenidoGraficoService from "../../services/cms/cms.contenidoGrafico.service.js";

export const obtenerContenidosGraficos = async (req, res, next) => {
  try {
    const espacios = await CmsContenidoGraficoService.obtenerEspaciosGraficos(
      req.adminView === true
    );
    return res.status(200).json(espacios);
  } catch (error) {
    next(error);
  }
};

export const obtenerEspacioPublico = async (req, res, next) => {
  try {
    const { espacioKey } = req.params;
    const espacio = await CmsContenidoGraficoService.obtenerEspacioPublico(espacioKey);
    return res.status(200).json(espacio);
  } catch (error) {
    next(error);
  }
};

export const actualizarEspacioGrafico = async (req, res, next) => {
  try {
    const { espacioKey } = req.params;
    const files = req.files || (req.file ? [req.file] : []);
    const result = await CmsContenidoGraficoService.actualizarEspacioGrafico(
      espacioKey,
      req.body,
      files,
      req.user
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

