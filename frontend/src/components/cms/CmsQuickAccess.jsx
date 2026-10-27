import React from "react";
import "../../styles/components/cms/CmsDashboard.css"; 

const CmsQuickAccess = ({ onActionClick }) => {
  const actions = [
    {
      id: "noticias",
      title: "Crear noticia",
      colorClass: "quick-blue",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: "documentacion", 
      title: "Subir documento",
      colorClass: "quick-purple",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
      )
    },
    {
      id: "profesionales",
      title: "Añadir profesional",
      colorClass: "quick-indigo",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      )
    },
    {
      id: "capacitaciones",
      title: "Nueva capacitación",
      colorClass: "quick-emerald",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      )
    },
    {
      id: "residencias",
      title: "Nueva residencia",
      colorClass: "quick-amber",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      )
    },
    {
      id: "especialidades",
      title: "Nueva especialidad",
      colorClass: "quick-rose",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      id: "institucional",
      title: "Nueva autoridad",
      colorClass: "quick-cyan",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <path d="M9 22v-4h6v4"></path>
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="cms-dashboard-card" style={{ marginBottom: "30px", border: "none", padding: "25px", backgroundColor: "#ffffff", borderRadius: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 className="cms-card-title" style={{ margin: 0, fontSize: "1.25rem", color: "#0c2340" }}>Accesos rápidos</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "5px", marginBottom: 0 }}>
          Las acciones más frecuentes para gestionar el portal.
        </p>
      </div>
      
      <div className="cms-quick-access-grid">
        {actions.map((action) => (
          <div 
            key={action.id} 
            className={`quick-action-card ${action.colorClass}`}
            onClick={() => onActionClick && onActionClick(action.id, true)}
          >
            <div className="quick-action-icon">
              {action.icon}
            </div>
            <span className="quick-action-title">{action.title}</span>
            <div className="quick-action-plus">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="12" y2="19"></line>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CmsQuickAccess;