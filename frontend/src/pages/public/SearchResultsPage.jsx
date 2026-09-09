import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../../styles/pages/SearchResults.css";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  // Base de contenidos y secciones del sitio con rutas ajustadas
  const allSiteContent = [
    { 
      title: "SEDE CENTRAL Y EDIFICIO", 
      description: "La Sede Central del Hospital Interdistrital Evita cuenta con instalaciones modernas, tecnología de punta y distribución estratégica para la atención integral.", 
      path: "/acerca-de", // Redirige correctamente a la info institucional / sede
      category: "NUESTRO HOSPITAL" 
    },
    { 
      title: "CONTACTO Y LÍNEAS DE ATENCIÓN", 
      description: "Teléfonos de utilidad, vías de comunicación, consultorios externos y ubicación de los servicios de urgencia.", 
      path: "/contacto", 
      category: "CONTACTO" 
    },
    { 
      title: "ESPECIALIDADES MÉDICAS", 
      description: "Conoce todas las áreas médicas, servicios de diagnóstico, consultorios y tecnología disponible.", 
      path: "/especialidades", 
      category: "SERVICIOS" 
    },
    { 
      title: "INSTITUTO DE ENFERMEDADES DIGESTIVAS", 
      description: "Ofrece un enfoque de vanguardia diseñado para abordar de manera integral todas las patologías complejas del sistema digestivo.", 
      path: "/especialidades", 
      category: "INSTITUTO" 
    },
    { 
      title: "HISTORIA DE LA INSTITUCIÓN", 
      description: "Conocé la historia de nuestro hospital, desde su fundación hasta convertirse en un centro de alta complejidad y referente regional.", 
      path: "/acerca-de", 
      category: "NUESTRO HOSPITAL" 
    },
    { 
      title: "DOCUMENTACIÓN Y TRÁMITES", 
      description: "Accede a formularios institucionales, normativas, guías de atención y documentación de interés público.", 
      path: "/documentacion", 
      category: "ADMINISTRACIÓN" 
    },
    { 
      title: "PLANTEL DE PROFESIONALES", 
      description: "Directorio de médicos, especialistas y personal de salud que conforman nuestro equipo médico de excelencia.", 
      path: "/profesionales", 
      category: "STAFF MÉDICO" 
    },
    { 
      title: "PROGRAMA DE RESIDENCIAS Y DOCENCIA", 
      description: "Residencias de Segundo Nivel o Post Básica con múltiples cargos de residencia por año orientadas a la formación continua.", 
      path: "/capacitacion", 
      category: "DOCENCIA" 
    }
  ];

  // Normalización para ignorar acentos y comparar de forma flexible
  const normalize = (str) => 
    (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(" ").filter(w => w.length > 1);

  // Filtrado inteligente
  const results = allSiteContent.filter(item => {
    const fullText = normalize(`${item.title} ${item.description} ${item.category}`);
    
    const matchesExact = fullText.includes(normalizedQuery);
    const matchesWords = queryWords.some(word => fullText.includes(word));

    return matchesExact || matchesWords;
  });

  return (
    <div className="search-results-container">
      <nav className="search-results-breadcrumb">
        <Link to="/">Inicio</Link> / Resultados de búsqueda para: <strong>{query}</strong>
      </nav>
      
      <h1 className="search-results-title">
        Resultados de búsqueda para: "{query}"
      </h1>

      {results.length > 0 ? (
        <div className="search-results-list">
          {results.map((item, index) => (
            <div key={index} className="search-result-card">
              <span className="search-result-category">{item.category}</span>
              <h3>
                <Link to={item.path}>{item.title}</Link>
              </h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="search-no-results">
          <p>No se encontraron resultados que coincidan con "<strong>{query}</strong>".</p>
          <Link to="/" className="search-back-btn">Volver al inicio</Link>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;