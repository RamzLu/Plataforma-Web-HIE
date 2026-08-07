import React, { useState } from "react";
import "./DocumentacionPage.css";
import { documentosData } from "../data/documentos";

import Breadcrumb from "../components/Breadcrumb";

import fondoBanner from "../assets/banner_documentacion.png";

const DocumentacionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

  const categorias = [
    "TODOS",
    "GUÍAS Y ORIENTACIÓN",
    "INFORMACIÓN INSTITUCIONAL",
    "PREVENCIÓN Y SALUD",
  ];

  const filteredDocs = documentosData.filter((doc) => {
    const matchesSearch = doc.titulo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "TODOS" ||
      doc.categoria.toUpperCase() === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDownloadDirect = async (url, titulo) => {
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
          <h1 className="doc-title">REPOSITORIO DE DOCUMENTOS</h1>
          <div className="doc-info-wrapper">
            <div className="doc-info-labels">
              <span className="doc-label active">HOSPITAL</span>
              <span className="doc-label">EVITA</span>
            </div>
            <div className="doc-info-divider"></div>
            <div className="doc-info-text">
              <p>Acceda a manuales, guías e información oficial</p>
              <p>disponible para toda la comunidad.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR CENTRAL LIMITADO (Buscador, Tabla, etc.) */}
      <div className="documentacion-container">
        {/* Buscador */}
        <div className="doc-search-container">
          <svg
            className="doc-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          <input
            type="text"
            className="doc-search-input"
            placeholder="Buscar documento (Ej: Dengue, organigrama, visitas...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros por Categoría */}
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

        {/* Tabla de Documentos */}
        <div className="doc-table-container">
          <div className="doc-table-header">
            <div className="header-col">TÍTULO DEL DOCUMENTO</div>
            <div className="header-col">
              <svg className="header-icon" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
              CATEGORÍA
            </div>
            <div className="header-col">
              <svg className="header-icon" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              FECHA
            </div>
            <div className="header-col">
              <svg
                className="header-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.3 15.3l-7.6-7.6a2 2 0 0 0-2.8 0l-1.4 1.4a2 2 0 0 0 0 2.8l7.6 7.6a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 0 0-2.8z"></path>
                <path d="M14.5 9.5L12 12"></path>
                <path d="M10.5 13.5L8 16"></path>
                <path d="M6.5 17.5L4 20"></path>
              </svg>
              TAMAÑO
            </div>
            <div className="header-col">
              <svg className="header-icon" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              DESCARGAR
            </div>
          </div>

          <div className="doc-table-body">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div className="doc-row" key={doc.id}>
                  <div className="col-titulo">
                    <svg
                      className="doc-file-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      ></path>
                    </svg>
                    <p className="titulo-text">
                      {doc.titulo}{" "}
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="leer-mas-link"
                      >
                        Leer mas
                      </a>
                    </p>
                  </div>

                  <div className="col-data" data-label="Categoría">
                    {doc.categoria}
                  </div>
                  <div className="col-data" data-label="Fecha">
                    {doc.fecha}
                  </div>
                  <div className="col-data" data-label="Tamaño">
                    {doc.tamañoMB} MB
                  </div>

                  <div>
                    <button
                      className="btn-descargar"
                      onClick={() => handleDownloadDirect(doc.url, doc.titulo)}
                    >
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                      </svg>
                      Bajar PDF
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                No se encontraron documentos que coincidan con su búsqueda.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DocumentacionPage;
