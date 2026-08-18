import "dotenv/config.js";

const requiredVariables = [
  "PORT",
  "NODE_ENV",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

requiredVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Variable de entorno ${variable} no esta definida.`);
  }
});

export const envs = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  //JWT_SECRET: process.env.JWT_SECRET,
};
