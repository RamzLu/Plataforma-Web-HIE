import React from "react";
import "./AboutPage.css";
import Breadcrumb from "../components/Breadcrumb";
import InteractiveTimelineSection from "../components/InteractiveTimelineSection";

// IMÁGENES INSTITUCIONALES
import iconImpacto from "../assets/iconImpacto.png";
import fotoFachada from "../assets/fotoFachadaHIE2.jpg";
import fotoAtencion from "../assets/fotoContacto.jpg";
import fotoQuirurgico from "../assets/imagenPacientes.jpg";
import fotoInternacion from "../assets/fondoHospitalCarrusel1.jpg";

const AboutPage = () => {
  return (
    <main className="about-page">
      <div className="about-container">
        {/* =========================================
            1. HERO / PRESENTACIÓN INSTITUCIONAL
        ========================================= */}
        <section className="about-hero">
          <div className="about-hero-left">
            <Breadcrumb currentPage="Institucional" />
            <span className="about-subtitle">
              Población, Red Sanitaria y Excelencia
            </span>
            <h1 className="about-title">HOSPITAL INTERDISTRITAL EVITA</h1>
            <p className="about-lead">
              Pilar fundamental del Polo Sanitario de la Provincia de Formosa,
              brindando atención médica integral, gratuita y de alta complejidad
              mediante convenios de cooperación interinstitucional.
            </p>
          </div>

          <div className="about-hero-right">
            <div className="about-hero-image-box">
              <img
                src={fotoFachada}
                alt="Fachada Hospital Interdistrital Evita"
                className="about-hero-img"
              />
            </div>
          </div>
        </section>
        {/* =========================================
            2. CIFRAS CLAVE DE INFRAESTRUCTURA
        ========================================= */}
        <section className="about-stats-section">
          <div className="about-stat-card">
            <span className="stat-number">19.000 m²</span>
            <span className="stat-label">
              Superficie Cubierta Diseñada bajo Normas Internacionales
            </span>
          </div>
          <div className="about-stat-card">
            <span className="stat-number">+200</span>
            <span className="stat-label">
              Camas de Terapia Intensiva y Soporte Crítico
            </span>
          </div>
          <div className="about-stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">
              Salud Pública, Gratuita e Inclusiva
            </span>
          </div>
          <div className="about-stat-card">
            <span className="stat-number">Fibra Óptica</span>
            <span className="stat-label">
              Red Provincial e Historia Clínica Digital
            </span>
          </div>
        </section>
        {/* =========================================
            3. HISTORIA, PANDEMIA Y TRANSICIÓN POLIVALENTE
        ========================================= */}
        <section className="about-history-section">
          <div className="about-section-header">
            <span className="header-tag">TRAYECTORIA Y COMPROMISO</span>
            <h2 className="header-title">
              ORIGEN, RESPUESTA SANITARIA Y PRESENTE
            </h2>
          </div>

          <div className="history-timeline">
            {/* HITO 1 */}
            <div className="timeline-item">
              <div className="timeline-badge-col">
                <div className="timeline-dot"></div>
                <span className="timeline-period">Infraestructura</span>
              </div>
              <div className="timeline-content-card">
                <h3>Diseño y Dotación Sanitaria Inicial</h3>
                <p>
                  La institución se asienta sobre una moderna infraestructura de
                  aproximadamente{" "}
                  <strong>17.000 a 19.000 metros cuadrados cubiertos</strong>,
                  diseñada bajo rigurosas normas sanitarias internacionales.
                  Desde su inicio, contó con una capacidad de 124 camas para
                  pacientes moderados y 36 camas de cuidados críticos, cada una
                  equipada con respiradores mecánicos de última generación.
                </p>
              </div>
            </div>

            {/* HITO 2 */}
            <div className="timeline-item">
              <div className="timeline-badge-col">
                <div className="timeline-dot"></div>
                <span className="timeline-period">Respuesta Crítica</span>
              </div>
              <div className="timeline-content-card">
                <h3>Pilar Sanitario en la Emergencia</h3>
                <p>
                  A medida que avanzaba la pandemia, el hospital expandió
                  rápidamente su capacidad operativa hasta{" "}
                  <strong>superar las 200 camas de terapia intensiva</strong>,
                  constituyéndose en el bastión neurálgico de contención,
                  asistencia respiratoria y monitoreo de pacientes críticos en
                  toda la región.
                </p>
              </div>
            </div>

            {/* HITO 3 */}
            <div className="timeline-item">
              <div className="timeline-badge-col">
                <div className="timeline-dot"></div>
                <span className="timeline-period">Actualidad</span>
              </div>
              <div className="timeline-content-card">
                <h3>Transición al Modelo Polivalente y Polo Sanitario</h3>
                <p>
                  Tras la disminución de la presión de emergencia, el hospital
                  consolidó con éxito su función original como{" "}
                  <strong>hospital polivalente de alta complejidad</strong>. Hoy
                  en día, es un pilar del Polo Sanitario de Formosa, brindando
                  cobertura médica de vanguardia mediante convenios de
                  cooperación formalizados a partir de 2021.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* =========================================
            4. EQUIPAMIENTO TECNOLÓGICO DE PUNTA
        ========================================= */}
        <section className="about-tech-section">
          <div className="about-section-header">
            <span className="header-tag">VANGUARDIA MÉDICA</span>
            <h2 className="header-title">TECNOLOGÍA DE ÚLTIMA GENERACIÓN</h2>
          </div>

          <div className="tech-cards-grid">
            <div className="tech-card">
              <div className="tech-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h4>Quirófanos Inteligentes</h4>
              <p>
                Salas de cirugía de alta precisión y un centro de esterilización
                avanzado con tecnología de <strong>plasma de peróxido</strong>.
              </p>
            </div>

            <div className="tech-card">
              <div className="tech-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h4>Diagnóstico y Monitoreo</h4>
              <p>
                Equipos de diagnóstico por imágenes de alta resolución,
                ecógrafos Doppler y monitores multiparamétricos en cada área
                asistencial.
              </p>
            </div>

            <div className="tech-card">
              <div className="tech-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <h4>Historia Clínica Digital</h4>
              <p>
                Robusta red informática conectada a la{" "}
                <strong>red provincial de fibra óptica</strong>, garantizando
                trazabilidad y teleconsultas interdistritales.
              </p>
            </div>
          </div>
        </section>
        {/* =========================================
    TARJETA DESTACADA: IMPACTO SOCIAL Y RECONOCIMIENTO
========================================= */}
        <section className="about-impact-section">
          <div className="impact-card">
            <div className="impact-icon-wrapper">
              <img
                src={iconImpacto}
                alt="Impacto Social y Reconocimiento"
                className="impact-img"
              />
            </div>

            <div className="impact-content">
              <h3 className="impact-title">Impacto Social y Reconocimiento</h3>
              <p className="impact-description">
                El Hospital Evita ha cumplido un rol social crucial, no solo por
                la cantidad de vidas salvadas durante la contingencia (con tasas
                de recuperación superiores al 80% en sus primeros años), sino
                por democratizar el acceso a tecnologías médicas avanzadas en la
                región.
              </p>
            </div>
          </div>
        </section>
        {/* =========================================
            5. SERVICIOS Y ESPECIALIDADES POLIVALENTES
        ========================================= */}
        <section className="about-services-section">
          <div className="about-section-header">
            <span className="header-tag">CARTERA DE PRESTACIONES</span>
            <h2 className="header-title">SERVICIOS Y UNIDADES FUNCIONALES</h2>
          </div>

          <div className="services-spec-grid">
            {/* GRUPO 1: ÁREAS CRÍTICAS */}
            <div className="spec-card">
              <div className="spec-card-header">
                <span className="spec-tag red">SOPORTE CRÍTICO</span>
                <h3>Áreas Críticas</h3>
              </div>
              <ul className="spec-list">
                <li>Terapia Intensiva (UCI Polivalente)</li>
                <li>Unidad Coronaria (UCO)</li>
                <li>Unidad de Quemados de Alta Complejidad</li>
              </ul>
            </div>

            {/* GRUPO 2: ESPECIALIDADES MÉDICAS */}
            <div className="spec-card">
              <div className="spec-card-header">
                <span className="spec-tag blue">CLÍNICA Y ESPECIALIDADES</span>
                <h3>Especialidades Médicas</h3>
              </div>
              <ul className="spec-list">
                <li>Cardiología y Neumonología</li>
                <li>Infectología y Neurología</li>
                <li>Nefrología (con Centro Integral de Diálisis)</li>
                <li>Salud Mental y Psiquiatría</li>
              </ul>
            </div>

            {/* GRUPO 3: SERVICIOS DE APOYO */}
            <div className="spec-card">
              <div className="spec-card-header">
                <span className="spec-tag green">DIAGNÓSTICO Y APOYO</span>
                <h3>Servicios Centrales</h3>
              </div>
              <ul className="spec-list">
                <li>Laboratorio y Anatomía Patológica</li>
                <li>Hemoterapia y Banco de Sangre</li>
                <li>Farmacia Hospitalaria y Esterilización</li>
                <li>Diagnóstico por Imágenes</li>
              </ul>
            </div>

            {/* GRUPO 4: CENTRO POST-COVID */}
            <div className="spec-card highlight">
              <div className="spec-card-header">
                <span className="spec-tag yellow">REHABILITACIÓN INTEGRAL</span>
                <h3>Atención Post-COVID</h3>
              </div>
              <p className="spec-card-desc">
                Centro de referencia provincial para la evaluación, seguimiento
                y rehabilitación multidisciplinaria de secuelas respiratorias,
                cardíacas y de salud mental.
              </p>
            </div>
          </div>
        </section>
        <InteractiveTimelineSection />
        {/* =========================================
            6. MISIÓN, VISIÓN Y VALORES
        ========================================= */}
        <section className="about-mvv-section">
          <div className="about-section-header">
            <span className="header-tag">IDENTIDAD Y PROPÓSITO</span>
            <h2 className="header-title">MISIÓN, VISIÓN Y VALORES</h2>
          </div>

          <div className="mvv-grid">
            <div className="mvv-card">
              <div className="mvv-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </div>
              <h3>MISIÓN</h3>
              <p>
                Brindar atención médica de alta complejidad con equidad, calidez
                y excelencia profesional, garantizando el acceso universal a la
                salud para cada habitante de la provincia.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <h3>VISIÓN</h3>
              <p>
                Ser un hospital modelo en el norte argentino en gestión clínica,
                tecnología médica, investigación y docencia continua, integrado
                a la red provincial de salud.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>VALORES</h3>
              <p>
                Vocación de servicio, compromiso ético, trabajo en equipo,
                respeto por la dignidad del paciente y búsqueda permanente de la
                innovación asistencial.
              </p>
            </div>
          </div>
        </section>
        {/* =========================================
            7. GALERÍA EDITORIAL DE INSTALACIONES
        ========================================= */}
        <section className="about-gallery-section">
          <div className="about-section-header">
            <span className="header-tag">INFRAESTRUCTURA SANITARIA</span>
            <h2 className="header-title">NUESTRAS INSTALACIONES</h2>
          </div>

          <div className="about-gallery-grid">
            <div className="gallery-item large">
              <img
                src={fotoQuirurgico}
                alt="Bloque Quirúrgico de Alta Complejidad"
              />
              <div className="gallery-caption">
                <span>Quirófanos Inteligentes y Esterilización</span>
              </div>
            </div>

            <div className="gallery-item">
              <img src={fotoAtencion} alt="Sector de Consultas y Atención" />
              <div className="gallery-caption">
                <span>Atención Ambulatoria y Gestión Clínica</span>
              </div>
            </div>

            <div className="gallery-item">
              <img
                src={fotoInternacion}
                alt="Áreas de Internación y Cuidados Críticos"
              />
              <div className="gallery-caption">
                <span>Unidades de Cuidados Críticos y Terapia</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
