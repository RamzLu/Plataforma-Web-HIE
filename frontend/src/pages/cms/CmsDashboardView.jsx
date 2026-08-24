import React from "react";
import CmsQuickAccess from "../../components/cms/CmsQuickAccess";
import CmsRecentActivity from "../../components/cms/CmsRecentActivity";

const cleanHtmlText = (html) => {
  if (!html) return "";

  let text = html;

  // 1. Detectar listas ordenadas (<ol>) y aplicar un contador
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, innerOl) => {
    let count = 1;
    // Por cada <li> dentro de este <ol>, ponemos el número actual y sumamos 1
    return innerOl.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, innerLi) => {
      return `\n${count++}. ${innerLi}`;
    });
  });

  // 2. Detectar listas desordenadas (<ul>) y aplicar viñetas
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, innerUl) => {
    return innerUl.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, innerLi) => {
      return `\n• ${innerLi}`;
    });
  });

  // 3. Limpiar el resto del HTML y emprolijar los espacios
  return text
    .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, "\n") // Saltos de línea al terminar párrafos
    .replace(/<[^>]*>?/gm, "")                  // Elimina cualquier otra etiqueta HTML
    .replace(/&nbsp;/g, " ")                    // Quita los espacios codificados
    .replace(/[ \t]+/g, " ")                    // Agrupa espacios horizontales vacíos
    .replace(/\n\s*\n/g, "\n")                  // Evita que queden dobles saltos de línea gigantes
    .trim();                                    // Limpia los bordes
};
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

                {/* APLICAMOS LA FUNCIÓN Y EL AJUSTE AQUÍ */}
                <p
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {cleanHtmlText(news.body[0]).substring(0, 80)}...
                </p>

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

      {/* 4. Actividad Reciente */}
      <CmsRecentActivity />
    </>
  );
};

export default CmsDashboardView;
