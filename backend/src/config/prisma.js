import { PrismaClient } from "@prisma/client"; // Cambiado a la ruta estándar
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Parche para BIGINT: convierte los tipos int8 a string (Corregido toString)
if (typeof BigInt !== "undefined") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// Config del pool de conexiones nativo
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);

// Instancia de prisma con los logs (Corregido NODE_ENV)
export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

// Cierre limpio de conexiones
const gracefulShutdown = async (signal) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n[Prisma] Recibida señal ${signal}. Liberando recursos...`);
  }
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
