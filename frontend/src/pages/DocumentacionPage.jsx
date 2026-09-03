import React, { useState, useEffect } from "react";
import "../styles/pages/DocumentacionPage.css";
import AnimatedContent from "../components/AnimatedContent";
import Breadcrumb from "../components/Breadcrumb";
import fondoBanner from "../assets/banner_documentacion.png";

const DocumentacionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");
  
  // ESTADOS MANTENIDOS ESTRICTAMENTE
  const [documentosData, setDocumentosData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS LOCALES DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const categorias = [
    "TODOS",
    "GUÍA Y ORIENTACIÓN",
    "INFORMACIÓN INSTITUCIONAL",
    "PREVENCIÓN Y SALUD",
  ];

  useEffect(() => {
    const fetchDocumentosPublicos = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/cms/documentacion");
        if (response.ok) {
          const data = await response.json();
          console.log("Documentos desde BD:", data);
          
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocs = filteredDocs.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 300, behavior: 'smooth' }); 
    }
  };

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

  const getCategoryColorClass = (categoria) => {
    if (!categoria) return "cat-default";
    const catLower = categoria.toLowerCase();
    if (catLower.includes("guía") || catLower.includes("guia")) return "cat-guia";
    if (catLower.includes("institucional")) return "cat-inst";
    if (catLower.includes("prevención") || catLower.includes("prevencion")) return "cat-prev";
    return "cat-default";
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
        
        {/* BUSCADOR ESTILO PROFESIONALES CON DIV SIMULADOR */}
        <div className="doc-search-wrapper">
          <div className="doc-search-bar">
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
            {/* ESTE DIV SIMULA EL TAMAÑO DEL FILTRO DE PROFESIONALES */}
            <div className="doc-search-spacer"></div>
          </div>
        </div>

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

        <div className="w-full-anim-wrapper">
          <AnimatedContent distance={40} direction="vertical" delay={0.1}>
            <div className="doc-table-container">
              
              <div className="doc-table-header">
                <div className="header-col">TÍTULO DEL DOCUMENTO</div>
                <div className="header-col" style={{ justifyContent: "center" }}>CATEGORÍA</div>
                <div className="header-col">FECHA</div>
                <div className="header-col">TAMAÑO</div>
                <div className="header-col" style={{ justifyContent: "center" }}>ACCIONES</div>
              </div>

              <div className="doc-table-body">
                {loading ? (
                  <div style={{ padding: "60px", textAlign: "center", width: "100%" }}>
                    <div className="cms-spinner" style={{ margin: "0 auto 15px auto" }}></div>
                    <span style={{ color: "#64748b", fontSize: "1rem", fontWeight: "600" }}>
                      Cargando documentos desde la base de datos...
                    </span>
                  </div>
                ) : currentDocs.length > 0 ? (
                  currentDocs.map((doc) => (
                    <div className="doc-row" key={doc.id}>
                      <div className="col-titulo">
                        <svg className="doc-file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        <div className="titulo-wrapper">
                          <span className="titulo-text">
                            {doc.title}
                            {doc.fileUrl && (
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="doc-preview-eye" 
                                title="Visualizar documento"
                                style={{ marginLeft: "8px", verticalAlign: "middle" }}
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="col-data col-categoria-data" data-label="Categoría">
                        {/* ESTE DIV ENVOLTORIO PROTEGE EL TEXTO Y EL TAMAÑO */}
                        <div className="category-pill-wrapper" title={doc.category}>
                          <span className={`category-pill ${getCategoryColorClass(doc.category)}`}>
                            {doc.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-data date-text" data-label="Fecha">
                        {doc.updatedAt}
                      </div>
                      <div className="col-data" data-label="Tamaño">
                        {doc.fileSize || "—"}
                      </div>

                      <div className="col-acciones">
                        <button
                          className="btn-descargar-pill"
                          onClick={() => handleDownloadDirect(doc.fileUrl, doc.title)}
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                          </svg>
                          {doc.fileType || "PDF"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b", width: "100%" }}>
                    No hay documentos publicados en la categoría seleccionada.
                  </div>
                )}
              </div>

              {/* PAGINACIÓN */}
              <div className="doc-pagination-container">
                <button 
                  className="btn-paginacion-arrow" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1 || totalPages === 0}
                  title="Página Anterior"
                >
                  &lt;
                </button>
                
                <span className="pagination-info">
                  Página {totalPages === 0 ? 0 : currentPage} de {totalPages}
                </span>

                <button 
                  className="btn-paginacion-arrow" 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages || totalPages === 0}
                  title="Página Siguiente"
                >
                  &gt;
                </button>
              </div>
              
            </div>
          </AnimatedContent>
        </div>
      </div>
    </main>
  );
};

export default DocumentacionPage;