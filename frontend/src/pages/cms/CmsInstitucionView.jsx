import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Edit3, Users, Upload, GripVertical, Crop, ZoomIn, ZoomOut, Check } from "lucide-react";
import Cropper from "react-easy-crop";
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

// Proporción exacta de la tarjeta en el portal público (331.73 x 260)
const ASPECT_RATIO_AUTORIDAD = 332 / 260;

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, fileName = "autoridad.jpg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve({ file, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.95
    );
  });
}

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

  // --- Estado del Recortador (Cropper) ---
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // --- Estado de Cambios Sin Guardar ---
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

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

  // --- COMPROBAR CAMBIOS PENDIENTES ---
  const checkHasChanges = () => {
    if (!editingAutoridad) {
      return !!(
        autoridadForm.nombre.trim() ||
        autoridadForm.cargo.trim() ||
        autoridadForm.descripcion.trim() ||
        autoridadForm.archivo
      );
    }
    return (
      autoridadForm.nombre !== (editingAutoridad.nombre || "") ||
      autoridadForm.cargo !== (editingAutoridad.cargo || "") ||
      autoridadForm.descripcion !== (editingAutoridad.descripcion || "") ||
      autoridadForm.archivo !== null
    );
  };

  const handleCloseAttempt = () => {
    if (isSaving) return;
    if (hasUnsavedChanges || checkHasChanges()) {
      setShowUnsavedModal(true);
    } else {
      setShowAutoridadModal(false);
      setHasUnsavedChanges(false);
      setImageSrc(null);
      setIsCropping(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowAutoridadModal(false);
    setHasUnsavedChanges(false);
    setImageSrc(null);
    setIsCropping(false);
  };

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
    setImageSrc(null);
    setIsCropping(false);
    setHasUnsavedChanges(false);
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
    setImageSrc(null);
    setIsCropping(false);
    setHasUnsavedChanges(false);
    setShowAutoridadModal(true);
  };

  // --- MANEJADORES DE RECORTE DE IMAGEN ---
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor seleccione un archivo de imagen (JPG, PNG o WEBP).");
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result);
      setIsCropping(true);
    };
    e.target.value = "";
  };

  const onCropComplete = (croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const { file, url } = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        `autoridad-${Date.now()}.jpg`
      );
      setAutoridadForm((prev) => ({
        ...prev,
        archivo: file,
        previewUrl: url,
      }));
      setHasUnsavedChanges(true);
      setIsCropping(false);
      toast.success("Foto encuadrada correctamente para el portal público.");
    } catch (e) {
      console.error(e);
      toast.error("Error al recortar la imagen.");
    }
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

      setHasUnsavedChanges(false);
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
                        width: "51px",
                        height: "40px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid #cbd5e1",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div className="modal-content-esp esp-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>{editingAutoridad ? "Editar Autoridad" : "Añadir Autoridad"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
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
                      onChange={(e) => {
                        setAutoridadForm({ ...autoridadForm, nombre: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
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
                      onChange={(e) => {
                        setAutoridadForm({ ...autoridadForm, cargo: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Fotografía <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>(Proporción tarjeta 332 × 260)</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#ffffff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      {autoridadForm.previewUrl ? (
                        <div style={{ position: "relative" }}>
                          <img
                            src={autoridadForm.previewUrl}
                            alt="Foto"
                            style={{
                              width: "74px",
                              height: "58px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              border: "2px solid #0284c7",
                              display: "block",
                              flexShrink: 0,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "74px",
                            height: "58px",
                            borderRadius: "6px",
                            background: "#e0f2fe",
                            color: "#0284c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            border: "1px dashed #7dd3fc",
                          }}
                        >
                          <Users size={26} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                          <label
                            htmlFor="aut-modal-file"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              background: "#0c2340",
                              color: "#ffffff",
                              borderRadius: "6px",
                              fontWeight: "600",
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#1a365d"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#0c2340"}
                          >
                            <Upload size={14} />
                            {autoridadForm.previewUrl ? "Cambiar foto" : "Seleccionar foto"}
                          </label>

                          {imageSrc && (
                            <button
                              type="button"
                              onClick={() => setIsCropping(true)}
                              className="btn-inst-recrop"
                            >
                              <Crop size={14} /> Reajustar encuadre
                            </button>
                          )}
                        </div>
                        <input
                          id="aut-modal-file"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <span className="inst-crop-badge">
                            Medida portal: 332 × 260
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {autoridadForm.archivo ? autoridadForm.archivo.name : "JPG, PNG o WEBP"}
                          </span>
                        </div>
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
                      onChange={(e) => {
                        setAutoridadForm({ ...autoridadForm, descripcion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      style={{ resize: "none" }}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer-esp">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={handleCloseAttempt}
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

      {/* ===== 4. MODAL DE ADVERTENCIA DE CAMBIOS SIN GUARDAR ===== */}
      {showUnsavedModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 99999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 11, 32, 0.4)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowUnsavedModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "384px",
              margin: "16px",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(196, 198, 206, 0.3)",
              boxShadow: "0px 10px 30px rgba(13,34,63,0.08)",
              fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
              position: "relative",
              zIndex: 999999,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px 24px 16px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2
                style={{
                  margin: 0,
                  color: "#000b20",
                  fontSize: "20px",
                  fontWeight: "600",
                  lineHeight: "28px",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Hay cambios sin guardar
              </h2>
              <p
                style={{
                  color: "#44474d",
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "24px",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                ¿Qué deseas hacer con el registro actual?
              </p>
            </div>
            <div
              style={{
                padding: "16px 24px 24px 24px",
                backgroundColor: "#f7f9fb",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <button
                type="button"
                onClick={handleForceClose}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#ba1a1a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: "800",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  lineHeight: "16px",
                  transition: "background-color 0.15s ease",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Descartar cambios
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#d8e0ed",
                  color: "#000b20",
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: "800",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  lineHeight: "16px",
                  transition: "background-color 0.15s ease",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. MODAL DE RECORTE / ENCUADRE DE FOTOGRAFÍA (332 x 260) ===== */}
      {isCropping && imageSrc && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-card">
            <div className="crop-modal-header">
              <div className="crop-header-left">
                <div className="crop-header-icon">
                  <Crop size={20} />
                </div>
                <div>
                  <h3 className="crop-modal-title">Encuadrar Fotografía</h3>
                  <p className="crop-modal-subtitle">
                    Ajustá el centrado y zoom para la tarjeta del portal público (332 × 260 px)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="crop-modal-close"
                onClick={() => setIsCropping(false)}
                title="Cerrar recorte"
                aria-label="Cerrar ventana de recorte"
              >
                <X size={20} />
              </button>
            </div>

            <div className="crop-area-wrapper">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT_RATIO_AUTORIDAD}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controles de Zoom */}
            <div className="crop-controls-panel">
              <div className="crop-zoom-row">
                <ZoomOut size={16} className="crop-zoom-icon" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  aria-label="Zoom de recorte"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="crop-zoom-slider"
                />
                <ZoomIn size={16} className="crop-zoom-icon" />
                <span className="crop-zoom-label">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <span className="crop-hint">
                Arrastrá la foto para centrar la cara y usá el deslizador para regular el acercamiento.
              </span>
            </div>

            <div className="crop-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setIsCropping(false)}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className="btn-crop-confirm"
                onClick={handleSaveCrop}
              >
                <Check size={16} strokeWidth={2.5} /> APLICAR RECORTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsInstitucionView;