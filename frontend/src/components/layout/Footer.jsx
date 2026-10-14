import React from "react";
import { Link } from "react-router-dom";
import logosGobierno from "../../assets/logosGobierno.png";
import logoCompleto from "../../assets/logo-completo.png";
import "../../styles/layout/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hospital-footer" role="contentinfo" aria-label="Pie de página institucional">
      {/* Línea decorativa superior institucional con degradado */}
      <div className="footer-gradient-accent" aria-hidden="true"></div>

      <div className="footer-container">
        {/* Grilla Principal en 3 Columnas */}
        <div className="footer-main-grid">
          
        <section className="footer-col-brand" aria-label="Identidad Hospitalaria">
          <Link to="/" className="footer-logo-card" onClick={() => window.scrollTo(0, 0)}>
            <img 
              src={logoCompleto} 
              alt="Hospital Interdistrital Evita" 
              className="footer-main-logo-img" 
            />
          </Link>

          <p className="footer-brand-mission">
            Brindamos atención médica de excelencia, gratuita y accesible para toda la comunidad formoseña y la región. Centro de referencia en alta complejidad, docencia e investigación aplicada.
          </p>
        </section>

          {/* COLUMNA 2: Canales Digitales Oficiales */}
          <section className="footer-col-social" aria-labelledby="heading-canales-oficiales">
            <h2 id="heading-canales-oficiales" className="footer-col-heading">CANALES OFICIALES</h2>
            <div className="footer-col-divider"></div>
            <p className="footer-col-description">
              Siga nuestras novedades sobre campañas sanitarias y partes de salud en redes:
            </p>

            <div className="social-links-container">
              {/* Facebook */}
              <a
                href="https://facebook.com/redevitaformosa"
                target="_blank"
                rel="noopener noreferrer"
                className="social-card-btn facebook-card"
              >
                <div className="social-card-left">
                  <div className="social-icon-box" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="social-meta">
                    <span className="social-title">Facebook Oficial</span>
                    <span className="social-handle">@HospitalInterdistritalEvita</span>
                  </div>
                </div>
                <svg className="social-arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/redevitaformosa"
                target="_blank"
                rel="noopener noreferrer"
                className="social-card-btn instagram-card"
              >
                <div className="social-card-left">
                  <div className="social-icon-box" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div className="social-meta">
                    <span className="social-title">Instagram Oficial</span>
                    <span className="social-handle">@hospitalevitaformosa</span>
                  </div>
                </div>
                <svg className="social-arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>
          </section>

          {/* COLUMNA 3: Respaldo Institucional Gubernamental */}
          <aside className="footer-col-endorsement" aria-labelledby="heading-respaldo-institucional">
            <h2 id="heading-respaldo-institucional" className="footer-col-heading">RESPALDO INSTITUCIONAL</h2>
            <div className="footer-col-divider"></div>
            <p className="footer-col-description">
              Integrados al Sistema de Salud Provincial de Formosa:
            </p>
            
            <div className="endorsement-panel">
              <img 
                src={logosGobierno} 
                alt="Ministerio de Desarrollo Humano - Gobierno de Formosa" 
                className="footer-gov-img"
              />
            </div>
          </aside>

        </div>

        {/* Barra Inferior Centrada */}
        <div className="footer-bottom-bar">
          <div className="bottom-copyright">
            © {currentYear} <strong>Hospital Interdistrital Evita - Formosa.</strong> Todos los derechos reservados.
          </div>
          <div className="bottom-subtext">
            Red de Salud Pública Provincial • Ministerio de Desarrollo Humano • Gobierno de la Provincia de Formosa.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;