import { crearApiEditorial } from "./editorial.api.js";

const documentos = crearApiEditorial("documentacion");

export const getDocumentos = documentos.listar;
export const createDocumento = documentos.crear;
export const updateDocumento = documentos.actualizar;
export const revisarDocumento = documentos.revisar;
export const deleteDocumento = documentos.eliminar;
