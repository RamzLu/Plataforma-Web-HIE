import { mensajeDeError } from "../../utils/mensajeDeError";
import React, { useState, useRef, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { createDocumento, updateDocumento, deleteDocumento } from "../../api/documentos.api.js";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import { sanitizeUrl } from "../../utils/sanitizeUrl.js";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";
import "../../styles/pages/cms/CmsDocsView.css";
import {
  CmsDeleteModal,
  CmsConfirmDraftModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";

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
  onRefreshDocs,
  loading,
  userName,
  initialCreateModal = false,
  onModalOpened,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Pestañas y búsqueda unificadas con Especialidades y Noticias
  const [activeTab, setActiveTab] = useState("PUBLICADOS");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para control de cambios sin guardar y borradores
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  
  // Estados para control de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docAEliminar, setDocAEliminar] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Información institucional");
  const [estado, setEstado] = useState("Borrador");
  const [rejectionReasonActual, setRejectionReasonActual] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [nombreArchivoActual, setNombreArchivoActual] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCategoria("Información institucional");
    setEstado("Borrador"); 
    setRejectionReasonActual("");
    setArchivo(null);
    setNombreArchivoActual("");
    setPreviewUrl("");
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  React.useEffect(() => {
    if (initialCreateModal) {
      handleOpenCreate();
      if (onModalOpened) onModalOpened();
    }
  }, [initialCreateModal]);

  React.useEffect(() => {
    if (typeof onRefreshDocs === "function") {
      onRefreshDocs();
    }
  }, [onRefreshDocs]);

  React.useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible" && typeof onRefreshDocs === "function") {
        onRefreshDocs();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [onRefreshDocs]);

  const handleOpenEdit = (doc) => {
    setEditingId(doc.id);
    setTitulo(doc.title || doc.titulo || "");
    setCategoria(doc.category || doc.categoria || "Información institucional");
    
    let estadoFormateado = "Borrador";
    const e = (doc.estado || doc.status || "").toLowerCase();
    if (e === "publicado" || e === "aprobado") estadoFormateado = "Publicado";
    if (e === "en revisión" || e === "pendiente" || e === "pendiente_aprobacion" || e === "programado") estadoFormateado = "En revisión";
    
    setEstado(estadoFormateado);
    setRejectionReasonActual(doc.rejectionReason || "");
    setArchivo(null);
    setNombreArchivoActual(doc.fileName || doc.title || "");
    setPreviewUrl(doc.fileUrl || "");
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      setShowModal(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowModal(false);
    setHasUnsavedChanges(false);
  };

  const handleConfirmDeleteClick = (id) => {
    setDocAEliminar(id);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!docAEliminar) return;

    const id = docAEliminar;
    setDeletingId(id);

    try {
      const token = keycloak.token;
      if (!token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const docToDelete = (docsList || []).find((d) => d.id === id);
      const tituloDoc = docToDelete?.title || docToDelete?.titulo || "Documento";

      await deleteDocumento(id, token);
      recordCmsActivity({
        titulo: `Eliminó documento: "${tituloDoc}"`,
        categoria: docToDelete?.category || "Documentación",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });

      if (onDeleteDoc) onDeleteDoc(id);
      if (typeof onRefreshDocs === "function") onRefreshDocs();
      toast.success("Documento eliminado correctamente.");
      
      setShowDeleteModal(false);
      setDocAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
      const backendError = mensajeDeError(error, "Ocurrió un error al intentar eliminar el documento.");
      toast.error(backendError);
    } finally {
      setDeletingId(null);
    }
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
      toast.error("Formato no permitido. Solo se aceptan PDF o DOCX.");
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera el tamaño máximo de ${MAX_MB} MB.`);
      return false;
    }
    return true;
  };

  const procesarArchivo = (file) => {
    if (!file || !validarArchivo(file)) return;
    setArchivo(file);
    setHasUnsavedChanges(true); 
    if (!titulo.trim()) setTitulo(file.name.replace(/\.[^.]+$/, ""));
    
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
    setHasUnsavedChanges(true);
  };

  const handleSave = async (e, forcedEstado, bypassDraftWarning = false) => {
    if (e) e.preventDefault();

    if (editingId && !hasUnsavedChanges) {
      toast.error("No se han detectado cambios para actualizar.");
      setShowUnsavedModal(false);
      return;
    }

    if (!titulo.trim()) {
      toast.error("Por favor ingresá un título para el documento.");
      setShowUnsavedModal(false);
      return;
    }
    if (!editingId && !archivo && !nombreArchivoActual) {
      toast.error("Seleccioná un archivo PDF o DOCX para subir.");
      setShowUnsavedModal(false);
      return;
    }

    const estadoFinal = forcedEstado || estado;

    if (estadoFinal === "Borrador" && !bypassDraftWarning) {
      setShowConfirmDraftModal(true);
      return; 
    }

    setSaving(true);
    try {
      const token = keycloak.token;
      if (!token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("categoria", categoria);
      
      let estadoPrisma = "BORRADOR";
      if (estadoFinal === "Publicado") estadoPrisma = "PUBLICADO";
      if (estadoFinal === "En revisión") estadoPrisma = "PROGRAMADO";
      
      formData.append("estado", estadoPrisma);
      if (archivo) formData.append("archivo", archivo);

      let data;
      if (editingId) {
        data = await updateDocumento(editingId, formData, token);
      } else {
        data = await createDocumento(formData, token);
      }

      const docBackend = data.documento;
      const docFormateado = {
        id: docBackend?.id || editingId,
        title: titulo,
        description: docBackend?.description || "",
        category: categoria,
        status: estadoFinal === "Borrador" ? "borrador" : "pendiente",
        estado: estadoFinal === "Borrador" ? "BORRADOR" : "PENDIENTE_APROBACION",
        editor: docBackend?.editor || userName || "Editor CMS",
        editedBy: editingId ? (docBackend?.editedBy || userName) : null,
        fileName: archivo?.name || nombreArchivoActual,
        fileType: (archivo?.name || nombreArchivoActual || "").split(".").pop().toUpperCase(),
        fileSize: archivo ? formatearTamano(archivo.size) : (docBackend?.fileSize || ""),
        fileUrl: docBackend?.fileUrl || previewUrl,
        updatedAt: new Date().toLocaleDateString("es-AR"),
        rejectionReason: null,
      };

      if (editingId) {
        if (onUpdateDoc) onUpdateDoc(docFormateado);
        toast.success(
          estadoFinal === "Borrador"
            ? "Borrador actualizado con éxito."
            : "Modificaciones enviadas a revisión del administrador."
        );
      } else {
        if (onAddNewDoc) onAddNewDoc(docFormateado);
        toast.success(
          estadoFinal === "Borrador"
            ? "Borrador guardado con éxito."
            : "Documento enviado a revisión del administrador para su aprobación."
        );
      }

      if (typeof onRefreshDocs === "function") {
        onRefreshDocs();
      }

      setActiveTab(estadoFinal === "Borrador" ? "BORRADORES" : "PENDIENTES");
      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setShowConfirmDraftModal(false);
      setShowModal(false);
    } catch (error) {
      console.error("Error en handleSave:", error);
      const backendError = mensajeDeError(error, "Error al guardar");
      toast.error(`Error: ${backendError}`);
    } finally {
      setSaving(false);
    }
  };

  const getTextoEstado = (doc) => {
    const e = (doc.estado || doc.status || "borrador").toUpperCase();
    if (e === "PUBLICADO" || e === "APROBADO") return "Publicado";
    if (e === "PENDIENTE_APROBACION" || e === "PENDIENTE" || e === "PROGRAMADO") return "Pendiente de aprobación";
    if (e === "RECHAZADO") return "Rechazado";
    return "Borrador";
  };

  const getBadgeClass = (doc) => {
    const e = (doc.estado || doc.status || "borrador").toUpperCase();
    if (e === "PUBLICADO" || e === "APROBADO") return "publicado";
    if (e === "PENDIENTE_APROBACION" || e === "PENDIENTE" || e === "PROGRAMADO") return "pendiente";
    if (e === "RECHAZADO") return "rechazado";
    return "borrador";
  };

  const isPdf = archivo 
    ? archivo.name.toLowerCase().endsWith('.pdf') 
    : nombreArchivoActual.toLowerCase().endsWith('.pdf');

  // Conteo dinámico por pestañas
  const counts = useMemo(() => {
    const res = { PUBLICADOS: 0, PENDIENTES: 0, RECHAZADOS: 0, BORRADORES: 0 };
    (docsList || []).forEach((doc) => {
      const e = (doc.estado || doc.status || "").toUpperCase();
      if (e === "PUBLICADO" || e === "APROBADO") res.PUBLICADOS++;
      else if (e === "PENDIENTE_APROBACION" || e === "PENDIENTE" || e === "PROGRAMADO") res.PENDIENTES++;
      else if (e === "RECHAZADO") res.RECHAZADOS++;
      else res.BORRADORES++;
    });
    return res;
  }, [docsList]);

  // Filtrado según pestaña y término de búsqueda
  const docsFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (docsList || []).filter((doc) => {
      const e = (doc.estado || doc.status || "").toUpperCase();
      let matchTab = false;
      if (activeTab === "PUBLICADOS") matchTab = e === "PUBLICADO" || e === "APROBADO";
      else if (activeTab === "PENDIENTES") matchTab = e === "PENDIENTE_APROBACION" || e === "PENDIENTE" || e === "PROGRAMADO";
      else if (activeTab === "RECHAZADOS") matchTab = e === "RECHAZADO";
      else if (activeTab === "BORRADORES") matchTab = e === "BORRADOR" || e === "ARCHIVADO" || !e;

      const searchable = [
        doc.title || doc.titulo || "",
        doc.category || doc.categoria || "",
        doc.fileName || "",
        doc.editor || "",
      ].join(" ").toLowerCase();

      return matchTab && (!term || searchable.includes(term));
    });
  }, [docsList, activeTab, searchTerm]);

  return (
    <div className="cms-dashboard-card">
      <div className="docs-view-header">
        <div>
          <h3 className="cms-card-title docs-view-title">Documentación institucional</h3>
          <p className="docs-view-subtitle">Subí formularios y protocolos. Los documentos aprobados por el Administrador se publicarán en el portal.</p>
        </div>
        <button type="button" className="btn-subir-doc-header" onClick={handleOpenCreate}>
          + CARGAR DOCUMENTO
        </button>
      </div>

      {/* Pestañas de estado idénticas a Especialidades y Noticias */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px", marginBottom: "16px" }}>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "PUBLICADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("PUBLICADOS")}
        >
          Publicados ({counts.PUBLICADOS})
        </button>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "PENDIENTES" ? "active" : ""}`}
          onClick={() => setActiveTab("PENDIENTES")}
        >
          Pendientes de aprobación ({counts.PENDIENTES})
        </button>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "RECHAZADOS" ? "active" : ""}`}
          onClick={() => setActiveTab("RECHAZADOS")}
        >
          Rechazados ({counts.RECHAZADOS})
        </button>
        <button
          type="button"
          className={`res-tab-btn-unificado ${activeTab === "BORRADORES" ? "active" : ""}`}
          onClick={() => setActiveTab("BORRADORES")}
        >
          Borradores ({counts.BORRADORES})
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="search"
          placeholder="Buscar documento por título, archivo o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem",
            color: "#0c2340",
            backgroundColor: "#fff"
          }}
        />
      </div>

      <div className="cms-docs-table-container">
        <div className="activity-table-head docs-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-editor">EDITOR / FECHA</div>
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
          ) : docsFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay documentos en esta sección.
            </div>
          ) : (
            docsFiltrados.map((doc) => (
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
                      {sanitizeUrl(doc.fileUrl) && (
                        <a className="doc-preview-link" href={sanitizeUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" title="Ver documento original">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </a>
                      )}
                    </div>
                    
                    {doc.editedBy && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "2px", marginBottom: "2px" }}>
                        Editado por {doc.editedBy}
                      </span>
                    )}

                    <span className="doc-meta">
                      {(doc.fileType || "PDF")} · {(doc.fileSize || "—")}
                    </span>

                    {/* Alerta del motivo de rechazo del Administrador */}
                    {doc.rejectionReason && (
                      <div style={{
                        marginTop: "8px",
                        padding: "7px 11px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#b91c1c",
                        fontSize: "0.8rem",
                        lineHeight: "1.4"
                      }}>
                        <strong>Motivo de rechazo del Administrador:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-editor" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontWeight: 600, color: '#0c2340' }}>{doc.editor || userName || "Usuario CMS"}</span>
                  <small style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    <CalendarDays size={12} />
                    {doc.updatedAt || "Actualizado hoy"}
                  </small>
                </div>

                <div className="col-categoria">{doc.category || "Información institucional"}</div>
                
                <div className="col-estado">
                  <span className={`status-badge ${getBadgeClass(doc)}`}>
                    {getTextoEstado(doc)}
                  </span>
                </div>

                <div className="doc-actions-cell">
                  <button title="Editar" onClick={() => handleOpenEdit(doc)} className="doc-action-btn-edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button 
                    title="Eliminar" 
                    onClick={() => handleConfirmDeleteClick(doc.id)} 
                    className="doc-action-btn-delete"
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      <div className="cms-spinner-red"></div>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL PRINCIPAL DE DOCUMENTOS (RESTAURADO A COMO ESTABA ANTES) */}
      {showModal && (
        <div className="modal-overlay-docs" onClick={handleCloseAttempt}>
          <div className="modal-container-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="modal-header-docs">
              <div className="header-content-docs">
                <h1 className="modal-title-docs">{editingId ? "EDITAR DOCUMENTO" : "CARGA DE DOCUMENTACIÓN"}</h1>
                <p className="modal-subtitle-docs">
                  {editingId 
                    ? "Modificá la información o el archivo del documento." 
                    : "Completá los campos y seleccioná el archivo a publicar."}
                </p>
              </div>
              <button type="button" className="close-button-docs" onClick={handleCloseAttempt} aria-label="Cerrar modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            {/* Aviso si el documento fue previamente rechazado */}
            {rejectionReasonActual && (
              <div style={{
                margin: "16px 32px 0 32px",
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#b91c1c",
                fontSize: "0.85rem"
              }}>
                <strong>Correcciones solicitadas por el Administrador:</strong> {rejectionReasonActual}
              </div>
            )}

            <form className="modal-body-split" onSubmit={handleSave}>
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
                    onChange={(e) => {
                      setTitulo(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: Protocolos Clínicos y Asistenciales 2026"
                    required
                  />
                </div>

                <div className="form-row-grid-docs">
                  <div className="form-group-docs">
                    <label htmlFor="doc-category" className="field-label-docs">CATEGORÍA</label>
                    <div className="select-wrapper-docs">
                      <select 
                        id="doc-category" 
                        className="custom-select-docs" 
                        value={categoria} 
                        onChange={(e) => {
                          setCategoria(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      >
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
                      <select 
                        id="doc-status" 
                        className="custom-select-docs" 
                        value={estado} 
                        onChange={(e) => {
                          setEstado(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      >
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
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
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

              <div className="preview-column">
                <div className="preview-header">
                  <div className="preview-heading-group">
                    <span className="field-label-docs">VISTA PREVIA DEL DOCUMENTO</span>
                    <span className="preview-subtext">{previewUrl ? (isPdf ? "Visualizador PDF integrado" : "Vista previa no disponible") : "Esperando archivo..."}</span>
                  </div>
                  <div className="preview-toolbar">
                    <button type="button" className="icon-tool-btn" onClick={() => { const safe = sanitizeUrl(previewUrl, "", { allowBlob: true }); if (safe) window.open(safe, '_blank', 'noopener,noreferrer'); }} disabled={!previewUrl} aria-label="Abrir en pestaña nueva">
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
              <button type="button" className="btn-secondary-docs" onClick={handleCloseAttempt} disabled={saving}>CANCELAR</button>
              <button 
                type="submit" 
                className="btn-primary-docs" 
                onClick={handleSave} 
                disabled={saving || (Boolean(editingId) && !hasUnsavedChanges)}
                title={editingId && !hasUnsavedChanges ? "No se han detectado cambios para actualizar" : ""}
              >
                {saving 
                  ? (editingId ? "ACTUALIZANDO..." : "GUARDANDO...") 
                  : (editingId ? "ACTUALIZAR DOCUMENTO" : "GUARDAR DOCUMENTO")}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      <CmsDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleExecuteDelete}
        itemType="el documento"
        isDeleting={deletingId === docAEliminar}
      />

      {/* MODAL CAMBIOS SIN GUARDAR */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "Borrador")}
        message="¿Qué deseas hacer con el documento actual?"
      />

      {/* MODAL CONFIRMAR BORRADOR */}
      <CmsConfirmDraftModal
        isOpen={showConfirmDraftModal}
        onClose={() => setShowConfirmDraftModal(false)}
        onConfirm={(e) => handleSave(e, "Borrador", true)}
        itemType="este documento"
        loading={saving}
      />
    </div>
  );
};

export default CmsDocsView;
