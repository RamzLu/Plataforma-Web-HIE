import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/pages/ResidenciasPage.css";
import PageBanner from "../../components/PageBanner";
import fondoBanner from "../../assets/banner_residencias.png";
import medicosImg from "../../assets/medicos-residencias.jpg";
import AnimatedContent from "../../components/ui/AnimatedContent";
import { getResidencias } from "../../api/residencias.api";

const ResidenciasPage = () => {
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchResidencias = async () => {
      try {
        const data = await getResidencias();
        // Filtrar solo las residencias publicadas para el portal público
        const publicadas = Array.isArray(data)
          ? data.filter((item) => item.estado === "PUBLICADO")
          : [];
        setResidencias(publicadas);
      } catch (error) {
        console.error("Error al cargar residencias públicas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidencias();
  }, []);

  return (
    <main className="residencias-page">
      {/* Banner Principal Modular */}
      <PageBanner
        currentPage="Residencias"
        title="RESIDENCIAS MÉDICAS"
        subtitle="Conozca las convocatorias y programas formativos de posgrado de nuestra institución"
        image={fondoBanner}
      />

      <div className="residencias-container">
        {/* Showcase / Hero Card Institucional */}
        <AnimatedContent
          distance={25}
          direction="vertical"
          delay={0.08}
          className="res-hero-animation-wrapper"
        >
          <section className="res-hero-card" aria-label="Excelencia en Alta Complejidad y Vocación Pública">
            <div className="res-hero-content">
              <h2 className="res-hero-title">
                Excelencia en Alta Complejidad <span className="res-hero-amp">&</span> Vocación Pública
              </h2>
              <p className="res-hero-description">
                El Hospital Interdistrital Evita convoca a profesionales de las ciencias médicas para integrarse a sus equipos interdisciplinarios. Formación tutelada en servicio, tecnología biomédica de vanguardia y dedicación humanizada al servicio de toda la región.
              </p>
              <Link to="/especialidades" className="res-hero-btn" title="Ir a Especialidades">
                <span>Ver Especialidades Disponibles</span>
                <svg
                  className="res-hero-btn-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>

            <div className="res-hero-media">
              <img
                src={medicosImg}
                alt="Equipo médico y residentes del Hospital Interdistrital Evita"
                className="res-hero-img"
                loading="eager"
              />
            </div>
          </section>
        </AnimatedContent>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
            Cargando convocatorias y residencias disponibles...
          </div>
        ) : (
          <div className="residencias-content-area" style={{ width: "100%" }}>
            {/* Próximos componentes del módulo de residencias */}
          </div>
        )}
      </div>
    </main>
  );
};

export default ResidenciasPage;
