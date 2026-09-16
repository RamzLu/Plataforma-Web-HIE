import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Stethoscope, 
  Contact, 
  FolderOpen, 
  GraduationCap, 
  Building2, 
  Image as ImageIcon, 
  UserCog, 
  FileClock, 
  Building,
  ChevronDown
} from "lucide-react";
import avatarHospital from "../../assets/logoHospitalEvita-blanco.png";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [expandedSection, setExpandedSection] = useState("Aprobación de Contenidos");

  // Matriz de navegación con mock data (pendingCount simulado)
  const menuSections = [
    {
      title: "General",
      items: [
        { id: "dashboard", label: "Dashboard General", icon: <LayoutDashboard /> },
      ],
    },
    {
      title: "Aprobación de Contenidos",
      items: [
        { id: "noticias", label: "Noticias", icon: <FileText />, pendingCount: 9 },
        { id: "servicios", label: "Servicios y Especialidades", icon: <Stethoscope />, pendingCount: 1 },
        { id: "profesionales", label: "Profesionales", icon: <Contact />, pendingCount: 2 }, 
        { id: "documentacion", label: "Documentación", icon: <FolderOpen />, pendingCount: 0 },
        { id: "capacitaciones", label: "Capacitaciones Públicas", icon: <GraduationCap /> },
        { id: "residencias", label: "Residencias", icon: <Building2 /> },
        { id: "graficos", label: "Contenido Gráfico", icon: <ImageIcon /> },
      ],
    },
    {
      title: "Gestión de Usuarios",
      items: [
        { id: "usuarios", label: "Gestión de Usuarios", icon: <UserCog /> }, 
        { id: "auditoria", label: "Auditoría de Cambios", icon: <FileClock /> },
      ],
    },
    {
      title: "Información Institucional",
      items: [
        { id: "institucional", label: "Datos Institucionales", icon: <Building /> },
      ],
    },
  ];

  const handleToggleSection = (title) => {
    if (isCollapsed) {
      setIsCollapsed(false); 
    }
    setExpandedSection((prev) => (prev === title ? null : title));
  };

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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Navegación tipo Acordeón */}
      <nav className="admin-nav">
        {menuSections.map((section, idx) => {
          const isGeneral = section.title === "General";
          const isExpanded = expandedSection === section.title;

          return (
            <div className="admin-nav-group" key={idx}>
              
              {!isGeneral && !isCollapsed && (
                <div 
                  className={`admin-nav-group-header ${isExpanded ? "active" : ""}`}
                  onClick={() => handleToggleSection(section.title)}
                >
                  <span className="admin-nav-group-title">{section.title}</span>
                  <ChevronDown size={16} className="accordion-icon" />
                </div>
              )}

              <ul className={`admin-nav-submenu ${isGeneral || isExpanded ? "expanded" : ""}`}>
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className={activeTab === item.id ? "active" : ""}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : ""}
                  >
                    <div className="admin-nav-item-left">
                      <div className="admin-nav-icon">{item.icon}</div>
                      {!isCollapsed && (
                        <span className="admin-nav-label">{item.label}</span>
                      )}
                    </div>

                    {/* RENDERIZADO CONDICIONAL ESTRICTO: Solo si pendingCount es mayor a 0 */}
                    {!isCollapsed && item.pendingCount > 0 && (
                      <span className="admin-nav-badge">
                        {item.pendingCount > 9 ? '+9' : item.pendingCount}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;