import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "../../styles/pages/ProfesionalesPage.css";

import Breadcrumb from "../../components/Breadcrumb";
import AnimatedContent from "../../components/ui/AnimatedContent";
const normalizeText = (text) => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const SpecialtyRow = ({ especialidad, profesionales, onSelectProf }) => {
  const getIniciales = (nombre, apellido) => `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();
  
const swiperRef = useRef(null);

  const [prevEl, setPrevEl] = useState(null);
  const [nextEl, setNextEl] = useState(null);

  return (
    <div className="specialty-active-header" style={{ marginBottom: "60px" }}>
      <div className="specialty-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
        <span>{profesionales[0]?.esServicioClave ? "SERVICIO CLAVE" : "ESPECIALIDAD MÉDICA"}</span>
      </div>
      <h1 className="active-specialty-title">{especialidad}</h1>
      <p className="active-specialty-subtitle">Staff de Profesionales</p>

      <div className="carousel-viewport-wrapper">
        
        <button
          type="button"
          className="carousel-nav-btn prev-btn"
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="doctors-cards-track">
          <Swiper
    modules={[Autoplay]}
    onSwiper={(swiper) => (swiperRef.current = swiper)}
    spaceBetween={30}
    slidesPerView={1}
    centeredSlides={profesionales.length > 1}
    loop={profesionales.length >= 5}
    rewind={profesionales.length < 5}
    breakpoints={{
      768: { slidesPerView: profesionales.length >= 2 ? 2 : 1 },
      1024: { slidesPerView: profesionales.length >= 3 ? 3 : profesionales.length },
    }}
    className="mySwiper"
  >
            {profesionales.map((prof) => (
              <SwiperSlide key={prof.id} style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <article className="doctor-card" onClick={() => onSelectProf(prof)}>
                  <div className="doctor-image-container">
                    {prof.imagenUrl ? (
                      <img src={prof.imagenUrl} alt={`${prof.nombre} ${prof.apellido}`} className="doctor-photo" loading="lazy" />
                    ) : (
                      <div className="doctor-photo-placeholder">
                        <span style={{ fontSize: "3rem", fontWeight: "800", opacity: 0.5 }}>{getIniciales(prof.nombre, prof.apellido)}</span>
                      </div>
                    )}
                    
                    {prof.matricula && (
                      <div className="license-pill">
                        <span className="license-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <span>{prof.matricula}</span>
                      </div>
                    )}
                  </div>

                  <div className="doctor-info-content">
                    <h2 className="doctor-name">{prof.nombre} {prof.apellido}</h2>
                    <p className="doctor-role">{prof.cargo || "Profesional de Planta"}</p>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>


        <button
          type="button"
          className="carousel-nav-btn next-btn"
          onClick={() => swiperRef.current?.slideNext()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ProfesionalesPage = () => {
  const [profesionalesDb, setProfesionalesDb] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("Todos los Servicios");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Especialidades (Todas)");
  const [selectedProf, setSelectedProf] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProfesionales = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/cms/profesionales");
        if (response.ok) {
          const data = await response.json();
          setProfesionalesDb(data.filter(p => p.publicado));
        }
      } catch (error) {
        console.error("Error al cargar los profesionales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfesionales();
  }, []);

  const serviciosList = ["Todos los Servicios", ...new Set(profesionalesDb.filter(p => p.esServicioClave).map(p => p.especialidadNombre))].sort();
  const especialidadesList = ["Especialidades (Todas)", ...new Set(profesionalesDb.filter(p => !p.esServicioClave).map(p => p.especialidadNombre))].sort();

  const handleReset = () => {
    setSearchQuery("");
    setSelectedService("Todos los Servicios");
    setSelectedSpecialty("Especialidades (Todas)");
    searchInputRef.current?.focus();
  };

  const scrollToSearch = () => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchInputRef.current?.focus();
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    if (e.target.value !== "Todos los Servicios") setSelectedSpecialty("Especialidades (Todas)");
  };
  const handleSpecialtyChange = (e) => {
    setSelectedSpecialty(e.target.value);
    if (e.target.value !== "Especialidades (Todas)") setSelectedService("Todos los Servicios");
  };

  const normalizedSearch = normalizeText(searchQuery);

  const groupedData = profesionalesDb.reduce((acc, prof) => {
    const key = prof.especialidadNombre;
    if (!acc[key]) acc[key] = { especialidad: key, isServicio: prof.esServicioClave, profesionales: [] };
    acc[key].profesionales.push(prof);
    return acc;
  }, {});

  const filteredData = Object.values(groupedData)
    .map((area) => {
      const filteredProfs = area.profesionales.filter((p) => {
        const full = normalizeText(`${p.nombre} ${p.apellido} ${p.matricula} ${p.cargo}`);
        return full.includes(normalizedSearch);
      });
      return { ...area, profesionales: filteredProfs };
    })
    .filter((area) => {
      let matchArea = true;
      if (selectedService !== "Todos los Servicios") matchArea = area.especialidad === selectedService;
      else if (selectedSpecialty !== "Especialidades (Todas)") matchArea = area.especialidad === selectedSpecialty;
      return matchArea && area.profesionales.length > 0;
    });

  const isDefaultView = !searchQuery && selectedService === "Todos los Servicios" && selectedSpecialty === "Especialidades (Todas)";
  const dataToRender = isDefaultView ? filteredData.slice(0, 4) : filteredData;

  return (
    <main className="profesionales-page medical-directory-container">

      <div className="prof-header-fluid" style={{ background: "linear-gradient(rgba(255, 255, 255, 0.85), #a4c2d6)" }}>
        <div className="prof-header-inner">
          <Breadcrumb currentPage="Profesionales" />
          <h1 className="prof-main-title">NUESTRO EQUIPO MÉDICO</h1>
          <p className="prof-subtitle">
            Conozca a los profesionales que forman parte de nuestra institución.
          </p>
        </div>
      </div>

      <AnimatedContent distance={30} direction="vertical" delay={0.1}>
        <section className="search-filter-section" aria-label="Búsqueda de profesionales y especialidades">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-field"
              placeholder="Buscar profesional por nombre, matrícula o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-dropdowns-row">
            <div className="custom-select-box">
              <select className="select-element" value={selectedService} onChange={handleServiceChange}>
                {serviciosList.map((srv, idx) => (
                  <option key={idx} value={srv}>{srv}</option>
                ))}
              </select>
              <svg className="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div className="custom-select-box">
              <select className="select-element" value={selectedSpecialty} onChange={handleSpecialtyChange}>
                {especialidadesList.map((esp, idx) => (
                  <option key={idx} value={esp}>{esp}</option>
                ))}
              </select>
              <svg className="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <button type="button" className="btn-reset-filters" onClick={handleReset}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <polyline points="3 3 3 8 8 8" />
              </svg>
              <span>Restablecer</span>
            </button>
          </div>
        </section>
      </AnimatedContent>

      <div style={{ width: "100%", maxWidth: "1200px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="cms-spinner" style={{ borderWidth: "4px", width: "40px", height: "40px", borderTopColor: "#0d223f", margin: "0 auto" }}></div>
            <p style={{ color: "#64748b", marginTop: "15px", fontWeight: "600" }}>Cargando directorio médico...</p>
          </div>
        ) : dataToRender.length > 0 ? (
          dataToRender.map((area, index) => (
            <AnimatedContent key={index} distance={40} direction="vertical" delay={index * 0.1}>
              <SpecialtyRow
                especialidad={area.especialidad}
                profesionales={area.profesionales}
                onSelectProf={setSelectedProf}
              />
            </AnimatedContent>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <svg width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: "15px", opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2>No se encontraron profesionales.</h2>
            <p>Intente ajustando los filtros o el texto de búsqueda.</p>
          </div>
        )}
      </div>

      {!loading && filteredData.length > 0 && (
        <div className="bottom-explore-action">
          <button type="button" className="btn-explore-specialties" onClick={scrollToSearch}>
            <svg className="explore-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Explorar más especialidades y servicios</span>
            <svg className="explore-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      )}

      {selectedProf && (
        <div className="prof-modal-overlay" onClick={() => setSelectedProf(null)}>
          <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="prof-modal-photo">
              {selectedProf.imagenUrl ? (
                <img src={selectedProf.imagenUrl} alt={selectedProf.nombre} />
              ) : (
                <span style={{ fontSize: "3rem", fontWeight: "800", color: "#ffffff" }}>
                  {`${selectedProf.nombre?.charAt(0) || ""}${selectedProf.apellido?.charAt(0) || ""}`.toUpperCase()}
                </span>
              )}
            </div>
            
            <h3 className="prof-modal-name">{selectedProf.nombre} {selectedProf.apellido}</h3>
            <h4 className="prof-modal-title">{selectedProf.cargo || "Profesional Médico"}</h4>
            
            {selectedProf.matricula && (
              <span className="prof-modal-matricula-text">Matrícula: {selectedProf.matricula}</span>
            )}
            
            <span className="prof-modal-specialty">{selectedProf.especialidadNombre}</span>
            
            {selectedProf.descripcion && (
              <p className="prof-modal-desc">{selectedProf.descripcion}</p>
            )}
            
            <button className="btn-cerrar-modal" onClick={() => setSelectedProf(null)}>
              Cerrar y volver
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfesionalesPage;