import React, { useState, useEffect } from "react";
import "../../styles/pages/EspecialidadesPage.css";
import Breadcrumb from "../../components/Breadcrumb";
import fondoBannerEsp from "../../assets/banner_especialidades.png";
import AnimatedContent from "../../components/ui/AnimatedContent";
import { getEspecialidades } from "../../api/especialidades.api.js";

const EspecialidadesPage = () => {
  const [currentView, setCurrentView] = useState("menu");
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [especialidadesData, setEspecialidadesData] = useState([]);
  const [serviciosData, setServiciosData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDatos = async () => {
      try {
        const data = await getEspecialidades(false); 
        setEspecialidadesData(data.filter(item => !item.esServicio));
        setServiciosData(data.filter(item => item.esServicio));
      } catch (error) {
        console.error("Error cargando áreas de atención", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  const closeModal = () => setSelectedItem(null);

  return (
    <main className="especialidades-page">
      <div
        className="esp-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 111, 196, 0.85), rgba(233, 235, 238, 0.85)), url(${fondoBannerEsp})`,
        }}
      >
        <div className="esp-header-inner">
          <Breadcrumb currentPage="Áreas de Atención" />
          <h1 className="esp-main-title">Áreas de Atención</h1>
          <p className="esp-subtitle">
            Conozca los servicios y especialidades médicas de nuestra institución
          </p>
        </div>
      </div>

      <div className="especialidades-container">
        {currentView === "menu" && (
          <div className="esp-main-menu">
            <AnimatedContent
              distance={40}
              direction="vertical"
              delay={0.1}
              threshold={0.1}
            >
              <div
                className="menu-card"
                onClick={() => setCurrentView("grilla-esp")}
              >
                <div className="menu-card-icon">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                </div>
                <h2>Especialidades</h2>
              </div>
            </AnimatedContent>
            
            <AnimatedContent
              distance={40}
              direction="vertical"
              delay={0.2}
              threshold={0.1}
            >
              <div
                className="menu-card"
                onClick={() => setCurrentView("grilla-serv")}
              >
                <div className="menu-card-icon">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </div>
                <h2>Servicios Clave</h2>
              </div>
            </AnimatedContent>
          </div>
        )}

        {(currentView === "grilla-esp" || currentView === "grilla-serv") && (
          <>
            <div className="esp-grid-header">
              <button
                className="btn-volver"
                onClick={() => setCurrentView("menu")}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                Volver
              </button>
              <h3 className="esp-instruction">
                Seleccione{" "}
                {currentView === "grilla-esp" ? "la especialidad" : "el servicio"}{" "}
                para ver horarios y requisitos:
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                Cargando áreas de atención...
              </div>
            ) : (
              <div className="specialties-grid">
                {(currentView === "grilla-esp" ? especialidadesData : serviciosData).map((item) => (
                  <div
                    key={item.id}
                    className="specialty-card"
                    onClick={() => setSelectedItem(item)}
                    style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: "30px 15px", alignItems: "center", justifyContent: "center" }}
                  >
                    <h3 style={{ margin: 0, textAlign: "center" }}>{item.nombre}</h3>
                  </div>
                ))}
                
                {(currentView === "grilla-esp" ? especialidadesData : serviciosData).length === 0 && (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>
                    No hay {currentView === "grilla-esp" ? "especialidades" : "servicios"} registrados en este momento.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL AISLADO */}
      {selectedItem && (
        <div className="esp-aislado-overlay" onClick={closeModal}>
          <div
            className="esp-aislado-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA INTACTA */}
            <div className="esp-aislado-header">
              <h2>
                {selectedItem.esServicio ? "SERVICIO" : "ESPECIALIDAD"}: {selectedItem.nombre}
              </h2>
              <button
                className="esp-aislado-btn-close"
                onClick={closeModal}
                title="Cerrar ventana"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* NUEVO CUERPO DEL MODAL (ESTILO APLICADO) */}
            <div className="modal-body">
              
              {/* Sección: ¿Qué atendemos aquí? */}
              {selectedItem.descripcion && (
                <section className="section-scope" aria-labelledby="scope-title">
                  <div className="section-heading-row">
                    <svg className="section-info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <h2 id="scope-title" className="section-heading-title">
                      {selectedItem.pregunta || "¿Qué atendemos aquí?"}
                    </h2>
                  </div>
                  <p className="scope-description-text">
                    {selectedItem.descripcion}
                  </p>
                </section>
              )}

              {/* Tarjetas de Ubicación y Horarios */}
              <div className="info-cards-grid">
                
                {/* Ubicación */}
                <article className="info-box-card">
                  <div className="card-icon-bubble" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3" />
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    </svg>
                  </div>
                  <div className="card-data">
                    <span className="card-kicker">UBICACIÓN</span>
                    <strong className="card-main-val">{selectedItem.ubicacion || "Consultar en Admisión"}</strong>
                  </div>
                </article>

                {/* Horarios de Atención */}
                <article className="info-box-card">
                  <div className="card-icon-bubble" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="card-data">
                    <span className="card-kicker">HORARIOS DE ATENCIÓN</span>
                    <strong className="card-main-val">{selectedItem.horarios || "Consultar horarios disponibles"}</strong>
                  </div>
                </article>

              </div>

              {/* Tarjeta de Requisitos Importantes */}
              {selectedItem.requisitos && selectedItem.requisitos.length > 0 && (
                <section className="requirements-banner" aria-labelledby="req-title">
                  <div className="req-header-row">
                    <span className="req-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <h2 id="req-title" className="req-title">
                      REQUISITOS IMPORTANTES:
                    </h2>
                  </div>
                  <ul className="req-list">
                    {selectedItem.requisitos.map((req, index) => (
                      <li key={index} className="req-item">
                        <span className="req-bullet" aria-hidden="true" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default EspecialidadesPage;