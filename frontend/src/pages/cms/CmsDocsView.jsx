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
    setShowModal(true);
  };

  const formatearTamano = (bytes) => {
    if (bytes === undefined || bytes === null) return "";
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
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setIsDragging(true); 
  };
  
  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
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

  return (
    <div className="cms-dashboard-card">
      {/* HEADER DE LA VISTA GENERAL */}
      <div className="docs-view-header">
        <div>
          <h3 className="cms-card-title docs-view-title">Documentos publicados</h3>
          <p className="docs-view-subtitle">
            Protocolos y formularios disponibles en el portal.
          </p>
        </div>
        <button type="button" className="btn-subir-doc-header" onClick={handleOpenCreate}>
          ⬆ SUBIR ARCHIVO
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
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando listado de documentos...</span>
            </div>
          ) : docsList.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay documentos registrados.
            </div>
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
                  <span className={`status-badge ${doc.status || "borrador"}`}>
                    {textoEstado(doc.status || "Borrador")}
                  </span>
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

      {/* NUEVO MODAL DE CARGA/EDICIÓN DE DOCUMENTOS */}
      {showModal && (
        <div className="modal-overlay-docs" onClick={() => setShowModal(false)}>
          <div className="modal-container-docs" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {/* Header del Modal */}
            <header className="modal-header-docs">
              <div className="header-content-docs">
                <h1 className="modal-title-docs">{editingId ? "Editar Documentación" : "Carga de Documentación"}</h1>
                <p className="modal-subtitle-docs">Completá los datos del archivo para registrarlo en el sistema.</p>
              </div>
              <button type="button" className="close-button-docs" onClick={() => setShowModal(false)} aria-label="Cerrar modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            {/* Form Body */}
            <form className="modal-body-docs" onSubmit={handleSave}>
              {/* Título del documento */}
              <div className="form-group-docs">
                <label htmlFor="doc-title" className="field-label-docs">
                  Título del documento <span className="field-required-docs">*</span>
                </label>
                <input
                  id="doc-title"
                  type="text"
                  className="text-input-docs"
                  placeholder="Ej: Protocolos PDF 2026"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              {/* Categoría y Estado */}
              <div className="form-row-grid-docs">
                <div className="form-group-docs">
                  <label htmlFor="doc-category" className="field-label-docs">Categoría</label>
                  <div className="select-wrapper-docs">
                    <select
                      id="doc-category"
                      className="custom-select-docs"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="select-arrow-docs" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="form-group-docs">
                  <label htmlFor="doc-status" className="field-label-docs">Estado</label>
                  <div className="select-wrapper-docs">
                    <select
                      id="doc-status"
                      className="custom-select-docs"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      {ESTADOS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="select-arrow-docs" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archivo Adjunto (Dropzone) */}
              <div className="form-group-docs">
                <label className="field-label-docs">
                  Archivo adjunto {editingId ? "" : <span className="field-required-docs">*</span>}
                </label>
                
                <div
                  className={`dropzone-container-docs ${isDragging ? 'is-dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  <div className="upload-icon-wrapper-docs" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>

                  <p className="dropzone-text-primary-docs">
                    {archivo ? archivo.name : (nombreArchivoActual || 'Arrastrá tus archivos aquí')}
                  </p>
                  <p className="dropzone-text-secondary-docs">
                    Formatos aceptados: PDF, DOCX. Tamaño máximo: 10 MB.
                  </p>

                  <button
                    type="button"
                    className="dropzone-select-button-docs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                    {archivo || nombreArchivoActual ? "CAMBIAR ARCHIVO" : "SELECCIONAR ARCHIVO"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden-file-input-docs"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <footer className="modal-footer-docs">
                <button type="button" className="btn-secondary-docs" onClick={() => setShowModal(false)} disabled={saving}>
                  CANCELAR
                </button>
                <button type="submit" className="btn-primary-docs" disabled={saving}>
                  {saving ? "GUARDANDO..." : "GUARDAR DOCUMENTO"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsDocsView;