import React, { useState, useEffect, useMemo, useRef } from "react";
import "../../styles/pages/CapacitacionPage.css";
import AnimatedContent from "../../components/ui/AnimatedContent";
import PageBanner from "../../components/PageBanner";

import fondoBanner from "../../assets/banner_capacitaciones.png";
import imgCapacitacion1 from "../../assets/fondoCARRUSELnoticias2.jpg";
import imgCapacitacion2 from "../../assets/fondoCARRUSELnoticias3.jpg";
import { getCapacitacionesPublicas } from "../../api/capacitaciones.api";

const capacitacionesData = [
  {
    id: 1,
    titulo: "ABORDAJE INICIAL DEL ACV ISQUÉMICO EN GUARDIA",
    modalidadCorta: "Modalidad: Video (Disponible 24hs)",
    imagen: imgCapacitacion1,
    fecha: "20 de Mayo de 2026",
    horario: "10:00 hs.",
    modalidadCompleta: "Virtual (Plataforma Telesalud HIE)",
    modalidadTag: "VIRTUAL",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    pdfUrl: "/docs/temario-acv.pdf",
    tipo: "video",
    badgeLabel: "Video",
    btnText: "VER MÁS",
  },
  {
    id: 2,
    titulo: "USO DE LA PLATAFORMA DE TELESALUD Y TELECONSULTAS",
    modalidadCorta: "Modalidad: Video y PDF Interactivo",
    imagen: imgCapacitacion2,
    fecha: "22 de Mayo de 2026",
    horario: "11:30 hs.",
    modalidadCompleta: "Virtual - Plataforma Telesalud HIE",
    modalidadTag: "VIRTUAL",
    descripcion:
      "Taller práctico para el manejo del sistema institucional de teleconsultas, carga de historias clínicas virtuales y atención remota de pacientes.",
    pdfUrl: "/docs/temario-telesalud.pdf",
    tipo: "pdf",
    badgeLabel: "Guía PDF",
    btnText: "VER MÁS",
  },
  {
    id: 3,
    titulo: "GESTIÓN BASADA EN DATOS CLÍNICOS PARA ENFERMERÍA",
    modalidadCorta: "Modalidad: Presencial y Evaluación Práctica",
    imagen: null,
    fecha: "20 de Mayo de 2026",
    horario: "10:00 hs.",
    modalidadCompleta: "Presencial (SUM Hospital Evita)",
    modalidadTag: "PRESENCIAL",
    descripcion:
      "Capacitación para jefes de enfermería en la transformación de registros administrativos en datos clínicos útiles para la toma de decisiones.",
    pdfUrl: "/docs/temario-gestion-enfermeria.pdf",
    tipo: "presencial",
    badgeLabel: "Presencial",
    btnText: "VER MÁS",
  },
  {
    id: 4,
    titulo: "REANIMACIÓN CARDIOPULMONAR (RCP) AVANZADA",
    modalidadCorta: "Modalidad: Taller Teórico-Práctico",
    imagen: null,
    fecha: "05 de Junio de 2026",
    horario: "08:30 hs.",
    modalidadCompleta: "Presencial (Gimnasio de Rehabilitación)",
    modalidadTag: "PRESENCIAL",
    descripcion:
      "Actualización en maniobras de RCP avanzada, uso de desfibrilador externo automático (DEA) y manejo de vía aérea en emergencias médicas.",
    pdfUrl: "/docs/temario-rcp.pdf",
    tipo: "presencial",
    badgeLabel: "Presencial",
    btnText: "VER MÁS",
  },
  {
    id: 5,
    titulo: "CONTROL Y PREVENCIÓN DE INFECCIONES INTRAHOSPITALARIAS",
    modalidadCorta: "Modalidad: Híbrida (Virtual + Campus)",
    imagen: null,
    fecha: "12 de Junio de 2026",
    horario: "09:00 hs.",
    modalidadCompleta: "Híbrida - Aula Magna y Zoom",
    modalidadTag: "HÍBRIDA",
    descripcion:
      "Estrategias y medidas de bioseguridad para la prevención de infecciones asociadas al cuidado de la salud (IACS) en servicios críticos.",
    pdfUrl: "/docs/temario-infecciones.pdf",
    tipo: "presencial",
    badgeLabel: "Presencial",
    btnText: "VER MÁS",
  },
  {
    id: 6,
    titulo: "BIOÉTICA Y DERECHOS DEL PACIENTE EN EL ÁMBITO PÚBLICO",
    modalidadCorta: "Modalidad: Conferencia y Debate",
    imagen: null,
    fecha: "18 de Junio de 2026",
    horario: "11:00 hs.",
    modalidadCompleta: "Presencial (Auditorio Principal HIE)",
    modalidadTag: "PRESENCIAL",
    descripcion:
      "Análisis de casos dilemáticos en la práctica médica diaria, consentimiento informado y marco legal de la atención en el hospital público.",
    pdfUrl: "/docs/temario-bioetica.pdf",
    tipo: "presencial",
    badgeLabel: "Presencial",
    btnText: "VER MÁS",
  },
];

