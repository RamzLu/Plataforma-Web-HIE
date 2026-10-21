import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  ExternalLink,
  Upload,
  X,
  File,
  Search,
  Users,
  Globe,
  PlayCircle,
  Image as ImageIcon,
} from "lucide-react";

import "../../styles/components/cms/CmsDashboard.css";
import "../../styles/components/cms/CmsModals.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsResidenciasView.css";
import "../../styles/pages/cms/CmsCapacitacionesView.css";

import {
  CmsDeleteModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";

// Datos iniciales armonizados con el portal público (CapacitacionPage) y schema.prisma
const INITIAL_CAPACITACIONES = [
  {
    id: 1,
    titulo: "Abordaje Inicial del ACV Isquémico en Guardia",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    contenido:
      "Módulo 1: Reconocimiento precoz y aplicación de Escala Cincinnati.\nMódulo 2: Criterios clínicos de inclusión/exclusión para trombolisis endovenosa.\nMódulo 3: Activación del protocolo Código ACV institucional del HIE.\nMódulo 4: Cuidados de enfermería crítica y monitoreo en shock room.",
    modalidad: "Virtual",
    tipoRecurso: "video",
    fechaInicio: "2026-05-20",
    fechaFin: "2026-05-20",
    horario: "10:00",
    ubicacion: "Plataforma Telesalud HIE (Video On-Demand)",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    archivoTipo: "video",
    archivoNombre: "Protocolo_ACV_VideoClase.mp4",
    archivoTamano: "14.2 MB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "PUBLICADO",
    activo: true,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Uso de la Plataforma de Telesalud y Teleconsultas",
    descripcion:
      "Taller práctico para el manejo del sistema institucional de teleconsultas, carga de historias clínicas virtuales y atención remota de pacientes.",
    contenido:
      "Módulo 1: Acceso, roles y permisos en el sistema Telesalud Formosa.\nMódulo 2: Coordinación de turnos virtuales y sala de espera digital.\nMódulo 3: Confección de historia clínica electrónica y recetas digitales.\nMódulo 4: Aspectos médico-legales y resguardo de datos sensibles.",
    modalidad: "Virtual",
    tipoRecurso: "pdf",
    fechaInicio: "2026-05-22",
    fechaFin: "2026-05-22",
    horario: "11:30",
    ubicacion: "Virtual - Plataforma Telesalud HIE",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Guia_Operativa_Teleconsultas_HIE.pdf",
    archivoTamano: "2.1 MB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "PUBLICADO",
    activo: true,
    createdAt: "2026-05-05T09:30:00Z",
  },
  {
    id: 3,
    titulo: "Gestión Basada en Datos Clínicos para Enfermería",
    descripcion:
      "Capacitación para jefes de enfermería en la transformación de registros administrativos en datos clínicos útiles para la toma de decisiones.",
    contenido:
      "Módulo 1: Indicadores clave de calidad en enfermería hospitalaria.\nMódulo 2: Registro estructurado en salas de internación general.\nMódulo 3: Auditoría concurrente y detección de eventos adversos.\nMódulo 4: Análisis de datos para asignación de dotaciones de guardia.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: "2026-05-20",
    fechaFin: "2026-05-20",
    horario: "10:00",
    ubicacion: "SUM Hospital Interdistrital Evita",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Programa_Gestion_Enfermeria.pdf",
    archivoTamano: "980 KB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "PUBLICADO",
    activo: true,
    createdAt: "2026-05-08T14:00:00Z",
  },
  {
    id: 4,
    titulo: "Reanimación Cardiopulmonar (RCP) Avanzada",
    descripcion:
      "Actualización en maniobras de RCP avanzada, uso de desfibrilador externo automático (DEA) y manejo de vía aérea en emergencias médicas.",
    contenido:
      "Módulo 1: Algoritmos actualizados de Soporte Vital Cardiovascular Avanzado (ACLS).\nMódulo 2: Farmacología en paro cardiorrespiratorio y ritmos desfibrilables.\nMódulo 3: Práctica con simuladores de vía aérea avanzada y capnografía.\nMódulo 4: Dinámica y liderazgo de equipo en código azul.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: "2026-06-05",
    fechaFin: "2026-06-05",
    horario: "08:30",
    ubicacion: "Gimnasio de Rehabilitación HIE",
    videoUrl: "",
    archivoTipo: "imagen",
    archivoNombre: "Afiche_Convocatoria_RCP_2026.png",
    archivoTamano: "1.8 MB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "BORRADOR",
    activo: true,
    createdAt: "2026-05-10T11:00:00Z",
  },
  {
    id: 5,
    titulo: "Control y Prevención de Infecciones Intrahospitalarias",
    descripcion:
      "Estrategias y medidas de bioseguridad para la prevención de infecciones asociadas al cuidado de la salud (IACS) en servicios críticos.",
    contenido:
      "Módulo 1: Higiene de manos y paquete de medidas para bacteriemia cero.\nMódulo 2: Prevención de neumonía asociada a ventilación mecánica (NAVM).\nMódulo 3: Manejo de catéteres urinarios y prevención de ITU.\nMódulo 4: Aislamiento por cohortes y desinfección ambiental hospitalaria.",
    modalidad: "Híbrida",
    tipoRecurso: "presencial",
    fechaInicio: "2026-06-12",
    fechaFin: "2026-06-12",
    horario: "09:00",
    ubicacion: "Híbrida - Aula Magna y Zoom",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Protocolo_IACS_Hospital_Evita.pdf",
    archivoTamano: "3.2 MB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "ARCHIVADO",
    activo: true,
    createdAt: "2026-04-15T08:00:00Z",
  },
  {
    id: 6,
    titulo: "Bioética y Derechos del Paciente en el Ámbito Público",
    descripcion:
      "Análisis de casos dilemáticos en la práctica médica diaria, consentimiento informado y marco legal de la atención en el hospital público.",
    contenido:
      "Módulo 1: Principios bioéticos aplicados a la medicina intensiva y de urgencias.\nMódulo 2: Directivas médicas anticipadas y adecuación del esfuerzo terapéutico.\nMódulo 3: Confidencialidad y secreto médico en equipos interdisciplinarios.\nMódulo 4: Dictámenes del Comité de Bioética Asistencial.",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: "2026-06-18",
    fechaFin: "2026-06-18",
    horario: "11:00",
    ubicacion: "Auditorio Principal HIE",
    videoUrl: "",
    archivoTipo: "documento",
    archivoNombre: "Temario_Bioetica_Hospitalaria.pdf",
    archivoTamano: "1.1 MB",
    archivoUrl: "",
    imagenUrl: "",
    estado: "PUBLICADO",
    activo: true,
    createdAt: "2026-05-12T16:00:00Z",
  },
];

const CmsCapacitacionesView = () => {
  // Lista de capacitaciones en estado local (sin backend según instrucción)
  const [capacitaciones, setCapacitaciones] = useState(INITIAL_CAPACITACIONES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PUBLICADOS"); // PUBLICADOS, BORRADORES, ARCHIVADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("TODAS");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Referencia para archivo unificado (video, documento o imagen)
  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Formulario según los campos de schema.prisma y el portal público
  const initialForm = {
    titulo: "",
    estado: "PUBLICADO", // BORRADOR, PUBLICADO, ARCHIVADO
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: "",
    fechaFin: "",
    horario: "10:00",
    ubicacion: "Hospital Interdistrital Evita",
    videoUrl: "",
    archivoTipo: "", // "video" | "documento" | "imagen"
    archivoNombre: "",
    archivoTamano: "",
    archivoUrl: "",
    imagenUrl: "",
    descripcion: "",
    contenido: "",
    activo: true,
  };

  const [formData, setFormData] = useState(initialForm);

  // Helper para generar iniciales
  const getInicialesCapacitacion = (nombre) => {
    if (!nombre) return "CP";
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      return `${palabras[0].charAt(0)}${palabras[1].charAt(0)}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  };

  // Procesamiento unificado de archivo: Video / Documento / Imagen
  const procesarArchivoUnificado = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const mime = file.type || "";

    const isImage =
      mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);
    const isVideo =
      mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(extension);
    const isDoc =
      mime === "application/pdf" ||
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension);

    if (!isImage && !isVideo && !isDoc) {
      return toast.error("Solo se admiten videos (MP4/WEBM), documentos (PDF/DOC) o imágenes (JPG/PNG/WEBP).");
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    const blobUrl = URL.createObjectURL(file);
    let tipo = "documento";
    if (isImage) tipo = "imagen";
    if (isVideo) tipo = "video";

    setFormData((prev) => ({
      ...prev,
      archivoTipo: tipo,
      archivoNombre: file.name,
      archivoTamano: sizeFormatted,
      archivoUrl: blobUrl,
      imagenUrl: isImage ? blobUrl : prev.imagenUrl,
      videoUrl: isVideo ? blobUrl : prev.videoUrl,
      tipoRecurso: isVideo ? "video" : isDoc ? "pdf" : isImage ? "imagen" : prev.tipoRecurso,
    }));
    setHasUnsavedChanges(true);
    toast.success(
      tipo === "video"
        ? "Video cargado con éxito."
        : tipo === "imagen"
        ? "Imagen cargada con éxito."
        : "Documento cargado con éxito."
    );
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    let horaExtraida = "10:00";
    if (item.horario) {
      const match = item.horario.match(/(\d{1,2}:\d{2})/);
      horaExtraida = match ? match[1].padStart(5, "0") : item.horario.slice(0, 5);
    }

    let tipoArch = item.archivoTipo || "";
    if (!tipoArch) {
      if (item.videoUrl && item.videoUrl.match(/\.(mp4|webm|mov)$/i)) tipoArch = "video";
      else if (item.archivoNombre) tipoArch = "documento";
      else if (item.imagenUrl) tipoArch = "imagen";
    }

    setFormData({
      titulo: item.titulo || "",
      estado: item.estado || "PUBLICADO",
      modalidad: item.modalidad || "Presencial",
      tipoRecurso: item.tipoRecurso || "presencial",
      fechaInicio: item.fechaInicio || "",
      fechaFin: item.fechaFin || "",
      horario: horaExtraida,
      ubicacion: item.ubicacion || "",
      videoUrl: item.videoUrl || "",
      archivoTipo: tipoArch,
      archivoNombre: item.archivoNombre || "",
      archivoTamano: item.archivoTamano || "",
      archivoUrl: item.archivoUrl || "",
      imagenUrl: item.imagenUrl || "",
      descripcion: item.descripcion || "",
      contenido: item.contenido || "",
      activo: item.activo !== false,
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      setShowModal(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowModal(false);
    setHasUnsavedChanges(false);
  };

  // Guardar datos en el estado local
  const handleSave = (e, forcedEstado) => {
    if (e) e.preventDefault();
    if (!formData.titulo.trim()) {
      return toast.error("El título de la capacitación es obligatorio.");
    }

    const estadoFinal = forcedEstado || formData.estado || "PUBLICADO";

    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        setCapacitaciones((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  ...formData,
                  estado: estadoFinal,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
        toast.success(
          estadoFinal === "BORRADOR"
            ? "Borrador actualizado con éxito."
            : "Capacitación actualizada con éxito."
        );
      } else {
        const nuevoRegistro = {
          id: Date.now(),
          ...formData,
          estado: estadoFinal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCapacitaciones((prev) => [nuevoRegistro, ...prev]);
        toast.success(
          estadoFinal === "BORRADOR"
            ? "Borrador guardado con éxito."
            : "Capacitación publicada con éxito."
        );
      }

      setIsSaving(false);
      setShowModal(false);
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
    }, 200);
  };

  // Cambio de estado interactivo (Publicado, Borrador, Archivado)
  const handleCambiarEstado = (id, nuevoEstado) => {
    const estadoLegible =
      nuevoEstado === "PUBLICADO"
        ? "Publicado"
        : nuevoEstado === "BORRADOR"
        ? "Borrador"
        : "Archivado";

    setCapacitaciones((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, estado: nuevoEstado, updatedAt: new Date().toISOString() }
          : item
      )
    );
    toast.success(`Estado actualizado a ${estadoLegible}.`);
  };

  // Eliminación de registro
  const confirmDelete = (item) => {
    setItemAEliminar(item);
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (!itemAEliminar) return;
    setCapacitaciones((prev) => prev.filter((c) => c.id !== itemAEliminar.id));
    toast.success("Capacitación eliminada correctamente.");
    setShowDeleteModal(false);
    setItemAEliminar(null);
  };

  // Filtrado de datos
  const datosFiltrados = capacitaciones.filter((item) => {
    const matchEstado =
      activeTab === "PUBLICADOS"
        ? item.estado === "PUBLICADO"
        : activeTab === "BORRADORES"
        ? item.estado === "BORRADOR"
        : item.estado === "ARCHIVADO";

    const matchModalidad =
      filtroModalidad === "TODAS" ? true : item.modalidad === filtroModalidad;

    const query = searchTerm.toLowerCase().trim();
    const matchSearch =
      !query ||
      item.titulo.toLowerCase().includes(query) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
      (item.ubicacion && item.ubicacion.toLowerCase().includes(query));

    return matchEstado && matchModalidad && matchSearch;
  });

  return (
    <div className="cms-dashboard-card">
      {/* Cabecera idéntica a Noticias, Profesionales y Residencias */}
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de capacitaciones
          </h3>
          <p className="news-view-subtitle">
            Administre los cursos, talleres, material formativo y jornadas institucionales del hospital.
          </p>
        </div>
        <button
          type="button"
          className="btn-crear-noticia-header"
          onClick={handleOpenCreate}
        >
          + AÑADIR CAPACITACIÓN
        </button>
      </div>

      {/* Pestañas de estado unificadas solo con texto */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "PUBLICADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("PUBLICADOS")}
        >
          Publicados
        </button>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "BORRADORES" ? "active" : ""}`}
          onClick={() => setActiveTab("BORRADORES")}
        >
          Borradores
        </button>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "ARCHIVADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("ARCHIVADOS")}
        >
          Archivados
        </button>
      </div>

      {/* Barra de herramientas: Buscador a la izquierda y Filtro por modalidad a la derecha */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div className="res-search-wrapper" style={{ minWidth: "340px", maxWidth: "480px", flex: "1 1 340px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar por título o contenido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="res-search-input-field"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            MODALIDAD:
          </span>
          <select
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
            className="res-select-field"
            style={{ minWidth: "190px" }}
          >
            <option value="TODAS">Todas las modalidades</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual / On-Demand</option>
            <option value="Híbrida">Híbrida</option>
          </select>
        </div>
      </div>

      {/* Contenedor de la tabla idéntico al estilo de Profesionales y Noticias */}
      <div className="cms-news-table-container">
        <div
          className="activity-table-head news-table-head"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ flex: 1.8 }}>CAPACITACIÓN Y TEMÁTICA</div>
          <div style={{ flex: 1 }}>MODALIDAD</div>
          <div style={{ flex: 1.2 }}>FECHA Y LUGAR</div>
          <div style={{ width: "135px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando capacitaciones...
              </span>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron capacitaciones registradas con este criterio.
            </div>
          ) : (
            datosFiltrados.map((item) => (
              <div
                className="activity-row news-table-row"
                key={item.id}
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {/* Columna CAPACITACIÓN con thumbnail interactivo */}
                <div
                  className="col-content"
                  style={{
                    flex: 1.8,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div className="news-thumb-box">
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="news-thumb-img"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="news-thumb-mock">
                        {getInicialesCapacitacion(item.titulo)}
                      </div>
                    )}
                  </div>
                  <div className="news-title-interactive" onClick={() => handleOpenEdit(item)}>
                    <span
                      className="activity-title"
                      style={{
                        fontWeight: "600",
                        color: "#0c2340",
                        fontSize: "0.95rem",
                        display: "block",
                      }}
                    >
                      {item.titulo}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        {item.descripcion && item.descripcion.length > 55
                          ? `${item.descripcion.substring(0, 55)}...`
                          : item.descripcion || "Formación médica continua"}
                      </span>
                      {(item.archivoTipo === "video" || item.videoUrl) && (
                        <span className="cap-resource-pill video">
                          <PlayCircle size={11} /> Video
                        </span>
                      )}
                      {(item.archivoTipo === "documento" || (item.archivoNombre && !item.archivoNombre.match(/\.(png|jpg|jpeg|webp|mp4|webm)$/i))) && (
                        <span className="cap-resource-pill pdf">
                          <FileText size={11} /> PDF/DOC
                        </span>
                      )}
                      {(item.archivoTipo === "imagen" || item.imagenUrl || (item.archivoNombre && item.archivoNombre.match(/\.(png|jpg|jpeg|webp)$/i))) && (
                        <span className="cap-resource-pill link">
                          <ImageIcon size={11} /> Imagen
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Columna MODALIDAD */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <span
                    className={`badge-modalidad ${
                      item.modalidad === "Virtual"
                        ? "virtual"
                        : item.modalidad === "Híbrida"
                        ? "hibrida"
                        : "presencial"
                    }`}
                  >
                    {item.modalidad === "Virtual" ? (
                      <Globe size={13} />
                    ) : item.modalidad === "Híbrida" ? (
                      <Users size={13} />
                    ) : (
                      <BookOpen size={13} />
                    )}
                    {item.modalidad}
                  </span>
                </div>

                {/* Columna FECHA Y LUGAR */}
                <div
                  className="col-area"
                  style={{
                    flex: 1.2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#0c2340", fontWeight: "600", fontSize: "0.88rem" }}>
                    {item.fechaInicio || "Fecha a confirmar"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{item.horario || "10:00 hs."}</span>
                    <span>•</span>
                    <span title={item.ubicacion}>
                      {item.ubicacion && item.ubicacion.length > 24
                        ? `${item.ubicacion.substring(0, 24)}...`
                        : item.ubicacion || "Hospital Evita"}
                    </span>
                  </span>
                </div>

                {/* Columna ESTADO INTERACTIVO */}
                <div
                  style={{
                    width: "135px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={item.estado}
                    onChange={(e) => handleCambiarEstado(item.id, e.target.value)}
                    className={`status-badge-select ${item.estado?.toLowerCase()}`}
                    title="Cambiar estado: Publicado / Borrador / Archivado"
                  >
                    <option value="PUBLICADO">Publicado</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="ARCHIVADO">Archivado</option>
                  </select>
                </div>

                {/* Columna ACCIONES */}
                <div
                  className="news-actions-cell"
                  style={{
                    width: "100px",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="news-action-btn-edit"
                    title="Editar capacitación"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(item)}
                    className="news-action-btn-delete"
                    title="Eliminar capacitación"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE ALTA / EDICIÓN (ARMONIZADO CON CMSMODALS) */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp esp-modal-wrapper"
            style={{ maxWidth: "840px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Capacitación" : "Nueva Capacitación"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  {/* Título de la Capacitación */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Título de la Capacitación / Jornada <span className="esp-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => {
                        setFormData({ ...formData, titulo: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Abordaje Inicial del ACV Isquémico en Guardia"
                      required
                    />
                  </div>

                  {/* Estado de Publicación (luego del título) */}
                  <div>
                    <label className="esp-form-label">
                      Estado de la Capacitación <span className="esp-asterisk">*</span>
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => {
                        setFormData({ ...formData, estado: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      style={{ fontWeight: "600" }}
                    >
                      <option value="BORRADOR">Borrador</option>
                      <option value="PUBLICADO">Publicado</option>
                      <option value="ARCHIVADO">Archivado</option>
                    </select>
                  </div>

                  {/* Modalidad de Dictado */}
                  <div>
                    <label className="esp-form-label">Modalidad de Dictado</label>
                    <select
                      value={formData.modalidad}
                      onChange={(e) => {
                        setFormData({ ...formData, modalidad: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Virtual">Virtual / On-Demand</option>
                      <option value="Híbrida">Híbrida (Presencial y Virtual)</option>
                    </select>
                  </div>

                  {/* Fecha de Inicio */}
                  <div>
                    <label className="esp-form-label">Fecha de Inicio / Encuentro</label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => {
                        setFormData({ ...formData, fechaInicio: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Fecha de Fin (Opcional) */}
                  <div>
                    <label className="esp-form-label">Fecha de Finalización (Opcional)</label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => {
                        setFormData({ ...formData, fechaFin: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Horario (mismo formato tipo tiempo que la fecha) */}
                  <div>
                    <label className="esp-form-label">Horario</label>
                    <input
                      type="time"
                      value={formData.horario}
                      onChange={(e) => {
                        setFormData({ ...formData, horario: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Ubicación o Plataforma */}
                  <div>
                    <label className="esp-form-label">Lugar / Plataforma</label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => {
                        setFormData({ ...formData, ubicacion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: SUM Hospital Evita o Zoom / Telesalud"
                    />
                  </div>

                  {/* Descripción breve (Copete) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Descripción Breve (Resumen para la tarjeta)</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => {
                        setFormData({ ...formData, descripcion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="2"
                      placeholder="Resumen introductorio que acompaña la tarjeta en el portal público..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Contenido / Temario detallado */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Temario y Contenidos Académicos</label>
                    <textarea
                      value={formData.contenido}
                      onChange={(e) => {
                        setFormData({ ...formData, contenido: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="3"
                      placeholder="Detalle de módulos, ejes temáticos, disertantes y metodología de evaluación..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Archivo multimedia o documento unificado (Video, Documento o Imagen) */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span>Archivo Adjunto / Multimedia (Video, Documento o Imagen)</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>
                        Opcional • MP4, PDF, DOCX, JPG, PNG
                      </span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) procesarArchivoUnificado(file);
                      }}
                      style={{ display: "none" }}
                    />

                    {formData.archivoNombre ? (
                      <div className="res-file-selected-card">
                        <div className="res-file-selected-left">
                          <div
                            className="res-file-type-icon"
                            style={{
                              backgroundColor:
                                formData.archivoTipo === "video"
                                  ? "#fee2e2"
                                  : formData.archivoTipo === "imagen"
                                  ? "#fef3c7"
                                  : "#e0f2fe",
                              color:
                                formData.archivoTipo === "video"
                                  ? "#dc2626"
                                  : formData.archivoTipo === "imagen"
                                  ? "#d97706"
                                  : "#0284c7",
                            }}
                          >
                            {formData.archivoTipo === "video" ? (
                              <Video size={18} />
                            ) : formData.archivoTipo === "imagen" ? (
                              <ImageIcon size={18} />
                            ) : (
                              <FileText size={18} />
                            )}
                          </div>
                          <div className="res-file-meta">
                            <span className="res-file-name" title={formData.archivoNombre}>
                              {formData.archivoNombre}
                            </span>
                            <span className="res-file-size">
                              {formData.archivoTamano || "Archivo adjunto"} •{" "}
                              {formData.archivoTipo === "video"
                                ? "Video Multimedia"
                                : formData.archivoTipo === "imagen"
                                ? "Imagen Adjunta"
                                : "Documento Descargable"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Reemplazar archivo"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                archivoTipo: "",
                                archivoNombre: "",
                                archivoTamano: "",
                                archivoUrl: "",
                              });
                              setHasUnsavedChanges(true);
                            }}
                            title="Quitar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`res-file-upload-zone ${isDraggingFile ? "drag-active" : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) procesarArchivoUnificado(f);
                        }}
                      >
                        <div className="res-file-icon-wrap">
                          <Upload size={20} />
                        </div>
                        <p className="res-file-upload-title">
                          Cargar Video, Documento o Imagen
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá el archivo aquí o <strong>hacé clic para examinar</strong> (Video MP4/WEBM, Documento PDF/DOC o Imagen JPG/PNG hasta 50 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer del Modal con botones corregidos */}
              <div className="cap-modal-footer">
                <button
                  type="button"
                  className="cap-btn-cancelar"
                  onClick={handleCloseAttempt}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="cap-btn-draft"
                    onClick={(e) => handleSave(e, "BORRADOR")}
                    disabled={isSaving}
                  >
                    Guardar como Borrador
                  </button>
                  <button
                    type="submit"
                    className="cap-btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          className="cms-spinner"
                          style={{
                            width: "16px",
                            height: "16px",
                            borderWidth: "2px",
                            borderTopColor: "white",
                            borderColor: "rgba(255,255,255,0.3)",
                          }}
                        ></div>
                        Guardando...
                      </span>
                    ) : editingId ? (
                      "Actualizar Capacitación"
                    ) : (
                      "Guardar Capacitación"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CAMBIOS SIN GUARDAR (UNIFICADO) */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "BORRADOR")}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (UNIFICADO) */}
      <CmsDeleteModal
        isOpen={showDeleteModal && !!itemAEliminar}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        itemName={itemAEliminar?.titulo}
        itemType="la capacitación"
      />
    </div>
  );
};

export default CmsCapacitacionesView;
