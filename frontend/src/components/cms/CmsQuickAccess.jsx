import React from "react";

const CmsQuickAccess = ({ onActionClick }) => {
  const actions = [
    {
      id: "crear-noticia",
      title: "Crear noticia",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
    },
    {
      id: "subir-documento",
      title: "Subir documento",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
      ),
    },
    {
      id: "nuevo-banner",
      title: "Nuevo banner",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      ),
    },
    {
      id: "anadir-profesionales",
      title: "Añadir profesionales",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="cms-dashboard-card quick-access-card">
      <div className="quick-access-header">
        <h3 className="cms-card-title">Accesos rápidos</h3>
        <p className="quick-access-subtitle">
          Las acciones más frecuentes para gestionar el portal.
        </p>
      </div>

      <div className="quick-access-grid">
        {actions.map((action) => (
          <div
            key={action.id}
            className="quick-access-item"
            onClick={() =>
              onActionClick
                ? onActionClick(action.id)
                : alert(`Redirección pendiente para: ${action.title}`)
            }
          >
            <div className="quick-access-top">
              <div className="quick-access-icon">{action.icon}</div>
            </div>
            <div className="quick-access-bottom">
              <span className="quick-access-title">{action.title}</span>
              <span className="quick-access-plus">+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CmsQuickAccess;
