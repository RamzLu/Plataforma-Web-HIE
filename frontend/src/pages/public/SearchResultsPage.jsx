import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import FlexSearch from "flexsearch";
import { getDocumentos } from "../../api/documentos.api.js";
import "../../styles/pages/SearchResults.css";

const DEFAULT_NEWS = [];

// Normaliza: minúsculas + sin tildes/diacríticos.
// Se usa tanto para el encoder del índice como para resaltar el snippet,
// así el criterio de comparación es siempre el mismo.
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const SearchResultsPage = ({ newsList = DEFAULT_NEWS }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);

  // Los documentos del repositorio (CMS) no llegan por prop desde ningún
  // padre: los traemos acá directamente, igual que hace DocumentacionPage,
  // y nos quedamos solo con los publicados (mismo criterio que esa página).
  const [documentsList, setDocumentsList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchDocumentosPublicos = async () => {
      try {
        const data = await getDocumentos();
        const publicados = data.filter(
          (doc) => (doc.status || "").toLowerCase() === "publicado"
        );
        if (!cancelled) setDocumentsList(publicados);
      } catch (error) {
        console.error("Error al cargar documentos para el buscador:", error);
      }
    };

    fetchDocumentosPublicos();
    return () => {
      cancelled = true;
    };
  }, []);

  const allSiteContent = useMemo(() => {
    const staticPages = [
      {
        id: "s1",
        title: "Sede Central y Ubicación",
        path: "/acerca-de",
        category: "NUESTRO HOSPITAL",
        content:
          "El Hospital Interdistrital Evita cuenta con una sede central ubicada estratégicamente en la provincia. Nuestro edificio dispone de instalaciones modernas, consultorios externos, área de internación y un servicio de urgencias operativo las 24 horas para todos los pacientes.",
      },
      {
        id: "s2",
        title: "Especialidades Médicas",
        path: "/especialidades",
        category: "SERVICIOS",
        content:
          "Ofrecemos una amplia variedad de especialidades médicas para garantizar una atención integral. Disponemos de cardiología, pediatría, neurología, y medicina general. Los doctores atienden en consultorios equipados con tecnología de vanguardia.",
      },
      {
        id: "s3",
        title: "Instituto de Enfermedades Digestivas",
        path: "/especialidades",
        category: "INSTITUTO",
        content:
          "El Instituto de Enfermedades Digestivas ofrece un enfoque integral para tratar patologías del estómago, intestinos y vías biliares. Contamos con quirófanos especializados y atención personalizada para cada paciente.",
      },
      {
        id: "s4",
        title: "Documentación y Trámites",
        path: "/documentacion",
        category: "ADMINISTRACIÓN",
        content:
          "Para ser atendido, el paciente debe presentar su DNI y carnet de obra social. En esta sección puede descargar los formularios, conocer los requisitos de ingreso y las normativas y guías del hospital.",
      },
      {
        id: "s5",
        title: "Contacto y Guardias",
        path: "/contacto",
        category: "CONTACTO",
        content:
          "Comuníquese con nosotros a través de nuestros teléfonos de atención al público. En caso de emergencia, diríjase directamente a la guardia. Puede llamar para solicitar turnos o consultar información sobre pacientes internados.",
      },
      {
        id: "s6",
        title: "Plantel de Profesionales",
        path: "/profesionales",
        category: "STAFF MÉDICO",
        content:
          "Nuestro plantel de profesionales está compuesto por médicos especialistas, enfermeros y personal de salud altamente capacitado. Conoce a nuestro staff médico comprometido con la excelencia.",
      },
      {
        id: "s7",
        title: "Capacitación y Docencia",
        path: "/capacitacion",
        category: "DOCENCIA",
        content:
          "El hospital es un centro de formación continua. Ofrecemos programas de residencias médicas, capacitación para profesionales de la salud, ateneos y cursos de actualización científica.",
      },
      {
        id: "s8",
        title: "Noticias y Comunicados",
        path: "/noticias",
        category: "NOTICIAS Y ARTÍCULOS",
        content:
          "Sección dedicada a las últimas noticias, comunicados oficiales, artículos de salud y novedades institucionales de nuestro hospital para mantener a la comunidad informada.",
      },
    ];

    const dynamicNews = newsList.map((news) => {
      const rawText = Array.isArray(news.body)
        ? news.body.join(" ").replace(/<[^>]*>?/gm, " ")
        : news.body
        ? String(news.body).replace(/<[^>]*>?/gm, " ")
        : "Comunicado oficial e institucional.";

      return {
        id: `n-${news.id}`,
        title: news.title,
        path: `/noticias`,
        category: "NOTICIAS Y ARTÍCULOS",
        content: rawText,
      };
    });

    // Shape real (cms.doc.service.js): { id, title, category, fileName,
    // fileType, fileUrl, updatedAt }. No hay texto libre tipo "content":
    // lo buscable es el título del documento, el nombre de archivo
    // original (por si el título es genérico pero el PDF se llama
    // distinto) y la categoría.
    const dynamicDocuments = documentsList.map((doc) => ({
      id: `d-${doc.id}`,
      title: doc.title,
      path: "/documentacion",
      category: doc.category || "DOCUMENTACIÓN",
      // Lo que se INDEXA (searchableContent) incluye el nombre de archivo
      // original, por si el PDF se llama distinto al título ingresado en
      // el CMS. Lo que se MUESTRA (content) es un texto prolijo, no el
      // nombre de archivo pegoteado.
      searchableContent: [doc.title, doc.fileName, doc.category].filter(Boolean).join(" "),
      content: `Documento disponible en el Repositorio de Documentos${
        doc.category ? ` · ${doc.category}` : ""
      }.`,
    }));

    return [...staticPages, ...dynamicNews, ...dynamicDocuments];
  }, [newsList, documentsList]);

  // El índice se construye UNA sola vez por cada versión de allSiteContent,
  // no en cada búsqueda (antes se recreaba dentro del useEffect de "query").
  const searchIndex = useMemo(() => {
    const index = new FlexSearch.Document({
      document: {
        id: "id",
        index: [
          { field: "title", tokenize: "forward" },
          { field: "content", tokenize: "forward" },
          { field: "category", tokenize: "forward" },
          { field: "searchableContent", tokenize: "forward" },
        ],
        store: ["title", "path", "category", "content"],
      },
      // IMPORTANTE: el encode devuelve un ARRAY de palabras ya
      // normalizadas (minúsculas, sin tildes, sin puntuación), en vez de
      // un string completo. Si le devolvemos un string "aplastado",
      // quedamos a merced de cómo FlexSearch decida separarlo
      // internamente antes de aplicar el tokenizador — y eso es lo que
      // seguía generando falsos positivos. Separando nosotros mismos por
      // palabra, "forward" se aplica letra por letra SOLO dentro de cada
      // palabra (p.ej. "vacunas" -> v, va, vac, vacu, vacun, vacuna,
      // vacunas), nunca cruzando a la palabra siguiente.
      encode: (str) =>
        normalize(str)
          .replace(/[^a-z0-9\s]/gi, " ")
          .split(/\s+/)
          .filter(Boolean),
    });

    allSiteContent.forEach((item) => index.add(item));
    return index;
  }, [allSiteContent]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults = searchIndex.search(query, {
      enrich: true,
      limit: 50,
      // CLAVE: suggest en false. "suggest: true" hacía que FlexSearch
      // devolviera documentos "parecidos" aunque el término buscado no
      // estuviera realmente contenido en ellos (fuzzy fallback). Con
      // "forward" ya tenemos coincidencia parcial real (prefijos), así
      // que no necesitamos ese fallback para tener cero falsos positivos.
      suggest: false,
    });

    const uniqueResults = new Map();
    searchResults.forEach((fieldResult) => {
      fieldResult.result.forEach((doc) => {
        if (!uniqueResults.has(doc.id)) {
          uniqueResults.set(doc.id, doc.doc);
        }
      });
    });

    setResults(Array.from(uniqueResults.values()));
  }, [query, searchIndex]);

  // Devuelve un array de nodos: texto normal + <mark> en la coincidencia.
  // La búsqueda del índice de coincidencia se hace sobre texto normalizado
  // (sin tildes/mayúsculas), pero el recorte y el resaltado se aplican
  // sobre el texto ORIGINAL para no perder tildes ni mayúsculas al usuario.
  const getHighlightSnippet = (text, searchTerm) => {
    if (!text) return null;

    const normText = normalize(text);
    const normTerm = normalize(searchTerm);
    const matchIndex = normText.indexOf(normTerm);

    if (matchIndex === -1) {
      const short = text.length > 140 ? text.substring(0, 140) + "..." : text;
      return <>{short}</>;
    }

    const CONTEXT = 50;
    const start = Math.max(0, matchIndex - CONTEXT);
    const end = Math.min(text.length, matchIndex + searchTerm.length + CONTEXT);

    const before = (start > 0 ? "..." : "") + text.substring(start, matchIndex);
    const match = text.substring(matchIndex, matchIndex + searchTerm.length);
    const after =
      text.substring(matchIndex + searchTerm.length, end) +
      (end < text.length ? "..." : "");

    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  };

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
          {results.map((item) => (
            <div key={item.id} className="search-result-card">
              <span className="search-result-category">{item.category}</span>
              <h3>
                <Link to={item.path}>{item.title}</Link>
              </h3>
              <p>{getHighlightSnippet(item.content, query)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="search-no-results">
          <p>
            No se encontraron resultados que coincidan con "<strong>{query}</strong>".
          </p>
          <Link to="/" className="search-back-btn">
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;