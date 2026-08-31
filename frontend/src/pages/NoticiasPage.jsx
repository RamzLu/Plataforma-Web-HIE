import React, { useState, useRef, useEffect } from "react";
import { newsData } from "../data/newsData";
import "../styles/pages/NoticiasPage.css";
import Breadcrumb from "../components/Breadcrumb";

import iconMama from "../assets/icon-mama.png";
import iconCorazon from "../assets/icon-corazon.png";
import iconDonacion from "../assets/icon-donacion-de-sangre.png";
import iconDengue from "../assets/icon-dengue.png";
import avatarHospital from "../assets/logoHospitalEvita.png";

import iconMamaStatic from "../assets/icon-mama-estatico.png";
import iconCorazonStatic from "../assets/icon-corazon-estatico.png";
import iconDonacionStatic from "../assets/icon-donacion-de-sangre-estatico.png";
import iconDengueStatic from "../assets/icon-dengue-estatico.png";

import fondoBannerNoticias from "../assets/banner_noticias.png";

import imgAlta1 from "../assets/fondoCARRUSELnoticiasCM.jpg";
import imgAlta2 from "../assets/fondoCARRUSELnoticias2.jpg";
import imgAlta3 from "../assets/fondoCARRUSELnoticias3.jpg";
import imgAlta4 from "../assets/fondoCARRUSELnoticias4.jpg";

import folletoCD1 from "../assets/folletoCD1.jpg";
import folletoCD2 from "../assets/folletoCD2.jpg";
import folletoCD3 from "../assets/folletoCD3.jpg";
import folletoCD4 from "../assets/folletoCD4.jpg";
import folletoCD5 from "../assets/folletoCD5.jpg";
import folletoEjemplo from "../assets/folletoCD5.jpg";

