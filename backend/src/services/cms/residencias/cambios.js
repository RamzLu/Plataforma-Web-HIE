import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS = [
  { key: "nombre", label: "Nombre de la residencia" },
  { key: "categoria", label: "Categoría institucional" },
  { key: "convocatoria", label: "Estado de convocatoria" },
  { key: "fechaInicio", label: "Fecha de inicio / apertura" },
  { key: "fechaConvocatoria", label: "Fecha límite / examen" },
  { key: "duracion", label: "Duración" },
  { key: "cupos", label: "Cupos" },
  { key: "descripcion", label: "Resumen breve" },
  { key: "descripcionPrograma", label: "Programa académico" },
  { key: "requisitos", label: "Requisitos de postulación", tipo: "list" },
  { key: "reglamentoRotacion", label: "Leyenda de reglamento" },
  { key: "bannerNombre", label: "Imagen de banner" },
  { key: "documentoNombre", label: "Documento adjunto" },
];

/**
 * Qué campos cambiaron al editar (lo que ve el Admin al revisar).
 * @param existente  registro actual (con su banner)
 * @param previo     su contenido guardado (JSON)
 * @param data       lo que mandó el formulario
 * @param archivos   { banner, documento }: los archivos nuevos cargados (o undefined)
 */
export const cambiosDeResidencia = (existente, previo, data, { banner, documento }) => {
  const antes = {
    nombre: existente.nombre || "",
    categoria: previo.categoria || "",
    convocatoria: existente.convocatoria || "",
    fechaInicio: previo.fechaInicio || "",
    fechaConvocatoria: existente.fechaConvocatoria ? existente.fechaConvocatoria.toISOString().split("T")[0] : "",
    descripcion: existente.descripcion || "",
    descripcionPrograma: previo.descripcionPrograma || "",
    duracion: previo.duracion || "",
    cupos: previo.cupos || "",
    requisitos: previo.requisitos || "",
    reglamentoRotacion: previo.reglamentoRotacion || "",
    bannerNombre: existente.archivo?.nombreOriginal || "",
    documentoNombre: previo.documento?.documentoNombre || "",
  };

  const despues = {
    nombre: data.nombre !== undefined ? data.nombre.trim() : antes.nombre,
    categoria: data.categoria !== undefined ? data.categoria.trim() : antes.categoria,
    convocatoria: data.convocatoria !== undefined ? data.convocatoria.trim() : antes.convocatoria,
    fechaInicio: data.fechaInicio !== undefined ? data.fechaInicio || "" : antes.fechaInicio,
    fechaConvocatoria: data.fechaConvocatoria !== undefined ? data.fechaConvocatoria || "" : antes.fechaConvocatoria,
    descripcion: data.descripcion !== undefined ? data.descripcion.trim() : antes.descripcion,
    descripcionPrograma: data.descripcionPrograma !== undefined ? data.descripcionPrograma.trim() : antes.descripcionPrograma,
    duracion: data.duracion !== undefined ? data.duracion.trim() : antes.duracion,
    cupos: data.cupos !== undefined ? (data.cupos || "").trim() : antes.cupos,
    requisitos: data.requisitos !== undefined ? data.requisitos.trim() : antes.requisitos,
    reglamentoRotacion: data.reglamentoRotacion !== undefined ? data.reglamentoRotacion.trim() : antes.reglamentoRotacion,
    bannerNombre: banner ? banner.originalname : data.eliminarBanner ? "" : antes.bannerNombre,
    documentoNombre: documento ? documento.originalname : data.eliminarDocumento ? "" : antes.documentoNombre,
  };

  return calcularCambios(antes, despues, CAMPOS);
};
