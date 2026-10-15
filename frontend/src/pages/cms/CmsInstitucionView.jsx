import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit3, Users } from "lucide-react";
import "../../styles/pages/cms/CmsInstitucionView.css";

// --- Datos hardcodeados (simulan lo que vendría del backend) ---
const DATOS_INSTITUCIONALES = {
  autoridades: [
    { id: 1, nombre: "Dr. Jorge Alberto Gómez", cargo: "Director Ejecutivo", imagen: "archivon133621" },
    { id: 2, nombre: "Dra. María Fernández", cargo: "Directora Administrativa", imagen: "archivon133622" },
    { id: 3, nombre: "Dr. Carlos Pérez", cargo: "Director Médico", imagen: "archivon133623" },
  ],
  redesSociales: {
    facebook: "https://facebook.com/redevitaformosa",
    instagram: "https://instagram.com/redevitaformosa",
  },
};

const CmsInstitucionView = () => {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);

  // --- Estado de Autoridades ---
  const [autoridades, setAutoridades] = useState([]);
  const [editingAutoridadId, setEditingAutoridadId] = useState(null);
  const [tempAutoridad, setTempAutoridad] = useState({ nombre: "", cargo: "", imagen: "" });
  const [showAddAutoridad, setShowAddAutoridad] = useState(false);
  const [newAutoridad, setNewAutoridad] = useState({ nombre: "", cargo: "", imagen: "" });

  // --- Estado de Redes Sociales ---
  const [socialData, setSocialData] = useState({ facebook: "", instagram: "" });
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [tempSocial, setTempSocial] = useState({ facebook: "", instagram: "" });

  // Simula la carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDatos(DATOS_INSTITUCIONALES);
      setAutoridades(DATOS_INSTITUCIONALES.autoridades);
      setSocialData(DATOS_INSTITUCIONALES.redesSociales);
      setTempSocial(DATOS_INSTITUCIONALES.redesSociales);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- Handlers de Autoridades ---
  const handleEditAutoridad = (autoridad) => {
    setEditingAutoridadId(autoridad.id);
    setTempAutoridad({ nombre: autoridad.nombre, cargo: autoridad.cargo, imagen: autoridad.imagen });
  };

  const handleSaveAutoridad = (id) => {
    setAutoridades(prev =>
      prev.map(a => a.id === id ? { ...a, ...tempAutoridad } : a)
    );
    setEditingAutoridadId(null);
    setTempAutoridad({ nombre: "", cargo: "", imagen: "" });
  };

  const handleCancelEditAutoridad = () => {
    setEditingAutoridadId(null);
    setTempAutoridad({ nombre: "", cargo: "", imagen: "" });
  };

  const handleDeleteAutoridad = (id) => {
    if (window.confirm("¿Está seguro de eliminar esta autoridad?")) {
      setAutoridades(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddAutoridad = () => {
    if (!newAutoridad.nombre.trim() || !newAutoridad.cargo.trim()) {
      alert("Complete al menos el nombre y cargo de la autoridad.");
      return;
    }
    const nuevoId = autoridades.length > 0 ? Math.max(...autoridades.map(a => a.id)) + 1 : 1;
    setAutoridades(prev => [...prev, { id: nuevoId, ...newAutoridad }]);
    setNewAutoridad({ nombre: "", cargo: "", imagen: "" });
    setShowAddAutoridad(false);
  };

  // --- Handlers de Redes Sociales ---
  const handleSaveSocial = () => {
    setSocialData({ ...tempSocial });
    setIsEditingSocial(false);
    alert("¡Redes sociales actualizadas correctamente!");
  };

  if (loading) {
    return (
      <div className="cms-dashboard-card" style={{ padding: "60px", textAlign: "center" }}>
        <div className="cms-spinner" style={{ margin: "0 auto 12px auto" }}></div>
        <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Cargando información institucional...
        </span>
      </div>
    );
  }

  return (
    <div className="inst-container">

      {/* ===== 1. AUTORIDADES ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div className="inst-header-left">
            <div className="inst-header-icon-wrap">
              <Users size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="inst-card-title">Autoridades</h3>
              <p className="inst-card-subtitle">Equipo directivo vigente del Hospital Interdistrital Evita</p>
            </div>
          </div>
          <button
            className="btn-inst-primary"
            onClick={() => setShowAddAutoridad(!showAddAutoridad)}
          >
            {showAddAutoridad ? (
              <><X size={16} strokeWidth={2.5} /> Cancelar</>
            ) : (
              <><Plus size={16} strokeWidth={2.5} /> Añadir autoridad</>
            )}
          </button>
        </div>

        {/* Formulario para agregar nueva autoridad */}
        {showAddAutoridad && (
          <div className="inst-add-form">
            <div className="inst-add-form-grid">
              <div className="inst-form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  placeholder="Ej: Dr. Juan Pérez"
                  value={newAutoridad.nombre}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, nombre: e.target.value })}
                />
              </div>
              <div className="inst-form-group">
                <label>Cargo</label>
                <input
                  type="text"
                  placeholder="Ej: Director Ejecutivo"
                  value={newAutoridad.cargo}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, cargo: e.target.value })}
                />
              </div>
              <div className="inst-form-group">
                <label>Referencia de imagen</label>
                <input
                  type="text"
                  placeholder="Ej: archivon123456"
                  value={newAutoridad.imagen}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, imagen: e.target.value })}
                />
              </div>
            </div>
            <div className="inst-add-form-actions">
              <button className="btn-inst-cancel" onClick={() => { setShowAddAutoridad(false); setNewAutoridad({ nombre: "", cargo: "", imagen: "" }); }}>
                Cancelar
              </button>
              <button className="btn-inst-save" onClick={handleAddAutoridad}>
                <Save size={15} strokeWidth={2.5} /> Guardar autoridad
              </button>
            </div>
          </div>
        )}

        {/* Tabla de autoridades */}
        <div className="inst-autoridades-tabla">
          <div className="inst-autoridades-head">
            <div>NOMBRE</div>
            <div>CARGO</div>
            <div>IMAGEN</div>
            <div>ACCIONES</div>
          </div>
          {autoridades.length === 0 ? (
            <div className="inst-empty-state">
              <Users size={40} strokeWidth={1.5} />
              <p>No hay autoridades registradas</p>
              <span>Haga clic en "Añadir autoridad" para agregar la primera.</span>
            </div>
          ) : (
            autoridades.map((a) => (
              <div key={a.id} className="inst-autoridades-row">
                {editingAutoridadId === a.id ? (
                  <>
                    <div>
                      <input
                        className="inst-inline-input"
                        type="text"
                        value={tempAutoridad.nombre}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <input
                        className="inst-inline-input"
                        type="text"
                        value={tempAutoridad.cargo}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, cargo: e.target.value })}
                      />
                    </div>
                    <div>
                      <input
                        className="inst-inline-input"
                        type="text"
                        value={tempAutoridad.imagen}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, imagen: e.target.value })}
                      />
                    </div>
                    <div className="inst-row-actions">
                      <button className="btn-inst-icon save" onClick={() => handleSaveAutoridad(a.id)} title="Guardar">
                        <Save size={16} />
                      </button>
                      <button className="btn-inst-icon cancel" onClick={handleCancelEditAutoridad} title="Cancelar">
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inst-aut-nombre">{a.nombre}</div>
                    <div className="inst-aut-cargo">{a.cargo}</div>
                    <div className="inst-aut-imagen">{a.imagen}</div>
                    <div className="inst-row-actions">
                      <button className="btn-inst-icon edit" onClick={() => handleEditAutoridad(a)} title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-inst-icon delete" onClick={() => handleDeleteAutoridad(a.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="inst-card-footer-info">
          <span className="inst-count-badge">{autoridades.length} autoridades registradas</span>
        </div>
      </section>

      {/* ===== 2. REDES SOCIALES (Facebook + Instagram) ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div className="inst-header-left">
            <div className="inst-header-icon-wrap social">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </div>
            <div>
              <h3 className="inst-card-title">Redes Sociales</h3>
              <p className="inst-card-subtitle">Enlaces visibles en el portal público del hospital</p>
            </div>
          </div>

          <div className="inst-social-actions">
            {!isEditingSocial ? (
              <button className="btn-inst-primary" onClick={() => { setTempSocial({...socialData}); setIsEditingSocial(true); }}>
                <Edit3 size={15} strokeWidth={2.5} /> Editar
              </button>
            ) : (
              <div className="inst-btn-group">
                <button className="btn-inst-cancel" onClick={() => setIsEditingSocial(false)}>
                  Cancelar
                </button>
                <button className="btn-inst-save" onClick={handleSaveSocial}>
                  <Save size={15} strokeWidth={2.5} /> Guardar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="inst-social-grid">
          {/* Facebook */}
          <div className="inst-social-field">
            <div className="inst-social-label-row">
              <div className="inst-social-icon facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </div>
              <label>Facebook</label>
            </div>
            <input
              type="text"
              className={`inst-social-input ${!isEditingSocial ? "readonly" : ""}`}
              value={isEditingSocial ? tempSocial.facebook : socialData.facebook}
              onChange={(e) => setTempSocial({...tempSocial, facebook: e.target.value})}
              disabled={!isEditingSocial}
              placeholder="https://facebook.com/..."
            />
          </div>

          {/* Instagram */}
          <div className="inst-social-field">
            <div className="inst-social-label-row">
              <div className="inst-social-icon instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </div>
              <label>Instagram</label>
            </div>
            <input
              type="text"
              className={`inst-social-input ${!isEditingSocial ? "readonly" : ""}`}
              value={isEditingSocial ? tempSocial.instagram : socialData.instagram}
              onChange={(e) => setTempSocial({...tempSocial, instagram: e.target.value})}
              disabled={!isEditingSocial}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CmsInstitucionView;