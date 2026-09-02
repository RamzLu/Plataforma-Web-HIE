import React, { useState, useEffect, useRef } from "react";

import keycloak from "../config/keycloak";

import "../styles/components/cms/CmsLayout.css";
import "../styles/components/cms/CmsDashboard.css";
import "../styles/components/cms/CmsModals.css";

import CmsSidebar from "../components/cms/CmsSidebar";
import CmsHeader from "../components/cms/CmsHeader";
import CmsDashboardView from "./cms/CmsDashboardView";
import CmsNoticiasView from "./cms/CmsNoticiasView";
import CmsBannersView from "./cms/CmsBannersView";
import CmsDocsView from "./cms/CmsDocsView";
import CmsProfesionalesView from "./cms/CmsProfesionalesView"; 
import CmsInstitucionView from "./cms/CmsInstitucionView"; 
import CmsConfiguracionView from "./cms/CmsConfiguracionView"; // <-- IMPORTACIÓN

import { documentosData } from "../data/documentos";
import avatarHospital from "../assets/logoHospitalEvita.png";

const CmsPage = () => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isCms, setIsCms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Usuario CMS");

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("cms_active_tab") || "dashboard";
  });
  
  useEffect(() => {
    localStorage.setItem("cms_active_tab", activeTab);
  }, [activeTab]);
  
  const [selectedNews, setSelectedNews] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

  const [newsList, setNewsList] = useState([]);
  const [docsList, setDocsList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    contenidoPublicado: 0,
    borradores: 0,
    documentosActivos: 0,
    visitas: "0",
  });
  const [loading, setLoading] = useState(true);

  const isKeycloakInitialized = useRef(false);

