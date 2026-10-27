import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import "../../styles/pages/cms/CmsContenidoGraficoView.css";
import {
  getContenidosGraficos,
  createContenidoGrafico,
  updateContenidoGrafico,
  deleteContenidoGrafico,
} from "../../api/contenidoGrafico.api.js";
import {
  CmsDeleteModal,
  CmsContenidoGraficoCorrectionModal,
} from "../../components/cms/CmsModals";

// Imágenes de respaldo locales
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";
import defaultImg2 from "../../assets/fondoHospitalCarrusel2.jpg";
import defaultImg3 from "../../assets/fondoHospitalCarrusel3.jpg";
import defaultImg4 from "../../assets/fondoHospitalCarrusel4.jpg";

// Lista inicial de recursos armonizada con los lineamientos estéticos del CMS y Portal HIE
const INITIAL_RECURSOS = [
  {
    id: "cg-1",
    titulo: "Campaña Prevención Dengue 2026",
    descripcion: "Recurso vectorial y flyer informativo para portal",
    altText: "Taller comunitario de prevención del dengue en aula hospitalaria con médico mostrando infografía y lavado de manos",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvu7PZE0_bCUNR4Hy2V7bSPnVUh_V4Ga8FGvyaML8GEUSKHqL09rrJ6w7BCIqrvxWSArG9UHQ1YuPyxn3fMN53UHuzwbbMckU1jzPdraqo3wNO1lZuof-8fGiNU__b2p8b1fuTFEarR823nOp_cwvQ602U4xVFB5bMwFBz3g1KDdLl_IRX2ni1Gj5QjmCva0Ri1hiUWMPj4VMT8PhIySf_Er3nZjnkceMBlmGERKHo__u6c_ZiGVxZfg",
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
    titulo: "Taller de Maternidad",
    descripcion: "Fotografía sesión informativa obstetricia",
    altText: "Educadora sanitaria dialogando con mujeres gestantes en sala de obstetricia con láminas anatómicas explicativas",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCN_DU_dFNhIWoCY9kOV_1tUwRNi7yCCPbsds6ppuyQiNfPh0Lb1LOF3gaRBwASVm-nPhVcDCcgGGEtai4SofyUH6vrwtfIKDA8ZiIz6yrW7yciVPHtkEfptefZthhC4j_QfDKTQlESJ4AIdc4S2mSLp3W3OEsWw-N63Wx1rNgkm0JKcu7U1ic9ebUAHXFA56b8KdjyLsd-Vj-C7jIOQ2LALX5Rs9NY1LUijMzXqYagMp1BtI7pweDHbw",
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
    titulo: "Nutrición y Cuidados Oncológicos",
    descripcion: "Taller grupal multidisciplinario de soporte clínico",
    altText: "Mesa redonda multidisciplinaria con nutricionistas y pacientes evaluando alimentos frescos y dietoterapia oncológica",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1VbTUazlMB30nH5PEPaFhgKuBNLO-D0u7Pwp7H0ukr5dUo-NEvPWslJB3S0R6gJ8GdWgc6urAnC21ilKT18-K6mrcH8eOrV1CfTo506wL9l1whiPsxApHbZtzNloG_D0Z0UmZQGfJXmcLJ12vDy3IlaqKnqcRH4oFwKeUVNvsGfIO1GRNYC3opKK_Gz9u9_7THYsxBKX-gKzBzS4Pf9pqjz7iF90XGpL1aRUY7CaqCrT_-gP1HXLJ_yv_u8",
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
    imageUrl: defaultImg2,
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
    altText: "Cartilla informativa de clasificación de riesgo triage en pediatría",
    imageUrl: defaultImg3,
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
    altText: "Farmacéutica hospitalaria realizando control de dosis unitaria",
    imageUrl: defaultImg3,
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
    imageUrl: defaultImg4,
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
    titulo: "Borrador de Guía de Atención en Salud Mental Comunitaria",
    descripcion: "Lineamientos de urgencias psiquiátricas y contención psicológica",
    altText: "Guía gráfica informativa de soporte psicosocial",
    imageUrl: defaultImg1,
    page: "Especialidades",
    ubicacion: "Pie",
    orden: 18,
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

  // Tabs de Estado: 'publicados' | 'borradores' | 'pendientes' | 'rechazados'
  const [viewTab, setViewTab] = useState("publicados");

  // Filtro de Página
  const [filtroPagina, setFiltroPagina] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Estado específico para el Modal de Corrección
  const [correctionData, setCorrectionData] = useState({
    id: "",
    expediente: "3418/25",
    rejectionReason: "",
    titulo: "",
    descripcion: "",
    altText: "",
    enlaceUrl: "",
    page: "Inicio",
    ubicacion: "Cabecera Principal",
    orden: 1,
    activo: false,
    imageUrl: "",
    fileName: "recurso_hospital_evita.jpg",
    fileMeta: "1.8 MB • 1920×1080 px • WEBP/JPG",
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

  // Carga inicial opcional desde Backend si está activo
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        setLoading(true);
        const data = await getContenidosGraficos();
        if (data && Array.isArray(data) && data.length > 0) {
          setRecursos(data);
        }
      } catch (err) {
        // Modo autónomo con datos locales
      } finally {
        setLoading(false);
      }
    };

    fetchFromBackend();
  }, []);

  // Filtrado de recursos conforme a la pestaña y filtro por página
  const recursosFiltrados = useMemo(() => {
    return recursos.filter((item) => {
      // 1. Filtro por pestaña de estado
      const est = (item.estado || "BORRADOR").toUpperCase();
      if (viewTab === "publicados") {
        if (est !== "APROBADO" && est !== "PUBLICADO") return false;
      } else if (viewTab === "borradores") {
        if (est !== "BORRADOR") return false;
      } else if (viewTab === "pendientes") {
        if (est !== "PENDIENTE_APROBACION" && est !== "PENDIENTE") return false;
      } else if (viewTab === "rechazados") {
        if (est !== "RECHAZADO") return false;
      }

      // 2. Filtro por página
      if (filtroPagina && filtroPagina !== "" && filtroPagina !== "Todas las páginas") {
        if (item.page?.toLowerCase() !== filtroPagina.toLowerCase()) return false;
      }

      return true;
    });
  }, [recursos, viewTab, filtroPagina]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(recursosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, recursosFiltrados.length);
  const currentRecursos = recursosFiltrados.slice(startIndex, endIndex);

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
      page: item.page || "Inicio",
      ubicacion: item.ubicacion || "Cabecera Principal",
      orden: item.orden || 1,
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
    setCorrectionData({
      id: item.id,
      expediente: `3418/25`,
      rejectionReason: item.rejectionReason || "Observaciones de diseño pendientes",
      titulo: item.titulo,
      descripcion: item.descripcion || "",
      altText: item.altText || "",
      enlaceUrl: item.enlaceUrl || "",
      page: item.page,
      ubicacion: item.ubicacion,
      orden: item.orden,
      activo: item.activo,
      imageUrl: item.imageUrl || "",
      fileName: item.fileName || "recurso_hospital_evita.jpg",
      fileMeta: "1.8 MB • 1920×1080 px • WEBP/JPG",
      fileObj: null,
    });
    setShowCorrectionModal(true);
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

  // Manejo de carga de imagen en Modal Crear / Editar
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

  // Guardar recurso (Crear / Actualizar)
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

  // Subsanación desde el Modal de Corrección
  const handleCorrectionFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setCorrectionData((prev) => ({
        ...prev,
        fileObj: file,
        fileName: file.name,
        fileMeta: `${(file.size / (1024 * 1024)).toFixed(1)} MB • Imagen reemplazada`,
        imageUrl: preview,
      }));
      toast.success("Archivo adjunto reemplazado.");
    }
  };

  const handleCorrectionSaveDraft = () => {
    if (!selectedRecurso) return;
    setRecursos((prev) =>
      prev.map((r) =>
        r.id === selectedRecurso.id
          ? {
              ...r,
              titulo: correctionData.titulo,
              descripcion: correctionData.descripcion,
              altText: correctionData.altText,
              enlaceUrl: correctionData.enlaceUrl,
              page: correctionData.page || r.page,
              ubicacion: correctionData.ubicacion || r.ubicacion,
              orden: parseInt(correctionData.orden) || r.orden,
              activo: correctionData.activo !== undefined ? correctionData.activo : r.activo,
              imageUrl: correctionData.imageUrl || r.imageUrl,
              estado: "BORRADOR",
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    toast.success("Borrador de subsanación guardado.");
    setShowCorrectionModal(false);
  };

  const handleCorrectionResubmit = () => {
    if (!selectedRecurso) return;
    if (!correctionData.altText || !correctionData.altText.trim()) {
      toast.error("El texto alternativo accesible es obligatorio para reenviar.");
      return;
    }
    setRecursos((prev) =>
      prev.map((r) =>
        r.id === selectedRecurso.id
          ? {
              ...r,
              titulo: correctionData.titulo,
              descripcion: correctionData.descripcion,
              altText: correctionData.altText,
              enlaceUrl: correctionData.enlaceUrl,
              page: correctionData.page || r.page,
              ubicacion: correctionData.ubicacion || r.ubicacion,
              orden: parseInt(correctionData.orden) || r.orden,
              activo: correctionData.activo !== undefined ? correctionData.activo : r.activo,
              imageUrl: correctionData.imageUrl || r.imageUrl,
              estado: "PENDIENTE_APROBACION",
              rejectionReason: null,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    toast.success("¡Recurso corregido con éxito! Se reenvió a revisión editorial.");
    setShowCorrectionModal(false);
  };

  // Procesar Revisión Editorial (Aprobar / Rechazar)
  const handleProcessReview = () => {
    if (!selectedRecurso) return;

    if (reviewAction === "reject") {
      if (!reviewRejectionText.trim()) {
        toast.error("Debe especificar obligatoriamente el motivo del rechazo.");
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
      toast.success(`Recurso "${selectedRecurso.titulo}" aprobado y habilitado.`);
    }

    setShowReviewModal(false);
  };

  // Eliminar Recurso
  const handleConfirmDelete = () => {
    if (!selectedRecurso) return;
    const nombreRecurso = selectedRecurso.titulo || selectedRecurso.nombreOriginal || "Recurso";
    recordCmsActivity({
      titulo: `Eliminó contenido gráfico: "${nombreRecurso}"`,
      categoria: "Contenido Gráfico",
      editor: keycloak?.tokenParsed?.name || "Editor CMS",
      estado: "ELIMINADO",
    });
    setRecursos((prev) => prev.filter((r) => r.id !== selectedRecurso.id));
    toast.success("Recurso eliminado correctamente.");
    setShowDeleteModal(false);
    setSelectedRecurso(null);
  };

  return (
    <div className="cms-dashboard-card cg-main-card">
      {/* Encabezado Interno idéntico a las otras vistas */}
      <div className="cg-inner-header">
        <div>
          <h2 className="cg-title">Listado de contenidos</h2>
          <p className="cg-subtitle">Administre los recursos visuales del portal.</p>
        </div>
        <button
          type="button"
          className="cg-btn-nuevo"
          id="btn-nuevo-contenido"
          onClick={handleOpenCreate}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add
          </span>
          <span>+ NUEVO CONTENIDO</span>
        </button>
      </div>

      {/* Fila de Controles: Tabs & Filtro */}
      <div className="cg-controls-row">
        {/* Toggle Tabs */}
        <div className="cg-tabs-container" id="tab-group">
          <button
            type="button"
            className={`filter-tab ${viewTab === "publicados" ? "active" : ""}`}
            onClick={() => {
              setViewTab("publicados");
              setCurrentPage(1);
            }}
            data-status="publicados"
          >
            Publicados
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "borradores" ? "active" : ""}`}
            onClick={() => {
              setViewTab("borradores");
              setCurrentPage(1);
            }}
            data-status="borradores"
          >
            Borradores
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "pendientes" ? "active" : ""}`}
            onClick={() => {
              setViewTab("pendientes");
              setCurrentPage(1);
            }}
            data-status="pendientes"
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "rechazados" ? "active" : ""}`}
            onClick={() => {
              setViewTab("rechazados");
              setCurrentPage(1);
            }}
            data-status="rechazados"
          >
            Rechazados
          </button>
        </div>

        {/* Filtro por Página */}
        <div className="cg-filter-dropdown-wrapper">
          <div className="cg-filter-dropdown-box">
            <span className="cg-filter-prefix">FILTRAR POR:</span>
            <select
              className="cg-filter-select"
              value={filtroPagina}
              onChange={(e) => {
                setFiltroPagina(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas las páginas</option>
              <option value="Inicio">Inicio</option>
              <option value="Especialidades">Especialidades</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Institucional">Institucional</option>
            </select>
            <span className="material-symbols-outlined cg-filter-chevron">expand_more</span>
          </div>
        </div>
      </div>

      {/* Tabla de Contenidos */}
      <div className="cg-table-wrapper">
        <table className="cg-table">
          <thead>
            <tr className="cg-table-head-row">
              <th className="cg-th-orden" scope="col">
                ORDEN
              </th>
              <th className="cg-th-recurso" scope="col">
                VISTA PREVIA Y RECURSO
              </th>
              <th className="cg-th-ubicacion" scope="col">
                PÁGINA Y UBICACIÓN
              </th>
              <th className="cg-th-estado" scope="col">
                ESTADO
              </th>
              <th className="cg-th-acciones" scope="col">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody className="cg-table-body">
            {currentRecursos.length === 0 ? (
              <tr>
                <td colSpan={5} className="cg-empty-cell">
                  <div className="cg-empty-content">
                    <span className="material-symbols-outlined cg-empty-icon">
                      photo_library
                    </span>
                    <p className="cg-empty-title">No hay contenidos registrados en esta pestaña</p>
                    <p className="cg-empty-desc">
                      Pruebe cambiando de pestaña o limpiando el filtro de páginas.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentRecursos.map((item, index) => {
                const isApproved = item.estado === "APROBADO" || item.estado === "PUBLICADO";
                const isRejected = item.estado === "RECHAZADO";
                const isPending =
                  item.estado === "PENDIENTE_APROBACION" || item.estado === "PENDIENTE";
                const isDraft = item.estado === "BORRADOR";

                return (
                  <tr key={item.id} className="cg-table-row">
                    {/* ORDEN */}
                    <td className="cg-td-orden">
                      {item.orden || startIndex + index + 1}
                    </td>

                    {/* VISTA PREVIA Y RECURSO */}
                    <td className="cg-td-recurso">
                      <div className="cg-recurso-box">
                        <div
                          className="cg-thumb-container"
                          onClick={() => handleOpenPreview(item)}
                          title="Clic para previsualizar"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.altText || item.titulo}
                              className="cg-thumb-img"
                            />
                          ) : (
                            <div className="cg-thumb-empty">
                              <span className="material-symbols-outlined">broken_image</span>
                            </div>
                          )}
                        </div>

                        <div className="cg-info-col">
                          <span
                            className="cg-info-title"
                            title={item.titulo}
                            onClick={() => handleOpenPreview(item)}
                          >
                            {item.titulo}
                          </span>
                          <span className="cg-info-desc" title={item.descripcion}>
                            {item.descripcion || "Recurso visual para el portal"}
                          </span>
                          {isRejected && item.rejectionReason && (
                            <div
                              className="cg-rejection-warning-pill"
                              onClick={() => handleOpenCorrection(item)}
                              title="Hacer clic para ver motivo y corregir"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                report
                              </span>
                              <span className="cg-rejection-warning-text truncate">
                                {item.rejectionReason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PÁGINA Y UBICACIÓN */}
                    <td className="cg-td-ubicacion">
                      <span className="cg-location-text">
                        {item.page || "Inicio"} - {item.ubicacion || "Cabecera Principal"}
                      </span>
                    </td>

                    {/* ESTADO */}
                    <td className="cg-td-estado">
                      {isApproved && (
                        <span className="cg-status-badge status-aprobado">
                          <span className="cg-status-dot dot-aprobado"></span>
                          APROBADO
                        </span>
                      )}
                      {isRejected && (
                        <button
                          type="button"
                          className="cg-status-badge status-rechazado clickable"
                          onClick={() => handleOpenCorrection(item)}
                          title="Hacer clic para ver motivo de rechazo y corregir"
                        >
                          <span className="cg-status-dot dot-rechazado"></span>
                          RECHAZADO
                        </button>
                      )}
                      {isPending && (
                        <span className="cg-status-badge status-pendiente">
                          <span className="cg-status-dot dot-pendiente"></span>
                          PENDIENTE
                        </span>
                      )}
                      {isDraft && (
                        <span className="cg-status-badge status-borrador">
                          <span className="cg-status-dot dot-borrador"></span>
                          BORRADOR
                        </span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="cg-td-acciones">
                      <div className="cg-actions-group">
                        {/* Previsualizar */}
                        <button
                          type="button"
                          className="cg-action-btn"
                          title="Previsualizar"
                          onClick={() => handleOpenPreview(item)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                        </button>

                        {/* Editar o Corregir */}
                        <button
                          type="button"
                          className={`cg-action-btn ${isRejected ? "action-fix" : ""}`}
                          title={isRejected ? "Ver motivo y corregir" : "Editar"}
                          onClick={() => {
                            if (isRejected) {
                              handleOpenCorrection(item);
                            } else {
                              handleOpenEdit(item);
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isRejected ? "build" : "edit"}
                          </span>
                        </button>

                        {/* Si está pendiente: botón de revisión editorial */}
                        {isPending && (
                          <button
                            type="button"
                            className="cg-action-btn action-review"
                            title="Revisar / Acreditar"
                            onClick={() => handleOpenReview(item)}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              fact_check
                            </span>
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          type="button"
                          className="cg-action-btn action-delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(item)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
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

      {/* Paginación / Footer Info */}
      <div className="cg-footer-row">
        <span className="cg-footer-info">
          Mostrando {recursosFiltrados.length === 0 ? 0 : startIndex + 1} de{" "}
          {recursosFiltrados.length} recursos registrados
        </span>
        <div className="cg-pagination-nav">
          <button
            type="button"
            className="cg-page-arrow"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`cg-page-number ${currentPage === num ? "active" : ""}`}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="cg-page-arrow"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Página siguiente"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ==========================================================================
          MODALES OPERATIVOS
          ========================================================================== */}

      {/* MODAL 1: Crear / Editar Contenido Gráfico */}
      {showCreateEditModal && (
        <div className="cg-modal-overlay" onClick={() => setShowCreateEditModal(false)}>
          <div className="cg-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <span className="material-symbols-outlined cg-modal-header-icon">
                  {isEditing ? "edit" : "add_photo_alternate"}
                </span>
                <div>
                  <h2 className="cg-modal-title">
                    {isEditing ? "Editar Recurso Gráfico" : "Nuevo Contenido Gráfico"}
                  </h2>
                  <p className="cg-modal-subtitle">
                    Complete los datos visuales conforme a los requerimientos del Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowCreateEditModal(false)}
                aria-label="Cerrar modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="cg-modal-body">
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Título del Recurso Visual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="cg-form-input"
                    placeholder="Ej. Campaña Prevención Dengue 2026..."
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="cg-form-group">
                  <label className="cg-form-label">Descripción Informativa</label>
                  <input
                    type="text"
                    className="cg-form-input"
                    placeholder="Ej. Recurso vectorial y flyer informativo para portal..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div className="cg-form-row">
                  <div className="cg-form-group flex-1">
                    <label className="cg-form-label">Página de Destino</label>
                    <select
                      className="cg-form-select"
                      value={formData.page}
                      onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                    >
                      <option value="Inicio">Inicio</option>
                      <option value="Especialidades">Especialidades</option>
                      <option value="Capacitación">Capacitación</option>
                      <option value="Institucional">Institucional</option>
                    </select>
                  </div>

                  <div className="cg-form-group flex-1">
                    <label className="cg-form-label">Ubicación</label>
                    <select
                      className="cg-form-select"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    >
                      <option value="Cabecera Principal">Cabecera Principal</option>
                      <option value="Sección Media">Sección Media</option>
                      <option value="Columna Lateral">Columna Lateral</option>
                      <option value="Pie">Pie Institucional</option>
                    </select>
                  </div>

                  <div className="cg-form-group w-24">
                    <label className="cg-form-label">Orden</label>
                    <input
                      type="number"
                      min="1"
                      className="cg-form-input text-center"
                      value={formData.orden}
                      onChange={(e) =>
                        setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>

                <div className="cg-form-group">
                  <label className="cg-form-label">Enlace URL Asociado (Opcional)</label>
                  <input
                    type="text"
                    className="cg-form-input"
                    placeholder="Ej. /campanas/dengue-2026"
                    value={formData.enlaceUrl}
                    onChange={(e) => setFormData({ ...formData, enlaceUrl: e.target.value })}
                  />
                </div>

                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Texto Alternativo Accesible (WCAG 2.2) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="cg-form-textarea"
                    rows="2"
                    placeholder="Describa de forma precisa el contenido de la imagen para lectores de pantalla..."
                    value={formData.altText}
                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  />
                </div>

                {/* Carga de Imagen */}
                <div className="cg-form-group">
                  <label className="cg-form-label">
                    Imagen del Recurso (16:9 - 1920×1080 px){" "}
                    {!isEditing && <span className="text-red-500">*</span>}
                  </label>

                  <div
                    className="cg-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />

                    {imagePreview ? (
                      <div className="cg-upload-preview-box">
                        <img src={imagePreview} alt="Vista previa" className="cg-upload-img" />
                        <span className="cg-upload-badge">Cambiar imagen</span>
                      </div>
                    ) : (
                      <div className="cg-upload-prompt">
                        <span className="material-symbols-outlined text-[32px] text-slate-400">
                          cloud_upload
                        </span>
                        <p className="cg-upload-text">
                          Haga clic o arrastre un archivo de imagen aquí
                        </p>
                        <span className="cg-upload-subtext">JPG, PNG o WEBP (máx. 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div className="cg-form-group">
                  <label className="cg-form-label">Estado Inicial</label>
                  <select
                    className="cg-form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="PENDIENTE_APROBACION">Pendiente de Aprobación</option>
                    <option value="APROBADO">Publicado / Aprobado</option>
                  </select>
                </div>
              </div>

              <div className="cg-modal-footer">
                <button
                  type="button"
                  className="cg-btn-cancel"
                  onClick={() => setShowCreateEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="cg-btn-submit">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>{isEditing ? "Guardar Cambios" : "Crear Recurso"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Modal de Subsanación / Corrección de Rechazo */}
      <CmsContenidoGraficoCorrectionModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        recurso={selectedRecurso}
        correctionData={correctionData}
        setCorrectionData={setCorrectionData}
        fileInputRef={correctionFileInputRef}
        onFileChange={handleCorrectionFileChange}
        onSaveDraft={handleCorrectionSaveDraft}
        onResubmitApproval={handleCorrectionResubmit}
      />

      {/* MODAL 3: Vista Previa 16:9 del Recurso */}
      {showPreviewModal && selectedRecurso && (
        <div className="cg-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="cg-modal-container preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <span className="material-symbols-outlined cg-modal-header-icon">visibility</span>
                <div>
                  <h2 className="cg-modal-title">Vista Previa del Recurso</h2>
                  <p className="cg-modal-subtitle">
                    {selectedRecurso.page} • {selectedRecurso.ubicacion}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowPreviewModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="cg-modal-body">
              <div className="cg-preview-banner-box">
                {selectedRecurso.imageUrl ? (
                  <img
                    src={selectedRecurso.imageUrl}
                    alt={selectedRecurso.altText || selectedRecurso.titulo}
                    className="cg-preview-banner-img"
                  />
                ) : (
                  <div className="cg-preview-banner-empty">
                    <span className="material-symbols-outlined text-[48px] text-slate-400">
                      broken_image
                    </span>
                  </div>
                )}
                <div className="cg-preview-overlay">
                  <span className="cg-preview-tag">
                    {selectedRecurso.page} • {selectedRecurso.ubicacion}
                  </span>
                  <h3 className="cg-preview-title">{selectedRecurso.titulo}</h3>
                  <p className="cg-preview-desc">{selectedRecurso.descripcion}</p>
                </div>
              </div>

              <div className="cg-preview-details-grid">
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Texto Alternativo (ALT)</span>
                  <p className="cg-detail-value">
                    {selectedRecurso.altText || "Sin texto alternativo definido"}
                  </p>
                </div>
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Enlace de Destino</span>
                  <p className="cg-detail-value font-mono">
                    {selectedRecurso.enlaceUrl || "Sin enlace configurado"}
                  </p>
                </div>
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Estado</span>
                  <p className="cg-detail-value font-semibold">
                    {selectedRecurso.estado} • {selectedRecurso.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-cancel"
                onClick={() => setShowPreviewModal(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cg-btn-submit"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleOpenEdit(selectedRecurso);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Editar Recurso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Revisión Editorial (Aprobar o Rechazar con Motivo) */}
      {showReviewModal && selectedRecurso && (
        <div className="cg-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="cg-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <span className="material-symbols-outlined cg-modal-header-icon">fact_check</span>
                <div>
                  <h2 className="cg-modal-title">Revisión Editorial</h2>
                  <p className="cg-modal-subtitle">
                    Dictamen editorial para "{selectedRecurso.titulo}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="cg-modal-body">
              <div className="cg-review-options">
                <label
                  className={`cg-review-option ${reviewAction === "approve" ? "selected-approve" : ""}`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="approve"
                    checked={reviewAction === "approve"}
                    onChange={() => setReviewAction("approve")}
                  />
                  <div>
                    <span className="cg-review-title text-green-700">Aprobar y Publicar</span>
                    <p className="cg-review-desc">El contenido visual se habilitará en el portal.</p>
                  </div>
                </label>

                <label
                  className={`cg-review-option ${reviewAction === "reject" ? "selected-reject" : ""}`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="reject"
                    checked={reviewAction === "reject"}
                    onChange={() => setReviewAction("reject")}
                  />
                  <div>
                    <span className="cg-review-title text-red-700">Rechazar con Observaciones</span>
                    <p className="cg-review-desc">Requiere ajustes obligatorios por parte del redactor.</p>
                  </div>
                </label>
              </div>

              {reviewAction === "reject" && (
                <div className="cg-form-group mt-4">
                  <label className="cg-form-label">
                    Motivo Obligatorio del Rechazo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="cg-form-textarea"
                    rows="3"
                    placeholder="Detalle los ajustes obligatorios (ej. Falta incorporar isologo institucional y ajustar contraste)..."
                    value={reviewRejectionText}
                    onChange={(e) => setReviewRejectionText(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-cancel"
                onClick={() => setShowReviewModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={reviewAction === "reject" ? "cg-btn-danger" : "cg-btn-submit"}
                onClick={handleProcessReview}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {reviewAction === "reject" ? "cancel" : "check_circle"}
                </span>
                <span>{reviewAction === "reject" ? "Confirmar Rechazo" : "Aprobar Recurso"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Eliminar Recurso */}
      <CmsDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Contenido Gráfico"
        itemType="el recurso visual"
        itemName={selectedRecurso?.titulo}
        confirmText="SÍ, ELIMINAR"
        cancelText="CANCELAR"
      />
    </div>
  );
};

export default CmsContenidoGraficoView;
