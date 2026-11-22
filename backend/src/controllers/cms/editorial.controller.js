import { agregarSolicitudesEliminacion } from "../../utils/eliminacion.utils.js";

// Controlador único de los módulos con flujo editorial (ver services/cms/editorial.modulos.js).
// El cuerpo llega validado (middlewares/validar.middleware.js).
// Respuestas: listar -> [registros]; crear / actualizar / revisar -> { message, data: registro };
// eliminar -> { message, ... } (202 si queda una solicitud de eliminación para el administrador).

/** Unifica la respuesta: el registro siempre va en "data", sea cual sea la clave con que lo devuelva el servicio. */
export const unificarRespuesta = (resultado, clave) => {
  const { message, ...resto } = resultado || {};
  return { message, data: resto[clave] ?? resto.data ?? null };
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
      // El cuerpo ya pasó por esquemaRevision (validation/editorial.schemas.js): decision y motivo son válidos.
      const { decision, motivo } = req.body;
      res.status(200).json(unificarRespuesta(await modulo.revisar(req, { decision, motivo: motivo || null }), modulo.clave));
    }),

    eliminar: envolver(async (req, res) => {
      const resultado = await modulo.eliminar(req);
      res.status(resultado?.solicitudEliminacion ? 202 : 200).json(resultado);
    }),
  };
};