const medicalArticles = [
  {
    id: 1,
    title: "CÁNCER DE MAMA",
    color: "#005c89",
    icon: iconMamaStatic,
    iconAnimated: iconMama,
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
    color: "#005c89",
    icon: iconCorazonStatic,
    iconAnimated: iconCorazon,
    subtitle: "Cuidá tu motor de vida",
    description: [
      "Mantener una dieta equilibrada, hacer ejercicio regularmente y controlar tu presión arterial son pasos clave para un corazón sano.",
    ],
    campaignImages: [
      folletoEjemplo,
      folletoEjemplo,
      folletoEjemplo,
      folletoCD2,
    ],
  },
  {
    id: 3,
    title: "DONACIÓN",
    color: "#005c89",
    icon: iconDonacionStatic,
    iconAnimated: iconDonacion,
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
    color: "#005c89",
    icon: iconDengueStatic,
    iconAnimated: iconDengue,
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

const miniCarouselData = [
  { id: 1, img: imgAlta1 },
  { id: 2, img: imgAlta2 },
  { id: 3, img: imgAlta3 },
  { id: 4, img: imgAlta4 },
];
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
const NewsCard = ({ news, onOpenNews, onOpenLightbox }) => {
  const plainText = cleanHtmlText(news.body[0]);
  return (
    <article className="full-news-card">
      <div className="full-news-header">
        <div className="hospital-avatar">
          <img src={avatarHospital} alt="Avatar Hospital" />
        </div>
        <div className="post-meta">
          <h3>Hospital Interdistrital Evita Formosa</h3>
          <span>{news.date}</span>
        </div>
      </div>

      <div className="full-news-body">
        <h4 className="full-news-title">{news.title}</h4>
        <p className="clamped-text">{plainText}</p>

        <button className="read-more-btn" onClick={() => onOpenNews(news)}>
          Ver más
        </button>
      </div>

      <div className="full-news-images">
        {news.images && news.images.length > 0 && (
          <img
            src={news.images[0]}
            alt={`${news.title} - foto principal`}
            className="clickable-img"
            onClick={() => onOpenLightbox(news.images, 0)}
          />
        )}
      </div>
    </article>
  );
};

const NoticiasPage = () => {
  const sliderRef = useRef(null);
  const modalSliderRef = useRef(null);

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [altaIndex, setAltaIndex] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Añadido el estado de carga

  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

  const sortedNews = [...noticias].sort((a, b) => b.id - a.id);

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

  const nextAltaSlide = () => {
    setAltaIndex((prev) => (prev + 1) % miniCarouselData.length);
  };

  const prevAltaSlide = () => {
    setAltaIndex(
      (prev) => (prev - 1 + miniCarouselData.length) % miniCarouselData.length,
    );
  };

useEffect(() => {
    const fetchNoticiasPublicas = async () => {
      setLoading(true); // 👈 Iniciar la carga
      try {
        const response = await fetch("http://localhost:3000/api/cms/noticias");
        if (!response.ok) throw new Error("Error al obtener noticias");
        const data = await response.json();

        const noticiasFormateadas = data.map(noticia => ({
          id: noticia.id,
          title: noticia.titulo || noticia.title,
          body: [noticia.contenido || noticia.body],
          date: noticia.createdAt ? new Date(noticia.createdAt).toLocaleDateString("es-AR") : "Hoy",
          category: "Noticias",
          images: noticia.images || []
        }));

        setNoticias(noticiasFormateadas);
      } catch (error) {
        console.error("Error al cargar noticias en el portal:", error);
      } finally {
        setLoading(false); // 👈 Finalizar la carga
      }
    };

    fetchNoticiasPublicas();
  }, []);

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
      <div
        className="news-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 111, 196, 0.85), rgba(233, 235, 238, 0.85)), url(${fondoBannerNoticias})`,
        }}
      >
        <div className="news-header-inner">
          <Breadcrumb currentPage="Noticias" />
          <h1 className="news-main-title">ÚLTIMAS PUBLICACIONES</h1>
          <div className="news-info-wrapper">
            <div className="news-info-labels">
              <span className="news-label active">HOSPITAL</span>
              <span className="news-label">EVITA</span>
            </div>
            <div className="news-info-divider"></div>
            <div className="news-info-text">
              <p>Manténgase informado con la actualidad</p>
              <p>y comunicados oficiales de la institución.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="noticias-page-container">
        
        {/* Renderizado Condicional del Spinner o las Noticias */}
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
            <div className="cms-spinner" style={{ borderColor: "#cbd5e1", borderTopColor: "#006eb3" }}></div>
            <p style={{ marginTop: "15px", color: "#64748b", fontWeight: "600" }}>Cargando últimas noticias...</p>
          </div>
        ) : sortedNews.length > 0 ? (
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
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", width: "100%" }}>
            No hay publicaciones recientes.
          </div>
        )}

        <section className="medical-articles-section">
          <div className="medical-left-column">
            <div className="medical-header">
              <h4 className="medical-subtitle">
                ESPACIO DE EDUCACIÓN EN SALUD
              </h4>
              <div className="medical-divider"></div>
              <h2 className="medical-title">
                ARTÍCULOS
                <br />
                MÉDICOS
              </h2>
            </div>

            <div className="mini-carousel-card">
              <div className="mini-carousel-img-wrapper">
                <button
                  className="mini-arrow mini-left"
                  onClick={prevAltaSlide}
                >
                  &#10094;
                </button>
                <img
                  src={miniCarouselData[altaIndex].img}
                  alt={miniCarouselData[altaIndex].caption}
                  key={altaIndex} 
                />
                <button
                  className="mini-arrow mini-right"
                  onClick={nextAltaSlide}
                >
                  &#10095;
                </button>
              </div>

              <p className="mini-caption">
                {miniCarouselData[altaIndex].caption}
              </p>

              <div className="mini-dots">
                {miniCarouselData.map((_, idx) => (
                  <div
                    key={idx}
                    className={`mini-dot ${altaIndex === idx ? "active" : ""}`}
                    onClick={() => setAltaIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="articles-grid">
            {medicalArticles.map((article) => (
              <button
                key={article.id}
                className="article-card"
                onClick={() => setSelectedArticle(article)}
              >
                <h3 style={{ color: article.color }}>{article.title}</h3>

                <div className="article-icon-wrapper">
                  <img
                    src={article.icon}
                    alt={article.title}
                    className="icon-static"
                  />
                  <img
                    src={article.iconAnimated}
                    alt={`${article.title} animado`}
                    className="icon-animated"
                  />
                </div>

                <div className="article-card-arrow">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div
            className="modal-content-esp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>{selectedArticle.title}</h2>
              <button
                className="btn-close-modal"
                onClick={() => setSelectedArticle(null)}
                title="Cerrar ventana"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body-esp">
              <div className="modal-author-row">
                <div className="hospital-avatar">
                  <img src={avatarHospital} alt="Avatar Hospital" />
                </div>
                <div className="author-meta">
                  <h3>Hospital Interdistrital Evita Formosa</h3>
                  <span>Espacio de Educación en Salud</span>
                </div>
              </div>

              <div className="info-section">
                <h4 className="info-title">
                  <span className="info-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  {selectedArticle.subtitle}
                </h4>

                <div className="article-paragraphs-box">
                  {selectedArticle.description.map((paragraph, idx) => (
                    <p key={idx} className="info-text">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {selectedArticle.campaignImages &&
                selectedArticle.campaignImages.length > 0 && (
                  <div className="info-section">
                    <h4 className="info-title">
                      <span className="info-icon">
                        <svg viewBox="0 0 24 24">
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </span>
                      MATERIAL INFORMATIVO Y FOLLETERÍA
                    </h4>

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
                            <img src={img} alt={`Folleto ${idx + 1}`} />
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
                )}
            </div>
          </div>
        </div>
      )}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div
            className="modal-content-esp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>COMUNICADO INSTITUCIONAL</h2>
              <button
                className="btn-close-modal"
                onClick={() => setSelectedNews(null)}
                title="Cerrar ventana"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body-esp">
              
              {/* COLUMNA IZQUIERDA: Textos y detalles */}
              <div className="modal-left-content">
                <div className="modal-author-row">
                  <div className="hospital-avatar">
                    <img src={avatarHospital} alt="Avatar Hospital" />
                  </div>
                  <div className="author-meta">
                    <h3>Hospital Interdistrital Evita Formosa</h3>
                    <span>{selectedNews.date}</span>
                  </div>
                </div>

                <h3 className="news-modal-title">{selectedNews.title}</h3>

                <div className="news-modal-body-text">
                  {selectedNews.body.map((paragraph, idx) => (
                    <div
                      key={idx}
                      className="info-text"
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA: Mosaico Dinámico (Estilo Facebook) */}
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className={`mosaic-gallery layout-${selectedNews.images.length >= 4 ? 4 : selectedNews.images.length}`}>
                  {selectedNews.images.slice(0, 4).map((img, index) => {
                    const isLastAndHidden = index === 3 && selectedNews.images.length > 4;
                    const fotosRestantes = selectedNews.images.length - 4;

                    return (
                      <div 
                        key={index} 
                        className="mosaic-item"
                        onClick={() => openLightbox(selectedNews.images, index)}
                      >
                        <img src={img} alt={`Foto noticia ${index + 1}`} />
                        
                        {isLastAndHidden && (
                          <div className="mosaic-overlay">
                            <span>+{fotosRestantes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            <div className="modal-footer-esp">
              <button
                className="btn-cerrar-rojo"
                onClick={() => setSelectedNews(null)}
              >
                Cerrar Noticia
              </button>
            </div>
          </div>
        </div>
      )}

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