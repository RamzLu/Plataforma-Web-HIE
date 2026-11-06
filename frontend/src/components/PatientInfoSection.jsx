import React, { useState, useEffect } from "react";
import "../styles/sections/PatientInfoSection.css";
import AnimatedContent from "../components/ui/AnimatedContent";
import { getEspacioGraficoPublico } from "../api/contenidoGrafico.api.js";
import {
  DEFAULT_PACIENTES_INICIO,
  resolveGraphicImageUrl,
} from "../utils/contenidoGraficoPresets.js";

const CACHE_KEY = "hie_public_pacientes_inicio_cache";

const leerCacheInicial = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_PACIENTES_INICIO;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.imagenes) &&
      parsed.imagenes.length > 0
    ) {
      return parsed;
    }
  } catch {
    // Ignorar errores de sessionStorage
  }
  return DEFAULT_PACIENTES_INICIO;
};

const PatientInfoSection = () => {
  const [config, setConfig] = useState(leerCacheInicial);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    let cancelado = false;

    const cargarSeccionPacientes = async () => {
      try {
        const data = await getEspacioGraficoPublico("espacio-seccion-pacientes");
        if (
          !cancelado &&
          data &&
          Array.isArray(data.imagenes) &&
          data.imagenes.length > 0
        ) {
          setConfig(data);
          setOpenIndex((prev) =>
            prev !== null && prev >= data.imagenes.length ? 0 : prev
          );
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        }
      } catch (error) {
        console.error("Error al cargar la sección Información para Pacientes:", error);
      }
    };

    cargarSeccionPacientes();
    return () => {
      cancelado = true;
    };
  }, []);

  const accordionItems = Array.isArray(config?.imagenes)
    ? config.imagenes
    : DEFAULT_PACIENTES_INICIO.imagenes;

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const activeItem =
    openIndex !== null && accordionItems[openIndex]
      ? accordionItems[openIndex]
      : accordionItems[0] || null;

  const currentImage = resolveGraphicImageUrl(activeItem);
  const currentAlt =
    activeItem?.altText ||
    config?.altText ||
    "Información útil para pacientes y familiares";

  return (
    <section
      className="patient-section"
      aria-label={config?.altText || "Información para Pacientes"}
    >
      <div className="patient-container">
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="news-title">
            <span className="subtitle-dark">INFORMACIÓN PARA</span>
            <h2 className="title-blue">PACIENTES</h2>
          </div>
        </AnimatedContent>

        <div className="patient-split-layout">
          {/* COLUMNA IZQUIERDA: Acordeón informativo */}
          <AnimatedContent
            className="patient-content-left"
            distance={50}
            direction="horizontal"
            reverse={true}
            delay={0.2}
          >
            <div className="accordion-clean-wrapper">
              {accordionItems.map((item, index) => {
                const isOpen = openIndex === index;
                const lineas = String(item.textoDesplegable || "").split("\n");
                return (
                  <div
                    key={item.id || index}
                    className={`accordion-clean-item ${isOpen ? "active" : ""}`}
                  >
                    <button
                      type="button"
                      className="accordion-clean-header"
                      onClick={() => toggleAccordion(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.titulo}</span>
                      <svg
                        className="accordion-clean-arrow"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="accordion-clean-content">
                        <p>
                          {lineas.map((linea, idxLinea) => (
                            <React.Fragment key={idxLinea}>
                              {linea}
                              {idxLinea < lineas.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatedContent>

          {/* COLUMNA DERECHA: Imagen asociada al desplegable activo */}
          <AnimatedContent
            className="patient-image-right"
            distance={50}
            direction="horizontal"
            delay={0.4}
          >
            {currentImage && (
              <img
                key={currentImage}
                src={currentImage}
                alt={currentAlt}
                className="patient-img-clean img-smooth-swap"
              />
            )}
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
};

export default PatientInfoSection;
