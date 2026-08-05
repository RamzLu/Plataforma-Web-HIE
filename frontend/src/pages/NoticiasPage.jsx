import React, { useState, useRef } from "react";
import { newsData } from "../data/newsData";
import "./NoticiasPage.css";

// 1. IMPORTA LOS ÍCONOS DE TUS ARTÍCULOS
// Asegúrate de guardar estos 4 íconos en la carpeta frontend/src/assets/
import iconMama from "../assets/icon-mama.png";
import iconCorazon from "../assets/icon-corazon.png";
import iconDonacion from "../assets/icon-donacion-de-sangre.png";
import iconDengue from "../assets/icon-dengue.png";

// Datos de la nueva sección de artículos médicos
const medicalArticles = [
  {
    id: 1,
    title: "CÁNCER DE MAMA",
    color: "#e88e9f",
    icon: iconMama,
    link: "#",
  },
  {
    id: 2,
    title: "TU CORAZÓN",
    color: "#e32726",
    icon: iconCorazon,
    link: "#",
  },
  { id: 3, title: "DONACIÓN", color: "#b90000", icon: iconDonacion, link: "#" },
  { id: 4, title: "DENGUE", color: "#000000", icon: iconDengue, link: "#" },
];

const NewsCard = ({ news }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = news.body.length > 1 || news.body[0].length > 120;

  return (
    <article className="full-news-card">
      <div className="full-news-header">
        <div className="hospital-avatar">
          <img src="/logo.png" alt="Avatar Hospital" />
        </div>
        <div className="post-meta">
          <h3>Hospital Interdistrital Evita Formosa</h3>
          <span>{news.date} • 🌎</span>
        </div>
      </div>

      <div className="full-news-body">
        <h4 className="full-news-title">{news.title}</h4>

        {isExpanded ? (
          news.body.map((paragraph, idx) => (
            <p key={idx} className="expanded-text">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="clamped-text">{news.body[0]}</p>
        )}

        {isLong && (
          <button
            className="read-more-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      <div className="full-news-images">
        {news.images &&
          news.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${news.title} - foto ${index + 1}`}
            />
          ))}
      </div>
    </article>
  );
};

const NoticiasPage = () => {
  const sliderRef = useRef(null);
  const sortedNews = [...newsData].sort((a, b) => b.id - a.id);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 360;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="noticias-page">
      <div className="noticias-page-container">
        {/* SECCIÓN 1: NOTICIAS (CARRUSEL) */}
        <h1 className="page-title">Últimas Publicaciones</h1>

        <div className="slider-wrapper">
          <button
            className="slider-arrow left-arrow"
            onClick={() => scroll("left")}
          >
            &#10094;
          </button>

          <div className="news-slider" ref={sliderRef}>
            {sortedNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>

          <button
            className="slider-arrow right-arrow"
            onClick={() => scroll("right")}
          >
            &#10095;
          </button>
        </div>

        {/* SECCIÓN 2: ARTÍCULOS MÉDICOS */}
        <section className="medical-articles-section">
          <h2 className="articles-section-title">ARTÍCULOS MÉDICOS</h2>

          <div className="articles-grid">
            {medicalArticles.map((article) => (
              <a href={article.link} key={article.id} className="article-card">
                {/* El color del título cambia dinámicamente según los datos de arriba */}
                <h3 style={{ color: article.color }}>{article.title}</h3>
                <div className="article-icon-wrapper">
                  <img src={article.icon} alt={article.title} />
                </div>
                <span className="article-link-text">ver</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default NoticiasPage;
