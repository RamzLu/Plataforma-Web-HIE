import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import { getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad } from "../../api/especialidades.api.js";
import "../../styles/components/cms/CmsDashboard.css"; 
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsEspecialidadesView.css"; 
import "../../styles/pages/cms/CmsResidenciasView.css";
import {
  CmsDeleteModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";

const CmsEspecialidadesView = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("PUBLICADOS");  
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "", descripcion: "", ubicacion: "", horarios: "", 
    requisitos: "", informacionDerivacion: "", 
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
    setFormData({ 
      nombre: "", descripcion: "", ubicacion: "", horarios: "", 
      requisitos: "", informacionDerivacion: "", 
      esServicio: false, estado: "PUBLICADO" 
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleOpenEdit = (esp) => {
    setEditingId(esp.id);
    setFormData({
      nombre: esp.nombre || "", 
      descripcion: esp.descripcion || "",
      ubicacion: esp.ubicacion || "", 
      horarios: esp.horarios || "",
      requisitos: esp.requisitos ? esp.requisitos.join("\n") : "",
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

    const payload = {
      ...formData,
      requisitos: formData.requisitos.split("\n").map(r => r.trim()).filter(r => r)
    };

    setIsSaving(true);
    try {
      const token = keycloak.token;
      if (editingId) {
        await updateEspecialidad(editingId, payload, token); 
        toast.success("Actualizado con éxito.");
      } else {
        await createEspecialidad(payload, token);
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
    const matchEstado = activeTab === "PUBLICADOS" 
      ? esp.estado === "PUBLICADO" 
      : (esp.estado === "ARCHIVADO" || esp.estado === "BORRADOR");

    let matchTipo = true;
    if (filtroTipo === "ESPECIALIDADES") matchTipo = esp.esServicio === false;
    if (filtroTipo === "SERVICIOS") matchTipo = esp.esServicio === true;

    const query = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      (esp.nombre && esp.nombre.toLowerCase().includes(query)) ||
      (esp.ubicacion && esp.ubicacion.toLowerCase().includes(query)) ||
      (esp.descripcion && esp.descripcion.toLowerCase().includes(query));

    return matchEstado && matchTipo && matchSearch;
  });

  return (
    <div className="cms-dashboard-card">
      {/* Cabecera idéntica a Noticias y Profesionales */}
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de especialidades y servicios
          </h3>
          <p className="news-view-subtitle">
            Administre las especialidades médicas y servicios clave de la institución.
          </p>
        </div>
        <button type="button" className="btn-crear-noticia-header" onClick={handleOpenCreate}>
          + AÑADIR ESPECIALIDAD
        </button>
      </div>

      {/* Barra de herramientas: Pestañas a la izquierda, buscador y filtros a la derecha */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        
        {/* Pestañas de estado idénticas a Noticias */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            type="button"
            className={`res-tab-btn-unificado ${activeTab === "PUBLICADOS" ? "active" : ""}`}
            onClick={() => setActiveTab("PUBLICADOS")}
          >
            Publicados
          </button>
          <button 
            type="button"
            className={`res-tab-btn-unificado ${activeTab === "ARCHIVADOS" ? "active" : ""}`}
            onClick={() => setActiveTab("ARCHIVADOS")}
          >
            Archivados
          </button>
        </div>

        {/* Buscador y Selector alineados */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="res-search-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por nombre o ubicación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="res-search-input-field"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              FILTRAR POR:
            </span>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="res-select-field"
            >
              <option value="TODOS">Todas las clasificaciones</option>
              <option value="ESPECIALIDADES">Solo Especialidades</option>
              <option value="SERVICIOS">Solo Servicios Clave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor de la tabla idéntico al estilo de Noticias y Profesionales */}
      <div className="cms-news-table-container">
        <div className="activity-table-head news-table-head" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1.8 }}>CONTENIDO</div>
          <div style={{ flex: 1.2 }}>UBICACIÓN</div>
          <div style={{ flex: 1 }}>HORARIOS</div>
          <div style={{ flex: 1 }}>CLASIFICACIÓN</div>
          <div style={{ width: "120px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? ( 
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando listado...</span>
            </div>
          ) : 
           datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron registros que coincidan con los filtros aplicados.
            </div> 
          ) : (
            datosFiltrados.map((esp) => (
              <div className="activity-row news-table-row" key={esp.id + (esp.esServicio ? 'srv' : 'esp')} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                
                {/* Columna CONTENIDO con miniatura e información */}
                <div className="col-content" style={{ flex: 1.8, display: "flex", flexDirection: "row", alignItems: "center", gap: "15px" }}>
                  <div className="news-thumb-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" }}>
                    <div className="news-thumb-mock" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0c2340" }}>HIE</span>
                    </div>
                  </div>
                  <div className="news-title-interactive">
                    <span className="activity-title" style={{ fontWeight: "600", color: "#0c2340", fontSize: "0.95rem", display: "block" }}>
                      {esp.nombre}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      {esp.descripcion && esp.descripcion.length > 55 
                        ? `${esp.descripcion.substring(0, 55)}...` 
                        : esp.descripcion || "Área asistencial del hospital"}
                    </span>
                  </div>
                </div>

                {/* Columna UBICACIÓN */}
                <div style={{ flex: 1.2, color: "#475569", fontSize: "0.9rem", fontWeight: "500" }}>
                  {esp.ubicacion || "Sin ubicación asignada"}
                </div>

                {/* Columna HORARIOS */}
                <div style={{ flex: 1, color: "#475569", fontSize: "0.9rem", fontWeight: "500" }}>
                  {esp.horarios || "Consultar horarios"}
                </div>

                {/* Columna CLASIFICACIÓN (estilo idéntico a Noticias y Profesionales) */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <span style={{ 
                    backgroundColor: esp.esServicio ? "#e0f2fe" : "#ede9fe", 
                    color: esp.esServicio ? "#0284c7" : "#6d28d9", 
                    padding: "6px 14px", 
                    borderRadius: "8px", 
                    fontSize: "0.85rem", 
                    fontWeight: "700" 
                  }}>
                    {esp.esServicio ? "SERVICIO CLAVE" : "ESPECIALIDAD"}
                  </span>
                </div>

                {/* Columna ESTADO */}
                <div style={{ width: "120px", textAlign: "center" }}>
                  <span className={`status-badge ${esp.estado === "PUBLICADO" ? "publicado" : "archivado"}`}>
                    {esp.estado}
                  </span>
                </div>

                {/* Columna ACCIONES */}
                <div style={{ width: "100px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button type="button" onClick={() => handleOpenEdit(esp)} className="news-action-btn-edit" title="Editar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button type="button" onClick={() => confirmDelete(esp)} className="news-action-btn-delete" title="Eliminar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
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
                    <label className="esp-form-label">Información de Derivación (Opcional)</label>
                    <textarea value={formData.informacionDerivacion} onChange={(e) => { setFormData({...formData, informacionDerivacion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="2" placeholder="Información sobre cómo tramitar la derivación..." style={{ resize: "none" }} />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Requisitos y Documentación Necesaria <span style={{ textTransform: "none", color: "#94a3b8", fontWeight: "normal" }}>(Separa cada uno con la tecla Enter)</span></label>
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

      {/* MODAL DE CAMBIOS SIN GUARDAR */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => {
          setFormData((prev) => ({ ...prev, estado: "ARCHIVADO" }));
          setTimeout(() => handleSave(e), 50);
        }}
        saveDraftText="Guardar y archivar (Oculto)"
        message="¿Qué deseas hacer con el registro actual?"
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <CmsDeleteModal
        isOpen={showDeleteModal && !!itemAEliminar}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        itemName={itemAEliminar?.nombre}
        itemType={itemAEliminar?.esServicio ? "el servicio" : "la especialidad"}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CmsEspecialidadesView;