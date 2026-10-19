import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FileText, Upload, X, File, Video, ExternalLink } from "lucide-react";
import keycloak from "../../config/keycloak";
import {
  getResidencias,
  createResidencia,
  updateResidencia,
  deleteResidencia,
  cambiarEstadoResidencia,
} from "../../api/residencias.api";

import "../../styles/components/cms/CmsDashboard.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsEspecialidadesView.css";
import "../../styles/pages/cms/CmsResidenciasView.css";

const CmsResidenciasView = () => {
  // Lista de residencias proveniente de la Base de Datos
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PUBLICADOS"); // PUBLICADOS, BORRADORES, ARCHIVADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // Modales y estados de acción
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manejo de archivo adjunto (PDF, DOC, DOCX o imagen)
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [eliminarArchivoFlag, setEliminarArchivoFlag] = useState(false);

  // Formulario inicial basado en schema.prisma
  const initialForm = {
    nombre: "",
    tipo: "Básica",
    especialidad: "",
    duracion: "3 años",
    cupos: "2",
    convocatoria: "Convocatoria 2026",
    fechaConvocatoria: "",
    estado: "PUBLICADO",
    videoUrl: "",
    descripcion: "",
    requisitos: "",
    contenidoDetallado: "",
    archivoNombre: "",
    archivoTamano: "",
    archivoUrl: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // Cargar residencias desde la Base de Datos
  const cargarResidencias = async () => {
    setLoading(true);
    try {
      const data = await getResidencias();
      setResidencias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar residencias:", error);
      toast.error("No se pudieron cargar las residencias desde la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResidencias();
  }, []);

  // Procesamiento de archivo PDF / Word / Imagen
  const procesarArchivo = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(extension)) {
      return toast.error(
        "Solo se admiten documentos en formato PDF, DOC, DOCX o imágenes JPG/PNG.",
      );
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    setArchivoSeleccionado(file);
    setEliminarArchivoFlag(false);
    setFormData((prev) => ({
      ...prev,
      archivoNombre: file.name,
      archivoTamano: sizeFormatted,
      archivoUrl: URL.createObjectURL(file),
    }));
    setHasUnsavedChanges(true);
    toast.success("Documento seleccionado para subir.");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(true);
    setFormData((prev) => ({
      ...prev,
      archivoNombre: "",
      archivoTamano: "",
      archivoUrl: "",
    }));
    setHasUnsavedChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  // Apertura modal alta
  const handleOpenCreate = () => {
    setEditingId(null);
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(false);
    setFormData(initialForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // Apertura modal edición
  const handleOpenEdit = (res) => {
    setEditingId(res.id);
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(false);
    setFormData({
      nombre: res.nombre || "",
      tipo: res.tipo || "Básica",
      especialidad: res.especialidad || "",
      duracion: res.duracion || "3 años",
      cupos: res.cupos || "",
      convocatoria: res.convocatoria || "",
      fechaConvocatoria: res.fechaConvocatoria || "",
      estado: res.estado || "PUBLICADO",
      videoUrl: res.videoUrl || "",
      descripcion: res.descripcion || "",
      requisitos: res.requisitos || "",
      contenidoDetallado: res.contenidoDetallado || "",
      archivoNombre: res.archivoNombre || "",
      archivoTamano: res.archivoTamano || "",
      archivoUrl: res.archivoUrl || "",
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // Cierre de modal
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

  // Guardar datos en la Base de Datos (Create / Update)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nombre.trim()) {
      return toast.error("El nombre de la residencia es obligatorio.");
    }

    setIsSaving(true);
    const toastId = toast.loading(
      editingId
        ? "Actualizando residencia en la base de datos..."
        : "Guardando residencia en la base de datos...",
    );

    try {
      const token = keycloak?.token;
      const dataForm = new FormData();
      dataForm.append("nombre", formData.nombre.trim());
      dataForm.append("tipo", formData.tipo);
      dataForm.append("especialidad", formData.especialidad);
      dataForm.append("duracion", formData.duracion);
      dataForm.append("cupos", formData.cupos);
      dataForm.append("convocatoria", formData.convocatoria);
      dataForm.append("fechaConvocatoria", formData.fechaConvocatoria);
      dataForm.append("estado", formData.estado);
      dataForm.append("videoUrl", formData.videoUrl);
      dataForm.append("descripcion", formData.descripcion);
      dataForm.append("requisitos", formData.requisitos);
      dataForm.append("contenidoDetallado", formData.contenidoDetallado);

      if (archivoSeleccionado) {
        dataForm.append("archivo", archivoSeleccionado);
      } else if (eliminarArchivoFlag) {
        dataForm.append("eliminarArchivo", "true");
      }

      if (editingId) {
        await updateResidencia(editingId, dataForm, token);
        toast.success("Residencia actualizada con éxito en la base de datos.", {
          id: toastId,
        });
      } else {
        await createResidencia(dataForm, token);
        toast.success("Residencia publicada con éxito en la base de datos.", {
          id: toastId,
        });
      }

      await cargarResidencias();
      setShowModal(false);
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error al guardar residencia:", error);
      const msg =
        error.response?.data?.error ||
        error.message ||
        "Error al guardar la residencia en la base de datos.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
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
    const toastId = toast.loading("Eliminando residencia de la base de datos...");

    try {
      const token = keycloak?.token;
      await deleteResidencia(itemAEliminar.id, token);
      toast.success("Residencia eliminada con éxito de la base de datos.", {
        id: toastId,
      });
      setShowDeleteModal(false);
      setItemAEliminar(null);
      await cargarResidencias();
    } catch (error) {
      console.error("Error al eliminar residencia:", error);
      const msg =
        error.response?.data?.error ||
        "Error al eliminar la residencia de la base de datos.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cambiar estado rápido directamente desde la grilla
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

  // Filtrado de datos
  const datosFiltrados = residencias.filter((res) => {
    const matchEstado =
      activeTab === "PUBLICADOS"
        ? res.estado === "PUBLICADO"
        : activeTab === "BORRADORES"
          ? res.estado === "BORRADOR"
          : res.estado === "ARCHIVADO";

    const matchTipo = filtroTipo === "TODOS" ? true : res.tipo === filtroTipo;

    const query = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      res.nombre.toLowerCase().includes(query) ||
      (res.especialidad && res.especialidad.toLowerCase().includes(query)) ||
      (res.convocatoria && res.convocatoria.toLowerCase().includes(query));

    return matchEstado && matchTipo && matchSearch;
  });

  return (
    <div className="cms-dashboard-card">
      {/* Cabecera idéntica a Noticias y Profesionales */}
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de residencias
          </h3>
          <p className="news-view-subtitle">
            Administre las convocatorias y programas de residencia formativa de la
            institución en la base de datos.
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

      {/* Barra de herramientas: Pestañas a la izquierda, buscador y filtros a la derecha */}
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
        {/* Pestañas de estado idénticas a Noticias */}
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

        {/* Buscador y Selector alineados */}
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
              placeholder="Buscar por programa o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="res-search-input-field"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              TIPO:
            </span>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="res-select-field"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="Básica">Residencias Básicas</option>
              <option value="Posbásica">Residencias Posbásicas</option>
              <option value="Multidisciplinaria">Multidisciplinarias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Unificada */}
      <div className="cms-table-container">
        <div
          className="cms-table-header"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 20px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            fontWeight: "700",
            fontSize: "0.75rem",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          <div style={{ flex: 2.2 }}>PROGRAMA Y ESPECIALIDAD</div>
          <div style={{ flex: 1 }}>DURACIÓN Y CUPOS</div>
          <div style={{ flex: 1.2 }}>CONVOCATORIA</div>
          <div style={{ flex: 1 }}>TIPO</div>
          <div style={{ width: "120px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="cms-table-body">
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                color: "#64748b",
              }}
            >
              <div
                className="cms-spinner"
                style={{
                  margin: "0 auto 12px",
                  width: "28px",
                  height: "28px",
                  borderWidth: "3px",
                  borderTopColor: "#2b5b94",
                  borderColor: "rgba(43, 91, 148, 0.2)",
                }}
              ></div>
              <p style={{ margin: 0, fontWeight: "600" }}>
                Cargando residencias desde la base de datos...
              </p>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                color: "#64748b",
              }}
            >
              <FileText size={40} style={{ margin: "0 auto 12px", color: "#94a3b8", display: "block" }} />
              <p style={{ margin: "0 0 12px 0", fontWeight: "600", fontSize: "1rem" }}>
                No se encontraron registros de residencias en la base de datos.
              </p>
              <button
                type="button"
                className="btn-crear-noticia-header"
                onClick={handleOpenCreate}
                style={{ margin: "0 auto" }}
              >
                + PUBLICAR NUEVA RESIDENCIA
              </button>
            </div>
          ) : (
            datosFiltrados.map((res) => (
              <div
                key={res.id}
                className="news-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  transition: "background-color 0.2s",
                }}
              >
                {/* Columna PROGRAMA Y ESPECIALIDAD */}
                <div
                  style={{
                    flex: 2.2,
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div className="news-img-thumbnail">
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#166534",
                        }}
                      >
                        HIE
                      </span>
                    </div>
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
                      <span>{res.especialidad || "Área formativa médica"}</span>
                      {res.archivoNombre && (
                        <a
                          href={res.archivoUrl || "#"}
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
                            if (!res.archivoUrl) e.preventDefault();
                          }}
                        >
                          • {res.archivoTipo || "DOC"}{" "}
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {res.videoUrl && (
                        <span
                          style={{
                            color: "#dc2626",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          • Video <Video size={11} />
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Columna DURACIÓN Y CUPOS */}
                <div
                  style={{
                    flex: 1,
                    color: "#475569",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  {res.duracion} • {res.cupos ? `${res.cupos} vacantes` : "Vacantes s/d"}
                </div>

                {/* Columna CONVOCATORIA */}
                <div
                  style={{
                    flex: 1.2,
                    color: "#475569",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  <div>{res.convocatoria || "Abierta"}</div>
                  {res.fechaConvocatoria && (
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                      Límite: {res.fechaConvocatoria}
                    </div>
                  )}
                </div>

                {/* Columna CLASIFICACIÓN */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      backgroundColor: "#e0f2fe",
                      color: "#0284c7",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                    }}
                  >
                    {res.tipo}
                  </span>
                </div>

                {/* Columna ESTADO (Selector interactivo: Publicado / Borrador / Archivado) */}
                <div style={{ width: "135px", display: "flex", justifyContent: "center" }}>
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
                  style={{
                    width: "100px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(res)}
                    className="news-action-btn-edit"
                    title="Editar residencia"
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
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(res)}
                    className="news-action-btn-delete"
                    title="Eliminar residencia"
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
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE ALTA / EDICIÓN BASADO EN SCHEMA.PRISMA */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp esp-modal-wrapper"
            style={{ maxWidth: "800px" }}
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
                  {/* Nombre de la Residencia (Prisma: nombre String @db.VarChar(200)) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Nombre del Programa / Residencia{" "}
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
                      placeholder="Ej: Residencia Médica en Terapia Intensiva..."
                      required
                    />
                  </div>

                  {/* Tipo de Residencia */}
                  <div>
                    <label className="esp-form-label">Tipo de Residencia</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => {
                        setFormData({ ...formData, tipo: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="Básica">Residencia Básica</option>
                      <option value="Posbásica">Residencia Posbásica</option>
                      <option value="Multidisciplinaria">
                        Multidisciplinaria
                      </option>
                    </select>
                  </div>

                  {/* Especialidad o Área Vinculada */}
                  <div>
                    <label className="esp-form-label">
                      Especialidad / Área Vinculada
                    </label>
                    <input
                      type="text"
                      value={formData.especialidad}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          especialidad: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Cardiología, Cuidados Críticos..."
                    />
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="esp-form-label">
                      Duración del Programa
                    </label>
                    <input
                      type="text"
                      value={formData.duracion}
                      onChange={(e) => {
                        setFormData({ ...formData, duracion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: 3 años, 4 años..."
                    />
                  </div>

                  {/* Cupos / Vacantes */}
                  <div>
                    <label className="esp-form-label">Cupos / Vacantes</label>
                    <input
                      type="text"
                      value={formData.cupos}
                      onChange={(e) => {
                        setFormData({ ...formData, cupos: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: 4 vacantes por año"
                    />
                  </div>

                  {/* Convocatoria / Ciclo (Prisma: convocatoria String?) */}
                  <div>
                    <label className="esp-form-label">
                      Convocatoria / Ciclo Formativo
                    </label>
                    <input
                      type="text"
                      value={formData.convocatoria}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          convocatoria: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Convocatoria Unificada 2026"
                    />
                  </div>

                  {/* Fecha de Convocatoria / Examen (Prisma: fechaConvocatoria DateTime?) */}
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

                  {/* Estado de Publicación (Prisma: estado EstadoEditorial) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Estado de Publicación
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => {
                        setFormData({ ...formData, estado: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="PUBLICADO">Publicado (Visible en portal)</option>
                      <option value="BORRADOR">Borrador (En edición)</option>
                      <option value="ARCHIVADO">Archivado (Histórico / Cerrado)</option>
                    </select>
                  </div>

                  {/* Video URL (Prisma: videoUrl String?) */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Video Informativo / Presentación</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "none",
                          fontWeight: "normal",
                        }}
                      >
                        Opcional (Enlace YouTube / Vimeo)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, videoUrl: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Descripción / Objetivos (Prisma: descripcion String?) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Descripción y Objetivos Formativos
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
                      rows="3"
                      placeholder="Resumen del programa de formación médica, perfil del egresado y rotaciones..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Requisitos de Admisión / Inscripción */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Requisitos de Admisión e Inscripción
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
                      rows="3"
                      placeholder="Título habilitante, matrícula provincial o nacional, promedio universitario sin aplazos..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Plan de Formación y Rotaciones (Prisma: contenido String?) */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Plan de Formación / Rotaciones y Servicios</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "none",
                          fontWeight: "normal",
                        }}
                      >
                        Opcional
                      </span>
                    </label>
                    <textarea
                      value={formData.contenidoDetallado}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          contenidoDetallado: e.target.value,
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="3"
                      placeholder="Detalles sobre régimen de guardias, rotaciones externas por hospitales de alta complejidad, materias teóricas..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Documento / Bases en PDF o Word (Prisma: archivo / imagenId) */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Programa / Reglamento en PDF o Word</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "none",
                          fontWeight: "normal",
                        }}
                      >
                        Opcional
                      </span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    {formData.archivoNombre ? (
                      <div className="res-file-selected-card">
                        <div className="res-file-selected-left">
                          <div
                            className={`res-file-type-icon ${formData.archivoNombre.toLowerCase().endsWith(".pdf") ? "pdf" : "doc"}`}
                          >
                            <FileText size={18} />
                          </div>
                          <div className="res-file-meta">
                            <span
                              className="res-file-name"
                              title={formData.archivoNombre}
                            >
                              {formData.archivoNombre}
                            </span>
                            <span className="res-file-size">
                              {formData.archivoTamano || "Documento cargado"} • Formato{" "}
                              {formData.archivoNombre.split(".").pop().toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {formData.archivoUrl && (
                            <button
                              type="button"
                              className="res-file-remove-btn"
                              onClick={() =>
                                window.open(formData.archivoUrl, "_blank")
                              }
                              title="Visualizar documento"
                              style={{ color: "#0284c7" }}
                            >
                              <File size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Reemplazar archivo"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={handleRemoveFile}
                            title="Quitar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`res-file-upload-zone ${isDragging ? "drag-active" : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="res-file-icon-wrap">
                          <Upload size={20} />
                        </div>
                        <p className="res-file-upload-title">
                          Cargar programa formativo o bases
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá tu archivo aquí o{" "}
                          <strong>hacé clic para examinar</strong> (PDF, DOC o
                          DOCX hasta 15 MB)
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
          >
            <div
              style={{
                padding: "24px 24px 16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#000b20",
                  fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  lineHeight: "1.3",
                }}
              >
                ¿Deseas descartar los cambios?
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#424754",
                  lineHeight: "1.5",
                }}
              >
                Tienes cambios sin guardar en el formulario. Si sales ahora, se
                perderán los datos ingresados.
              </p>
            </div>

            <div
              style={{
                padding: "16px 24px 24px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#ffffff",
              }}
            >
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e2e8f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f1f5f9")
                }
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ef4444")
                }
              >
                Descartar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteModal && itemAEliminar && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="modal-content delete-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="delete-modal-close"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="delete-modal-body">
              <div className="delete-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>

              <h2 className="delete-modal-title">
                Estás a punto de eliminar este elemento
              </h2>
              <div className="delete-modal-divider"></div>

              <p className="delete-modal-text">
                Esta acción es <strong>permanente</strong> y quitará la
                residencia <strong>"{itemAEliminar.nombre}"</strong> de la base de datos.
              </p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className="btn-cerrar-rojo"
                onClick={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "ELIMINANDO..." : "ELIMINAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsResidenciasView;
