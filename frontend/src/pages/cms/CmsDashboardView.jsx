import React from "react";
import CmsQuickAccess from "../../components/cms/CmsQuickAccess";
import CmsRecentActivity from "../../components/cms/CmsRecentActivity";
import "../../styles/components/cms/CmsDashboard.css";

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

// --- LÓGICA PARA CALCULAR LA DIFERENCIA SEMANAL REAL ---
const calculateWeeklyDelta = (list) => {
  if (!list || !Array.isArray(list)) return 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let currentWeekCount = 0;
  let previousWeekCount = 0;

  list.forEach(item => {
    if (!item.createdAt) return;
    const itemDate = new Date(item.createdAt);
    
    if (itemDate >= oneWeekAgo) {
      currentWeekCount++;
    } else if (itemDate >= twoWeeksAgo && itemDate < oneWeekAgo) {
      previousWeekCount++;
    }
  });

  return currentWeekCount - previousWeekCount;
};

// --- COMPONENTE PARA RENDERIZAR LA PÍLDORA (BADGE) DINÁMICA ---
const DeltaBadge = ({ diff, customText }) => {
  const isPositive = diff > 0;
  const isNeutral = diff === 0;
  const badgeClass = isPositive || isNeutral ? "positive" : "negative";

  let text = customText;
  if (!text) {
    if (diff > 0) text = `${diff} más que la sem. pasada`;
    else if (diff < 0) text = `${Math.abs(diff)} menos que sem. pasada`;
    else text = "Igual a la sem. pasada";
  }

  return (
    <div className={`stat-badge ${badgeClass}`}>
      {isPositive && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
      )}
      {diff < 0 && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
      )}
      {isNeutral && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      )}
      {text}
    </div>
  );
};

const CmsDashboardView = ({
  latestNews,
  newsList,
  docsList,
  dashboardStats,
  setSelectedNews,
  handleQuickAction,
  loading,
}) => {
  
  const noticias = dashboardStats?.contenidoPublicado || 0;
  const documentos = dashboardStats?.documentosActivos || 0;
  const profesionales = 42; 

  const borradores = dashboardStats?.borradores || 0;
  const totalContenido = noticias + borradores;
  const actividadPorcentaje = totalContenido > 0 ? Math.round((noticias / totalContenido) * 100) : 0;
  
  // Ejecutamos los cálculos reales con la data de la BD
  const noticiasDelta = calculateWeeklyDelta(newsList);
  const docsDelta = calculateWeeklyDelta(docsList);

  return (
    <div className="cms-dashboard-wrapper">

      <div className="cms-dashboard-stats-grid">
        
        {/* Tarjeta 1: Noticias */}
        <div className="stat-card-violet">
          <div className="stat-header">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            </div>
          </div>
          <h3 className="stat-value">{noticias}</h3>
          <p className="stat-label">Noticias publicadas</p>
          <div style={{ marginTop: "16px" }}>
            <DeltaBadge diff={noticiasDelta} />
          </div>
        </div>

        {/* Tarjeta 2: Documentos */}
        <div className="stat-card-violet">
          <div className="stat-header">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>
          <h3 className="stat-value">{documentos}</h3>
          <p className="stat-label">Documentos activos</p>
          <div style={{ marginTop: "16px" }}>
            <DeltaBadge diff={docsDelta} />
          </div>
        </div>

        {/* Tarjeta 3: Profesionales */}
        <div className="stat-card-violet">
          <div className="stat-header">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <h3 className="stat-value">{profesionales}</h3>
          <p className="stat-label">Profesionales listados</p>
          <div style={{ marginTop: "16px" }}>
            <DeltaBadge diff={2} customText="2 más que la sem. pasada" />
          </div>
        </div>

        {/* Tarjeta 4: Actividad CMS */}
        <div className="stat-card-violet">
          <div className="stat-header">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <h3 className="stat-value">{actividadPorcentaje}%</h3>
          <p className="stat-label">Tasa de publicación activa</p>
          <div style={{ marginTop: "16px" }}>
            <DeltaBadge diff={actividadPorcentaje >= 50 ? 1 : -1} customText={actividadPorcentaje >= 50 ? "Óptimo" : "Requiere atención"} />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN ORIGINAL DE NOTICIAS --- */}
      <div className="cms-dashboard-card" style={{ marginBottom: "30px", marginTop: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 className="cms-card-title" style={{ margin: 0 }}>Últimas Noticias del Portal</h3>
          <button className="cms-btn-outline" onClick={handleQuickAction} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", color: "#0c2340" }}>
            Gestionar todas
          </button>
        </div>
        
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{news.date}</span>
                      {news.updatedAt && news.createdAt && new Date(news.updatedAt) - new Date(news.createdAt) > 5000 && (
                        <span className="cms-edited-tag">(Editado)</span>
                      )}
                    </div>

                    <h4 className="cms-real-news-title">{news.title}</h4>

                    <p style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {cleanHtmlText(news.body[0]).substring(0, 80)}...
                    </p>
                  </div>
                </div>

                <button
                  className="cms-btn-ver-mas-fuera"
                  onClick={() => setSelectedNews(news)}
                >
                  <span>Ver comunicado completo</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: "#64748b", gridColumn: "1 / -1", textAlign: "center" }}>
              No hay noticias registradas.
            </p>
          )}
        </div>
      </div>

      <CmsQuickAccess onActionClick={handleQuickAction} />
      <CmsRecentActivity />
    </div>
  );
};

export default CmsDashboardView;