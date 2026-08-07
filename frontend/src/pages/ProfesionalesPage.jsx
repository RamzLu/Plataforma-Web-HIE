import React, { useState, useRef } from "react";
import "./ProfesionalesPage.css";

// 1. IMPORTA AQUÍ TU IMAGEN DE FONDO
import fondoProfesionales from "../assets/fondo-pagina-profesional.jpg"; // <-- CAMBIA ESTO POR TU FOTO

// Importa las fotos de tus doctores (puedes dejarlos en null si no tienes foto aún)
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
    ],
  },
  {
    especialidad: "PEDIATRÍA",
    profesionales: [
      {
        id: 6,
        nombre: "Lic. Ana Ramirez",
        titulo: "Lic. en Pediatría",
        foto: docEjemplo2,
      },
      {
        id: 7,
        nombre: "Dr. Juan Medina",
        titulo: "Pediatra Especialista",
        foto: null,
      },
      {
        id: 8,
        nombre: "Dra. Sofía Castro",
        titulo: "Pediatra Neonatóloga",
        foto: null,
      },
      { id: 9, nombre: "Dr. Luis Navarro", titulo: "Pediatra", foto: null },
    ],
  },
  {
    especialidad: "GINECOLOGÍA",
    profesionales: [
      {
        id: 10,
        nombre: "Dra. María Blanco",
        titulo: "Ginecóloga y Obstetra",
        foto: null,
      },
      {
        id: 11,
        nombre: "Dra. Patricia Luna",
        titulo: "Ginecóloga",
        foto: null,
      },
      { id: 12, nombre: "Dr. Roberto Paz", titulo: "Ginecólogo", foto: null },
    ],
  },
];

// =========================================
// SUB-COMPONENTE: CARRUSEL POR ESPECIALIDAD
// =========================================
const SpecialtyRow = ({ especialidad, profesionales }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 240; // Ancho de la tarjeta + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="specialty-block">
      <h2 className="specialty-title">{especialidad}</h2>

      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={() => scroll("left")}>
          &#10094;
        </button>

        <div className="carousel-track" ref={scrollRef}>
          {profesionales.map((prof) => (
            <div className="prof-card" key={prof.id}>
              <div className="prof-card-bg">
                {prof.foto ? (
                  <img src={prof.foto} alt={prof.nombre} />
                ) : (
                  /* Si no hay foto, mostramos un icono genérico sutil */
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
          ))}
        </div>

        <button
          className="carousel-arrow right"
          onClick={() => scroll("right")}
        >
          &#10095;
        </button>
      </div>
    </div>
  );
};

// =========================================
// COMPONENTE PRINCIPAL
// =========================================
const ProfesionalesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("Todas las áreas");

  // Obtener la lista única de áreas para el filtro (dropdown)
  const areasList = [
    "Todas las áreas",
    ...equipoMedicoData.map((d) => d.especialidad),
  ];

  // Lógica de Filtro y Búsqueda
  const filteredData = equipoMedicoData
    .map((area) => {
      // 1. Filtramos los profesionales dentro de cada área por el texto de búsqueda
      const filteredProfs = area.profesionales.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      return { ...area, profesionales: filteredProfs };
    })
    .filter((area) => {
      // 2. Filtramos el área seleccionada en el select
      const matchArea =
        selectedArea === "Todas las áreas" ||
        area.especialidad === selectedArea;
      // 3. Solo mostramos las áreas que tengan al menos 1 profesional que coincida con la búsqueda
      return matchArea && area.profesionales.length > 0;
    });

  return (
    <main
      className="profesionales-page"
      style={{
        backgroundImage: `linear-gradient(rgba(12, 35, 64, 0.4), rgba(12, 35, 64, 0.36)), url(${fondoProfesionales})`,
      }}
    >
      <div className="prof-overlay"></div>
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
            xmlns="http://www.w3.org/2000/svg"
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
