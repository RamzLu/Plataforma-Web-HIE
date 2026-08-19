import React, { useState } from "react";
import "../styles/components/InteractiveTimelineSection.css";

import lineaGeneral from "../assets/aprendeCapacitacion.jpg";
import linea2020 from "../assets/lineaTiempo_2020.png";
import linea2022 from "../assets/lineaTiempo_2022.png";
import linea2024 from "../assets/lineaTiempo_2024.png";
import linea2026 from "../assets/lineaTiempo_2026.png";

import foto2020 from "../assets/fotoFachadaHIE2.jpg";
import foto2022 from "../assets/fondoHospitalCarrusel1.jpg";
import foto2024 from "../assets/imagenPacientes.jpg";
import foto2026 from "../assets/fotoContacto.jpg";

const HITOS_DATA = [
  {
    year: "2020",
    tagColor: "#7e929f",
    titulo: "Inauguración y Respuesta Sanitaria",
    descripcion:
      "Inauguración del hospital para dar respuesta a la emergencia sanitaria y proteger a las familias formoseñas con más de 160 camas de soporte.",
    fotoHito: foto2020,
    imagenLinea: linea2020,
  },
  {
    year: "2022",
    tagColor: "#99acff",
    titulo: "Transición y Rehabilitación Post-COVID",
    descripcion:
      "Reconversión progresiva hacia un hospital polivalente e inauguración del centro de referencia para la recuperación integral de pacientes.",
    fotoHito: foto2022,
    imagenLinea: linea2022,
  },
  {
    year: "2024",
    tagColor: "#5271ff",
    titulo: "Consolidación de Alta Complejidad",
    descripcion:
      "Plena operatividad de quirófanos inteligentes, integración a la fibra óptica provincial y convenios de atención médica integral.",
    fotoHito: foto2024,
    imagenLinea: linea2024,
  },
  {
    year: "2026",
    tagColor: "#157664",
    titulo: "Docencia, Vanguardia e Innovación",
    descripcion:
      "Desarrollo de nuevas especialidades, residencias médicas formativas y telemedicina interdistrital para toda la provincia.",
    fotoHito: foto2026,
    imagenLinea: linea2026,
  },
];

const InteractiveTimelineSection = () => {
  const [selectedHito, setSelectedHito] = useState(HITOS_DATA[0]);

  return (
    <section className="timeline-interactive-section">
      <div className="timeline-interactive-container">
        <div className="timeline-interactive-header">
          <div className="timeline-header-text">
            <span className="timeline-header-tag">LÍNEA DE TIEMPO</span>
            <h2 className="timeline-header-title">
              NUESTRA TRAYECTORIA EN EL TIEMPO
            </h2>
          </div>
          <p className="timeline-header-caption">
            Selecciona un año para ver los hitos y la evolución del hospital.
          </p>
        </div>

        <div className="timeline-years-bar">
          {HITOS_DATA.map((hito) => {
            const isSelected = selectedHito.year === hito.year;
            return (
              <button
                key={hito.year}
                className={`year-tab-btn ${isSelected ? "active" : ""}`}
                style={{
                  "--accent-color": hito.tagColor,
                }}
                onClick={() => setSelectedHito(hito)}
                onMouseEnter={() => setSelectedHito(hito)}
              >
                <span className="btn-dot"></span>
                <span className="btn-text">{hito.year}</span>
              </button>
            );
          })}
        </div>

        <div className="timeline-interactive-grid">
          <div className="timeline-image-viewer">
            <div className="timeline-viewer-badge">
              Hito activo: {selectedHito.year}
            </div>
            <img
              src={selectedHito.imagenLinea}
              alt={`Línea de tiempo año ${selectedHito.year}`}
              className="timeline-road-img"
            />
          </div>

          <div className="timeline-detail-col">
            <div className="timeline-detail-card">
              <div className="detail-media">
                <img
                  src={selectedHito.fotoHito}
                  alt={selectedHito.titulo}
                  className="detail-photo"
                />
                <span
                  className="detail-year-badge"
                  style={{ backgroundColor: selectedHito.tagColor }}
                >
                  {selectedHito.year}
                </span>
              </div>

              <div className="detail-body">
                <span
                  className="detail-category"
                  style={{ color: selectedHito.tagColor }}
                >
                  HITO HISTÓRICO
                </span>
                <h3 className="detail-title">{selectedHito.titulo}</h3>
                <p className="detail-desc">{selectedHito.descripcion}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveTimelineSection;
