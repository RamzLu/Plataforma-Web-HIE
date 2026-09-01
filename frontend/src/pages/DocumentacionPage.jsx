import React, { useState, useEffect } from "react";
import "../styles/pages/DocumentacionPage.css";
import AnimatedContent from "../components/AnimatedContent";
import Breadcrumb from "../components/Breadcrumb";
import fondoBanner from "../assets/banner_documentacion.png";

const DocumentacionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");
  
  // Inicializamos el estado vacío para que se llene con la Base de Datos
  const [documentosData, setDocumentosData] = useState([]);
  const [loading, setLoading] = useState(true);

  const categorias = [
    "TODOS",
    "GUÍA Y ORIENTACIÓN",
    "INFORMACIÓN INSTITUCIONAL",
    "PREVENCIÓN Y SALUD",
  ];

  // Llamada al Backend real
  useEffect(() => {
    const fetchDocumentosPublicos = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/cms/documentacion");
        if (response.ok) {
          const data = await response.json();
          console.log("Documentos desde BD:", data); // Para verificar en consola F12
          
          // Filtramos solo los que están "publicados"
          const docsPublicados = data.filter(
            (doc) => (doc.status || "").toLowerCase() === "publicado"
          );
          setDocumentosData(docsPublicados);
        }
      } catch (error) {
        console.error("Error al cargar documentos públicos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentosPublicos();
  }, []);

  const filteredDocs = documentosData.filter((doc) => {
    const tituloDoc = doc.title || "";
    const categoriaDoc = doc.category || "";

    const matchesSearch = tituloDoc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "TODOS" ||
      categoriaDoc.toUpperCase() === activeCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const handleDownloadDirect = async (url, titulo) => {
    if (!url) {
      alert("El enlace del archivo no está disponible.");
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = `${titulo}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al descargar:", error);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <main className="documentacion-page">
      <div
        className="doc-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), #a4c2d6), url(${fondoBanner})`,
        }}
      >
        <div className="doc-header-inner">
          <Breadcrumb currentPage="documentación" />
          <h1 className="doc-title-page">REPOSITORIO DE DOCUMENTOS</h1>
          <div className="doc-info-wrapper">
            <div className="doc-info-text">
              <p>Acceda a manuales, guías e información oficial disponible para toda la comunidad.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="documentacion-container">
        {/* BUSCADOR COMPACTO ESTILO PROFESIONALES */}
        <div className="doc-search-container">
          <svg className="doc-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            className="doc-search-input"
            placeholder="Buscar documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTROS TIPO PÍLDORA SIN BORDES */}
        <div className="doc-filters">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              <div className="chip-radio"></div>
              {cat}
            </button>
          ))}
        </div>

        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          {/* LISTA DE TARJETAS / LIST-VIEW */}
          <div className="doc-table-container">
            {/* CABECERA REDISEÑADA Y SUTIL */}
            <div className="doc-table-header">
              <div className="header-col">TÍTULO DEL DOCUMENTO</div>
              <div className="header-col">CATEGORÍA</div>
              <div className="header-col">FECHA</div>
              <div className="header-col">TAMAÑO</div>
              <div className="header-col" style={{ justifyContent: "flex-end" }}>ACCIONES</div>
            </div>

            <div className="doc-table-body">
              {loading ? (
                <div style={{ padding: "60px", textAlign: "center", width: "100%" }}>
                  <div className="cms-spinner" style={{ margin: "0 auto 15px auto" }}></div>
                  <span style={{ color: "#64748b", fontSize: "1rem", fontWeight: "600" }}>
                    Cargando documentos desde la base de datos...
                  </span>
                </div>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <div className="doc-row" key={doc.id}>
                    <div className="col-titulo">
                      <svg className="doc-file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                      <div className="titulo-wrapper">
                        <p className="titulo-text">{doc.title}</p>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="leer-mas-link">
                            Ver documento en navegador
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="col-data" data-label="Categoría">
                      <span className="category-pill">{doc.category}</span>
                    </div>
                    <div className="col-data date-text" data-label="Fecha">
                      {doc.updatedAt}
                    </div>
                    <div className="col-data" data-label="Tamaño">
                      {doc.fileSize || "—"}
                    </div>

                    <div className="col-acciones">
                      {/* BOTÓN ESTILO PÍLDORA */}
                      <button
                        className="btn-descargar-pill"
                        onClick={() => handleDownloadDirect(doc.fileUrl, doc.title)}
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        Descargar {doc.fileType || "PDF"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  No hay documentos publicados en la base de datos.
                </div>
              )}
            </div>
          </div>
        </AnimatedContent>
      </div>
    </main>
  );
};

export default DocumentacionPage;