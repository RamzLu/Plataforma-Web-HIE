import app from "./app.js";
import { envs } from "./config/env.js";
import { sequelize } from "./config/database.js";

const PORT = envs.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexion a PosgreSQL correctamente.");
    if (envs.NODE_ENV === "development") {
      console.log("Modo desarrollo: migraciones no async automatico");
    }
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en ${PORT}`);
      console.log(`Entorno: ${envs.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Error al conectar a PostgreSQL:", error);
    process.exit(1);
  }
};