// Opciones de filtrado por Formato de Contenido
const FILTROS_FORMATO = [
  { id: "all", label: "TODOS", icon: "grid_view" },
  { id: "video", label: "VIDEO", icon: "play_circle" },
  { id: "imagen", label: "IMAGEN", icon: "image" },
  { id: "pdf", label: "PDF", icon: "picture_as_pdf" },
];

// Opciones de filtrado por Modalidad
const FILTROS_MODALIDAD = [
  { id: "all", label: "TODAS", icon: "dashboard" },
  { id: "presencial", label: "PRESENCIAL", icon: "apartment" },
  { id: "virtual", label: "VIRTUAL", icon: "laptop_chromebook" },
  { id: "hibrido", label: "HÍBRIDO", icon: "hub" },
];

const getModalidadNormalizada = (item) => {
  const directTag = (item.modalidadTag || item.modalidad || "").toLowerCase();
  if (directTag.includes("híbrid") || directTag.includes("hibrid")) return "hibrido";
  if (directTag.includes("virtual")) return "virtual";
  if (directTag.includes("presencial")) return "presencial";

  const allText = `${item.modalidadCompleta || ""} ${item.ubicacion || ""} ${item.modalidadCorta || ""}`.toLowerCase();
  if (allText.includes("híbrid") || allText.includes("hibrid")) return "hibrido";
  if (allText.includes("virtual") || allText.includes("zoom") || allText.includes("campus") || allText.includes("telesalud") || allText.includes("on-demand")) return "virtual";
  if (allText.includes("presencial")) return "presencial";

  return "presencial";
};

const formatFechaEspanol = (fechaStr) => {
  if (!fechaStr) return "";
  try {
    const parts = fechaStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2].split("T")[0];
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const mesIndex = parseInt(month, 10) - 1;
      const mesNombre = meses[mesIndex] || month;
      return `${parseInt(day, 10)} de ${mesNombre} de ${year}`;
    }
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  } catch {}
  return fechaStr;
};

