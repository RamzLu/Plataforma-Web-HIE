import React, { useState, useEffect } from "react";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";
import { getEspecialidades } from "../../api/especialidades.api.js";
import Cropper from "react-easy-crop";
import "../../styles/pages/cms/CmsProfesionalesView.css";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, fileName = "foto-perfil.jpg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve({ file, url: URL.createObjectURL(blob) });
    }, "image/jpeg");
  });
}

const CmsProfesionalesView = () => {
  const [profesionales, setProfesionales] = useState([]);
  const [areasDisponibles, setAreasDisponibles] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos"); 
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profesionalToDelete, setProfesionalToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    matricula: "",
    tipoFiltroModal: "ESPECIALIDAD", 
    especialidadId: "", 
    cargo: "",
    descripcion: ""
  });
  
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);       
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const resProf = await fetch("http://localhost:3000/api/cms/profesionales");
      if (resProf.ok) {
        const dataProf = await resProf.json();
        setProfesionales(dataProf);
      }
      const dataAreas = await getEspecialidades(true);
      setAreasDisponibles(dataAreas);
    } catch (error) {
      toast.error("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const profesionalesFiltrados = profesionales.filter(prof => {
    const coincideBusqueda = `${prof.nombre} ${prof.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    let coincideTipo = true;
    if (filtroTipo === "ESPECIALIDAD") coincideTipo = prof.esServicioClave === false;
    if (filtroTipo === "SERVICIO") coincideTipo = prof.esServicioClave === true;
    return coincideBusqueda && coincideTipo;
  });

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setIsModalOpen(false);
    setHasUnsavedChanges(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ 
      nombre: "", apellido: "", matricula: "", tipoFiltroModal: "ESPECIALIDAD", 
      especialidadId: "", cargo: "", descripcion: "" 
    });
    setArchivoFoto(null);
    setFotoPreview(null);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof) => {
    setEditingId(prof.id);
    setFormData({
      nombre: prof.nombre || "",
      apellido: prof.apellido || "",
      matricula: prof.matricula || "",
      tipoFiltroModal: prof.esServicioClave ? "SERVICIO" : "ESPECIALIDAD",
      especialidadId: prof.especialidadId || "",
      cargo: prof.cargo || "",
      descripcion: prof.descripcion || ""
    });
    setArchivoFoto(null);
    setFotoPreview(prof.imagenUrl || null);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const confirmDelete = (prof) => {
    setProfesionalToDelete(prof);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!profesionalToDelete) return;
    
    setIsSaving(true);
    const toastId = toast.loading("Eliminando profesional...");
    
    try {
      const token = keycloak?.token;
      const response = await fetch(`http://localhost:3000/api/cms/profesionales/${profesionalToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Error al eliminar");
      
      setProfesionales(profesionales.filter(p => p.id !== profesionalToDelete.id));
      toast.success("Profesional eliminado correctamente.", { id: toastId });
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("No se pudo eliminar el profesional.", { id: toastId });
    } finally {
      setIsSaving(false);
      setProfesionalToDelete(null);
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result);
      setIsCropping(true); 
    };
  };

  const onCropComplete = (croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleSaveCrop = async () => {
    try {
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      setArchivoFoto(file);
      setFotoPreview(url);
      setHasUnsavedChanges(true);
      setIsCropping(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      toast.error("Error al recortar la imagen.");
    }
  };


  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading(editingId ? "Actualizando profesional..." : "Creando profesional...");

    try {
      const token = keycloak?.token;
      const dataForm = new FormData();
      dataForm.append("nombre", formData.nombre);
      dataForm.append("apellido", formData.apellido);
      dataForm.append("matricula", formData.matricula);
      dataForm.append("cargo", formData.cargo);
      dataForm.append("descripcion", formData.descripcion);
      dataForm.append("especialidadId", formData.especialidadId);
      dataForm.append("esServicio", formData.tipoFiltroModal === "SERVICIO"); 

      if (archivoFoto) {
        dataForm.append("archivo", archivoFoto);
      }

      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `http://localhost:3000/api/cms/profesionales/${editingId}`
        : "http://localhost:3000/api/cms/profesionales";

      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: dataForm
      });

      if (!response.ok) throw new Error("Error al guardar");

      const resultado = await response.json();
      
      if (editingId) {
        setProfesionales(profesionales.map(p => p.id === editingId ? resultado.profesional : p));
        toast.success("¡Profesional actualizado con éxito!", { id: toastId });
      } else {
        setProfesionales([resultado.profesional, ...profesionales]);
        toast.success("¡Profesional creado con éxito!", { id: toastId });
      }
      
      setHasUnsavedChanges(false);
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Ocurrió un error al guardar el profesional.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const getIniciales = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();
  };

  const areasParaElSelect = areasDisponibles.filter(area => 
    formData.tipoFiltroModal === "ESPECIALIDAD" ? area.esServicio === false : area.esServicio === true
  );

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado del personal
          </h3>
          <p className="news-view-subtitle">
            Gestione las fichas de los profesionales de la institución.
          </p>
        </div>
        <button type="button" className="btn-crear-noticia-header news-btn-submit" onClick={handleOpenCreate}>
          + AÑADIR PROFESIONAL
        </button>
      </div>

      <div className="profesionales-filtros">
        <div className="filtro-busqueda">
          <label>Buscar profesional</label>
          <div className="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por nombre o apellido..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="filtro-select">
          <label>Clasificar vista</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="ESPECIALIDAD">Especialidades Médicas</option>
            <option value="SERVICIO">Servicios Clave</option>
          </select>
        </div>
      </div>

      <div className="cms-news-table-container">
        <div className="activity-table-head news-table-head" style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1.5 }}>PROFESIONAL</div>
          <div style={{ flex: 1 }}>CARGO O FUNCIÓN</div>
          <div style={{ flex: 1.2 }}>ÁREA ASIGNADA</div>
          <div style={{ flex: 1 }}>CLASIFICACIÓN</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando profesionales...</span>
            </div>
          ) : profesionalesFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron profesionales registrados.
            </div>
          ) : (
            profesionalesFiltrados.map((prof) => (
              <div className="activity-row news-table-row" key={prof.id} style={{ display: "flex", gap: "10px" }}>
                
                <div className="col-content" style={{ flex: 1.5, flexDirection: "row", alignItems: "center", gap: "15px" }}>
                  <div className="news-thumb-box">
                    {prof.imagenUrl ? (
                      <img src={prof.imagenUrl} alt="Avatar" className="news-thumb-img" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="news-thumb-mock">{getIniciales(prof.nombre, prof.apellido)}</div>
                    )}
                  </div>
                  <div className="news-title-interactive">
                    <span className="activity-title" style={{ fontWeight: "600", color: "#0c2340", fontSize: "0.95rem" }}>
                      {prof.nombre} {prof.apellido}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      {prof.matricula || "Sin matrícula"}
                    </span>
                  </div>
                </div>

                <div className="col-cargo" style={{ flex: 1, color: "#0f172a", fontWeight: "500", display: "flex", alignItems: "center" }}>
                  {prof.cargo || "-"}
                </div>

                <div className="col-area" style={{ flex: 1.2, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                  <span style={{ 
                    backgroundColor: "#e0f2fe", 
                    color: "#0284c7", 
                    padding: "6px 14px", 
                    borderRadius: "8px", 
                    fontSize: "0.85rem", 
                    fontWeight: "700",
                    display: "inline-block"
                  }}>
                    {prof.especialidadNombre}
                  </span>
                </div>

                <div className="col-clasificacion" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                  <span style={{ 
                    color: prof.esServicioClave ? "#64748b" : "#8b5cf6", 
                    fontSize: "0.75rem", 
                    fontWeight: "700", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {prof.esServicioClave ? "SERVICIO CLAVE" : "ESPECIALIDAD MÉDICA"}
                  </span>
                </div>

                <div className="news-actions-cell" style={{ width: "100px", justifyContent: "center", gap: "8px" }}>
                  <button type="button" title="Editar" onClick={() => handleOpenEdit(prof)} className="news-action-btn-edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button type="button" title="Eliminar" onClick={() => confirmDelete(prof)} className="news-action-btn-delete">
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

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-content">
                <h1 className="modal-title">{editingId ? "EDITAR PROFESIONAL" : "AÑADIR PROFESIONAL"}</h1>
                <p className="modal-subtitle">Completá los datos del profesional para registrarlo en el sistema.</p>
              </div>
              <button type="button" className="close-button" onClick={handleCloseAttempt} aria-label="Cerrar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">A</span>
                    <h2 className="section-title">DATOS PERSONALES <span className="esp-asterisk">*</span></h2>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre</label>
                      <input type="text" id="nombre" placeholder="Ej. Marcela" required value={formData.nombre} onChange={e => {setFormData({...formData, nombre: e.target.value}); setHasUnsavedChanges(true);}} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="apellido">Apellido</label>
                      <input type="text" id="apellido" placeholder="Ej. Ferreyra" required value={formData.apellido} onChange={e => {setFormData({...formData, apellido: e.target.value}); setHasUnsavedChanges(true);}} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="matricula">Matrícula</label>
                      <input type="text" id="matricula" placeholder="MP 00.000" value={formData.matricula} onChange={e => {setFormData({...formData, matricula: e.target.value}); setHasUnsavedChanges(true);}} />
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h2 className="section-title-simple">Fotografía {editingId ? "(Opcional si ya tiene una)" : <span className="esp-asterisk">*</span>} </h2>
                  <div className="file-upload-container">
                    <label className="file-upload-button">
                      Seleccionar archivo
                      <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
                    </label>
                    <span className="file-status">{archivoFoto ? archivoFoto.name : "Seleccione una imagen para encuadrar"}</span>
                  </div>
                  
                  {/* PREVISUALIZACIÓN DE LA FOTO RECORTADA / EXISTENTE */}
                  {fotoPreview && (
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ padding: "4px", backgroundColor: "#fff", borderRadius: "50%", border: "2px dashed #cbd5e1" }}>
                        <img 
                          src={fotoPreview} 
                          alt="Preview" 
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #f1f5f9', boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} 
                        />
                      </div>
                    </div>
                  )}
                </section>

                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">B</span>
                    <h2 className="section-title">ASIGNACIÓN DE ÁREA <span className="esp-asterisk">*</span> </h2>
                  </div>
                  <div className="form-grid">
                    
                    <div className="form-group">
                      <label htmlFor="tipo-area">Clasificación General</label>
                      <div className="select-wrapper">
                        <select 
                          id="tipo-area"
                          value={formData.tipoFiltroModal}
                          onChange={e => {setFormData({...formData, tipoFiltroModal: e.target.value, especialidadId: ''}); setHasUnsavedChanges(true);}}
                        >
                          <option value="ESPECIALIDAD">Especialidad médica</option>
                          <option value="SERVICIO">Servicio Clave</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label htmlFor="area-especifica">Seleccione el Área <span className="esp-asterisk">*</span></label>
                      <div className="select-wrapper">
                        <select 
                          id="area-especifica"
                          required
                          value={formData.especialidadId}
                          onChange={e => {setFormData({...formData, especialidadId: e.target.value}); setHasUnsavedChanges(true);}}
                        >
                          <option value="" disabled>-- Seleccione de la lista --</option>
                          {areasParaElSelect.length === 0 ? (
                            <option value="" disabled>No hay {formData.tipoFiltroModal === 'ESPECIALIDAD' ? 'Especialidades' : 'Servicios'} creados en el sistema.</option>
                          ) : (
                            areasParaElSelect.map(area => (
                              <option key={area.id} value={area.id}>{area.nombre}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">C</span>
                    <h2 className="section-title">ROL Y PERFIL <span className="esp-asterisk">*</span></h2>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cargo">Cargo o función</label>
                    <input type="text" id="cargo" placeholder="Ej. Jefa de Área" value={formData.cargo} onChange={e => {setFormData({...formData, cargo: e.target.value}); setHasUnsavedChanges(true);}} />
                  </div>
                  <div className="form-group margin-top-md">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea id="descripcion" placeholder="Breve reseña..." rows="4" value={formData.descripcion} onChange={e => {setFormData({...formData, descripcion: e.target.value}); setHasUnsavedChanges(true);}}></textarea>
                  </div>
                </section>

              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseAttempt} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }}></div>
                      {editingId ? "ACTUALIZANDO..." : "GUARDANDO..."}
                    </span>
                  ) : (
                    editingId ? "ACTUALIZAR PROFESIONAL" : "GUARDAR PROFESIONAL"
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY DEL CROPPER DE IMAGEN */}
      {isCropping && imageSrc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <h2 style={{ color: "#fff", marginBottom: "20px", fontWeight: "300", letterSpacing: "1px" }}>Encuadra la foto del profesional</h2>
          
          <div style={{ position: 'relative', width: '90%', maxWidth: '400px', height: '400px', backgroundColor: '#333', borderRadius: '12px', overflow: 'hidden', boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          
          {/* Controles de Zoom */}
          <div style={{ width: "90%", maxWidth: "400px", marginTop: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>Zoom</span>
            <input 
              type="range" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1} 
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)} 
              style={{ flex: 1, cursor: "pointer" }} 
            />
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
            <button type="button" onClick={() => { setIsCropping(false); setImageSrc(null); }} style={{ padding: '12px 24px', borderRadius: '50px', backgroundColor: '#334155', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>
              Cancelar
            </button>
            <button type="button" onClick={handleSaveCrop} style={{ padding: '12px 24px', borderRadius: '50px', backgroundColor: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>
              Recortar y Guardar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA DE CAMBIOS SIN GUARDAR */}
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
                onClick={handleForceClose} 
                style={{ width: "100%", padding: "16px 24px", backgroundColor: "#ba1a1a", color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px", transition: "background-color 0.15s ease", fontFamily: "'Manrope', sans-serif" }}
              >
                Descartar cambios
              </button>
              <button 
                type="button" 
                onClick={() => setShowUnsavedModal(false)} 
                style={{ width: "100%", padding: "16px 24px", backgroundColor: "#d8e0ed", color: "#000b20", border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px", transition: "background-color 0.15s ease", fontFamily: "'Manrope', sans-serif" }}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL GLOBAL DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowDeleteModal(false)}>
          <div className="modal-content-esp delete-modal-global" onClick={(e) => e.stopPropagation()}>
            
            <button type="button" className="btn-close-floating" onClick={() => setShowDeleteModal(false)} disabled={isSaving}>
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

              <h2 className="delete-modal-title">Estás a punto de eliminar este profesional</h2>
              <div className="delete-modal-divider"></div>

              <p className="delete-modal-text">
                Esta acción es <strong>permanente</strong> y eliminará la ficha de <br />
                <span style={{ fontWeight: "700", color: "#0f172a" }}>{profesionalToDelete?.nombre} {profesionalToDelete?.apellido}</span>.
              </p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSaving}
              >
                CANCELAR
              </button>
              <button 
                type="button"
                className="btn-cerrar-rojo" 
                onClick={executeDelete}
                disabled={isSaving}
              >
                {isSaving ? (
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

export default CmsProfesionalesView;