import { AsyncLocalStorage } from "node:async_hooks";

// Guarda el usuario autenticado durante todo el request (lo inicia verifyToken en auth.middleware.js).
// Lo usa config/prisma.js para completar createdBy / updatedBy sin pasarlo por cada servicio.
// Fuera de un request (por ejemplo, el cron de publicaciones programadas) no hay usuario.
const almacen = new AsyncLocalStorage();

export const ejecutarConUsuario = (user, fn) => almacen.run({ user, usuarioLocalId: undefined }, fn);

export const contextoActual = () => almacen.getStore() || null;
