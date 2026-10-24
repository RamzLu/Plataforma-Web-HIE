import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import "../../styles/pages/cms/CmsContenidoGraficoView.css";
import {
  getContenidosGraficos,
  createContenidoGrafico,
  updateContenidoGrafico,
  deleteContenidoGrafico,
} from "../../api/contenidoGrafico.api.js";

// Imágenes de respaldo locales
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";
import defaultImg2 from "../../assets/fondoHospitalCarrusel2.jpg";
import defaultImg3 from "../../assets/fondoHospitalCarrusel3.jpg";
import defaultImg4 from "../../assets/fondoHospitalCarrusel4.jpg";

// Lista inicial de datos armonizados con Stitch y requerimientos editoriales sanitarios (24 recursos)
const INITIAL_RECURSOS = [
  {
    id: "cg-1",
    titulo: "Campaña Prevención Dengue 2026",
    descripcion: "Pautas y medidas vectoriales comunitarias para el distrito",
    altText: "Taller comunitario de prevención del dengue en aula hospitalaria con médico mostrando infografía y lavado de manos",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6iNQdW1e1ZOLr56k4xAArCU0V3BuFZYt8qM2XrIsKP8uRYexPVmEdT1Nzkd2p5FL2cgej9tznVc_E443IFrSvUp7pK1A6ROprzyxk1kj3pbgTaQx_nwwq_HJ2AVcg0zzsouVrOC_9SF3T1y1rG-ZkaAqJqmoy74swq02z88FfxbJz-81Qyp58MoPACwgMCCIUesWDG7eCIozBB4cWCwFOpToGSEMzFVMCzjacTEQI",
    page: "Inicio",
    ubicacion: "Cabecera Principal",
    orden: 1,
    enlaceUrl: "/campanas/dengue-2026",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-10T10:00:00Z",
  },
  {
    id: "cg-2",
    titulo: "Taller de Maternidad y Parto Respetado",
    descripcion: "Inscripciones abiertas para gestantes y acompañantes",
    altText: "Educadora sanitaria dialogando con mujeres gestantes en sala de obstetricia con láminas anatómicas explicativas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXywqfXTBjeMPY5VF6vq0Thwp3hCqzikGl4lVARPzlszssjVrELL2rRZ0d9RwRHdxD6ImJ6KOq07REoOx5ZtSudIwuWlNA5FOgj0LO7zCRT_eOYRcmW0PstXGYc5gIKOR5H7SOopO6gBAGFa_VRbhdhRCanv97kfEHo8Oo-CEqKLa7X33TExSAdf15OAjODc0KwI2-rdWzroMYNAVcdge5WsHD7AWAUNkXj4Eo8DGc",
    page: "Especialidades",
    ubicacion: "Sección Media",
    orden: 2,
    enlaceUrl: "/servicios/maternidad-parto",
    estado: "RECHAZADO",
    activo: false,
    rejectionReason: "Falta incorporar el isologo institucional en la esquina inferior y ajustar contraste de texto.",
    createdAt: "2026-04-12T14:30:00Z",
  },
  {
    id: "cg-3",
    titulo: "Nutrición y Soporte Clínico en Oncología",
    descripcion: "Guías alimentarias para pacientes ambulatorios e internados",
    altText: "Mesa redonda multidisciplinaria con nutricionistas y pacientes evaluando alimentos frescos y dietoterapia oncológica",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtH1OBzrxPnOxN-zzXE-jTuUqniriIq6nP5HDVhcxubPGbyZRD29BnZfKn_RglPWoLtAVE0RxuckWeGSTKi1CzG_ZzJzrqD_qYDHNHSsNgY80A2dxxbbM-biuxKjYeSMeSajOfrl4XUOFAoeuW1DpCUP7MvlgIAnlyuoZy6w_rvR_L5PdFdF-CLHhie_3UGwhDa_n33qsBn5G6t_yF4s0F4JZ7ICk8PaiIAUjUYZXZ",
    page: "Capacitación",
    ubicacion: "Sección Media",
    orden: 3,
    enlaceUrl: "/nutricion/oncologia-clinica",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-15T09:15:00Z",
  },
  {
    id: "cg-4",
    titulo: "Residencias de Cirugía de Alta Complejidad",
    descripcion: "Entrenamiento continuo en centro de destrezas quirúrgicas",
    altText: "Equipo quirúrgico con barbijos y cofias realizando entrenamiento en simulador de laparoscopía bajo iluminación quirúrgica",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUFMs9uljQyYjgM6I7oJl6DZcT_5_jnEh2rum0JTk8jUP8n42KHcpox5IHDHc4S7Q0Mwu-RnR05sz3j5Fi1Tgph7jDz8jpkQLGmmnevVw0avc5ECjCRMyOXiBzPXMaIKAmsGeW3HE9GRkozG8iNp0c9qGGOQW3MrU1lDmC67ONYeeDPlMZIx0PqHXXlJE1y-DHqJaiHLh58oGW9KEfT6LYcEa5YP1S39j6l4b0VBov",
    page: "Capacitación",
    ubicacion: "Cabecera Principal",
    orden: 4,
    enlaceUrl: "/residencias/admision-2026",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-16T11:45:00Z",
  },
  {
    id: "cg-5",
    titulo: "Protocolo de Triage Pediátrico y Guardias",
    descripcion: "Actualización visual de tiempos y categorías de atención",
    altText: "",
    imageUrl: null,
    page: "Institucional",
    ubicacion: "Columna Lateral",
    orden: 5,
    enlaceUrl: "",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-18T16:20:00Z",
  },
  {
    id: "cg-6",
    titulo: "Banco de Sangre y Colectas Externas",
    descripcion: "Cronograma mensual de donación voluntaria en la provincia",
    altText: "Profesionales del centro provincial de hemoterapia recibiendo a donantes voluntarios de sangre",
    imageUrl: defaultImg1,
    page: "Inicio",
    ubicacion: "Sección Media",
    orden: 6,
    enlaceUrl: "/banco-sangre/donacion",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "cg-7",
    titulo: "Servicio de Hemodinamia y Cuidados Críticos",
    descripcion: "Equipamiento de última generación para intervenciones cardiovasculares",
    altText: "Sala de angiografía digital y consola médica de monitoreo coronario",
    imageUrl: defaultImg2,
    page: "Especialidades",
    ubicacion: "Cabecera Principal",
    orden: 7,
    enlaceUrl: "/servicios/hemodinamia",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-02T09:30:00Z",
  },
  {
    id: "cg-8",
    titulo: "Jornadas Provinciales de Bioética Hospitalaria",
    descripcion: "Encuentro de comités hospitalarios del nordeste argentino",
    altText: "Auditorio institucional con profesionales de la salud debatiendo dilemas éticos asistenciales",
    imageUrl: defaultImg3,
    page: "Capacitación",
    ubicacion: "Columna Lateral",
    orden: 8,
    enlaceUrl: "/capacitacion/jornada-bioetica-2026",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-05T14:10:00Z",
  },
  {
    id: "cg-9",
    titulo: "Campaña de Vacunación Antigripal Adultos Mayores",
    descripcion: "Puntos estratégicos y horarios de aplicación sin turno previo",
    altText: "Enfermera administrando vacuna a un adulto mayor con carnet oficial",
    imageUrl: defaultImg4,
    page: "Inicio",
    ubicacion: "Cabecera Principal",
    orden: 9,
    enlaceUrl: "/campanas/vacunacion-adultos",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-06T11:00:00Z",
  },
  {
    id: "cg-10",
    titulo: "Taller Comunitario de RCP y Primeros Auxilios",
    descripcion: "Capacitación abierta a la comunidad para reanimación cardiopulmonar",
    altText: "Instructor demostrando maniobra de compresiones torácicas sobre torso de simulación",
    imageUrl: defaultImg1,
    page: "Institucional",
    ubicacion: "Sección Media",
    orden: 10,
    enlaceUrl: "/comunidad/rcp-basico",
    estado: "RECHAZADO",
    activo: false,
    rejectionReason: "Resolución fotográfica inferior al estándar mínimo (debe ser mayor a 1920x1080).",
    createdAt: "2026-04-07T15:40:00Z",
  },
  {
    id: "cg-11",
    titulo: "Consultorios Externos y Gestión de Turnos Web",
    descripcion: "Acceso ágil a turnos programados a través del portal de autogestión",
    altText: "Paciente utilizando la aplicación móvil para agendar turno hospitalario",
    imageUrl: defaultImg2,
    page: "Inicio",
    ubicacion: "Columna Lateral",
    orden: 11,
    enlaceUrl: "/turnos-web",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-08T12:00:00Z",
  },
  {
    id: "cg-12",
    titulo: "Atención Pediátrica Integral y Guardias 24hs",
    descripcion: "Cuidado especializado para recién nacidos, niños y adolescentes",
    altText: "Médica pediatra atendiendo con estetoscopio a un niño en consultorio iluminado",
    imageUrl: defaultImg3,
    page: "Especialidades",
    ubicacion: "Sección Media",
    orden: 12,
    enlaceUrl: "/especialidades/pediatria",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-09T17:15:00Z",
  },
  {
    id: "cg-13",
    titulo: "Simulación Clínica Avanzada para Enfermería",
    descripcion: "Talleres prácticos en salas de alta fidelidad para cuidados críticos",
    altText: "Estudiantes de enfermería en sala de shock room con maniquí computarizado",
    imageUrl: defaultImg4,
    page: "Capacitación",
    ubicacion: "Sección Media",
    orden: 13,
    enlaceUrl: "/capacitacion/simulacion-enfermeria",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-11T13:25:00Z",
  },
  {
    id: "cg-14",
    titulo: "Unidad de Diagnóstico por Imágenes de Alta Complejidad",
    descripcion: "Tomografía multislice y resonancia magnética 3 Tesla",
    altText: "Tecnólogo en radiología posicionando al paciente en equipo de resonancia magnética",
    imageUrl: defaultImg1,
    page: "Especialidades",
    ubicacion: "Pie",
    orden: 14,
    enlaceUrl: "/especialidades/diagnostico-imagenes",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-13T10:50:00Z",
  },
  {
    id: "cg-15",
    titulo: "Guía de Derechos de Pacientes y Consentimiento Informado",
    descripcion: "Material informativo para salas de espera e internación",
    altText: "Infografía institucional con los 10 derechos del paciente y marco legal",
    imageUrl: defaultImg2,
    page: "Institucional",
    ubicacion: "Pie",
    orden: 15,
    enlaceUrl: "/institucional/derechos-pacientes",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-14T09:00:00Z",
  },
  {
    id: "cg-16",
    titulo: "Actualización en Farmacovigilancia y Seguridad del Paciente",
    descripcion: "Módulos de capacitación interna para el cuerpo médico y farmacéutico",
    altText: "",
    imageUrl: null,
    page: "Capacitación",
    ubicacion: "Columna Lateral",
    orden: 16,
    enlaceUrl: "",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-17T11:20:00Z",
  },
  {
    id: "cg-17",
    titulo: "Prevención de Infecciones Asociadas al Cuidado de la Salud",
    descripcion: "Manual de bioseguridad y normas de aislamiento hospitalario",
    altText: "Dispensadores de alcohol en gel y señalética de lavado de manos en pasillo clínico",
    imageUrl: defaultImg3,
    page: "Institucional",
    ubicacion: "Cabecera Principal",
    orden: 17,
    enlaceUrl: "/calidad/seguridad-paciente",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-19T08:45:00Z",
  },
  {
    id: "cg-18",
    titulo: "Centro Integral de Rehabilitación y Kinesiología",
    descripcion: "Terapia física y readaptación funcional motora para pacientes postraumáticos",
    altText: "Kinesiólogo asistiendo en barras paralelas a paciente en rehabilitación motriz",
    imageUrl: defaultImg4,
    page: "Especialidades",
    ubicacion: "Columna Lateral",
    orden: 18,
    enlaceUrl: "/servicios/kinesiologia",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-20T14:00:00Z",
  },
  {
    id: "cg-19",
    titulo: "Programa de Detección Precoz del Cáncer de Mama",
    descripcion: "Mamografías digitales sin orden médica durante octubre rosa",
    altText: "Listón rosa y mamógrafo digital de última generación en centro mamario",
    imageUrl: defaultImg1,
    page: "Inicio",
    ubicacion: "Pie",
    orden: 19,
    enlaceUrl: "/campanas/cancer-mama",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-21T15:30:00Z",
  },
  {
    id: "cg-20",
    titulo: "Laboratorio Central de Análisis Clínicos y Microbiología",
    descripcion: "Procesamiento automatizado de muestras con resultados en línea",
    altText: "Bioquímica analizando cultivos celulares bajo microscopio binocular",
    imageUrl: defaultImg2,
    page: "Especialidades",
    ubicacion: "Sección Media",
    orden: 20,
    enlaceUrl: "/servicios/laboratorio",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-22T09:10:00Z",
  },
  {
    id: "cg-21",
    titulo: "Campaña de Salud Visual Infantil y Detección de Ambliopía",
    descripcion: "Controles oftalmológicos gratuitos para niños en edad escolar",
    altText: "Oftalmólogo examinando agudeza visual con optotipo infantil",
    imageUrl: defaultImg3,
    page: "Inicio",
    ubicacion: "Columna Lateral",
    orden: 21,
    enlaceUrl: "/campanas/salud-visual-ninos",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-22T16:00:00Z",
  },
  {
    id: "cg-22",
    titulo: "Protocolo de Derivaciones y Red Provincial de Salud",
    descripcion: "Criterios de traslado sanitario y coordinación con hospitales distritales",
    altText: "Ambulancia de alta complejidad arribando al helipuerto del Hospital Evita",
    imageUrl: defaultImg4,
    page: "Institucional",
    ubicacion: "Columna Lateral",
    orden: 22,
    enlaceUrl: "/red-salud/derivaciones",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-23T11:40:00Z",
  },
  {
    id: "cg-23",
    titulo: "Semana del Donante de Médula Ósea",
    descripcion: "Inscripción en el registro nacional de donantes CPH",
    altText: "Voluntarios brindando folletos informativos sobre donación de células madre",
    imageUrl: defaultImg1,
    page: "Inicio",
    ubicacion: "Sección Media",
    orden: 23,
    enlaceUrl: "/campanas/medula-osea",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    createdAt: "2026-04-23T14:20:00Z",
  },
  {
    id: "cg-24",
    titulo: "Borrador de Guía de Atención en Salud Mental Comunitaria",
    descripcion: "Lineamientos de urgencias psiquiátricas y contención psicológica",
    altText: "",
    imageUrl: null,
    page: "Especialidades",
    ubicacion: "Pie",
    orden: 24,
    enlaceUrl: "",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    createdAt: "2026-04-24T10:00:00Z",
  },
];

