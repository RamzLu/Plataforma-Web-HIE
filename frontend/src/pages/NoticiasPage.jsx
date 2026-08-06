import React, { useState, useRef } from "react";
import { newsData } from "../data/newsData";
import "./NoticiasPage.css";
import Breadcrumb from "../components/Breadcrumb";

// Íconos
import iconMama from "../assets/icon-mama.png";
import iconCorazon from "../assets/icon-corazon.png";
import iconDonacion from "../assets/icon-donacion-de-sangre.png";
import iconDengue from "../assets/icon-dengue.png";
import avatarHospital from "../assets/iconEVITAface.jpg";

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

// Actualizamos NewsCard para que reciba las funciones de abrir Modal y Lightbox
const NewsCard = ({ news, onOpenNews, onOpenLightbox }) => {
  const isLong = news.body.length > 1 || news.body[0].length > 120;

  return (
    <article className="full-news-card">
      <div className="full-news-header">
        <div className="hospital-avatar">
          <img src={avatarHospital} alt="Avatar Hospital" />
        </div>
        <div className="post-meta">
          <h3>Hospital Interdistrital Evita Formosa</h3>
          <span>{news.date} • 🌎</span>
        </div>
      </div>

      <div className="full-news-body">
        <h4 className="full-news-title">{news.title}</h4>
        {/* El texto siempre se mantiene truncado en la tarjeta */}
        <p className="clamped-text">{news.body[0]}</p>

        {/* Botón que ahora abre el Pop-up */}
        {isLong && (
          <button className="read-more-btn" onClick={() => onOpenNews(news)}>
            Ver más
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
              className="clickable-img"
              onClick={() => onOpenLightbox(news.images, index)}
            />
          ))}
      </div>
    </article>
  );
};

const NoticiasPage = () => {
  const sliderRef = useRef(null);
  const modalSliderRef = useRef(null);

  // Estados para los Modales (Pop-ups)
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // Estado universal para el Lightbox (Visor de Imágenes)
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

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

  // --- FUNCIONES DEL LIGHTBOX UNIVERSAL ---
  const openLightbox = (images, index) =>
    setLightbox({ isOpen: true, images, index });
  const closeLightbox = () =>
    setLightbox({ isOpen: false, images: [], index: 0 });

  const nextLightboxImage = (e) => {
    e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
  };

  const prevLightboxImage = (e) => {
    e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  };

  return (
    <main className="noticias-page">
      <div className="noticias-page-container">
        <Breadcrumb currentPage="Noticias" />
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
              <NewsCard
                key={news.id}
                news={news}
                onOpenNews={setSelectedNews}
                onOpenLightbox={openLightbox}
              />
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

      {/* =========================================
          POP-UP PARA ARTÍCULOS MÉDICOS
      ========================================= */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedArticle(null)}
            >
              &times;
            </button>

            {/* NUEVO: Cabecera con Logo y Nombre del Hospital */}
            <div className="modal-author">
              <div className="hospital-avatar">
                <img src={avatarHospital} alt="Avatar Hospital" />
              </div>
              <div>
                <h3>Hospital Interdistrital Evita Formosa</h3>
                <span>Artículo de Salud • 🌎</span>
              </div>
            </div>

            <div className="modal-header">
              <h2
                className="modal-title"
                style={{ color: selectedArticle.color }}
              >
                {selectedArticle.title}
              </h2>
            </div>

            <div
              className="modal-body"
              style={{ borderLeftColor: selectedArticle.color }}
            >
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
                  <div
                    className="modal-campaign-img"
                    key={idx}
                    onClick={() =>
                      openLightbox(selectedArticle.campaignImages, idx)
                    }
                  >
                    <img src={img} alt={`Campaña ${idx + 1}`} />
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
          POP-UP PARA NOTICIAS
      ========================================= */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedNews(null)}
            >
              &times;
            </button>

            {/* NUEVO: Cabecera con Logo y Nombre del Hospital */}
            <div className="modal-author">
              <div className="hospital-avatar">
                <img src={avatarHospital} alt="Avatar Hospital" />
              </div>
              <div>
                <h3>Hospital Interdistrital Evita Formosa</h3>
                <span>{selectedNews.date} • 🌎</span>
              </div>
            </div>

            <div className="modal-header">
              <h2 className="modal-title" style={{ color: "#006eb3" }}>
                {selectedNews.title}
              </h2>
            </div>

            <div className="modal-body" style={{ borderLeftColor: "#006eb3" }}>
              {selectedNews.body.map((paragraph, idx) => (
                <p key={idx} className="modal-text">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="news-modal-images-grid">
              {selectedNews.images.map((img, idx) => (
                <div
                  className="modal-campaign-img"
                  key={idx}
                  onClick={() => openLightbox(selectedNews.images, idx)}
                >
                  <img src={img} alt={`Imagen noticia ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          LIGHTBOX UNIVERSAL (VISOR DE IMÁGENES)
      ========================================= */}
      {lightbox.isOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            &times;
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-arrow lb-left"
                onClick={prevLightboxImage}
              >
                &#10094;
              </button>
            )}

            <img
              src={lightbox.images[lightbox.index]}
              alt="Ampliada"
              className="lightbox-img"
            />

            {lightbox.images.length > 1 && (
              <button
                className="lightbox-arrow lb-right"
                onClick={nextLightboxImage}
              >
                &#10095;
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default NoticiasPage;
