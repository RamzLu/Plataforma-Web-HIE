import React, { useState } from "react";
import avatarHospital from "../../assets/logoHospitalEvita.png";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";
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
  SpecialCharacters,
  SpecialCharactersEssentials
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "../../styles/components/cms/CmsNoticiasView.css";

const CmsNoticiasView = ({
  newsList,
  onAddNewNews,
  onDeleteNews,
  onUpdateNews,
  onViewNews,
  loading,
}) => {
  // Lógica de Pestañas
  const [viewTab, setViewTab] = useState("PUBLICADO");

  // Estados de Modales
  const [showModal, setShowModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false); 
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados del Formulario
  const [editingId, setEditingId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("Noticias");
  const [estado, setEstado] = useState("BORRADOR");
  const [imagenesUrls, setImagenesUrls] = useState([]);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);

  // Estados de Eliminación
  const [noticiaAEliminar, setNoticiaAEliminar] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filtrar noticias según la pestaña activa
  const filteredNews = newsList.filter((n) => {
    const estadoItem = n.estado ? n.estado.toUpperCase() : (n.isDraft ? "BORRADOR" : "PUBLICADO");
    return estadoItem === viewTab;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCuerpoHtml("");
    setCategoria("Noticias");
    setEstado("BORRADOR");
    setImagenesUrls([]);
    setArchivosSeleccionados([]);
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setTitulo(news.title || "");

    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string"
        ? contenidoCrudo
        : String(contenidoCrudo)
    );

    setCategoria(news.category || "Noticias");
    setEstado(news.estado ? news.estado.toUpperCase() : (news.isDraft ? "BORRADOR" : "PUBLICADO"));
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
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
    setNoticiaAEliminar(id);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!noticiaAEliminar) return;

    const id = noticiaAEliminar;
    setDeletingId(id);

    try {
      const token = keycloak.token;
      const response = await fetch(
        `http://localhost:3000/api/cms/noticias/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar en el servidor");
      }

      onDeleteNews(id);
      toast.success("Noticia eliminada correctamente.");
      
      setShowDeleteModal(false);
      setNoticiaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Ocurrió un error al intentar eliminar la noticia.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setHasUnsavedChanges(true);
      const regexEspeciales = /[^a-zA-Z0-9.\-_]/;
      const tieneCaracteresEspeciaux = files.some((file) =>
        regexEspeciales.test(file.name)
      );

      if (tieneCaracteresEspeciaux) {
        toast(
          "Advertencia: Algunos archivos seleccionados contienen tildes, espacios o caracteres especiales en su nombre y pueden romperse.",
          {
            icon: (
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            ),
            style: { background: "#fff", color: "#b45309", border: "1px solid #f59e0b" },
          }
        );
      }

      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]);
      setArchivosSeleccionados((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setHasUnsavedChanges(true);
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setArchivosSeleccionados((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleSave = async (e, forcedEstado, bypassDraftWarning = false) => {
    if (e) e.preventDefault();

    const textoContenido =
      typeof cuerpoHtml === "string"
        ? cuerpoHtml
        : Array.isArray(cuerpoHtml)
          ? cuerpoHtml[0] || ""
          : String(cuerpoHtml || "");
          
    const estadoFinal = forcedEstado || estado;

    if (!titulo.trim() || !textoContenido.trim()) {
      toast.error("Por favor completa el título y el contenido.");
      setShowUnsavedModal(false);
      return;
    }

    if (estadoFinal === "BORRADOR" && !bypassDraftWarning) {
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
      formData.append("contenido", textoContenido);
      formData.append("estado", estadoFinal);
      formData.append("imagenesExistentes", JSON.stringify(imagenesUrls));

      archivosSeleccionados.forEach((file) => {
        formData.append("imagenes", file);
      });

      const url = editingId
        ? `http://localhost:3000/api/cms/noticias/${editingId}`
        : "http://localhost:3000/api/cms/noticias";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al guardar");

      const noticiaFormateada = {
        id: data.noticia?.id || editingId,
        title: titulo,
        body: [textoContenido],
        date: new Date().toLocaleDateString("es-AR"),
        category: categoria || "Noticias",
        estado: estadoFinal,
        isDraft: estadoFinal === "BORRADOR",
        images: data.noticia?.images || imagenesUrls || [],
        editor: data.noticia?.editor || "Editor CMS", 
        editedBy: data.noticia?.editedBy || null
      };

      if (editingId) {
        if (onUpdateNews) onUpdateNews(noticiaFormateada);
        toast.success("Noticia actualizada con éxito.");
      } else {
        if (onAddNewNews) onAddNewNews(noticiaFormateada);
        toast.success("Noticia creada con éxito.");
      }

      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setShowConfirmDraftModal(false); 
      setShowModal(false);
    } catch (error) {
      console.error("Error en handleSave:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de las noticias
          </h3>
          <p className="news-view-subtitle">
            Administre las publicaciones del portal.
          </p>
        </div>
        <button type="button" className="btn-crear-noticia-header" onClick={handleOpenCreate}>
          + CREAR NOTICIA
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setViewTab("PUBLICADO")}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: viewTab === "PUBLICADO" ? "#0c2340" : "#fff", color: viewTab === "PUBLICADO" ? "#fff" : "#334155", fontWeight: "600", cursor: "pointer" }}
        >
          Publicados
        </button>
        <button
          type="button"
          onClick={() => setViewTab("BORRADOR")}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: viewTab === "BORRADOR" ? "#0c2340" : "#fff", color: viewTab === "BORRADOR" ? "#fff" : "#334155", fontWeight: "600", cursor: "pointer" }}
        >
          Borradores
        </button>
      </div>

      <div className="cms-news-table-container">
        <div className="activity-table-head news-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-fecha">FECHA</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-categoria">CATEGORÍA</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>
            ACCIONES
          </div>
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
                Cargando listado de noticias...
              </span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
            >
              No hay noticias registradas en este apartado.
            </div>
          ) : (
            filteredNews.map((news) => (
              <div className="activity-row news-table-row" key={news.id}>
                <div
                  className="col-content"
                  style={{
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
                  <div 
                    className="news-title-interactive"
                    onClick={() => onViewNews && onViewNews(news)}
                    title="Ver comunicado completo"
                  >
                    <span className="activity-title news-title-clamped">
                      {news.title}
                    </span>
                    {news.editedBy && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                        Editado por {news.editedBy}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-fecha">
                  {news.date || "Ahora"}
                  {news.updatedAt &&
                    news.createdAt &&
                    new Date(news.updatedAt) - new Date(news.createdAt) >
                      5000 && (
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
                  {news.category || "Noticias"}
                </div>
                <div className="col-estado">
                  <span className={`status-badge ${news.estado?.toLowerCase() === "publicado" || (!news.isDraft && !news.estado) ? "publicado" : "pendiente"}`}>
                    {news.estado || (news.isDraft ? "Borrador" : "Publicado")}
                  </span>
                </div>
                <div className="news-actions-cell">
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
            ))
          )}
        </div>
      </div>

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

              <h2 className="delete-modal-title">Estás a punto de eliminar este elemento</h2>
              <div className="delete-modal-divider"></div>

              <p className="delete-modal-text">
                Esta acción es <strong>permanente</strong> y no se puede deshacer. Los datos se borrarán de inmediato.
              </p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingId === noticiaAEliminar}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn-cerrar-rojo" 
                onClick={handleExecuteDelete}
                disabled={deletingId === noticiaAEliminar}
              >
                {deletingId === noticiaAEliminar ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                    Eliminando...
                  </span>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDraftModal && (
        <div className="modal-overlay" style={{ zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 11, 32, 0.4)", backdropFilter: "blur(2px)" }}>
          <div 
            style={{ 
              width: "100%", maxWidth: "384px", margin: "16px", borderRadius: "12px", 
              overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid rgba(196, 198, 206, 0.3)",
              boxShadow: "0px 10px 30px rgba(13,34,63,0.08)", fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
              position: "relative", zIndex: 3001, display: "flex", flexDirection: "column"
            }}
          >
            <div style={{ padding: "24px 24px 16px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ margin: 0, color: "#000b20", fontSize: "20px", fontWeight: "600", lineHeight: "28px", fontFamily: "'Manrope', sans-serif" }}>
                Guardar como borrador
              </h2>
              <p style={{ color: "#44474d", margin: 0, fontSize: "16px", fontWeight: "400", lineHeight: "24px", fontFamily: "'Manrope', sans-serif" }}>
                El estado de esta noticia es Borrador. No será visible en el portal público hasta que la publiques. ¿Deseas continuar?
              </p>
            </div>
            
            <div style={{ padding: "16px 24px 24px 24px", backgroundColor: "#f7f9fb", display: "flex", flexDirection: "column", gap: "16px" }}>
              <button 
                type="button" 
                onClick={(e) => handleSave(e, "BORRADOR", true)}
                style={{ 
                  width: "100%", padding: "16px 24px", backgroundColor: "#000b20", color: "#ffffff", 
                  border: "none", borderRadius: "12px", fontWeight: "800", fontSize: "12px", 
                  textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#0d223f"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#000b20"}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
              >
                Sí, guardar borrador
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowConfirmDraftModal(false)}
                style={{ 
                  width: "100%", padding: "16px 24px", backgroundColor: "#d8e0ed", color: "#000b20", 
                  border: "none", borderRadius: "12px", fontWeight: "800", fontSize: "12px", 
                  textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#e0e3e5"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#d8e0ed"}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
              >
                Revisar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL: CAMBIOS SIN GUARDAR */}
      {showUnsavedModal && (
        <div className="modal-overlay" style={{ zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 11, 32, 0.4)", backdropFilter: "blur(2px)" }}>
          <div 
            style={{ 
              width: "100%", maxWidth: "384px", margin: "16px", borderRadius: "12px", 
              overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid rgba(196, 198, 206, 0.3)",
              boxShadow: "0px 10px 30px rgba(13,34,63,0.08)", fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
              position: "relative", zIndex: 3001, display: "flex", flexDirection: "column"
            }}
          >
            <div style={{ padding: "24px 24px 16px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ margin: 0, color: "#000b20", fontSize: "20px", fontWeight: "200", lineHeight: "28px", fontFamily: "'Manrope', sans-serif" }}>
                Hay cambios sin guardar
              </h2>
              <p style={{ color: "#44474d", margin: 0, fontSize: "16px", fontWeight: "400", lineHeight: "24px", fontFamily: "'Manrope', sans-serif" }}>
                ¿Qué deseas hacer con la noticia actual?
              </p>
            </div>
            
            <div style={{ padding: "16px 24px 24px 24px", backgroundColor: "#f7f9fb", display: "flex", flexDirection: "column", gap: "16px" }}>
              <button 
                type="button" 
                onClick={(e) => handleSave(e, "BORRADOR", true)}
                style={{ 
                  width: "100%", padding: "16px 24px", backgroundColor: "#000b20", color: "#ffffff", 
                  border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", 
                  textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#0d223f"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#000b20"}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
              >
                Guardar como borrador
              </button>
              
              <button 
                type="button" 
                onClick={handleForceClose}
                style={{ 
                  width: "100%", padding: "16px 24px", backgroundColor: "#ba1a1a", color: "#ffffff", 
                  border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", 
                  textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#4d0003"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#ba1a1a"}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
              >
                Descartar cambios
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowUnsavedModal(false)}
                style={{ 
                  width: "100%", padding: "16px 24px", backgroundColor: "#d8e0ed", color: "#000b20", 
                  border: "none", borderRadius: "5px", fontWeight: "800", fontSize: "12px", 
                  textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.08em", lineHeight: "16px",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#e0e3e5"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#d8e0ed"}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp news-modal-content news-modal-content-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar noticia" : "Crear noticia"}</h2>
              <p className="modal-subtitle-docs">Completá los datos del archivo para registrarlo en el sistema.</p>
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
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="news-form-left">
                  <div>
                    <label className="news-form-label">Título de la noticia</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => { setTitulo(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="Ingrese el título..."
                      className="news-form-input"
                      required
                    />
                  </div>

                  <div style={{ display: "flex", gap: "15px", marginTop: "15px", marginBottom: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <label className="news-form-label">Estado</label>
                      <select 
                        value={estado} 
                        onChange={(e) => { setEstado(e.target.value); setHasUnsavedChanges(true); }} 
                        className="news-form-input"
                      >
                        <option value="PUBLICADO">Publicado</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="ARCHIVADO">Archivado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="news-form-label">Imágenes adjuntas</label>
                    <div className="custom-file-upload-zone">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        className="custom-file-input-hidden"
                      />
                      <div className="custom-file-upload-content">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0ea5e9', marginBottom: '8px' }}>
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        <span style={{ color: '#0284c7', fontWeight: '600' }}>Haz clic para subir imágenes</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>PNG, JPG, WEBP permitidos</span>
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
                        fontWeight: "700",
                        color: "#0c2340",
                        marginBottom: "8px",
                      }}
                    >
                      Cuerpo de la noticia
                    </label>
                    <div
                      className="ckeditor-wrapper"
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <CKEditor
                        editor={ClassicEditor}
                        data={cuerpoHtml}
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
                            SpecialCharacters,
                            SpecialCharactersEssentials
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
                            "alignment",
                            "blockQuote",
                            "specialCharacters",
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

                {/* COLUMNA DERECHA: VISTA PREVIA */}
                <div className="news-form-right">
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Vista previa de la publicación</span>
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
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>El contenido de la noticia comenzará a aparecer aquí a medida que escribas en el editor.</p>
                          )}
                        </div>
                      </div>

                      {imagenesUrls.length > 0 ? (
                        <div className={`preview-mosaic-gallery layout-${imagenesUrls.length >= 4 ? 4 : imagenesUrls.length}`}>
                          {imagenesUrls.slice(0, 4).map((img, index) => {
                            const isLastAndHidden = index === 3 && imagenesUrls.length > 4;
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
                          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.4, marginBottom: '10px' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
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

              <div className="modal-footer-esp news-modal-footer">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={handleCloseAttempt}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-cerrar-rojo news-btn-submit"
                  disabled={saving}
                >
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

export default CmsNoticiasView;