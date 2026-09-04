import React, { useRef, useState, useEffect } from "react"; // <-- Importamos useEffect
import { Link, useLocation } from "react-router-dom"; // <-- Importamos useLocation
import "../styles/pages/AboutPage.css";
import Breadcrumb from "../components/Breadcrumb";
import ReactCountUp from "react-countup";
const CountUp = ReactCountUp.default || ReactCountUp;
import AnimatedContent from "../components/AnimatedContent";

// IMÁGENES INSTITUCIONALES
import fotoHeroHeader from "../assets/foto-sede.jpg";
import fotoVideoCover from "../assets/fondoHospitalCarrusel1.jpg";

// VIDEO INSTITUCIONAL
import videoInstitucional from "../assets/video-hospital-evita.mp4";

// COMPONENTES
import InteractiveTimelineSection from "../components/InteractiveTimelineSection";

// Fotos de autoridades
import fotoDirector from "../assets/imagen-temporal-autoridades.jpg";

const AUTORIDADES = [
  {
    cargo: "DIRECTORA GENERAL",
    nombre: "Dra. Paula Ramírez",
    especialidad: "Gestión médica, formación de residentes y telemedicina provincial.",
    foto: fotoDirector,
  },
  {
    cargo: "SUBDIRECTORA DE GESTIÓN ADMINISTRATIVA",
    nombre: "Dra. Silvia Aquino",
    especialidad: "Contadora Pública",
    foto: fotoDirector,
  },
  {
    cargo: "SUBDIRECTOR DE MANTENIMIENTO Y SERVICIOS GENERALES",
    nombre: "Ing. Santiago Jojot",
    especialidad: "Ingeniería clínica y gestión de infraestructura hospitalaria.",
    foto: fotoDirector,
  },
];

const VALORES_INSTITUCIONALES = [
  {
    titulo: "Excelencia y Calidez",
    descripcion: "Brindamos atención médica de máxima calidad profesional, priorizando el trato humano, empático y respetuoso hacia el paciente y su familia.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
      </svg>
    ),
  },
  {
    titulo: "Equidad e Inclusión",
    descripcion: "Garantizamos el acceso universal, público y gratuito a la salud de alta complejidad para toda la comunidad formoseña sin distinción.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
        <path d="M2 12h20"></path>
      </svg>
    ),
  },
  {
    titulo: "Innovación y Compromiso",
    descripcion: "Apostamos a la tecnología médica de vanguardia, la capacitación continua, la investigación y la ética profesional constante.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
    ),
  },
];

