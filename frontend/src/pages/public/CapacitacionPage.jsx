import React, { useState, useEffect } from "react";
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
    modalidadCorta: "Modalidad: Video On-Demand (Disponible 24hs)",
    imagen: imgCapacitacion1,
    fecha: "20 de Mayo de 2026",
    horario: "10:00 hs.",
    modalidadCompleta: "Presencial (SUM Hospital Evita)",
    modalidadTag: "VIRTUAL",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    pdfUrl: "/docs/temario-acv.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: ABORDAJE INICIAL DEL ACV ISQUÉMICO EN GUARDIA",
    tipo: "video",
    badgeIcon: "🎥",
    badgeLabel: "Video On-Demand",
    btnText: "REPRODUCIR VIDEO",
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
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: USO DE LA PLATAFORMA DE TELESALUD Y TELECONSULTAS",
    tipo: "pdf",
    badgeIcon: "📄",
    badgeLabel: "Guía PDF",
    btnText: "ABRIR PDF",
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
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: GESTIÓN BASADA EN DATOS CLÍNICOS PARA ENFERMERÍA",
    tipo: "presencial",
    badgeIcon: "👥",
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
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: REANIMACIÓN CARDIOPULMONAR (RCP) AVANZADA",
    tipo: "presencial",
    badgeIcon: "👥",
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
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: CONTROL Y PREVENCIÓN DE INFECCIONES INTRAHOSPITALARIAS",
    tipo: "presencial",
    badgeIcon: "👥",
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
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: BIOÉTICA Y DERECHOS DEL PACIENTE EN EL ÁMBITO PÚBLICO",
    tipo: "presencial",
    badgeIcon: "👥",
    badgeLabel: "Presencial",
    btnText: "VER MÁS",
  },
];

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
  if (item.tipoRecurso === "video" || item.archivoTipo === "video" || item.videoUrl) {
    tipo = "video";
  } else if (item.tipoRecurso === "pdf" || item.archivoTipo === "documento" || item.pdfUrl || (item.archivoUrl && item.archivoUrl.endsWith(".pdf"))) {
    tipo = "pdf";
  } else if (item.tipo) {
    tipo = item.tipo;
  }

  let badgeIcon = "👥";
  let badgeLabel = "Presencial";
  let btnText = "VER MÁS";

  if (tipo === "video") {
    badgeIcon = "🎥";
    badgeLabel = "Video On-Demand";
    btnText = "REPRODUCIR VIDEO";
  } else if (tipo === "pdf") {
    badgeIcon = "📄";
    badgeLabel = "Guía PDF";
    btnText = "ABRIR PDF";
  }

  const imagen = item.imagenUrl || item.imagen || null;

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
    badgeIcon: item.badgeIcon || badgeIcon,
    badgeLabel: item.badgeLabel || badgeLabel,
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
  if (!url || typeof url !== "string") return { isEmbed: false, src: "" };
  const clean = url.trim();

  // YouTube match: watch?v=ID or youtu.be/ID or embed/ID
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo match
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Direct video file (e.g. Supabase storage URL .mp4, .webm, etc.)
  return {
    isEmbed: false,
    src: clean,
  };
};

