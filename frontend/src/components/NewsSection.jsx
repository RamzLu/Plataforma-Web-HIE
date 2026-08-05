import React from "react";
import "./NewsSection.css";

// 1. Importa la imagen aquí arriba, igual que hicimos con el Header
import mapaFormosa from "../assets/mapaFormosaParaNewsSection.png";
import logosGobierno from "../assets/logosGobierno.png";

const NewsSection = () => {
  return (
    <section className="news-section">
      <div className="news-container">
        <div className="news-header">
          <div className="news-title-group">
            <h2 className="news-title">Requisitos y procedimientos</h2>
            <h3 className="news-subtitle">COMO SACAR TURNO</h3>
          </div>
          <a href="#ver-mas" className="news-ver-mas">
            VER MAS
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </a>
        </div>

        <div className="news-cards-grid">
          <div className="news-card">
            <div className="card-header-line">
              <h4>SISTEMA DE TURNOS</h4>
              <span>
                Hospital Interdistrital <strong>Evita</strong>
              </span>
            </div>

            <h5 className="card-question blue-text">¿Venís por primera vez?</h5>

            <p className="card-paragraph">
              Para la atención en consultorios en las diferentes especialidades,
              los pedidos son solicitados por sistema de{" "}
              <strong>referencia</strong> y <strong>contrarreferencia</strong>{" "}
              emitido por el Centro de Salud más cercano a tu domicilio, tanto
              para el Interior Provincial como para la Ciudad Capital.
            </p>

            {/* 2. Usa la variable importada aquí */}
            <div className="card-map-placeholder">
              <img
                src={mapaFormosa}
                alt="Mapa de Formosa"
                className="map-image"
              />
            </div>

            <div className="card-logos-placeholder">
              {/* Usa otra variable aquí cuando tengas los logos */}
              <img
                src={logosGobierno}
                alt="Logos Ministerio y Gobierno"
                className="logos-image"
              />
            </div>
          </div>

          <div className="news-card center-card">
            <div className="card-header-center">
              <h5 className="blue-text">
                Si ya sos paciente y querés sacar
                <br />
                turno de manera presencial
              </h5>
            </div>

            <div className="card-list-item">
              <span className="cross-icon">✚</span>
              <p>
                Se estará brindando turnos con cada especialista según nuestro{" "}
                <strong>calendario mensual</strong>. Debés traer:
              </p>
            </div>

            <div className="info-pills-grid">
              <div className="info-pill">
                <span className="pill-icon">👤</span> D.N.I. del paciente
              </div>
              <div className="info-pill">
                <span className="pill-icon">📋</span> Interconsulta Médica
              </div>
              <div className="info-pill">
                <span className="pill-icon">🕒</span> A partir de las 06:00 Hs.
              </div>
              <div className="info-pill">
                <span className="pill-icon">📍</span> Av. 28 de Junio N° 250
              </div>
            </div>

            <div className="card-list-item">
              <span className="cross-icon">✚</span>
              <p>
                En casos de pacientes del Hospital de Alta Complejidad, debés
                traer <strong>ficha de derivación</strong>.
              </p>
            </div>

            <div className="card-footer-text">
              Hospital Interdistrital <strong>Evita</strong>
            </div>
          </div>

          <div className="news-card">
            <div className="card-header-line">
              <h4 className="blue-text uppercase">IMPORTANTE ❕</h4>
            </div>

            <div className="important-items">
              <div className="important-item">
                <div className="imp-icon">📴</div>
                <p>
                  Los turnos <strong>no</strong> se brindan de manera telefónica
                  a pacientes.
                </p>
              </div>

              <div className="important-item">
                <div className="imp-icon">📅</div>
                <p>
                  En el caso de <strong>reagendar</strong> un turno ya
                  programado, deberás dar aviso de manera presencial o
                  telefónicamente a las líneas disponibles, con almenos 24 horas
                  de anticipación.
                </p>
              </div>
            </div>

            <div className="important-phone">
              <span className="phone-icon-large">📞</span>
              <strong>4445561 - 4445541</strong>
            </div>

            <div className="card-footer-text right-align">
              Hospital Interdistrital <strong>Evita</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
