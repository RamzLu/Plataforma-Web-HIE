import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Image as ImageIcon, 
  Building,
  Contact,
  Video,
  Settings,
  ChevronDown
} from "lucide-react";
import avatarHospital from "../../assets/logoHospitalEvita-blanco.png";

const CmsSidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Estado para manejar el acordeón (por defecto abierto en Edición de Contenidos)
  const [expandedSection, setExpandedSection] = useState("Edición de Contenidos");

  const menuSections = [
    {
      title: "General",
      items: [
        { id: "dashboard", label: "Dashboard General", icon: <LayoutDashboard /> },
      ],
    },
    {
      title: "Edición de Contenidos",
      items: [
        { id: "noticias", label: "Noticias", icon: <FileText /> },
        { id: "documentacion", label: "Documentación", icon: <FolderOpen /> },
        { id: "banners", label: "Banners", icon: <ImageIcon /> },
      ],
    },
    {
      title: "Herramientas",
      items: [
        { id: "institucional", label: "Institucional", icon: <Building /> },
        { id: "profesionales", label: "Profesionales", icon: <Contact /> },
        { id: "capsulas", label: "Cápsulas", icon: <Video /> },
        { id: "configuracion", label: "Configuración", icon: <Settings /> },
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
    <aside className={`cms-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Área del Logo / Distintivo */}
      <div className="cms-sidebar-header">
        <div className="cms-logo-container-inner">
          <div className="cms-logo">
            <img
              src={avatarHospital}
              alt="Logo Hospital Evita"
              className="cms-logo-img"
            />
            {!isCollapsed && (
              <div className="cms-logo-text-box">
                <span className="logo-title">HOSPITAL INTERDISTRITAL</span>
                <span className="logo-subtitle">EVITA FORMOSA</span>
              </div>
            )}
          </div>
        </div>
        <button
          className="cms-collapse-btn"
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
      <nav className="cms-nav">
        {menuSections.map((section, idx) => {
          // Lógica para excluir "General" de la mecánica del acordeón
          const isGeneral = section.title === "General";
          const isExpanded = expandedSection === section.title;

          return (
            <div className="cms-nav-group" key={idx}>
              
              {/* Solo renderizamos el botón de abrir/cerrar si NO es la categoría General */}
              {!isGeneral && !isCollapsed && (
                <div 
                  className={`cms-nav-group-header ${isExpanded ? "active" : ""}`}
                  onClick={() => handleToggleSection(section.title)}
                >
                  <span className="cms-nav-group-title">{section.title}</span>
                  <ChevronDown size={16} className="accordion-icon" />
                </div>
              )}

              {/* Si ES general o si es la categoría abierta (expanded), la lista recibe la clase .expanded */}
              <ul className={`cms-nav-submenu ${isGeneral || isExpanded ? "expanded" : ""}`}>
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className={activeTab === item.id ? "active" : ""}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : ""}
                  >
                    <div className="cms-nav-icon">{item.icon}</div>
                    {!isCollapsed && (
                      <span className="cms-nav-label">{item.label}</span>
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

export default CmsSidebar;