const CapacitacionPage = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

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

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeVideo) setActiveVideo(null);
        else if (selectedCurso) setSelectedCurso(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeVideo, selectedCurso]);

  const handleOpenWhatsappCurso = (curso) => {
    if (!curso) return;
    const mensaje = encodeURIComponent(
      curso.whatsappMsg ||
        `Hola! Quisiera más información sobre la capacitación: ${curso.titulo}`
    );
    window.open(`https://wa.me/?text=${mensaje}`, "_blank");
  };

  const handleAbrirVideo = (item) => {
    if (!item) return;
    const url = item.videoUrl || (item.archivoTipo === "video" ? item.archivoUrl : "");
    if (!url || url.startsWith("blob:")) {
      setSelectedCurso(item);
      return;
    }
    const parsed = parseVideoUrl(url);
    setActiveVideo({
      titulo: item.titulo,
      ...parsed,
    });
  };

  return (
    <main className="capacitacion-page">
      <PageBanner
        currentPage="capacitación"
        title="CAPACITACIÓN"
        subtitle="Formación continua para profesionales y el equipo de salud institucional."
        image={fondoBanner}
      />

      <div className="capacitacion-container">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
            <p>Cargando capacitaciones institucionales...</p>
          </div>
        ) : (
          <div className="cap-grid">
            {capacitaciones.map((rawItem, index) => {
              const item = formatItemData(rawItem);
              return (
                <AnimatedContent
                  key={item.id || index}
                  className="cap-grid-item"
                  distance={40}
                  direction="vertical"
                  delay={index * 0.08} // Efecto cascada entre tarjetas
                  threshold={0.1}
                >
                  <div className="cap-card-unified">
                    {/* Contenedor de Imagen o Placeholder con Badge Flotante */}
                    <div className="cap-card-media">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.titulo}
                          className="cap-card-img"
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

                      {/* Badge del material flotando en la esquina superior derecha */}
                      <div className={`material-badge badge-${item.tipo}`}>
                        <span className="material-badge-icon">{item.badgeIcon}</span>
                        <span className="material-badge-label">{item.badgeLabel}</span>
                      </div>
                    </div>

                    {/* Contenido / Cuerpo de la tarjeta */}
                    <div className="cap-card-body">
                      <span className="cap-card-date-modality">
                        {(item.fechaTexto || "").toUpperCase()} • {item.modalidadTag || "PRESENCIAL"}
                      </span>

                      <h3 className="cap-card-title">{item.titulo}</h3>

                      <p className="cap-card-desc">{item.descripcion}</p>

                      <div className="cap-card-meta">
                        <div className="cap-card-meta-item">
                          <svg
                            className="cap-meta-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{item.horarioTexto || "A confirmar"}</span>
                        </div>
                        <div className="cap-card-meta-item">
                          <svg
                            className="cap-meta-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                          <span>{item.modalidadCorta}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón inferior institucional de ancho completo */}
                    <div className="cap-card-footer">
                      <button
                        className="cap-btn-vermas-unified"
                        onClick={() => {
                          const hasVideo = item.videoUrl || (item.archivoTipo === "video" && item.archivoUrl);
                          if (item.tipo === "video" && hasVideo && !String(hasVideo).startsWith("blob:")) {
                            handleAbrirVideo(item);
                          } else {
                            setSelectedCurso(item);
                          }
                        }}
                      >
                        <span>
                          {item.btnText ||
                            (item.tipo === "video"
                              ? "REPRODUCIR VIDEO"
                              : item.tipo === "pdf"
                              ? "ABRIR PDF"
                              : "VER MÁS")}
                        </span>
                        <span className="cap-btn-arrow">➔</span>
                      </button>
                    </div>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        )}

        {/* AVISO INSTITUCIONAL */}
        <p className="cap-disclaimer">
          *Todas las actividades detalladas en este módulo son de carácter
          interno y exclusivas para el personal del Hospital Interdistrital
          Evita.*
        </p>
      </div>

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
            >
              &times;
            </button>

            <h2 className="cap-modal-title">{selectedCurso.titulo}</h2>

            <div className="cap-modal-info">
              {/* ÍCONO FECHA */}
              <p>
                <span className="cap-info-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <strong>Fecha:</strong> {selectedCurso.fechaTexto || selectedCurso.fecha || "A coordinar"}
              </p>

              {/* ÍCONO HORARIO */}
              <p>
                <span className="cap-info-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                <strong>Horario:</strong> {selectedCurso.horarioTexto || selectedCurso.horario || "A coordinar"}
              </p>

              {/* ÍCONO MODALIDAD */}
              <p>
                <span className="cap-info-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <strong>Modalidad:</strong> {selectedCurso.modalidadCompleta || selectedCurso.modalidad}
              </p>

              {/* ÍCONO DISERTANTES (OPCIONAL) */}
              {selectedCurso.disertantes && (
                <p>
                  <span className="cap-info-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  <strong>Disertantes:</strong> {selectedCurso.disertantes}
                </p>
              )}

              {/* ÍCONO DESCRIPCIÓN */}
              <div className="cap-modal-desc-box">
                <p className="cap-modal-desc">
                  <span className="cap-info-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </span>
                  <span>
                    <strong>Descripción:</strong> {selectedCurso.descripcion}
                  </span>
                </p>
              </div>

              {/* TEMARIO / CONTENIDO ACADÉMICO (OPCIONAL) */}
              {(selectedCurso.temario || (selectedCurso.contenido && selectedCurso.contenido !== selectedCurso.descripcion)) && (
                <div className="cap-modal-desc-box" style={{ marginTop: "12px" }}>
                  <p className="cap-modal-desc">
                    <span className="cap-info-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </span>
                    <span>
                      <strong>Temario / Programa:</strong>
                      <span style={{ display: "block", marginTop: "6px", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                        {selectedCurso.temario || selectedCurso.contenido}
                      </span>
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="cap-modal-actions">
              {/* BOTÓN VER VIDEO (SE SOBREPONE A LA PANTALLA) */}
              {(selectedCurso.videoUrl || (selectedCurso.archivoTipo === "video" && selectedCurso.archivoUrl)) && (
                <button
                  type="button"
                  onClick={() => handleAbrirVideo(selectedCurso)}
                  className="cap-modal-btn"
                  style={{
                    backgroundColor: "#e11d48",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="cap-modal-btn-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span>VER CLASE / VIDEO</span>
                </button>
              )}

              {/* BOTÓN DESCARGAR / VER DOCUMENTO O TEMARIO */}
              {(selectedCurso.archivoUrl || selectedCurso.pdfUrl) && selectedCurso.archivoTipo !== "video" && (
                <a
                  href={selectedCurso.archivoUrl || selectedCurso.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="cap-modal-btn download"
                >
                  <div className="cap-modal-btn-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                  </div>
                  <span>
                    {selectedCurso.archivoTipo === "imagen"
                      ? "VER IMAGEN"
                      : "DESCARGAR TEMARIO"}
                  </span>
                </a>
              )}

              <button
                className="cap-modal-btn whatsapp"
                onClick={() => handleOpenWhatsappCurso(selectedCurso)}
              >
                <div className="cap-modal-btn-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12.031 21.498c-1.536 0-3.04-.413-4.364-1.196l-.312-.185-3.243.85.865-3.163-.203-.323c-.856-1.365-1.308-2.92-1.308-4.52 0-4.714 3.836-8.55 8.566-8.55 2.285 0 4.432.89 6.046 2.507 1.614 1.616 2.503 3.764 2.503 6.048 0 4.714-3.836 8.55-8.55 8.55zm0-18.995c-5.76 0-10.45 4.69-10.45 10.45 0 1.84.48 3.636 1.393 5.22L1.5 22.5l4.43-1.163c1.52.836 3.242 1.277 5.03 1.277h.004c5.757 0 10.448-4.69 10.448-10.45 0-2.79-1.086-5.414-3.058-7.387-1.972-1.973-4.596-3.058-7.387-3.058zm5.74 13.918c-.314-.158-1.864-.922-2.152-1.028-.287-.105-.497-.158-.707.158-.21.316-.814 1.028-1.002 1.238-.184.21-.375.236-.688.078-.314-.157-1.33-.49-2.535-1.564-.937-.833-1.57-1.862-1.753-2.178-.184-.316-.02-.487.137-.645.14-.14.314-.368.472-.552.158-.184.21-.316.314-.526.105-.21.053-.395-.026-.553-.08-.158-.707-1.705-.968-2.336-.255-.615-.515-.532-.707-.542-.184-.01-.395-.01-.606-.01-.21 0-.553.078-.842.394-.288.316-1.1 1.078-1.1 2.628s1.127 3.048 1.285 3.258c.158.21 2.218 3.385 5.372 4.743.75.32 1.337.514 1.794.658.753.24 1.44.205 1.98.124.606-.09 1.864-.76 2.126-1.498.263-.736.263-1.368.184-1.498-.078-.13-.288-.21-.603-.368z" />
                  </svg>
                </div>
                <span>CONSULTAR POR WHATSAPP</span>
              </button>
            </div>

            <p className="cap-modal-tagline">
              🔒 <em>Exclusivo: Todo el equipo de salud HIE</em>
            </p>
          </div>
        </div>
      )}

      {/* MODAL REPRODUCTOR DE VIDEO SOBREPUESTO A LA PANTALLA */}
      {activeVideo && (
        <div
          className="cap-video-modal-overlay"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="cap-video-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cap-video-modal-header">
              <div className="cap-video-modal-title-wrap">
                <span className="cap-video-pill">CLASE VIRTUAL</span>
                <h3 className="cap-video-modal-title" title={activeVideo.titulo}>
                  {activeVideo.titulo}
                </h3>
              </div>
              <button
                type="button"
                className="cap-video-modal-close"
                onClick={() => setActiveVideo(null)}
                aria-label="Cerrar video"
              >
                &times;
              </button>
            </div>

            <div className="cap-video-frame-container">
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
                  className="cap-video-native-player"
                >
                  Tu navegador no soporta la reproducción de video HTML5.
                </video>
              )}
            </div>

            <div className="cap-video-modal-footer">
              <p className="cap-video-modal-disclaimer">
                🔒 <em>Hospital Interdistrital Evita • Formación continua institucional</em>
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CapacitacionPage;