const AboutPage = () => {
  const { hash } = useLocation(); // <-- Intercepta el Hash de la URL

  const videoSectionRef = useRef(null);
  const htmlVideoRef = useRef(null);
  const autoridadesRef = useRef(null);
  const valoresRef = useRef(null);
  const sedeCentralRef = useRef(null); // <-- Referencia para la sede central

  const [isPlaying, setIsPlaying] = useState(false);

  // EFECTO PARA HACER SCROLL AUTOMÁTICO SI LA URL TIENE UN HASH
  useEffect(() => {
    if (hash === '#sede-central' && sedeCentralRef.current) {
      setTimeout(() => {
        sedeCentralRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // Un pequeño retraso asegura que el DOM esté listo
    }
  }, [hash]);

  const handlePlayVideo = () => {
    setIsPlaying(true);
    if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(() => {
      if (htmlVideoRef.current) {
        htmlVideoRef.current.play();
      }
    }, 300);
  };

  const scrollToAutoridades = (e) => {
    e.preventDefault();
    if (autoridadesRef.current) {
      autoridadesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToValores = (e) => {
    e.preventDefault();
    if (valoresRef.current) {
      valoresRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="about-page-clean">
      <section className="about-hero-banner">
        <img
          src={fotoHeroHeader}
          alt="Hospital Interdistrital Evita"
          className="hero-banner-img"
        />
        <button className="hero-video-btn" onClick={handlePlayVideo}>
          <span>Ver video</span>
          <span className="play-triangle">▶</span>
        </button>
      </section>

      <div className="about-main-wrapper">
        <div className="about-top-grid">
          <div className="about-left-content">
            <Breadcrumb currentPage="ACERCA DEL HIE" />
            <h1 className="about-clean-title">ACERCA DEL HIE</h1>

            <div className="about-text-columns">
              <p>
                El <strong>Hospital Interdistrital Evita</strong> es un centro
                de <strong>alta complejidad</strong> referente en la provincia
                de Formosa y la región, asentado sobre una moderna
                infraestructura de{" "}
                <strong>19.000 metros cuadrados cubiertos</strong> proyectada
                bajo rigurosas normas sanitarias internacionales.
              </p>
              <p>
                Concebido como un pilar fundamental del{" "}
                <strong>Polo Sanitario</strong>, ofrece soluciones médicas
                especializadas, equipamiento de última generación y un
                compromiso inquebrantable con la{" "}
                <strong>salud pública, gratuita y de calidad</strong>.
              </p>
              <p>
                Cuenta con <strong>quirófanos inteligentes</strong>, centro de
                esterilización con tecnología de plasma de peróxido, unidades de
                terapia intensiva y una red de conectividad por{" "}
                <strong>fibra óptica provincial</strong> para la gestión
                integral de la Historia Clínica Digital.
              </p>
              <p>
                A su vez, promueve la <strong>Docencia e Investigación</strong>{" "}
                a través de residencias médicas y convenios interinstitucionales
                de cooperación técnica y académica.
              </p>
            </div>
          </div>

          <aside className="about-right-sidebar">
            <ul className="sidebar-menu-list">
              <li>
                <a href="#autoridades" onClick={scrollToAutoridades}>
                  <span>AUTORIDADES</span>
                  <span className="arrow">→</span>
                </a>
              </li>
              <li>
                <Link to="/profesionales">
                  <span>COMITÉS MÉDICOS</span>
                  <span className="arrow">→</span>
                </Link>
              </li>
              <li>
                <a href="#valores" onClick={scrollToValores}>
                  <span>NUESTROS VALORES</span>
                  <span className="arrow">→</span>
                </a>
              </li>
            </ul>
          </aside>
        </div>
        <section className="about-stats-clean">
          <div className="stat-clean-item">
            <span className="stat-clean-num">
              <CountUp prefix="+" end={49200} separator="." duration={2.5} enableScrollSpy scrollSpyOnce />
            </span>
            <span className="stat-clean-text">ATENCIONES MÉDICAS ANUALES ESTIMADAS</span>
          </div>

          <div className="stat-clean-item">
            <span className="stat-clean-num">
              <CountUp prefix="+" end={200} duration={2.5} enableScrollSpy scrollSpyOnce />
            </span>
            <span className="stat-clean-text">CAMAS DE INTERNACIÓN Y CUIDADOS CRÍTICOS</span>
          </div>

          <div className="stat-clean-item">
            <span className="stat-clean-num">
              <CountUp end={19000} separator="." duration={2.5} enableScrollSpy scrollSpyOnce />
            </span>
            <span className="stat-clean-text">METROS CUADRADOS CUBIERTOS</span>
          </div>

          <div className="stat-clean-item">
            <span className="stat-clean-num">
              <CountUp end={100} suffix="%" duration={2.5} enableScrollSpy scrollSpyOnce />
            </span>
            <span className="stat-clean-text">SALUD PÚBLICA Y GRATUITA</span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECCIÓN SEDE CENTRAL CON EL ID Y LA REFERENCIA AGREGADA   */}
        {/* ========================================================= */}
        <section 
          id="sede-central" 
          ref={sedeCentralRef} 
          className="about-single-sede-section"
        >
          <AnimatedContent distance={50} direction="vertical" delay={0.1}>
            <div className="single-sede-card">
              <div className="sede-img-box">
                <img
                  src={fotoHeroHeader}
                  alt="Edificio Principal Hospital Evita"
                />
              </div>

              <div className="sede-description-box">
                <span className="sede-tag">SEDE CENTRAL</span>
                <h3 className="sede-title">
                  Edificio Principal - Hospital Evita
                </h3>
                <p className="sede-address">
                  <strong>Ubicación:</strong> Av. José de Luca Barberis N° 250,
                  Formosa, Argentina
                </p>
                <p className="sede-desc-text">
                  Infraestructura médica de vanguardia con 19.000 m² cubiertos
                  diseñados bajo normas internacionales de arquitectura
                  hospitalaria. Alberga la Guardia Central de Urgencias (24 hs),
                  bloques quirúrgicos inteligentes, unidades de cuidados
                  intensivos y el centro de diagnóstico por imágenes.
                </p>
                <div className="sede-badge-list">
                  <span className="badge-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Guardia Activa 24 Hs.
                  </span>
                  <span className="badge-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    (3704) 436-100
                  </span>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>

        <section className="about-video-section" ref={videoSectionRef}>
          <AnimatedContent distance={50} direction="vertical" delay={0.1}>
            <div className="video-frame-container">
              {isPlaying ? (
                <video
                  ref={htmlVideoRef}
                  src={videoInstitucional}
                  controls
                  autoPlay
                  className="video-element"
                />
              ) : (
                <>
                  <img
                    src={fotoVideoCover}
                    alt="Video Institucional HIE"
                    className="video-cover-img"
                  />
                  <div className="video-overlay" onClick={handlePlayVideo}>
                    <button className="play-circle-btn">
                      <span className="play-icon">▶</span>
                    </button>
                    <span className="video-caption-text">
                      Ver video institucional
                    </span>
                  </div>
                </>
              )}
            </div>
          </AnimatedContent>
        </section>
        <section
          id="valores"
          className="about-valores-section"
          ref={valoresRef}
        >
          <div className="valores-header">
            <span className="valores-tag">PRINCIPIOS INSTITUCIONALES</span>
            <h2 className="valores-title">NUESTROS VALORES</h2>
          </div>

          <div className="valores-grid">
            {VALORES_INSTITUCIONALES.map((val, idx) => (
              <AnimatedContent
                key={idx}
                distance={50}
                delay={idx * 0.15}
                scale={0.96}
              >
                <div key={idx} className="valor-clean-card">
                  <div className="valor-icon-box">{val.icono}</div>
                  <h3 className="valor-card-title">{val.titulo}</h3>
                  <p className="valor-card-desc">{val.descripcion}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </section>
        <InteractiveTimelineSection />
        <section
          id="autoridades"
          className="about-authorities-section"
          ref={autoridadesRef}
        >
          <div className="authorities-header">
            <span className="authorities-tag">EQUIPO DIRECTIVO</span>
            <h2 className="authorities-title">AUTORIDADES DEL HOSPITAL</h2>
          </div>

          <div className="authorities-grid">
            {AUTORIDADES.map((item, idx) => (
              <AnimatedContent
                key={idx}
                distance={50}
                delay={idx * 0.15}
                scale={0.96}
              >
                <div key={idx} className="authority-card">
                  <div className="authority-img-box">
                    <img src={item.foto} alt={item.nombre} />
                  </div>
                  <div className="authority-info">
                    <span className="authority-role">{item.cargo}</span>
                    <h3 className="authority-name">{item.nombre}</h3>
                    <p className="authority-spec">{item.especialidad}</p>
                  </div>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;