import React from "react";
import "./ContactoPage.css";
import Breadcrumb from "../components/Breadcrumb";

// Imágenes institucionales
import fotoAtencion from "../assets/fotoContacto.jpg";
import fotoFachadaHIE from "../assets/fotoFachadaHIE2.jpg";

const ContactoPage = () => {
  return (
    <main className="contacto-page">
      {/* =========================================
          1. SECCIÓN SUPERIOR HERO
      ========================================= */}
      <div className="contacto-container">
        <section className="contacto-hero">
          <div className="contacto-hero-left">
            <Breadcrumb currentPage="Contacto" />
            <h1 className="contacto-title">CONTACTO</h1>
            <p className="contacto-description">
              Para comunicarte con las diferentes áreas del Hospital
              Interdistrital Evita, utiliza los medios oficiales habilitados.
              Para consultas generales, llamá al teléfono central:{" "}
              <strong>(3704) 436-100</strong>.
            </p>
            <p className="contacto-subtext">¡Estamos para ayudarte!</p>
          </div>

          <div className="contacto-hero-right">
            <div className="contacto-image-wrapper">
              <img
                src={fotoAtencion}
                alt="Atención al paciente - Hospital Evita"
                className="contacto-img"
              />
              <div className="contacto-overlay-box"></div>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================
          2. SECCIÓN FULL WIDTH: CÓMO LLEGAR Y CANALES
      ========================================= */}
      <section className="location-fullwidth-section">
        {/* BLOQUE SUPERIOR CON FACHADA */}
        <div
          className="location-hero-banner"
          style={{ backgroundImage: `url(${fotoFachadaHIE})` }}
        >
          <div className="location-banner-overlay">
            <div className="location-banner-text">
              <h2>CÓMO LLEGAR Y CANALES OFICIALES</h2>
              <p>
                Visite nuestras instalaciones o reciba asistencia a través de
                nuestros medios de comunicación habilitados.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO INFERIOR */}
        <div className="location-bottom-content">
          <div className="location-bottom-inner">
            {/* GRILLA SUPERIOR: DIRECCIÓN + MAPA */}
            <div className="location-grid-top">
              {/* TARJETA BLANCA DE DIRECCIÓN */}
              <div className="address-card-box">
                <h3>¿Dónde nos encontramos?</h3>
                <p>
                  Nos encontramos ubicados en la{" "}
                  <strong>Avenida José de Luca Barberis al 250</strong>, justo
                  en la esquina con la calle <strong>Coronel Bogado</strong>.
                </p>
                <p className="address-sub">
                  Nuestro edificio es grande y de fácil acceso.
                </p>
              </div>

              {/* MAPA INTERACTIVO */}
              <div className="map-frame-box">
                <iframe
                  title="Ubicación Hospital Interdistrital Evita"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5137.059081367517!2d-58.20186001051813!3d-26.180984538089557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945caf5c8f477e01%3A0x3ad3344cf5acca56!2sHospital%20Interdistrital%20Evita!5e0!3m2!1ses-419!2sar!4v1786376854376!5m2!1ses-419!2sar"
                  width="600"
                  height="450"
                  className="map-iframe"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* SECCIÓN TRANSPORTE (REDISEÑO MINIMALISTA Y UNIFICADO) */}
            <div className="transport-unified-card">
              {/* COLUMNA 1: COLECTIVOS */}
              <div className="transport-col">
                <div className="transport-col-header">
                  <svg
                    className="transport-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="3" width="18" height="16" rx="2"></rect>
                    <path d="M3 11h18"></path>
                    <path d="M19 19v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2"></path>
                    <path d="M7 19v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2"></path>
                    <circle cx="7.5" cy="15.5" r="1.5"></circle>
                    <circle cx="16.5" cy="15.5" r="1.5"></circle>
                  </svg>
                  <h3>EN COLECTIVO</h3>
                </div>

                <ul className="transport-list">
                  <li>
                    <span className="line-tag">LÍNEA B</span>
                    <p>
                      Lo deja justo en la <strong>puerta principal</strong>.
                    </p>
                  </li>
                  <li>
                    <span className="line-tag">LÍNEA D</span>
                    <p>
                      Lo deja a <strong>dos cuadras</strong>, caminando por una
                      vereda amplia y segura.
                    </p>
                  </li>
                  <li>
                    <span className="line-tag">LÍNEA E</span>
                    <p>
                      Lo deja por la <strong>C. Juan Manuel de Rosas</strong> (a
                      dos cuadras de la Av. Barberis).
                    </p>
                  </li>
                  <li>
                    <span className="line-tag">LÍNEA K</span>
                    <p>
                      Lo deja en la esquina de{" "}
                      <strong>Av. Néstor Kirchner y Barberis</strong>.
                    </p>
                  </li>
                </ul>
              </div>

              {/* DIVISOR VERTICAL */}
              <div className="transport-col-divider"></div>

              {/* COLUMNA 2: TAXI / REMÍS */}
              <div className="transport-col">
                <div className="transport-col-header">
                  <svg
                    className="transport-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M18.5 9l-1.8-3.6C16.4 4.8 15.8 4.5 15 4.5H9c-.8 0-1.4.3-1.7.9L5.5 9H3v7h2c0 1.1.9 2 2 2s2-.9 2-2h6c0 1.1.9 2 2 2s2-.9 2-2h2V9h-2.5z"></path>
                    <circle cx="7.5" cy="13.5" r="1.5"></circle>
                    <circle cx="16.5" cy="13.5" r="1.5"></circle>
                  </svg>
                  <h3>EN REMÍS O TAXI</h3>
                </div>

                <div className="taxi-info-box">
                  <p>
                    Indíquele al chofer que su destino es el{" "}
                    <strong>Hospital Interdistrital Evita</strong>, ingresando
                    por la{" "}
                    <strong>entrada principal sobre la Avenida Barberis</strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactoPage;
