import React, { useState } from "react";
// Importamos los componentes de Swiper y sus módulos
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules"; 

// Importamos los estilos necesarios de Swiper
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation"; 
import "../styles/pages/ProfesionalesPage.css";

import docEjemplo1 from "../assets/foto-doctor-ejemplo.jpg";
import docEjemplo2 from "../assets/foto-doctora-ejemplo.jpg";
import Breadcrumb from "../components/Breadcrumb";

// Base de datos con descripciones y M.P (Matrículas Profesionales) añadidas
const equipoMedicoData = [
  {
    especialidad: "CLÍNICA MÉDICA",
    profesionales: [
      { id: 1, nombre: "Dr. Silvio Acosta", titulo: "Médico Clínico", matricula: "MP 1284", foto: docEjemplo1, descripcion: "Especialista con más de 10 años de experiencia en medicina interna, abocado al diagnóstico y tratamiento integral del paciente adulto." },
      { id: 2, nombre: "Dra. Laura Gómez", titulo: "Médica Clínica", matricula: "MP 2309", foto: null, descripcion: "Dedicada a la medicina preventiva y control de enfermedades crónicas, acompañando al paciente en su bienestar diario." },
      { id: 3, nombre: "Dr. Carlos Ruiz", titulo: "Médico Clínico", matricula: "MP 1985", foto: null, descripcion: "Especializado en valoración clínica integral y seguimiento de patologías prevalentes en internación." },
      { id: 4, nombre: "Dra. Elena Torres", titulo: "Médica Clínica", matricula: "MP 4321", foto: null, descripcion: "Atención ambulatoria y resolución de cuadros clínicos complejos con un enfoque profundamente humano." },
      { id: 5, nombre: "Dr. Martín Silva", titulo: "Médico Clínico", matricula: "MP 3210", foto: null, descripcion: "Experiencia en guardia e internación, con sólida formación diagnóstica y terapéutica general." },
      { id: 6, nombre: "Dra. Valentina Rojas", titulo: "Médica Clínica", matricula: "MP 5092", foto: null, descripcion: "Fuerte perfil investigador y docente en el ámbito de la medicina interna y salud comunitaria." },
      { id: 7, nombre: "Dr. Javier Morales", titulo: "Médico Clínico", matricula: "MP 2011", foto: null, descripcion: "Destacado en el abordaje del paciente polimedicado y manejo de urgencias hospitalarias." },
    ],
  },
  {
    especialidad: "PEDIATRÍA",
    profesionales: [
      { id: 8, nombre: "Lic. Ana Ramirez", titulo: "Lic. en Pediatría", matricula: "MP 4123", foto: docEjemplo2, descripcion: "Acompañamiento especializado en el crecimiento y desarrollo infantil, desde el nacimiento hasta la adolescencia." },
      { id: 9, nombre: "Dr. Juan Medina", titulo: "Pediatra Especialista", matricula: "MP 3390", foto: null, descripcion: "Enfocado en infectología pediátrica y prevención de enfermedades de la infancia mediante planes de vacunación." },
      { id: 10, nombre: "Dra. Sofía Castro", titulo: "Pediatra Neonatóloga", matricula: "MP 1092", foto: null, descripcion: "Cuidado intensivo e intermedio del recién nacido prematuro y de término con patologías complejas." },
      { id: 11, nombre: "Dr. Luis Navarro", titulo: "Pediatra", matricula: "MP 5543", foto: null, descripcion: "Atención pediátrica general y asesoramiento continuo a familias sobre nutrición y crianza saludable." },
      { id: 12, nombre: "Dra. Martina Páez", titulo: "Pediatra Especialista", matricula: "MP 3201", foto: null, descripcion: "Seguimiento de patologías respiratorias infantiles estacionales y crónicas." },
      { id: 13, nombre: "Dra. Julia Rivas", titulo: "Pediatra Neonatóloga", matricula: "MP 2981", foto: null, descripcion: "Dedicada a la reanimación neonatal y seguimiento neurocognitivo del lactante de alto riesgo." },
      { id: 14, nombre: "Dr. Mario Luna", titulo: "Pediatra", matricula: "MP 4001", foto: null, descripcion: "Médico de planta orientado a la guardia pediátrica y resolución rápida de emergencias infantiles." },
    ],
  },
  {
    especialidad: "GINECOLOGÍA",
    profesionales: [
      { id: 15, nombre: "Dra. María Blanco", titulo: "Ginecóloga y Obstetra", matricula: "MP 1009", foto: null, descripcion: "Atención integral de la mujer en todas sus etapas, seguimiento de embarazo y prevención ginecológica." },
      { id: 16, nombre: "Dra. Patricia Luna", titulo: "Ginecóloga", matricula: "MP 2099", foto: null, descripcion: "Especialista en planificación familiar, endocrinología ginecológica y patología cervical." },
      { id: 17, nombre: "Dr. Roberto Paz", titulo: "Ginecólogo", matricula: "MP 3102", foto: null, descripcion: "Cirujano ginecológico abocado a patologías uterinas complejas y procedimientos mínimamente invasivos." },
      { id: 18, nombre: "Dra. Laura Blanco", titulo: "Ginecóloga y Obstetra", matricula: "MP 1199", foto: null, descripcion: "Alto nivel en manejo integral de la paciente embarazada y partos respetados humanizados." },
      { id: 19, nombre: "Dra. Carmen Lima", titulo: "Ginecóloga", matricula: "MP 2811", foto: null, descripcion: "Focalizada en prevención del cáncer de mama y chequeos anuales de salud reproductiva." },
      { id: 20, nombre: "Dr. Sergio Paz", titulo: "Ginecólogo", matricula: "MP 3502", foto: null, descripcion: "Dedicación a la atención ambulatoria, ecografías transvaginales y control de climaterio." },
    ],
  },
];

