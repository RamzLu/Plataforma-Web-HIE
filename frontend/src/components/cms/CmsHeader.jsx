import React from "react";

const CmsHeader = ({ userName, isAdmin, onLogoutClick, activeTab }) => {
  // Función para darle el formato correcto y en mayúsculas a la pestaña actual
  const formatTabName = (tabId) => {
    if (!tabId) return "DASHBOARD";
    const names = {
      dashboard: "DASHBOARD",
      noticias: "NOTICIAS",
      documentacion: "DOCUMENTACIÓN",
      banners: "BANNERS",
      institucional: "INSTITUCIONAL",
      profesionales: "PROFESIONALES",
      capsulas: "CÁPSULAS",
      configuracion: "CONFIGURACIÓN"
    };
    return names[tabId] || tabId.toUpperCase();
  };

  return (
    <header className="cms-header">
      <div className="cms-header-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <div className="cms-header-breadcrumb">
          <span className="breadcrumb-root">PANEL CMS</span>
          <span className="breadcrumb-separator">/</span>
          {/* Aquí mostramos dinámicamente el nombre de la sección */}
          <span className="breadcrumb-current">{formatTabName(activeTab)}</span>
        </div>
      </div>

      <div className="cms-header-right">
        
        <button className="cms-notification-btn" title="Notificaciones">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>

        <div className="cms-user-profile">
          <div className="cms-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="cms-user-info">
            <span className="cms-user-name">{userName}</span>
            <span className="cms-user-role">
              {isAdmin ? "Administrador" : "Editor CMS"}
            </span>
          </div>
        </div>

        <button onClick={onLogoutClick} className="cms-dropdown-btn" title="Cerrar Sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default CmsHeader;