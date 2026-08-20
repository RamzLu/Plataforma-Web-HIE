import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Creamos un pool de conexión tradicional de Postgres leyendo tu .env
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Inicializamos Prisma pasándole de forma obligatoria el adaptador
export const prisma = new PrismaClient({ adapter });
