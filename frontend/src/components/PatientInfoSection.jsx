import React, { useState } from "react";
import "../styles/components/PatientInfoSection.css";
import AnimatedContent from "./AnimatedContent";

import imgAtencion from "../assets/imagenPacientes.jpg";
import imgVisita from "../assets/imgVisita.jpg";
import imgAdmision from "../assets/imgAdmision.jpg";
import imgTurnos from "../assets/imgTurnos.jpg";
import imgLaboratorio from "../assets/imgLaboratorio.jpg";

const PatientInfoSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const accordionItems = [
    {
      title: "HORARIOS DE ATENCIÓN",
      content:
        "Estamos disponibles de 06:00 a 20:00 hs. para ayudarte a agendar citas y responder tus dudas generales.",
      image: imgAtencion,
    },
    {
      title: "VISITAR A UN PACIENTE",
      content:
        "Por favor, consulte los horarios y protocolos vigentes en recepción para la visita a pacientes internados.",
      image: imgVisita,
    },
    {
      title: "CRITERIOS DE ADMISIÓN",
      content:
        "Conozca los requisitos y documentación necesaria para la admisión en nuestras instalaciones.",
      image: imgAdmision,
    },
    {
      title: "TURNOS Y CONTACTO",
      content:
        "Comuníquese a través de nuestras vías oficiales para agendar o modificar su turno de atención.",
      image: imgTurnos,
    },
    {
      title: "LABORATORIO",
      content:
        "Información detallada sobre preparación previa, ayuno y horarios de extracción para análisis clínicos.",
      image: imgLaboratorio,
    },
  ];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const currentImage =
    openIndex !== null ? accordionItems[openIndex].image : imgAtencion;

  return (
    <section className="patient-section">
      <div className="patient-container">
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="news-title">
            <span className="subtitle-dark">INFORMACIÓN PARA</span>
            <h2 className="title-blue">PACIENTES</h2>
          </div>
        </AnimatedContent>

        <div className="patient-split-layout">
          {/* COLUMNA IZQUIERDA: Textos y Acordeón */}
          <AnimatedContent
            className="patient-content-left"
            distance={50}
            direction="horizontal"
            reverse={true}
            delay={0.2}
          >
            <div className="cta-turnos-clean">
              <div className="cta-turnos-text">
                <h3>Reserva de turnos para pacientes del interior de Formosa</h3>
                <p>Atención: 07:00 a 15:00 hs</p>
              </div>
              <a
                href="https://wa.me/5493704673728"
                className="btn-outline-whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 21.498c-1.536 0-3.04-.413-4.364-1.196l-.312-.185-3.243.85.865-3.163-.203-.323c-.856-1.365-1.308-2.92-1.308-4.52 0-4.714 3.836-8.55 8.566-8.55 2.285 0 4.432.89 6.046 2.507 1.614 1.616 2.503 3.764 2.503 6.048 0 4.714-3.836 8.55-8.55 8.55zm0-18.995c-5.76 0-10.45 4.69-10.45 10.45 0 1.84.48 3.636 1.393 5.22L1.5 22.5l4.43-1.163c1.52.836 3.242 1.277 5.03 1.277h.004c5.757 0 10.448-4.69 10.448-10.45 0-2.79-1.086-5.414-3.058-7.387-1.972-1.973-4.596-3.058-7.387-3.058z" />
                </svg>
                <span>WHATSAPP</span>
              </a>
            </div>

            <div className="accordion-clean-wrapper">
              {accordionItems.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`accordion-clean-item ${isOpen ? "active" : ""}`}
                  >
                    <button
                      className="accordion-clean-header"
                      onClick={() => toggleAccordion(index)}
                    >
                      <span>{item.title}</span>
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
                        <p>{item.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatedContent>

          {/* COLUMNA DERECHA: Imagen */}
<AnimatedContent
            className="patient-image-right"
            distance={50}
            direction="horizontal"
            delay={0.4}
          >
            <img
              key={currentImage} 
              src={currentImage}
              alt="Información para Pacientes"
              className="patient-img-clean img-smooth-swap"
            />
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
};

export default PatientInfoSection;