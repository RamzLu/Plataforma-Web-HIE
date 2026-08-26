import React from "react";
import CmsQuickAccess from "../../components/cms/CmsQuickAccess";
import CmsRecentActivity from "../../components/cms/CmsRecentActivity";

const cleanHtmlText = (html) => {
  if (!html || typeof html !== "string") return "";
  let text = html;

  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, innerOl) => {
    let count = 1;
    return innerOl.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, innerLi) => {
      return `\n${count++}. ${innerLi}`;
    });
  });

  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, innerUl) => {
    return innerUl.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, innerLi) => {
      return `\n• ${innerLi}`;
    });
  });

  return text
    .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
};

const CmsDashboardView = ({
  latestNews,
  dashboardStats,
  setSelectedNews,
  handleQuickAction,
  loading,
}) => {
  return (
    <>
      <div className="cms-dashboard-card" style={{ marginBottom: "30px" }}>
        <h3 className="cms-card-title">Últimas Noticias del Portal</h3>
        <div className="cms-news-grid">
          {loading ? (
            <div className="cms-loading-container">
              <div className="cms-spinner"></div>
              <span className="cms-loading-text">
                Cargando últimas noticias...
              </span>
            </div>
          ) : latestNews && latestNews.length > 0 ? (
            latestNews.map((news) => (
              <div key={news.id} className="cms-news-card-wrapper">
                <div className="cms-news-item">
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
                    <div className="cms-news-date-badge">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{news.date}</span>
                      {news.updatedAt &&
                        news.createdAt &&
                        new Date(news.updatedAt) - new Date(news.createdAt) >
                          5000 && (
                          <span className="cms-edited-tag">(Editado)</span>
                        )}
                    </div>

                    <h4 className="cms-real-news-title">{news.title}</h4>

                    <p
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {cleanHtmlText(news.body[0]).substring(0, 80)}...
                    </p>
                  </div>
                </div>

                <button
                  className="cms-btn-ver-mas-fuera"
                  onClick={() => setSelectedNews(news)}
                >
                  <span>Ver comunicado completo</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p
              style={{
                color: "#64748b",
                gridColumn: "1 / -1",
                textAlign: "center",
              }}
            >
              No hay noticias registradas.
            </p>
          )}
        </div>
      </div>

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

      <CmsQuickAccess onActionClick={handleQuickAction} />
      <CmsRecentActivity />
    </>
  );
};

export default CmsDashboardView;
