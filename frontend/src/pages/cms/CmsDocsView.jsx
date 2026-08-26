import React, { useState } from "react";
import keycloak from "../../config/keycloak";
import "../../styles/components/cms/CmsDocsView.css";

const CATEGORIAS = ["Prevención", "Institucional", "Capacitación", "Noticias"];
const ESTADOS = ["publicado", "pendiente", "programado"];
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
  const [categoria, setCategoria] = useState("Institucional");
  const [estado, setEstado] = useState("pendiente");
  const [archivo, setArchivo] = useState(null);
  const [nombreArchivoActual, setNombreArchivoActual] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCategoria("Institucional");
    setEstado("pendiente");
    setArchivo(null);
    setNombreArchivoActual("");
    setShowModal(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingId(doc.id);
    setTitulo(doc.title || "");
    setCategoria(doc.category || "Institucional");
    setEstado(doc.status || "pendiente");
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

  const handleFileSelect = (e) => procesarArchivo(e.target.files?.[0]);

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    setDragActive(true); 
  };
  
  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    setDragActive(false); 
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    procesarArchivo(e.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    setNombreArchivoActual("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert("Por favor ingresá un título para el documento.");
      return;
    }
    if (!editingId && !archivo) {
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
      formData.append("estado", estado);
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
        status: estado,
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

  const textoEstado = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="cms-dashboard-card">
      <div className="docs-view-header">
        <div>
          <h3 className="cms-card-title docs-view-title">Documentos publicados</h3>
          <p className="docs-view-subtitle">
            Protocolos y formularios disponibles en el portal.
          </p>
        </div>
        <button className="btn-subir-doc-header" onClick={handleOpenCreate}>
          ⬆ SUBIR ARCHIVO
        </button>
      </div>

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
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando listado de documentos...
              </span>
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className="doc-info">
                    <div className="doc-title-row">
                      <span className="doc-title">{doc.title}</span>
                      {doc.fileUrl && (
                        <a className="doc-preview-link" href={doc.fileUrl}
                          target="_blank" rel="noreferrer" title="Ver documento">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <div className="col-categoria">{doc.category || "Institucional"}</div>
                <div className="col-estado">
                  <span className={`status-badge ${doc.status || "pendiente"}`}>
                    {textoEstado(doc.status || "pendiente")}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp docs-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar documento" : "Carga de documentación"}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body-esp docs-form-container">
              <div>
                <label className="docs-form-label">Título del documento</label>
                <input type="text" value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Protocolos PDF 2026"
                  className="docs-form-input" required />
              </div>

              <div className="docs-form-row">
                <div style={{ flex: 1 }}>
                  <label className="docs-form-label">Categoría</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                    className="docs-form-select">
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="docs-form-label">Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)}
                    className="docs-form-select">
                    {ESTADOS.map((s) => <option key={s} value={s}>{textoEstado(s)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="docs-form-label">Archivo</label>
                <div
                  className={`doc-dropzone ${dragActive ? "drag-active" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="doc-dropzone-icon">
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <p className="doc-dropzone-text">Arrastre sus archivos aquí</p>
                  <p className="doc-dropzone-hint">
                    Formatos aceptados: PDF, DOCX. Tamaño máximo por archivo: {MAX_MB} MB.
                  </p>
                  <label className="btn-seleccionar-archivo">
                    ⬆ Seleccione archivo
                    <input type="file" accept=".pdf,.docx" onChange={handleFileSelect}
                      style={{ display: "none" }} />
                  </label>
                </div>

                {(archivo || nombreArchivoActual) && (
                  <div className="doc-file-card">
                    <div className="doc-file-info">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <div>
                        <span className="doc-file-name">
                          {archivo ? archivo.name : nombreArchivoActual}
                        </span>
                        <span className="doc-file-size">
                          {archivo ? formatearTamano(archivo.size) : "Archivo actual"}
                        </span>
                      </div>
                    </div>
                    <button type="button" className="doc-file-remove"
                      onClick={handleRemoveFile} title="Quitar archivo">
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer-esp docs-modal-footer">
                <button type="button" className="btn-cancelar-gris"
                  onClick={() => setShowModal(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-cerrar-rojo docs-btn-submit" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsDocsView;