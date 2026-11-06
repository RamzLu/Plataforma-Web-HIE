import CmsContenidoGraficoService from "../../services/cms/cms.contenidoGrafico.service.js";

export const obtenerBanners = async (req, res, next) => {
  try {
    const result = await CmsContenidoGraficoService.obtenerEspaciosGraficos(
      req.adminView === true
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const crearBanner = async (_req, res) => {
  return res.status(405).json({
    error:
      "Los espacios de Contenido Gráfico están predefinidos. No se permite crear nuevas secciones, solo modificar las existentes.",
  });
};

export const actualizarBanner = async (req, res, next) => {
  try {
    const espacioKey = req.params.espacioKey || req.params.id;
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

export const eliminarBanner = async (_req, res) => {
  return res.status(405).json({
    error:
      "Los espacios de Contenido Gráfico están predefinidos y no pueden eliminarse.",
  });
};
