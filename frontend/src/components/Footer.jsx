import React from "react";
import "./Footer.css";

// Importa el logo del hospital y el de los ministerios/gobierno
// Asegúrate de tener estas imágenes en tu carpeta frontend/src/assets/
import logoHospital from "../assets/pngIcon.png";
import logosGobierno from "../assets/logosGobierno.png"; // Reemplaza con el nombre de tu archivo

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        {/* Columna 1: Identidad del Hospital */}
        <div className="footer-col brand-col">
          <img
            src={logoHospital}
            alt="Logo Hospital Interdistrital Evita"
            className="footer-logo"
          />
          <p className="footer-description">
            Brindamos atención médica de excelencia, gratuita y accesible para
            toda la comunidad. Salud pública conectada.
          </p>
        </div>

        {/* Columna 2: Vías de Contacto de alta legibilidad */}
        <div className="footer-col contact-col">
          <h3 className="footer-heading">INFORMACIÓN DE CONTACTO</h3>
          <ul className="footer-contact-list">
            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
              <a
                href="tel:+5493704673728"
                aria-label="Llamar al teléfono +54 9 3704673728"
              >
                +54 9 3704673728
              </a>
            </li>

            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0-5.5 8.28"></path>
                </svg>
              </span>
              <a
                href="mailto:portalevita@gmail.com"
                aria-label="Enviar correo a portalevita@gmail.com"
              >
                portalevita@gmail.com
              </a>
            </li>

            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </span>
              <span aria-label="Dirección: Avenida 28 de Junio Número 250, Formosa">
                Av. 28 de Junio N° 250, Formosa
              </span>
            </li>
          </ul>
        </div>

        {/* Columna 3: Logos Gubernamentales */}
        <div className="footer-col gov-col">
          <h3 className="footer-heading">RESPALDO INSTITUCIONAL</h3>
          <img
            src={logosGobierno}
            alt="Ministerio de Desarrollo Humano y Gobierno de Formosa"
            className="footer-gov-logo"
          />
        </div>
      </div>

      {/* Barra de copyright inferior */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Hospital Interdistrital Evita - Formosa.
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
