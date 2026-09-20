import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getNoticias } from "../../api/noticias.api.js";
import "../../styles/pages/NoticiasPage.css";
import Breadcrumb from "../../components/Breadcrumb";
import iconMama from "../../assets/icon-mama.png";
import iconCorazon from "../../assets/icon-corazon.png";
import iconDonacion from "../../assets/icon-donacion-de-sangre.png";
import iconDengue from "../../assets/icon-dengue.png";
import avatarHospital from "../../assets/logoHospitalEvita.png";

import iconMamaStatic from "../../assets/icon-mama-estatico.png";
import iconCorazonStatic from "../../assets/icon-corazon-estatico.png";
import iconDonacionStatic from "../../assets/icon-donacion-de-sangre-estatico.png";
import iconDengueStatic from "../../assets/icon-dengue-estatico.png";

import fondoBannerNoticias from "../../assets/banner_noticias.png";

import imgAlta1 from "../../assets/fondoCARRUSELnoticiasCM.jpg";
import imgAlta2 from "../../assets/fondoCARRUSELnoticias2.jpg";
import imgAlta3 from "../../assets/fondoCARRUSELnoticias3.jpg";
import imgAlta4 from "../../assets/fondoCARRUSELnoticias4.jpg";

// Array de categorías que actuarán como botones de navegación
const categoriasDestacadas = [
  {
    id: 1,
    title: "CÁNCER DE MAMA",
    slug: "cancer-mama",
    color: "#005c89",
    icon: iconMamaStatic,
    iconAnimated: iconMama,
  },
  {
    id: 2,
    title: "TU CORAZÓN",
    slug: "tu-corazon",
    color: "#005c89",
    icon: iconCorazonStatic,
    iconAnimated: iconCorazon,
  },
  {
    id: 3,
    title: "DONACIÓN",
    slug: "donacion",
    color: "#005c89",
    icon: iconDonacionStatic,
    iconAnimated: iconDonacion,
  },
  {
    id: 4,
    title: "DENGUE",
    slug: "dengue",
    color: "#005c89",
    icon: iconDengueStatic,
    iconAnimated: iconDengue,
  },
];

const miniCarouselData = [
  { id: 1, img: imgAlta1, caption: "Campañas de prevención" },
  { id: 2, img: imgAlta2, caption: "Infraestructura médica" },
  { id: 3, img: imgAlta3, caption: "Atención especializada" },
  { id: 4, img: imgAlta4, caption: "Tecnología de vanguardia" },
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
  const { hash } = useLocation();
  const navigate = useNavigate();

  const [selectedNews, setSelectedNews] = useState(null);
  const [altaIndex, setAltaIndex] = useState(0);
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true); 

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

  const nextAltaSlide = () => {
    setAltaIndex((prev) => (prev + 1) % miniCarouselData.length);
  };

  const prevAltaSlide = () => {
    setAltaIndex(
      (prev) => (prev - 1 + miniCarouselData.length) % miniCarouselData.length,
    );
  };

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } else {
      window.scrollTo(0, 0); 
    }
  }, [hash]);

  useEffect(() => {
const fetchNoticiasPublicas = async () => {
      setLoading(true);
      try {
        const data = await getNoticias(false);

        const noticiasFormateadas = data
          .filter(noticia => {
            const catName = (noticia.category || "general").trim().toLowerCase();
            return catName === "general" || catName === "noticias";
          })
          .map(noticia => ({
            id: noticia.id,
            title: noticia.title || noticia.titulo,
            body: noticia.body || [noticia.contenido],
            date: noticia.date || "Hoy",
            category: "General",
            images: noticia.images || []
          }));

        setNoticias(noticiasFormateadas);
      } catch (error) {
        console.error("Error al cargar noticias en el portal:", error);
      } finally {
        setLoading(false);
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
            <div className="news-info-text">
              <p>Manténgase informado con la actualidad y comunicados oficiales de la institución.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="noticias-page-container">
        
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
            No hay publicaciones recientes en la categoría General.
          </div>
        )}

        <section id="articulos-medicos" className="medical-articles-section">
          <div className="medical-left-column">
            <div className="medical-header">
              <h4 className="medical-subtitle">
                ESPACIO DE EDUCACIÓN EN SALUD
              </h4>
              <div className="medical-divider"></div>
              <h2 className="medical-title">
                NOTICIAS
                <br />
                ESPECIFICAS
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
            {categoriasDestacadas.map((cat) => (
              <button
                key={cat.id}
                className="article-card"
                onClick={() => navigate(`/noticias/${cat.slug}`)}
              >
                <h3 style={{ color: cat.color }}>{cat.title}</h3>

                <div className="article-icon-wrapper">
                  <img
                    src={cat.icon}
                    alt={cat.title}
                    className="icon-static"
                  />
                  <img
                    src={cat.iconAnimated}
                    alt={`${cat.title} animado`}
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
          </div>
        </div>
      )}

      {lightbox.isOpen && (
        <div 
          className="lightbox-overlay" 
          style={{ zIndex: 999999 }} 
          onClick={closeLightbox}
        >
          <button 
            className="lightbox-close" 
            style={{ zIndex: 9999999 }} 
            onClick={closeLightbox}
          >
            &times;
          </button>

          <div
            className="lightbox-content"
            style={{ zIndex: 9999999 }}
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-arrow lb-left"
                style={{ zIndex: 9999999 }}
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
                style={{ zIndex: 9999999 }}
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