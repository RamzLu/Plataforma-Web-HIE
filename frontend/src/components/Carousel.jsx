import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/components/Carousel.css";

import defaultImg1 from "../assets/fondoHospitalCarrusel1.jpg";
import defaultImg2 from "../assets/fondoHospitalCarrusel2.jpg";
import defaultImg3 from "../assets/fondoHospitalCarrusel3.jpg";
import defaultImg4 from "../assets/fondoHospitalCarrusel4.jpg";

const defaultSlides = [
  {
    id: "def-1",
    imageUrl: defaultImg1,
    altText: "Fachada principal del Hospital Interdistrital Evita de Formosa",
    orden: 1,
  },
  {
    id: "def-2",
    imageUrl: defaultImg2,
    altText: "Atención médica y equipamiento del Hospital Interdistrital Evita",
    orden: 2,
  },
  {
    id: "def-3",
    imageUrl: defaultImg3,
    altText: "Servicios hospitalarios y cuidado integral de la comunidad",
    orden: 3,
  },
  {
    id: "def-4",
    imageUrl: defaultImg4,
    altText: "Equipo profesional de salud del Hospital Interdistrital Evita",
    orden: 4,
  },
];

const Carousel = ({ page = "Inicio" }) => {
  const [slides, setSlides] = useState(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Estados para el texto estático de respaldo
  const [customTitle, setCustomTitle] = useState(
    "6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL"
  );
  const [customBtn, setCustomBtn] = useState("CONOCENOS");

  useEffect(() => {
    const savedTitle = localStorage.getItem("hie_carousel_text");
    const savedBtn = localStorage.getItem("hie_carousel_btn");

    if (savedTitle) setCustomTitle(savedTitle);
    if (savedBtn) setCustomBtn(savedBtn);

    const fetchPublicBanners = async () => {
      try {
        const apiBase =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api";
        const response = await fetch(`${apiBase}/cms/banners`);
        if (response.ok) {
          const data = await response.json();

          const bannersFiltrados = (Array.isArray(data) ? data : [])
            .filter(
              (b) =>
                (b.page?.toLowerCase() === page.toLowerCase() || !b.page) &&
                (!b.tipo || b.tipo === "Banner Principal") &&
                (b.activo === true || b.isActive === true) &&
                Boolean(b.imageUrl)
            )
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));

          if (bannersFiltrados.length > 0) {
            setSlides(bannersFiltrados);
            setCurrentSlide(0);
          }
        }
      } catch (error) {
        console.error("Error al cargar banners dinámicos:", error);
      }
    };

    fetchPublicBanners();
  }, [page]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  const activeSlide = slides[currentSlide] || slides[0];
  const displayTitle = activeSlide?.titulo || customTitle;
  const displayBtnText = activeSlide?.enlaceTexto || customBtn;
  const displayBtnUrl = activeSlide?.enlaceUrl || activeSlide?.enlace || "/acerca-de";

  return (
    <div className="carousel-container">
      <div className="carousel-track">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
            style={{
              opacity: index === currentSlide ? 1 : 0,
              visibility: index === currentSlide ? "visible" : "hidden",
              transition: "opacity 0.8s ease-in-out",
            }}
          >
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={slide.altText || `Banner ${index + 1}`}
                className="carousel-img"
              />
            )}
          </div>
        ))}
      </div>

      {/* Capa superpuesta con el título y botón del slide activo (o valores institucionales por defecto) */}
      <div className="carousel-static-overlay">
        <div className="carousel-content-box">
          <h1
            className="carousel-title"
            dangerouslySetInnerHTML={{
              __html: String(displayTitle).replace(/\n/g, "<br />"),
            }}
          />
          {displayBtnText && (
            <Link to={displayBtnUrl} className="carousel-btn-conocenos">
              {displayBtnText}
            </Link>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrev}
            aria-label="Banner anterior"
          >
            &#10094;
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Banner siguiente"
          >
            &#10095;
          </button>

          <div className="carousel-indicators">
            {slides.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-indicator ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Ir al banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;
