import CmsAutoridadesService from "../../services/cms/cms.autoridades.service.js";

// ─── DATOS INSTITUCIONALES (autoridades activas + redes sociales) ─────────────

export const obtenerInstitucional = async (req, res, next) => {
  try {
    const result = await CmsAutoridadesService.obtenerInstitucional();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── CRUD AUTORIDADES ─────────────────────────────────────────────────────────

export const crearAutoridad = async (req, res, next) => {
  try {
    const result = await CmsAutoridadesService.crearAutoridad(req.body, req.file);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizarAutoridad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsAutoridadesService.actualizarAutoridad(id, req.body, req.file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminarAutoridad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await CmsAutoridadesService.eliminarAutoridad(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ─── REDES SOCIALES ───────────────────────────────────────────────────────────

export const actualizarRedesSociales = async (req, res, next) => {
  try {
    const result = await CmsAutoridadesService.actualizarRedesSociales(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