const SpecialtyRow = ({ especialidad, profesionales, onSelectProf }) => {
  return (
    <div className="specialty-block">
      <h2 className="specialty-title">{especialidad}</h2>

      <div className="carousel-wrapper">
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={40} 
          slidesPerView={3} /* Fijado estrictamente a 3 tarjetas visibles */
          centeredSlides={true}
          loop={true}
          navigation={true} 
          speed={600} /* Transición más ágil y suave */
          autoplay={{
            delay: 1500, /* Movimiento constante */
            disableOnInteraction: false, /* NUNCA se detiene aunque el usuario interactúe */
          }}
          breakpoints={{
            320: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 3, spaceBetween: 40 }, /* Fuerza a mantener 3 tarjetas en escritorio */
          }}
          className="mySwiper"
        >
          {profesionales.map((prof) => (
            <SwiperSlide key={prof.id} style={{ width: "280px" }}>
              <div 
                className="prof-card"
                onClick={() => onSelectProf({ ...prof, especialidad })}
              >
                <div className="prof-card-bg">
                  {prof.foto ? (
                    <img src={prof.foto} alt={prof.nombre} />
                  ) : (
                    <svg width="60" height="60" fill="#cbd5e1" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>

                <div className="prof-info">
                  <h4>{prof.nombre}</h4>
                  <span>{prof.titulo}</span>
                  <span className="prof-matricula">{prof.matricula}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const ProfesionalesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todas las áreas");
  
  const [selectedProf, setSelectedProf] = useState(null);

  const areasList = [
    "Todas las áreas",
    ...equipoMedicoData.map((d) => d.especialidad),
  ];

  const normalizedSearch = normalizeText(searchTerm);

  const filteredData = equipoMedicoData
    .map((area) => {
      const filteredProfs = area.profesionales.filter(
        (p) =>
          normalizeText(p.nombre).includes(normalizedSearch) ||
          normalizeText(p.titulo).includes(normalizedSearch) ||
          normalizeText(p.matricula).includes(normalizedSearch),
      );
      return { ...area, profesionales: filteredProfs };
    })
    .filter((area) => {
      const matchArea =
        selectedArea === "Todas las áreas" ||
        area.especialidad === selectedArea;
      return matchArea && area.profesionales.length > 0;
    });

  return (
    <main className="profesionales-page">
      <div
        className="prof-header-fluid"
        style={{
          background: "linear-gradient(rgba(255, 255, 255, 0.85), #a4c2d6)",
        }}
      >
        <div className="prof-header-inner">
          <Breadcrumb currentPage="Profesionales" />
          <h1 className="prof-main-title">NUESTRO EQUIPO MÉDICO</h1>
          <p className="prof-subtitle">
            Conozca a los profesionales que forman parte de nuestra institución.
          </p>
        </div>
      </div>

      <div className="prof-search-container">
        <div className="prof-search-bar">
          <svg
            className="search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="prof-filter-select"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            {areasList.map((area, index) => (
              <option key={index} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="prof-container">
        {filteredData.length > 0 ? (
          filteredData.map((area, index) => (
            <SpecialtyRow
              key={index}
              especialidad={area.especialidad}
              profesionales={area.profesionales}
              onSelectProf={setSelectedProf}
            />
          ))
        ) : (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>
            <h2>No se encontraron profesionales.</h2>
            <p>Intente con otro nombre u otra especialidad.</p>
          </div>
        )}
      </div>

      {/* MODAL FULL-SCREEN INDEPENDIENTE */}
      {selectedProf && (
        <div className="prof-modal-overlay" onClick={() => setSelectedProf(null)}>
          <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="prof-modal-photo">
              {selectedProf.foto ? (
                <img src={selectedProf.foto} alt={selectedProf.nombre} />
              ) : (
                <svg width="60" height="60" fill="#cbd5e1" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            
            <h3 className="prof-modal-name">{selectedProf.nombre}</h3>
            <h4 className="prof-modal-title">{selectedProf.titulo}</h4>
            <span className="prof-modal-matricula-text">Matrícula: {selectedProf.matricula}</span>
            <span className="prof-modal-specialty">{selectedProf.especialidad}</span>
            <p className="prof-modal-desc">{selectedProf.descripcion}</p>
            
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