import React, { useState, useRef } from "react";
import { newsData } from "../data/newsData";
import "./NoticiasPage.css";

const NewsCard = ({ news }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Consideramos larga si tiene más de un párrafo o si el primero es muy largo
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
          // Usamos la nueva clase clamped-text para forzar uniformidad
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
      </div>
    </main>
  );
};

export default NoticiasPage;
