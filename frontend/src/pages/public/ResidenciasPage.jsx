import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/pages/ResidenciasPage.css";
import PageBanner from "../../components/PageBanner";
import fondoBanner from "../../assets/banner_residencias.png";
import medicosImg from "../../assets/medicos-residencias.jpg";
import AnimatedContent from "../../components/ui/AnimatedContent";
import { getResidencias } from "../../api/residencias.api";
import { sanitizeUrl } from "../../utils/sanitizeUrl";
import { getEspacioGraficoPublico } from "../../api/contenidoGrafico.api.js";
import {
  DEFAULT_RESIDENCIAS_HERO,
  normalizeInternalPortalPath,
  resolveGraphicImageUrl,
} from "../../utils/contenidoGraficoPresets.js";

const CACHE_KEY_HERO = "hie_public_residencias_destacado_cache";

const leerCacheHeroInicial = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_HERO);
    if (!raw) return DEFAULT_RESIDENCIAS_HERO;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
  return DEFAULT_RESIDENCIAS_HERO;
};

const ResidenciasPage = () => {
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [heroConfig, setHeroConfig] = useState(leerCacheHeroInicial);

  useEffect(() => {
    let cancelado = false;
    const cargarHeroResidencias = async () => {
      try {
        const data = await getEspacioGraficoPublico(
          "espacio-residencias-destacado"
        );
        if (!cancelado && data && typeof data === "object") {
          setHeroConfig(data);
          try {
            sessionStorage.setItem(CACHE_KEY_HERO, JSON.stringify(data));
          } catch {
            // Ignorar
          }
        }
      } catch (error) {
        console.error(
          "Error al cargar la tarjeta destacada de Residencias:",
          error
        );
      }
    };

    cargarHeroResidencias();
    return () => {
      cancelado = true;
    };
  }, []);

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

        // Expandir por defecto la primera residencia publicada si existe (como en la referencia)
        if (publicadas.length > 0) {
          setExpandedIds(new Set([publicadas[0].id.toString()]));
        }
      } catch (error) {
        console.error("Error al cargar residencias públicas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidencias();
  }, []);

  // Alternar apertura/cierre de una tarjeta
  const toggleExpand = (id) => {
    const stringId = id.toString();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stringId)) {
        next.delete(stringId);
      } else {
        next.add(stringId);
      }
      return next;
    });
  };

  // Formateador de fecha
  const formatFecha = (fechaStr, fallbackDate) => {
    if (fechaStr && typeof fechaStr === "string") {
      const parts = fechaStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    if (fallbackDate) {
      const d = new Date(fallbackDate);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return "14/10/2026";
  };

  // Renderizar la lista de requisitos con tildes institucionales
  const renderRequisitos = (requisitosText) => {
    if (!requisitosText || !requisitosText.trim()) {
      return (
        <ul className="res-requisitos-list">
          <li className="res-requisito-item">
            <svg
              className="res-check-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Título de Médico habilitado nacional o convalidado.</span>
          </li>
          <li className="res-requisito-item">
            <svg
              className="res-check-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Inscripción formal en el Sistema Único de Residencias de Formosa.</span>
          </li>
        </ul>
      );
    }

    const lines = requisitosText
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^[•\-\*✓\s]+/, ""))
      .filter(Boolean);

    return (
      <ul className="res-requisitos-list">
        {lines.map((line, idx) => (
          <li key={idx} className="res-requisito-item">
            <svg
              className="res-check-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="residencias-page">
      {/* 1. Banner Principal Modular */}
      <PageBanner
        currentPage="Residencias"
        title="RESIDENCIAS MÉDICAS"
        subtitle="Conozca las convocatorias y programas formativos de posgrado de nuestra institución"
        image={fondoBanner}
      />

      <div className="residencias-container">
        {/* 2. Hero Card Informativo */}
        <AnimatedContent
          distance={25}
          direction="vertical"
          delay={0.08}
          className="res-hero-animation-wrapper"
        >
          <section
            className="res-hero-card"
            aria-label={
              heroConfig?.titulo ||
              "Excelencia en Alta Complejidad y Vocación Pública"
            }
          >
            <div className="res-hero-content">
              <h2 className="res-hero-title">
                {(() => {
                  const texto =
                    heroConfig?.titulo || DEFAULT_RESIDENCIAS_HERO.titulo;
                  if (texto.includes("&")) {
                    const partes = texto.split("&");
                    return (
                      <>
                        {partes[0]}
                        <span className="res-hero-amp">&</span>
                        {partes.slice(1).join("&")}
                      </>
                    );
                  }
                  return texto;
                })()}
              </h2>
              <p className="res-hero-description">
                {String(
                  heroConfig?.parrafoDescripcion ||
                    DEFAULT_RESIDENCIAS_HERO.parrafoDescripcion,
                )
                  .split("\n")
                  .map((linea, idxL, lineas) => (
                    <React.Fragment key={idxL}>
                      {linea}
                      {idxL < lineas.length - 1 && <br />}
                    </React.Fragment>
                  ))}
              </p>
              {heroConfig?.textoBoton && (
                <Link
                  to={
                    normalizeInternalPortalPath(heroConfig?.enlaceUrl) ||
                    "/especialidades"
                  }
                  className="res-hero-btn"
                  title={heroConfig?.textoBoton}
                >
                  <span>{heroConfig?.textoBoton}</span>
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
              )}
            </div>

            <div className="res-hero-media">
              <img
                src={
                  resolveGraphicImageUrl(heroConfig?.imagenes?.[0]) ||
                  medicosImg
                }
                alt={
                  heroConfig?.altText ||
                  heroConfig?.imagenes?.[0]?.altText ||
                  "Equipo médico y residentes del Hospital Interdistrital Evita"
                }
                className="res-hero-img"
                loading="eager"
              />
            </div>
          </section>
        </AnimatedContent>

        {/* 3. Sección Especialidades Médicas Acreditadas */}
        <section className="res-programs-section" aria-label="Especialidades Médicas Acreditadas">
          <div className="res-section-header">
            <span className="res-section-eyebrow">OFERTA ACADÉMICA DE POSGRADO</span>
            <h2 className="res-section-title">ESPECIALIDADES MÉDICAS ACREDITADAS</h2>
            <p className="res-section-subtitle">
              Seleccione cualquiera de los programas para consultar sus contenidos curriculares, requisitos ministeriales y acceder a los programas oficiales.
            </p>
          </div>

          {loading ? (
            <div className="res-loading-state">
              Cargando programas de residencias médicas...
            </div>
          ) : residencias.length === 0 ? (
            <div className="res-empty-state">
              Actualmente no hay convocatorias de residencias publicadas.
            </div>
          ) : (
            <div className="res-cards-list">
              {residencias.map((residencia) => {
                const isExpanded = expandedIds.has(residencia.id.toString());
                const estadoConvocatoria = residencia.convocatoria?.toLowerCase().includes("abierta")
                  ? "Convocatoria Abierta"
                  : residencia.convocatoria?.toLowerCase().includes("cerrada")
                  ? "Convocatoria Cerrada"
                  : residencia.convocatoria?.toLowerCase().includes("proximamente")
                  ? "Próximamente"
                  : `Convocatoria ${residencia.convocatoria || "Abierta"}`;

                const fechaFormateada = formatFecha(
                  residencia.fechaConvocatoria,
                  residencia.createdAt
                );

                const documentoUrl = sanitizeUrl(residencia.documentoUrl || residencia.archivoUrl);
                const documentoNombre = residencia.documentoNombre || residencia.archivoNombre;

                return (
                  <article key={residencia.id} className="res-card">
                    {/* Encabezado Azul Océano de la Tarjeta */}
                    <header className="res-card-header">
                      <div className="res-card-header-left">
                        <h3 className="res-card-title">{residencia.nombre}</h3>
                      </div>

                      <button
                        type="button"
                        className="res-header-toggle-btn"
                        onClick={() => toggleExpand(residencia.id)}
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? "Ocultar detalles" : "Ver programa"}</span>
                        <svg
                          className={`res-chevron-icon ${isExpanded ? "rotated" : ""}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </header>

                    {/* Resumen siempre visible */}
                    <div className="res-card-body">
                      <div className="res-meta-line">
                        <span className="res-meta-category-label">Categoría:</span>{" "}
                        {residencia.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano"}
                        <span className="res-meta-dot">•</span>
                        <span className="res-meta-date">{fechaFormateada}</span>
                        <span className="res-meta-dot">•</span>
                        <span className="res-meta-status">{estadoConvocatoria}</span>
                      </div>

                      <p className="res-copete">{residencia.descripcion}</p>

                      <div className="res-actions-bar">
                        {documentoUrl ? (
                          <a
                            href={documentoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="res-btn-download"
                            download={documentoNombre || "Programa_Residencia.pdf"}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Descargar</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="res-btn-download"
                            onClick={() =>
                              toast("El documento oficial estará disponible próximamente.", {
                                icon: "📄",
                              })
                            }
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Descargar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="res-btn-toggle-req"
                          onClick={() => toggleExpand(residencia.id)}
                          aria-expanded={isExpanded}
                        >
                          <span>{isExpanded ? "Cerrar requisitos" : "Ver requisitos y rotación"}</span>
                          <svg
                            className={`res-chevron-icon ${isExpanded ? "rotated" : ""}`}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>

                      {/* Contenido Expandido del Programa */}
                      {isExpanded && (
                        <div className="res-expanded-content">
                          {/* Columna Izquierda */}
                          <div className="res-expanded-left">
                            <h4 className="res-subheading">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#0088b7"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                              </svg>
                              <span>Descripción del Programa Académico</span>
                            </h4>
                            <p className="res-program-description">
                              {residencia.descripcionPrograma || residencia.descripcion}
                            </p>

                            <div className="res-stats-grid">
                              <div className="res-stat-box">
                                <span className="res-stat-label">DISPONIBILIDAD DE CUPOS</span>
                                <span className="res-stat-value">
                                  {residencia.cupos || "6 Cupos Remunerados"}
                                </span>
                              </div>
                              <div className="res-stat-box">
                                <span className="res-stat-label">DURACIÓN OFICIAL</span>
                                <span className="res-stat-value">
                                  {residencia.duracion || "4 Años • Sede Hospital Interdistrital Evita"}
                                </span>
                              </div>
                            </div>

                            <h4 className="res-subheading">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#0088b7"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              <span>Requisitos para la Postulación Provincial</span>
                            </h4>
                            {renderRequisitos(residencia.requisitos)}
                          </div>

                          {/* Columna Derecha */}
                          <div className="res-expanded-right">
                            <div className="res-right-media">
                              <img
                                src={residencia.bannerUrl || medicosImg}
                                alt={residencia.nombre}
                                className="res-right-img"
                              />
                            </div>

                            <h4 className="res-rotation-title">
                              Reglamento y Programa de Rotación
                            </h4>
                            <p className="res-rotation-desc">
                              {residencia.reglamentoRotacion ||
                                `Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de ${residencia.nombre}.`}
                            </p>

                            {documentoUrl ? (
                              <a
                                href={documentoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="res-btn-program-pdf"
                                download={documentoNombre || "Programa_Residencia.pdf"}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>Descargar Programa (PDF)</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="res-btn-program-pdf"
                                onClick={() =>
                                  toast(
                                    "El programa académico en PDF estará disponible próximamente.",
                                    { icon: "📄" }
                                  )
                                }
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>Descargar Programa (PDF)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ResidenciasPage;
