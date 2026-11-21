import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  omit: omitirColumnasEditoriales,
  log: process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"],
});

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