import React from 'react';
import './AprendeSection.css';

// IMPORTACIÓN DE IMÁGENES
// Asegúrate de guardar estas imágenes en frontend/src/assets/
import aprendeMainImg from '../assets/aprendeMain.jpg'; // Imagen principal (RCP)
import tipDengueImg from '../assets/aprendeDengue.jpg'; // Imagen del tip de Dengue
import guiaLabImg from '../assets/aprendeLaboratorio.jpg'; // Imagen de la guía de Laboratorio

const AprendeSection = () => {
  return (
    <section className="aprende-section">
      <div className="aprende-container">
        
        {/* Lado Izquierdo: Imagen Principal */}
        <div className="aprende-left">
          <img src={aprendeMainImg} alt="Capacitación de salud - RCP" className="aprende-main-img" />
        </div>

        {/* Lado Derecho: Contenido y Tarjetas */}
        <div className="aprende-right">
          
          {/* Tarjeta Superior de Introducción */}
          <div className="aprende-intro-card">
            <div className="aprende-intro-header">
              <h3>APRENDE CON EL EVITA</h3>
            </div>
            <div className="aprende-intro-body">
              <p>
                Tu espacio de educación para la salud. Encontrá información clara, 
                consejos prácticos y guías en formato rápido para cuidar tu bienestar 
                y el de tu familia.
              </p>
            </div>
          </div>

          {/* Grilla inferior de recursos (Tip de Salud y Guía Práctica) */}
          <div className="aprende-resources-grid">
            
            {/* Tarjeta 1: Tip de Salud */}
            <div className="resource-card">
              <div className="resource-header header-green">
                <h4>TIP DE SALUD</h4>
              </div>
              <div className="resource-body">
                <h5 className="resource-title">Prevención del Dengue</h5>
                <div className="resource-img-container">
                  <img src={tipDengueImg} alt="Prevención del Dengue" className="resource-img" />
                </div>
              </div>
              <a href="#dengue" className="resource-footer-btn">
                VER MÁS
              </a>
            </div>

            {/* Tarjeta 2: Guía Práctica */}
            <div className="resource-card">
              <div className="resource-header header-yellow">
                <h4>GUÍA PRÁCTICA</h4>
              </div>
              <div className="resource-body">
                <h5 className="resource-title">Ayuno para Laboratorio</h5>
                <div className="resource-img-container">
                  <img src={guiaLabImg} alt="Ayuno para laboratorio" className="resource-img" />
                </div>
              </div>
              <a href="#laboratorio" className="resource-footer-btn">
                VER MÁS
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default AprendeSection;