import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import {
  FileText,
  Upload,
  X,
  File,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import keycloak from "../../config/keycloak";
import {
  getResidencias,
  createResidencia,
  updateResidencia,
  deleteResidencia,
  cambiarEstadoResidencia,
} from "../../api/residencias.api";

import "../../styles/components/cms/CmsDashboard.css";
import "../../styles/components/cms/CmsModals.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsEspecialidadesView.css";
import "../../styles/pages/cms/CmsResidenciasView.css";
import {
  CmsDeleteModal,
  CmsConfirmDraftModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";

const CmsResidenciasView = ({ initialCreateModal = false, onModalOpened }) => {
  // Lista de residencias de la BD
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PUBLICADOS"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODOS");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Referencias para carga de archivos
  const bannerInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);

  // Estados de archivos seleccionados
  const [bannerSeleccionado, setBannerSeleccionado] = useState(null);
  const [eliminarBannerFlag, setEliminarBannerFlag] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [eliminarDocumentoFlag, setEliminarDocumentoFlag] = useState(false);

  // Formulario según los campos solicitados para la vista del portal
  const initialForm = {
    nombre: "", // Nombre de la residencia
    categoria: "Formación Médica de Posgrado", // Categoría
    fechaConvocatoria: "", // Fecha Límite / Fecha de Examen
    convocatoria: "Abierta",
    descripcion: "", // Resumen breve / copete
    descripcionPrograma: "", // Descripción del Programa Académico
    cupos: "",
    duracion: "", // Duración Oficial
    requisitos: "", // Requisitos para la Postulación Provincial
    reglamentoRotacion: "Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia.", // Reglamento y Programa de Rotación
    estado: "BORRADOR",

    // Banner
    bannerNombre: "",
    bannerUrl: "",

    // Documento
    documentoNombre: "",
    documentoTamano: "",
    documentoTipo: "PDF",
    documentoUrl: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // Cargar residencias desde la BD
  const cargarResidencias = async () => {
    setLoading(true);
    try {
      const data = await getResidencias();
      setResidencias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar residencias:", error);
      toast.error("No se pudieron cargar las residencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResidencias();
  }, []);

  // Procesamiento de Imagen de Banner
  const procesarBanner = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
      return toast.error("La imagen de banner debe ser JPG, PNG o WEBP.");
    }

    setBannerSeleccionado(file);
    setEliminarBannerFlag(false);
    setFormData((prev) => ({
      ...prev,
      bannerNombre: file.name,
      bannerUrl: URL.createObjectURL(file),
    }));
    setHasUnsavedChanges(true);
    toast.success("Imagen de banner seleccionada.");
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarBanner(file);
  };

  const handleRemoveBanner = (e) => {
    if (e) e.stopPropagation();
    setBannerSeleccionado(null);
    setEliminarBannerFlag(true);
    setFormData((prev) => ({
      ...prev,
      bannerNombre: "",
      bannerUrl: "",
    }));
    setHasUnsavedChanges(true);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  // Procesamiento de Documento (PDF / DOC)
  const procesarDocumento = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension)) {
      return toast.error("El documento debe ser formato PDF, DOC o DOCX.");
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    setDocumentoSeleccionado(file);
    setEliminarDocumentoFlag(false);
    setFormData((prev) => ({
      ...prev,
      documentoNombre: file.name,
      documentoTamano: sizeFormatted,
      documentoTipo: extension.toUpperCase(),
      documentoUrl: URL.createObjectURL(file),
    }));
    setHasUnsavedChanges(true);
    toast.success("Documento cargado correctamente.");
  };

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarDocumento(file);
  };

  const handleRemoveDoc = (e) => {
    if (e) e.stopPropagation();
    setDocumentoSeleccionado(null);
    setEliminarDocumentoFlag(true);
    setFormData((prev) => ({
      ...prev,
      documentoNombre: "",
      documentoTamano: "",
      documentoTipo: "PDF",
      documentoUrl: "",
    }));
    setHasUnsavedChanges(true);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  // Apertura modal alta
  const handleOpenCreate = () => {
    setEditingId(null);
    setBannerSeleccionado(null);
    setEliminarBannerFlag(false);
    setDocumentoSeleccionado(null);
    setEliminarDocumentoFlag(false);
    setFormData(initialForm);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  useEffect(() => {
    if (initialCreateModal) {
      handleOpenCreate();
      if (onModalOpened) onModalOpened();
    }
  }, [initialCreateModal]);

  // Apertura modal edición
  const handleOpenEdit = (res) => {
    setEditingId(res.id);
    setBannerSeleccionado(null);
    setEliminarBannerFlag(false);
    setDocumentoSeleccionado(null);
    setEliminarDocumentoFlag(false);

    let convVal = "Abierta";
    if (res.convocatoria) {
      const norm = res.convocatoria.toLowerCase().trim();
      if (norm.includes("cerrad")) convVal = "Cerrada";
      else if (norm.includes("proxim") || norm.includes("próxim")) convVal = "Proximamente";
      else if (norm.includes("abiert")) convVal = "Abierta";
      else convVal = res.convocatoria;
    }

    setFormData({
      nombre: res.nombre || "",
      categoria:
        res.categoria ||
        "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
      fechaConvocatoria: res.fechaConvocatoria || "",
      convocatoria: convVal,
      descripcion: res.descripcion || "",
      descripcionPrograma: res.descripcionPrograma || "",
      cupos: res.cupos || "",
      duracion: res.duracion || "4 Años • Sede Hospital Interdistrital Evita",
      requisitos: res.requisitos || "",
      reglamentoRotacion:
        res.reglamentoRotacion ||
        "Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia.",
      estado: res.estado || "BORRADOR",

      bannerNombre: res.bannerNombre || "",
      bannerUrl: res.bannerUrl || "",

      documentoNombre: res.documentoNombre || "",
      documentoTamano: res.documentoTamano || "",
      documentoTipo: res.documentoTipo || "PDF",
      documentoUrl: res.documentoUrl || "",
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // Control de cierre modal
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

  // Guardar en la BD (Crear o Actualizar)
  const handleSave = async (e, forcedEstado, bypassDraftWarning = false) => {
    if (e) e.preventDefault();
    if (!formData.nombre.trim()) {
      return toast.error("El nombre de la residencia es obligatorio.");
    }

    const estadoFinal = forcedEstado || formData.estado || "BORRADOR";

    if (estadoFinal === "BORRADOR" && !bypassDraftWarning) {
      setShowConfirmDraftModal(true);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(
      editingId
        ? "Actualizando residencia..."
        : "Guardando residencia...",
    );

    try {
      const token = keycloak?.token;
      const dataForm = new FormData();
      dataForm.append("nombre", formData.nombre.trim());
      dataForm.append("categoria", formData.categoria.trim());
      dataForm.append("fechaConvocatoria", formData.fechaConvocatoria);
      dataForm.append("convocatoria", formData.convocatoria.trim());
      dataForm.append("descripcion", formData.descripcion.trim());
      dataForm.append("descripcionPrograma", formData.descripcionPrograma.trim());
      dataForm.append("cupos", (formData.cupos || "").trim());
      dataForm.append("duracion", formData.duracion.trim());
      dataForm.append("requisitos", formData.requisitos.trim());
      dataForm.append("reglamentoRotacion", formData.reglamentoRotacion.trim());
      dataForm.append("estado", estadoFinal);

      // Archivo de Banner (imagen)
      if (bannerSeleccionado) {
        dataForm.append("banner", bannerSeleccionado);
      } else if (eliminarBannerFlag) {
        dataForm.append("eliminarBanner", "true");
      }

      // Archivo de Documento (PDF / DOC)
      if (documentoSeleccionado) {
        dataForm.append("documento", documentoSeleccionado);
      } else if (eliminarDocumentoFlag) {
        dataForm.append("eliminarDocumento", "true");
      }

      if (editingId) {
        await updateResidencia(editingId, dataForm, token);
        toast.success(
          estadoFinal === "BORRADOR"
            ? "Borrador actualizado con éxito."
            : "Residencia actualizada con éxito.",
          { id: toastId },
        );
      } else {
        await createResidencia(dataForm, token);
        toast.success(
          estadoFinal === "BORRADOR"
            ? "Borrador guardado con éxito."
            : "Residencia publicada con éxito.",
          { id: toastId },
        );
      }

      await cargarResidencias();
      setShowModal(false);
      setShowConfirmDraftModal(false);
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error al guardar residencia:", error);
      const msg =
        error.response?.data?.error ||
        error.message ||
        "Error al guardar la residencia.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Cambiar estado interactivo (Publicado, Borrador, Archivado)
  const handleCambiarEstado = async (id, nuevoEstado) => {
    const estadoLegible =
      nuevoEstado === "PUBLICADO"
        ? "Publicado"
        : nuevoEstado === "BORRADOR"
          ? "Borrador"
          : "Archivado";

    const toastId = toast.loading(`Cambiando estado a ${estadoLegible}...`);
    try {
      const token = keycloak?.token;
      await cambiarEstadoResidencia(id, nuevoEstado, token);
      toast.success(
        `Estado actualizado a ${estadoLegible} con éxito.`,
        { id: toastId },
      );
      await cargarResidencias();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      const msg =
        error.response?.data?.error || "Error al cambiar el estado.";
      toast.error(msg, { id: toastId });
    }
  };

  // Eliminar residencia
  const confirmDelete = (item) => {
    setItemAEliminar(item);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!itemAEliminar) return;
    setIsDeleting(true);
    const toastId = toast.loading("Eliminando residencia...");

    try {
      const token = keycloak?.token;
      await deleteResidencia(itemAEliminar.id, token);
      recordCmsActivity({
        titulo: `Eliminó residencia: "${itemAEliminar.nombre || "Residencia"}"`,
        categoria: "Residencias",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });
      toast.success("Residencia eliminada con éxito.", {
        id: toastId,
      });
      setShowDeleteModal(false);
      setItemAEliminar(null);
      await cargarResidencias();
    } catch (error) {
      console.error("Error al eliminar residencia:", error);
      const msg =
        error.response?.data?.error ||
        "Error al eliminar la residencia.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado de datos
  const datosFiltrados = (Array.isArray(residencias) ? residencias : []).filter((res) => {
    if (!res) return false;
    const matchEstado =
      activeTab === "PUBLICADOS"
        ? res.estado === "PUBLICADO"
        : activeTab === "BORRADORES"
          ? res.estado === "BORRADOR"
          : res.estado === "ARCHIVADO";

    const matchCategoria =
      filtroCategoria === "TODOS" ? true : res.categoria === filtroCategoria;

    const query = (searchTerm || "").toLowerCase().trim();
    const matchSearch =
      !query ||
      (res.nombre && res.nombre.toLowerCase().includes(query)) ||
      (res.categoria && res.categoria.toLowerCase().includes(query)) ||
      (res.convocatoria && res.convocatoria.toLowerCase().includes(query)) ||
      (res.descripcion && res.descripcion.toLowerCase().includes(query));

    return matchEstado && matchCategoria && matchSearch;
  });

  const getInicialesResidencia = (nombre) => {
    if (!nombre) return "RC";
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      return `${palabras[0].charAt(0)}${palabras[1].charAt(0)}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  };

  return (
    <div className="cms-dashboard-card">
      {/* Cabecera */}
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de residencias
          </h3>
          <p className="news-view-subtitle">
            Administre los programas formativos, convocatorias, banner y reglamentos que se visualizan en el portal de residencias.
          </p>
        </div>
        <button
          type="button"
          className="btn-crear-noticia-header"
          onClick={handleOpenCreate}
        >
          + AÑADIR RESIDENCIA
        </button>
      </div>

      {/* Barra de herramientas: Pestañas a la izquierda, buscador a la derecha */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        {/* Pestañas de estado */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className={`res-tab-btn-unificado ${activeTab === "PUBLICADOS" ? "active" : ""}`}
            onClick={() => setActiveTab("PUBLICADOS")}
          >
            Publicados
          </button>
          <button
            type="button"
            className={`res-tab-btn-unificado ${activeTab === "BORRADORES" ? "active" : ""}`}
            onClick={() => setActiveTab("BORRADORES")}
          >
            Borradores
          </button>
          <button
            type="button"
            className={`res-tab-btn-unificado ${activeTab === "ARCHIVADOS" ? "active" : ""}`}
            onClick={() => setActiveTab("ARCHIVADOS")}
          >
            Archivados
          </button>
        </div>

        {/* Buscador */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div className="res-search-wrapper">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por programa o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="res-search-input-field"
            />
          </div>
        </div>
      </div>

      {/* Tabla Unificada con diseño armonizado idéntico a Profesionales */}
      <div className="cms-news-table-container">
        <div
          className="activity-table-head news-table-head"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ flex: 1.8 }}>PROGRAMA Y CATEGORÍA</div>
          <div style={{ flex: 1 }}>DURACIÓN</div>
          <div style={{ flex: 1.2 }}>FECHA / CONVOCATORIA</div>
          <div style={{ width: "135px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando residencias...
              </span>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron residencias registradas.
            </div>
          ) : (
            datosFiltrados.map((res) => (
              <div
                className="activity-row news-table-row"
                key={res.id}
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {/* Columna PROGRAMA Y CATEGORÍA */}
                <div
                  className="col-content"
                  style={{
                    flex: 1.8,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div className="news-thumb-box">
                    {res.bannerUrl ? (
                      <img
                        src={res.bannerUrl}
                        alt={res.nombre}
                        className="news-thumb-img"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="news-thumb-mock">
                        {getInicialesResidencia(res.nombre)}
                      </div>
                    )}
                  </div>
                  <div className="news-title-interactive">
                    <span
                      className="activity-title"
                      style={{
                        fontWeight: "600",
                        color: "#0c2340",
                        fontSize: "0.95rem",
                        display: "block",
                      }}
                    >
                      {res.nombre}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{res.categoria}</span>
                      {res.documentoNombre && (
                        <a
                          href={res.documentoUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#0284c7",
                            fontWeight: "600",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                          onClick={(e) => {
                            if (!res.documentoUrl) e.preventDefault();
                          }}
                        >
                          • {res.documentoTipo || "PDF"}{" "}
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {res.bannerUrl && (
                        <span
                          style={{
                            color: "#10b981",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          • Banner <ImageIcon size={11} />
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Columna DURACIÓN */}
                <div
                  className="col-cargo"
                  style={{
                    flex: 1,
                    color: "#0f172a",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {res.duracion || "-"}
                </div>

                {/* Columna FECHA LÍMITE Y CONVOCATORIA */}
                <div
                  className="col-area"
                  style={{
                    flex: 1.2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#0c2340", fontWeight: "600", fontSize: "0.88rem" }}>
                    {res.fechaConvocatoria || "Sin fecha fija"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color:
                        (res.convocatoria || "").toLowerCase().includes("cerrad")
                          ? "#ef4444"
                          : (res.convocatoria || "").toLowerCase().includes("proxim")
                          ? "#d97706"
                          : "#0284c7",
                      fontWeight: "700",
                      marginTop: "2px",
                      display: "inline-block",
                    }}
                  >
                    {res.convocatoria === "Proximamente"
                      ? "Próximamente"
                      : res.convocatoria || "Abierta"}
                  </span>
                </div>

                {/* Columna ESTADO */}
                <div
                  style={{
                    width: "135px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={res.estado}
                    onChange={(e) => handleCambiarEstado(res.id, e.target.value)}
                    className={`status-badge-select ${res.estado?.toLowerCase()}`}
                    title="Cambiar estado: Publicado / Borrador / Archivado"
                  >
                    <option value="PUBLICADO">Publicado</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="ARCHIVADO">Archivado</option>
                  </select>
                </div>

                {/* Columna ACCIONES */}
                <div
                  className="news-actions-cell"
                  style={{
                    width: "100px",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(res)}
                    className="news-action-btn-edit"
                    title="Editar"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(res)}
                    className="news-action-btn-delete"
                    title="Eliminar"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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

      {/* MODAL REHECHO CON LOS CAMPOS DE LA VISTA DEL PORTAL */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp esp-modal-wrapper"
            style={{ maxWidth: "860px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Residencia" : "Nueva Residencia"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
                aria-label="Cerrar modal"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={handleSave}
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  {/* 1. Nombre de la residencia */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Nombre de la Residencia{" "}
                      <span className="esp-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => {
                        setFormData({ ...formData, nombre: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Residencia en Clínica Médica"
                      required
                    />
                  </div>

                  {/* 2. Categoría */}
                  <div>
                    <label className="esp-form-label">Categoría Institucional</label>
                    <input
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => {
                        setFormData({ ...formData, categoria: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Formación Médica de Posgrado - Ministerio de Desarrollo Humano"
                    />
                  </div>

                  {/* 3. Fecha Límite / Fecha de Examen */}
                  <div>
                    <label className="esp-form-label">
                      Fecha Límite / Fecha de Examen
                    </label>
                    <input
                      type="date"
                      value={formData.fechaConvocatoria}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          fechaConvocatoria: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Estado de Convocatoria */}
                  <div>
                    <label className="esp-form-label">
                      Estado de la Convocatoria
                    </label>
                    <select
                      value={formData.convocatoria}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          convocatoria: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="Abierta">Abierta</option>
                      <option value="Cerrada">Cerrada</option>
                      <option value="Proximamente">Próximamente</option>
                      {formData.convocatoria &&
                        !["Abierta", "Cerrada", "Proximamente", "Próximamente"].includes(formData.convocatoria) && (
                          <option value={formData.convocatoria}>
                            {formData.convocatoria}
                          </option>
                        )}
                    </select>
                  </div>

                  {/* Estado de Publicación */}
                  <div>
                    <label className="esp-form-label">
                      Estado de Publicación en Portal
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => {
                        setFormData({ ...formData, estado: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="PUBLICADO">Publicado</option>
                      <option value="BORRADOR">Borrador</option>
                      <option value="ARCHIVADO">Archivado</option>
                    </select>
                  </div>

                  {/* Resumen breve introductorio */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Resumen Breve del Encabezado
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="2"
                      placeholder="Ej: Entrenamiento clínico intensivo en salas de internación general, cuidados intermedios y consultorios de orientación diagnóstica..."
                      style={{ resize: "vertical" }}
                    />
                    <span className="res-helper-text">
                      Texto que acompaña la categoría y fecha en el encabezado superior de la tarjeta.
                    </span>
                  </div>
                  {/* 4. Descripción del Programa Académico */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Descripción del Programa Académico
                    </label>
                    <textarea
                      value={formData.descripcionPrograma}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          descripcionPrograma: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="3"
                      placeholder="Ej: El programa formativo del Servicio de Clínica Médica del Hospital Interdistrital Evita prepara a los médicos para abordar patologías clínicas complejas de alta prevalencia y cuadros atípicos, con enfoque en medicina humanizada y soporte multidisciplinario..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Duración Oficial */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Duración Oficial</label>
                    <input
                      type="text"
                      value={formData.duracion}
                      onChange={(e) => {
                        setFormData({ ...formData, duracion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: 4 Años"
                    />
                  </div>

                  {/* 7. Requisitos para la Postulación Provincial */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Requisitos para la Postulación Provincial
                    </label>
                    <textarea
                      value={formData.requisitos}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          requisitos: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="4"
                      placeholder={"Título de Médico habilitado nacional o convalidado.\nInscripción formal en el Sistema Único de Residencias de Formosa.\nMatrícula profesional de la provincia de Formosa (o en trámite oficial).\nAprobación de la entrevista con el Comité Docente e Investigación."}
                      style={{ resize: "vertical" }}
                    />
                    <span className="res-helper-text">
                      Escriba un requisito por línea. En la vista del portal se representarán automáticamente como una lista con tilde (✓).
                    </span>
                  </div>
                  {/* 10. Imagen de banner */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Imagen de Banner / Portada</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "none",
                          fontWeight: "normal",
                        }}
                      >
                        Fotografía representativa (JPG, PNG, WEBP)
                      </span>
                    </label>

                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleBannerChange}
                      style={{ display: "none" }}
                    />

                    {formData.bannerUrl ? (
                      <div className="res-banner-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={formData.bannerUrl}
                            alt="Preview banner"
                            className="res-banner-thumb"
                          />
                          <div>
                            <div className="res-file-name" title={formData.bannerNombre || "Banner de la residencia"}>
                              {formData.bannerNombre || "Banner de la residencia"}
                            </div>
                            <span className="res-file-size">
                              Imagen cargada para el lateral derecho del portal
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => window.open(formData.bannerUrl, "_blank")}
                            title="Ver imagen en tamaño completo"
                            style={{ color: "#0284c7" }}
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => bannerInputRef.current?.click()}
                            title="Cambiar imagen"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={handleRemoveBanner}
                            title="Quitar banner"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`res-file-upload-zone ${isDraggingBanner ? "drag-active" : ""}`}
                        onClick={() => bannerInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) procesarBanner(f);
                        }}
                      >
                        <div className="res-file-icon-wrap">
                          <ImageIcon size={22} color="#2b5b94" />
                        </div>
                        <p className="res-file-upload-title">
                          Cargar imagen de banner para la tarjeta
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá una foto aquí o <strong>hacé clic para examinar</strong> (JPG o PNG recomendado 800x500px)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 8. Reglamento y Programa de Rotación */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Leyenda de Reglamento y Programa de Rotación
                    </label>
                    <input
                      type="text"
                      value={formData.reglamentoRotacion}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          reglamentoRotacion: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia..."
                    />
                    <span className="res-helper-text">
                      Descripción breve que se ubica justo encima del botón de descarga del documento.
                    </span>
                  </div>

                  {/* 9. Carga de documentos */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Carga de Documentos (PDF o Word)</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "none",
                          fontWeight: "normal",
                        }}
                      >
                        Programa formativo, cronograma o bases
                      </span>
                    </label>

                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocChange}
                      style={{ display: "none" }}
                    />

                    {formData.documentoNombre ? (
                      <div className="res-file-selected-card">
                        <div className="res-file-selected-left">
                          <div
                            className={`res-file-type-icon ${formData.documentoNombre.toLowerCase().endsWith(".pdf") ? "pdf" : "doc"}`}
                          >
                            <FileText size={18} />
                          </div>
                          <div className="res-file-meta">
                            <span
                              className="res-file-name"
                              title={formData.documentoNombre}
                            >
                              {formData.documentoNombre}
                            </span>
                            <span className="res-file-size">
                              {formData.documentoTamano || "Documento disponible"} • Formato{" "}
                              {formData.documentoTipo || "PDF"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {formData.documentoUrl && (
                            <button
                              type="button"
                              className="res-file-remove-btn"
                              onClick={() => window.open(formData.documentoUrl, "_blank")}
                              title="Visualizar documento"
                              style={{ color: "#0284c7" }}
                            >
                              <File size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => docInputRef.current?.click()}
                            title="Reemplazar archivo"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={handleRemoveDoc}
                            title="Quitar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`res-file-upload-zone ${isDraggingDoc ? "drag-active" : ""}`}
                        onClick={() => docInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingDoc(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingDoc(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingDoc(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) procesarDocumento(f);
                        }}
                      >
                        <div className="res-file-icon-wrap">
                          <Upload size={20} />
                        </div>
                        <p className="res-file-upload-title">
                          Cargar documento del programa (PDF, DOC o DOCX)
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá el archivo aquí o <strong>hacé clic para examinar</strong> (hasta 15 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
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
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        className="cms-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderWidth: "2px",
                          borderTopColor: "white",
                          borderColor: "rgba(255,255,255,0.3)",
                        }}
                      ></div>
                      GUARDANDO...
                    </span>
                  ) : editingId ? (
                    "ACTUALIZAR"
                  ) : (
                    "GUARDAR"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CAMBIOS SIN GUARDAR */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "BORRADOR", true)}
      />

      {/* MODAL DE CONFIRMACIÓN: GUARDAR COMO BORRADOR */}
      <CmsConfirmDraftModal
        isOpen={showConfirmDraftModal}
        onClose={() => setShowConfirmDraftModal(false)}
        onConfirm={(e) => handleSave(e, "BORRADOR", true)}
        itemType="esta residencia"
        loading={isSaving}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <CmsDeleteModal
        isOpen={showDeleteModal && !!itemAEliminar}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        itemName={itemAEliminar?.nombre}
        itemType="la residencia"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CmsResidenciasView;
