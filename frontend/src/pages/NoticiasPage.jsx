import React, { useState, useRef } from "react";
import { newsData } from "../data/newsData";
import "./NoticiasPage.css";

// Íconos
import iconMama from "../assets/icon-mama.png";
import iconCorazon from "../assets/icon-corazon.png";
import iconDonacion from "../assets/icon-donacion-de-sangre.png";
import iconDengue from "../assets/icon-dengue.png";

// imagenes de los folletos para los articulos medicos
import folletoCD1 from "../assets/folletoCD1.jpg";
import folletoCD2 from "../assets/folletoCD2.jpg";
import folletoCD3 from "../assets/folletoCD3.jpg";
import folletoCD4 from "../assets/folletoCD4.jpg";
import folletoCD5 from "../assets/folletoCD5.jpg";
import folletoEjemplo from "../assets/folletoCD5.jpg";

// 2. Datos expandidos para incluir la información del Modal
const medicalArticles = [
  {
    id: 1,
    title: "CÁNCER DE MAMA",
    color: "#e88e9f",
    icon: iconMama,
    subtitle: "Prevenir es curar. Chequeos anuales.",
    description: [
      "La detección temprana del cáncer de mama salva vidas. Realizarte los controles anuales y conocer tu cuerpo es fundamental para cuidar tu salud.",
    ],
    campaignImages: [
      folletoCD1,
      folletoCD2,
      folletoCD3,
      folletoCD4,
      folletoCD5,
    ],
  },
  {
    id: 2,
    title: "TU CORAZÓN",
    color: "#e32726",
    icon: iconCorazon,
    subtitle: "Cuidá tu motor de vida",
    description: [
      "Mantener una dieta equilibrada, hacer ejercicio regularmente y controlar tu presión arterial son pasos clave para un corazón sano.",
    ],
    campaignImages: [folletoEjemplo, folletoEjemplo, folletoEjemplo],
  },
  {
    id: 3,
    title: "DONACIÓN",
    color: "#b90000",
    icon: iconDonacion,
    subtitle: "Doná sangre. Salvá vidas",
    description: [
      "Hoy te compartimos todo lo que necesitás saber sobre la donación de sangre: quiénes pueden donar, cuáles son los requisitos básicos, algunos mitos y verdades, y por qué es tan importante que más personas se sumen a esta cadena de solidaridad.",
      "Donar sangre es un acto voluntario, seguro y fundamental.",
      "Una sola donación puede ayudar a varias personas.",
      "La sangre no se fabrica: solo puede obtenerse gracias a la generosidad de los donantes.",
    ],
    campaignImages: [
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
    ],
  },
  {
    id: 4,
    title: "DENGUE",
    color: "#000000",
    icon: iconDengue,
    subtitle: "Sin mosquito no hay dengue",
    description: [
      "Eliminar los criaderos de mosquitos en nuestros hogares es la principal medida de prevención contra el dengue, zika y chikungunya.",
    ],
    campaignImages: [
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
    ],
  },
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
  const modalSliderRef = useRef(null);

  const [selectedArticle, setSelectedArticle] = useState(null);

  // NUENO ESTADO: Índice de la imagen abierta en el Lightbox (null significa cerrado)
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const sortedNews = [...newsData].sort((a, b) => b.id - a.id);

  const scrollNews = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 360;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollModal = (direction) => {
    if (modalSliderRef.current) {
      const scrollAmount = modalSliderRef.current.offsetWidth;
      modalSliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // --- FUNCIONES DEL LIGHTBOX ---
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextLightboxImage = (e) => {
    e.stopPropagation(); // Evita que el clic cierre el visor
    if (selectedArticle) {
      setLightboxIndex(
        (prev) => (prev + 1) % selectedArticle.campaignImages.length,
      );
    }
  };

  const prevLightboxImage = (e) => {
    e.stopPropagation();
    if (selectedArticle) {
      setLightboxIndex(
        (prev) =>
          (prev - 1 + selectedArticle.campaignImages.length) %
          selectedArticle.campaignImages.length,
      );
    }
  };

  return (
    <main className="noticias-page">
      <div className="noticias-page-container">
        <h1 className="page-title">Últimas Publicaciones</h1>

        <div className="slider-wrapper">
          <button
            className="slider-arrow left-arrow"
            onClick={() => scrollNews("left")}
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
            onClick={() => scrollNews("right")}
          >
            &#10095;
          </button>
        </div>

        <section className="medical-articles-section">
          <h2 className="articles-section-title">ARTÍCULOS MÉDICOS</h2>
          <div className="articles-grid">
            {medicalArticles.map((article) => (
              <button
                key={article.id}
                className="article-card"
                onClick={() => setSelectedArticle(article)}
              >
                <h3 style={{ color: article.color }}>{article.title}</h3>
                <div className="article-icon-wrapper">
                  <img src={article.icon} alt={article.title} />
                </div>
                <span className="article-link-text">ver</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* POP-UP DE ARTÍCULOS */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2
                className="modal-title"
                style={{ color: selectedArticle.color }}
              >
                {selectedArticle.title}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedArticle(null)}
              >
                CERRAR Y VOLVER
              </button>
            </div>

            <div className="modal-body">
              <h3 className="modal-subtitle">{selectedArticle.subtitle}</h3>
              {selectedArticle.description.map((paragraph, idx) => (
                <p key={idx} className="modal-text">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="modal-slider-container">
              {selectedArticle.campaignImages.length > 3 && (
                <button
                  className="modal-arrow modal-left"
                  onClick={() => scrollModal("left")}
                >
                  &#10094;
                </button>
              )}

              <div className="modal-slider" ref={modalSliderRef}>
                {selectedArticle.campaignImages.map((img, idx) => (
                  // Añadimos el evento onClick para abrir el Lightbox
                  <div
                    className="modal-campaign-img"
                    key={idx}
                    onClick={() => openLightbox(idx)}
                  >
                    <img
                      src={img}
                      alt={`Campaña ${selectedArticle.title} ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              {selectedArticle.campaignImages.length > 3 && (
                <button
                  className="modal-arrow modal-right"
                  onClick={() => scrollModal("right")}
                >
                  &#10095;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          LIGHTBOX ESTILO FACEBOOK (VISOR DE IMÁGENES)
      ========================================= */}
      {lightboxIndex !== null && selectedArticle && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          {/* Cruz para cerrar */}
          <button className="lightbox-close" onClick={closeLightbox}>
            &times;
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flecha Izquierda */}
            <button
              className="lightbox-arrow lb-left"
              onClick={prevLightboxImage}
            >
              &#10094;
            </button>

            {/* Imagen Ampliada */}
            <img
              src={selectedArticle.campaignImages[lightboxIndex]}
              alt="Folleto ampliado"
              className="lightbox-img"
            />

            {/* Flecha Derecha */}
            <button
              className="lightbox-arrow lb-right"
              onClick={nextLightboxImage}
            >
              &#10095;
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default NoticiasPage;
