import React, { useEffect } from "react";
import "../../styles/pages/PlanoInstitucionalPage.css"; // Nueva hoja de estilos
import Breadcrumb from "../../components/Breadcrumb";
import HospitalMapSection from "../../components/HospitalMapSection";
import AnimatedContent from "../../components/ui/AnimatedContent";

// Usamos la imagen de la fachada para ilustrar la sección del edificio
import fotoEdificio from "../../assets/fotoFachadaHIE.jpg"; 

const PlanoInstitucionalPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="plano-page">
      <div className="plano-hero-container">
        <section className="plano-hero">
          {/* Columna Izquierda: Textos */}
          <div className="plano-hero-left">
            <Breadcrumb currentPage="Plano Institucional" />
            <h1 className="plano-title">PLANO INSTITUCIONAL</h1>
            <p className="plano-description">
              Conocé la distribución de nuestras áreas y servicios. 
              El Hospital Interdistrital Evita cuenta con una infraestructura 
              moderna diseñada para brindar una atención accesible, 
              rápida y de alta complejidad a todos nuestros pacientes.
            </p>
            <p className="plano-subtext">Orientación y distribución de espacios.</p>
          </div>

          {/* Columna Derecha: Imagen destacada con efecto */}
          <div className="plano-hero-right">
            <div className="plano-image-wrapper">
              <img
                src={fotoEdificio}
                alt="Fachada del Hospital Evita"
                className="plano-img"
              />
              <div className="plano-overlay-box"></div>
            </div>
          </div>
        </section>
      </div>

      {/* Sección original del mapa */}
      <AnimatedContent distance={70} duration={1} threshold={0.2}>
        <HospitalMapSection />
      </AnimatedContent>
    </main>
  );
};

export default PlanoInstitucionalPage;