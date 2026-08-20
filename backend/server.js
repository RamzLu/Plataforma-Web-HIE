import app from "./app.js";
import { envs } from "./src/config/env.js";
import { prisma } from "./src/config/prisma.js";

const PORT = envs.PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log("Conexion a PosgreSQL correctamente.");

    if (envs.NODE_ENV === "development") {
      console.log("Modo desarrollo: migraciones no async automatico");
    }

    app.listen(PORT, () => {
      console.log(`\nServidor corriendo en ${PORT}`);
      console.log(`\nEntorno: ${envs.NODE_ENV}`);
    });
  } catch (error) {
    console.error("\nError al conectar a PostgreSQL:", error);
    process.exit(1);
  }
};
startServer();