const fetchNoticias = async () => {
    try {
      setLoading(true);
      // Se agrega el parámetro ?admin=true
      const response = await fetch("http://localhost:3000/api/cms/noticias?admin=true");
      if (!response.ok)
        throw new Error("Error al obtener noticias del servidor");
      const data = await response.json();

      if (data && data.length > 0) {
        const noticiasFormateadas = data.map((noticia) => ({
          id: noticia.id,
          title: noticia.titulo || noticia.title,
          body: [noticia.contenido || noticia.body],
          date: noticia.createdAt
            ? new Date(noticia.createdAt).toLocaleDateString("es-AR")
            : "Hoy",
          createdAt: noticia.createdAt,
          updatedAt: noticia.updatedAt,
          category: "Noticias",
          estado: noticia.estado || "PUBLICADO",
          isDraft: noticia.isDraft || false,
          images: noticia.images || [],
          editor: noticia.editor || "Editor CMS", 
          editedBy: noticia.editedBy || null
        }));
        
        setNewsList(noticiasFormateadas);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cms/documentacion");
      if (!response.ok) throw new Error("Error al obtener documentos");
      const data = await response.json();
      
      if (data && data.length > 0) {
        setDocsList(data);
        localStorage.setItem("portal_docs_data", JSON.stringify(data));
        updateStats(newsList, data);
      } else {
        const cachedDocs = JSON.parse(localStorage.getItem("portal_docs_data")) || [];
        setDocsList(cachedDocs);
        updateStats(newsList, cachedDocs);
      }
    } catch (error) {
      console.error("Error obteniendo documentos:", error);
      const cachedDocs = JSON.parse(localStorage.getItem("portal_docs_data")) || [];
      setDocsList(cachedDocs);
      updateStats(newsList, cachedDocs);
    }
  };

  const handleAddNewDoc = (nuevoDoc) => {
    const updatedList = [nuevoDoc, ...docsList];
    setDocsList(updatedList);
    updateStats(newsList, updatedList);
    localStorage.setItem("portal_docs_data", JSON.stringify(updatedList));
  };

  const handleUpdateDoc = (updatedDoc) => {
    const updatedList = docsList.map((item) =>
      item.id === updatedDoc.id ? updatedDoc : item,
    );
    setDocsList(updatedList);
    updateStats(newsList, updatedList);
    localStorage.setItem("portal_docs_data", JSON.stringify(updatedList));
  };

  const handleDeleteDoc = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este documento del repositorio?")) {
      try {
        const token = keycloak?.token;
        const response = await fetch(`http://localhost:3000/api/cms/documentacion/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("No se pudo eliminar en el servidor");

        const filtered = docsList.filter((d) => d.id !== id);
        setDocsList(filtered);
        updateStats(newsList, filtered);
        localStorage.setItem("portal_docs_data", JSON.stringify(filtered));

        alert("¡Documento eliminado correctamente!");
      } catch (error) {
        console.error("Error al eliminar documento:", error);
        alert("Ocurrió un error al intentar eliminar el documento.");
      }
    }
  };

  useEffect(() => {
    fetchNoticias();
    fetchDocs();
  }, []);

  useEffect(() => {
    if (isKeycloakInitialized.current || keycloak.authenticated) {
      if (keycloak.authenticated) {
        setInitialized(true);
        setAuthenticated(true);
        setIsCms(
          keycloak.hasRealmRole("cms") || keycloak.hasRealmRole("admin"),
        );
        setIsAdmin(keycloak.hasRealmRole("admin"));
        const name =
          keycloak.tokenParsed?.name ||
          keycloak.tokenParsed?.preferred_username ||
          "Editor CMS";
        setUserName(name);
        updateStats(newsList, docsList);
      }
      return;
    }

    isKeycloakInitialized.current = true;

    keycloak
      .init({ onLoad: "login-required", checkLoginIframe: false })
      .then((auth) => {
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

          updateStats(newsList, docsList);
        }
      })
      .catch((err) => {
        console.error("Error al inicializar Keycloak:", err);
      });
  }, [newsList]);

  const updateStats = (currentNews, currentDocs = docsList) => {
    const publicadas = currentNews.filter((news) => !news.isDraft).length;
    const borradoresPendientes = currentNews.filter(
      (news) => news.isDraft,
    ).length;
    const totalDocumentos = currentDocs ? currentDocs.length : 0; 

    setDashboardStats({
      contenidoPublicado: publicadas,
      borradores: borradoresPendientes,
      documentosActivos: totalDocumentos,
      visitas: "0",
    });
  };

  const handleAddNewNews = (nuevaNoticia) => {
    const updatedList = [nuevaNoticia, ...newsList];
    setNewsList(updatedList);
    updateStats(updatedList, docsList);
    localStorage.setItem("portal_news_data", JSON.stringify(updatedList));
  };

  const handleUpdateNews = (updatedNews) => {
    const updatedList = newsList.map((item) =>
      item.id === updatedNews.id ? updatedNews : item,
    );
    setNewsList(updatedList);
    updateStats(updatedList, docsList);
  };

  const handleDeleteNews = (id) => {
    const filtered = newsList.filter((n) => n.id !== id);
    setNewsList(filtered);
    updateStats(filtered, docsList);
    localStorage.setItem("portal_news_data", JSON.stringify(filtered));
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cms/noticias", {
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
        <button onClick={() => {
          if (keycloak && typeof keycloak.logout === 'function') {
            keycloak.logout();
          } else {
            localStorage.removeItem("cms_active_tab");
            window.location.href = "/";
          }
        }}>Cerrar Sesión</button>
      </div>
    );
  }

 const latestNews = newsList
    .filter((news) => news.estado?.toUpperCase() === "PUBLICADO" || (!news.isDraft && !news.estado))
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  return (
    <div className="cms-layout">
      <CmsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="cms-main-wrapper">
        <CmsHeader
          userName={userName}
          isAdmin={isAdmin}
          testBackendConnection={testBackendConnection}
          onLogoutClick={() => setShowLogoutModal(true)}
          activeTab={activeTab}
        />

        <main className="cms-content">
          <div className="cms-page-title">
            <span className="cms-overtitle">CONTENIDO INSTITUCIONAL</span>
            <h1>
              {activeTab === "noticias"
                ? "Gestión de Noticias"
                : activeTab === "documentacion"
                ? "Gestión de Documentación"
                : activeTab === "institucional"
                ? "Gestión de Institucional"
                : activeTab === "banners"
                ? "Gestión de Banners"
                : activeTab === "profesionales"
                ? "Directorio de Profesionales" 
                : activeTab === "configuracion"
                ? "Gestión de Configuración" // <-- TÍTULO DINÁMICO AGREGADO
                : "Panel de administración"}
            </h1>
            <p>
              Administre de forma segura la información pública del Portal Red
              Evita Formosa.
            </p>
          </div>

          {activeTab === "dashboard" && (
            <CmsDashboardView
              latestNews={latestNews}
              newsList={newsList}         
              docsList={docsList}         
              dashboardStats={dashboardStats}
              setSelectedNews={setSelectedNews}
              handleQuickAction={() => setActiveTab("noticias")}
              loading={loading}
            />
          )}

          {activeTab === "noticias" && (
            <CmsNoticiasView
              newsList={newsList}
              onAddNewNews={handleAddNewNews}
              onDeleteNews={handleDeleteNews}
              onUpdateNews={handleUpdateNews}
              onViewNews={setSelectedNews}
              loading={loading}
            />
          )}

          {activeTab === "banners" && (
            <CmsBannersView />
          )}

          {activeTab === "documentacion" && (
            <CmsDocsView
              docsList={docsList}
              onAddNewDoc={handleAddNewDoc}
              onDeleteDoc={handleDeleteDoc}
              onUpdateDoc={handleUpdateDoc}
              loading={loading}
            />
          )}

          {activeTab === "institucional" && (
            <CmsInstitucionView />
          )}

          {activeTab === "profesionales" && (
            <CmsProfesionalesView />
          )}

          {/* RENDERIZADO DEL NUEVO MÓDULO */}
          {activeTab === "configuracion" && (
            <CmsConfiguracionView />
          )}

          {/* ACTUALIZADO PARA QUE NO MUESTRE "PRÓXIMAMENTE" SI ESTÁ EN CONFIGURACIÓN NI PROFESIONALES */}
          {activeTab !== "dashboard" && 
           activeTab !== "noticias" && 
           activeTab !== "documentacion" && 
           activeTab !== "banners" && 
           activeTab !== "institucional" && 
           activeTab !== "profesionales" && 
           activeTab !== "configuracion" && (
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

      {/* MODALES DE LOGOUT Y NOTICIAS... (SIN CAMBIOS) */}
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
                onClick={() => {
                  if (keycloak && typeof keycloak.logout === 'function') {
                    keycloak.logout();
                  } else {
                    localStorage.removeItem("cms_active_tab");
                    window.location.href = "/";
                  }
                }}
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

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
              
              <div className="modal-left-content">
                <div className="modal-author-row">
                  <div className="hospital-avatar">
                    <img src={avatarHospital} alt="Hospital Interdistrital Evita" />
                  </div>
                  <div className="author-meta">
                    <h3>Hospital Interdistrital Evita Formosa</h3>
                    {/* Propiedad corregida: date */}
                    <span>{selectedNews.date}</span>
                  </div>
                </div>

                {/* Propiedad corregida: title */}
                <h3 className="news-modal-title">{selectedNews.title}</h3>
                
                {/* Propiedad corregida: body (tomamos el primer elemento si es un array) */}
                <div 
                  className="info-text" 
                  dangerouslySetInnerHTML={{ __html: Array.isArray(selectedNews.body) ? selectedNews.body[0] : selectedNews.body }} 
                />
              </div>

              {/* Propiedad corregida: images */}
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className={`mosaic-gallery layout-${selectedNews.images.length >= 4 ? 4 : selectedNews.images.length}`}>
                  
                  {selectedNews.images.slice(0, 4).map((img, index) => {
                    
                    const isLastAndHidden = index === 3 && selectedNews.images.length > 4;
                    const fotosRestantes = selectedNews.images.length - 4;

                    // Mapeamos las imágenes para pasárselas al visor correctamente
                    const imageUrls = selectedNews.images.map(i => i.url || i);

                    return (
                      <div 
                        key={index} 
                        className="mosaic-item"
                        // Función corregida: openLightbox requiere (imagenes, indice)
                        onClick={() => openLightbox(imageUrls, index)} 
                      >
                        <img src={img.url || img} alt={`Imagen ${index + 1}`} />
                        
                        {isLastAndHidden && (
                          <div className="mosaic-overlay">
                            <span>+{fotosRestantes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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