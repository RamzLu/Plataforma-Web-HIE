import React, { useState } from "react";
import "../styles/pages/EspecialidadesPage.css";
import Breadcrumb from "../components/Breadcrumb";
import fondoBannerEsp from "../assets/banner_especialidades.png";

// =========================================
// BASE DE DATOS: ESPECIALIDADES
// =========================================
const especialidadesData = [
  {
    id: 1,
    tipo: "ESPECIALIDAD",
    nombre: "CLÍNICA MÉDICA",
    pregunta: "¿Qué atendemos aquí?",
    descripcion:
      "Atención integral de adultos, diagnóstico y control de patologías generales.",
    ubicacion: "Sector de Consultorios - Pasillo A",
    horarios: "Lunes, Miércoles y Jueves (8:00 a 12:00)",
    requisitos: ["Traer DNI original.", "Derivación médica si corresponde."],
    contacto: "3704-XXXXXX (Interno 101)",
  },
  {
    id: 2,
    tipo: "ESPECIALIDAD",
    nombre: "PEDIATRÍA",
    pregunta: "¿Qué atendemos aquí?",
    descripcion: "Atención especializada para bebés, niños y adolescentes.",
    ubicacion: "Sector de Pediatría - Planta Baja",
    horarios: "Lunes a Viernes (7:30 a 13:00)",
    requisitos: ["Traer DNI original.", "Libreta de Vacunación obligatoria."],
    contacto: "3704-XXXXXX (Interno 102)",
  },
  {
    id: 3,
    tipo: "ESPECIALIDAD",
    nombre: "GINECOLOGÍA",
    pregunta: "¿Qué atendemos aquí?",
    descripcion:
      "Control anual, prevención, planificación familiar y patologías femeninas.",
    ubicacion: "Sector Mujer - Pasillo C",
    horarios: "Martes y Jueves (8:00 a 14:00)",
    requisitos: [
      "Traer DNI original.",
      "Estudios previos (Papanicolau / Ecografías).",
    ],
    contacto: "3704-XXXXXX (Interno 103)",
  },
  {
    id: 4,
    tipo: "ESPECIALIDAD",
    nombre: "TRAUMATOLOGÍA",
    pregunta: "¿Qué atendemos aquí?",
    descripcion:
      "Dolores de huesos, articulaciones, esguinces y control de fracturas.",
    ubicacion: "Sector de Consultorios - Pasillo B",
    horarios: "Lunes, Miércoles y Viernes (8:00 a 14:00)",
    requisitos: [
      "Traer DNI original.",
      "Si tiene radiografías previas, por favor tráigalas.",
    ],
    contacto: "3704-XXXXXX (Interno 123)",
  },
  {
    id: 5,
    tipo: "ESPECIALIDAD",
    nombre: "OFTALMOLOGÍA",
    pregunta: "¿Qué atendemos aquí?",
    descripcion:
      "Control de agudeza visual, fondo de ojo y tratamiento de afecciones oculares.",
    ubicacion: "Sector Especialidades - Planta Alta",
    horarios: "Lunes y Jueves (9:00 a 12:00)",
    requisitos: [
      "Traer DNI original.",
      "Traer anteojos actuales si los utiliza.",
    ],
    contacto: "3704-XXXXXX (Interno 105)",
  },
  {
    id: 6,
    tipo: "ESPECIALIDAD",
    nombre: "CIRUGÍA GENERAL",
    pregunta: "¿Qué atendemos aquí?",
    descripcion:
      "Evaluación pre-quirúrgica, curaciones y control post-operatorio.",
    ubicacion: "Sector Quirúrgico - Consultorio 4",
    horarios: "Lunes a Viernes (10:00 a 14:00)",
    requisitos: [
      "Traer DNI original.",
      "Estudios pre-quirúrgicos y derivación.",
    ],
    contacto: "3704-XXXXXX (Interno 106)",
  },
];

