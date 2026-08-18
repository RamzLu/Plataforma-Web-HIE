import express from "express";
import cors from "cors";
import { envs } from "./config/env.js";
import { env } from "@tensorflow/tfjs-core";

const app = express();

//midlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ruta de prueba
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong", env: envs.NODE_ENV });
});
export default app;
