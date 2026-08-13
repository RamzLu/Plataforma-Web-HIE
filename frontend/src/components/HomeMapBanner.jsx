import React from "react";
import { Link } from "react-router-dom";
import "./HomeMapBanner.css";
import planoThumb from "../assets/planoHospital.jpg";

const HomeMapBanner = () => {
  return (
    <section className="home-map-banner-section">
      <div className="home-map-banner-container">
        <div className="home-map-banner-card">
          <div className="home-map-banner-text">
            <span className="banner-tag">INSTALACIONES Y SERVICIOS</span>
            <h2 className="banner-title">PLANO Y DISTRIBUCIÓN POR ÁREAS</h2>
            <p className="banner-desc">
              Conozca la ubicación de cada servicio médico, consultorios
              ambulatorios, quirófanos y accesos principales dentro del Hospital
              Interdistrital Evita.
            </p>
            <Link to="/contacto#plano-hospital" className="banner-btn">
              <span>EXPLORAR PLANO INTERACTIVO</span>
              <span className="arrow">→</span>
            </Link>
          </div>

          <div className="home-map-banner-preview">
            <img src={planoThumb} alt="Distribución y Plano del Hospital" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeMapBanner;
