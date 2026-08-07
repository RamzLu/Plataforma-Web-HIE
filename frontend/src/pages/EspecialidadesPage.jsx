import React, { useState } from "react";
import "./EspecialidadesPage.css";
import Breadcrumb from "../components/Breadcrumb";

import fondoBannerEsp from "../assets/banner_especialidades.png";

const especialidadesData = [
  {
    id: 1,
    nombre: "CLÍNICA MÉDICA",
    descripcion:
      "Atención integral de adultos, diagnóstico y control de patologías generales.",
    ubicacion: "Sector de Consultorios - Pasillo A",
    horarios: "Lunes, Miércoles y Jueves (8:00 a 12:00)",
    requisitos: "Traer DNI original. Derivación médica si corresponde.",
    contacto: "3704-XXXXXX (Interno 101)",
  },
  {
    id: 2,
    nombre: "PEDIATRÍA",
    descripcion: "Atención especializada para bebés, niños y adolescentes.",
    ubicacion: "Sector de Pediatría - Planta Baja",
    horarios: "Lunes a Viernes (7:30 a 13:00)",
    requisitos: "Traer DNI original y Libreta de Vacunación.",
    contacto: "3704-XXXXXX (Interno 102)",
  },
  {
    id: 3,
    nombre: "GINECOLOGÍA",
    descripcion:
      "Control anual, prevención, planificación familiar y patologías femeninas.",
    ubicacion: "Sector Mujer - Pasillo C",
    horarios: "Martes y Jueves (8:00 a 14:00)",
    requisitos:
      "Traer DNI original y estudios previos (Papanicolau/Ecografías).",
    contacto: "3704-XXXXXX (Interno 103)",
  },
  {
    id: 4,
    nombre: "TRAUMATOLOGÍA",
    descripcion:
      "Dolores de huesos, articulaciones, esguinces y control de fracturas.",
    ubicacion: "Sector de Consultorios - Pasillo B",
    horarios: "Lunes, Miércoles y Viernes (8:00 a 14:00)",
    requisitos:
      "Traer DNI original. Si tiene radiografías previas, por favor tráigalas.",
    contacto: "3704-XXXXXX (Interno 123)",
  },
  {
    id: 5,
    nombre: "OFTALMOLOGÍA",
    descripcion:
      "Control de agudeza visual, fondo de ojo y tratamiento de afecciones oculares.",
    ubicacion: "Sector Especialidades - Planta Alta",
    horarios: "Lunes y Jueves (9:00 a 12:00)",
    requisitos: "Traer DNI original y anteojos actuales si los utiliza.",
    contacto: "3704-XXXXXX (Interno 105)",
  },
  {
    id: 6,
    nombre: "CIRUGÍA GENERAL",
    descripcion:
      "Evaluación pre-quirúrgica, curaciones y control post-operatorio.",
    ubicacion: "Sector Quirúrgico - Consultorio 4",
    horarios: "Lunes a Viernes (10:00 a 14:00)",
    requisitos: "Traer DNI original, estudios pre-quirúrgicos y derivación.",
    contacto: "3704-XXXXXX (Interno 106)",
  },
];

const EspecialidadesPage = () => {
  const [currentView, setCurrentView] = useState("menu");
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const closeModal = () => setSelectedSpecialty(null);

  return (
    <main className="especialidades-page">
      <div
        className="esp-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(80, 129, 194, 0.36), #e9ebee), url(${fondoBannerEsp})`,
        }}
      >
        <div className="esp-header-inner">
          <Breadcrumb currentPage="Especialidades" />
          <h1 className="esp-main-title">Áreas de Atención</h1>
          <p className="esp-subtitle">
            Conozca los servicios y especialidades médicas de nuestra
            institución
          </p>
        </div>
      </div>

      <div className="especialidades-container">
        {/* VISTA 1: MENÚ PRINCIPAL */}
        {currentView === "menu" && (
          <div className="esp-main-menu">
            {/* Tarjeta 1: Especialidades */}
            <div className="menu-card" onClick={() => setCurrentView("grilla")}>
              <div className="menu-card-icon">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h2>Especialidades</h2>
            </div>

            {/* Tarjeta 2: Servicios (Simulada para mantener el diseño) */}
            <div
              className="menu-card"
              onClick={() => alert("Sección de Servicios en construcción")}
            >
              <div className="menu-card-icon">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              <h2>Servicios</h2>
            </div>
          </div>
        )}

        {/* VISTA 2: GRILLA DE ESPECIALIDADES */}
        {currentView === "grilla" && (
          <>
            <div className="esp-grid-header">
              <button
                className="btn-volver"
                onClick={() => setCurrentView("menu")}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                Volver
              </button>
              <h3 className="esp-instruction">
                Seleccione la especialidad para ver horarios y requisitos:
              </h3>
            </div>

            <div className="specialties-grid">
              {especialidadesData.map((esp) => (
                <div
                  key={esp.id}
                  className="specialty-card"
                  onClick={() => setSelectedSpecialty(esp)}
                >
                  <h3>{esp.nombre}</h3>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* =========================================
          MODAL (POP-UP) DE INFORMACIÓN
      ========================================= */}
      {selectedSpecialty && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content-esp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>ESPECIALIDAD: {selectedSpecialty.nombre}</h2>
            </div>

            <div className="modal-body-esp">
              <div className="info-section">
                <h4 className="info-title">¿Qué atendemos aquí?</h4>
                <p className="info-text italic">
                  {selectedSpecialty.descripcion}
                </p>
              </div>

              <div className="info-section">
                <div className="info-row">
                  <span className="info-icon">📍</span>
                  <p className="info-text">
                    <strong>Ubicación:</strong> {selectedSpecialty.ubicacion}
                  </p>
                </div>
                <div className="info-row">
                  <span className="info-icon">🕒</span>
                  <p className="info-text">
                    <strong>Horarios:</strong> {selectedSpecialty.horarios}
                  </p>
                </div>
              </div>

              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">⚠️</span>
                  REQUISITOS PARA ATENDERSE:
                </h4>
                <p className="info-text">
                  <span className="text-danger">Traer DNI original. </span>
                  {selectedSpecialty.requisitos.replace(
                    "Traer DNI original.",
                    "",
                  )}
                </p>
              </div>

              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">📞</span>
                  ¿CÓMO CONSEGUIR TURNO?
                </h4>
                <p className="info-text">
                  No damos turnos por internet. Acérquese a la ventanilla de
                  Admisión de lunes a viernes de 7:00 a 12:00, o llame al:
                </p>
                <div className="info-row" style={{ marginTop: "10px" }}>
                  <span className="info-icon">☎️</span>
                  <p className="info-text text-danger">
                    {selectedSpecialty.contacto}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer-esp">
              <button className="btn-cerrar-rojo" onClick={closeModal}>
                Cerrar y Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default EspecialidadesPage;
