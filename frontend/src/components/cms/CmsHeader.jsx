import React, { useState, useRef, useEffect } from "react";

const CmsHeader = ({ userName, isAdmin, onLogoutClick, activeTab }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <span className="breadcrumb-current">{formatTabName(activeTab)}</span>
        </div>
      </div>

      <div className="cms-header-right">
        
        {/* Menú Desplegable de Usuario */}
        <div className="cms-user-profile-container" ref={dropdownRef} style={{ position: 'relative' }}>
          
          <div 
            className="cms-user-profile" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: showDropdown ? '#f1f5f9' : 'transparent'
            }}
          >
            <div className="cms-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="cms-user-info">
              <span className="cms-user-name" style={{ color: '#0f172a', fontWeight: '700' }}>{userName}</span>
              <span className="cms-user-role" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {isAdmin ? "Administrador" : "Editor CMS"}
              </span>
            </div>
            {/* Flechita indicadora de menú */}
            <svg 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
              style={{ 
                color: '#64748b', 
                marginLeft: '4px', 
                transform: showDropdown ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s ease' 
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Menú Flotante */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              minWidth: '200px',
              zIndex: 100,
              overflow: 'hidden',
              padding: '8px 0',
              marginTop: '5px'
            }}>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  onLogoutClick();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default CmsHeader;