const CmsContenidoGraficoView = () => {
  // Lista de contenidos gráficos
  const [recursos, setRecursos] = useState(() => {
    const saved = localStorage.getItem("hie_contenido_grafico");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error al cargar datos guardados de contenido gráfico", e);
      }
    }
    return INITIAL_RECURSOS;
  });

  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroPagina, setFiltroPagina] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modales
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados de trabajo para Modales
  const [selectedRecurso, setSelectedRecurso] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFixingRejection, setIsFixingRejection] = useState(false);
  const [reviewAction, setReviewAction] = useState("approve"); // "approve" | "reject"
  const [reviewRejectionText, setReviewRejectionText] = useState("");

  // Estado específico para el Modal de Corrección (Stitch Specification)
  const [correctionData, setCorrectionData] = useState({
    id: "",
    expediente: "3418/25",
    rejectionReason: "",
    titulo: "",
    descripcion: "",
    altText: "",
    enlaceUrl: "",
    page: "Página de Inicio",
    ubicacion: "Cabecera Principal",
    orden: 1,
    activo: false,
    imageUrl: "",
    fileName: "recurso_hospital_evita.jpg",
    fileMeta: "1.8 MB • 1920×1080 px • WEBP/JPG progresivo",
    fileObj: null,
  });
  const correctionFileInputRef = useRef(null);

  // Formulario de Creación / Edición
  const initialFormData = {
    titulo: "",
    descripcion: "",
    altText: "",
    page: "Inicio",
    ubicacion: "Cabecera Principal",
    orden: 1,
    enlaceUrl: "",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    imageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // Persistir en LocalStorage cada vez que cambien los recursos
  useEffect(() => {
    localStorage.setItem("hie_contenido_grafico", JSON.stringify(recursos));
  }, [recursos]);

  // Cargar desde el backend si está disponible
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        setLoading(true);
        const data = await getContenidosGraficos();
        if (Array.isArray(data) && data.length > 0) {
          // Unificar con los datos locales
          const formateados = data.map((item, idx) => ({
            id: item.id ? item.id.toString() : `api-${idx}`,
            titulo: item.titulo || item.title || "Sin título",
            descripcion: item.descripcion || item.content || "",
            altText: item.altText || item.alt || "Recurso institucional HIE",
            imageUrl: item.imageUrl || item.url || defaultImg1,
            page: item.page || "Inicio",
            ubicacion: item.ubicacion || "Cabecera Principal",
            orden: item.orden || idx + 1,
            enlaceUrl: item.enlace || item.enlaceUrl || "",
            estado: item.estado || (item.activo ? "APROBADO" : "BORRADOR"),
            activo: typeof item.activo === "boolean" ? item.activo : true,
            rejectionReason: item.rejectionReason || null,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          setRecursos(formateados);
        }
      } catch (err) {
        // En caso de que el backend no esté activo, mantenemos la lista inicial/local
        console.log("Modo autónomo de CMS Contenido Gráfico (Backend no conectado o sin cambios)");
      } finally {
        setLoading(false);
      }
    };

    fetchFromBackend();
  }, []);

  // Cálculo dinámico de Métricas / KPIs
  const stats = useMemo(() => {
    const total = recursos.length;
    const borradores = recursos.filter((r) => r.estado === "BORRADOR").length;
    const pendientes = recursos.filter((r) => r.estado === "PENDIENTE_APROBACION").length;
    const rechazados = recursos.filter((r) => r.estado === "RECHAZADO").length;
    const publicados = recursos.filter((r) => r.estado === "APROBADO" || r.estado === "PUBLICADO").length;
    const tasaAprobacion = total > 0 ? Math.round((publicados / total) * 100) : 0;

    return { total, borradores, pendientes, rechazados, publicados, tasaAprobacion };
  }, [recursos]);

  // Filtrado de recursos
  const recursosFiltrados = useMemo(() => {
    return recursos.filter((item) => {
      // Búsqueda por texto (título, descripción, enlace)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchTitulo = item.titulo?.toLowerCase().includes(query);
        const matchDesc = item.descripcion?.toLowerCase().includes(query);
        const matchLink = item.enlaceUrl?.toLowerCase().includes(query);
        if (!matchTitulo && !matchDesc && !matchLink) return false;
      }

      // Filtro de Página
      if (filtroPagina) {
        const matchPage = item.page?.toLowerCase() === filtroPagina.toLowerCase();
        if (!matchPage) return false;
      }

      // Filtro de Ubicación
      if (filtroUbicacion) {
        const matchUbicacion = item.ubicacion?.toLowerCase().includes(filtroUbicacion.toLowerCase());
        if (!matchUbicacion) return false;
      }

      // Filtro de Estado
      if (filtroEstado) {
        if (filtroEstado.toLowerCase() === "aprobado") {
          if (item.estado !== "APROBADO" && item.estado !== "PUBLICADO") return false;
        } else if (item.estado?.toLowerCase() !== filtroEstado.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [recursos, searchTerm, filtroPagina, filtroUbicacion, filtroEstado]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(recursosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, recursosFiltrados.length);
  const currentRecursos = recursosFiltrados.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFiltroPagina("");
    setFiltroUbicacion("");
    setFiltroEstado("");
    setCurrentPage(1);
    toast.success("Filtros restablecidos");
  };

  // Reordenar elementos interactivos (Up / Down)
  const handleMoveOrder = (item, direction) => {
    const currentIndexInList = recursos.findIndex((r) => r.id === item.id);
    if (currentIndexInList === -1) return;

    const targetIndex = direction === "up" ? currentIndexInList - 1 : currentIndexInList + 1;
    if (targetIndex < 0 || targetIndex >= recursos.length) return;

    const newRecursos = [...recursos];
    const temp = newRecursos[currentIndexInList];
    newRecursos[currentIndexInList] = newRecursos[targetIndex];
    newRecursos[targetIndex] = temp;

    // Actualizar números de orden correlativos
    const reordered = newRecursos.map((r, index) => ({
      ...r,
      orden: index + 1,
    }));

    setRecursos(reordered);
    toast.success(`Orden actualizado: "${item.titulo}" ahora es posición ${targetIndex + 1}°`);
  };

  // Alternar Disponibilidad (Switch Activo / Inactivo)
  const handleToggleActivo = (item) => {
    if (item.estado === "RECHAZADO") {
      toast.error("No se puede activar un recurso rechazado sin corregir las observaciones.");
      return;
    }
    if (item.estado === "BORRADOR") {
      toast.error("Los borradores deben ser aprobados antes de poder activarse en el portal público.");
      return;
    }

    const nuevoActivo = !item.activo;
    setRecursos((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, activo: nuevoActivo } : r))
    );

    toast.success(
      nuevoActivo
        ? `Recurso "${item.titulo}" activado en el portal.`
        : `Recurso "${item.titulo}" desactivado.`
    );
  };

  // Apertura de Modales
  const handleOpenCreate = () => {
    setIsEditing(false);
    setIsFixingRejection(false);
    setSelectedRecurso(null);
    setFormData({
      ...initialFormData,
      orden: recursos.length + 1,
    });
    setImageFile(null);
    setImagePreview("");
    setShowCreateEditModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setIsFixingRejection(item.estado === "RECHAZADO");
    setSelectedRecurso(item);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion || "",
      altText: item.altText || "",
      page: item.page,
      ubicacion: item.ubicacion,
      orden: item.orden,
      enlaceUrl: item.enlaceUrl || "",
      estado: item.estado,
      activo: item.activo,
      rejectionReason: item.rejectionReason,
      imageUrl: item.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(item.imageUrl || "");
    setShowCreateEditModal(true);
  };

  const handleOpenCorrection = (item) => {
    setSelectedRecurso(item);

    let pageValue = "Página de Inicio";
    if (item.page?.toLowerCase().includes("inicio")) pageValue = "Página de Inicio";
    else if (item.page?.toLowerCase().includes("especialidad")) pageValue = "Especialidades y Servicios";
    else if (item.page?.toLowerCase().includes("capacita") || item.page?.toLowerCase().includes("docencia")) pageValue = "Capacitación y Docencia";
    else if (item.page?.toLowerCase().includes("institucion") || item.page?.toLowerCase().includes("autoridad")) pageValue = "Institucional / Autoridades";

    let ubicacionValue = "Cabecera Principal";
    if (item.ubicacion?.toLowerCase().includes("cabecera")) ubicacionValue = "Cabecera Principal";
    else if (item.ubicacion?.toLowerCase().includes("media") || item.ubicacion?.toLowerCase().includes("transversal")) ubicacionValue = "Sección Media Transversal";
    else if (item.ubicacion?.toLowerCase().includes("lateral") || item.ubicacion?.toLowerCase().includes("columna")) ubicacionValue = "Columna Lateral Institucional";
    else if (item.ubicacion?.toLowerCase().includes("pie")) ubicacionValue = "Pie / Accesos Rápidos";

    let filename = "recurso_hospital_evita.jpg";
    if (item.titulo) {
      filename = item.titulo.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 32) + ".jpg";
    }

    setCorrectionData({
      id: item.id,
      expediente: "3418/25",
      rejectionReason: item.rejectionReason || "La imagen adjunta no cuenta con resolución adecuada para la cabecera y el texto alternativo es insuficiente para accesibilidad WCAG. Por favor, actualizar el recurso y detallar el atributo ALT antes de reenviar.",
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      altText: item.altText || "",
      enlaceUrl: item.enlaceUrl || "",
      page: pageValue,
      ubicacion: ubicacionValue,
      orden: item.orden || 1,
      activo: item.activo || false,
      imageUrl: item.imageUrl || defaultImg1,
      fileName: filename,
      fileMeta: "1.8 MB • 1920×1080 px • WEBP/JPG progresivo",
      fileObj: null,
    });
    setShowCorrectionModal(true);
  };

  const handleCorrectionFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor seleccione un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el tamaño máximo permitido de 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);

    setCorrectionData((prev) => ({
      ...prev,
      fileObj: file,
      imageUrl: previewUrl,
      fileName: file.name,
      fileMeta: `${sizeInMB} MB • 1920×1080 px • ${file.type.split("/")[1]?.toUpperCase() || "JPG"} progresivo`,
    }));
    toast.success("Nueva imagen cargada para la corrección.");
  };

  const handleSaveCorrectionAsDraft = () => {
    if (!selectedRecurso) return;

    let pageShort = "Inicio";
    if (correctionData.page.includes("Especialidades")) pageShort = "Especialidades";
    else if (correctionData.page.includes("Capacitación")) pageShort = "Capacitación";
    else if (correctionData.page.includes("Institucional")) pageShort = "Institucional";

    let ubicacionShort = "Cabecera Principal";
    if (correctionData.ubicacion.includes("Media")) ubicacionShort = "Sección Media";
    else if (correctionData.ubicacion.includes("Lateral")) ubicacionShort = "Columna Lateral";
    else if (correctionData.ubicacion.includes("Pie")) ubicacionShort = "Pie";

    setRecursos((prev) =>
      prev.map((r) =>
        r.id === selectedRecurso.id
          ? {
              ...r,
              titulo: correctionData.titulo,
              descripcion: correctionData.descripcion,
              altText: correctionData.altText,
              enlaceUrl: correctionData.enlaceUrl,
              page: pageShort,
              ubicacion: ubicacionShort,
              orden: parseInt(correctionData.orden, 10) || r.orden,
              activo: false,
              imageUrl: correctionData.imageUrl,
              estado: "BORRADOR",
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    toast.success("Recurso guardado como Borrador. Podrá continuar editándolo más tarde.");
    setShowCorrectionModal(false);
  };

  const handleResubmitCorrectionForApproval = () => {
    if (!selectedRecurso) return;

    if (!correctionData.titulo.trim()) {
      toast.error("El título del contenido gráfico es obligatorio.");
      return;
    }

    if (!correctionData.altText.trim()) {
      toast.error("El texto alternativo (ALT) es obligatorio según el estándar WCAG 2.1 AA antes de reenviar.");
      return;
    }

    let pageShort = "Inicio";
    if (correctionData.page.includes("Especialidades")) pageShort = "Especialidades";
    else if (correctionData.page.includes("Capacitación")) pageShort = "Capacitación";
    else if (correctionData.page.includes("Institucional")) pageShort = "Institucional";

    let ubicacionShort = "Cabecera Principal";
    if (correctionData.ubicacion.includes("Media")) ubicacionShort = "Sección Media";
    else if (correctionData.ubicacion.includes("Lateral")) ubicacionShort = "Columna Lateral";
    else if (correctionData.ubicacion.includes("Pie")) ubicacionShort = "Pie";

    setRecursos((prev) =>
      prev.map((r) =>
        r.id === selectedRecurso.id
          ? {
              ...r,
              titulo: correctionData.titulo,
              descripcion: correctionData.descripcion,
              altText: correctionData.altText,
              enlaceUrl: correctionData.enlaceUrl,
              page: pageShort,
              ubicacion: ubicacionShort,
              orden: parseInt(correctionData.orden, 10) || r.orden,
              activo: correctionData.activo,
              imageUrl: correctionData.imageUrl,
              estado: "PENDIENTE_APROBACION",
              rejectionReason: null,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    const resourceCode = selectedRecurso.id.startsWith("cg-")
      ? `#CG-0${selectedRecurso.id.replace("cg-", "")}`
      : `#CG-${selectedRecurso.id}`;

    toast.success(`¡Corrección enviada! El recurso ${resourceCode} ha sido reenviado para Aprobación Editorial.`);
    setShowCorrectionModal(false);
  };

  const handleOpenPreview = (item) => {
    setSelectedRecurso(item);
    setShowPreviewModal(true);
  };

  const handleOpenReview = (item) => {
    setSelectedRecurso(item);
    setReviewAction("approve");
    setReviewRejectionText("");
    setShowReviewModal(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedRecurso(item);
    setShowDeleteModal(true);
  };

  // Manejo de carga de imagen
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor seleccione un archivo de imagen válido (JPG, PNG o WebP).");
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Guardar recurso (Crear / Actualizar / Corregir)
  const handleSaveForm = (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error("El título del recurso es obligatorio.");
      return;
    }

    if (!formData.altText.trim() && formData.estado === "APROBADO") {
      toast.error("Para publicar un recurso es obligatorio ingresar el texto alternativo accesible (WCAG 2.2).");
      return;
    }

    if (!imagePreview && !imageFile && !isEditing) {
      toast.error("Debe cargar una imagen o recurso visual.");
      return;
    }

    let finalImageUrl = imagePreview || defaultImg1;
    let nuevoEstado = formData.estado;

    // Si estábamos corrigiendo un rechazo, pasa a Pendiente de Aprobación
    if (isFixingRejection) {
      nuevoEstado = "PENDIENTE_APROBACION";
    }

    if (isEditing && selectedRecurso) {
      // Actualización
      setRecursos((prev) =>
        prev.map((item) =>
          item.id === selectedRecurso.id
            ? {
                ...item,
                ...formData,
                imageUrl: finalImageUrl,
                estado: nuevoEstado,
                rejectionReason: isFixingRejection ? null : formData.rejectionReason,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      if (isFixingRejection) {
        toast.success("¡Corrección guardada! El recurso fue reenviado a revisión editorial.");
      } else {
        toast.success("Contenido gráfico actualizado correctamente.");
      }
    } else {
      // Creación
      const nuevoRecurso = {
        id: `cg-${Date.now()}`,
        ...formData,
        imageUrl: finalImageUrl,
        estado: formData.estado || "BORRADOR",
        activo: formData.activo || false,
        rejectionReason: null,
        createdAt: new Date().toISOString(),
      };

      setRecursos((prev) => [nuevoRecurso, ...prev]);
      toast.success("Nuevo contenido gráfico registrado con éxito.");
    }

    setShowCreateEditModal(false);
  };

  // Procesar Revisión Editorial (Aprobar / Rechazar con motivo - RF-CMS-035)
  const handleProcessReview = () => {
    if (!selectedRecurso) return;

    if (reviewAction === "reject") {
      if (!reviewRejectionText.trim()) {
        toast.error("Debe especificar obligatoriamente el motivo de rechazo (RF-CMS-035).");
        return;
      }

      setRecursos((prev) =>
        prev.map((r) =>
          r.id === selectedRecurso.id
            ? {
                ...r,
                estado: "RECHAZADO",
                activo: false,
                rejectionReason: reviewRejectionText.trim(),
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.error(`Recurso "${selectedRecurso.titulo}" rechazado con observaciones.`);
    } else {
      // Aprobar
      setRecursos((prev) =>
        prev.map((r) =>
          r.id === selectedRecurso.id
            ? {
                ...r,
                estado: "APROBADO",
                activo: true,
                rejectionReason: null,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success(`Recurso "${selectedRecurso.titulo}" aprobado y habilitado en el portal.`);
    }

    setShowReviewModal(false);
  };

  // Enviar a aprobación rápida desde la tabla
  const handleSendToApproval = (item) => {
    setRecursos((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              estado: "PENDIENTE_APROBACION",
              rejectionReason: null,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    toast.success(`"${item.titulo}" fue enviado al circuito de aprobación editorial.`);
  };

  // Eliminar Recurso
  const handleConfirmDelete = () => {
    if (!selectedRecurso) return;

    setRecursos((prev) => prev.filter((r) => r.id !== selectedRecurso.id));
    toast.success("Recurso eliminado correctamente.");
    setShowDeleteModal(false);
    setSelectedRecurso(null);
  };

  return (
    <div className="cg-view-wrapper">
      {/* Encabezado Institucional y Migas de Pan */}
      <div className="cg-header">
        <div>
          <nav aria-label="Migas de pan" className="cg-breadcrumbs">
            <span className="cg-breadcrumbs-item">CMS Administrativo</span>
            <span className="cg-breadcrumbs-sep">/</span>
            <span className="cg-breadcrumbs-item">Módulo 5</span>
            <span className="cg-breadcrumbs-sep">/</span>
            <span className="cg-breadcrumbs-current">Gestión de Contenido Gráfico</span>
          </nav>

          <div className="cg-header-main">
            <div className="cg-header-icon-box">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                collections
              </span>
            </div>
            <div>
              <h1 className="cg-header-title">Gestión de Contenido Gráfico</h1>
              <p className="cg-header-subtitle">
                Administración de recursos visuales por página y sección del Portal Público
              </p>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal (RF-CMS-028) */}
        <div>
          <button className="cg-btn-primary" type="button" onClick={handleOpenCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              add_circle
            </span>
            <span>Nuevo Contenido Gráfico</span>
          </button>
        </div>
      </div>

      {/* Fila de KPIs / Indicadores de Control Editorial (5 Métricas Clave) */}
      <div className="cg-kpis-grid">
        {/* KPI 1: Total Recursos */}
        <div
          className={`cg-kpi-card ${filtroEstado === "" ? "active-kpi" : ""}`}
          onClick={() => {
            setFiltroEstado("");
            setCurrentPage(1);
          }}
          title="Ver todos los recursos visuales"
        >
          <div className="cg-kpi-header">
            <span className="cg-kpi-label">Total Recursos</span>
            <span className="cg-kpi-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                photo_library
              </span>
            </span>
          </div>
          <div className="cg-kpi-body">
            <span className="cg-kpi-value">{stats.total}</span>
            <span className="cg-kpi-subtitle">activos en sistema</span>
          </div>
        </div>

        {/* KPI 2: Borradores */}
        <div
          className={`cg-kpi-card ${filtroEstado === "BORRADOR" ? "active-kpi" : ""}`}
          onClick={() => {
            setFiltroEstado(filtroEstado === "BORRADOR" ? "" : "BORRADOR");
            setCurrentPage(1);
          }}
          title="Filtrar borradores"
        >
          <div className="cg-kpi-header">
            <span className="cg-kpi-label">Borradores</span>
            <span className="cg-kpi-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                edit_note
              </span>
            </span>
          </div>
          <div className="cg-kpi-body">
            <span className="cg-kpi-value">{stats.borradores}</span>
            <span className="cg-kpi-subtitle">en redacción</span>
          </div>
        </div>

        {/* KPI 3: Pendientes */}
        <div
          className={`cg-kpi-card ${filtroEstado === "PENDIENTE_APROBACION" ? "active-kpi" : ""}`}
          onClick={() => {
            setFiltroEstado(filtroEstado === "PENDIENTE_APROBACION" ? "" : "PENDIENTE_APROBACION");
            setCurrentPage(1);
          }}
          title="Filtrar recursos pendientes de aprobación"
        >
          <div className="cg-kpi-header">
            <span className="cg-kpi-label" style={{ color: "var(--cg-secondary)" }}>
              Pendientes
            </span>
            <span className="cg-kpi-icon pending">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                pending_actions
              </span>
            </span>
          </div>
          <div className="cg-kpi-body">
            <span className="cg-kpi-value">{stats.pendientes}</span>
            <span className="cg-kpi-badge pending">
              <span className="cg-kpi-dot" style={{ backgroundColor: "var(--cg-primary)" }}></span>
              En revisión
            </span>
          </div>
        </div>

        {/* KPI 4: Requieren Ajuste (Rechazados / RF-CMS-035) */}
        <div
          className={`cg-kpi-card ${filtroEstado === "RECHAZADO" ? "active-kpi" : ""}`}
          onClick={() => {
            setFiltroEstado(filtroEstado === "RECHAZADO" ? "" : "RECHAZADO");
            setCurrentPage(1);
          }}
          title="Filtrar recursos con observaciones de rechazo"
        >
          <div className="cg-kpi-header">
            <span className="cg-kpi-label" style={{ color: "var(--cg-error)" }}>
              Requieren Ajuste
            </span>
            <span className="cg-kpi-icon error">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                error
              </span>
            </span>
          </div>
          <div className="cg-kpi-body">
            <span className="cg-kpi-value error">{stats.rechazados}</span>
            <span className="cg-kpi-badge error">Con observaciones</span>
          </div>
        </div>

        {/* KPI 5: Publicados */}
        <div
          className={`cg-kpi-card ${filtroEstado === "APROBADO" ? "active-kpi" : ""}`}
          onClick={() => {
            setFiltroEstado(filtroEstado === "APROBADO" ? "" : "APROBADO");
            setCurrentPage(1);
          }}
          title="Filtrar recursos publicados en el portal"
        >
          <div className="cg-kpi-header">
            <span className="cg-kpi-label" style={{ color: "var(--cg-tertiary)" }}>
              Publicados
            </span>
            <span className="cg-kpi-icon tertiary">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                cloud_done
              </span>
            </span>
          </div>
          <div className="cg-kpi-body">
            <span className="cg-kpi-value">{stats.publicados}</span>
            <span className="cg-kpi-badge tertiary">
              <span className="cg-kpi-dot pulse" style={{ backgroundColor: "var(--cg-tertiary)" }}></span>
              En portal
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Herramientas y Filtros Combinables */}
      <div className="cg-filters-card">
        <div className="cg-filters-grid">
          {/* Buscador principal */}
          <div className="cg-search-box">
            <span className="material-symbols-outlined cg-search-icon">search</span>
            <input
              type="text"
              className="cg-search-input"
              placeholder="Buscar contenido gráfico por título..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filtro Página del Portal */}
          <div className="cg-select-wrapper">
            <select
              className="cg-select"
              value={filtroPagina}
              onChange={(e) => {
                setFiltroPagina(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Página: Todas las páginas</option>
              <option value="inicio">Inicio (Home)</option>
              <option value="especialidades">Especialidades y Servicios</option>
              <option value="capacitación">Capacitación y Residencias</option>
              <option value="institucional">Información Institucional</option>
            </select>
            <span className="material-symbols-outlined cg-select-chevron">expand_more</span>
          </div>

          {/* Filtro Ubicación */}
          <div className="cg-select-wrapper">
            <select
              className="cg-select"
              value={filtroUbicacion}
              onChange={(e) => {
                setFiltroUbicacion(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Ubicación: Todas</option>
              <option value="cabecera">Cabecera Principal</option>
              <option value="media">Sección Media Informativa</option>
              <option value="lateral">Columna Lateral Destacada</option>
              <option value="pie">Pie Institucional</option>
            </select>
            <span className="material-symbols-outlined cg-select-chevron">expand_more</span>
          </div>

          {/* Filtro Estado Editorial */}
          <div className="cg-select-wrapper">
            <select
              className="cg-select"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Estado: Todos</option>
              <option value="aprobado">Aprobado</option>
              <option value="pendiente_aprobacion">Pendiente de Aprobación</option>
              <option value="rechazado">Rechazado</option>
              <option value="borrador">Borrador</option>
            </select>
            <span className="material-symbols-outlined cg-select-chevron">expand_more</span>
          </div>

          {/* Botón Limpiar Filtros */}
          <button
            type="button"
            className="cg-btn-reset"
            onClick={handleResetFilters}
            title="Restablecer todos los filtros"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              restart_alt
            </span>
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal de la Tabla de Control Editorial */}
      <div className="cg-table-card">
        <div className="cg-table-responsive">
          <table className="cg-table">
            <thead>
              <tr>
                <th style={{ width: "320px" }}>Vista Previa y Recurso</th>
                <th style={{ width: "220px" }}>Página y Ubicación</th>
                <th style={{ width: "110px", textAlign: "center" }}>Orden</th>
                <th style={{ width: "200px" }}>Enlace Asociado</th>
                <th style={{ width: "220px" }}>Estado Editorial</th>
                <th style={{ width: "120px", textAlign: "center" }}>Disponibilidad</th>
                <th style={{ width: "150px", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentRecursos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--cg-outline)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "36px", opacity: 0.5 }}>
                        search_off
                      </span>
                      <p style={{ margin: 0, fontWeight: 500 }}>
                        No se encontraron contenidos gráficos con los criterios seleccionados.
                      </p>
                      <button
                        type="button"
                        className="cg-btn-secondary"
                        style={{ marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}
                        onClick={handleResetFilters}
                      >
                        Restablecer filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRecursos.map((item, index) => {
                  const isRejected = item.estado === "RECHAZADO";
                  const isApproved = item.estado === "APROBADO" || item.estado === "PUBLICADO";
                  const isPending = item.estado === "PENDIENTE_APROBACION";
                  const isDraft = item.estado === "BORRADOR";

                  return (
                    <tr
                      key={item.id}
                      className={isRejected ? "row-rejected" : ""}
                    >
                      {/* Columna 1: Vista Previa y Recurso */}
                      <td style={{ verticalAlign: isRejected ? "top" : "middle" }}>
                        <div className="cg-preview-wrapper">
                          <div className="cg-thumbnail-box">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.altText || item.titulo}
                                className="cg-thumbnail-img"
                              />
                            ) : (
                              <span className="material-symbols-outlined" style={{ color: "var(--cg-outline)", fontSize: "28px" }}>
                                broken_image
                              </span>
                            )}
                            <span className="cg-ratio-badge">16:9</span>
                          </div>

                          <div className="cg-resource-info">
                            <span className={`cg-resource-title ${isRejected || isDraft ? "text-normal" : ""}`} title={item.titulo}>
                              {item.titulo}
                            </span>
                            <span className="cg-resource-subtitle" title={item.descripcion}>
                              {item.descripcion || "Sin descripción adicional"}
                            </span>

                            {/* Badge ALT */}
                            {item.altText && item.altText.trim() ? (
                              <span
                                className="cg-alt-badge success"
                                title={`Texto alternativo accesible: "${item.altText}"`}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                                  check_circle
                                </span>
                                <span>ALT ✓</span>
                              </span>
                            ) : (
                              <span className="cg-alt-badge pending" title="Falta cargar el texto alternativo accesible">
                                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                                  pending
                                </span>
                                <span>Pendiente ALT</span>
                              </span>
                            )}

                            {/* Mensaje Inline de Rechazo Mandatorio (RF-CMS-035 Destacada) */}
                            {isRejected && item.rejectionReason && (
                              <div className="cg-inline-rejection">
                                <span className="material-symbols-outlined cg-inline-rejection-icon">
                                  report_problem
                                </span>
                                <p className="cg-inline-rejection-text">
                                  <strong>Motivo de rechazo:</strong> {item.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna 2: Página y Ubicación */}
                      <td style={{ verticalAlign: isRejected ? "top" : "middle", paddingTop: isRejected ? "1.25rem" : undefined }}>
                        <div className="cg-location-tags">
                          <span className="cg-tag-page">Página: {item.page}</span>
                          <span
                            className={`cg-tag-location ${
                              item.ubicacion?.toLowerCase().includes("cabecera")
                                ? "primary-fixed"
                                : item.ubicacion?.toLowerCase().includes("media")
                                ? "secondary-fixed"
                                : "neutral"
                            }`}
                          >
                            Ubicación: {item.ubicacion}
                          </span>
                        </div>
                      </td>

                      {/* Columna 3: Orden */}
                      <td
                        style={{
                          verticalAlign: isRejected ? "top" : "middle",
                          paddingTop: isRejected ? "1.25rem" : undefined,
                          textAlign: "center",
                        }}
                      >
                        <div className="cg-order-box">
                          <span className="cg-order-number">{item.orden}°</span>
                          <div className="cg-order-arrows">
                            <button
                              type="button"
                              className="cg-order-btn"
                              title="Subir posición"
                              aria-label="Subir orden"
                              disabled={item.orden <= 1}
                              onClick={() => handleMoveOrder(item, "up")}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                expand_less
                              </span>
                            </button>
                            <button
                              type="button"
                              className="cg-order-btn"
                              title="Bajar posición"
                              aria-label="Bajar orden"
                              disabled={item.orden >= recursos.length}
                              onClick={() => handleMoveOrder(item, "down")}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                expand_more
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Columna 4: Enlace Asociado */}
                      <td style={{ verticalAlign: isRejected ? "top" : "middle", paddingTop: isRejected ? "1.25rem" : undefined }}>
                        {item.enlaceUrl ? (
                          <a
                            href={item.enlaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cg-link-cell"
                            title={item.enlaceUrl}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--cg-outline)" }}>
                              link
                            </span>
                            <span>{item.enlaceUrl}</span>
                          </a>
                        ) : (
                          <span className="cg-link-cell disabled">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              link_off
                            </span>
                            <span>Sin definir</span>
                          </span>
                        )}
                      </td>

                      {/* Columna 5: Estado Editorial */}
                      <td style={{ verticalAlign: isRejected ? "top" : "middle", paddingTop: isRejected ? "1.25rem" : undefined }}>
                        <div className="cg-status-stack">
                          {isApproved && (
                            <span className="cg-status-pill aprobado">
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                check_circle
                              </span>
                              <span>Aprobado</span>
                            </span>
                          )}

                          {isPending && (
                            <span className="cg-status-pill pendiente">
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                schedule
                              </span>
                              <span>Pendiente de Aprobación</span>
                            </span>
                          )}

                          {isDraft && (
                            <span className="cg-status-pill borrador">
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--cg-outline)",
                                  display: "inline-block",
                                }}
                              ></span>
                              <span>Borrador</span>
                            </span>
                          )}

                          {isRejected && (
                            <>
                              <span className="cg-status-pill rechazado">
                                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                                  cancel
                                </span>
                                <span>Rechazado</span>
                              </span>

                              {/* Botón de Acción Directa Solicitado en Stitch */}
                              <button
                                type="button"
                                className="cg-btn-fix-rejection"
                                onClick={() => handleOpenCorrection(item)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                                  build
                                </span>
                                <span>Ver motivo y corregir</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Columna 6: Disponibilidad */}
                      <td
                        style={{
                          verticalAlign: isRejected ? "top" : "middle",
                          paddingTop: isRejected ? "1.25rem" : undefined,
                          textAlign: "center",
                        }}
                      >
                        <label
                          className={`cg-switch-label ${isRejected || isDraft ? "disabled" : ""}`}
                          title={
                            isRejected
                              ? "Recurso observado: No puede activarse hasta ser corregido y aprobado."
                              : isDraft
                              ? "Borrador: Debe enviarse a aprobación antes de activarse."
                              : item.activo
                              ? "Visible en portal público"
                              : "Inactivo en portal público"
                          }
                        >
                          <input
                            type="checkbox"
                            className="cg-switch-input"
                            checked={item.activo}
                            disabled={isRejected || isDraft}
                            onChange={() => handleToggleActivo(item)}
                          />
                          <div className="cg-switch-slider"></div>
                          <span className={`cg-switch-text ${item.activo ? "active" : "inactive"}`}>
                            {item.activo ? "Activo" : "Inactivo"}
                          </span>
                        </label>
                      </td>

                      {/* Columna 7: Acciones */}
                      <td
                        style={{
                          verticalAlign: isRejected ? "top" : "middle",
                          paddingTop: isRejected ? "1.25rem" : undefined,
                          textAlign: "right",
                        }}
                      >
                        <div className="cg-actions-row">
                          {/* Previsualizar */}
                          <button
                            type="button"
                            className="cg-action-icon-btn"
                            title="Previsualizar recurso"
                            onClick={() => handleOpenPreview(item)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                              visibility
                            </span>
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            className="cg-action-icon-btn"
                            title={isRejected ? "Editar y corregir" : "Editar contenido"}
                            onClick={() => {
                              if (item.estado === "RECHAZADO") {
                                handleOpenCorrection(item);
                              } else {
                                handleOpenEdit(item);
                              }
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: "18px",
                                color: isRejected ? "var(--cg-primary)" : undefined,
                              }}
                            >
                              edit
                            </span>
                          </button>

                          {/* Acción contextual según estado */}
                          {isPending && (
                            <button
                              type="button"
                              className="cg-action-icon-btn btn-approve"
                              title="Revisar y aprobar / rechazar"
                              onClick={() => handleOpenReview(item)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                done_all
                              </span>
                            </button>
                          )}

                          {isDraft && (
                            <button
                              type="button"
                              className="cg-action-icon-btn"
                              title="Enviar a aprobación"
                              onClick={() => handleSendToApproval(item)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--cg-primary)" }}>
                                publish
                              </span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              className="cg-action-icon-btn"
                              title="Reenviar a revisión"
                              onClick={() => handleSendToApproval(item)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                send
                              </span>
                            </button>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className="cg-action-icon-btn"
                              title="Historial editorial"
                              onClick={() => toast("Historial: recurso auditado y publicado con trazabilidad sanitaria.")}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                history
                              </span>
                            </button>
                          )}

                          {/* Eliminar */}
                          <button
                            type="button"
                            className="cg-action-icon-btn btn-delete"
                            title="Eliminar recurso"
                            onClick={() => handleOpenDelete(item)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                              delete_outline
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación y Resumen Inferior */}
        <div className="cg-pagination-bar">
          <div className="cg-pagination-info">
            <span>
              Mostrando <strong>{recursosFiltrados.length === 0 ? 0 : startIndex + 1}-{endIndex}</strong> de{" "}
              <strong>{recursosFiltrados.length}</strong> contenidos gráficos
            </span>
            <div className="cg-pagination-divider"></div>
            <span className="cg-pagination-rate">
              Tasa de aprobación editorial: <strong>{stats.tasaAprobacion}%</strong>
            </span>
          </div>

          <div className="cg-pagination-controls">
            <button
              type="button"
              className="cg-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                chevron_left
              </span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              if (
                totalPages > 6 &&
                num !== 1 &&
                num !== totalPages &&
                Math.abs(num - currentPage) > 1
              ) {
                if (num === 2 || num === totalPages - 1) {
                  return (
                    <span key={num} className="cg-page-ellipsis">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={num}
                  type="button"
                  className={`cg-page-btn ${currentPage === num ? "active" : ""}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              className="cg-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Panel Resumen de Lineamientos Sanitarios y Accesibilidad (WCAG 2.2 AA) */}
      <div className="cg-guidelines-grid">
        <div className="cg-guideline-card">
          <span className="material-symbols-outlined cg-guideline-icon primary">
            verified_user
          </span>
          <div className="cg-guideline-content">
            <span className="cg-guideline-title">Trazabilidad Sanitaria y Legal</span>
            <p className="cg-guideline-desc">
              Cada recurso visual publicado en el portal público cuenta con registro de aprobación médica y comunicación comunitaria auditada.
            </p>
          </div>
        </div>

        <div className="cg-guideline-card">
          <span className="material-symbols-outlined cg-guideline-icon tertiary">
            accessibility_new
          </span>
          <div className="cg-guideline-content">
            <span className="cg-guideline-title">Estándar de Accesibilidad WCAG 2.2</span>
            <p className="cg-guideline-desc">
              Obligatoriedad de texto alternativo conciso y contraste mínimo 4.5:1 en tipografías integradas sobre imágenes médicas.
            </p>
          </div>
        </div>

        <div className="cg-guideline-card">
          <span className="material-symbols-outlined cg-guideline-icon secondary">
            aspect_ratio
          </span>
          <div className="cg-guideline-content">
            <span className="cg-guideline-title">Formato y Optimización</span>
            <p className="cg-guideline-desc">
              Resolución estándar 1920x1080 (16:9) en WebP/JPG progresivo comprimido a &lt; 450 KB para garantizar carga inmediata en redes periféricas.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          MODALES
          ========================================================================== */}

      {/* MODAL 1: Crear / Editar Contenido Gráfico */}
      {showCreateEditModal && (
        <div className="cg-modal-overlay" onClick={() => setShowCreateEditModal(false)}>
          <div className="cg-modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <div className={`cg-modal-header-icon ${isFixingRejection ? "error" : ""}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    {isFixingRejection ? "build" : isEditing ? "edit" : "add_photo_alternate"}
                  </span>
                </div>
                <div>
                  <h2 className="cg-modal-title">
                    {isFixingRejection
                      ? "Corregir Contenido Observado"
                      : isEditing
                      ? "Editar Recurso Gráfico"
                      : "Nuevo Contenido Gráfico"}
                  </h2>
                  <p className="cg-modal-subtitle">
                    {isFixingRejection
                      ? "Subsanación de requerimientos de diseño y accesibilidad sanitaria"
                      : "Complete los datos del recurso según el estándar editorial del Hospital Evita"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowCreateEditModal(false)}
                aria-label="Cerrar modal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="cg-modal-body">
                {/* Banner de Observación si viene de Rechazado */}
                {isFixingRejection && selectedRecurso?.rejectionReason && (
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      backgroundColor: "var(--cg-error-container)",
                      borderLeft: "4px solid var(--cg-error)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: "var(--cg-error)", fontSize: "20px", marginTop: "2px" }}>
                      report_problem
                    </span>
                    <div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--cg-on-error-container)" }}>
                        Observación a corregir (RF-CMS-035):
                      </span>
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.78125rem", color: "var(--cg-on-error-container)", lineHeight: 1.4 }}>
                        {selectedRecurso.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Título */}
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Título del Recurso <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="cg-form-input"
                    placeholder="Ej. Campaña Prevención Dengue 2026"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

                {/* Copete / Descripción */}
                <div className="cg-form-group">
                  <label className="cg-form-label">Descripción o Copete Informativo</label>
                  <textarea
                    className="cg-form-textarea"
                    placeholder="Resumen del contenido que acompaña al banner en el portal público..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                {/* Subida de Imagen 16:9 */}
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Recurso Visual (Proporción 16:9) <span className="required">*</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleImageFileChange}
                  />

                  {imagePreview ? (
                    <div className="cg-image-preview-box">
                      <img src={imagePreview} alt="Vista previa del recurso" />
                      <span className="cg-image-preview-badge">16:9 • 1920x1080</span>
                      <button
                        type="button"
                        className="cg-image-preview-remove"
                        title="Cambiar imagen"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="cg-dropzone" onClick={() => fileInputRef.current?.click()}>
                      <div className="cg-dropzone-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                          cloud_upload
                        </span>
                      </div>
                      <span className="cg-dropzone-text">Haga clic o arrastre una imagen aquí</span>
                      <span className="cg-dropzone-sub">
                        Formatos soportados: WEBP, JPG o PNG progresivo. Resolución ideal 1920x1080 (16:9). Peso &lt; 450 KB.
                      </span>
                    </div>
                  )}
                </div>

                {/* Texto Alternativo Accesible (WCAG 2.2 AA) */}
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Texto Alternativo Accesible (ALT) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="cg-form-input"
                    placeholder="Describa la imagen para personas con discapacidad visual y lectores de pantalla..."
                    value={formData.altText}
                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  />
                  <span className="cg-form-hint">
                    Obligatorio para la aprobación institucional. No incluya frases como "imagen de" o "foto de".
                  </span>
                </div>

                {/* Fila de Página y Ubicación */}
                <div className="cg-form-row">
                  <div className="cg-form-group">
                    <label className="cg-form-label">Página de Destino</label>
                    <select
                      className="cg-form-select"
                      value={formData.page}
                      onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                    >
                      <option value="Inicio">Inicio (Home)</option>
                      <option value="Especialidades">Especialidades y Servicios</option>
                      <option value="Capacitación">Capacitación y Residencias</option>
                      <option value="Institucional">Información Institucional</option>
                    </select>
                  </div>

                  <div className="cg-form-group">
                    <label className="cg-form-label">Ubicación en Pantalla</label>
                    <select
                      className="cg-form-select"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    >
                      <option value="Cabecera Principal">Cabecera Principal</option>
                      <option value="Sección Media">Sección Media Informativa</option>
                      <option value="Columna Lateral">Columna Lateral Destacada</option>
                      <option value="Pie">Pie Institucional</option>
                    </select>
                  </div>
                </div>

                {/* Enlace y Orden */}
                <div className="cg-form-row">
                  <div className="cg-form-group">
                    <label className="cg-form-label">Enlace o Destino Asociado (URL)</label>
                    <input
                      type="text"
                      className="cg-form-input"
                      placeholder="Ej. /campanas/dengue-2026"
                      value={formData.enlaceUrl}
                      onChange={(e) => setFormData({ ...formData, enlaceUrl: e.target.value })}
                    />
                  </div>

                  <div className="cg-form-group">
                    <label className="cg-form-label">Orden de Visualización</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="cg-form-input"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>

                {/* Estado y Disponibilidad Inicial */}
                <div className="cg-form-row">
                  <div className="cg-form-group">
                    <label className="cg-form-label">Estado Inicial</label>
                    <select
                      className="cg-form-select"
                      value={formData.estado}
                      disabled={isFixingRejection}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="BORRADOR">Borrador (en preparación)</option>
                      <option value="PENDIENTE_APROBACION">Pendiente de Aprobación</option>
                      <option value="APROBADO">Aprobado / Listo para publicar</option>
                    </select>
                  </div>

                  <div className="cg-form-group" style={{ justifyContent: "center" }}>
                    <label className="cg-form-label" style={{ marginBottom: "0.5rem" }}>
                      Disponibilidad Inmediata
                    </label>
                    <label className="cg-switch-label">
                      <input
                        type="checkbox"
                        className="cg-switch-input"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <div className="cg-switch-slider"></div>
                      <span className={`cg-switch-text ${formData.activo ? "active" : "inactive"}`}>
                        {formData.activo ? "Activo al guardar" : "Inactivo"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cg-modal-footer">
                <button
                  type="button"
                  className="cg-btn-secondary"
                  onClick={() => setShowCreateEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="cg-btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    save
                  </span>
                  <span>
                    {isFixingRejection
                      ? "Guardar y Reenviar a Revisión"
                      : isEditing
                      ? "Guardar Cambios"
                      : "Crear Contenido Gráfico"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Corregir Contenido Gráfico Rechazado (Stitch Specification) */}
      {showCorrectionModal && selectedRecurso && (
        <div
          className="cg-modal-overlay"
          onClick={() => setShowCorrectionModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-correction-headline"
        >
          <div
            className="cg-modal-correction-container"
            onClick={(e) => e.stopPropagation()}
            data-purpose="modal-container"
          >
            {/* Modal Header */}
            <header className="cg-correction-header">
              <div className="cg-correction-header-content">
                <div className="cg-correction-title-row">
                  <h2 className="cg-correction-title" id="modal-correction-headline">
                    Corregir Contenido Gráfico Rechazado
                  </h2>
                  <span className="cg-correction-pill">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ width: "14px", height: "14px", color: "#dc2626" }}
                    >
                      <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      />
                    </svg>
                    <span>Estado: Rechazado</span>
                  </span>
                </div>
                <p className="cg-correction-meta">
                  ID Recurso:{" "}
                  <strong>
                    {selectedRecurso.id?.startsWith("cg-")
                      ? `#CG-0${selectedRecurso.id.replace("cg-", "")}`
                      : `#CG-${selectedRecurso.id || "0142"}`}
                  </strong>{" "}
                  • Expediente Editorial N° {correctionData.expediente || "3418/25"}
                </p>
              </div>

              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowCorrectionModal(false)}
                aria-label="Cerrar modal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  close
                </span>
              </button>
            </header>

            {/* Scrollable Modal Body */}
            <main className="cg-correction-body cg-custom-scroll">
              {/* Alert Box (Rejection Details) */}
              <div className="cg-correction-alert" role="alert">
                <div className="cg-correction-alert-header">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ width: "16px", height: "16px", color: "#dc2626" }}
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    />
                  </svg>
                  <span>Motivo del rechazo (Revisión Editorial):</span>
                </div>
                <p className="cg-correction-alert-text">
                  {correctionData.rejectionReason ||
                    selectedRecurso.rejectionReason ||
                    "La imagen adjunta no cuenta con resolución adecuada para la cabecera y el texto alternativo es insuficiente para accesibilidad WCAG. Por favor, actualizar el recurso y detallar el atributo ALT antes de reenviar."}
                </p>
              </div>

              {/* Section 1 - Multimedia y Accesibilidad */}
              <section className="cg-correction-section" data-purpose="section-multimedia-accessibility">
                <h3 className="cg-section-subtitle">
                  1. Archivo Multimedia y Accesibilidad
                </h3>

                {/* Image Preview & Replacement Box */}
                <div className="cg-image-replace-box">
                  {/* Thumbnail 16:9 */}
                  <div className="cg-replace-thumb-container">
                    <img
                      alt={correctionData.altText || selectedRecurso.titulo || "Recurso gráfico"}
                      className="cg-replace-thumb-img"
                      src={correctionData.imageUrl || selectedRecurso.imageUrl || defaultImg1}
                    />
                    <div className="cg-replace-ratio-tag">16:9</div>
                  </div>

                  {/* Details & Replace Actions */}
                  <div className="cg-replace-info-col">
                    <div className="cg-replace-info-top">
                      <div>
                        <h4 className="cg-replace-filename">
                          {correctionData.fileName || "previa_campana_vacunacion.jpg"}
                        </h4>
                        <p className="cg-replace-filesize">
                          {correctionData.fileMeta || "1.8 MB • 1920×1080 px • WEBP/JPG progresivo"}
                        </p>
                      </div>

                      {/* Hidden input for replacing file */}
                      <input
                        type="file"
                        ref={correctionFileInputRef}
                        onChange={handleCorrectionFileChange}
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                      />

                      <button
                        type="button"
                        className="cg-btn-replace-file"
                        onClick={() => correctionFileInputRef.current?.click()}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ width: "14px", height: "14px", color: "#475569" }}
                        >
                          <path
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                        <span>Reemplazar archivo</span>
                      </button>
                    </div>

                    <p className="cg-replace-guideline-note">
                      Formatos admitidos: JPG, PNG, WEBP. Peso máximo: 5MB. Proporción obligatoria para Cabecera Principal: 16:9 horizontal.
                    </p>
                  </div>
                </div>

                {/* WCAG Alt Text Input Container */}
                <div className="cg-form-group" style={{ margin: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.375rem",
                    }}
                  >
                    <label
                      className="cg-label"
                      htmlFor="campo-texto-alternativo"
                      style={{ display: "flex", alignItems: "center", gap: "0.375rem", margin: 0 }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        style={{ width: "16px", height: "16px", color: "#0369a1" }}
                      >
                        <path d="M10 2a2 2 0 100 4 2 2 0 000-4zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm3 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
                      </svg>
                      <span>Texto Alternativo (Accesibilidad WCAG 2.1 AA)</span>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <span className="cg-wcag-badge-tag">Obligatorio WCAG</span>
                  </div>

                  <textarea
                    id="campo-texto-alternativo"
                    className="cg-textarea"
                    rows="3"
                    placeholder="Describa la imagen para lectores de pantalla..."
                    value={correctionData.altText}
                    onChange={(e) =>
                      setCorrectionData((prev) => ({ ...prev, altText: e.target.value }))
                    }
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                    Describa la imagen de manera concisa para personas con disminución visual o conexiones lentas. No incluya frases como "foto de" o "imagen de".
                  </p>
                </div>
              </section>

              {/* Section 2 - Datos Principales y Enlace */}
              <section className="cg-correction-section bordered" data-purpose="section-content-metadata">
                <h3 className="cg-section-subtitle">
                  2. Datos Principales y Enlace
                </h3>

                {/* Graphic Title */}
                <div className="cg-form-group" style={{ margin: 0 }}>
                  <label className="cg-label" htmlFor="titulo-contenido">
                    Título del Contenido Gráfico{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    id="titulo-contenido"
                    type="text"
                    className="cg-input"
                    value={correctionData.titulo}
                    onChange={(e) =>
                      setCorrectionData((prev) => ({ ...prev, titulo: e.target.value }))
                    }
                    placeholder="Título del recurso gráfico"
                  />
                </div>

                {/* Institutional Description */}
                <div className="cg-form-group" style={{ margin: 0 }}>
                  <label className="cg-label" htmlFor="descripcion-interna">
                    Descripción Institucional
                  </label>
                  <textarea
                    id="descripcion-interna"
                    className="cg-textarea"
                    rows="2"
                    value={correctionData.descripcion}
                    onChange={(e) =>
                      setCorrectionData((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    placeholder="Resumen del contenido y contexto institucional..."
                  />
                </div>

                {/* Associated Link (URL) */}
                <div className="cg-form-group" style={{ margin: 0 }}>
                  <label className="cg-label" htmlFor="enlace-asociado">
                    Enlace Asociado (URL de destino opcional)
                  </label>
                  <div className="cg-link-input-wrapper">
                    <div className="cg-link-prefix-icon">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ width: "16px", height: "16px" }}
                      >
                        <path
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <input
                      id="enlace-asociado"
                      type="text"
                      className="cg-input cg-input-with-icon"
                      value={correctionData.enlaceUrl}
                      onChange={(e) =>
                        setCorrectionData((prev) => ({ ...prev, enlaceUrl: e.target.value }))
                      }
                      placeholder="https://hospitalevita.formosa.gob.ar/campanas/..."
                    />
                  </div>
                </div>
              </section>

              {/* Section 3 - Asignación y Publicación */}
              <section className="cg-correction-section bordered" data-purpose="section-placement-availability">
                <h3 className="cg-section-subtitle">
                  3. Asignación y Publicación
                </h3>

                <div className="cg-grid-two-cols">
                  {/* Dropdown: Portal Page */}
                  <div className="cg-form-group" style={{ margin: 0 }}>
                    <label className="cg-label" htmlFor="select-pagina-portal">
                      Página del Portal Público{" "}
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      id="select-pagina-portal"
                      className="cg-select"
                      value={correctionData.page}
                      onChange={(e) =>
                        setCorrectionData((prev) => ({ ...prev, page: e.target.value }))
                      }
                    >
                      <option value="Página de Inicio">Página de Inicio</option>
                      <option value="Especialidades y Servicios">Especialidades y Servicios</option>
                      <option value="Capacitación y Docencia">Capacitación y Docencia</option>
                      <option value="Institucional / Autoridades">Institucional / Autoridades</option>
                    </select>
                  </div>

                  {/* Dropdown: Section Location */}
                  <div className="cg-form-group" style={{ margin: 0 }}>
                    <label className="cg-label" htmlFor="select-ubicacion-seccion">
                      Ubicación en la Página{" "}
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      id="select-ubicacion-seccion"
                      className="cg-select"
                      value={correctionData.ubicacion}
                      onChange={(e) =>
                        setCorrectionData((prev) => ({ ...prev, ubicacion: e.target.value }))
                      }
                    >
                      <option value="Cabecera Principal">Cabecera Principal</option>
                      <option value="Sección Media Transversal">Sección Media Transversal</option>
                      <option value="Columna Lateral Institucional">Columna Lateral Institucional</option>
                      <option value="Pie / Accesos Rápidos">Pie / Accesos Rápidos</option>
                    </select>
                  </div>

                  {/* Number Input: Order Priority */}
                  <div className="cg-form-group" style={{ margin: 0 }}>
                    <label className="cg-label" htmlFor="input-orden-visualizacion">
                      Orden de Visualización{" "}
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        id="input-orden-visualizacion"
                        type="number"
                        min="1"
                        max="99"
                        className="cg-input"
                        style={{ width: "96px" }}
                        value={correctionData.orden}
                        onChange={(e) =>
                          setCorrectionData((prev) => ({ ...prev, orden: e.target.value }))
                        }
                      />
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Prioridad relativa en cabecera
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch: Availability */}
                  <div className="cg-form-group" style={{ margin: 0 }}>
                    <label className="cg-label">Disponibilidad en el Portal</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        paddingTop: "0.25rem",
                      }}
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={correctionData.activo}
                        className={`cg-correction-switch-btn ${correctionData.activo ? "active" : ""}`}
                        onClick={() =>
                          setCorrectionData((prev) => ({ ...prev, activo: !prev.activo }))
                        }
                      >
                        <span className="cg-correction-switch-knob" />
                      </button>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                        {correctionData.activo
                          ? "Activo (Visible al publicarse)"
                          : "Inactivo (Oculto en el portal)"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            {/* Modal Footer */}
            <footer className="cg-correction-footer">
              <button
                type="button"
                className="cg-btn-cancel-flat"
                onClick={() => setShowCorrectionModal(false)}
              >
                Cancelar y cerrar
              </button>

              <div className="cg-correction-footer-actions">
                <button
                  type="button"
                  className="cg-btn-save-draft"
                  onClick={handleSaveCorrectionAsDraft}
                >
                  Guardar Cambios como Borrador
                </button>
                <button
                  type="button"
                  className="cg-btn-resubmit-approval"
                  onClick={handleResubmitCorrectionForApproval}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ width: "16px", height: "16px", color: "#bfdbfe" }}
                  >
                    <path
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Guardar y Reenviar para Aprobación</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL 3: Vista Previa Completa del Recurso */}
      {showPreviewModal && selectedRecurso && (
        <div className="cg-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="cg-modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <div className="cg-modal-header-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    visibility
                  </span>
                </div>
                <div>
                  <h2 className="cg-modal-title">Vista Previa del Contenido Gráfico</h2>
                  <p className="cg-modal-subtitle">
                    Simulación de visualización en el Portal Institucional Hospital Evita
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowPreviewModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="cg-modal-body">
              {/* Visor 16:9 Principal */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#0b1c30",
                  position: "relative",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
                }}
              >
                {selectedRecurso.imageUrl ? (
                  <img
                    src={selectedRecurso.imageUrl}
                    alt={selectedRecurso.altText || selectedRecurso.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "48px", opacity: 0.5 }}>
                      broken_image
                    </span>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "1.5rem",
                    background: "linear-gradient(to top, rgba(11,28,48,0.92) 0%, rgba(11,28,48,0.4) 70%, transparent 100%)",
                    color: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: "var(--cg-primary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      display: "inline-block",
                    }}
                  >
                    {selectedRecurso.page} • {selectedRecurso.ubicacion}
                  </span>
                  <h3 style={{ margin: "0.25rem 0", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {selectedRecurso.titulo}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9 }}>
                    {selectedRecurso.descripcion}
                  </p>
                </div>
              </div>

              {/* Ficha Técnica y Metadatos Sanitarios */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.85rem",
                  marginTop: "0.5rem",
                }}
              >
                <div style={{ padding: "0.75rem", backgroundColor: "var(--cg-surface-low)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.71875rem", color: "var(--cg-outline)", textTransform: "uppercase" }}>
                    Texto Alternativo (ALT)
                  </span>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", fontWeight: 500, color: "var(--cg-on-surface)" }}>
                    {selectedRecurso.altText || "Sin texto alternativo definido"}
                  </p>
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--cg-surface-low)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.71875rem", color: "var(--cg-outline)", textTransform: "uppercase" }}>
                    Enlace de Destino
                  </span>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--cg-primary)", fontFamily: "monospace" }}>
                    {selectedRecurso.enlaceUrl || "Sin enlace configurado"}
                  </p>
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--cg-surface-low)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.71875rem", color: "var(--cg-outline)", textTransform: "uppercase" }}>
                    Estado y Disponibilidad
                  </span>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--cg-on-surface)" }}>
                    {selectedRecurso.estado} • {selectedRecurso.activo ? "Activo (En línea)" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cg-btn-primary"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleOpenEdit(selectedRecurso);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  edit
                </span>
                <span>Editar Recurso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Revisión Editorial (Aprobación / Rechazo con Motivo Obligatorio) */}
      {showReviewModal && selectedRecurso && (
        <div className="cg-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="cg-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <div className="cg-modal-header-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    fact_check
                  </span>
                </div>
                <div>
                  <h2 className="cg-modal-title">Dictamen Editorial</h2>
                  <p className="cg-modal-subtitle">
                    Aprobación médica o rechazo con observación requerida (RF-CMS-035)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="cg-modal-body">
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                <div className="cg-thumbnail-box" style={{ width: "90px", height: "52px" }}>
                  {selectedRecurso.imageUrl ? (
                    <img src={selectedRecurso.imageUrl} alt={selectedRecurso.titulo} className="cg-thumbnail-img" />
                  ) : (
                    <span className="material-symbols-outlined">broken_image</span>
                  )}
                  <span className="cg-ratio-badge">16:9</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--cg-on-surface)" }}>
                    {selectedRecurso.titulo}
                  </span>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78125rem", color: "var(--cg-on-surface-variant)" }}>
                    {selectedRecurso.page} • {selectedRecurso.ubicacion}
                  </p>
                </div>
              </div>

              <div className="cg-form-group">
                <label className="cg-form-label">Seleccione la Resolución Editorial:</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  <label
                    style={{
                      flex: 1,
                      padding: "0.85rem",
                      borderRadius: "10px",
                      border: `2px solid ${reviewAction === "approve" ? "var(--cg-tertiary)" : "var(--cg-outline-variant)"}`,
                      backgroundColor: reviewAction === "approve" ? "rgba(0, 135, 58, 0.08)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="reviewAction"
                      checked={reviewAction === "approve"}
                      onChange={() => setReviewAction("approve")}
                    />
                    <div>
                      <strong style={{ display: "block", fontSize: "0.8125rem", color: "var(--cg-tertiary)" }}>
                        Aprobar y Publicar
                      </strong>
                      <span style={{ fontSize: "0.71875rem", color: "var(--cg-outline)" }}>
                        Cumple estándares sanitarios y WCAG 2.2
                      </span>
                    </div>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      padding: "0.85rem",
                      borderRadius: "10px",
                      border: `2px solid ${reviewAction === "reject" ? "var(--cg-error)" : "var(--cg-outline-variant)"}`,
                      backgroundColor: reviewAction === "reject" ? "rgba(186, 26, 26, 0.08)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="reviewAction"
                      checked={reviewAction === "reject"}
                      onChange={() => setReviewAction("reject")}
                    />
                    <div>
                      <strong style={{ display: "block", fontSize: "0.8125rem", color: "var(--cg-error)" }}>
                        Rechazar con Observaciones
                      </strong>
                      <span style={{ fontSize: "0.71875rem", color: "var(--cg-outline)" }}>
                        Requiere ajustes obligatorios
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {reviewAction === "reject" && (
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Motivo Obligatorio de Rechazo (RF-CMS-035) <span className="required">*</span>
                  </label>
                  <textarea
                    className="cg-form-textarea"
                    placeholder="Detalle de forma precisa qué debe corregir el redactor (ej. Falta incorporar isologo institucional y ajustar contraste)..."
                    value={reviewRejectionText}
                    onChange={(e) => setReviewRejectionText(e.target.value)}
                    required
                  />
                  <span className="cg-form-hint">
                    Este texto se mostrará directamente en el panel del redactor con la etiqueta de requerimiento de corrección.
                  </span>
                </div>
              )}
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowReviewModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={reviewAction === "reject" ? "cg-btn-danger" : "cg-btn-primary"}
                onClick={handleProcessReview}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {reviewAction === "reject" ? "cancel" : "check_circle"}
                </span>
                <span>{reviewAction === "reject" ? "Confirmar Rechazo" : "Aprobar Recurso"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirmar Eliminación */}
      {showDeleteModal && selectedRecurso && (
        <div className="cg-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="cg-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header" style={{ borderBottomColor: "var(--cg-error-container)" }}>
              <div className="cg-modal-header-left">
                <div className="cg-modal-header-icon error">
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                    delete_forever
                  </span>
                </div>
                <div>
                  <h2 className="cg-modal-title" style={{ color: "var(--cg-error)" }}>
                    Eliminar Contenido Gráfico
                  </h2>
                  <p className="cg-modal-subtitle">Esta acción quitará el recurso visual del sistema</p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="cg-modal-body">
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--cg-on-surface)", lineHeight: 1.5 }}>
                ¿Está seguro de que desea eliminar el recurso{" "}
                <strong>"{selectedRecurso.titulo}"</strong>?
              </p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.78125rem", color: "var(--cg-outline)" }}>
                Si el recurso se encontraba activo, dejará de verse en la página de {selectedRecurso.page} inmediatamente.
              </p>
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cg-btn-danger"
                onClick={handleConfirmDelete}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  delete
                </span>
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsContenidoGraficoView;
