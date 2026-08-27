import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/components/HospitalMapSection.css";

import planoGeneral from "../assets/planoHospital.jpg";
import planoBloqueQuirurgico from "../assets/plano_bloque_quirurgico.jpg";
import planoObstetrico from "../assets/plano_obstetrico.jpg";
import planoCirugiaAmbulatoria from "../assets/planoCirugiaAmbulatoria.jpeg"
import uci from "../assets/uci.jpeg"
import planoGabinetes from "../assets/planoGabinetes.jpeg"
import planoAmbulatorio from "../assets/planoAmbulatorio.jpeg"

const AREAS_HOSPITAL = [
  {
    id: "quirurgico",
    bloque: "Bloque 1",
    titulo: "Bloque Quirúrgico",
    horario: "24 Hs. (Guardia y Programadas)",
    acceso: "Entrada Este - Ascensores Médicos",
    descripcion:
      "Área de quirófanos de alta complejidad equipados para cirugías generales, traumatología y procedimientos de urgencia.",
    imagen: planoBloqueQuirurgico,
  },
  {
    id: "cirugia-ambulatoria",
    bloque: "Bloque 1",
    titulo: "Cirugía Ambulatoria y Recuperación",
    horario: "07:00 a 19:00 Hs.",
    acceso: "Entrada Oeste - Sector Quirúrgico",
    descripcion:
      "Sector destinado a cirugías de corta estancia, hospital de día y salas de recuperación post-anestesia inmediata.",
    imagen: planoCirugiaAmbulatoria,
  },
  {
    id: "obstetrico",
    bloque: "Bloque 1",
    titulo: "Bloque Obstétrico",
    horario: "24 Hs. Guardias Activas",
    acceso: "Ala Este - Planta Alta",
    descripcion:
      "Salas de partos, monitoreo fetal continuo y atención integral para la salud de la madre y el recién nacido.",
    imagen: planoObstetrico,
  },
  {
    id: "uci",
    bloque: "Bloque 2",
    titulo: "UCI - Unidad de Cuidados Intensivos",
    horario: "Visitas: 12:00 a 13:00 / 18:00 a 19:00 Hs.",
    acceso: "Núcleo Central - Control de Acceso",
    descripcion:
      "Boxes de internación crítica equipados con tecnología de monitoreo hemodinámico avanzado y soporte vital continuo.",
    imagen: uci,
  },
  {
    id: "gabinetes",
    bloque: "Bloque 2",
    titulo: "Gabinetes Especiales y Fecundación",
    horario: "07:30 a 16:00 Hs.",
    acceso: "Pasillo Lateral Oeste - Bloque 2",
    descripcion:
      "Laboratorios de alta especialidad, fecundación in vitro y estudios diagnósticos de precisión asistida.",
    imagen: planoGabinetes,
  },
  {
    id: "ambulatorio",
    bloque: "Bloque 3",
    titulo: "Consultorios Ambulatorios",
    horario: "06:30 a 20:00 Hs.",
    acceso: "Entrada Principal - Planta Baja",
    descripcion:
      "Salas de espera y gabinetes de atención para turnos programados en todas las especialidades médicas del hospital.",
    imagen: planoAmbulatorio,
  },
];

const HospitalMapSection = () => {
  const [bloqueActivo, setBloqueActivo] = useState("TODOS");
  const [areaSeleccionada, setAreaSeleccionada] = useState(AREAS_HOSPITAL[0]);

  const areasFiltradas =
    bloqueActivo === "TODOS"
      ? AREAS_HOSPITAL
      : AREAS_HOSPITAL.filter((item) => item.bloque === bloqueActivo);

  return (
    <section id="plano-hospital" className="hospital-map-section">
      <div className="hospital-map-container">
        <div className="hospital-map-header">
          <div className="map-title-group">
            <span className="map-subtitle">GUÍA DE INSTALACIONES</span>
            <h2 className="map-title">PLANO Y DISTRIBUCIÓN POR ÁREAS</h2>
          </div>
          <p className="map-caption">
            Selecciona un sector para ver su ubicación en el plano y los
            detalles de acceso.
          </p>
        </div>

        <div className="map-filter-tabs">
          {["TODOS", "Bloque 1", "Bloque 2", "Bloque 3"].map((bloque) => (
            <button
              key={bloque}
              className={`filter-tab-btn ${bloqueActivo === bloque ? "active" : ""}`}
              onClick={() => setBloqueActivo(bloque)}
            >
              {bloque}
            </button>
          ))}
        </div>

        <div className="hospital-map-grid">
          <div className="map-controls-col">
            <div className="areas-list-grid">
              {areasFiltradas.map((area) => {
                const isActive = areaSeleccionada.id === area.id;
                return (
                  <button
                    key={area.id}
                    className={`area-selector-card ${isActive ? "selected" : ""}`}
                    onClick={() => setAreaSeleccionada(area)}
                  >
                    <div className="area-card-header">
                      <span className="area-block-tag">{area.bloque}</span>
                      <span className="arrow-indicator">
                        {isActive ? "●" : "→"}
                      </span>
                    </div>
                    <h4>{area.titulo}</h4>
                  </button>
                );
              })}
            </div>

            <div className="area-info-card">
              <div className="info-badge-header">
                <span className="tag-live">SECTOR SELECCIONADO</span>
                <h3>{areaSeleccionada.titulo}</h3>
              </div>

              <p className="info-desc">{areaSeleccionada.descripcion}</p>

              <div className="info-meta-grid">
                <div className="meta-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div>
                    <strong>HORARIO:</strong>
                    <span>{areaSeleccionada.horario}</span>
                  </div>
                </div>

                <div className="meta-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <strong>ACCESO:</strong>
                    <span>{areaSeleccionada.acceso}</span>
                  </div>
                </div>
              </div>

              <Link to="/especialidades" className="area-info-btn">
                <span>VER ESPECIALIDADES DEL ÁREA</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="map-viewer-col">
            <div className="map-image-frame">
              <div className="map-view-badge">
                Mostrando: {areaSeleccionada.titulo}
              </div>
              <img
                src={areaSeleccionada.imagen}
                alt={`Plano - ${areaSeleccionada.titulo}`}
                className="map-display-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HospitalMapSection;
