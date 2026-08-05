import React, { useState } from 'react';
import './PatientInfoSection.css';

// 1. IMPORTAMOS TODAS LAS IMÁGENES
// Asegúrate de guardar estas imágenes en tu carpeta frontend/src/assets/
import imgAtencion from '../assets/imagenPacientes.jpg'; // Usamos la que ya tenías como base
import imgVisita from '../assets/imgVisita.jpg';
import imgAdmision from '../assets/imgAdmision.jpg';
import imgTurnos from '../assets/imgTurnos.jpg';
import imgLaboratorio from '../assets/imgLaboratorio.jpg';

const PatientInfoSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  // 2. AGREGAMOS LA PROPIEDAD "image" A CADA PESTAÑA
  const accordionItems = [
    {
      title: "HORARIOS DE ATENCIÓN",
      content: "Estamos disponibles de 06:00 a 20:00 hs. para ayudarte a agendar citas y responder tus dudas generales.",
      image: imgAtencion
    },
    {
      title: "VISITAR A UN PACIENTE",
      content: "Por favor, consulte los horarios y protocolos vigentes en recepción para la visita a pacientes internados.",
      image: imgVisita
    },
    {
      title: "CRITERIOS DE ADMISIÓN",
      content: "Conozca los requisitos y documentación necesaria para la admisión en nuestras instalaciones.",
      image: imgAdmision
    },
    {
      title: "TURNOS Y CONTACTO",
      content: "Comuníquese a través de nuestras vías oficiales para agendar o modificar su turno.",
      image: imgTurnos
    },
    {
      title: "LABORATORIO",
      content: "Información detallada sobre preparación previa y horarios de extracción para análisis clínicos.",
      image: imgLaboratorio
    }
  ];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 3. LÓGICA PARA CAMBIAR LA IMAGEN
  // Si openIndex es null (el usuario cerró todas las pestañas), mostramos la primera por defecto.
  // Si hay una pestaña abierta, mostramos la imagen correspondiente a ese índice.
  const currentImage = openIndex !== null ? accordionItems[openIndex].image : imgAtencion;

  return (
    <section className="patient-section">
      <div className="patient-container">
        
        <div className="patient-section-header">
          <span className="subtitle-dark">Información para</span>
          <h2 className="title-white">PACIENTES</h2>
        </div>

        <div className="patient-main-card">
          
          <div className="patient-content-left">
            <div className="turnos-box">
              <p className="turnos-text">
                Reserva de turnos para<br/>
                pacientes provenientes del<br/>
                interior de Formosa.
              </p>
              <div className="turnos-action">
                <span className="turnos-time">07:00 a 15:00 hs</span>
                <a href="https://wa.me/5493704673728" className="btn-whatsapp-small" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.031 21.498c-1.536 0-3.04-.413-4.364-1.196l-.312-.185-3.243.85.865-3.163-.203-.323c-.856-1.365-1.308-2.92-1.308-4.52 0-4.714 3.836-8.55 8.566-8.55 2.285 0 4.432.89 6.046 2.507 1.614 1.616 2.503 3.764 2.503 6.048 0 4.714-3.836 8.55-8.55 8.55zm0-18.995c-5.76 0-10.45 4.69-10.45 10.45 0 1.84.48 3.636 1.393 5.22L1.5 22.5l4.43-1.163c1.52.836 3.242 1.277 5.03 1.277h.004c5.757 0 10.448-4.69 10.448-10.45 0-2.79-1.086-5.414-3.058-7.387-1.972-1.973-4.596-3.058-7.387-3.058z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="accordion-wrapper">
              {accordionItems.map((item, index) => (
                <div key={index} className="accordion-item">
                  <button 
                    className="accordion-header"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="accordion-icon">+</span>
                    {item.title}
                  </button>
                  <div className={`accordion-content ${openIndex === index ? 'open' : ''}`}>
                    <p>{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="patient-image-right">
            <div className="image-skew-wrapper">
              {/* 4. APLICAMOS LA VARIABLE currentImage AL ATRIBUTO src */}
              <img src={currentImage} alt="Información de pacientes" className="patient-img" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PatientInfoSection;