import React, { useState } from "react";
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
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("Noticias");
  const [imagenesUrls, setImagenesUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noticiaAEliminar, setNoticiaAEliminar] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCuerpoHtml("");
    setCategoria("Noticias");
    setImagenesUrls([]);
    setArchivosSeleccionados([]);
    setShowModal(true);
  };

  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setTitulo(news.title || "");

    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string"
        ? contenidoCrudo
        : String(contenidoCrudo),
    );

    setCategoria(news.category || "Noticias");
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
    setShowModal(true);
  };

  const handleConfirmDeleteClick = (id) => {
    setNoticiaAEliminar(id);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!noticiaAEliminar) return;

    const id = noticiaAEliminar;
    setShowDeleteModal(false);
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
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar en el servidor");
      }

      onDeleteNews(id);
      toast.success("Noticia eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Ocurrió un error al intentar eliminar la noticia.");
    } finally {
      setDeletingId(null);
      setNoticiaAEliminar(null);
    }
  };

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const regexEspeciales = /[^a-zA-Z0-9.\-_]/;
      const tieneCaracteresEspeciaux = files.some((file) =>
        regexEspeciales.test(file.name),
      );

      if (tieneCaracteresEspeciaux) {
        toast(
          "Advertencia: Algunos archivos seleccionados contienen tildes, espacios o caracteres especiales en su nombre y pueden romperse.",
          {
            icon: (
              <svg
                width="150"
                height="150"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            ),
            style: {
              background: "#fff",
              color: "#b45309",
              border: "1px solid #f59e0b",
            },
          },
        );
      }

      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]);
      setArchivosSeleccionados((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setArchivosSeleccionados((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const textoContenido =
      typeof cuerpoHtml === "string"
        ? cuerpoHtml
        : Array.isArray(cuerpoHtml)
          ? cuerpoHtml[0] || ""
          : String(cuerpoHtml || "");

    if (!titulo.trim() || !textoContenido.trim()) {
      toast.error("Por favor completa el título y el contenido.");
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
        isDraft: false,
        images: data.noticia?.images || imagenesUrls || [],
        editor: data.noticia?.editor || "Editor CMS", 
        editedBy: data.noticia?.editedBy || null
      };

      if (editingId) {
        if (onUpdateNews) onUpdateNews(noticiaFormateada);
        toast.success("Noticia actualizada con éxito.");
      } else {
        onAddNewNews(noticiaFormateada);
        toast.success("Noticia creada con éxito.");
      }

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
        <button className="btn-crear-noticia-header" onClick={handleOpenCreate}>
          + CREAR NOTICIA
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
          ) : newsList.length === 0 ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
            >
              No hay noticias registradas.
            </div>
          ) : (
            newsList.map((news) => (
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
                  <span
                    className={`status-badge ${news.isDraft ? "pendiente" : "publicado"}`}
                  >
                    {news.isDraft ? "Pendiente" : "Publicado"}
                  </span>
                </div>
                <div className="news-actions-cell">
                  <button
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
            className="modal-content-esp logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>ELIMINAR NOTICIA</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowDeleteModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="modal-body-esp text-center">
              <p className="info-text">
                ¿Estás seguro de que quieres eliminar esta noticia? Esta acción
                no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer-esp logout-footer">
              <button
                className="btn-cancelar-gris"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-cerrar-rojo" onClick={handleExecuteDelete}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content-esp news-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar noticia" : "Crear noticia"}</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="modal-body-form news-form-container"
            >
              <div className="form-grid-row">
                <div>
                  <label className="news-form-label">Título de la noticia</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ingrese el título..."
                    className="news-form-input"
                    required
                  />
                </div>

                <div>
                  <label className="news-form-label">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="news-form-select"
                  >
                    <option value="Noticias">Noticias</option>
                    <option value="Articulos">Artículos</option>
                    <option value="Capacitación">Capacitación</option>
                    <option value="Institucional">Institucional</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="news-form-label">Imágenes adjuntas</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                  multiple
                  onChange={handleMultipleImagesUpload}
                  className="news-file-input"
                />

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
                        SpecialCharactersEssentials // Solo dejamos estos dos
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
                    onChange={(event, editor) =>
                      setCuerpoHtml(editor.getData())
                    }
                  />
                </div>
              </div>

              <div className="modal-footer-esp news-modal-footer">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-cerrar-rojo news-btn-submit"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Actualizar"
                      : "Guardar"}
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
