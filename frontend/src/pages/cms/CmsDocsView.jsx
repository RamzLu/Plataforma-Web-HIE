import React, { useState, useRef } from "react";
import keycloak from "../../config/keycloak";
import "../../styles/components/cms/CmsDocsView.css";

const CATEGORIAS = [
  "Información institucional", 
  "Guías Clínicas", 
  "Protocolos",
  "Administración"
];
const ESTADOS = ["Publicado", "En revisión", "Borrador"];
const EXTENSIONES_VALIDAS = ["pdf", "docx"];
const MAX_MB = 10;

const CmsDocsView = ({
  docsList = [],
  onAddNewDoc,
  onDeleteDoc,
  onUpdateDoc,
  loading,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Información institucional");
  const [estado, setEstado] = useState("Borrador");
  const [archivo, setArchivo] = useState(null);
  const [nombreArchivoActual, setNombreArchivoActual] = useState("");
  const [previewUrl, setPreviewUrl] = useState(""); // <-- NUEVO ESTADO PARA PREVISUALIZACIÓN REAL
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCategoria("Información institucional");
    setEstado("Borrador"); 
    setArchivo(null);
    setNombreArchivoActual("");
    setPreviewUrl("");
    setShowModal(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingId(doc.id);
    setTitulo(doc.title || "");
    setCategoria(doc.category || "Información institucional");
    
    let estadoFormateado = "Borrador";
    if (doc.status?.toLowerCase() === "publicado") estadoFormateado = "Publicado";
    if (doc.status?.toLowerCase() === "en revisión" || doc.status?.toLowerCase() === "programado") estadoFormateado = "En revisión";
    
    setEstado(estadoFormateado);
    setArchivo(null);
    setNombreArchivoActual(doc.fileName || doc.title || "");
    setPreviewUrl(doc.fileUrl || ""); // <-- Cargar la URL real del archivo si existe
    setShowModal(true);
  };

const formatearTamano = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "";
    
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validarArchivo = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!EXTENSIONES_VALIDAS.includes(ext)) {
      alert("Formato no permitido. Solo se aceptan PDF o DOCX.");
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`El archivo supera el tamaño máximo de ${MAX_MB} MB.`);
      return false;
    }
    return true;
  };

  const procesarArchivo = (file) => {
    if (!file || !validarArchivo(file)) return;
    setArchivo(file);
    if (!titulo.trim()) setTitulo(file.name.replace(/\.[^.]+$/, ""));
    
    // Generar URL local para mostrar la vista previa del archivo inmediatamente
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    setNombreArchivoActual("");
    setPreviewUrl("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert("Por favor ingresá un título para el documento.");
      return;
    }
    if (!editingId && !archivo && !nombreArchivoActual) {
      alert("Seleccioná un archivo PDF o DOCX para subir.");
      return;
    }

    setSaving(true);
    try {
      const token = keycloak.token;
      if (!token) {
        alert("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("categoria", categoria);
      
      let estadoPrisma = "BORRADOR";
      if (estado === "Publicado") estadoPrisma = "PUBLICADO";
      if (estado === "En revisión") estadoPrisma = "PROGRAMADO"; 
      
      formData.append("estado", estadoPrisma);
      if (archivo) formData.append("archivo", archivo);

      const url = editingId
        ? `http://localhost:3000/api/cms/documentacion/${editingId}`
        : "http://localhost:3000/api/cms/documentacion";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al guardar");

      const docFormateado = {
        id: data.documento?.id || editingId,
        title: titulo,
        category: categoria,
        status: estado.toLowerCase(),
        editor: "Tú",
        fileName: archivo?.name || nombreArchivoActual,
        fileType: (archivo?.name || nombreArchivoActual || "").split(".").pop().toUpperCase(),
        fileSize: archivo ? formatearTamano(archivo.size) : data.documento?.fileSize || "",
        fileUrl: data.documento?.fileUrl || "",
        updatedAt: new Date().toLocaleDateString("es-AR"),
      };

      if (editingId) {
        if (onUpdateDoc) onUpdateDoc(docFormateado);
        alert("¡Documento actualizado con éxito!");
      } else {
        if (onAddNewDoc) onAddNewDoc(docFormateado);
        alert("¡Documento subido con éxito!");
      }

      setShowModal(false);
    } catch (error) {
      console.error("Error en handleSave:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const textoEstado = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  const isPdf = archivo 
    ? archivo.name.toLowerCase().endsWith('.pdf') 
    : nombreArchivoActual.toLowerCase().endsWith('.pdf');

  return (
    <div className="cms-dashboard-card">
      <div className="docs-view-header">
        <div>
          <h3 className="cms-card-title docs-view-title">Documentos publicados</h3>
          <p className="docs-view-subtitle">Protocolos y formularios disponibles en el portal.</p>
        </div>
        <button type="button" className="btn-subir-doc-header" onClick={handleOpenCreate}>
          + CARGAR DOCUMENTO
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="cms-docs-table-container">
        <div className="activity-table-head docs-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-categoria">CATEGORÍA</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando listado...</span>
            </div>
          ) : docsList.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No hay documentos registrados.</div>
          ) : (
            docsList.map((doc) => (
              <div className="activity-row docs-table-row" key={doc.id}>
                <div className="col-content doc-content-cell">
                  <div className="doc-thumb-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className="doc-info">
                    <div className="doc-title-row">
                      <span className="doc-title">{doc.title}</span>
                      {doc.fileUrl && (
                        <a className="doc-preview-link" href={doc.fileUrl} target="_blank" rel="noreferrer" title="Ver documento">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </a>
                      )}
                    </div>
                    <span className="doc-meta">
                      {(doc.fileType || "PDF")} · {(doc.fileSize || "—")} · {(doc.updatedAt || "Actualizado hoy")}
                    </span>
                  </div>
                </div>

                <div className="col-editor">{doc.editor || "Tú"}</div>
                <div className="col-categoria">{doc.category || "Información institucional"}</div>
                <div className="col-estado">
                  <span className={`status-badge ${doc.status || "borrador"}`}>{textoEstado(doc.status || "Borrador")}</span>
                </div>

                <div className="doc-actions-cell">
                  <button title="Editar" onClick={() => handleOpenEdit(doc)} className="doc-action-btn-edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button title="Eliminar" onClick={() => onDeleteDoc(doc.id)} className="doc-action-btn-delete">
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
        <div className="modal-overlay-docs" onClick={() => setShowModal(false)}>
          <div className="modal-container-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="modal-header-docs">
              <div className="header-content-docs">
                <h1 className="modal-title-docs">{editingId ? "EDITAR DOCUMENTOS" : "CARGA DE DOCUMENTACIÓN"}</h1>
                <p className="modal-subtitle-docs">Completá los datos del archivo para registrarlo en el sistema.</p>
              </div>
              <button type="button" className="close-button-docs" onClick={() => setShowModal(false)} aria-label="Cerrar modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            <form className="modal-body-split" onSubmit={handleSave}>
              {/* LADO IZQUIERDO: FORMULARIO */}
              <div className="form-column">
                <div className="form-group-docs">
                  <label htmlFor="doc-title" className="field-label-docs">
                    TÍTULO DEL DOCUMENTO <span className="field-required-docs">*</span>
                  </label>
                  <input
                    id="doc-title"
                    type="text"
                    className="text-input-docs"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Protocolos Clínicos y Asistenciales 2026"
                    required
                  />
                </div>

                <div className="form-row-grid-docs">
                  <div className="form-group-docs">
                    <label htmlFor="doc-category" className="field-label-docs">CATEGORÍA</label>
                    <div className="select-wrapper-docs">
                      <select id="doc-category" className="custom-select-docs" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span className="select-arrow-docs" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                  </div>

                  <div className="form-group-docs">
                    <label htmlFor="doc-status" className="field-label-docs">ESTADO</label>
                    <div className="select-wrapper-docs">
                      <select id="doc-status" className="custom-select-docs" value={estado} onChange={(e) => setEstado(e.target.value)}>
                        {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="select-arrow-docs" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group-docs">
                  <div className="attachment-header">
                    <label className="field-label-docs">ARCHIVO ADJUNTO <span className="field-required-docs">*</span></label>
                    {(archivo || nombreArchivoActual) && (
                      <span className="file-status-badge">
                        <span className="badge-dot"></span> Archivo cargado
                      </span>
                    )}
                  </div>

                  {(archivo || nombreArchivoActual) && (
                    <div className="file-item-card">
                      <div className="file-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                      </div>
                      <div className="file-details">
                        <span className="file-name">{archivo ? archivo.name : nombreArchivoActual}</span>
                        <span className="file-meta">{archivo ? formatearTamano(archivo.size) : "Guardado"}</span>
                      </div>
                      <button type="button" className="delete-file-btn" onClick={handleRemoveFile} aria-label="Eliminar archivo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className={`dropzone-compact ${isDragging ? 'is-dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleBrowseClick}>
                    <div className="dropzone-icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <p className="dropzone-text"><strong>{archivo || nombreArchivoActual ? 'Arrastrá otro archivo para reemplazarlo' : 'Arrastrá tu archivo aquí o hacé clic'}</strong></p>
                    <p className="dropzone-sub">Formatos: PDF, DOCX (hasta 10 MB)</p>
                    <input ref={fileInputRef} type="file" className="hidden-file-input-docs" accept=".pdf,.docx" onChange={handleFileSelect} />
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: VISTA PREVIA REAL */}
              <div className="preview-column">
                <div className="preview-header">
                  <div className="preview-heading-group">
                    <span className="field-label-docs">VISTA PREVIA DEL DOCUMENTO</span>
                    <span className="preview-subtext">{previewUrl ? (isPdf ? "Visualizador PDF integrado" : "Vista previa no disponible") : "Esperando archivo..."}</span>
                  </div>
                  <div className="preview-toolbar">
                    <button type="button" className="icon-tool-btn" onClick={() => previewUrl && window.open(previewUrl, '_blank')} disabled={!previewUrl} aria-label="Abrir en pestaña nueva">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="sheet-container" style={{ padding: 0, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {previewUrl ? (
                    isPdf ? (
                      <iframe 
                        src={`${previewUrl}#toolbar=0`} 
                        title="Vista previa del documento"
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <p style={{ fontWeight: '600', margin: '0 0 5px 0', color: '#0d223f' }}>Archivo DOCX cargado</p>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>La vista previa en línea está disponible solo para formato PDF.</p>
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <p>Sube un documento para previsualizarlo aquí.</p>
                    </div>
                  )}
                </div>

                <div className="preview-status-footer">
                  {previewUrl ? (
                    <>
                      <span className="status-verified">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="9 12 11 14 15 10"></polyline></svg>
                        Archivo verificado
                      </span>
                      <span className="status-resolution">{archivo ? formatearTamano(archivo.size) : "Guardado en BD"}</span>
                    </>
                  ) : (
                    <span className="status-resolution" style={{ marginLeft: 'auto' }}>Esperando archivo...</span>
                  )}
                </div>
              </div>
            </form>

            <footer className="modal-footer-docs">
              <button type="button" className="btn-secondary-docs" onClick={() => setShowModal(false)} disabled={saving}>CANCELAR</button>
              <button type="submit" className="btn-primary-docs" onClick={handleSave} disabled={saving}>{saving ? "GUARDANDO..." : "GUARDAR DOCUMENTO"}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsDocsView;