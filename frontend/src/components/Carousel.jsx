import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEspacioGraficoPublico } from "../api/contenidoGrafico.api.js";
import {
  DEFAULT_CARRUSEL_INICIO,
  resolveGraphicImageUrl,
} from "../utils/contenidoGraficoPresets.js";
import "../styles/components/Carousel.css";

const CACHE_KEY = "hie_public_carrusel_inicio_cache";

const leerCacheInicial = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_CARRUSEL_INICIO;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.imagenes) && parsed.imagenes.length > 0) {
      return parsed;
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
  return DEFAULT_CARRUSEL_INICIO;
};

const Carousel = () => {
  const [config, setConfig] = useState(leerCacheInicial);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let cancelado = false;

    const cargarCarrusel = async () => {
      try {
        const data = await getEspacioGraficoPublico("espacio-banner-inicio");
        if (!cancelado && data && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
          setConfig(data);
          setCurrentSlide((prev) =>
            prev >= data.imagenes.length ? 0 : prev
          );
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        }
      } catch (error) {
        console.error("Error al cargar el carrusel de inicio:", error);
      }
    };

    cargarCarrusel();
    return () => {
      cancelado = true;
    };
  }, []);

  const slides = Array.isArray(config?.imagenes) ? config.imagenes : [];

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

  const altSeccion =
    config.altText || DEFAULT_CARRUSEL_INICIO.altText;
  const textoSuperpuesto =
    config.textoSuperpuesto ?? DEFAULT_CARRUSEL_INICIO.textoSuperpuesto;
  const textoBoton = String(config.textoBoton ?? "").trim();
  const enlaceUrl = String(config.enlaceUrl ?? "").trim();
  const mostrarBoton = Boolean(textoBoton && enlaceUrl);

  return (
    <section
      className="carousel-container"
      aria-label={altSeccion}
    >
      <div className="carousel-track">
        {slides.map((slide, index) => {
          const imgUrl = resolveGraphicImageUrl(slide);
          return (
            <div
              key={slide.id || index}
              className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
              aria-hidden={index !== currentSlide}
              style={{
                opacity: index === currentSlide ? 1 : 0,
                visibility: index === currentSlide ? "visible" : "hidden",
                transition: "opacity 0.8s ease-in-out",
              }}
            >
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={
                    altSeccion
                      ? `${altSeccion} (${index + 1} de ${slides.length})`
                      : `Imagen ${index + 1} del carrusel`
                  }
                  className="carousel-img"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Capa estática superpuesta con el texto principal y el botón */}
      <div className="carousel-static-overlay">
        <div className="carousel-content-box">
          {textoSuperpuesto && textoSuperpuesto.trim() !== "" && (
            <h1
              className="carousel-title"
              style={{ marginBottom: mostrarBoton ? undefined : 0 }}
            >
              {String(textoSuperpuesto)
                .split("\n")
                .map((linea, i, lineas) => (
                  <React.Fragment key={i}>
                    {linea}
                    {i < lineas.length - 1 && <br />}
                  </React.Fragment>
                ))}
            </h1>
          )}

          {mostrarBoton && (
            <Link to={enlaceUrl} className="carousel-btn-conocenos">
              {textoBoton}
            </Link>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrev}
            aria-label="Imagen anterior del carrusel"
          >
            &#10094;
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Siguiente imagen del carrusel"
          >
            &#10095;
          </button>

          <div className="carousel-indicators">
            {slides.map((slide, idx) => (
              <button
                key={slide.id || idx}
                type="button"
                className={`carousel-indicator ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Ir a la imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Carousel;
