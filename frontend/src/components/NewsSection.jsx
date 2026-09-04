import React from "react";
// Importamos Link solo para las rutas puras (sin hash) para evitar recargas innecesarias
import { Link } from "react-router-dom"; 
import "../styles/components/NewsSection.css";
import AnimatedContent from "./AnimatedContent";

// Íconos de react-icons/fi para el banner inferior
import { FiMapPin, FiInfo, FiNavigation } from "react-icons/fi";

const NewsSection = () => {
  return (
    <section className="news-section">
      <div className="news-container">
        {/* ENCABEZADO */}
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="news-header">
            <div className="news-title-group">
              <span className="news-subtitle">REQUISITOS Y PROCEDIMIENTOS</span>
              <h2 className="news-title">CÓMO SACAR TURNO</h2>
            </div>
          </div>
        </AnimatedContent>

        <main className="editorial-columns-grid" aria-label="Información y Servicios Hospitalarios">
          
          {/* COLUMNA 1: ¿VENÍS POR PRIMERA VEZ? */}
          <AnimatedContent distance={50} direction="vertical" delay={0.15}>
            <section className="editorial-column  ">
              <div className="column-top-meta">
                <span className="category-tag">DERIVACIÓN</span>
              </div>

              <h2 className="editorial-title">
                ¿VENÍS POR<br />
                <span className="title-light-blue">PRIMERA VEZ?</span>
              </h2>

              <p className="editorial-lead-text">
                Para la atención en consultorios de las diferentes especialidades, los pedidos son solicitados por sistema de <strong>referencia y contrarreferencia</strong> emitido por el Centro de Salud más cercano a tu domicilio.
              </p>

              <nav className="editorial-links-list" aria-label="Enlaces de derivación">
                {/* Usamos etiqueta <a> para garantizar el salto hacia el #autoridades */}
                <a href="/acerca-de#autoridades" className="editorial-sublink">
                  <span>CONOCÉ NUESTRAS AUTORIDADES</span>
                  <span className="link-arrow" aria-hidden="true">→</span>
                </a>
                
                {/* Como no tiene hash, usamos Link de React Router */}
                <Link to="/noticias" className="editorial-sublink">
                  <span>NUESTRAS NOTICIAS</span>
                  <span className="link-arrow" aria-hidden="true">→</span>
                </Link>
              </nav>

            </section>
          </AnimatedContent>

          {/* COLUMNA 2: PACIENTES INSTITUCIONALES */}
          <AnimatedContent distance={50} direction="vertical" delay={0.25}>
            <section className="editorial-column ">
              <div className="column-top-meta">
                <span className="category-tag">PRESENCIAL</span>
              </div>

              <h2 className="editorial-title">
                PACIENTES<br />
                <span className="title-light-blue">INSTITUCIONALES</span>
              </h2>

              <p className="editorial-lead-text">
                Se brindan turnos con cada especialista según nuestro calendario mensual. Para su gestión presencial debés presentar:
              </p>

              <div className="meta-info-grid">
                <div className="meta-card">
                  <span className="meta-label">DOCUMENTO</span>
                  <span className="meta-value">D.N.I. del paciente</span>
                </div>
                <div className="meta-card">
                  <span className="meta-label">ORDEN</span>
                  <span className="meta-value">Interconsulta</span>
                </div>
                <div className="meta-card">
                  <span className="meta-label">HORARIO</span>
                  <span className="meta-value">Desde las 06:00 Hs.</span>
                </div>
                <div className="meta-card">
                  <span className="meta-label">VENTANILLA</span>
                  <span className="meta-value">Av. 28 de Junio Nº 250</span>
                </div>
              </div>

              <nav className="editorial-links-list" aria-label="Especialidades">
                <Link to="/especialidades" className="editorial-sublink">
                  <span>ESPECIALIDADES MÉDICAS ACTIVAS</span>
                  <span className="link-arrow" aria-hidden="true">→</span>
                </Link>
              </nav>

            </section>
          </AnimatedContent>

          {/* COLUMNA 3: INFORMACIÓN IMPORTANTE */}
          <AnimatedContent distance={50} direction="vertical" delay={0.35}>
            <section className="editorial-column">
              <div className="column-top-meta">
                <span className="category-tag alert-tag">PROTOCOLO</span>
              </div>

              <h2 className="editorial-title">
                INFORMACIÓN<br />
                <span className="title-light-red">IMPORTANTE</span>
              </h2>

              <div className="editorial-alert-box">
                <p className="alert-text">
                  Los turnos <strong>NO SE BRINDAN TELEFÓNICAMENTE</strong> a pacientes.
                </p>
              </div>

              <p className="editorial-lead-text">
                Para reagendar o cancelar un turno otorgado, debés dar aviso presencial o telefónico con al menos <strong>24 hs. de anticipación</strong> para disponer del cupo.
              </p>

              <nav className="editorial-links-list" aria-label="Enlaces institucionales">
                <a href="/noticias#articulos-medicos" className="editorial-sublink">
                  <span>ARTÍCULOS MÉDICOS</span>
                  <span className="link-arrow" aria-hidden="true">→</span>
                </a>
                <a href="/acerca-de#video" className="editorial-sublink">
                  <span>VIDEO INSTITUCIONAL</span>
                  <span className="link-arrow" aria-hidden="true">→</span>
                </a>
              </nav>

            </section>
          </AnimatedContent>
        </main>

        {/* BANNER DE SEDE CENTRAL */}
        <AnimatedContent distance={50} direction="vertical" delay={0.45}>
          <section className="location-banner" aria-label="Información de la sede">
            <div className="location-left-group">
              <div className="location-icon-bubble" aria-hidden="true">
                <FiMapPin size={22} strokeWidth={2.2} />
              </div>
              <div className="location-text-group">
                <span className="location-subtitle">SEDE HOSPITALARIA CENTRAL</span>
                <h3 className="location-title">Ubicación e información de la Sede</h3>
                <p className="location-address">
                  Av. José de Luca Barberis Nº 250, Formosa, Argentina
                </p>
              </div>
            </div>

            <div className="location-actions">
              <a href="/acerca-de#sede-central" className="btn-building-info" style={{ textDecoration: 'none' }}>
                <FiInfo size={16} strokeWidth={2.2} />
                Información del Edificio
              </a>

              <a href="/contacto#transporte-mapa" className="btn-how-to-arrive" style={{ textDecoration: 'none' }}>
                <FiNavigation size={16} strokeWidth={2.2} />
                Cómo llegar
              </a>
            </div>
          </section>
        </AnimatedContent>

      </div>
    </section>
  );
};

export default NewsSection;