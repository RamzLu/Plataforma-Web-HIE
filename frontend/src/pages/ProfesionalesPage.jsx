import React, { useState, useRef } from "react";
// Importamos los componentes de Swiper y sus módulos
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";

// Importamos los estilos necesarios de Swiper
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/autoplay";
import "./ProfesionalesPage.css";

import fondoProfesionales from "../assets/fondo-pagina-profesional.jpg";
import docEjemplo1 from "../assets/foto-doctor-ejemplo.jpg";
import docEjemplo2 from "../assets/foto-doctora-ejemplo.jpg";

const equipoMedicoData = [
  {
    especialidad: "CLÍNICA MÉDICA",
    profesionales: [
      {
        id: 1,
        nombre: "Dr. Silvio Acosta",
        titulo: "Médico Clínico",
        foto: docEjemplo1,
      },
      {
        id: 2,
        nombre: "Dra. Laura Gómez",
        titulo: "Médica Clínica",
        foto: null,
      },
      {
        id: 3,
        nombre: "Dr. Carlos Ruiz",
        titulo: "Médico Clínico",
        foto: null,
      },
      {
        id: 4,
        nombre: "Dra. Elena Torres",
        titulo: "Médica Clínica",
        foto: null,
      },
      {
        id: 5,
        nombre: "Dr. Martín Silva",
        titulo: "Médico Clínico",
        foto: null,
      },
      {
        id: 6,
        nombre: "Dra. Valentina Rojas",
        titulo: "Médica Clínica",
        foto: null,
      },
      {
        id: 7,
        nombre: "Dr. Javier Morales",
        titulo: "Médico Clínico",
        foto: null,
      },
    ],
  },
  {
    especialidad: "PEDIATRÍA",
    profesionales: [
      {
        id: 8,
        nombre: "Lic. Ana Ramirez",
        titulo: "Lic. en Pediatría",
        foto: docEjemplo2,
      },
      {
        id: 9,
        nombre: "Dr. Juan Medina",
        titulo: "Pediatra Especialista",
        foto: null,
      },
      {
        id: 10,
        nombre: "Dra. Sofía Castro",
        titulo: "Pediatra Neonatóloga",
        foto: null,
      },
      { id: 11, nombre: "Dr. Luis Navarro", titulo: "Pediatra", foto: null },
      {
        id: 12,
        nombre: "Dr. Juan Medina",
        titulo: "Pediatra Especialista",
        foto: null,
      },
      {
        id: 13,
        nombre: "Dra. Sofía Castro",
        titulo: "Pediatra Neonatóloga",
        foto: null,
      },
      { id: 14, nombre: "Dr. Luis Navarro", titulo: "Pediatra", foto: null },
    ],
  },
  {
    especialidad: "GINECOLOGÍA",
    profesionales: [
      {
        id: 15,
        nombre: "Dra. María Blanco",
        titulo: "Ginecóloga y Obstetra",
        foto: null,
      },
      {
        id: 16,
        nombre: "Dra. Patricia Luna",
        titulo: "Ginecóloga",
        foto: null,
      },
      { id: 17, nombre: "Dr. Roberto Paz", titulo: "Ginecólogo", foto: null },
      {
        id: 18,
        nombre: "Dra. María Blanco",
        titulo: "Ginecóloga y Obstetra",
        foto: null,
      },
      {
        id: 19,
        nombre: "Dra. Patricia Luna",
        titulo: "Ginecóloga",
        foto: null,
      },
      { id: 20, nombre: "Dr. Roberto Paz", titulo: "Ginecólogo", foto: null },
    ],
  },
];

const SpecialtyRow = ({ especialidad, profesionales }) => {
  const swiperRef = useRef(null);

  // Al poner el mouse encima, arranca el movimiento automático
  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      const swiper = swiperRef.current.swiper;
      if (swiper.autoplay) {
        swiper.autoplay.start();
      }
    }
  };

  // Al sacar el mouse, se detiene el movimiento
  const handleMouseLeave = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      const swiper = swiperRef.current.swiper;
      if (swiper.autoplay) {
        swiper.autoplay.stop();
      }
    }
  };

  return (
    <div className="specialty-block">
      <h2 className="specialty-title">{especialidad}</h2>

      <div
        className="carousel-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Swiper
          ref={swiperRef}
          modules={[Autoplay, FreeMode]}
          spaceBetween={20}
          slidesPerView="auto"
          loop={true}
          freeMode={{
            enabled: true,
            sticky: false,
            momentumBounce: false,
          }}
          speed={4000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            // Arranca detenido por defecto hasta que el usuario pose el mouse
            stopOnLastSlide: false,
          }}
          // Inicializamos para que empiece detenido
          onInit={(swiper) => {
            if (swiper.autoplay) swiper.autoplay.stop();
          }}
          className="mySwiper"
        >
          {profesionales.map((prof) => (
            <SwiperSlide key={prof.id} style={{ width: "240px" }}>
              <div className="prof-card">
                <div className="prof-card-bg">
                  {prof.foto ? (
                    <img src={prof.foto} alt={prof.nombre} />
                  ) : (
                    <svg
                      width="60"
                      height="60"
                      fill="#cbd5e1"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>

                <div className="prof-info">
                  <h4>{prof.nombre}</h4>
                  <span>{prof.titulo}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

const ProfesionalesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todas las áreas");

  const areasList = [
    "Todas las áreas",
    ...equipoMedicoData.map((d) => d.especialidad),
  ];

  const filteredData = equipoMedicoData
    .map((area) => {
      const filteredProfs = area.profesionales.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <main
      className="profesionales-page"
      style={{
        backgroundImage: `linear-gradient(rgba(12, 35, 64, 0.65), rgba(12, 35, 64, 0.65)), url(${fondoProfesionales})`,
      }}
    >
      <div className="prof-header">
        <h1>NUESTRO EQUIPO MÉDICO</h1>
        <p>
          Conozca a los profesionales que forman parte de nuestra institución.
        </p>

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
            placeholder="Buscar por nombre o apellido..."
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
            />
          ))
        ) : (
          <div
            style={{ textAlign: "center", color: "white", marginTop: "40px" }}
          >
            <h2>No se encontraron profesionales.</h2>
            <p>Intente con otro nombre u otra especialidad.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfesionalesPage;
