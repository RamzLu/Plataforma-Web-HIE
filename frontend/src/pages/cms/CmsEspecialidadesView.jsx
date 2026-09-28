import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import { getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad } from "../../api/especialidades.api.js";
import "../../styles/components/cms/CmsDashboard.css"; 
import "../../styles/pages/cms/CmsEspecialidadesView.css"; 

const CmsEspecialidadesView = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("PUBLICADOS");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "", descripcion: "", ubicacion: "", horarios: "", 
    requisitos: "", documentacionNecesaria: "", informacionDerivacion: "", 
    esServicio: false, estado: "PUBLICADO"
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getEspecialidades(true);
      setEspecialidades(data);
    } catch (error) { toast.error("Error al cargar los datos."); } 
    finally { setLoading(false); }
  };

  // --- CONTROLES DE MODAL DE CAMBIOS SIN GUARDAR ---
  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      setShowModal(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowModal(false);
    setHasUnsavedChanges(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setBannerFile(null); 
    setBannerPreview(null);
    setFormData({ 
      nombre: "", descripcion: "", ubicacion: "", horarios: "", 
      requisitos: "", documentacionNecesaria: "", informacionDerivacion: "", 
      esServicio: false, estado: "PUBLICADO" 
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleOpenEdit = (esp) => {
    setEditingId(esp.id);
    setBannerFile(null); 
    setBannerPreview(esp.imagenBanner || null); // Al ser Base64 o URL completa, se lee directo
    setFormData({
      nombre: esp.nombre || "", 
      descripcion: esp.descripcion || "",
      ubicacion: esp.ubicacion || "", 
      horarios: esp.horarios || "",
      requisitos: esp.requisitos ? esp.requisitos.join("\n") : "",
      documentacionNecesaria: esp.documentacionNecesaria || "",
      informacionDerivacion: esp.informacionDerivacion || "",
      esServicio: esp.esServicio, 
      estado: esp.estado || "PUBLICADO"
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio.");

    setIsSaving(true);
    try {
      const token = keycloak.token;
      
      const dataToSend = new FormData();
      dataToSend.append("nombre", formData.nombre);
      dataToSend.append("descripcion", formData.descripcion);
      dataToSend.append("ubicacion", formData.ubicacion);
      dataToSend.append("horarios", formData.horarios);
      dataToSend.append("documentacionNecesaria", formData.documentacionNecesaria);
      dataToSend.append("informacionDerivacion", formData.informacionDerivacion);
      dataToSend.append("esServicio", formData.esServicio);
      dataToSend.append("estado", formData.estado);
      
      const reqArray = formData.requisitos.split("\n").map(r => r.trim()).filter(r => r);
      dataToSend.append("requisitos", JSON.stringify(reqArray));

      if (bannerFile) dataToSend.append("banner", bannerFile);

      if (editingId) {
        await updateEspecialidad(editingId, dataToSend, token); 
        toast.success("Actualizado con éxito.");
      } else {
        await createEspecialidad(dataToSend, token);
        toast.success("Creado con éxito.");
      }
      setShowModal(false);
      setHasUnsavedChanges(false);
      cargarDatos();
    } catch (error) { toast.error("Error al guardar."); }
    finally { setIsSaving(false); }
  };

  const confirmDelete = (esp) => { setItemAEliminar(esp); setShowDeleteModal(true); };

  const executeDelete = async () => {
    setIsDeleting(true); 
    try {
      await deleteEspecialidad(itemAEliminar.id, keycloak.token, itemAEliminar.esServicio);
      toast.success("Eliminado con éxito.");
      setShowDeleteModal(false);
      cargarDatos();
    } catch (error) {
      const msg = error.response?.data?.error?.message || "Error al intentar eliminar.";
      toast.error(msg, { duration: 5000 });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false); 
    }
  };

  const datosFiltrados = especialidades.filter(esp => {
    if (activeTab === "PUBLICADOS") return esp.estado === "PUBLICADO";
    if (activeTab === "ARCHIVADOS") return esp.estado === "ARCHIVADO" || esp.estado === "BORRADOR";
    return true;
  });

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">Listado de Especialidades y Servicios</h3>
          <p className="news-view-subtitle">Administre los servicios médicos de la institución.</p>
        </div>
        <button type="button" className="btn-crear-noticia-header" onClick={handleOpenCreate}>+ NUEVO ELEMENTO</button>
      </div>

      <div className="esp-tabs-container">
        <button 
          className={`esp-tab-btn ${activeTab === "PUBLICADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("PUBLICADOS")}
        >
          Publicados
        </button>
        <button 
          className={`esp-tab-btn ${activeTab === "ARCHIVADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("ARCHIVADOS")}
        >
          Archivados
        </button>
      </div>

      <div className="cms-news-table-container" style={{ marginTop: "20px" }}>
        <div className="activity-table-head">
          <div style={{ flex: 1.5 }}>NOMBRE</div>
          <div style={{ width: "140px" }}>CLASIFICACIÓN</div>
          <div style={{ flex: 2 }}>CONTENIDO</div>
          <div style={{ width: "120px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? ( 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "15px", width: "100%" }}>
              <div className="cms-spinner" style={{ width: "40px", height: "40px", borderWidth: "4px", borderTopColor: "#0c2340", borderRightColor: "#e2e8f0", borderBottomColor: "#e2e8f0", borderLeftColor: "#e2e8f0" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: "500" }}>Cargando listado...</span>
            </div>
          ) : 
           datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay registros en esta sección.
            </div> 
          ) : (
            datosFiltrados.map((esp) => (
              <div className="activity-row" key={esp.id + (esp.esServicio ? 'srv' : 'esp')}>
                
                <div style={{ flex: 1.5 }}>
                  <div style={{ fontWeight: "700", color: "#0c2340", fontSize: "0.95rem" }}>{esp.nombre}</div>
                </div>

                <div style={{ width: "140px" }}>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: "700", 
                    color: esp.esServicio ? "#0284c7" : "#8b5cf6",
                    backgroundColor: esp.esServicio ? "#e0f2fe" : "#ede9fe",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}>
                    {esp.esServicio ? "SERVICIO CLAVE" : "ESPECIALIDAD"}
                  </span>
                </div>

                <div style={{ flex: 2, color: "#64748b", fontSize: "0.85rem" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#475569" }}>
                    {esp.ubicacion || "Sin ubicación asignada"}
                  </div>
                  {esp.descripcion && esp.descripcion.length > 50 
                    ? `${esp.descripcion.substring(0, 50)}...` 
                    : esp.descripcion}
                </div>

                <div style={{ width: "120px", textAlign: "center" }}>
                  <span className={`status-badge ${esp.estado === "PUBLICADO" ? "publicado" : "archivado"}`}>
                    {esp.estado}
                  </span>
                </div>

                <div style={{ width: "100px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button type="button" onClick={() => handleOpenEdit(esp)} className="news-action-btn-edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button type="button" onClick={() => confirmDelete(esp)} className="news-action-btn-delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div className="modal-content-esp esp-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Registro" : "Nuevo Registro"}</h2>
              <button type="button" className="btn-close-modal" onClick={handleCloseAttempt}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  
                  {/* 1. CAMPO TÍTULO / NOMBRE */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Nombre de la Especialidad/Servicio <span className="esp-asterisk">*</span></label>
                    <input 
                      type="text" 
                      value={formData.nombre} 
                      onChange={(e) => { setFormData({...formData, nombre: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="esp-form-input" 
                      placeholder="Ej: Cardiología..." 
                      required 
                    />
                  </div>

                  {/* 2. CAMPO IMAGEN DE BANNER */}
                  <div className="esp-full-width" style={{ border: "2px dashed #cbd5e1", padding: "15px", borderRadius: "8px", backgroundColor: "#f8fafc", marginBottom: "5px" }}>
                    <label className="esp-form-label" style={{ color: "#0f172a" }}>Imagen de Banner (Opcional)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setBannerFile(file);
                          setBannerPreview(URL.createObjectURL(file));
                          setHasUnsavedChanges(true);
                        }
                      }} 
                      className="esp-form-input" 
                      style={{ border: "none", padding: "0", marginTop: "8px" }}
                    />
                    {bannerPreview && (
                      <div style={{ marginTop: "15px", width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", position: "relative", border: "1px solid #e2e8f0" }}>
                        <img src={bannerPreview} alt="Preview Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button 
                          type="button" 
                          onClick={() => { setBannerFile(null); setBannerPreview(null); setHasUnsavedChanges(true); }}
                          style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(15, 23, 42, 0.75)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", transition: "background 0.2s" }}
                          title="Quitar imagen"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 3. SELECTORES DE CONFIGURACIÓN Y ESTADO */}
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label className="esp-form-label">Tipo de Elemento</label>
                      <label className={`esp-toggle-item ${editingId ? "disabled" : ""}`} style={{ marginTop: "12px" }}>
                        <div className="esp-switch">
                          <input type="checkbox" checked={formData.esServicio} disabled={!!editingId} onChange={(e) => { setFormData({...formData, esServicio: e.target.checked}); setHasUnsavedChanges(true); }} />
                          <span className="esp-slider"></span>
                        </div>
                        <span className="esp-toggle-label-text">Es Servicio Clave</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="esp-form-label">Estado de Publicación</label>
                    <select 
                      value={formData.estado} 
                      onChange={(e) => { setFormData({...formData, estado: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="esp-form-input"
                    >
                      <option value="PUBLICADO">Publicados</option>
                      <option value="ARCHIVADO">Archivados</option>
                    </select>
                  </div>

                  {/* 4. CAMPOS DE TEXTO RESTANTES */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Descripción general</label>
                    <textarea value={formData.descripcion} onChange={(e) => { setFormData({...formData, descripcion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="2" style={{ resize: "none" }} placeholder="Breve descripción del área..." />
                  </div>

                  <div>
                    <label className="esp-form-label">Ubicación física</label>
                    <input type="text" value={formData.ubicacion} onChange={(e) => { setFormData({...formData, ubicacion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" placeholder="Ej: Pasillo A, PB..." />
                  </div>

                  <div>
                    <label className="esp-form-label">Horarios</label>
                    <input type="text" value={formData.horarios} onChange={(e) => { setFormData({...formData, horarios: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" placeholder="Ej: Lun a Vie, 8 a 12hs" />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Documentación Necesaria</label>
                    <input type="text" value={formData.documentacionNecesaria} onChange={(e) => { setFormData({...formData, documentacionNecesaria: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" placeholder="Ej: DNI, Derivación, Carnet..." />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Información de Derivación</label>
                    <textarea value={formData.informacionDerivacion} onChange={(e) => { setFormData({...formData, informacionDerivacion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="2" placeholder="Información sobre cómo tramitar la derivación..." style={{ resize: "none" }} />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Requisitos <span style={{ textTransform: "none", color: "#94a3b8", fontWeight: "normal" }}>(Separa cada uno con la tecla Enter)</span></label>
                    <textarea value={formData.requisitos} onChange={(e) => { setFormData({...formData, requisitos: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="4" placeholder="Traer DNI original.&#10;Orden médica vigente..." style={{ resize: "none" }} />
                  </div>

                </div>
              </div>

              <div className="modal-footer-esp">
                <button type="button" className="btn-cancelar-gris" onClick={handleCloseAttempt} disabled={isSaving}>
                  CANCELAR
                </button>
                <button type="submit" className="btn-cerrar-rojo" style={{ backgroundColor: "#2b5b94" }} disabled={isSaving}>
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }}></div>
                      GUARDANDO...
                    </span>
                  ) : (
                    editingId ? "ACTUALIZAR" : "GUARDAR"
                  )}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="modal-overlay" style={{ zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 11, 32, 0.4)", backdropFilter: "blur(2px)" }}>
          <div style={{ width: "100%", maxWidth: "384px", margin: "16px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid rgba(196, 198, 206, 0.3)", boxShadow: "0px 10px 30px rgba(13,34,63,0.08)", fontFamily: "'Manrope', system-ui, -apple-system, sans-serif", position: "relative", zIndex: 999999, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 24px 16px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ margin: 0, color: "#000b20", fontSize: "20px", fontWeight: "600", lineHeight: "28px", fontFamily: "'Manrope', sans-serif" }}>Hay cambios sin guardar</h2>
              <p style={{ color: "#44474d", margin: 0, fontSize: "16px", fontWeight: "400", lineHeight: "24px", fontFamily: "'Manrope', sans-serif" }}>¿Qué deseas hacer con el registro actual?</p>
            </div>
            <div style={{ padding: "16px 24px 24px 24px", backgroundColor: "#f7f9fb", display: "flex", flexDirection: "column", gap: "16px" }}>
              <button 
                type="button" 
                onClick={(e) => {
                   setFormData(prev => ({...prev, estado: "ARCHIVADO"}));
                   setTimeout(() => handleSave(e), 50); 
                }} 
                style={{ width: "100%", padding: "16px 24px", backgroundColor: "#000b20", color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px", transition: "background-color 0.15s ease", fontFamily: "'Manrope', sans-serif" }}
              >
                Guardar y archivar (Oculto)
              </button>
              <button type="button" onClick={handleForceClose} style={{ width: "100%", padding: "16px 24px", backgroundColor: "#ba1a1a", color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px", transition: "background-color 0.15s ease", fontFamily: "'Manrope', sans-serif" }}>Descartar cambios</button>
              <button type="button" onClick={() => setShowUnsavedModal(false)} style={{ width: "100%", padding: "16px 24px", backgroundColor: "#d8e0ed", color: "#000b20", border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px", transition: "background-color 0.15s ease", fontFamily: "'Manrope', sans-serif" }}>Seguir editando</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="modal-content-esp delete-modal-global" onClick={(e) => e.stopPropagation()}>
            
            <button type="button" className="btn-close-floating" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="delete-modal-body">
              <div className="delete-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>

              <h2 className="delete-modal-title">Estás a punto de eliminar este elemento</h2>
              <div className="delete-modal-divider"></div>

              <p className="delete-modal-text">
                Esta acción es <strong>permanente</strong> y no se puede deshacer. Los datos se borrarán de inmediato.
              </p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                CANCELAR
              </button>
              <button 
                type="button"
                className="btn-cerrar-rojo" 
                onClick={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                    Eliminando...
                  </span>
                ) : (
                  "ELIMINAR"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CmsEspecialidadesView;