const formatItemData = (item) => {
  const modalidadTag = (item.modalidad || item.modalidadTag || "PRESENCIAL").toUpperCase();

  let tipo = "presencial";
  // archivoTipo tiene prioridad máxima: refleja exactamente qué material fue cargado en el CMS
  if (item.archivoTipo === "documento") {
    tipo = "pdf";
  } else if (item.archivoTipo === "video") {
    tipo = "video";
  } else if (item.archivoTipo === "imagen") {
    tipo = "imagen";
  } else if (item.tipoRecurso === "video") {
    tipo = "video";
  } else if (item.tipoRecurso === "pdf") {
    tipo = "pdf";
  } else if (item.tipoRecurso === "imagen") {
    tipo = "imagen";
  } else if (item.pdfUrl || (item.archivoUrl && item.archivoUrl.endsWith(".pdf"))) {
    tipo = "pdf";
  } else if (item.archivoUrl && item.archivoUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
    tipo = "imagen";
  } else if (item.archivoNombre && item.archivoNombre.match(/\.(png|jpg|jpeg|webp)$/i)) {
    tipo = "imagen";
  } else if (item.videoUrl && !item.archivoTipo) {
    tipo = "video";
  } else if (item.tipo) {
    const t = String(item.tipo).toLowerCase();
    if (t.includes("video")) tipo = "video";
    else if (t.includes("pdf") || t.includes("doc")) tipo = "pdf";
    else if (t.includes("imagen") || t.includes("infografia")) tipo = "imagen";
    else tipo = t;
  }

  tipo = String(tipo).toLowerCase();

  let badgeLabel = "Presencial";
  let btnText = "VER MÁS";

  if (tipo === "video") {
    badgeLabel = "Video";
    btnText = "VER MÁS";
  } else if (tipo === "pdf") {
    badgeLabel = "Guía PDF";
    btnText = "VER MÁS";
  } else if (tipo === "imagen" || tipo === "infografia") {
    badgeLabel = "Infografía";
    btnText = "VER MÁS";
  } else {
    badgeLabel = "Presencial";
    btnText = "VER MÁS";
  }

  const imagen = item.bannerUrl || item.imagenUrl || item.imagen || null;

  let fechaTexto = item.fecha || "";
  if (!fechaTexto && item.fechaInicio) {
    fechaTexto = formatFechaEspanol(item.fechaInicio);
  }

  let horarioTexto = item.horario || "";
  if (horarioTexto && !horarioTexto.includes("hs")) {
    horarioTexto = `${horarioTexto} hs.`;
  }

  const modalidadCorta = item.modalidadCorta || (item.modalidad ? `Modalidad: ${item.modalidad}` : "Modalidad: Presencial");
  const modalidadCompleta = item.modalidadCompleta || item.ubicacion || (item.modalidad ? `${item.modalidad} - Hospital Evita` : "Presencial (SUM Hospital Evita)");

  return {
    ...item,
    tipo,
    badgeLabel,
    btnText: item.btnText || btnText,
    imagen,
    fechaTexto,
    horarioTexto,
    modalidadTag,
    modalidadCorta,
    modalidadCompleta,
  };
};

