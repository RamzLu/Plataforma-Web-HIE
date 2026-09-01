import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/pages/ContactoPage.css";
import Breadcrumb from "../components/Breadcrumb";
import HospitalMapSection from "../components/HospitalMapSection";
import AnimatedContent from "../components/AnimatedContent";

// Imágenes institucionales
import fotoAtencion from "../assets/fotoContacto.jpg";
import fotoFachadaHIE from "../assets/fotoFachadaHIE2.jpg";

const ContactoPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetElement = document.getElementById(
        location.hash.replace("#", ""),
      );
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <main className="contacto-page">
      {/* 1. BANNER MOVIDO A LA PARTE SUPERIOR */}
      <section className="top-banner-section">
        <div
          className="location-hero-banner"
          style={{ backgroundImage: `url(${fotoFachadaHIE})` }}
        >
          <div className="location-banner-overlay">
            <div className="location-banner-text">
              <h2>CÓMO LLEGAR Y CANALES OFICIALES</h2>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TEXTO PRINCIPAL DE CONTACTO CON IMAGEN ORIGINAL */}
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

      {/* 3. SECCIÓN AZUL INSTITUCIONAL (MAPA Y TRANSPORTE) */}
      <section className="location-fullwidth-section">
        <div className="location-bottom-content">
          <div className="location-bottom-inner">
            <div className="location-grid-top">
              <AnimatedContent distance={50} direction="vertical" delay={0.1}>
                <div className="contact-info-split-transparent">
                  <div className="split-left">
                    <span className="split-title-bold">CONTACTANOS</span>
                    <span className="split-title-light">AQUÍ</span>
                  </div>

                  <div className="split-divider-white"></div>

                  <div className="split-right">
                    <p className="address-line-white">
                      Avenida José de Luca Barberis al 250
                    </p>
                    <p className="city-line-white">Formosa, Argentina</p>
                    <p className="phone-line-white">(3704) 436-100</p>

                    <div className="social-links-box-white">
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-item-white"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                        <span>Facebook</span>
                      </a>

                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-item-white"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="20"
                            height="20"
                            rx="5"
                            ry="5"
                          ></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        <span>Instagram</span>
                      </a>
                    </div>
                  </div>
                </div>
              </AnimatedContent>

              {/* MAPA AHORA ENVUELTO EN ANIMACIÓN */}
              <AnimatedContent distance={50} direction="vertical" delay={0.3}>
                <div className="map-frame-box">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7160.991248531538!2d-58.19816300000001!3d-26.180551000000005!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945caf5c8f477e01%3A0x3ad3344cf5acca56!2sHospital%20Interdistrital%20Evita!5e0!3m2!1ses-419!2sar!4v1786650025635!5m2!1ses-419!2sar"
                    width="100%"
                    height="100%"
                    loading="eager"
                    title="Mapa del Hospital"
                  ></iframe>
                </div>
              </AnimatedContent>
            </div>
            
            {/* TARJETA DE TRANSPORTE AHORA ENVUELTA EN ANIMACIÓN */}
            <AnimatedContent distance={60} direction="vertical" delay={0.4}>
              <div className="transport-unified-card">
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

                <div className="transport-col-divider"></div>

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
            </AnimatedContent>
          </div>
        </div>
      </section>
      
      <AnimatedContent distance={70} duration={1} threshold={0.2}>
        <HospitalMapSection />
      </AnimatedContent>
    </main>
  );
};

export default ContactoPage;