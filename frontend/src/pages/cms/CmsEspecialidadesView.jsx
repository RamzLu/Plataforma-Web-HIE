import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "../../styles/components/cms/CmsDashboard.css"; // Reutilizamos los estilos del CMS

const CmsEspecialidadesView = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);

  // Estados para Eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [especialidadAEliminar, setEspecialidadAEliminar] = useState(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setActivo(true);
    setShowModal(true);
  };

  const handleOpenEdit = (esp) => {
    setEditingId(esp.id);
    setNombre(esp.nombre);
    setDescripcion(esp.descripcion || "");
    setActivo(esp.activo);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre de la especialidad es obligatorio.");
      return;
    }
    // Aquí conectaremos con la API más adelante
    toast.success(editingId ? "Especialidad actualizada (Simulación)" : "Especialidad creada (Simulación)");
    setShowModal(false);
  };

  const confirmDelete = (id) => {
    setEspecialidadAEliminar(id);
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    // Aquí conectaremos con la API más adelante
    toast.success("Especialidad eliminada (Simulación)");
    setShowDeleteModal(false);
    setEspecialidadAEliminar(null);
  };

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">Listado de Especialidades</h3>
          <p className="news-view-subtitle">
            Administre los servicios y especialidades médicas disponibles en la institución.
          </p>
        </div>
        <button type="button" className="btn-crear-noticia-header" onClick={handleOpenCreate}>
          + NUEVA ESPECIALIDAD
        </button>
      </div>

      <div className="cms-news-table-container" style={{ marginTop: "20px" }}>
        <div className="activity-table-head">
          <div style={{ flex: 1 }}>NOMBRE</div>
          <div style={{ flex: 2 }}>DESCRIPCIÓN</div>
          <div style={{ width: "100px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "120px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Cargando...</div>
          ) : especialidades.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay especialidades registradas. Haz clic en "Nueva Especialidad" para comenzar.
            </div>
          ) : (
            especialidades.map((esp) => (
              <div className="activity-row" key={esp.id}>
                <div style={{ flex: 1, fontWeight: "600", color: "#0c2340" }}>{esp.nombre}</div>
                <div style={{ flex: 2, color: "#64748b", fontSize: "0.9rem" }}>{esp.descripcion || "Sin descripción"}</div>
                <div style={{ width: "100px", textAlign: "center" }}>
                  <span className={`status-badge ${esp.activo ? "publicado" : "pendiente"}`}>
                    {esp.activo ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>
                <div style={{ width: "120px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button type="button" onClick={() => handleOpenEdit(esp)} className="news-action-btn-edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button type="button" onClick={() => confirmDelete(esp.id)} className="news-action-btn-delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE CREAR / EDITAR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp" style={{ maxWidth: "500px", padding: "30px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp" style={{ padding: "0 0 20px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>{editingId ? "Editar Especialidad" : "Nueva Especialidad"}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label className="news-form-label">Nombre de la Especialidad *</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="news-form-input" placeholder="Ej: Pediatría, Cardiología..." required />
              </div>
              
              <div>
                <label className="news-form-label">Descripción (Opcional)</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="news-form-input" placeholder="Breve descripción del servicio..." rows="3" style={{ resize: "none" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="activoCheck" checked={activo} onChange={(e) => setActivo(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <label htmlFor="activoCheck" style={{ fontWeight: "600", color: "#0c2340", cursor: "pointer" }}>Especialidad Activa (Visible)</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                <button type="button" className="btn-cancelar-gris" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-cerrar-rojo" style={{ backgroundColor: "#006eb3" }}>{editingId ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINAR */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-esp delete-modal-global" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-body">
              <h2 className="delete-modal-title">¿Eliminar esta especialidad?</h2>
              <p className="delete-modal-text">Si tiene profesionales asignados, no se podrá eliminar o se desvincularán.</p>
            </div>
            <div className="delete-modal-footer">
              <button type="button" className="btn-cancelar-gris" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button type="button" className="btn-cerrar-rojo" onClick={executeDelete}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsEspecialidadesView;