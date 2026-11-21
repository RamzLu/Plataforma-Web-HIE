import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { contextoActual } from "../utils/contextoUsuario.utils.js";

if (typeof BigInt !== "undefined") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis;

const pool = globalForPrisma.pgPool || new pg.Pool({
  connectionString,
  max: process.env.NODE_ENV === "production" ? 10 : 5, 
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

// Columnas internas del flujo editorial (ver utils/metaEditorial.utils.js y utils/eliminacion.utils.js).
// Se omiten por defecto en todas las consultas para que nunca lleguen al portal público por un
// "...registro"; quien las necesita las pide explícitamente con select.
const COLUMNAS_EDITORIALES = {
  rejectionReason: true,
  pendingMeta: true,
  editorMeta: true,
  solicitudEliminacion: true,
};
const omitirColumnasEditoriales = Object.fromEntries(
  ["noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion"].map(
    (modelo) => [modelo, COLUMNAS_EDITORIALES]
  )
);

// Modelos que registran quién los creó (createdBy) y quién los modificó por última vez (updatedBy).
const MODELOS_CON_AUTORIA = new Set([
  "noticia", "documento", "profesional", "especialidad", "servicio", "residencia", "capacitacion",
]);

// id del usuario local (tabla usuario) del request actual, o null si no hay usuario autenticado.
// Se resuelve una sola vez por request.
const usuarioLocalDelRequest = async () => {
  const ctx = contextoActual();
  if (!ctx?.user) return null;
  if (ctx.usuarioLocalId === undefined) {
    try {
      // Import diferido: user.utils.js importa este mismo archivo.
      const { obtenerOCrearUsuarioLocal } = await import("../utils/user.utils.js");
      ctx.usuarioLocalId = (await obtenerOCrearUsuarioLocal(ctx.user)).id;
    } catch {
      ctx.usuarioLocalId = null; // sin usuario local no se completa la autoría; el servicio decide si falla
    }
  }
  return ctx.usuarioLocalId;
};

const conAutor = (data, campo, usuarioId) =>
  usuarioId && data && typeof data === "object" && data[campo] === undefined ? { ...data, [campo]: usuarioId } : data;

const crearCliente = () =>
  new PrismaClient({
    adapter,
    omit: omitirColumnasEditoriales,
    log: process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  }).$extends({
    name: "autoria",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          if (MODELOS_CON_AUTORIA.has(model)) {
            args.data = conAutor(args.data, "createdBy", await usuarioLocalDelRequest());
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (MODELOS_CON_AUTORIA.has(model)) {
            args.data = conAutor(args.data, "updatedBy", await usuarioLocalDelRequest());
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (MODELOS_CON_AUTORIA.has(model)) {
            args.data = conAutor(args.data, "updatedBy", await usuarioLocalDelRequest());
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (MODELOS_CON_AUTORIA.has(model)) {
            const usuarioId = await usuarioLocalDelRequest();
            args.create = conAutor(args.create, "createdBy", usuarioId);
            args.update = conAutor(args.update, "updatedBy", usuarioId);
          }
          return query(args);
        },
      },
    },
  });

export const prisma = globalForPrisma.prisma || crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const gracefulShutdown = async (signal) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n[Prisma] Recibida señal ${signal}. Liberando recursos...`);
  }
  delete globalForPrisma.pgPool;
  delete globalForPrisma.prisma;
  try {
    await Promise.race([
      Promise.allSettled([prisma.$disconnect(), pool.end()]),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  } catch (e) {
    // Ignorar errores durante el cierre
  }
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));