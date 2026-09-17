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
  ChevronDown // Agregamos la flecha desplegable
} from "lucide-react";
import avatarHospital from "../../assets/logoHospitalEvita-blanco.png";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Estado para manejar el acordeón (por defecto abierto en Aprobación de Contenidos)
  const [expandedSection, setExpandedSection] = useState("Aprobación de Contenidos");

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
        { id: "noticias", label: "Noticias", icon: <FileText /> },
        { id: "servicios", label: "Servicios y Especialidades", icon: <Stethoscope /> },
        { id: "profesionales", label: "Profesionales", icon: <Contact /> }, 
        { id: "documentacion", label: "Documentación", icon: <FolderOpen /> },
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

  // Función para manejar el clic en las categorías (Acordeón)
  const handleToggleSection = (title) => {
    if (isCollapsed) {
      setIsCollapsed(false); // Expande el menú completo si estaba minimizado
    }
    // Si la categoría ya estaba abierta, la cierra; si no, la abre ocultando la anterior
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

      {/* {!isCollapsed && (
        <div className="admin-sidebar-menu-title">PANEL DE ADMINISTRACIÓN</div>
      )} */}

      {/* Navegación tipo Acordeón */}
      <nav className="admin-nav">
        {menuSections.map((section, idx) => {
          // Lógica para excluir "General" de la mecánica del acordeón
          const isGeneral = section.title === "General";
          const isExpanded = expandedSection === section.title;

          return (
            <div className="admin-nav-group" key={idx}>
              
              {/* Solo renderizamos el botón de abrir/cerrar si NO es la categoría General */}
              {!isGeneral && !isCollapsed && (
                <div 
                  className={`admin-nav-group-header ${isExpanded ? "active" : ""}`}
                  onClick={() => handleToggleSection(section.title)}
                >
                  <span className="admin-nav-group-title">{section.title}</span>
                  <ChevronDown size={16} className="accordion-icon" />
                </div>
              )}

              {/* Si ES general o si es la categoría abierta (expanded), la lista recibe la clase .expanded */}
              <ul className={`admin-nav-submenu ${isGeneral || isExpanded ? "expanded" : ""}`}>
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
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;