import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS = [
  { key: "nombre", label: "Nombre" },
  { key: "descripcion", label: "Descripción" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "horarios", label: "Horarios" },
  { key: "requisitos", label: "Requisitos", tipo: "list" },
  { key: "documentacionNecesaria", label: "Documentación necesaria" },
  { key: "informacionDerivacion", label: "Información de derivación" },
];

/** Qué campos cambiaron entre dos versiones de una especialidad o servicio. */
export const cambiosDeEspecialidad = (antes, despues) => calcularCambios(antes, despues, CAMPOS);

/** Los requisitos llegan como texto o como lista: se guardan siempre como texto. */
export const requisitosComoTexto = (requisitos) => (typeof requisitos === "string" ? requisitos : JSON.stringify(requisitos));
