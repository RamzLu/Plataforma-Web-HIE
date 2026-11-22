import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS_TEXTO = [
  { key: "titulo", label: "Título" },
  { key: "category", label: "Categoría" },
  { key: "contenido", label: "Contenido", tipo: "html" },
  { key: "fechaPublicacion", label: "Fecha de publicación programada", tipo: "datetime" },
];

const CAMPOS = [...CAMPOS_TEXTO, { key: "images", label: "Imágenes", tipo: "images" }];

/** Qué cambió en los datos (sin mirar las imágenes): sirve para saber si hay algo que guardar. */
export const cambiosDeTexto = (antes, despues) => calcularCambios(antes, despues, CAMPOS_TEXTO);

/** Qué cambió, incluidas las imágenes: es lo que ve el Admin al revisar. */
export const cambiosDeNoticia = (antes, despues) => calcularCambios(antes, despues, CAMPOS);
