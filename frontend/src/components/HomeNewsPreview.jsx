import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/components/HomeNewsPreview.css";
import AnimatedContent from "./AnimatedContent";

// Función sencilla para limpiar el HTML que viene del editor de texto del CMS
const cleanHtmlText = (html) => {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

const HomeNewsPreview = () => {
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestNews = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/cms/noticias");
        if (response.ok) {
          const data = await response.json();
          // Ordenamos por ID descendente para tener las más nuevas y tomamos solo 3
          const ultimasTres = data
            .sort((a, b) => b.id - a.id)
            .slice(0, 3);
          setLatestNews(ultimasTres);
        }
      } catch (error) {
        console.error("Error al cargar noticias del inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  return (
    <section className="home-news-preview">
      <div className="preview-container">
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="preview-header">
            <div className="preview-title-group">
              <span className="preview-subtitle">
                NOVEDADES INSTITUCIONALES
              </span>
              <h2 className="preview-title">NUEVAS NOTICIAS</h2>
            </div>
            <Link to="/noticias" className="preview-view-all">
              <span>VER TODAS</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </AnimatedContent>

        <div className="preview-scroll-wrapper">
          {loading ? (
            <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
              <div className="cms-spinner" style={{ borderColor: "#cbd5e1", borderTopColor: "#006eb3" }}></div>
              <p style={{ marginTop: "15px", color: "#64748b", fontWeight: "600" }}>Cargando últimas noticias...</p>
            </div>
          ) : latestNews.length > 0 ? (
            <div className="preview-grid">
              {latestNews.map((news, index) => {
                const plainText = cleanHtmlText(news.contenido || news.body || "");
                const excerpt = plainText.length > 100 ? plainText.substring(0, 100) + "..." : plainText;
                const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString("es-AR") : "Reciente";

                return (
                  <AnimatedContent
                    key={news.id}
                    distance={45}
                    direction="vertical"
                    delay={0.15 + index * 0.12}
                    threshold={0.1}
                  >
                    <article className="preview-card">
                      <div className="preview-img-container">
                        {news.images && news.images.length > 0 && (
                          <img
                            src={news.images[0]}
                            alt={news.titulo || news.title}
                            className="preview-img"
                          />
                        )}
                      </div>
                      <div className="preview-content">
                        <span className="preview-date">{date}</span>
                        <h4 className="preview-card-title">{news.titulo || news.title}</h4>
                        <p className="preview-excerpt">{excerpt}</p>
                        <Link to="/noticias" className="preview-read-more">
                          <span>MÁS INFORMACIÓN</span>
                          <span className="arrow">→</span>
                        </Link>
                      </div>
                    </article>
                  </AnimatedContent>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay publicaciones recientes.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeNewsPreview;