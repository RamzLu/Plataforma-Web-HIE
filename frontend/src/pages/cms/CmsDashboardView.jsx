import React from "react";
import CmsQuickAccess from "../../components/cms/CmsQuickAccess";
import CmsRecentActivity from "../../components/cms/CmsRecentActivity"; // <-- NUEVO IMPORT

const CmsDashboardView = ({
  latestNews,
  dashboardStats,
  setSelectedNews,
  handleQuickAction,
}) => {
  return (
    <>
      {/* 1. Noticias Recientes */}
      <div className="cms-dashboard-card" style={{ marginBottom: "30px" }}>
        <h3 className="cms-card-title">Últimas Noticias del Portal</h3>
        <div className="cms-news-grid">
          {latestNews.map((news) => (
            <div key={news.id} className="cms-news-item">
              <div className="cms-news-img-placeholder">
                {news.images && news.images.length > 0 ? (
                  <img
                    src={news.images[0]}
                    alt={news.title}
                    className="cms-real-news-img"
                  />
                ) : (
                  <div className="cms-news-img-mock">
                    <span className="gold-text">HIE</span>
                    <span className="blue-sub">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="cms-news-content">
                <h4 className="cms-real-news-title">{news.title}</h4>
                <p>{news.body[0].substring(0, 80)}...</p>
                <button
                  className="cms-btn-ver-mas"
                  onClick={() => setSelectedNews(news)}
                >
                  VER MÁS
                </button>
                <span className="cms-news-time">{news.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Estadísticas */}
      <div className="cms-stats-grid">
        <div className="cms-stat-card">
          <span className="cms-stat-title">Contenido publicado</span>
          <span className="cms-stat-value">
            {dashboardStats.contenidoPublicado}
          </span>
          <span className="cms-stat-subtitle">+0% este mes</span>
        </div>
        <div className="cms-stat-card">
          <span className="cms-stat-title">Borradores guardados</span>
          <span className="cms-stat-value">
            {String(dashboardStats.borradores).padStart(2, "0")}
          </span>
          <span className="cms-stat-subtitle">Edición en progreso</span>
        </div>
        <div className="cms-stat-card">
          <span className="cms-stat-title">Documentos activos</span>
          <span className="cms-stat-value">
            {dashboardStats.documentosActivos}
          </span>
          <span className="cms-stat-subtitle">+0 esta semana</span>
        </div>
        <div className="cms-stat-card">
          <span className="cms-stat-title">Visitas al portal</span>
          <span className="cms-stat-value">{dashboardStats.visitas}</span>
          <span className="cms-stat-subtitle">+0% este mes</span>
        </div>
      </div>

      {/* 3. Accesos Rápidos */}
      <CmsQuickAccess onActionClick={handleQuickAction} />

      {/* 4. Actividad Reciente (NUEVO BLOQUE) */}
      <CmsRecentActivity />
    </>
  );
};

export default CmsDashboardView;
