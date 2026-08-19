import "dotenv/config.js";

console.log(process.env.DATABASE_URL);
const requiredVariables = ["PORT", "NODE_ENV", "DATABASE_URL", "JWT_SECRET"];

requiredVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Variable de entorno ${variable} no esta definida.`);
  }
});

export const envs = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};
