import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit3, Users, Upload } from "lucide-react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import "../../styles/pages/cms/CmsInstitucionView.css";
import {
  getInstitucional,
  createAutoridad,
  updateAutoridad,
  deleteAutoridad,
  updateRedesSociales,
} from "../../api/autoridades.api.js";

const CmsInstitucionView = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Estado de Autoridades ---
  const [autoridades, setAutoridades] = useState([]);
  const [editingAutoridadId, setEditingAutoridadId] = useState(null);
  const [tempAutoridad, setTempAutoridad] = useState({
    nombre: "",
    cargo: "",
    descripcion: "",
    orden: 0,
    archivo: null,
  });

  const [showAddAutoridad, setShowAddAutoridad] = useState(false);
  const [newAutoridad, setNewAutoridad] = useState({
    nombre: "",
    cargo: "",
    descripcion: "",
    orden: 0,
    archivo: null,
  });

  // --- Modal de Eliminación ---
  const [autoridadToDelete, setAutoridadToDelete] = useState(null);

  // --- Estado de Redes Sociales ---
  const [socialData, setSocialData] = useState({ facebook: "", instagram: "" });
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [tempSocial, setTempSocial] = useState({ facebook: "", instagram: "" });

  const fetchInstitucional = async () => {
    setLoading(true);
    try {
      const data = await getInstitucional();
      setAutoridades(data.autoridades || []);
      setSocialData(data.redesSociales || { facebook: "", instagram: "" });
      setTempSocial(data.redesSociales || { facebook: "", instagram: "" });
    } catch (error) {
      toast.error("Error al cargar la información institucional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitucional();
  }, []);

  // --- CREAR AUTORIDAD ---
  const handleAddAutoridad = async () => {
    if (!newAutoridad.nombre.trim() || !newAutoridad.cargo.trim()) {
      toast.error("Complete al menos el nombre y el cargo de la autoridad.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Guardando autoridad...");

    try {
      const formData = new FormData();
      formData.append("nombre", newAutoridad.nombre);
      formData.append("cargo", newAutoridad.cargo);
      formData.append("descripcion", newAutoridad.descripcion || "");
      formData.append("orden", newAutoridad.orden || autoridades.length + 1);
      if (newAutoridad.archivo) {
        formData.append("archivo", newAutoridad.archivo);
      }

      const data = await createAutoridad(formData, keycloak?.token);

      setAutoridades((prev) =>
        [...prev, data.autoridad].sort((a, b) => a.orden - b.orden)
      );
      setNewAutoridad({ nombre: "", cargo: "", descripcion: "", orden: 0, archivo: null });
      setShowAddAutoridad(false);
      toast.success("¡Autoridad añadida correctamente!", { id: toastId });
    } catch (error) {
      toast.error("No se pudo guardar la autoridad.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // --- EDITAR AUTORIDAD ---
  const handleEditAutoridad = (autoridad) => {
    setEditingAutoridadId(autoridad.id);
    setTempAutoridad({
      nombre: autoridad.nombre || "",
      cargo: autoridad.cargo || "",
      descripcion: autoridad.descripcion || "",
      orden: autoridad.orden ?? 0,
      archivo: null,
    });
  };

  const handleSaveAutoridad = async (id) => {
    if (!tempAutoridad.nombre.trim() || !tempAutoridad.cargo.trim()) {
      toast.error("El nombre y el cargo no pueden estar vacíos.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Actualizando autoridad...");

    try {
      const formData = new FormData();
      formData.append("nombre", tempAutoridad.nombre);
      formData.append("cargo", tempAutoridad.cargo);
      formData.append("descripcion", tempAutoridad.descripcion || "");
      formData.append("orden", tempAutoridad.orden ?? 0);
      if (tempAutoridad.archivo) {
        formData.append("archivo", tempAutoridad.archivo);
      }

      const data = await updateAutoridad(id, formData, keycloak?.token);

      setAutoridades((prev) =>
        prev.map((a) => (a.id === id ? data.autoridad : a)).sort((a, b) => a.orden - b.orden)
      );
      setEditingAutoridadId(null);
      toast.success("¡Autoridad actualizada con éxito!", { id: toastId });
    } catch (error) {
      toast.error("No se pudo actualizar la autoridad.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // --- ELIMINAR AUTORIDAD ---
  const executeDeleteAutoridad = async () => {
    if (!autoridadToDelete) return;

    setIsSaving(true);
    const toastId = toast.loading("Eliminando autoridad...");

    try {
      await deleteAutoridad(autoridadToDelete.id, keycloak?.token);

      setAutoridades((prev) => prev.filter((a) => a.id !== autoridadToDelete.id));
      toast.success("Autoridad eliminada correctamente.", { id: toastId });
      setAutoridadToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar la autoridad.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // --- GUARDAR REDES SOCIALES ---
  const handleSaveSocial = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Actualizando redes sociales...");

    try {
      const data = await updateRedesSociales(tempSocial, keycloak?.token);

      setSocialData(data);
      setIsEditingSocial(false);
      toast.success("¡Redes sociales actualizadas correctamente!", { id: toastId });
    } catch (error) {
      toast.error("Error al guardar las redes sociales.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
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
              <p className="inst-card-subtitle">
                Equipo directivo vigente del Hospital Interdistrital Evita
              </p>
            </div>
          </div>
          <button
            className="btn-inst-primary"
            onClick={() => setShowAddAutoridad(!showAddAutoridad)}
            disabled={isSaving}
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
                <label>Nombre completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Dr. Jorge Alberto Gómez"
                  value={newAutoridad.nombre}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, nombre: e.target.value })}
                />
              </div>
              <div className="inst-form-group">
                <label>Cargo *</label>
                <input
                  type="text"
                  placeholder="Ej: Director Ejecutivo"
                  value={newAutoridad.cargo}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, cargo: e.target.value })}
                />
              </div>
              <div className="inst-form-group">
                <label>Fotografía</label>
                <label className="btn-inst-cancel" style={{ cursor: "pointer", justifyContent: "center" }}>
                  <Upload size={15} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {newAutoridad.archivo ? newAutoridad.archivo.name : "Seleccionar imagen..."}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setNewAutoridad({ ...newAutoridad, archivo: file });
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="inst-add-form-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
              <div className="inst-form-group">
                <label>Descripción / Reseña (Opcional)</label>
                <input
                  type="text"
                  placeholder="Breve descripción o especialidad..."
                  value={newAutoridad.descripcion}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, descripcion: e.target.value })}
                />
              </div>
              <div className="inst-form-group">
                <label>Orden de aparición</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 1"
                  value={newAutoridad.orden}
                  onChange={(e) => setNewAutoridad({ ...newAutoridad, orden: e.target.value })}
                />
              </div>
            </div>

            <div className="inst-add-form-actions">
              <button
                className="btn-inst-cancel"
                disabled={isSaving}
                onClick={() => {
                  setShowAddAutoridad(false);
                  setNewAutoridad({ nombre: "", cargo: "", descripcion: "", orden: 0, archivo: null });
                }}
              >
                Cancelar
              </button>
              <button className="btn-inst-save" onClick={handleAddAutoridad} disabled={isSaving}>
                <Save size={15} strokeWidth={2.5} />
                {isSaving ? "..." : "Guardar autoridad"}
              </button>
            </div>
          </div>
        )}

        {/* Tabla de autoridades */}
        <div className="inst-autoridades-tabla">
          <div className="inst-autoridades-head">
            <div>NOMBRE Y DESCRIPCIÓN</div>
            <div>CARGO</div>
            <div>IMAGEN</div>
            <div style={{ textAlign: "center" }}>ACCIONES</div>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input
                        className="inst-inline-input"
                        type="text"
                        placeholder="Nombre completo"
                        value={tempAutoridad.nombre}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, nombre: e.target.value })}
                      />
                      <input
                        className="inst-inline-input"
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={tempAutoridad.descripcion}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, descripcion: e.target.value })}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input
                        className="inst-inline-input"
                        type="text"
                        placeholder="Cargo"
                        value={tempAutoridad.cargo}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, cargo: e.target.value })}
                      />
                      <input
                        className="inst-inline-input"
                        type="number"
                        placeholder="Orden"
                        value={tempAutoridad.orden}
                        onChange={(e) => setTempAutoridad({ ...tempAutoridad, orden: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="btn-inst-cancel" style={{ padding: "8px 12px", fontSize: "0.8rem", cursor: "pointer" }}>
                        <Upload size={14} />
                        <span>{tempAutoridad.archivo ? tempAutoridad.archivo.name : "Cambiar foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) setTempAutoridad({ ...tempAutoridad, archivo: file });
                          }}
                        />
                      </label>
                    </div>
                    <div className="inst-row-actions">
                      <button
                        className="btn-inst-icon save"
                        onClick={() => handleSaveAutoridad(a.id)}
                        disabled={isSaving}
                        title="Guardar"
                      >
                        {isSaving ? "..." : <Save size={16} />}
                      </button>
                      <button
                        className="btn-inst-icon cancel"
                        onClick={() => setEditingAutoridadId(null)}
                        disabled={isSaving}
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="inst-aut-nombre">{a.nombre}</div>
                      {a.descripcion && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                          {a.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="inst-aut-cargo">{a.cargo}</div>
                    <div className="inst-aut-imagen" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {a.imagenUrl ? (
                        <img
                          src={a.imagenUrl}
                          alt={a.nombre}
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #e2e8f0",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Sin imagen</span>
                      )}
                    </div>
                    <div className="inst-row-actions">
                      <button className="btn-inst-icon edit" onClick={() => handleEditAutoridad(a)} title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-inst-icon delete" onClick={() => setAutoridadToDelete(a)} title="Eliminar">
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
              <button
                className="btn-inst-primary"
                onClick={() => {
                  setTempSocial({ ...socialData });
                  setIsEditingSocial(true);
                }}
              >
                <Edit3 size={15} strokeWidth={2.5} /> Editar
              </button>
            ) : (
              <div className="inst-btn-group">
                <button className="btn-inst-cancel" onClick={() => setIsEditingSocial(false)} disabled={isSaving}>
                  Cancelar
                </button>
                <button className="btn-inst-save" onClick={handleSaveSocial} disabled={isSaving}>
                  <Save size={15} strokeWidth={2.5} /> {isSaving ? "..." : "Guardar"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="inst-social-grid">
          <div className="inst-social-field">
            <div className="inst-social-label-row">
              <div className="inst-social-icon facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </div>
              <label>Facebook</label>
            </div>
            <input
              type="text"
              className={`inst-social-input ${!isEditingSocial ? "readonly" : ""}`}
              value={isEditingSocial ? tempSocial.facebook : socialData.facebook}
              onChange={(e) => setTempSocial({ ...tempSocial, facebook: e.target.value })}
              disabled={!isEditingSocial}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="inst-social-field">
            <div className="inst-social-label-row">
              <div className="inst-social-icon instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <label>Instagram</label>
            </div>
            <input
              type="text"
              className={`inst-social-input ${!isEditingSocial ? "readonly" : ""}`}
              value={isEditingSocial ? tempSocial.instagram : socialData.instagram}
              onChange={(e) => setTempSocial({ ...tempSocial, instagram: e.target.value })}
              disabled={!isEditingSocial}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>
      </section>

      {/* MODAL DE ELIMINACIÓN */}
      {autoridadToDelete && (
        <div className="modal-overlay" onClick={() => !isSaving && setAutoridadToDelete(null)}>
          <div className="modal-content-esp delete-modal-global" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-body">
              <div className="delete-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2 className="delete-modal-title">Estás a punto de eliminar esta autoridad</h2>
              <div className="delete-modal-divider"></div>
              <p className="delete-modal-text">
                Se eliminará el registro de <strong>{autoridadToDelete.nombre}</strong> ({autoridadToDelete.cargo}).
              </p>
            </div>
            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setAutoridadToDelete(null)}
                disabled={isSaving}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className="btn-cerrar-rojo"
                onClick={executeDeleteAutoridad}
                disabled={isSaving}
              >
                {isSaving ? "..." : "ELIMINAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsInstitucionView;