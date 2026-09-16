import React from "react";
import { useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa"; // Usamos react-icons
import "../../styles/ui/WhatsAppButton.css";

const WhatsAppButton = () => {
  const location = useLocation();

  // Si prefieres que se muestre en todas las páginas, puedes quitar este condicional
  if (location.pathname !== "/") {
    return null;
  }

  const phoneNumber = "5493704673728";
  const message = "Hola, deseo realizar una consulta en el Hospital Interdistrital Evita";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="whatsapp-floating-container">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-capsule-btn"
        aria-label="Contactar por Atención Oficial de WhatsApp"
      >
        {/* Círculo con Ícono Oficial */}
        <span className="whatsapp-icon-circle" aria-hidden="true">
          <FaWhatsapp size={26} color="#059669" />
        </span>

        {/* Jerarquía de Texto */}
        <span className="whatsapp-text-block">
          <span className="whatsapp-kicker">
            ATENCIÓN OFICIAL
            <span className="whatsapp-status-dot" aria-hidden="true" />
          </span>
          <span className="whatsapp-main-label">Nuestro WhatsApp</span>
        </span>

        {/* Flecha de Acción / Indicador Direccional */}
        <span className="whatsapp-arrow-circle" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </a>
    </div>
  );
};

export default WhatsAppButton;