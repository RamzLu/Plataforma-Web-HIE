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
        // false = Solo trae los elementos que están "Activos" para el público
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
                  >
                    <h3>{item.nombre}</h3>
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

            <div className="esp-aislado-body">
              {selectedItem.descripcion && (
                <div className="esp-aislado-info-section">
                  <h4 className="esp-aislado-info-title">
                    <span className="esp-aislado-info-icon">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </span>
                    {selectedItem.pregunta || "¿Qué atendemos aquí?"}
                  </h4>
                  <p className="esp-aislado-info-text italic">{selectedItem.descripcion}</p>
                </div>
              )}

              <div className="esp-aislado-info-section">
                <div className="esp-aislado-info-row">
                  <span className="esp-aislado-info-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <p className="esp-aislado-info-text">
                    <strong>Ubicación:</strong> {selectedItem.ubicacion || "Consultar en Admisión"}
                  </p>
                </div>
                <div className="esp-aislado-info-row">
                  <span className="esp-aislado-info-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </span>
                  <p className="esp-aislado-info-text">
                    <strong>Horarios:</strong> {selectedItem.horarios || "Consultar horarios disponibles"}
                  </p>
                </div>
              </div>

              {selectedItem.requisitos && selectedItem.requisitos.length > 0 && (
                <div className="esp-aislado-info-section">
                  <h4 className="esp-aislado-info-title">
                    <span className="esp-aislado-info-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </span>
                    REQUISITOS IMPORTANTES:
                  </h4>
                  <ul className="esp-aislado-requisitos-lista">
                    {selectedItem.requisitos.map((req, index) => (
                      <li key={index} className="esp-aislado-info-text">
                        {req && req.includes("DNI") ? (
                          <>
                            <span className="esp-aislado-text-danger">
                              Traer DNI original.
                            </span>{" "}
                            {req
                              .replace("Traer DNI original.", "")
                              .replace("Asistir con DNI y", "Y")
                              .replace("Asistir con DNI.", "")}
                          </>
                        ) : (
                          req
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="esp-aislado-footer">
              <button className="esp-aislado-btn-cerrar" onClick={closeModal}>
                Cerrar y Volver
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default EspecialidadesPage;