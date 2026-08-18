import { Sequelize } from "sequelize";
import { envs } from "./env.js";

export const sequelize = new Sequelize(
  envs.DB_NAME,
  envs.DB_USER,
  envs.DB_PASSWORD,
  {
    host: envs.DB_HOST,
    port: envs.DB_PORT,
    dialect: "postgres",
    logging: envs.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);
