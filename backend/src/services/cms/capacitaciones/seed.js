// Capacitaciones de ejemplo que se cargan solas la primera vez, cuando la tabla está vacía.

import { prisma } from "../../../config/prisma.js";

export const CAPACITACIONES_INICIALES = [
  {
    titulo: "Abordaje Inicial del ACV Isquémico en Guardia",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    temario:
      "Módulo 1: Reconocimiento precoz y aplicación de Escala Cincinnati.\nMódulo 2: Criterios clínicos de inclusión/exclusión para trombolisis endovenosa.\nMódulo 3: Activación del protocolo Código ACV institucional del HIE.\nMódulo 4: Cuidados de enfermería crítica y monitoreo en shock room.",
    modalidad: "Virtual",
    tipoRecurso: "video",
    fechaInicio: new Date("2026-05-20T10:00:00Z"),
    fechaFin: new Date("2026-05-20T13:00:00Z"),
    horario: "10:00",
    ubicacion: "Plataforma Telesalud HIE (Video)",
    disertantes: "Dr. Marcelo Morales, Dra. Elena Vega",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    archivoTipo: "video",
    archivoNombre: "Protocolo_ACV_VideoClase.mp4",
    archivoTamano: "14.2 MB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Uso de la Plataforma de Telesalud y Teleconsultas",
    descripcion:
      "Taller práctico para el manejo del sistema institucional de teleconsultas, carga de historias clínicas virtuales y atención remota de pacientes.",
    temario:
      "Módulo 1: Acceso, roles y permisos en el sistema Telesalud Formosa.\nMódulo 2: Coordinación de turnos virtuales y sala de espera digital.\nMódulo 3: Confección de historia clínica electrónica y recetas digitales.\nMódulo 4: Aspectos médico-legales y resguardo de datos sensibles.",
    modalidad: "Virtual",
    tipoRecurso: "pdf",
    fechaInicio: new Date("2026-05-22T11:30:00Z"),
    fechaFin: new Date("2026-05-22T13:00:00Z"),
    horario: "11:30",
    ubicacion: "Virtual - Plataforma Telesalud HIE",
    disertantes: "Lic. Carlos Benítez, Lic. Romina Soto",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Guia_Operativa_Teleconsultas_HIE.pdf",
    archivoTamano: "2.1 MB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Gestión Basada en Datos Clínicos para Enfermería",
    descripcion:
      "Capacitación para jefes de enfermería en la transformación de registros administrativos en datos clínicos útiles para la toma de decisiones.",
    temario:
      "Módulo 1: Indicadores clave de calidad en enfermería hospitalaria.\nMódulo 2: Registro estructurado en salas de internación general.\nMódulo 3: Auditoría concurrente y detección de eventos adversos.\nMódulo 4: Análisis de datos para asignación de dotaciones de guardia.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-05-20T10:00:00Z"),
    fechaFin: new Date("2026-05-20T14:00:00Z"),
    horario: "10:00",
    ubicacion: "SUM Hospital Interdistrital Evita",
    disertantes: "Lic. Patricia Romero, Enf. Esp. Claudio Ruiz",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Programa_Gestion_Enfermeria.pdf",
    archivoTamano: "980 KB",
    estado: "PUBLICADO",
    activo: true,
  },
  {
    titulo: "Reanimación Cardiopulmonar (RCP) Avanzada",
    descripcion:
      "Actualización en maniobras de RCP avanzada, uso de desfibrilador externo automático (DEA) y manejo de vía aérea en emergencias médicas.",
    temario:
      "Módulo 1: Algoritmos actualizados de Soporte Vital Cardiovascular Avanzado (ACLS).\nMódulo 2: Farmacología en paro cardiorrespiratorio y ritmos desfibrilables.\nMódulo 3: Práctica con simuladores de vía aérea avanzada y capnografía.\nMódulo 4: Dinámica y liderazgo de equipo en código azul.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-05T08:30:00Z"),
    fechaFin: new Date("2026-06-05T12:30:00Z"),
    horario: "08:30",
    ubicacion: "Gimnasio de Rehabilitación HIE",
    disertantes: "Dr. Martín Almada, Dra. Sofía Albornoz",
    videoUrl: "",
    archivoTipo: "imagen",
    archivoNombre: "Afiche_Convocatoria_RCP_2026.png",
    archivoTamano: "1.8 MB",
    estado: "BORRADOR",
    activo: true,
  },
  {
    titulo: "Control y Prevención de Infecciones Intrahospitalarias",
    descripcion:
      "Estrategias y medidas de bioseguridad para la prevención de infecciones asociadas al cuidado de la salud (IACS) en servicios críticos.",
    temario:
      "Módulo 1: Higiene de manos y paquete de medidas para bacteriemia cero.\nMódulo 2: Prevención de neumonía asociada a ventilación mecánica (NAVM).\nMódulo 3: Manejo de catéteres urinarios y prevención de ITU.\nMódulo 4: Aislamiento por cohortes y desinfección ambiental hospitalaria.",
    modalidad: "Híbrida",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-12T09:00:00Z"),
    fechaFin: new Date("2026-06-12T13:00:00Z"),
    horario: "09:00",
    ubicacion: "Híbrida - Aula Magna y Zoom",
    disertantes: "Dra. María Laura Giménez, Dr. Roberto Méndez",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Protocolo_IACS_Hospital_Evita.pdf",
    archivoTamano: "3.2 MB",
    estado: "ARCHIVADO",
    activo: true,
  },
  {
    titulo: "Bioética y Derechos del Paciente en el Ámbito Público",
    descripcion:
      "Análisis de casos dilemáticos en la práctica médica diaria, consentimiento informado y marco legal de la atención en el hospital público.",
    temario:
      "Módulo 1: Principios bioéticos aplicados a la medicina intensiva y de urgencias.\nMódulo 2: Directivas médicas anticipadas y adecuación del esfuerzo terapéutico.\nMódulo 3: Confidencialidad y secreto médico en equipos interdisciplinarios.\nMódulo 4: Dictámenes del Comité de Bioética Asistencial.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: new Date("2026-06-18T11:00:00Z"),
    fechaFin: new Date("2026-06-18T14:00:00Z"),
    horario: "11:00",
    ubicacion: "Auditorio Principal HIE",
    disertantes: "Dra. Valeria Fontana, Dr. Hernán Castro",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Temario_Bioetica_Hospitalaria.pdf",
    archivoTamano: "1.1 MB",
    estado: "PUBLICADO",
    activo: true,
  },
];

/** Carga las capacitaciones iniciales si todavía no hay ninguna. Nunca falla: solo avisa en el log. */
export const sembrarCapacitacionesIniciales = async () => {
  try {
    const cantidad = await prisma.capacitacion.count();
    if (cantidad > 0) return;

    console.log("Inicializando capacitaciones institucionales en base de datos...");
    for (const item of CAPACITACIONES_INICIALES) {
      const contenido = {
        temario: item.temario,
        modalidad: item.modalidad,
        tipoRecurso: item.tipoRecurso,
        horario: item.horario,
        ubicacion: item.ubicacion,
        disertantes: item.disertantes,
        archivoTipo: item.archivoTipo,
        archivoNombre: item.archivoNombre,
        archivoTamano: item.archivoTamano,
        archivoUrl: "",
        videoUrl: item.videoUrl || "",
        imagenUrl: "",
      };

      await prisma.capacitacion.create({
        data: {
          titulo: item.titulo,
          descripcion: item.descripcion,
          contenido: JSON.stringify(contenido),
          videoUrl: item.videoUrl || null,
          enlaceUrl: null,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          estado: item.estado,
          activo: item.activo,
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.warn("Aviso en auto-seed de capacitaciones:", error.message);
  }
};
