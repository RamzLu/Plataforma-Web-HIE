import { crearApiEditorial } from "./editorial.api.js";

const noticias = crearApiEditorial("noticias");

export const getNoticias = noticias.listar;
export const createNoticia = noticias.crear;
export const updateNoticia = noticias.actualizar;
export const revisarNoticia = noticias.revisar;
export const deleteNoticia = noticias.eliminar;
