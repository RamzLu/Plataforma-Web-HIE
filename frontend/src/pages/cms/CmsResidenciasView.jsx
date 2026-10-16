import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { FileText, Upload, X, File } from "lucide-react";

import "../../styles/components/cms/CmsDashboard.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsEspecialidadesView.css";
import "../../styles/pages/cms/CmsResidenciasView.css";

const CmsResidenciasView = () => {
  // Registros base armonizados con el CMS
  const [residencias, setResidencias] = useState([
    {
      id: 1,
      nombre: "Residencia en Cardiología Clínica",
      tipo: "Básica",
      especialidad: "Cardiología",
      duracion: "3 años",
      cupos: "4",
      convocatoria: "Convocatoria 2026",
      fechaConvocatoria: "2026-04-15",
      descripcion:
        "Programa formativo de postgrado con rotación clínica y hemodinamia.",
      requisitos:
        "Título médico habilitante, promedio universitario sin aplazos.",
      archivoNombre: "Programa_Cardiologia_2026.pdf",
      archivoTamano: "1.8 MB",
      archivoUrl: "",
      estado: "PUBLICADO",
      createdAt: "2026-10-14T10:00:00Z",
    },
    {
      id: 2,
      nombre: "Residencia en Terapia Intensiva",
      tipo: "Básica",
      especialidad: "Terapia Intensiva (UCI)",
      duracion: "4 años",
      cupos: "3",
      convocatoria: "Convocatoria 2026",
      fechaConvocatoria: "2026-04-20",
      descripcion:
        "Formación de especialistas en cuidados críticos y soporte vital avanzado.",
      requisitos: "Matrícula profesional habilitada provincial o nacional.",
      archivoNombre: "Bases_Terapia_Intensiva_2026.pdf",
      archivoTamano: "2.4 MB",
      archivoUrl: "",
      estado: "PUBLICADO",
      createdAt: "2026-09-28T14:30:00Z",
    },
    {
      id: 3,
      nombre: "Residencia Posbásica en Infectología",
      tipo: "Posbásica",
      especialidad: "Infectología",
      duracion: "2 años",
      cupos: "2",
      convocatoria: "Convocatoria 2026",
      fechaConvocatoria: "2026-05-10",
      descripcion:
        "Especialización para profesionales con residencia completa en Clínica Médica.",
      requisitos: "Certificado de residencia completa en Medicina Interna.",
      archivoNombre: "",
      archivoTamano: "",
      archivoUrl: "",
      estado: "PUBLICADO",
      createdAt: "2026-09-20T11:00:00Z",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PUBLICADOS"); // PUBLICADOS, BORRADORES, ARCHIVADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manejo de archivo adjunto
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Formulario inicial
  const initialForm = {
    nombre: "",
    tipo: "Básica",
    especialidad: "",
    duracion: "3 años",
    cupos: "2",
    convocatoria: "Convocatoria 2026",
    fechaConvocatoria: "",
    descripcion: "",
    requisitos: "",
    archivoNombre: "",
    archivoTamano: "",
    archivoUrl: "",
    estado: "PUBLICADO",
  };

  const [formData, setFormData] = useState(initialForm);

  // Procesamiento de archivo PDF / Word
  const procesarArchivo = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension)) {
      return toast.error(
        "Solo se admiten documentos en formato PDF, DOC o DOCX.",
      );
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    setFormData((prev) => ({
      ...prev,
      archivoNombre: file.name,
      archivoTamano: sizeFormatted,
      archivoUrl: URL.createObjectURL(file),
    }));
    setHasUnsavedChanges(true);
    toast.success("Documento cargado correctamente.");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
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
    setFormData(initialForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // Apertura modal edición
  const handleOpenEdit = (res) => {
    setEditingId(res.id);
    setFormData({
      nombre: res.nombre || "",
      tipo: res.tipo || "Básica",
      especialidad: res.especialidad || "",
      duracion: res.duracion || "3 años",
      cupos: res.cupos || "",
      convocatoria: res.convocatoria || "",
      fechaConvocatoria: res.fechaConvocatoria || "",
      descripcion: res.descripcion || "",
      requisitos: res.requisitos || "",
      archivoNombre: res.archivoNombre || "",
      archivoTamano: res.archivoTamano || "",
      archivoUrl: res.archivoUrl || "",
      estado: res.estado || "PUBLICADO",
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

  // Guardar datos
  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!formData.nombre.trim()) {
      return toast.error("El nombre de la residencia es obligatorio.");
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        setResidencias((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? { ...item, ...formData, updatedAt: new Date().toISOString() }
              : item,
          ),
        );
        toast.success("Residencia actualizada con éxito.");
      } else {
        const nuevoRegistro = {
          id: Date.now(),
          ...formData,
          createdAt: new Date().toISOString(),
        };
        setResidencias((prev) => [nuevoRegistro, ...prev]);
        toast.success("Residencia creada con éxito.");
      }

      setIsSaving(false);
      setShowModal(false);
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
    }, 250);
  };

  // Eliminar
  const confirmDelete = (item) => {
    setItemAEliminar(item);
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (!itemAEliminar) return;
    setResidencias((prev) => prev.filter((r) => r.id !== itemAEliminar.id));
    toast.success("Residencia eliminada.");
    setShowDeleteModal(false);
    setItemAEliminar(null);
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
            Administre las convocatorias y programas de residencia de la
            institución.
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
              placeholder="Buscar por nombre..."
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
              FILTRAR POR:
            </span>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="res-select-field"
            >
              <option value="TODOS">Todas las clasificaciones</option>
              <option value="Básica">Residencias Básicas</option>
              <option value="Posbásica">Residencias Posbásicas</option>
              <option value="Multidisciplinaria">Multidisciplinarias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor de la tabla idéntico al estilo de Noticias y Profesionales */}
      <div className="cms-news-table-container">
        <div
          className="activity-table-head news-table-head"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ flex: 1.8 }}>CONTENIDO</div>
          <div style={{ flex: 1 }}>DURACIÓN Y CUPOS</div>
          <div style={{ flex: 1.2 }}>CONVOCATORIA</div>
          <div style={{ flex: 1 }}>CLASIFICACIÓN</div>
          <div style={{ width: "120px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                gridColumn: "1 / -1",
              }}
            >
              <div
                className="cms-spinner"
                style={{ margin: "0 auto 10px auto" }}
              ></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando residencias...
              </span>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
            >
              No se encontraron registros de residencias.
            </div>
          ) : (
            datosFiltrados.map((res) => (
              <div
                className="activity-row news-table-row"
                key={res.id}
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {/* Columna CONTENIDO con thumbnail e información interactiva */}
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
                  <div
                    className="news-thumb-box"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f1f5f9",
                    }}
                  >
                    <div
                      className="news-thumb-mock"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#0c2340",
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
                        display: "block",
                      }}
                    >
                      {res.especialidad || "Formación médica"}
                      {res.archivoNombre
                        ? ` • ${res.archivoNombre.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC"} adjunto`
                        : ""}
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
                  {res.duracion} • {res.cupos} vacantes
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
                  {res.convocatoria || "Abierta"}
                </div>

                {/* Columna CLASIFICACIÓN (estilo idéntico a Noticias y Profesionales) */}
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

                {/* Columna ESTADO (estilo idéntico al badge verde de Noticias) */}
                <div style={{ width: "120px", textAlign: "center" }}>
                  <span className={`status-badge ${res.estado?.toLowerCase()}`}>
                    {res.estado}
                  </span>
                </div>

                {/* Columna ACCIONES (botones idénticos a Noticias y Profesionales) */}
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

      {/* MODAL DE ALTA / EDICIÓN */}
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
                  {/* Nombre de la Residencia */}
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

                  {/* Especialidad o Servicio Vinculado */}
                  <div>
                    <label className="esp-form-label">
                      Especialidad / Área
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

                  {/* Cupos */}
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

                  {/* Convocatoria / Ciclo */}
                  <div>
                    <label className="esp-form-label">
                      Convocatoria / Ciclo
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

                  {/* Fecha de Examen o Inscripción */}
                  <div>
                    <label className="esp-form-label">
                      Fecha de Convocatoria / Examen
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

                  {/* Estado de Publicación */}
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
                      <option value="PUBLICADO">Publicado</option>
                      <option value="BORRADOR">Borrador</option>
                      <option value="ARCHIVADO">Archivado</option>
                    </select>
                  </div>

                  {/* Descripción / Objetivos */}
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
                      placeholder="Resumen del programa de formación, perfil del egresado y rotaciones..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Requisitos de Inscripción */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Requisitos</label>
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
                      placeholder="Título habilitante, matrícula provincial o nacional, promedio universitario..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Documento / Programa Académico (PDF / DOCX) */}
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
                              {formData.archivoTamano || "Documento cargado"} •
                              Formato{" "}
                              {formData.archivoNombre
                                .split(".")
                                .pop()
                                .toUpperCase()}
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
                  fontSize: "20px",
                  fontWeight: "600",
                  lineHeight: "28px",
                }}
              >
                Hay cambios sin guardar
              </h2>
              <p
                style={{
                  color: "#44474d",
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "400",
                  lineHeight: "22px",
                }}
              >
                ¿Qué deseas hacer con la información ingresada?
              </p>
            </div>
            <div
              style={{
                padding: "16px 24px 24px 24px",
                backgroundColor: "#f7f9fb",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, estado: "BORRADOR" }));
                  setTimeout(() => handleSave(), 50);
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  backgroundColor: "#000b20",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                Guardar como borrador
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  backgroundColor: "#ba1a1a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                Descartar cambios
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  backgroundColor: "#d8e0ed",
                  color: "#000b20",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content-esp delete-modal-global"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-close-floating"
              onClick={() => setShowDeleteModal(false)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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
                residencia del listado.
              </p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className="btn-cerrar-rojo"
                onClick={executeDelete}
              >
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsResidenciasView;
