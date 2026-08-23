import React, { useState, useEffect } from "react";
import keycloak from "../config/keycloak";
import "../styles/pages/CmsPage.css";

// IMPORTAMOS LAS BASES DE DATOS REALES Y EL AVATAR
import { newsData } from "../data/newsData";
import { documentosData } from "../data/documentos";
import avatarHospital from "../assets/iconEVITAface.jpg";

const CmsPage = () => {
  // ==========================================
  // ESTADOS Y LÓGICA DE AUTENTICACIÓN
  // ==========================================
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isCms, setIsCms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Usuario CMS");

  // ==========================================
  // ESTADOS DE LA INTERFAZ
  // ==========================================
  const [selectedNews, setSelectedNews] = useState(null);
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

  // Estado dinámico inicializado en 0 (Nada hardcodeado)
  const [dashboardStats, setDashboardStats] = useState({
    contenidoPublicado: 0,
    borradores: 0,
    documentosActivos: 0,
    visitas: "0",
  });

  useEffect(() => {
    keycloak.init({ onLoad: "login-required" }).then((auth) => {
      setInitialized(true);
      setAuthenticated(auth);
      if (auth) {
        setIsCms(
          keycloak.hasRealmRole("cms") || keycloak.hasRealmRole("admin"),
        );
        setIsAdmin(keycloak.hasRealmRole("admin"));

        const name =
          keycloak.tokenParsed?.name ||
          keycloak.tokenParsed?.preferred_username ||
          "Editor CMS";
        setUserName(name);

        // ==========================================
        // CÁLCULO DE ESTADÍSTICAS REALES
        // ==========================================
        const publicadas = newsData.filter((news) => !news.isDraft).length;
        const borradoresPendientes = newsData.filter(
          (news) => news.isDraft,
        ).length;
        const totalDocumentos = documentosData ? documentosData.length : 0;

        setDashboardStats({
          contenidoPublicado: publicadas,
          borradores: borradoresPendientes,
          documentosActivos: totalDocumentos,
          visitas: "0", // Iniciado en 0 hasta tener Google Analytics o métricas del backend
        });
      }
    });
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cms", {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      const data = await response.json();
      console.log("Respuesta del Backend (Prueba de conexión):", data);
      alert("Conexión exitosa. Revisa la consola.");
    } catch (err) {
      console.error("Error conectando al backend", err);
      alert("Error al conectar con el backend.");
    }
  };

  // ==========================================
  // LÓGICA DEL LIGHTBOX
  // ==========================================
  const openLightbox = (images, index) =>
    setLightbox({ isOpen: true, images, index });
  const closeLightbox = () =>
    setLightbox({ isOpen: false, images: [], index: 0 });

  const nextLightboxImage = (e) => {
    e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
  };

  const prevLightboxImage = (e) => {
    e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  };

  // ==========================================
  // PROTECCIÓN DE RUTAS
  // ==========================================
  if (!initialized) {
    return <div className="cms-loading">Cargando plataforma...</div>;
  }

  if (!authenticated) {
    return <div className="cms-loading">No autenticado. Redirigiendo...</div>;
  }

  if (!isCms) {
    return (
      <div className="cms-unauthorized">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos de Redactor (CMS) para ver esta página.</p>
        <button onClick={() => keycloak.logout()}>Cerrar Sesión</button>
      </div>
    );
  }

  const latestNews = [...newsData].sort((a, b) => b.id - a.id).slice(0, 4);

  return (
    <div className="cms-layout">
      {/* --- BARRA LATERAL (SIDEBAR) --- */}
      <aside className="cms-sidebar">
        <div className="cms-logo-container">
          <div className="cms-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <div>
              <span className="logo-title">Red Evita</span>
              <span className="logo-subtitle">FORMOSA</span>
              <span className="logo-slogan">salud pública conectada</span>
            </div>
          </div>
        </div>

        <div className="cms-sidebar-menu-title">PANEL DE ADMINISTRACIÓN</div>

        <nav className="cms-nav">
          <ul>
            <li className="active">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Noticias
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
              Documentación
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Banners
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <path d="M9 22v-4h6v4"></path>
                <path d="M8 6h.01"></path>
                <path d="M16 6h.01"></path>
                <path d="M12 6h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 10h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M8 14h.01"></path>
              </svg>
              Institucional
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Profesionales
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              Cápsulas
            </li>
            <li>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Configuración
            </li>
          </ul>
        </nav>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="cms-main-wrapper">
        <header className="cms-header">
          <div className="cms-header-left">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Panel CMS/Dashboard</span>
          </div>

          <div className="cms-header-right">
            <button
              onClick={testBackendConnection}
              className="btn-test-backend"
              title="Test Backend"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </button>

            <button className="cms-notification-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            <div className="cms-user-profile">
              <div className="cms-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="cms-user-info">
                <span className="cms-user-name">{userName}</span>
                <span className="cms-user-role">
                  {isAdmin ? "Administrador" : "Editor CMS"}
                </span>
              </div>
              <button
                className="cms-dropdown-btn"
                onClick={() => keycloak.logout()}
                title="Cerrar Sesión"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="cms-content">
          <div className="cms-page-title">
            <span className="cms-overtitle">CONTENIDO INSTITUCIONAL</span>
            <h1>Panel de administración</h1>
            <p>
              Administre de forma segura la información pública del Portal Red
              Evita Formosa.
            </p>
          </div>

          {/* =========================================
              TARJETAS DE NOTICIAS (ARRIBA)
          ========================================= */}
          <div className="cms-dashboard-card" style={{ marginBottom: "30px" }}>
            <h3 className="cms-card-title">Últimas Noticias del Portal</h3>

            <div className="cms-news-grid">
              {latestNews.map((news) => (
                <div key={news.id} className="cms-news-item">
                  <div className="cms-news-img-placeholder">
                    {news.images && news.images.length > 0 ? (
                      <img
                        src={news.images[0]}
                        alt={news.title}
                        className="cms-real-news-img"
                      />
                    ) : (
                      <div className="cms-news-img-mock">
                        <span className="gold-text">HIE</span>
                        <span className="blue-sub">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="cms-news-content">
                    <h4 className="cms-real-news-title">{news.title}</h4>
                    <p>{news.body[0].substring(0, 80)}...</p>

                    <button
                      className="cms-btn-ver-mas"
                      onClick={() => setSelectedNews(news)}
                    >
                      VER MÁS
                    </button>
                    <span className="cms-news-time">{news.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================
              PANELES DE ESTADÍSTICAS (DEBAJO)
          ========================================= */}
          <div className="cms-stats-grid">
            <div className="cms-stat-card">
              <span className="cms-stat-title">Contenido publicado</span>
              <span className="cms-stat-value">
                {dashboardStats.contenidoPublicado}
              </span>
              <span className="cms-stat-subtitle">+0% este mes</span>
            </div>

            <div className="cms-stat-card">
              <span className="cms-stat-title">Borradores guardados</span>
              <span className="cms-stat-value">
                {String(dashboardStats.borradores).padStart(2, "0")}
              </span>
              <span className="cms-stat-subtitle">Edición en progreso</span>
            </div>

            <div className="cms-stat-card">
              <span className="cms-stat-title">Documentos activos</span>
              <span className="cms-stat-value">
                {dashboardStats.documentosActivos}
              </span>
              <span className="cms-stat-subtitle">+0 esta semana</span>
            </div>

            <div className="cms-stat-card">
              <span className="cms-stat-title">Visitas al portal</span>
              <span className="cms-stat-value">{dashboardStats.visitas}</span>
              <span className="cms-stat-subtitle">+0% este mes</span>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================
          POP-UP PARA NOTICIAS (ESTILO DEL PORTAL)
      ========================================= */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div
            className="modal-content-esp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>COMUNICADO INSTITUCIONAL</h2>
              <button
                className="btn-close-modal"
                onClick={() => setSelectedNews(null)}
                title="Cerrar ventana"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body-esp">
              <div className="modal-author-row">
                <div className="hospital-avatar">
                  <img src={avatarHospital} alt="Avatar Hospital" />
                </div>
                <div className="author-meta">
                  <h3>Hospital Interdistrital Evita Formosa</h3>
                  <span>{selectedNews.date} • 🌎</span>
                </div>
              </div>

              <div className="news-modal-headline">
                <h3 className="news-modal-title">{selectedNews.title}</h3>
              </div>

              <div className="news-modal-body-text">
                {selectedNews.body.map((paragraph, idx) => (
                  <p key={idx} className="info-text">
                    {paragraph}
                  </p>
                ))}
              </div>

              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className="news-modal-images-section">
                  <div className="news-modal-images-grid">
                    {selectedNews.images.map((img, idx) => (
                      <div
                        className="modal-news-img-box"
                        key={idx}
                        onClick={() => openLightbox(selectedNews.images, idx)}
                      >
                        <img src={img} alt={`Foto noticia ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-esp">
              <button
                className="btn-cerrar-rojo"
                onClick={() => setSelectedNews(null)}
              >
                Cerrar Noticia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          LIGHTBOX (VISOR DE IMÁGENES)
      ========================================= */}
      {lightbox.isOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            &times;
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-arrow lb-left"
                onClick={prevLightboxImage}
              >
                &#10094;
              </button>
            )}
            <img
              src={lightbox.images[lightbox.index]}
              alt="Ampliada"
              className="lightbox-img"
            />
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-arrow lb-right"
                onClick={nextLightboxImage}
              >
                &#10095;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsPage;
