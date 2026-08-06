import React, { useState } from "react";
import "./Carousel.css";

import imagen1 from "../assets/fondoHospitalCarrusel1.jpg";
import imagen2 from "../assets/fondoHospitalCarrusel2.jpg";
import imagen3 from "../assets/fondoHospitalCarrusel3.jpg";
import imagen4 from "../assets/fondoHospitalCarrusel4.jpg";

const Carousel = () => {
  const slides = [imagen1, imagen2, imagen3, imagen4];

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <section className="carousel-section">
      <div className="carousel-container">
        <button className="carousel-arrow left-arrow" onClick={goToPrevious}>
          &#10094;
        </button>

        <div
          className="carousel-inner"
          style={{ backgroundImage: `url(${slides[currentIndex]})` }}
        ></div>

        <div className="carousel-overlay">
          <div className="carousel-text-container">
            <h1 className="carousel-title">
              6 AÑOS DE
              <br />
              VOCACIÓN Y
              <br />
              COMPETENCIA
              <br />
              PROFESIONAL
            </h1>
            <a href="#acerca-de" className="carousel-btn">
              CONOCENOS
            </a>
          </div>
        </div>

        <button className="carousel-arrow right-arrow" onClick={goToNext}>
          &#10095;
        </button>

        <div className="carousel-dots-container">
          {slides.map((slide, slideIndex) => (
            <div
              key={slideIndex}
              className={`carousel-dot ${currentIndex === slideIndex ? "active" : ""}`}
              onClick={() => goToSlide(slideIndex)}
            >
              &#9679;
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;
