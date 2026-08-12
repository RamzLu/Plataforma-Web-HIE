import React from "react";
import { Link } from "react-router-dom";
import "./AprendeSection.css";

import aprendeMainImg from "../assets/aprendeMain.jpg";
import tipDengueImg from "../assets/aprendeDengue.jpg";
import guiaLabImg from "../assets/aprendeLaboratorio.jpg";
import capacitacionImg from "../assets/aprendeCapacitacion.jpg";

const AprendeSection = () => {
  return (
    <section className="aprende-section">
      <div className="aprende-container">
        <div className="aprende-left-image">
          <div className="image-frame">
            <img
              src={aprendeMainImg}
              alt="Educación para la salud - Hospital Evita"
            />
          </div>
        </div>

        <div className="aprende-right-content">
          <div className="aprende-header">
            <span className="aprende-subtitle">EDUCACIÓN PARA LA SALUD</span>
            <h2 className="aprende-title">APRENDÉ CON EL EVITA</h2>
          </div>

          <p className="aprende-description">
            Tu espacio de educación médica y preventiva. Encontrá información
            clara, consejos prácticos y guías de orientación en formato rápido
            para cuidar tu bienestar y el de tu familia.
          </p>

          <div className="aprende-cards-grid">
            <div className="aprende-card">
              <div className="card-image-box">
                <img src={tipDengueImg} alt="Prevención del Dengue" />
              </div>
              <div className="card-info">
                <span className="card-badge green">TIP DE SALUD</span>
                <h4>Prevención del Dengue</h4>
              </div>
              <Link
                to="/noticias?categoria=dengue"
                className="card-action-link"
              >
                <span>MÁS INFORMACIÓN</span>
                <span className="arrow">→</span>
              </Link>
            </div>

            <div className="aprende-card">
              <div className="card-image-box">
                <img src={guiaLabImg} alt="Ayuno para laboratorio" />
              </div>
              <div className="card-info">
                <span className="card-badge yellow">GUÍA PRÁCTICA</span>
                <h4>Ayuno para Laboratorio</h4>
              </div>
              <Link to="/documentacion" className="card-action-link">
                <span>MÁS INFORMACIÓN</span>
                <span className="arrow">→</span>
              </Link>
            </div>

            <div className="aprende-card">
              <div className="card-image-box">
                <img src={capacitacionImg} alt="Cursos y Jornadas HIE" />
              </div>
              <div className="card-info">
                <span className="card-badge blue">FORMACIÓN</span>
                <h4>Cursos y Jornadas HIE</h4>
              </div>
              <Link to="/capacitacion" className="card-action-link">
                <span>MÁS INFORMACIÓN</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AprendeSection;
