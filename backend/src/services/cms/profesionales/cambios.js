import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS = [
  { key: "nombre", label: "Nombre" },
  { key: "apellido", label: "Apellido" },
  { key: "matricula", label: "Matrícula" },
  { key: "cargo", label: "Cargo o función" },
  { key: "especialidadNombre", label: "Área asignada" },
  { key: "esServicioClave", label: "Es servicio clave", tipo: "boolean" },
  { key: "descripcion", label: "Descripción / perfil" },
];

const CAMPOS_CON_FOTO = [...CAMPOS, { key: "imagenUrl", label: "Fotografía", tipo: "image" }];

/** Qué datos cambiaron (sin mirar la foto): sirve para saber si hay algo que guardar antes de procesar archivos. */
export const cambiosDeProfesional = (antes, despues) => calcularCambios(antes, despues, CAMPOS);

/** Qué cambió, incluida la foto: es lo que ve el Admin al revisar. */
export const cambiosDeProfesionalConFoto = (antes, despues) => calcularCambios(antes, despues, CAMPOS_CON_FOTO);
