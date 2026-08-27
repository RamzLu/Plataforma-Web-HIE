import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import "../../styles/components/cms/CmsBannersView.css";

import imagen1 from "../../assets/fondoHospitalCarrusel1.jpg";
import imagen2 from "../../assets/fondoHospitalCarrusel2.jpg";
import imagen3 from "../../assets/fondoHospitalCarrusel3.jpg";
import imagen4 from "../../assets/fondoHospitalCarrusel4.jpg";

const defaultInicioBanners = [
  { id: "def-1", page: "Inicio", section: "carrusel", imageUrl: imagen1, isActive: true, order: 1, title: "6 AÑOS DE VOCACIÓN Y COMPETENCIA PROFESIONAL", content: "CONOCENOS" },
  { id: "def-2", page: "Inicio", section: "carrusel", imageUrl: imagen2, isActive: true, order: 2, title: "", content: "" },
  { id: "def-3", page: "Inicio", section: "carrusel", imageUrl: imagen3, isActive: true, order: 3, title: "", content: "" },
  { id: "def-4", page: "Inicio", section: "carrusel", imageUrl: imagen4, isActive: true, order: 4, title: "", content: "" },
];

const CmsBannersView = () => {
  const [activeTab, setActiveTab] = useState("Inicio");
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  
  // Estados para el manejo de la imagen y el recorte obligatorios (1501x641)
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  // Referencias para el visor interactivo de recorte en Canvas
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 300, height: 128 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const tabs = ["Inicio", "Noticias", "Contacto", "Acerca de"];
  const maxBanners = 4;
  const itemsPerPage = 2;
  const ASPECT_RATIO = 1501 / 641; // Relación exacta requerida

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/cms/banners");
      if (response.ok) {
        const data = await response.json();
        setBanners(data.length > 0 ? data : defaultInicioBanners);
      } else {
        setBanners(defaultInicioBanners);
      }
    } catch (error) {
      console.error("Error al cargar banners:", error);
      setBanners(defaultInicioBanners);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  const filteredBanners = banners.filter((b) => b.page === activeTab);
  const visibleBanners = filteredBanners.slice(currentIndex, currentIndex + itemsPerPage);

  const handleNext = () => {
    if (currentIndex + 1 <= filteredBanners.length - itemsPerPage) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", content: "" });
    setRawImageSrc(null);
    setImagePreview("");
    setCroppedBlob(null);
    setShowModal(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({ 
      title: banner.titulo || banner.title || "", 
      content: banner.descripcion || banner.content || "" 
    });
    setRawImageSrc(null);
    setImagePreview(banner.imageUrl || "");
    setCroppedBlob(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este banner?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/cms/banners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar en el servidor");

      setBanners(banners.filter((b) => b.id !== id));
      toast.success("¡Banner eliminado con éxito!");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el banner.");
    }
  };

  // Al seleccionar archivo, cargamos la imagen para mostrar la herramienta de recorte
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageSrc(reader.result);
        setCroppedBlob(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Inicializar caja de recorte cuando la imagen carga en el modal
  const handleImageLoaded = (e) => {
    const img = e.target;
    imageRef.current = img;
    const initialWidth = img.clientWidth;
    const initialHeight = initialWidth / ASPECT_RATIO;
    
    setCropBox({
      x: 0,
      y: (img.clientHeight - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight
    });
    generateCroppedImage(img, { x: 0, y: (img.clientHeight - initialHeight) / 2, width: initialWidth, height: initialHeight });
  };

  // Generar el corte real a resolución 1501x641 mediante Canvas
  const generateCroppedImage = (img, currentCrop) => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1501;
    canvas.height = 641;
    const ctx = canvas.getContext("2d");

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    ctx.drawImage(
      img,
      currentCrop.x * scaleX,
      currentCrop.y * scaleY,
      currentCrop.width * scaleX,
      currentCrop.height * scaleY,
      0,
      0,
      1501,
      641
    );

    canvas.toBlob((blob) => {
      setCroppedBlob(blob);
      setImagePreview(URL.createObjectURL(blob));
    }, "image/jpeg", 0.95);
  };

  // Manejo del arrastre del cuadro de recorte
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropBox.x, y: e.clientY - cropBox.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;
    const img = imageRef.current;
    
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + cropBox.width > img.clientWidth) newX = img.clientWidth - cropBox.width;
    if (newY + cropBox.height > img.clientHeight) newY = img.clientHeight - cropBox.height;

    const updatedCrop = { ...cropBox, x: newX, y: newY };
    setCropBox(updatedCrop);
    generateCroppedImage(img, updatedCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!croppedBlob && !editingId) {
      toast.error("Debes cargar y ajustar el recorte de la imagen (1501x641).");
      return;
    }

    setSaving(true);
    try {
      const dataForm = new FormData();
      dataForm.append("titulo", formData.title);
      dataForm.append("descripcion", formData.content);
      dataForm.append("activo", "true");
      dataForm.append("page", activeTab);

      if (!editingId) {
        const maxOrden = filteredBanners.length > 0 
          ? Math.max(...filteredBanners.map(b => b.orden || 0)) 
          : 0;
        dataForm.append("orden", maxOrden + 1);
      }

      if (croppedBlob) {
        dataForm.append("imagen", croppedBlob, "banner_recortado.jpg");
      } else if (!editingId) {
        toast.error("Debe seleccionar una imagen obligatoriamente.");
        setSaving(false);
        return;
      }

      const url = editingId 
        ? `http://localhost:3000/api/cms/banners/${editingId}`
        : "http://localhost:3000/api/cms/banners";
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: dataForm,
      });

      if (!response.ok) throw new Error("Error al guardar en el servidor");

      await fetchBanners();

      toast.success(editingId ? "¡Banner actualizado con éxito!" : "¡Banner creado con éxito!");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-banners-container">
      <div className="cms-banners-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`cms-banner-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="cms-banners-section">
        <div className="cms-banners-section-header">
          <div>
            <h3>Carrusel Principal ({activeTab})</h3>
            <p>Tamaño obligatorio: <b>1501x641 px</b>. Arrastrá el recuadro para encuadrar la imagen.</p>
          </div>
          <div className="cms-banners-header-actions">
            <span className="cms-banners-counter">
              {filteredBanners.length} / {maxBanners} imágenes
            </span>
            <button className="cms-btn-add-banner" onClick={handleOpenCreate}>+ CARGAR BANNER</button>
          </div>
        </div>

        {filteredBanners.length > 0 ? (
          <div className="cms-banners-carousel-wrapper">
            <button className="cms-carousel-nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div className="cms-banners-grid">
              {visibleBanners.map((banner) => {
                const originalIndex = filteredBanners.findIndex(b => b.id === banner.id);
                return (
                  <div className="cms-banner-card" key={banner.id}>
                    <div className="cms-banner-image-container">
                      <div className="cms-banner-order-badge">{originalIndex + 1}</div>
                      <img src={banner.imageUrl} alt={`Banner ${originalIndex + 1}`} className="cms-banner-image" />
                    </div>

                    <div className="cms-banner-info-box" style={{ padding: "8px 4px", background: "#ffffff", borderRadius: "6px" }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#0c2340", fontWeight: "700" }}>
                        {banner.titulo || banner.title || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Sin título</span>}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                        {banner.descripcion || banner.content || <span style={{ fontStyle: "italic" }}>Sin texto de botón / subtítulo</span>}
                      </p>
                    </div>

                    <div className="cms-banner-card-actions">
                      <div className="cms-banner-arrows">
                        <button className="cms-arrow-btn" disabled={originalIndex === 0}>←</button>
                        <button className="cms-arrow-btn" disabled={originalIndex === filteredBanners.length - 1}>→</button>
                      </div>

                      {/* Botones de Editar y Eliminar funcionales */}
                      <div className="cms-banner-crud" style={{ display: "flex", gap: "8px" }}>
                        <button className="cms-btn-edit" onClick={() => handleOpenEdit(banner)}>
                          Editar
                        </button>
                        <button 
                          className="cms-btn-delete" 
                          onClick={() => handleDelete(banner.id)}
                          style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="cms-carousel-nav-btn" onClick={handleNext} disabled={currentIndex + itemsPerPage >= filteredBanners.length}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        ) : (
          <div className="cms-banners-empty">No hay banners registrados en esta sección.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Banner (1501x641)" : "Crear Banner (Recorte Obligatorio 1501x641)"}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body-esp">
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Título / Descripción de Accesibilidad <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 5px 0" }}>
                  Obligatorio para que los lectores de pantalla describan la imagen a personas no videntes.
                </p>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  placeholder="Ej: Vista frontal del edificio principal del hospital"
                  required 
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Texto del Botón / Subtítulo <span style={{ fontWeight: "normal", color: "#64748b" }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  placeholder="Ej: De que se trata.."
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Seleccionar Imagen (Proporción exacta 1501x641)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: "100%", marginBottom: "10px" }} />

                {rawImageSrc && (
                  <div style={{ margin: "10px 0", background: "#1e293b", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ color: "#fff", fontSize: "0.85rem", marginBottom: "8px" }}>Arrastrá el recuadro para encuadrar la zona exacta (1501x641):</p>
                    <div 
                      style={{ position: "relative", display: "inline-block", overflow: "hidden", maxWidth: "100%", cursor: "crosshair" }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img 
                        src={rawImageSrc} 
                        alt="A recortar" 
                        onLoad={handleImageLoaded}
                        style={{ display: "block", maxWidth: "100%", maxHeight: "350px", objectFit: "contain", userSelect: "none" }} 
                      />
                      {imageRef.current && (
                        <div
                          onMouseDown={handleMouseDown}
                          style={{
                            position: "absolute",
                            left: `${cropBox.x}px`,
                            top: `${cropBox.y}px`,
                            width: `${cropBox.width}px`,
                            height: `${cropBox.height}px`,
                            border: "2px dashed #38bdf8",
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                            cursor: "move",
                            boxSizing: "border-box"
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {imagePreview && !rawImageSrc && (
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>Imagen actual / Vista previa recortada (1501x641):</p>
                    <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", border: "1px solid #cbd5e1" }}>
                      <img src={imagePreview} alt="Preview Final" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer-esp" style={{ padding: 0, justifyContent: "flex-end" }}>
                <button type="button" className="btn-cancelar-gris" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-cerrar-rojo" disabled={saving} style={{ backgroundColor: "#0c2340" }}>
                  {saving ? "Procesando y Guardando..." : (editingId ? "Actualizar Banner" : "Guardar Banner")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsBannersView;