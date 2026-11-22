import { agregarSolicitudesEliminacion } from "../../utils/eliminacion.utils.js";

// Controlador único de los módulos con flujo editorial (ver services/cms/editorial.modulos.js).
// Respuestas: listar -> [registros]; crear / actualizar / revisar -> { message, data: registro };
// eliminar -> { message, ... } (202 si queda una solicitud de eliminación para el administrador).

const DECISIONES = ["APROBAR", "RECHAZAR"];

const crearError = (mensaje, statusCode = 400) => Object.assign(new Error(mensaje), { statusCode });

/** Unifica la respuesta: el registro siempre va en "data", sea cual sea la clave con que lo devuelva el servicio. */
export const unificarRespuesta = (resultado, clave) => {
  const { message, ...resto } = resultado || {};
  return { message, data: resto[clave] ?? resto.data ?? null };
};

/** Valida el cuerpo de la revisión: { decision: "APROBAR" | "RECHAZAR", motivo? }. */
export const leerRevision = (body = {}) => {
  const decision = String(body.decision || "").trim().toUpperCase();
  if (!DECISIONES.includes(decision)) {
    throw crearError("Debe indicar la decisión de la revisión: APROBAR o RECHAZAR.");
  }
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";
  if (decision === "RECHAZAR" && !motivo) {
    throw crearError("Debe especificar un motivo de rechazo.");
  }
  return { decision, motivo: motivo || null };
};

export const crearControladorEditorial = (modulo) => {
  const envolver = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };

  return {
    listar: envolver(async (req, res) => {
      const esVistaAdmin = req.adminView === true;
      const registros = await modulo.listar(esVistaAdmin);
      res.status(200).json(esVistaAdmin ? await agregarSolicitudesEliminacion(registros, modulo.entidad) : registros);
    }),

    crear: envolver(async (req, res) => {
      res.status(201).json(unificarRespuesta(await modulo.crear(req), modulo.clave));
    }),

    actualizar: envolver(async (req, res) => {
      res.status(200).json(unificarRespuesta(await modulo.actualizar(req), modulo.clave));
    }),

    revisar: envolver(async (req, res) => {
      res.status(200).json(unificarRespuesta(await modulo.revisar(req, leerRevision(req.body)), modulo.clave));
    }),

    eliminar: envolver(async (req, res) => {
      const resultado = await modulo.eliminar(req);
      res.status(resultado?.solicitudEliminacion ? 202 : 200).json(resultado);
    }),
  };
};
