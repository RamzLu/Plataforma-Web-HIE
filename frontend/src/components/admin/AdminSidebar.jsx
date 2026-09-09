import React, { useState } from "react";
import { LayoutDashboard, Users, ShieldCheck, FileClock } from "lucide-react";
import avatarHospital from "../../assets/logoHospitalEvita-blanco.png";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Agrupamos los items en menuSections para respetar exactamente la estructura del mapa
  const menuSections = [
    {
      title: "Administración",
      items: [
        { id: "dashboard", label: "Dashboard General", icon: <LayoutDashboard /> },
        { id: "usuarios", label: "Gestión de Usuarios", icon: <Users /> },
        { id: "roles", label: "Roles y Permisos", icon: <ShieldCheck /> },
        { id: "auditoria", label: "Auditoría de Cambios", icon: <FileClock /> },
      ],
    },
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Área del Logo / Distintivo */}
      <div className="admin-sidebar-header">
        <div className="admin-logo-container-inner">
          <div className="admin-logo">
            <img
              src={avatarHospital}
              alt="Logo Hospital Evita"
              className="admin-logo-img"
            />
            {!isCollapsed && (
              <div className="admin-logo-text-box">
                <span className="logo-title">HOSPITAL INTERDISTRITAL</span>
                <span className="logo-subtitle">EVITA FORMOSA</span>
              </div>
            )}
          </div>
        </div>
        <button
          className="admin-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isCollapsed ? (
              <>
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </>
            ) : (
              <>
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </>
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="admin-sidebar-menu-title">PANEL DE ADMINISTRACIÓN</div>
      )}

      {/* Navegación por Secciones adaptada a admin */}
      <nav className="admin-nav">
        {menuSections.map((section, idx) => (
          <div className="admin-nav-group" key={idx}>
            {!isCollapsed && (
              <div className="admin-nav-group-title">{section.title}</div>
            )}
            <ul>
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className={activeTab === item.id ? "active" : ""}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : ""}
                >
                  <div className="admin-nav-icon">{item.icon}</div>
                  {!isCollapsed && (
                    <span className="admin-nav-label">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;