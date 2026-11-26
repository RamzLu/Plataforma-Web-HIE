import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/sections/AprendeSection.css";
import AnimatedContent from "./ui/AnimatedContent";
import { getEspacioGraficoPublico } from "../api/contenidoGrafico.api.js";
import {
  DEFAULT_APRENDE_INICIO,
  normalizeInternalPortalPath,
  resolveGraphicImageUrl,
} from "../utils/contenidoGraficoPresets.js";

const CACHE_KEY = "hie_public_aprende_inicio_cache";

const leerCacheInicial = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_APRENDE_INICIO;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.imagenes) &&
      parsed.imagenes.length >= 4
    ) {
      return parsed;
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
  return DEFAULT_APRENDE_INICIO;
};

const COLORES_TARJETA = ["green", "yellow", "blue"];

const AprendeSection = () => {
  const [config, setConfig] = useState(leerCacheInicial);

  useEffect(() => {
    let cancelado = false;

    const cargarSeccionAprende = async () => {
      try {
        const data = await getEspacioGraficoPublico("espacio-aprende-inicio");
        if (
          !cancelado &&
          data &&
          Array.isArray(data.imagenes) &&
          data.imagenes.length >= 4
        ) {
          setConfig(data);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        }
      } catch (error) {
        console.error("Error al cargar la sección Aprendé con el Evita:", error);
      }
    };

    cargarSeccionAprende();
    return () => {
      cancelado = true;
    };
  }, []);

  const items =
    Array.isArray(config?.imagenes) && config.imagenes.length >= 4
      ? config.imagenes
      : DEFAULT_APRENDE_INICIO.imagenes;

  const principal = items[0] || DEFAULT_APRENDE_INICIO.imagenes[0];
  const tarjetas = items.slice(1, 4);

  const mainImgUrl = resolveGraphicImageUrl(principal);
  const subtitulo =
    principal?.subtituloEncabezado ||
    config?.subtituloEncabezado ||
    DEFAULT_APRENDE_INICIO.subtituloEncabezado;
  const titulo =
    principal?.titulo ||
    config?.tituloEncabezado ||
    DEFAULT_APRENDE_INICIO.tituloEncabezado;
  const parrafo =
    principal?.parrafoDescripcion ||
    config?.parrafoDescripcion ||
    DEFAULT_APRENDE_INICIO.parrafoDescripcion;

  const lineasParrafo = String(parrafo || "").split("\n");

  return (
    <section
      className="aprende-section"
      aria-label={titulo || "Aprendé con el Evita"}
    >
      <div className="aprende-container">
        <AnimatedContent
          className="aprende-left-image"
          distance={45}
          direction="horizontal"
          reverse={true}
          delay={0.1}
        >
          <div className="image-frame">
            {mainImgUrl && (
              <img
                src={mainImgUrl}
                alt={
                  principal?.altText ||
                  "Educación para la salud - Hospital Evita"
                }
              />
            )}
          </div>
        </AnimatedContent>

        <div className="aprende-right-content">
          <AnimatedContent distance={35} direction="vertical" delay={0.15}>
            <div className="aprende-header">
              <span className="aprende-subtitle">{subtitulo}</span>
              <h2 className="aprende-title">{titulo}</h2>
            </div>

            <p className="aprende-description">
              {lineasParrafo.map((linea, idxLinea) => (
                <React.Fragment key={idxLinea}>
                  {linea}
                  {idxLinea < lineasParrafo.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          </AnimatedContent>

          <div className="aprende-cards-grid">
            {tarjetas.map((card, idx) => {
              const cardImgUrl = resolveGraphicImageUrl(card);
              const badgeColor =
                card.badgeColor || COLORES_TARJETA[idx] || "blue";
              const enlaceDestino =
                normalizeInternalPortalPath(card.enlaceUrl) || "/noticias";

              return (
                <AnimatedContent
                  key={card.id || idx}
                  distance={40}
                  direction="vertical"
                  delay={0.22 + idx * 0.12}
                  threshold={0.1}
                >
                  <div className="aprende-card">
                    <div className="card-image-box">
                      {cardImgUrl && (
                        <img
                          src={cardImgUrl}
                          alt={card.altText || card.titulo || `Tarjeta ${idx + 1}`}
                        />
                      )}
                    </div>
                    <div className="card-info">
                      <span className={`card-badge ${badgeColor}`}>
                        {card.etiquetaSuperior}
                      </span>
                      <h4>{card.titulo}</h4>
                    </div>
                    <Link to={enlaceDestino} className="card-action-link">
                      <span>MÁS INFORMACIÓN</span>
                      <span className="arrow">→</span>
                    </Link>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AprendeSection;
