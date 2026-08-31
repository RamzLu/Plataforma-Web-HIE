import React, { useState } from "react";
import "../styles/pages/CapacitacionPage.css";
import AnimatedContent from "../components/AnimatedContent";

import Breadcrumb from "../components/Breadcrumb";

import logoHospital from "../assets/logoHospitalEvita.png";
import fondoBanner from "../assets/banner_capacitaciones.png";
import imgCapacitacion1 from "../assets/fondoCARRUSELnoticias2.jpg";
import imgCapacitacion2 from "../assets/fondoCARRUSELnoticias3.jpg";

const capacitacionesData = [
  {
    id: 1,
    titulo: "ABORDAJE INICIAL DEL ACV ISQUÉMICO EN GUARDIA",
    modalidadCorta: "Modalidad: Video On-Demand (Disponible 24hs)",
    imagen: imgCapacitacion1,
    fecha: "20 de Mayo de 2026",
    horario: "10:00 hs.",
    modalidadCompleta: "Presencial (SUM Hospital Evita)",
    descripcion:
      "Capacitación intensiva sobre el diagnóstico precoz, protocolo de trombolisis y manejo inicial del paciente con ACV isquémico agudo en el servicio de urgencias.",
    pdfUrl: "/docs/temario-acv.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: ABORDAJE INICIAL DEL ACV ISQUÉMICO EN GUARDIA",
  },
  {
    id: 2,
    titulo: "USO DE LA PLATAFORMA DE TELESALUD Y TELECONSULTAS",
    modalidadCorta: "Modalidad: Video y PDF Interactivo",
    imagen: imgCapacitacion2,
    fecha: "22 de Mayo de 2026",
    horario: "11:30 hs.",
    modalidadCompleta: "Virtual - Plataforma Telesalud HIE",
    descripcion:
      "Taller práctico para el manejo del sistema institucional de teleconsultas, carga de historias clínicas virtuales y atención remota de pacientes.",
    pdfUrl: "/docs/temario-telesalud.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: USO DE LA PLATAFORMA DE TELESALUD Y TELECONSULTAS",
  },
  {
    id: 3,
    titulo: "GESTIÓN BASADA EN DATOS CLÍNICOS PARA ENFERMERÍA",
    modalidadCorta: "Modalidad: Presencial y Evaluación Práctica",
    imagen: null,
    fecha: "20 de Mayo de 2026",
    horario: "10:00 hs.",
    modalidadCompleta: "Presencial (SUM Hospital Evita)",
    descripcion:
      "Capacitación para jefes de enfermería en la transformación de registros administrativos en datos clínicos útiles para la toma de decisiones.",
    pdfUrl: "/docs/temario-gestion-enfermeria.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: GESTIÓN BASADA EN DATOS CLÍNICOS PARA ENFERMERÍA",
  },
  {
    id: 4,
    titulo: "REANIMACIÓN CARDIOPULMONAR (RCP) AVANZADA",
    modalidadCorta: "Modalidad: Taller Teórico-Práctico",
    imagen: null,
    fecha: "05 de Junio de 2026",
    horario: "08:30 hs.",
    modalidadCompleta: "Presencial (Gimnasio de Rehabilitación)",
    descripcion:
      "Actualización en maniobras de RCP avanzada, uso de desfibrilador externo automático (DEA) y manejo de vía aérea en emergencias médicas.",
    pdfUrl: "/docs/temario-rcp.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: REANIMACIÓN CARDIOPULMONAR (RCP) AVANZADA",
  },
  {
    id: 5,
    titulo: "CONTROL Y PREVENCIÓN DE INFECCIONES INTRAHOSPITALARIAS",
    modalidadCorta: "Modalidad: Híbrida (Virtual + Campus)",
    imagen: null,
    fecha: "12 de Junio de 2026",
    horario: "09:00 hs.",
    modalidadCompleta: "Híbrida - Aula Magna y Zoom",
    descripcion:
      "Estrategias y medidas de bioseguridad para la prevención de infecciones asociadas al cuidado de la salud (IACS) en servicios críticos.",
    pdfUrl: "/docs/temario-infecciones.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: CONTROL Y PREVENCIÓN DE INFECCIONES INTRAHOSPITALARIAS",
  },
  {
    id: 6,
    titulo: "BIOÉTICA Y DERECHOS DEL PACIENTE EN EL ÁMBITO PÚBLICO",
    modalidadCorta: "Modalidad: Conferencia y Debate",
    imagen: null,
    fecha: "18 de Junio de 2026",
    horario: "11:00 hs.",
    modalidadCompleta: "Presencial (Auditorio Principal HIE)",
    descripcion:
      "Análisis de casos dilemáticos en la práctica médica diaria, consentimiento informado y marco legal de la atención en el hospital público.",
    pdfUrl: "/docs/temario-bioetica.pdf",
    whatsappMsg:
      "Hola! Quisiera más información sobre la capacitación: BIOÉTICA Y DERECHOS DEL PACIENTE EN EL ÁMBITO PÚBLICO",
  },
];

