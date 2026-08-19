import React from "react";
import { Link } from "react-router-dom";
import { newsData } from "../data/newsData";
import "../styles/components/HomeNewsPreview.css";
import AnimatedContent from "./AnimatedContent";

const HomeNewsPreview = () => {
  const latestNews = newsData.slice(0, 3);

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
          <div className="preview-grid">
            {latestNews.map((news, index) => (
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
                        alt={news.title}
                        className="preview-img"
                      />
                    )}
                  </div>
                  <div className="preview-content">
                    <span className="preview-date">{news.date}</span>
                    <h4 className="preview-card-title">{news.title}</h4>
                    <p className="preview-excerpt">
                      {news.body[0].substring(0, 100)}...
                    </p>
                    <Link to="/noticias" className="preview-read-more">
                      <span>MÁS INFORMACIÓN</span>
                      <span className="arrow">→</span>
                    </Link>
                  </div>
                </article>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeNewsPreview;
