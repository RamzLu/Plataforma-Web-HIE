import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import { getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad } from "../../api/especialidades.api.js";
import "../../styles/components/cms/CmsDashboard.css"; 

const CmsEspecialidadesView = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "", descripcion: "", ubicacion: "", horarios: "", 
    requisitos: "", documentacionNecesaria: "", informacionDerivacion: "", 
    esServicio: false, activo: true
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ 
      nombre: "", descripcion: "", ubicacion: "", horarios: "", 
      requisitos: "", documentacionNecesaria: "", informacionDerivacion: "", 
      esServicio: false, activo: true 
    });
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
      documentacionNecesaria: esp.documentacionNecesaria || "",
      informacionDerivacion: esp.informacionDerivacion || "",
      esServicio: esp.esServicio, 
      activo: esp.activo
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio.");

    const payload = {
      ...formData,
      requisitos: formData.requisitos.split("\n").map(r => r.trim()).filter(r => r) 
    };

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
      cargarDatos();
    } catch (error) { toast.error("Error al guardar."); }
  };

  const confirmDelete = (esp) => { setItemAEliminar(esp); setShowDeleteModal(true); };

  const executeDelete = async () => {
    try {
      await deleteEspecialidad(itemAEliminar.id, keycloak.token, itemAEliminar.esServicio);
      toast.success("Eliminado con éxito.");
      setShowDeleteModal(false);
      cargarDatos();
    } catch (error) {
      const msg = error.response?.data?.error?.message || "Error al intentar eliminar.";
      toast.error(msg, { duration: 5000 });
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">Listado de Especialidades y Servicios</h3>
          <p className="news-view-subtitle">Administre los servicios médicos de la institución.</p>
        </div>
        <button type="button" className="btn-crear-noticia-header" onClick={handleOpenCreate}>+ NUEVO ELEMENTO</button>
      </div>

      <div className="cms-news-table-container" style={{ marginTop: "20px" }}>
        <div className="activity-table-head">
          <div style={{ flex: 1 }}>NOMBRE / TIPO</div>
          <div style={{ flex: 2 }}>DESCRIPCIÓN / UBICACIÓN</div>
          <div style={{ width: "100px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? ( <div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div> ) : 
           especialidades.length === 0 ? ( <div style={{ padding: "40px", textAlign: "center" }}>No hay registros.</div> ) : (
            especialidades.map((esp) => (
              <div className="activity-row" key={esp.id + (esp.esServicio ? 'srv' : 'esp')}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", color: "#0c2340" }}>{esp.nombre}</div>
                  <div style={{ fontSize: "0.75rem", color: esp.esServicio ? "#0284c7" : "#8b5cf6", fontWeight: "700", marginTop: "4px" }}>
                    {esp.esServicio ? "SERVICIO CLAVE" : "ESPECIALIDAD"}
                  </div>
                </div>
                <div style={{ flex: 2, color: "#64748b", fontSize: "0.85rem" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{esp.ubicacion || "Sin ubicación asignada"}</div>
                  {esp.descripcion && esp.descripcion.substring(0, 60)}...
                </div>
                <div style={{ width: "100px", textAlign: "center" }}>
                  <span className={`status-badge ${esp.activo ? "publicado" : "pendiente"}`}>{esp.activo ? "ACTIVO" : "INACTIVO"}</span>
                </div>
                <div style={{ width: "100px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button type="button" onClick={() => handleOpenEdit(esp)} className="news-action-btn-edit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                  <button type="button" onClick={() => confirmDelete(esp)} className="news-action-btn-delete"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp" style={{ maxWidth: "700px", padding: "30px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp" style={{ padding: "0 0 20px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>{editingId ? "Editar" : "Nuevo Registro"}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label className="news-form-label">Nombre *</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="news-form-input" required />
              </div>
              
              <div style={{ gridColumn: "span 2", display: "flex", gap: "20px", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: editingId ? "not-allowed" : "pointer", fontWeight: "600", opacity: editingId ? 0.6 : 1 }}>
                  <input type="checkbox" checked={formData.esServicio} disabled={!!editingId} onChange={(e) => setFormData({...formData, esServicio: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                  Marcar como "Servicio Clave"
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" }}>
                  <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({...formData, activo: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                  Activo (Visible en la web)
                </label>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="news-form-label">Descripción general</label>
                <textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="news-form-input" rows="2" style={{ resize: "none" }} />
              </div>

              <div>
                <label className="news-form-label">Ubicación física</label>
                <input type="text" value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} className="news-form-input" placeholder="Ej: Pasillo A, PB..." />
              </div>

              <div>
                <label className="news-form-label">Horarios</label>
                <input type="text" value={formData.horarios} onChange={(e) => setFormData({...formData, horarios: e.target.value})} className="news-form-input" placeholder="Ej: Lun a Vie, 8 a 12hs" />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="news-form-label">Documentación Necesaria</label>
                <input type="text" value={formData.documentacionNecesaria} onChange={(e) => setFormData({...formData, documentacionNecesaria: e.target.value})} className="news-form-input" placeholder="Ej: DNI, Derivación, Carnet..." />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="news-form-label">Información de Derivación</label>
                <textarea value={formData.informacionDerivacion} onChange={(e) => setFormData({...formData, informacionDerivacion: e.target.value})} className="news-form-input" rows="2" placeholder="Información sobre cómo tramitar la derivación..." style={{ resize: "none" }} />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="news-form-label">Requisitos (Uno por línea)</label>
                <textarea value={formData.requisitos} onChange={(e) => setFormData({...formData, requisitos: e.target.value})} className="news-form-input" rows="3" placeholder="Traer DNI&#10;Orden médica..." style={{ resize: "none" }} />
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                <button type="button" className="btn-cancelar-gris" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-cerrar-rojo" style={{ backgroundColor: "#006eb3" }}>{editingId ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-esp delete-modal-global" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-body">
              <h2 className="delete-modal-title">¿Eliminar registro?</h2>
              <p className="delete-modal-text">Si tiene profesionales asignados, no se podrá eliminar.</p>
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