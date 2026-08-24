import React, { useState, useEffect } from "react";
import keycloak from "../config/keycloak";

// Importación de los Estilos Modulares del CMS
import "../styles/components/cms/CmsLayout.css";
import "../styles/components/cms/CmsDashboard.css";
import "../styles/components/cms/CmsModals.css";

// Componentes modularizados
import CmsSidebar from "../components/cms/CmsSidebar";
import CmsHeader from "../components/cms/CmsHeader";

// Vistas modulares del CMS
import CmsDashboardView from "./cms/CmsDashboardView";

// Bases de datos y recursos
import { newsData } from "../data/newsData";
import { documentosData } from "../data/documentos";
import avatarHospital from "../assets/iconEVITAface.jpg";

const CmsPage = () => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isCms, setIsCms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Usuario CMS");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedNews, setSelectedNews] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

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

        const publicadas = newsData.filter((news) => !news.isDraft).length;
        const borradoresPendientes = newsData.filter(
          (news) => news.isDraft,
        ).length;
        const totalDocumentos = documentosData ? documentosData.length : 0;

        setDashboardStats({
          contenidoPublicado: publicadas,
          borradores: borradoresPendientes,
          documentosActivos: totalDocumentos,
          visitas: "0",
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
      console.log("Respuesta del Backend:", data);
      alert("Conexión exitosa. Revisa la consola.");
    } catch (err) {
      console.error("Error conectando al backend", err);
      alert("Error al conectar con el backend.");
    }
  };

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

  const handleQuickAction = (actionId) => {
    console.log(`Acción rápida seleccionada: ${actionId}`);
  };

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
      <CmsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="cms-main-wrapper">
        <CmsHeader
          userName={userName}
          isAdmin={isAdmin}
          testBackendConnection={testBackendConnection}
          onLogoutClick={() => setShowLogoutModal(true)}
        />

        <main className="cms-content">
          <div className="cms-page-title">
            <span className="cms-overtitle">CONTENIDO INSTITUCIONAL</span>
            <h1>Panel de administración</h1>
            <p>
              Administre de forma segura la información pública del Portal Red
              Evita Formosa.
            </p>
          </div>

          {/* Renderizado modular de vistas */}
          {activeTab === "dashboard" && (
            <CmsDashboardView
              latestNews={latestNews}
              dashboardStats={dashboardStats}
              setSelectedNews={setSelectedNews}
              handleQuickAction={handleQuickAction}
            />
          )}

          {activeTab !== "dashboard" && (
            <div className="cms-dashboard-card">
              <h3 className="cms-card-title">
                Módulo de {activeTab.toUpperCase()}
              </h3>
              <p>
                Próximamente interfaz de gestión operativa para {activeTab}.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE LOGOUT */}
      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="modal-content-esp logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>CERRAR SESIÓN</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowLogoutModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="modal-body-esp text-center">
              <p className="info-text">
                ¿Estás seguro de que deseas cerrar tu sesión en el panel de
                administración?
              </p>
            </div>
            <div className="modal-footer-esp logout-footer">
              <button
                className="btn-cancelar-gris"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-cerrar-rojo"
                onClick={() => keycloak.logout()}
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTICIAS */}
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

      {/* LIGHTBOX */}
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