// =========================================
// BASE DE DATOS: SERVICIOS CLAVE
// =========================================
const serviciosData = [
  {
    id: 101,
    tipo: "SERVICIO",
    nombre: "LABORATORIO Y EXTRACCIONES",
    pregunta: "¿Qué hacemos aquí?",
    descripcion: "Para análisis de sangre, orina y otros fluidos corporales.",
    ubicacion: "Sector Laboratorio - Planta Baja",
    horarios: "Lunes a Viernes (6:30 a 9:00 hs para extracciones)",
    requisitos: [
      "Asistir con DNI y la Orden Médica.",
      "Respetar las horas de ayuno indicadas por su profesional.",
    ],
    contacto: "3704-XXXXXX (Interno 201)",
  },
  {
    id: 102,
    tipo: "SERVICIO",
    nombre: "DIAGNÓSTICO POR IMÁGENES",
    pregunta: "¿Qué estudios realizamos?",
    descripcion:
      "Radiografías (Rayos X), Ecografías generales, Tomografías Computadas y Resonancias Magnéticas.",
    ubicacion: "Sector de Imágenes - Planta Baja (Ala Sur)",
    horarios: "Lunes a Viernes, 7:00 a 16:00 hs. (Programados)",
    requisitos: [
      "Asistir con DNI y la Orden Médica física.",
      "En caso de ecografías abdominales, venir con 8 horas de ayuno.",
    ],
    contacto: "3704-XXXXXX (Interno 200)",
  },
  {
    id: 103,
    tipo: "SERVICIO",
    nombre: "GUARDIA Y EMERGENCIAS",
    pregunta: "¿Qué atendemos aquí?",
    descripcion: "Atención inmediata de urgencias y emergencias médicas.",
    ubicacion: "Ingreso por calle lateral - Guardia",
    horarios: "Abierto las 24 horas, los 365 días del año.",
    requisitos: [
      "Presentarse con DNI.",
      "La atención se prioriza según la gravedad del cuadro (Triage), no por orden de llegada.",
    ],
    contacto: "3704-XXXXXX (Interno 107) o llame al 107",
  },
  {
    id: 104,
    tipo: "SERVICIO",
    nombre: "FARMACIA INSTITUCIONAL",
    pregunta: "¿Qué hacemos aquí?",
    descripcion:
      "Retiro de medicamentos recetados exclusivamente por profesionales del hospital.",
    ubicacion: "Sector Farmacia - Planta Baja",
    horarios: "Lunes a Viernes (8:00 a 18:00 hs)",
    requisitos: [
      "Presentar DNI original del paciente.",
      "Receta Médica actualizada del hospital.",
    ],
    contacto: "3704-XXXXXX (Interno 204)",
  },
  {
    id: 105,
    tipo: "SERVICIO",
    nombre: "REHABILITACIÓN Y KINESIOLOGÍA",
    pregunta: "¿Qué hacemos aquí?",
    descripcion: "Sesiones de recuperación física, motriz y respiratoria.",
    ubicacion: "Sector Kinesiología - 1er Piso",
    horarios: "Lunes a Viernes (8:00 a 16:00 hs)",
    requisitos: [
      "Asistir con DNI.",
      "Orden Médica con derivación explícita a kinesiología.",
    ],
    contacto: "3704-XXXXXX (Interno 205)",
  },
  {
    id: 106,
    tipo: "SERVICIO",
    nombre: "HEMOTERAPIA (BANCO DE SANGRE)",
    pregunta: "¿Qué hacemos aquí?",
    descripcion:
      "Para donación de sangre y atención de transfusiones hospitalarias.",
    ubicacion: "Banco de Sangre - Planta Baja",
    horarios: "Lunes a Viernes (7:00 a 11:00 hs para donantes)",
    requisitos: [
      "Presentar DNI original.",
      "Desayunar líquidos (sin grasas ni lácteos) antes de donar.",
    ],
    contacto: "3704-XXXXXX (Interno 206)",
  },
];

const EspecialidadesPage = () => {
  const [currentView, setCurrentView] = useState("menu");

  const [selectedItem, setSelectedItem] = useState(null);

  const closeModal = () => setSelectedItem(null);

  return (
    <main className="especialidades-page">
      <div
        className="esp-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 111, 196, 0.85), rgba(233, 235, 238, 0.85)), url(${fondoBannerEsp})`,
        }}
      >
        <div className="esp-header-inner">
          <Breadcrumb currentPage="Áreas de Atención" />
          <h1 className="esp-main-title">Áreas de Atención</h1>
          <p className="esp-subtitle">
            Conozca los servicios y especialidades médicas de nuestra
            institución
          </p>
        </div>
      </div>

      <div className="especialidades-container">
        {currentView === "menu" && (
          <div className="esp-main-menu">
            <div
              className="menu-card"
              onClick={() => setCurrentView("grilla-esp")}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h2>Especialidades</h2>
            </div>

            <div
              className="menu-card"
              onClick={() => setCurrentView("grilla-serv")}
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
              <h2>Servicios Clave</h2>
            </div>
          </div>
        )}

        {(currentView === "grilla-esp" || currentView === "grilla-serv") && (
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
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                Volver
              </button>
              <h3 className="esp-instruction">
                Seleccione{" "}
                {currentView === "grilla-esp"
                  ? "la especialidad"
                  : "el servicio"}{" "}
                para ver horarios y requisitos:
              </h3>
            </div>

            <div className="specialties-grid">
              {(currentView === "grilla-esp"
                ? especialidadesData
                : serviciosData
              ).map((item) => (
                <div
                  key={item.id}
                  className="specialty-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <h3>{item.nombre}</h3>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content-esp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>
                {selectedItem.tipo}: {selectedItem.nombre}
              </h2>
              {/* Botón X de cerrar */}
              <button
                className="btn-close-modal"
                onClick={closeModal}
                title="Cerrar ventana"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body-esp">
              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  {selectedItem.pregunta}
                </h4>
                <p className="info-text italic">{selectedItem.descripcion}</p>
              </div>

              <div className="info-section">
                <div className="info-row">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <p className="info-text">
                    <strong>Ubicación:</strong> {selectedItem.ubicacion}
                  </p>
                </div>
                <div className="info-row">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </span>
                  <p className="info-text">
                    <strong>Horarios:</strong> {selectedItem.horarios}
                  </p>
                </div>
              </div>

              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </span>
                  REQUISITOS IMPORTANTES:
                </h4>
                <ul className="requisitos-lista">
                  {selectedItem.requisitos.map((req, index) => (
                    <li key={index} className="info-text">
                      {req.includes("DNI") ? (
                        <>
                          <span className="text-danger">
                            Traer DNI original.
                          </span>{" "}
                          {req
                            .replace("Traer DNI original.", "")
                            .replace("Asistir con DNI y", "Y")
                            .replace("Asistir con DNI.", "")}
                        </>
                      ) : (
                        req
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  ¿CÓMO SOLICITAR TURNO?
                </h4>
                <p className="info-text">
                  Los turnos se otorgan de manera <strong>PRESENCIAL</strong> en
                  la ventanilla del sector. Para consultas:
                </p>
                <div
                  className="info-row"
                  style={{ marginTop: "10px", alignItems: "center" }}
                >
                  <span className="info-icon">
                    <svg
                      viewBox="0 0 24 24"
                      style={{ width: "18px", height: "18px" }}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                  <p className="info-text text-danger">
                    {selectedItem.contacto}
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
