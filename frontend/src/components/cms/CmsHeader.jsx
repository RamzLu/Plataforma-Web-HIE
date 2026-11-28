import { LogOut, User, Bell } from "lucide-react";

const CmsHeader = ({ userName, onLogoutClick, activeTab }) => {
  // Función para darle el formato correcto y en mayúsculas a la pestaña actual
  const formatTabName = (tabId) => {
    if (!tabId) return "DASHBOARD";
    const names = {
      dashboard: "DASHBOARD",
      noticias: "NOTICIAS",
      documentacion: "DOCUMENTACIÓN",
      banners: "CONTENIDO GRÁFICO",
      "contenido-grafico": "CONTENIDO GRÁFICO",
      institucional: "INSTITUCIONAL",
      profesionales: "PROFESIONALES",
      especialidades: "ESPECIALIDADES",
      residencias: "RESIDENCIAS",
      capacitaciones: "CAPACITACIONES",
      capsulas: "CÁPSULAS",
    };
    return names[tabId] || tabId.toUpperCase();
  };

  return (
    <header className="cms-header">
      <div className="cms-header-left">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>

        <div className="cms-header-breadcrumb">
          <span className="breadcrumb-root">PANEL CMS</span>
          <span className="breadcrumb-separator" style={{ margin: "0 8px" }}>
            /
          </span>
          <span className="breadcrumb-current">{formatTabName(activeTab)}</span>
        </div>
      </div>

      <div className="cms-header-right">
        {/* Botón de notificaciones idéntico a Admin */}
        <button className="cms-notification-btn" title="Notificaciones" type="button">
          <Bell size={20} />
        </button>

        {/* Perfil de Usuario idéntico a Admin */}
        <div className="cms-user-profile">
          <div className="cms-user-avatar">
            <User size={20} />
          </div>
          <div className="cms-user-info">
            <span className="cms-user-name">{userName}</span>
            <span className="cms-user-role">Editor CMS</span>
          </div>
        </div>

        {/* Botón de Logout directo idéntico a Admin */}
        <button
          onClick={onLogoutClick}
          className="cms-dropdown-btn"
          title="Cerrar Sesión"
          type="button"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
};

export default CmsHeader;