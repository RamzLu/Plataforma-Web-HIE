import { Sequelize } from "sequelize";
import { envs } from "./env.js";

export const sequelize = new Sequelize(envs.DATABASE_URL, {
  dialect: "postgres",
  logging: envs.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
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
});
