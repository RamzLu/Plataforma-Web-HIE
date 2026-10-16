import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit3, Users, Upload, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import "../../styles/pages/cms/CmsInstitucionView.css";
import {
  getInstitucional,
  createAutoridad,
  updateAutoridad,
  deleteAutoridad,
  reordenarAutoridades,
  updateRedesSociales,
} from "../../api/autoridades.api.js";

const CmsInstitucionView = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Estado de Autoridades y Modal ---
  const [autoridades, setAutoridades] = useState([]);
  const [showAutoridadModal, setShowAutoridadModal] = useState(false);
  const [editingAutoridad, setEditingAutoridad] = useState(null);
  const [autoridadForm, setAutoridadForm] = useState({
    nombre: "",
    cargo: "",
    descripcion: "",
    archivo: null,
    previewUrl: null,
  });

  // --- Estado de Arrastre (Drag and Drop) ---
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  // --- ABRIR MODAL CREAR ---
  const handleOpenCreateAutoridad = () => {
    setEditingAutoridad(null);
    setAutoridadForm({
      nombre: "",
      cargo: "",
      descripcion: "",
      archivo: null,
      previewUrl: null,
    });
    setShowAutoridadModal(true);
  };

  // --- ABRIR MODAL EDITAR ---
  const handleOpenEditAutoridad = (autoridad) => {
    setEditingAutoridad(autoridad);
    setAutoridadForm({
      nombre: autoridad.nombre || "",
      cargo: autoridad.cargo || "",
      descripcion: autoridad.descripcion || "",
      archivo: null,
      previewUrl: autoridad.imagenUrl || null,
    });
    setShowAutoridadModal(true);
  };

  // --- GUARDAR AUTORIDAD (CREAR O ACTUALIZAR) ---
  const handleSaveAutoridadModal = async (e) => {
    e.preventDefault();
    if (!autoridadForm.nombre.trim() || !autoridadForm.cargo.trim()) {
      toast.error("Complete al menos el nombre y el cargo de la autoridad.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(
      editingAutoridad ? "Actualizando autoridad..." : "Guardando autoridad..."
    );

    try {
      const formData = new FormData();
      formData.append("nombre", autoridadForm.nombre.trim());
      formData.append("cargo", autoridadForm.cargo.trim());
      formData.append("descripcion", autoridadForm.descripcion.trim());

      // Si es nueva, se coloca al final de la lista automáticamente
      const ordenFinal = editingAutoridad
        ? (editingAutoridad.orden ?? 0)
        : (autoridades.length + 1);
      formData.append("orden", ordenFinal);

      if (autoridadForm.archivo) {
        formData.append("archivo", autoridadForm.archivo);
      }

      if (editingAutoridad) {
        const data = await updateAutoridad(editingAutoridad.id, formData, keycloak?.token);
        setAutoridades((prev) =>
          prev
            .map((a) => (a.id === editingAutoridad.id ? data.autoridad : a))
            .sort((a, b) => a.orden - b.orden)
        );
        toast.success("¡Autoridad actualizada con éxito!", { id: toastId });
      } else {
        const data = await createAutoridad(formData, keycloak?.token);
        setAutoridades((prev) =>
          [...prev, data.autoridad].sort((a, b) => a.orden - b.orden)
        );
        toast.success("¡Autoridad añadida correctamente!", { id: toastId });
      }

      setShowAutoridadModal(false);
    } catch (error) {
      toast.error("No se pudo guardar la autoridad.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // --- MANEJADORES DE DRAG AND DROP (REORDENAMIENTO) ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", `${index}`);
    } catch (err) {}
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedIndex;
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (sourceIndex === null || sourceIndex === targetIndex) {
      return;
    }

    const reordered = [...autoridades];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Actualización optimista inmediata
    const updatedList = reordered.map((item, idx) => ({
      ...item,
      orden: idx + 1,
    }));
    setAutoridades(updatedList);

    const toastId = toast.loading("Guardando nuevo orden...");
    try {
      const ordenIds = updatedList.map((a) => a.id);
      await reordenarAutoridades(ordenIds, keycloak?.token);
      toast.success("¡Orden actualizado con éxito!", { id: toastId });
    } catch (error) {
      toast.error("Error al actualizar el orden.", { id: toastId });
      fetchInstitucional(); // Restaurar orden en caso de fallo
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
            type="button"
            className="btn-inst-primary"
            onClick={handleOpenCreateAutoridad}
            disabled={isSaving}
          >
            <Plus size={16} strokeWidth={2.5} /> Añadir autoridad
          </button>
        </div>

        {/* Banner o tip explicativo del arrastre */}
        {autoridades.length > 1 && (
          <div className="inst-drag-tip">
            <GripVertical size={16} />
            <span>
              Podés arrastrar y soltar las filas para cambiar el orden de aparición de las autoridades en el portal público.
            </span>
          </div>
        )}

        {/* Tabla de autoridades */}
        <div className="inst-autoridades-tabla">
          <div className="inst-autoridades-head">
            <div style={{ textAlign: "center" }}>ORDEN</div>
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
            autoridades.map((a, index) => (
              <div
                key={a.id}
                className={`inst-autoridades-row draggable-row ${
                  draggedIndex === index ? "dragging" : ""
                } ${dragOverIndex === index ? "drag-over" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="inst-drag-col">
                  <div className="inst-drag-handle" title="Arrastrar para reordenar">
                    <GripVertical size={18} />
                  </div>
                  <span className="inst-order-badge">#{index + 1}</span>
                </div>
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
                <div className="inst-row-actions" onDragStart={(e) => e.stopPropagation()} draggable={false}>
                  <button className="btn-inst-icon edit" onClick={() => handleOpenEditAutoridad(a)} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button className="btn-inst-icon delete" onClick={() => setAutoridadToDelete(a)} title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
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

      {/* MODAL DE CREACIÓN / EDICIÓN DE AUTORIDAD */}
      {showAutoridadModal && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowAutoridadModal(false)}>
          <div className="modal-content-esp esp-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>{editingAutoridad ? "Editar Autoridad" : "Añadir Autoridad"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !isSaving && setShowAutoridadModal(false)}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveAutoridadModal} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  <div>
                    <label className="esp-form-label">
                      Nombre completo <span className="esp-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className="esp-form-input"
                      placeholder="Ej: Dr. Jorge Alberto Gómez"
                      required
                      value={autoridadForm.nombre}
                      onChange={(e) => setAutoridadForm({ ...autoridadForm, nombre: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="esp-form-label">
                      Cargo <span className="esp-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className="esp-form-input"
                      placeholder="Ej: Director Ejecutivo"
                      required
                      value={autoridadForm.cargo}
                      onChange={(e) => setAutoridadForm({ ...autoridadForm, cargo: e.target.value })}
                    />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Fotografía</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      {autoridadForm.previewUrl ? (
                        <img
                          src={autoridadForm.previewUrl}
                          alt="Foto"
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #0284c7",
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            background: "#e0f2fe",
                            color: "#0284c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <Users size={24} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label
                          htmlFor="aut-modal-file"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            background: "#e2e8f0",
                            color: "#0c2340",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#cbd5e1"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#e2e8f0"}
                        >
                          <Upload size={14} />
                          {autoridadForm.previewUrl ? "Cambiar foto" : "Seleccionar foto"}
                        </label>
                        <input
                          id="aut-modal-file"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setAutoridadForm({
                                ...autoridadForm,
                                archivo: file,
                                previewUrl: URL.createObjectURL(file)
                              });
                            }
                          }}
                        />
                        <span style={{ display: "block", marginTop: "4px", fontSize: "0.75rem", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {autoridadForm.archivo ? autoridadForm.archivo.name : "Formato JPG o PNG"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Descripción / Reseña (Opcional)</label>
                    <textarea
                      className="esp-form-input"
                      placeholder="Breve reseña sobre la trayectoria o especialidad de la autoridad..."
                      rows="3"
                      value={autoridadForm.descripcion}
                      onChange={(e) => setAutoridadForm({ ...autoridadForm, descripcion: e.target.value })}
                      style={{ resize: "none" }}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer-esp">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={() => setShowAutoridadModal(false)}
                  disabled={isSaving}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn-cerrar-rojo"
                  style={{ backgroundColor: "#2b5b94" }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }}></div>
                      {editingAutoridad ? "ACTUALIZANDO..." : "GUARDANDO..."}
                    </span>
                  ) : (
                    editingAutoridad ? "ACTUALIZAR" : "GUARDAR"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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