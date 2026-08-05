import React from "react";
import { Link } from "react-router-dom";
import { newsData } from "../data/newsData";
import "./HomeNewsPreview.css";

const HomeNewsPreview = () => {
  const latestNews = newsData.slice(0, 3);

  return (
    <section className="home-news-preview">
      <div className="preview-container">
        <div className="preview-header">
          <h2 className="preview-title">Nuevas Noticias</h2>
          <Link to="/noticias" className="preview-view-all">
            Ver todas
          </Link>
        </div>

        <div className="preview-grid">
          {latestNews.map((news) => (
            <div key={news.id} className="preview-card">
              <div className="preview-img-container">
                {/* Aseguramos que siempre cargue la primera foto del arreglo */}
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
                  Leer más
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeNewsPreview;
