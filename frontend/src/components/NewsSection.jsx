import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/NewsSection.css";
import AnimatedContent from "./AnimatedContent";

// IMPORTACIÓN DE ICONOS DE REACT
import { 
  FiMapPin, 
  FiCalendar, 
  FiBell, 
  FiPhone, 
  FiInfo, 
  FiNavigation 
} from "react-icons/fi";

const NewsSection = () => {
  return (
    <section className="news-section">
      <div className="news-container">
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="news-header">
            <div className="news-title-group">
              <span className="news-subtitle">REQUISITOS Y PROCEDIMIENTOS</span>
              <h2 className="news-title">CÓMO SACAR TURNO</h2>
            </div>
          </div>
        </AnimatedContent>

        {/* GRILLA DE TARJETAS ACCESIBLES */}
        <div className="cards-grid" aria-label="Modalidades de atención y turnos">
          {/* TARJETA 1: Primera vez */}
          <AnimatedContent distance={50} direction="vertical" delay={0.15}>
            <article className="accessible-card">
              <span className="card-category-label">Inicio de trámite</span>

              <h2 className="card-title">¿Es su primera vez en este hospital?</h2>

              <div className="highlight-soft-box">
                <p>
                  Debe acudir primero a la salita o centro de salud más cercano
                  a su barrio.
                </p>
              </div>

              <p className="card-body-text">
                Allí el médico evaluará su caso y le entregará el papel de
                derivación con el que podrá ser atendido en nuestro hospital.
              </p>

              <div className="card-bottom-pill">
                <span>Presentarse con la orden de derivación</span>
              </div>
            </article>
          </AnimatedContent>

          {/* TARJETA 2: Pacientes del hospital (Destacada) */}
          <AnimatedContent distance={50} direction="vertical" delay={0.25}>
            <article className="accessible-card card-highlight">
              <span className="card-category-label">Gestión presencial</span>

              <h2 className="card-title">Turnos para pacientes del hospital</h2>

              <p className="card-body-text">
                Si ya se atiende en el hospital y necesita continuar su
                tratamiento, solicite su turno por ventanilla presentando:
              </p>

              <div className="requirements-list">
                <div className="requirement-item">
                  <span className="requirement-number">1</span>
                  <div className="requirement-content">
                    <span className="requirement-tag">DOCUMENTO DE IDENTIDAD</span>
                    <span className="requirement-title">D.N.I. original en mano</span>
                  </div>
                </div>

                <div className="requirement-item">
                  <span className="requirement-number">2</span>
                  <div className="requirement-content">
                    <span className="requirement-tag">INDICACIÓN DEL MÉDICO</span>
                    <span className="requirement-title">Orden médica o interconsulta</span>
                  </div>
                </div>
              </div>

              <div className="card-bottom-info">
                <div className="bottom-info-tag">HORARIO Y LUGAR DE ATENCIÓN</div>
                <div className="bottom-info-value">
                  De 06:00 a 13:00 hs. por ventanilla
                </div>
              </div>
            </article>
          </AnimatedContent>

          <AnimatedContent distance={50} direction="vertical" delay={0.35}>
            <article className="accessible-card">
              <span className="card-category-label category-alert">
                Avisos y cambios
              </span>

              <h2 className="card-title">Cancelar o cambiar su turno</h2>

              {/* Contenedor que absorbe y distribuye el espacio en blanco elegantemente */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                <div className="alert-notice-box" style={{ margin: 0 }}>
                  <div className="alert-heading">IMPORTANTE</div>
                  <p className="alert-text-bold">
                    Los turnos médicos NO se solicitan por teléfono.
                  </p>
                  <p className="alert-text-sub">
                    El pedido siempre debe realizarse de forma presencial.
                  </p>
                </div>

                <p className="card-body-text" style={{ margin: 0 }}>
                  Para reagendar un turno, debés dar aviso presencial o telefónico
                  con al menos 24 hs. de anticipación.
                </p>
              </div>

              {/* Pastilla de teléfono rediseñada para ocupar mejor el espacio */}
              <div className="card-bottom-pill-phone">
                <FiPhone className="pill-icon-phone" size={22} strokeWidth={2.5} />
                <span>4445561-4445541</span>
              </div>
            </article>
          </AnimatedContent>
        </div>

        {/* BANNER DE SEDE CENTRAL */}
        <AnimatedContent distance={50} direction="vertical" delay={0.45}>
          <section className="location-banner" aria-label="Información de la sede">
            <div className="location-left-group">
              <div className="location-icon-bubble" aria-hidden="true">
                <FiMapPin size={24} strokeWidth={2.2} />
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
              <Link to="/acerca-de#sede-central" className="btn-building-info" style={{ textDecoration: 'none' }}>
                <FiInfo size={18} strokeWidth={2.2} />
                Información del Edificio
              </Link>

              <Link to="/contacto#transporte-mapa" className="btn-how-to-arrive" style={{ textDecoration: 'none' }}>
                <FiNavigation size={18} strokeWidth={2.2} />
                Cómo llegar
              </Link>
            </div>
          </section>
        </AnimatedContent>
      </div>
    </section>
  );
};

export default NewsSection;