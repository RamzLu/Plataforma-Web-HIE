import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS_TEXTO = [
  { key: "titulo", label: "Título del documento" },
  { key: "descripcion", label: "Descripción" },
  { key: "categoria", label: "Categoría" },
];

const CAMPOS = [
  { key: "titulo", label: "Título" },
  { key: "descripcion", label: "Descripción" },
  { key: "categoria", label: "Categoría" },
  { key: "archivo", label: "Archivo adjunto" },
];

/** Qué cambió en los datos (sin mirar el archivo): sirve para saber si hay algo que guardar. */
export const cambiosDeTexto = (antes, despues) => calcularCambios(antes, despues, CAMPOS_TEXTO);

/** Qué cambió, incluido el archivo adjunto: es lo que ve el Admin al revisar. */
export const cambiosDeDocumento = (antes, despues) => calcularCambios(antes, despues, CAMPOS);
