import { calcularCambios } from "../../../utils/cambios.utils.js";

const CAMPOS = [
  { key: "titulo", label: "Título de la capacitación" },
  { key: "descripcion", label: "Descripción" },
  { key: "modalidad", label: "Modalidad" },
  { key: "horario", label: "Horario" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "disertantes", label: "Disertantes" },
  { key: "temario", label: "Temario" },
  { key: "fechaInicio", label: "Fecha de inicio", tipo: "date" },
  { key: "fechaFin", label: "Fecha de fin", tipo: "date" },
  { key: "videoUrl", label: "URL de video" },
  { key: "enlaceUrl", label: "URL de enlace" },
];

/**
 * Qué campos cambiaron al editar (lo que ve el Admin al revisar).
 * @param existente  registro actual
 * @param extra      su contenido guardado (JSON)
 * @param nuevo      { titulo, descripcion, contenido (el nuevo), fechaInicio, fechaFin, videoUrl, enlaceUrl }
 */
export const cambiosDeCapacitacion = (existente, extra, nuevo) =>
  calcularCambios(
    {
      titulo: existente.titulo || "",
      descripcion: existente.descripcion || "",
      modalidad: extra.modalidad || "Presencial",
      horario: extra.horario || "10:00",
      ubicacion: extra.ubicacion || "Hospital Interdistrital Evita",
      disertantes: extra.disertantes || "",
      temario: extra.temario || "",
      fechaInicio: existente.fechaInicio,
      fechaFin: existente.fechaFin,
      videoUrl: existente.videoUrl || "",
      enlaceUrl: existente.enlaceUrl || "",
    },
    {
      titulo: nuevo.titulo,
      descripcion: nuevo.descripcion,
      modalidad: nuevo.contenido.modalidad,
      horario: nuevo.contenido.horario,
      ubicacion: nuevo.contenido.ubicacion,
      disertantes: nuevo.contenido.disertantes,
      temario: nuevo.contenido.temario,
      fechaInicio: nuevo.fechaInicio,
      fechaFin: nuevo.fechaFin,
      videoUrl: nuevo.videoUrl || "",
      enlaceUrl: nuevo.enlaceUrl || "",
    },
    CAMPOS
  );
