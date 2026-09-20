import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNoticias } from "../../api/noticias.api.js";
import Breadcrumb from "../../components/Breadcrumb";
import avatarHospital from "../../assets/logoHospitalEvita.png";
import fondoBannerNoticias from "../../assets/banner_noticias.png";
import "../../styles/pages/NoticiasPage.css";

const CATEGORY_MAP = {
  "cancer-mama": "Cáncer de Mama",
  "tu-corazon": "Tu Corazón",
  "donacion": "Donación",
  "dengue": "Dengue"
};

const cleanHtmlText = (html) => {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

const NoticiasCategoriaPage = () => {
  const { categoria } = useParams();
  const navigate = useNavigate();
  
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], index: 0 });

  const dbCategoryName = CATEGORY_MAP[categoria];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!dbCategoryName) {
      navigate("/noticias");
      return;
    }

    // --- NUEVO: GUARDAMOS LA HORA EXACTA DE LA VISITA EN LA MEMORIA DEL NAVEGADOR ---
    localStorage.setItem(`visited_${categoria}`, Date.now().toString());

    const fetchNoticiasCategoria = async () => {
      setLoading(true);
      try {
        const data = await getNoticias(false);
        const targetCategory = (dbCategoryName || "").trim().toLowerCase();

        const noticiasFiltradas = data
          .filter(n => {
            const currentCategory = (n.category || "").trim().toLowerCase();
            return currentCategory === targetCategory;
          })
          .map(noticia => ({
            id: noticia.id,
            title: noticia.title || noticia.titulo,
            body: noticia.body || [noticia.contenido],
            date: noticia.date || "Hoy",
            category: noticia.category,
            images: noticia.images || []
          }))
          .sort((a, b) => b.id - a.id);

        setNoticias(noticiasFiltradas);
      } catch (error) {
        console.error("Error al cargar noticias de la categoría:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticiasCategoria();
  }, [categoria, dbCategoryName, navigate]);

  const openLightbox = (images, index) => setLightbox({ isOpen: true, images, index });
  const closeLightbox = () => setLightbox({ isOpen: false, images: [], index: 0 });

  return (
    <main className="noticias-page">
      <div
        className="news-header-fluid"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 111, 196, 0.85), rgba(233, 235, 238, 0.85)), url(${fondoBannerNoticias})`,
        }}
      >
        <div className="news-header-inner">
          <Breadcrumb 
            parentLabel="NOTICIAS" 
            parentPath="/noticias" 
            currentPage={dbCategoryName?.toUpperCase()} 
          />
          <h1 className="news-main-title">NOTICIAS: {dbCategoryName?.toUpperCase()}</h1>
          <div className="news-info-wrapper">
            <div className="news-info-text">
              <p>Artículos médicos, novedades y campañas de concientización sobre {dbCategoryName}.</p>
              
              <button 
                onClick={() => navigate('/noticias')}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginTop: '20px', 
                  padding: '10px 20px', 
                  backgroundColor: '#006eb3', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 110, 179, 0.2)'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.backgroundColor = '#004d80'; 
                  e.currentTarget.style.transform = 'translateY(-2px)'; 
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.backgroundColor = '#006eb3'; 
                  e.currentTarget.style.transform = 'translateY(0)'; 
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Volver a Noticias Generales
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="noticias-page-container" style={{ padding: "60px 20px", margin: "0 auto" }}>
        
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="cms-spinner" style={{ borderColor: "#cbd5e1", borderTopColor: "#006eb3" }}></div>
            <p style={{ marginTop: "15px", color: "#64748b", fontWeight: "600" }}>Cargando artículos...</p>
          </div>
        ) : noticias.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {noticias.map((news) => {
              const plainText = cleanHtmlText(news.body[0]);
              return (
                 <article key={news.id} className="full-news-card" style={{ height: "100%", width: "350px", flex: "0 0 auto" }}>
                  <div className="full-news-header">
                    <div className="hospital-avatar">
                      <img src={avatarHospital} alt="Avatar Hospital" />
                    </div>
                    <div className="post-meta">
                      <h3>Hospital Interdistrital Evita Formosa</h3>
                      <span>{news.date}</span>
                    </div>
                  </div>
                  <div className="full-news-body">
                    <h4 className="full-news-title">{news.title}</h4>
                    <p className="clamped-text">{plainText}</p>
                    <button className="read-more-btn" onClick={() => setSelectedNews(news)}>
                      Ver más
                    </button>
                  </div>
                  <div className="full-news-images">
                    {news.images && news.images.length > 0 && (
                      <img src={news.images[0]} alt={news.title} className="clickable-img" onClick={() => openLightbox(news.images, 0)} />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b", width: "100%" }}>
            Aún no hay publicaciones en la categoría {dbCategoryName}.
          </div>
        )}

      </div>

      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content-esp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>ARTÍCULO MÉDICO</h2>
              <button className="btn-close-modal" onClick={() => setSelectedNews(null)} title="Cerrar ventana">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="modal-body-esp">
              <div className="modal-left-content">
                <div className="modal-author-row">
                  <div className="hospital-avatar"><img src={avatarHospital} alt="Avatar Hospital" /></div>
                  <div className="author-meta">
                    <h3>Hospital Interdistrital Evita Formosa</h3>
                    <span>{selectedNews.date}</span>
                  </div>
                </div>
                <h3 className="news-modal-title">{selectedNews.title}</h3>
                <div className="news-modal-body-text">
                  {selectedNews.body.map((paragraph, idx) => (
                    <div key={idx} className="info-text" dangerouslySetInnerHTML={{ __html: paragraph }} />
                  ))}
                </div>
              </div>
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className={`mosaic-gallery layout-${selectedNews.images.length >= 4 ? 4 : selectedNews.images.length}`}>
                  {selectedNews.images.slice(0, 4).map((img, index) => {
                    const isLastAndHidden = index === 3 && selectedNews.images.length > 4;
                    const fotosRestantes = selectedNews.images.length - 4;
                    return (
                      <div key={index} className="mosaic-item" onClick={() => openLightbox(selectedNews.images, index)}>
                        <img src={img} alt={`Foto noticia ${index + 1}`} />
                        {isLastAndHidden && (
                          <div className="mosaic-overlay"><span>+{fotosRestantes}</span></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightbox.isOpen && (
        <div className="lightbox-overlay" style={{ zIndex: 999999 }} onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {lightbox.images.length > 1 && (
              <button className="lightbox-arrow lb-left" onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length })); }}>&#10094;</button>
            )}
            <img src={lightbox.images[lightbox.index]} alt="Ampliada" className="lightbox-img" />
            {lightbox.images.length > 1 && (
              <button className="lightbox-arrow lb-right" onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length })); }}>&#10095;</button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default NoticiasCategoriaPage;