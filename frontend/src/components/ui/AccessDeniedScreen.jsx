import React from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "../../config/keycloak";
import "../../styles/ui/AccessDeniedScreen.css";

const hasKeycloakRole = (rolesToCheck) => {
  const realmRoles = (keycloak?.tokenParsed?.realm_access?.roles || []).map((r) =>
    r.toLowerCase()
  );
  const clientRoles = Object.values(keycloak?.tokenParsed?.resource_access || {})
    .flatMap((r) => r?.roles || [])
    .map((r) => r.toLowerCase());
  const allRoles = [...new Set([...realmRoles, ...clientRoles])];

  return rolesToCheck.some(
    (role) =>
      keycloak?.hasRealmRole?.(role) ||
      keycloak?.hasResourceRole?.(role) ||
      allRoles.includes(role.toLowerCase())
  );
};

const AccessDeniedScreen = ({ userName, requiredPanel = "este panel" }) => {
  const navigate = useNavigate();

  const tokenName = keycloak?.tokenParsed?.name;
  const preferredUsername = keycloak?.tokenParsed?.preferred_username;
  const email = keycloak?.tokenParsed?.email;

  const sessionDisplayName = tokenName
    ? preferredUsername && preferredUsername !== tokenName
      ? `${tokenName} (${preferredUsername})`
      : tokenName
    : preferredUsername || email || userName || "Usuario autenticado";

  const hasCmRole = hasKeycloakRole(["cms", "cm"]);
  const hasAdminRole = hasKeycloakRole(["admin-hief", "admin-hie", "admin"]);

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
        <div className="access-denied-icon-badge">
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

        <h2 className="access-denied-title">Acceso Denegado</h2>

        <p className="access-denied-description">
          Tu cuenta actual no cuenta con los permisos necesarios para acceder a{" "}
          <strong>{requiredPanel}</strong>.
        </p>

        {/* 1ro: Nombre de la sesión actual */}
        <div className="access-denied-session-box">
          <span className="access-denied-session-label">Sesión actual</span>
          <div className="access-denied-session-user">
            <span className="access-denied-status-dot"></span>
            <span className="access-denied-session-name">
              {sessionDisplayName}
            </span>
            {hasCmRole && <span className="access-denied-role-tag">Rol: CM</span>}
            {hasAdminRole && (
              <span className="access-denied-role-tag">Rol: Admin</span>
            )}
          </div>
        </div>

        <div className="access-denied-actions">
          {/* 3ro: Botón que redirige según el rol de la sesión actual */}
          {hasCmRole && (
            <button
              type="button"
              onClick={() => navigate("/cms")}
              className="access-denied-btn access-denied-btn-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Ir a la página de CM
            </button>
          )}

          {hasAdminRole && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="access-denied-btn access-denied-btn-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Ir a la página de Admin
            </button>
          )}

          {/* 2do: Botón que cierra la sesión y envía de nuevo al login de Keycloak */}
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
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar sesión e ir al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedScreen;

