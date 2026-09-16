import React from "react";
import { LogOut, User, Bell } from "lucide-react";

const AdminHeader = ({ userName, onLogout, activeTab }) => {
  // Función adaptada para las pestañas de administración
  const formatTabName = (tabId) => {
    if (!tabId) return "DASHBOARD GENERAL";
    const names = {
      dashboard: "DASHBOARD GENERAL",
      usuarios: "GESTIÓN DE USUARIOS",
      roles: "ROLES Y PERMISOS",
      auditoria: "AUDITORÍA DE CAMBIOS",
    };
    return names[tabId] || tabId.toUpperCase();
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
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


        {/* Breadcrumb traído del CMS y adaptado */}
        <div className="admin-header-breadcrumb">
          <span className="breadcrumb-root">PANEL ADMIN</span>
          <span className="breadcrumb-separator" style={{ margin: "0 8px" }}>
            /
          </span>
          <span className="breadcrumb-current">{formatTabName(activeTab)}</span>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Botón de notificaciones traído del CMS */}
        <button className="admin-notification-btn" title="Notificaciones">
          <Bell size={20} />
        </button>

        {/* Perfil de Usuario original del Admin */}
        <div className="admin-user-profile">
          <div className="admin-user-avatar">
            <User size={20} />
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{userName}</span>
            <span className="admin-user-role">Administrador</span>
          </div>
        </div>


        {/* Botón de Logout original del Admin */}
        <button
          onClick={onLogout}
          className="admin-dropdown-btn"
          title="Cerrar Sesión"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
