import React, { useState, useRef } from "react";
import { createNoticia, updateNoticia, deleteNoticia } from "../../api/noticias.api.js";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import avatarHospital from "../../assets/logoHospitalEvita.png";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isToday } from "date-fns";
import es from "date-fns/locale/es";

import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  BlockQuote,
  Undo,
  Alignment,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import {
  CmsDeleteModal,
  CmsConfirmDraftModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";

registerLocale("es", es);

const CATEGORIAS = ["General", "Cáncer de Mama", "Tu Corazón", "Donación", "Dengue"];

const CustomScheduleInput = React.forwardRef(
  ({ value, onClick, icon, placeholder, isDate }, ref) => {
    let displayValue = value || placeholder;

    if (isDate && value) {
      const [dia, mes, anio] = value.split("/");
      const dateObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      if (!isNaN(dateObj) && isToday(dateObj)) {
        displayValue = "Hoy";
      }
    }

    return (
      <button className="schedule-custom-btn" onClick={onClick} ref={ref} type="button">
        <span className="schedule-icon">{icon}</span>
        <span className="schedule-text">{displayValue}</span>
        <svg
          className="schedule-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    );
  }
);

const CmsNoticiasView = ({
  newsList,
  onAddNewNews,
  onDeleteNews,
  onUpdateNews,
  onViewNews,
  loading,
  initialCreateModal = false,
  onModalOpened,
}) => {
  const [viewTab, setViewTab] = useState("PUBLICADO");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const [showModal, setShowModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [estado, setEstado] = useState("BORRADOR");
  const [fechaProgramada, setFechaProgramada] = useState(null);
  const [imagenesUrls, setImagenesUrls] = useState([]);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);

  const [noticiaAEliminar, setNoticiaAEliminar] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Estado para el Modal de Corrección (Noticias Rechazadas)
  const [correctionNews, setCorrectionNews] = useState(null);
  const correctionFileInputRef = useRef(null);

  const filteredNews = (newsList || []).filter((n) => {
    const estadoItem = n.estado
      ? n.estado.toUpperCase()
      : n.isDraft
      ? "BORRADOR"
      : "PUBLICADO";

    const matchEstado =
      viewTab === "PUBLICADO"
        ? estadoItem === "PUBLICADO" || estadoItem === "APROBADO"
        : estadoItem === viewTab;

    const matchCategoria =
      filtroCategoria === "Todas" || n.category === filtroCategoria;
    return matchEstado && matchCategoria;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCuerpoHtml("");
    setCategoria("General");
    setEstado("PUBLICADO");
    setFechaProgramada(null);
    setImagenesUrls([]);
    setArchivosSeleccionados([]);
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  React.useEffect(() => {
    if (initialCreateModal) {
      handleOpenCreate();
      if (onModalOpened) onModalOpened();
    }
  }, [initialCreateModal]);

  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setTitulo(news.title || "");

    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string" ? contenidoCrudo : String(contenidoCrudo)
    );

    setCategoria(news.category || "General");
    const rawEstado = news.estado
      ? news.estado.toUpperCase()
      : news.isDraft
      ? "BORRADOR"
      : "PUBLICADO";

    setEstado(
      rawEstado === "BORRADOR"
        ? "BORRADOR"
        : news.fechaPublicacion
        ? "PROGRAMADO"
        : "PUBLICADO"
    );
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
    setHasUnsavedChanges(false);
    setShowModal(true);

    if (news.fechaPublicacion) {
      setFechaProgramada(new Date(news.fechaPublicacion));
    } else {
      setFechaProgramada(null);
    }
  };

  // --- MANEJADORES MODAL CORREGIR CONTENIDO RECHAZADO ---
  const handleOpenCorrection = (news) => {
    setCorrectionNews(news);
    setTitulo(news.title || "");
    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string" ? contenidoCrudo : String(contenidoCrudo)
    );
    setCategoria(news.category || "General");
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
    setFechaProgramada(news.fechaPublicacion ? new Date(news.fechaPublicacion) : null);
  };

  const handleCloseCorrection = () => {
    if (saving) return;
    setCorrectionNews(null);
  };

  const handleCorrectionSubmit = async (targetEstado) => {
    if (!correctionNews || saving) return;

    const textoContenido =
      typeof cuerpoHtml === "string"
        ? cuerpoHtml
        : Array.isArray(cuerpoHtml)
        ? cuerpoHtml[0] || ""
        : String(cuerpoHtml || "");

    if (!titulo.trim() || !textoContenido.replace(/<[^>]+>/g, "").trim()) {
      toast.error("Por favor completa el título y el contenido.");
      return;
    }

    setSaving(true);
    try {
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      const token = keycloak.token;
      if (!token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      // Solo conservamos las URLs remotas existentes (no los blob: nuevos)
      const remoteUrls = imagenesUrls.filter((u) => !String(u).startsWith("blob:"));

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("contenido", textoContenido);
      formData.append("estado", targetEstado);
      formData.append("categoriaNombre", categoria);
      formData.append("imagenesExistentes", JSON.stringify(remoteUrls));

      if (fechaProgramada && targetEstado !== "BORRADOR") {
        formData.append("fechaPublicacion", fechaProgramada.toISOString());
      }

      archivosSeleccionados.forEach((file) => {
        formData.append("imagenes", file);
      });

      const data = await updateNoticia(correctionNews.id, formData, token);
      const estadoDevuelto = data.noticia?.estado || targetEstado;

      const noticiaFormateada = {
        id: data.noticia?.id || correctionNews.id,
        title: titulo,
        body: [textoContenido],
        date:
          data.noticia?.createdAt
            ? new Date(data.noticia.createdAt).toLocaleDateString("es-AR")
            : correctionNews.date,
        createdAt: data.noticia?.createdAt || correctionNews.createdAt,
        updatedAt: data.noticia?.updatedAt || new Date().toISOString(),
        category: categoria || "General",
        estado: estadoDevuelto,
        isDraft: estadoDevuelto === "BORRADOR",
        images: data.noticia?.images || imagenesUrls || [],
        editor: data.noticia?.editor || correctionNews.editor || "Editor CMS",
        editedBy: data.noticia?.editedBy || null,
        fechaPublicacion: data.noticia?.fechaPublicacion || null,
        rejectionReason: data.noticia?.rejectionReason || null,
      };

      if (onUpdateNews) onUpdateNews(noticiaFormateada);

      if (targetEstado === "BORRADOR") {
        toast.success("Cambios guardados como borrador.");
        setViewTab("BORRADOR");
      } else {
        toast.success("Noticia corregida y reenviada a aprobación del administrador.");
        setViewTab("PENDIENTE_APROBACION");
      }

      setCorrectionNews(null);
    } catch (error) {
      toast.error(
        `Error: ${
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          "Error al actualizar"
        }`
      );
    } finally {
      setSaving(false);
    }
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
    setNoticiaAEliminar(id);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!noticiaAEliminar) return;
    const id = noticiaAEliminar;
    setDeletingId(id);

    try {
      const token = keycloak.token;
      if (!token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const noticia =
        (filteredNews || []).find((n) => n.id === id) ||
        (newsList || []).find((n) => n.id === id);
      const tituloNoticia = noticia?.title || noticia?.titulo || "Noticia";

      await deleteNoticia(id, token);
      recordCmsActivity({
        titulo: `Eliminó noticia: "${tituloNoticia}"`,
        categoria: noticia?.category || "Noticias",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });
      onDeleteNews(id);
      toast.success("Noticia eliminada correctamente.");
      setShowDeleteModal(false);
      setNoticiaAEliminar(null);
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          "Ocurrió un error al intentar eliminar la noticia."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setHasUnsavedChanges(true);
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]);
      setArchivosSeleccionados((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setHasUnsavedChanges(true);
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setArchivosSeleccionados((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e, forcedEstado, bypassDraftWarning = false) => {
    if (e) e.preventDefault();

    const textoContenido =
      typeof cuerpoHtml === "string"
        ? cuerpoHtml
        : Array.isArray(cuerpoHtml)
        ? cuerpoHtml[0] || ""
        : String(cuerpoHtml || "");
    const estadoSolicitado = forcedEstado || estado;

    if (estadoSolicitado === "PROGRAMADO" && !fechaProgramada) {
      toast.error("Por favor, selecciona una fecha y hora para programar la publicación.");
      setShowUnsavedModal(false);
      return;
    }

    if (!titulo.trim() || !textoContenido.trim()) {
      toast.error("Por favor completa el título y el contenido.");
      setShowUnsavedModal(false);
      return;
    }

    if (estadoSolicitado === "BORRADOR" && !bypassDraftWarning) {
      setShowConfirmDraftModal(true);
      return;
    }

    setSaving(true);

    try {
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      const token = keycloak.token;
      if (!token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      // Toda publicación que no sea BORRADOR pasa a PENDIENTE_APROBACION hasta que el Admin la apruebe
      const estadoParaBackend =
        estadoSolicitado === "BORRADOR" ? "BORRADOR" : "PENDIENTE_APROBACION";

      const remoteUrls = imagenesUrls.filter((u) => !String(u).startsWith("blob:"));

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("contenido", textoContenido);
      formData.append("estado", estadoParaBackend);
      formData.append("categoriaNombre", categoria);
      formData.append("imagenesExistentes", JSON.stringify(remoteUrls));

      if (estadoSolicitado === "PROGRAMADO" && fechaProgramada) {
        formData.append("fechaPublicacion", fechaProgramada.toISOString());
      }

      archivosSeleccionados.forEach((file) => {
        formData.append("imagenes", file);
      });

      let data;

      if (editingId) {
        data = await updateNoticia(editingId, formData, token);
        toast.success(
          estadoParaBackend === "BORRADOR"
            ? "Borrador actualizado con éxito."
            : "Noticia enviada a revisión del administrador para su aprobación."
        );
      } else {
        data = await createNoticia(formData, token);
        toast.success(
          estadoParaBackend === "BORRADOR"
            ? "Borrador guardado con éxito."
            : "Noticia creada y enviada al administrador para su aprobación."
        );
      }

      const estadoGuardado = data.noticia?.estado || estadoParaBackend;

      const noticiaFormateada = {
        id: data.noticia?.id || editingId,
        title: titulo,
        body: [textoContenido],
        date: new Date().toLocaleDateString("es-AR"),
        createdAt: data.noticia?.createdAt || new Date().toISOString(),
        updatedAt: data.noticia?.updatedAt || new Date().toISOString(),
        category: categoria || "General",
        estado: estadoGuardado,
        isDraft: estadoGuardado === "BORRADOR",
        images: data.noticia?.images || imagenesUrls || [],
        editor: data.noticia?.editor || "Editor CMS",
        editedBy: data.noticia?.editedBy || null,
        fechaPublicacion: data.noticia?.fechaPublicacion || null,
        rejectionReason: data.noticia?.rejectionReason || null,
      };

      if (editingId) {
        if (onUpdateNews) onUpdateNews(noticiaFormateada);
      } else {
        if (onAddNewNews) onAddNewNews(noticiaFormateada);
      }

      setViewTab(estadoGuardado);
      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setShowConfirmDraftModal(false);
      setShowModal(false);
    } catch (error) {
      toast.error(
        `Error: ${
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          "Error al guardar"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">Listado de las noticias</h3>
          <p className="news-view-subtitle">
            Administre las publicaciones y artículos clasificados del portal.
          </p>
        </div>
        <button
          type="button"
          className="btn-crear-noticia-header"
          onClick={handleOpenCreate}
        >
          + CREAR NOTICIA
        </button>
      </div>

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
        <div className="news-tabs-group">
          <button
            type="button"
            className={`news-tab-item ${viewTab === "PUBLICADO" ? "active" : ""}`}
            onClick={() => setViewTab("PUBLICADO")}
          >
            Publicados
          </button>
          <button
            type="button"
            className={`news-tab-item ${viewTab === "BORRADOR" ? "active" : ""}`}
            onClick={() => setViewTab("BORRADOR")}
          >
            Borradores
          </button>
          <button
            type="button"
            className={`news-tab-item ${
              viewTab === "PENDIENTE_APROBACION" ? "active" : ""
            }`}
            onClick={() => setViewTab("PENDIENTE_APROBACION")}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`news-tab-item ${viewTab === "PROGRAMADO" ? "active" : ""}`}
            onClick={() => setViewTab("PROGRAMADO")}
          >
            Programados
          </button>
          <button
            type="button"
            className={`news-tab-item ${viewTab === "RECHAZADO" ? "active" : ""}`}
            onClick={() => setViewTab("RECHAZADO")}
          >
            Rechazados
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Filtrar por:
          </span>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontWeight: "600",
              color: "#0c2340",
              outline: "none",
            }}
          >
            <option value="Todas">Todas las clasificaciones</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cms-news-table-container">
        <div className="news-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-fecha">FECHA</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-categoria">CLASIFICACIÓN</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>
            ACCIONES
          </div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando listado de noticias...
              </span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay noticias registradas con estos filtros.
            </div>
          ) : (
            filteredNews.map((news) => {
              const estadoUpper = (
                news.estado || (news.isDraft ? "BORRADOR" : "PUBLICADO")
              ).toUpperCase();
              const isRejected = estadoUpper === "RECHAZADO";

              return (
                <div className="news-table-row" key={news.id}>
                  <div
                    className="col-content"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div className="news-thumb-box">
                      {news.images && news.images.length > 0 ? (
                        <img
                          src={news.images[0]}
                          alt="Miniatura"
                          className="news-thumb-img"
                        />
                      ) : (
                        <div className="news-thumb-mock">HIE</div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="news-title-interactive"
                        onClick={() => onViewNews && onViewNews(news)}
                        title="Ver comunicado completo"
                      >
                        <span className="activity-title news-title-clamped">
                          {news.title}
                        </span>
                        {news.editedBy && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            Editado por {news.editedBy}
                          </span>
                        )}
                      </div>

                      {isRejected && (
                        <div
                          className="news-rejection-warning-pill"
                          onClick={() => handleOpenCorrection(news)}
                          title="Haga clic para ver el motivo del rechazo y corregir la noticia"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <span>
                            {news.rejectionReason ||
                              "El administrador solicitó correcciones en esta noticia."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-fecha">
                    {news.date || "Ahora"}
                    {news.updatedAt &&
                      news.createdAt &&
                      new Date(news.updatedAt) - new Date(news.createdAt) > 5000 && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#64748b",
                            fontStyle: "italic",
                            display: "block",
                          }}
                        >
                          (Editado)
                        </span>
                      )}
                  </div>

                  <div className="col-editor">{news.editor || "Editor CMS"}</div>

                  <div className="col-categoria">
                    <span
                      style={{
                        backgroundColor:
                          news.category === "General" ? "#f1f5f9" : "#e0f2fe",
                        color: news.category === "General" ? "#475569" : "#0284c7",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {news.category || "General"}
                    </span>
                  </div>

                  <div className="col-estado">
                    <div className="status-wrapper">
                      {isRejected ? (
                        <span
                          className="status-badge rejected"
                          onClick={() => handleOpenCorrection(news)}
                          title="Haga clic para corregir la noticia"
                        >
                          • RECHAZADO
                        </span>
                      ) : (
                        <span
                          className={`status-badge ${
                            estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO"
                              ? "publicado"
                              : estadoUpper === "PROGRAMADO"
                              ? "programado"
                              : "pendiente"
                          }`}
                        >
                          {estadoUpper === "PENDIENTE_APROBACION"
                            ? "PENDIENTE"
                            : estadoUpper}
                        </span>
                      )}

                      {(estadoUpper === "PROGRAMADO" ||
                        estadoUpper === "PENDIENTE_APROBACION") &&
                        news.fechaPublicacion && (
                          <span className="status-programmed-date">
                            Para:{" "}
                            {new Date(news.fechaPublicacion).toLocaleDateString("es-AR")} -{" "}
                            {new Date(news.fechaPublicacion).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}{" "}
                            hs
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="news-actions-cell">
                    {isRejected ? (
                      <>
                        <button
                          type="button"
                          title="Ver vista previa"
                          onClick={() => onViewNews && onViewNews(news)}
                          className="news-action-btn-edit"
                          style={{ color: "#475569" }}
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Corregir contenido rechazado"
                          onClick={() => handleOpenCorrection(news)}
                          className="news-action-btn-edit"
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
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => handleOpenEdit(news)}
                        className="news-action-btn-edit"
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
                    )}

                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => handleConfirmDeleteClick(news.id)}
                      className="news-action-btn-delete"
                      disabled={deletingId === news.id}
                    >
                      {deletingId === news.id ? (
                        <div className="cms-spinner-red"></div>
                      ) : (
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
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================
          MODAL CORREGIR CONTENIDO (IGUAL A CONTENIDO GRÁFICO)
      ======================================================================== */}
      {correctionNews && (
        <div className="modal-overlay" onClick={handleCloseCorrection}>
          <div
            className="news-correction-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="news-correction-header">
              <div className="news-correction-title-group">
                <h2>Corregir Contenido</h2>
                <span className="news-status-pill-rejected">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Rechazado
                </span>
              </div>
              <button
                type="button"
                className="news-correction-close-btn"
                onClick={handleCloseCorrection}
                disabled={saving}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="news-correction-body">
              {/* Alerta Roja con el Motivo del Rechazo */}
              <div className="news-correction-alert">
                <div className="news-correction-alert-header">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="8" x2="12" y2="11"></line>
                    <line x1="12" y1="14" x2="12.01" y2="14"></line>
                  </svg>
                  <span>Motivo del rechazo:</span>
                </div>
                <p className="news-correction-alert-text">
                  {correctionNews.rejectionReason ||
                    "El administrador solicitó correcciones en esta noticia antes de su publicación."}
                </p>
              </div>

              {/* Caja de Imagen / Multimedia */}
              <div>
                <div className="news-correction-media-box">
                  {imagenesUrls && imagenesUrls.length > 0 ? (
                    <img
                      src={imagenesUrls[0]}
                      alt="Vista previa"
                      className="news-correction-preview-img"
                    />
                  ) : (
                    <div className="news-correction-preview-empty">Sin imagen</div>
                  )}

                  <div className="news-correction-media-info">
                    <span className="news-correction-filename">
                      {imagenesUrls && imagenesUrls.length > 0
                        ? imagenesUrls.length === 1
                          ? "recurso_hospital_evita.jpg"
                          : `${imagenesUrls.length} imágenes adjuntas`
                        : "Sin imágenes adjuntas"}
                    </span>
                    <span className="news-correction-formats">
                      Formatos permitidos: JPG, PNG o WEBP
                    </span>

                    <input
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      ref={correctionFileInputRef}
                      onChange={handleMultipleImagesUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="news-btn-change-image"
                      onClick={() => correctionFileInputRef.current?.click()}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      Cambiar imagen
                    </button>
                  </div>
                </div>

                {imagenesUrls && imagenesUrls.length > 0 && (
                  <div className="news-correction-thumbs-strip">
                    {imagenesUrls.map((url, idx) => (
                      <div key={idx} className="news-correction-thumb-item">
                        <img src={url} alt={`Miniatura ${idx + 1}`} />
                        <button
                          type="button"
                          className="news-correction-thumb-remove"
                          onClick={() => handleRemoveImage(idx)}
                          title="Quitar imagen"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campos del Formulario */}
              <div>
                <label className="news-form-label">TÍTULO DEL CONTENIDO</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="news-form-input"
                  placeholder="Título de la noticia"
                />
              </div>

              <div>
                <label className="news-form-label">CLASIFICACIÓN</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="news-form-input"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="news-form-label">CUERPO DE LA PUBLICACIÓN</label>
                <div className="custom-ckeditor-container">
                  <CKEditor
                    editor={ClassicEditor}
                    data={cuerpoHtml || ""}
                    config={{
                      licenseKey: "GPL",
                      plugins: [
                        Essentials,
                        Paragraph,
                        Heading,
                        Bold,
                        Italic,
                        Underline,
                        Link,
                        List,
                        BlockQuote,
                        Undo,
                        Alignment,
                      ],
                      toolbar: [
                        "heading",
                        "|",
                        "bold",
                        "italic",
                        "underline",
                        "link",
                        "bulletedList",
                        "numberedList",
                        "|",
                        "alignment:left",
                        "alignment:center",
                        "alignment:right",
                        "alignment:justify",
                        "|",
                        "blockQuote",
                        "|",
                        "undo",
                        "redo",
                      ],
                      alignment: { options: ["left", "center", "right", "justify"] },
                    }}
                    onChange={(event, editor) => {
                      setCuerpoHtml(editor.getData());
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="news-correction-footer">
              <button
                type="button"
                className="news-btn-cancel-text"
                onClick={handleCloseCorrection}
                disabled={saving}
              >
                Cancelar
              </button>

              <div className="news-correction-actions-right">
                <button
                  type="button"
                  className="news-btn-draft-outline"
                  onClick={() => handleCorrectionSubmit("BORRADOR")}
                  disabled={saving}
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  className="news-btn-resubmit-primary"
                  onClick={() => handleCorrectionSubmit("PENDIENTE_APROBACION")}
                  disabled={saving}
                >
                  {saving ? "Enviando..." : "Guardar y Reenviar"}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <CmsDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleExecuteDelete}
        itemType="la noticia"
        isDeleting={deletingId === noticiaAEliminar}
      />

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp news-modal-content news-modal-content-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar noticia" : "Crear noticia"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => handleSave(e)}
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              <div className="modal-split-layout">
                <div className="news-form-left">
                  <div>
                    <label className="news-form-label">
                      TÍTULO DE LA PUBLICACION{" "}
                      <span className="field-required-docs">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => {
                        setTitulo(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Ingrese el título..."
                      className="news-form-input"
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginTop: "15px",
                      marginBottom: "15px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label className="news-form-label">CLASIFICACIÓN</label>
                      <select
                        value={categoria}
                        onChange={(e) => {
                          setCategoria(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="news-form-input"
                      >
                        {CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="news-form-label">ESTADO</label>
                      <select
                        value={estado}
                        onChange={(e) => {
                          setEstado(e.target.value);
                          setHasUnsavedChanges(true);
                          if (e.target.value !== "PROGRAMADO") setFechaProgramada(null);
                        }}
                        className="news-form-input"
                      >
                        <option value="PUBLICADO">Publicar (Enviar a aprobación)</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="PROGRAMADO">Programado</option>
                      </select>
                    </div>
                  </div>

                  {estado === "PROGRAMADO" && (
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        className="news-form-label"
                        style={{ display: "block", marginBottom: "8px" }}
                      >
                        Publicar el:
                      </label>
                      <div className="schedule-picker-container">
                        <DatePicker
                          selected={fechaProgramada}
                          onChange={(date) => {
                            if (fechaProgramada && date) {
                              date.setHours(fechaProgramada.getHours());
                              date.setMinutes(fechaProgramada.getMinutes());
                            }
                            setFechaProgramada(date);
                            setHasUnsavedChanges(true);
                          }}
                          minDate={new Date()}
                          locale="es"
                          dateFormat="dd/MM/yyyy"
                          portalId="root-portal"
                          customInput={
                            <CustomScheduleInput
                              isDate={true}
                              placeholder="Elegir fecha"
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              }
                            />
                          }
                        />

                        <DatePicker
                          selected={fechaProgramada}
                          onChange={(date) => {
                            setFechaProgramada(date);
                            setHasUnsavedChanges(true);
                          }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={5}
                          timeCaption="Hora"
                          dateFormat="HH:mm"
                          portalId="root-portal"
                          customInput={
                            <CustomScheduleInput
                              placeholder="Elegir hora"
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              }
                            />
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="news-form-label">IMÁGENES ADJUNTAS</label>
                    <div className="custom-file-upload-zone">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        className="custom-file-input-hidden"
                      />
                      <div className="custom-file-upload-content">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: "#0ea5e9", marginBottom: "8px" }}
                        >
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        <span style={{ color: "#0284c7", fontWeight: "600" }}>
                          Haz clic para subir imágenes
                        </span>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "0.8rem",
                            marginTop: "4px",
                          }}
                        >
                          PNG, JPG, WEBP permitidos
                        </span>
                      </div>
                    </div>
                    {imagenesUrls.length > 0 && (
                      <div className="news-preview-gallery">
                        {imagenesUrls.map((url, idx) => (
                          <div key={idx} className="news-preview-item">
                            <img
                              src={url}
                              alt={`Preview ${idx}`}
                              className="news-preview-img"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="news-preview-remove-btn"
                              title="Eliminar imagen"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        color: "rgb(100 116 139)",
                        marginBottom: "8px",
                      }}
                    >
                      CUERPO DE LA PUBLICACIÓN{" "}
                      <span className="field-required-docs">*</span>
                    </label>
                    <div className="custom-ckeditor-container">
                      <CKEditor
                        editor={ClassicEditor}
                        data={cuerpoHtml || ""}
                        config={{
                          licenseKey: "GPL",
                          plugins: [
                            Essentials,
                            Paragraph,
                            Heading,
                            Bold,
                            Italic,
                            Underline,
                            Link,
                            List,
                            BlockQuote,
                            Undo,
                            Alignment,
                          ],
                          toolbar: [
                            "heading",
                            "|",
                            "bold",
                            "italic",
                            "underline",
                            "link",
                            "bulletedList",
                            "numberedList",
                            "|",
                            "alignment:left",
                            "alignment:center",
                            "alignment:right",
                            "alignment:justify",
                            "|",
                            "blockQuote",
                            "|",
                            "undo",
                            "redo",
                          ],
                          alignment: {
                            options: ["left", "center", "right", "justify"],
                          },
                        }}
                        onChange={(event, editor) => {
                          setCuerpoHtml(editor.getData());
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="news-form-right">
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "15px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#64748b",
                      }}
                    >
                      VISTA PREVIA DE LA PUBLICACIÓN
                    </span>
                    <span
                      style={{
                        backgroundColor:
                          categoria === "General" ? "#f1f5f9" : "#e0f2fe",
                        color: categoria === "General" ? "#475569" : "#0284c7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {categoria}
                    </span>
                  </div>
                  <div className="news-preview-paper" style={{ padding: 0 }}>
                    <div className="preview-mock-modal-body">
                      <div className="preview-mock-left">
                        <div className="preview-mock-author-row">
                          <div className="preview-avatar-mock">
                            <img src={avatarHospital} alt="Avatar Hospital" />
                          </div>
                          <div className="preview-mock-author-meta">
                            <h3>Hospital Interdistrital Evita Formosa</h3>
                            <span>{new Date().toLocaleDateString("es-AR")}</span>
                          </div>
                        </div>
                        <h3 className="preview-mock-title">
                          {titulo || "El título de la noticia aparecerá aquí..."}
                        </h3>
                        <div className="preview-mock-text ck-content">
                          {cuerpoHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: cuerpoHtml }} />
                          ) : (
                            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              El contenido comenzará a aparecer aquí a medida que
                              escribas.
                            </p>
                          )}
                        </div>
                      </div>
                      {imagenesUrls.length > 0 ? (
                        <div
                          className={`preview-mosaic-gallery layout-${
                            imagenesUrls.length >= 4 ? 4 : imagenesUrls.length
                          }`}
                        >
                          {imagenesUrls.slice(0, 4).map((img, index) => {
                            const isLastAndHidden =
                              index === 3 && imagenesUrls.length > 4;
                            const fotosRestantes = imagenesUrls.length - 4;
                            return (
                              <div key={index} className="preview-mosaic-item">
                                <img src={img} alt={`Preview foto ${index + 1}`} />
                                {isLastAndHidden && (
                                  <div className="preview-mosaic-overlay">
                                    <span>+{fotosRestantes}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="preview-mosaic-empty">
                          <svg
                            width="40"
                            height="40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ opacity: 0.4, marginBottom: "10px" }}
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          [Imágenes]
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="modal-footer-esp">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={handleCloseAttempt}
                  disabled={saving}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn-cerrar-rojo"
                  style={{ backgroundColor: "#2b5b94" }}
                  disabled={saving}
                >
                  {saving ? (
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

      {/* MODAL DE CONFIRMACIÓN: GUARDAR COMO BORRADOR */}
      <CmsConfirmDraftModal
        isOpen={showConfirmDraftModal}
        onClose={() => setShowConfirmDraftModal(false)}
        onConfirm={(e) => handleSave(e, "BORRADOR", true)}
        itemType="esta noticia"
        loading={saving}
      />

      {/* MODAL DE CAMBIOS SIN GUARDAR */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "BORRADOR", true)}
      />
    </div>
  );
};

export default CmsNoticiasView;