const parseVideoUrl = (url) => {
  if (!url || typeof url !== "string") return { isEmbed: false, isVertical: false, src: "" };
  const clean = url.trim();

  // YouTube Shorts: youtube.com/shorts/ID
  const ytShortMatch = clean.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/i);
  if (ytShortMatch && ytShortMatch[1]) {
    return {
      isEmbed: true,
      isVertical: true,
      src: `https://www.youtube-nocookie.com/embed/${ytShortMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // YouTube general: watch?v=ID or youtu.be/ID or embed/ID
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      isVertical: false,
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      isVertical: false,
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Direct video file (e.g. Supabase storage URL .mp4, .webm, etc.)
  return {
    isEmbed: false,
    isVertical: false,
    src: clean,
  };
};

const CapacitacionPage = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatoFilter, setFormatoFilter] = useState("all");
  const [modalidadFilter, setModalidadFilter] = useState("all");
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCapacitaciones = async () => {
      try {
        const data = await getCapacitacionesPublicas();
        if (Array.isArray(data) && data.length > 0) {
          setCapacitaciones(data);
        } else {
          setCapacitaciones(capacitacionesData);
        }
      } catch (err) {
        console.warn("No se pudieron cargar capacitaciones públicas desde el backend:", err);
        setCapacitaciones(capacitacionesData);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  const handleCerrarVideo = () => {
    setActiveVideo(null);
    setIsVerticalVideo(false);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFormatoFilter("all");
    setModalidadFilter("all");
  };

  // Bloquear el scroll de la página cuando cualquier modal esté abierto
  useEffect(() => {
    const isModalOpen = Boolean(selectedCurso || activeVideo || activeImage);
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [selectedCurso, activeVideo, activeImage]);

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeImage) setActiveImage(null);
        else if (activeVideo) handleCerrarVideo();
        else if (selectedCurso) setSelectedCurso(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImage, activeVideo, selectedCurso]);

  const handleAbrirVideo = (item) => {
    if (!item) return;
    const url = item.videoUrl || (item.archivoTipo === "video" ? item.archivoUrl : "");
    if (!url || url.startsWith("blob:")) {
      setSelectedCurso(item);
      return;
    }
    const parsed = parseVideoUrl(url);
    setIsVerticalVideo(Boolean(parsed.isVertical));
    setActiveVideo({
      titulo: item.titulo,
      ...parsed,
    });
  };

  // Filtrado reactivo por formato de contenido (video, imagen, pdf), modalidad (presencial, virtual, hibrido) y búsqueda
  const itemsFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return capacitaciones.map(formatItemData).filter((item) => {
      // 1. Filtrado por Formato de contenido
      let matchFormato = false;
      if (formatoFilter === "all") {
        matchFormato = true;
      } else if (formatoFilter === "video") {
        matchFormato = item.tipo === "video";
      } else if (formatoFilter === "imagen") {
        matchFormato = item.tipo === "imagen" || item.tipo === "infografia";
      } else if (formatoFilter === "pdf") {
        matchFormato = item.tipo === "pdf";
      }

      // 2. Filtrado por Modalidad
      let matchModalidad = false;
      const modNorm = getModalidadNormalizada(item);
      if (modalidadFilter === "all") {
        matchModalidad = true;
      } else if (modalidadFilter === "presencial") {
        matchModalidad = modNorm === "presencial";
      } else if (modalidadFilter === "virtual") {
        matchModalidad = modNorm === "virtual";
      } else if (modalidadFilter === "hibrido") {
        matchModalidad = modNorm === "hibrido";
      }

      // 3. Filtrado por término de búsqueda
      const matchSearch =
        !term ||
        (item.titulo && item.titulo.toLowerCase().includes(term)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(term)) ||
        (item.modalidad && item.modalidad.toLowerCase().includes(term)) ||
        (item.modalidadCorta && item.modalidadCorta.toLowerCase().includes(term)) ||
        (item.modalidadTag && item.modalidadTag.toLowerCase().includes(term)) ||
        (item.disertantes && item.disertantes.toLowerCase().includes(term));

      return matchFormato && matchModalidad && matchSearch;
    });
  }, [capacitaciones, formatoFilter, modalidadFilter, searchTerm]);

  return (
    <main className="documentacion-page capacitacion-page-root">
      {/* ==========================================================================
          1. BANNER INSTITUCIONAL UNIFICADO
          ========================================================================== */}
      <PageBanner
        currentPage="capacitaciones"
        title="CAPACITACIONES Y CHARLAS"
        subtitle="Capacitaciones, talleres formativos y charlas abiertas para toda la comunidad y el equipo de salud."
        image={fondoBanner}
        marginBottom={0}
      />

      <div className="documentacion-container capacitacion-container">
        {/* ==========================================================================
            2. BUSCADOR INSTITUCIONAL EN PÍLDORA (Estilo Stella)
            ========================================================================== */}
        <div className="doc-search-wrapper">
          <div className="doc-search-bar">
            <svg
              className="doc-search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="doc-search-input"
              placeholder="Buscar capacitación, taller, charla o ateneo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="doc-search-spacer" />
          </div>
        </div>

        {/* ==========================================================================
            3. FILTROS AVANZADOS: FORMATO DE CONTENIDO Y MODALIDAD
            ========================================================================== */}
        <div className="cap-filters-container">
          {/* Fila 1: Formato de Contenido (video, imagen, pdf) */}
          <div className="cap-filter-row">
            <div className="cap-filter-header">
              <span className="material-symbols-outlined cap-filter-icon">folder_open</span>
              <span>Formato de Contenido:</span>
            </div>
            <div className="cap-filters-group">
              {FILTROS_FORMATO.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  className={`filter-chip ${formatoFilter === fmt.id ? "active" : ""}`}
                  onClick={() => setFormatoFilter(fmt.id)}
                >
                  <span className="material-symbols-outlined filter-chip-icon">{fmt.icon}</span>
                  <span>{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fila 2: Modalidad (virtual, presencial o hibrido) */}
          <div className="cap-filter-row">
            <div className="cap-filter-header">
              <span className="material-symbols-outlined cap-filter-icon">tune</span>
              <span>Modalidad:</span>
            </div>
            <div className="cap-filters-group">
              {FILTROS_MODALIDAD.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className={`filter-chip ${modalidadFilter === mod.id ? "active" : ""}`}
                  onClick={() => setModalidadFilter(mod.id)}
                >
                  <span className="material-symbols-outlined filter-chip-icon">{mod.icon}</span>
                  <span>{mod.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón flotante para limpiar filtros si hay alguno aplicado */}
          {(formatoFilter !== "all" || modalidadFilter !== "all" || searchTerm) && (
            <div className="cap-filter-reset-wrap">
              <button
                type="button"
                className="cap-filter-reset-btn"
                onClick={handleResetFilters}
                title="Restablecer todos los filtros y búsqueda"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>restart_alt</span>
                <span>Limpiar filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* ==========================================================================
            4. CONTENIDO PRINCIPAL: CABECERA EDITORIAL Y GRILLA DE TARJETAS
            ========================================================================== */}
        <div className="w-full-anim-wrapper">
          <AnimatedContent distance={30} direction="vertical" delay={0.08}>
            <div className="cap-grid-section">
              <div className="cap-section-header">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="cap-section-overline">
                    Ciclo de Formación 2026
                  </span>
                  <h2 className="cap-section-title">
                    Capacitaciones y Charlas Comunitarias y Profesionales
                  </h2>
                </div>

                <div
                  className="cap-counter-box"
                  role="status"
                  aria-live="polite"
                >
                  <span className="material-symbols-outlined">auto_stories</span>
                  <span id="training-counter">
                    Mostrando {itemsFiltrados.length} capacitaci
                    {itemsFiltrados.length === 1 ? "ón disponible" : "ones disponibles"}
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
                  <p>Cargando capacitaciones institucionales...</p>
                </div>
              ) : itemsFiltrados.length === 0 ? (
                <div className="cap-no-results">
                  <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
                    sentiment_dissatisfied
                  </span>
                  <h3>No se encontraron capacitaciones</h3>
                  <p>Intenta con otro término de búsqueda o selecciona otra categoría.</p>
                  <button
                    type="button"
                    className="filter-chip active"
                    onClick={handleResetFilters}
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="cap-cards-grid" id="training-grid">
                  {itemsFiltrados.map((item, index) => (
                    <AnimatedContent
                      key={item.id || index}
                      distance={25}
                      direction="vertical"
                      delay={index * 0.05}
                      threshold={0.1}
                      style={{ height: "100%" }}
                    >
                      <article
                        className="training-card group"
                        data-category={item.tipo}
                        onClick={() => setSelectedCurso(item)}
                      >
                        <div className="training-card-top">
                          {/* Cabecera Gráfica con Proporción 16:9 y Badge Temático */}
                          <div className="training-media-container">
                            {item.imagen ? (
                              <img
                                className="training-media-img"
                                src={item.imagen}
                                alt={item.titulo}
                                loading="lazy"
                              />
                            ) : (
                              <div className="cap-card-placeholder">
                                <div className="cap-placeholder-icon-wrap">
                                  <svg
                                    className="cap-placeholder-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M12 8v8" />
                                    <path d="M8 12h8" />
                                  </svg>
                                </div>
                                <span className="cap-placeholder-brand">
                                  HOSPITAL INTERDISTRITAL EVITA
                                </span>
                              </div>
                            )}

                            {/* Badge Temático Flotante con Icono y Etiqueta Normalizada */}
                            <span className={`training-floating-badge badge-${item.tipo}`}>
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "14px", marginRight: "3px" }}
                              >
                                {item.tipo === "video"
                                  ? "play_circle"
                                  : item.tipo === "pdf"
                                  ? "picture_as_pdf"
                                  : item.tipo === "imagen" || item.tipo === "infografia"
                                  ? "view_quilt"
                                  : "groups"}
                              </span>
                              <span>{item.badgeLabel}</span>
                            </span>
                          </div>

                          {/* Cuerpo Editorial de la Tarjeta */}
                          <div className="training-card-body">
                            <div className="training-date-tag">
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "15px" }}
                              >
                                event
                              </span>
                              <span>
                                {(item.fechaTexto || "A CONFIRMAR").toUpperCase()} • {item.modalidadTag || "PRESENCIAL"}
                              </span>
                            </div>

                            <h3 className="training-card-title">{item.titulo}</h3>

                            {Boolean(item.descripcion && item.descripcion.trim()) && (
                              <p className="training-card-desc">{item.descripcion}</p>
                            )}

                            <div className="training-card-divider" />

                            <div className="training-card-meta">
                              <div className="training-meta-item">
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: "16px" }}
                                >
                                  schedule
                                </span>
                                <span>{item.horarioTexto || "A confirmar"}</span>
                              </div>
                              <div className="training-meta-item">
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: "16px" }}
                                >
                                  {item.tipo === "video"
                                    ? "smart_display"
                                    : item.tipo === "pdf"
                                    ? "description"
                                    : item.tipo === "imagen"
                                    ? "image"
                                    : "location_on"}
                                </span>
                                <span>{item.modalidadCorta}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón de Acción Anclado */}
                        <div className="training-card-action">
                          <button
                            type="button"
                            className="training-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCurso(item);
                            }}
                            aria-label={`${item.btnText || "VER MÁS"}: ${item.titulo}`}
                          >
                            <span>{item.btnText || "VER MÁS"}</span>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "18px" }}
                            >
                              arrow_forward
                            </span>
                          </button>
                        </div>
                      </article>
                    </AnimatedContent>
                  ))}
                </div>
              )}
            </div>
          </AnimatedContent>
        </div>

        {/* ==========================================================================
            5. BANNER INFORMATIVO: ACCESO A LA REVISTA CIENTÍFICA (Stella)
            ========================================================================== */}
        <section className="cap-docencia-section">
          <div className="cap-docencia-card">
            <div className="cap-docencia-left">
              <div className="cap-docencia-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                  menu_book
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4 className="cap-docencia-title">
                  Revista Científica y Publicaciones Médicas
                </h4>
                <p className="cap-docencia-desc">
                  ¿Querés conocer más? ¿Sos especialista y querés investigar o ver material clínico específico?
                  Ingresá a nuestra revista científica para acceder a artículos, protocolos e investigaciones especializadas del hospital.
                </p>
              </div>
            </div>

            <div className="cap-docencia-right">
              <a
                className="cap-docencia-btn"
                href="https://revista.hospitalinterdistrital.gob.ar"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Ingresar a la Revista Científica</span>
                <span
                  className="material-symbols-outlined"
                  style={{ verticalAlign: "middle", marginLeft: "6px", fontSize: "16px" }}
                >
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ==========================================================================
          MODAL DETALLADO DE CAPACITACIÓN / CHARLAS
          ========================================================================== */}
      {selectedCurso && (
        <div
          className="cap-modal-overlay"
          onClick={() => setSelectedCurso(null)}
        >
          <div
            className="cap-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="cap-modal-close"
              onClick={() => setSelectedCurso(null)}
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            {/* Banner de portada si está disponible */}
            {selectedCurso.imagen && (
              <div className="cap-modal-banner-wrap">
                <img
                  src={selectedCurso.imagen}
                  alt={selectedCurso.titulo}
                  className="cap-modal-banner-img"
                />
              </div>
            )}

            <div className="cap-modal-header-top">
              <span className={`material-badge badge-${selectedCurso.tipo}`} style={{ position: "static" }}>
                <span className="material-badge-icon">
                  {selectedCurso.tipo === "video" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : selectedCurso.tipo === "pdf" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  ) : selectedCurso.tipo === "imagen" || selectedCurso.tipo === "infografia" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  )}
                </span>
                <span className="material-badge-label">{selectedCurso.badgeLabel}</span>
              </span>
            </div>

            <h2 className="cap-modal-title">{selectedCurso.titulo}</h2>

            {/* Grilla moderna de metadatos en 2 columnas */}
            <div className="cap-modal-meta-grid">
              <div className="cap-modal-meta-row">
                <span className="cap-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span>
                  <strong>Fecha:</strong> {selectedCurso.fechaTexto || selectedCurso.fecha || "A coordinar"}
                </span>
              </div>

              <div className="cap-modal-meta-row">
                <span className="cap-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span>
                  <strong>Horario:</strong> {selectedCurso.horarioTexto || selectedCurso.horario || "A coordinar"}
                </span>
              </div>

              <div className="cap-modal-meta-row">
                <span className="cap-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>
                  <strong>Modalidad:</strong> {selectedCurso.modalidadCompleta || selectedCurso.modalidad}
                </span>
              </div>

              {selectedCurso.disertantes && (
                <div className="cap-modal-meta-row">
                  <span className="cap-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span>
                    <strong>Disertantes:</strong> {selectedCurso.disertantes}
                  </span>
                </div>
              )}
            </div>

            {/* Caja de Descripción (oculta automáticamente si está vacía) */}
            {Boolean(selectedCurso.descripcion && selectedCurso.descripcion.trim()) && (
              <div className="cap-modal-desc-box">
                <div className="cap-modal-desc-box-title">
                  <span className="cap-info-icon" style={{ width: "16px", height: "16px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <span>Descripción</span>
                </div>
                <p className="cap-modal-desc-box-content">{selectedCurso.descripcion}</p>
              </div>
            )}

            {/* Caja de Temario / Programa Académico (oculta si está vacía) */}
            {Boolean(
              (selectedCurso.temario && selectedCurso.temario.trim()) ||
              (selectedCurso.contenido &&
                selectedCurso.contenido.trim() &&
                selectedCurso.contenido.trim() !== (selectedCurso.descripcion || "").trim())
            ) && (
              <div className="cap-modal-desc-box">
                <div className="cap-modal-desc-box-title">
                  <span className="cap-info-icon" style={{ width: "16px", height: "16px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                  <span>Temario y Programa Académico</span>
                </div>
                <div
                  className="cap-modal-desc-box-content"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {selectedCurso.temario || selectedCurso.contenido}
                </div>
              </div>
            )}

            {/* Visualización interactiva de Infografía adjunta */}
            {(selectedCurso.archivoTipo === "imagen" || selectedCurso.tipo === "imagen" || selectedCurso.tipo === "infografia") && selectedCurso.archivoUrl && (
              <div className="cap-modal-desc-box">
                <div className="cap-modal-desc-box-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="cap-info-icon" style={{ width: "16px", height: "16px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
                    <span>Infografía / Material Visual</span>
                  </div>
                  <span className="cap-infografia-header-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    Toca para ampliar
                  </span>
                </div>

                <div
                  className="cap-infografia-interactive-card"
                  onClick={() => setActiveImage({
                    url: selectedCurso.archivoUrl,
                    titulo: selectedCurso.titulo
                  })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveImage({
                        url: selectedCurso.archivoUrl,
                        titulo: selectedCurso.titulo
                      });
                    }
                  }}
                  title="Toca para ver la infografía en pantalla completa"
                >
                  <img
                    src={selectedCurso.archivoUrl}
                    alt={selectedCurso.titulo || "Infografía de la capacitación"}
                    className="cap-infografia-interactive-img"
                  />

                  {/* Badge permanente para que en móviles y desktop sea 100% obvio */}
                  <div className="cap-infografia-tap-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <span>Toca la imagen para ampliar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones principales del modal (solo si hay video o documento descargable) */}
            {((selectedCurso.videoUrl || (selectedCurso.archivoTipo === "video" && selectedCurso.archivoUrl)) ||
              ((selectedCurso.archivoUrl || selectedCurso.pdfUrl) &&
                selectedCurso.archivoTipo !== "video" &&
                selectedCurso.archivoTipo !== "imagen" &&
                selectedCurso.tipo !== "imagen" &&
                selectedCurso.tipo !== "infografia")) && (
              <div className="cap-modal-actions">
                {/* BOTÓN VER VIDEO (SE SOBREPONE A LA PANTALLA) */}
                {(selectedCurso.videoUrl || (selectedCurso.archivoTipo === "video" && selectedCurso.archivoUrl)) && (
                  <button
                    type="button"
                    onClick={() => handleAbrirVideo(selectedCurso)}
                    className="cap-modal-btn primary-video"
                  >
                    <div className="cap-modal-btn-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <span>VER CLASE / VIDEO</span>
                  </button>
                )}

                {/* BOTÓN DESCARGAR TEMARIO / DOCUMENTO */}
                {(selectedCurso.archivoUrl || selectedCurso.pdfUrl) &&
                  selectedCurso.archivoTipo !== "video" &&
                  selectedCurso.archivoTipo !== "imagen" &&
                  selectedCurso.tipo !== "imagen" &&
                  selectedCurso.tipo !== "infografia" && (
                    <a
                      href={selectedCurso.archivoUrl || selectedCurso.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="cap-modal-btn download"
                    >
                      <div className="cap-modal-btn-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                      </div>
                      <span>DESCARGAR TEMARIO / DOCUMENTO</span>
                    </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL REPRODUCTOR DE VIDEO SOBREPUESTO A LA PANTALLA
          ========================================================================== */}
      {activeVideo && (
        <div
          className="cap-video-modal-overlay"
          onClick={handleCerrarVideo}
        >
          <div
            className={`cap-video-modal-box ${isVerticalVideo ? "is-vertical" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cap-video-modal-header">
              <div className="cap-video-modal-title-wrap">
                <span className={`cap-video-pill ${isVerticalVideo ? "is-vertical-pill" : ""}`}>
                  {isVerticalVideo ? "FORMATO VERTICAL" : "CLASE VIRTUAL"}
                </span>
                <h3 className="cap-video-modal-title" title={activeVideo.titulo}>
                  {activeVideo.titulo}
                </h3>
              </div>
              <div className="cap-video-modal-actions-right">
                <button
                  type="button"
                  className="cap-video-modal-rotate-btn"
                  onClick={() => setIsVerticalVideo((prev) => !prev)}
                  title={isVerticalVideo ? "Cambiar a formato horizontal / panorámico" : "Cambiar a formato vertical / móvil"}
                  aria-label="Cambiar formato del reproductor"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    {isVerticalVideo ? (
                      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    ) : (
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    )}
                  </svg>
                </button>
                <button
                  type="button"
                  className="cap-video-modal-close"
                  onClick={handleCerrarVideo}
                  aria-label="Cerrar video"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className={`cap-video-frame-container ${isVerticalVideo ? "is-vertical" : ""}`}>
              {activeVideo.isEmbed ? (
                <iframe
                  src={activeVideo.src}
                  title={activeVideo.titulo}
                  className="cap-video-iframe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideo.src}
                  controls
                  autoPlay
                  playsInline
                  className="cap-video-native-player"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoHeight && v.videoWidth) {
                      setIsVerticalVideo(v.videoHeight > v.videoWidth);
                    }
                  }}
                >
                  Tu navegador no soporta la reproducción de video HTML5.
                </video>
              )}
            </div>

            <div className="cap-video-modal-footer">
              <p className="cap-video-modal-disclaimer">
                Hospital Interdistrital Evita • Formación continua institucional
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          VISOR DE INFOGRAFÍA PANTALLA COMPLETA (SIN MARCOS INVASIVOS)
          ========================================================================== */}
      {activeImage && (
        <div
          className="cap-image-lightbox-overlay"
          onClick={() => setActiveImage(null)}
        >
          {/* Botón flotante para volver atrás */}
          <button
            type="button"
            className="cap-image-back-btn"
            onClick={() => setActiveImage(null)}
            title="Volver atrás"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width="18" height="18">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Volver</span>
          </button>

          {/* Imagen ampliada limpia y maximizada */}
          <img
            src={activeImage.url}
            alt={activeImage.titulo || "Infografía ampliada"}
            className="cap-image-lightbox-clean-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
};

export default CapacitacionPage;
