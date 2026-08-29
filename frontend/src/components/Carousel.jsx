import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import "../styles/components/Carousel.css";

import defaultImg1 from "../assets/fondoHospitalCarrusel1.jpg";
import defaultImg2 from "../assets/fondoHospitalCarrusel2.jpg";
import defaultImg3 from "../assets/fondoHospitalCarrusel3.jpg";
import defaultImg4 from "../assets/fondoHospitalCarrusel4.jpg";

const defaultSlides = [
  { id: "def-1", imageUrl: defaultImg1, orden: 1 },
  { id: "def-2", imageUrl: defaultImg2, orden: 2 },
  { id: "def-3", imageUrl: defaultImg3, orden: 3 },
  { id: "def-4", imageUrl: defaultImg4, orden: 4 },
];

const Carousel = ({ page = "Inicio" }) => {
  const [slides, setSlides] = useState(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Estados para el texto estático leídos desde LocalStorage
  const [customTitle, setCustomTitle] = useState("6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL");
  const [customBtn, setCustomBtn] = useState("CONOCENOS");

  useEffect(() => {
    // Al montar el componente, buscamos si hay textos configurados en LocalStorage
    const savedTitle = localStorage.getItem("hie_carousel_text");
    const savedBtn = localStorage.getItem("hie_carousel_btn");
    
    if (savedTitle) setCustomTitle(savedTitle);
    if (savedBtn) setCustomBtn(savedBtn);

    const fetchPublicBanners = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/cms/banners");
        if (response.ok) {
          const data = await response.json();
          
          const bannersFiltrados = data
            .filter((b) => (b.page === page || !b.page) && (b.activo === true || b.isActive === true))
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));

          if (bannersFiltrados.length > 0) {
            setSlides(bannersFiltrados);
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
                alt={`Banner ${index + 1}`}
                className="carousel-img"
              />
            )}
          </div>
        ))}
      </div>

      {/* Capa estática superpuesta con el título institucional y el botón independientes de la imagen */}
      <div className="carousel-static-overlay">
        <div className="carousel-content-box">
          <h1 
            className="carousel-title" 
            dangerouslySetInnerHTML={{ __html: customTitle.replace(/\n/g, '<br />') }} 
          />
          {customBtn && (
            <Link to="/acerca-de" className="carousel-btn-conocenos">
              {customBtn}
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