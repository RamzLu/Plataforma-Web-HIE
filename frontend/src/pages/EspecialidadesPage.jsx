import React from "react";
import "./EspecialidadesPage.css";

import iconEspecialidades from "../assets/especialidades-icon.png";
import iconServicios from "../assets/icon-para-servicios-hospital.png";

// Si ya tienes la imagen de fondo, descomenta la línea de abajo y ponle el nombre correcto
// import bgEspecialidades from '../assets/fondo-especialidades.jpg';

const EspecialidadesPage = () => {
  return (
    <main className="especialidades-page">
      {/* Capa de fondo con efecto borroso. 
          Si importas la imagen arriba, puedes agregarle style={{ backgroundImage: `url(${bgEspecialidades})` }} 
      */}
      <div className="especialidades-bg"></div>

      <div className="especialidades-content">
        {/* Barra de búsqueda */}
        <div className="search-bar-container">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="¿Qué está buscando? (Ej: Cardiólogo...)"
            className="search-input"
          />
        </div>

        {/* Contenedor de Tarjetas */}
        <div className="cards-wrapper">
          {/* Tarjeta 1: Especialidades Médicas */}
          <button className="option-card">
            <div className="card-icon-container">
              {/* Usamos tu imagen importada */}
              <img
                src={iconEspecialidades}
                alt="Especialidades Médicas"
                className="card-icon"
              />
            </div>
            <h2 className="card-title">ESPECIALIDADES MÉDICAS</h2>
            <p className="card-subtitle">(Consultas con doctores)</p>
          </button>

          {/* Tarjeta 2: Servicios del Hospital */}
          <button className="option-card">
            <div className="card-icon-container">
              {/* Usamos tu imagen importada */}
              <img
                src={iconServicios}
                alt="Servicios del Hospital"
                className="card-icon"
              />
            </div>
            <h2 className="card-title">SERVICIOS DEL HOSPITAL</h2>
            <p className="card-subtitle">(Estudios, áreas y soporte)</p>
          </button>
        </div>
      </div>
    </main>
  );
};

export default EspecialidadesPage;