const CapacitacionPage = () => {
  const [selectedCurso, setSelectedCurso] = useState(null);

  return (
    <main className="capacitacion-page">
      <div
        className="cap-header-fluid"
        style={{
          backgroundImage: `linear-gradient(#4283d0, #eaf6fc), url(${fondoBanner})`,
        }}
      >
        <div className="cap-header-inner">
          <Breadcrumb currentPage="capacitación" />
          <h1 className="cap-title">CAPACITACIÓN</h1>
          <div className="cap-info-wrapper">
            <div className="cap-info-text">
              <p>Formación continua para profesionales y el equipo de salud institucional.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="capacitacion-container">
        <div className="cap-banner-box">
          <div className="cap-banner-left">
            <h2 className="cap-banner-headline">
              ¿Eres profesional del HIE y quieres seguir capacitándote?
            </h2>
            <p className="cap-banner-subtext">
              Para inscripciones, consultas o proponer nuevas jornadas:
            </p>
          </div>

          <div className="cap-banner-divider"></div>

          <div className="cap-banner-right">
            <img
              src={logoHospital}
              alt="Hospital Interdistrital Evita"
              className="cap-banner-logo"
            />
          </div>
        </div>
        <div className="cap-grid">
          {capacitacionesData.map((item, index) => (
            <AnimatedContent
              key={item.id}
              distance={40}
              direction="vertical"
              delay={index * 0.08} // Efecto cascada entre tarjetas
              threshold={0.1}
            >
              <div className="cap-card">
                {item.imagen ? (
                  <div
                    className="cap-card-bg"
                    style={{ backgroundImage: `url(${item.imagen})` }}
                  >
                    <div className="cap-card-overlay">
                      <h3>{item.titulo}</h3>
                      <p>{item.modalidadCorta}</p>
                      <button
                        className="cap-btn-vermas"
                        onClick={() => setSelectedCurso(item)}
                      >
                        VER MÁS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cap-card-empty">
                    <h3>{item.titulo}</h3>
                    <p>{item.modalidadCorta}</p>
                    <button
                      className="cap-btn-vermas outline"
                      onClick={() => setSelectedCurso(item)}
                    >
                      VER MÁS
                    </button>
                  </div>
                )}
              </div>
            </AnimatedContent>
          ))}
        </div>

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
                <strong>Fecha:</strong> {selectedCurso.fecha}
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
                <strong>Horario:</strong> {selectedCurso.horario}
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
                <strong>Modalidad:</strong> {selectedCurso.modalidadCompleta}
              </p>

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
            </div>

            <div className="cap-modal-actions">
              <a
                href={selectedCurso.pdfUrl}
                download
                className="cap-modal-btn download"
              >
                <div className="cap-modal-btn-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                </div>
                <span>DESCARGAR TEMARIO</span>
              </a>

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
    </main>
  );
};

export default CapacitacionPage;
