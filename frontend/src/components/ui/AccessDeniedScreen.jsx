import React from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "../../config/keycloak";
import "../../styles/ui/AccessDeniedScreen.css";

const AccessDeniedScreen = ({ userName }) => {
  const navigate = useNavigate();

  const tokenName = keycloak?.tokenParsed?.name;
  const preferredUsername = keycloak?.tokenParsed?.preferred_username;
  const email = keycloak?.tokenParsed?.email;

  // Solo mostramos el nombre público legible, sin roles ni identificadores técnicos de Keycloak
  const sessionDisplayName =
    tokenName || preferredUsername || email || userName || "Usuario autenticado";

  const handleLogoutToKeycloak = () => {
    localStorage.removeItem("admin_active_tab");
    localStorage.removeItem("cms_active_tab");

    if (keycloak && typeof keycloak.logout === "function") {
      keycloak.logout({ redirectUri: window.location.href });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon-badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 className="access-denied-title">Acceso Restringido</h2>

        <p className="access-denied-description">
          Tu cuenta no dispone de las autorizaciones requeridas para acceder a este sector. Si consideras que se trata de un error, por favor comunícate con el área de soporte del hospital.
        </p>

        {/* Sesión actual (neutral y segura, sin filtración de roles ni identificadores técnicos) */}
        <div className="access-denied-session-box">
          <span className="access-denied-session-label">Sesión iniciada</span>
          <div className="access-denied-session-user">
            <span className="access-denied-status-dot"></span>
            <span className="access-denied-session-name">
              {sessionDisplayName}
            </span>
          </div>
        </div>

        <div className="access-denied-actions">
          {/* Botón 1: Cerrar sesión para cambiar de cuenta o reingresar con el usuario correspondiente */}
          <button
            type="button"
            onClick={handleLogoutToKeycloak}
            className="access-denied-btn access-denied-btn-logout"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar sesión / Cambiar de cuenta
          </button>

          {/* Botón 2: Volver al portal público del hospital */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="access-denied-btn access-denied-btn-secondary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Volver al Portal Público
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedScreen;
