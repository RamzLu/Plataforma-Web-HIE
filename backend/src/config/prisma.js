import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

//parche para BIGINT: convierte los tipos int8 a string
if (typeof BigInt !== "undefined") {
  BigInt.prototype.toJSON = function () {
    return this.ToString;
  };
}

//config del poll de conexiones nativos
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);

//instancia de prisma con los logs
export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODe_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

//cierre limpio de conexiones
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
