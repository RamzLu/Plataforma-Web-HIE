import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CmsNoticiasView = ({ newsList, onAddNewNews, onDeleteNews }) => {
  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("Noticias");
  const [imagenUrl, setImagenUrl] = useState("");

  // Manejo de carga de imagen de portada de la noticia
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagenUrl(imageUrl);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !cuerpoHtml.trim()) {
      alert("Por favor completa el título y el contenido de la noticia.");
      return;
    }

    const nuevaNoticia = {
      id: Date.now(),
      title: titulo,
      // Guardamos el HTML enriquecido generado por CKEditor 5
      body: [cuerpoHtml],
      date: "Ahora",
      category: categoria,
      isDraft: false,
      images: imagenUrl ? [imagenUrl] : [],
    };

    onAddNewNews(nuevaNoticia);
    setTitulo("");
    setCuerpoHtml("");
    setImagenUrl("");
    setShowModal(false);
  };

  return (
    <div className="cms-dashboard-card">
      <div
        className="cms-news-header-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 className="cms-card-title" style={{ margin: 0 }}>
            Listado de las noticias
          </h3>
          <p
            style={{
              color: "#475569",
              fontSize: "0.9rem",
              margin: "5px 0 0 0",
            }}
          >
            Administre las publicaciones del portal.
          </p>
        </div>
        <button
          className="btn-crear-noticia-header"
          onClick={() => setShowModal(true)}
        >
          + CREAR NOTICIA
        </button>
      </div>

      {/* Tabla de Noticias */}
      <div className="doc-table-container">
        <div
          className="activity-table-head"
          style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}
        >
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
          {newsList.map((news) => (
            <div
              className="activity-row"
              key={news.id}
              style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}
            >
              <div
                className="col-content"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {news.images && news.images.length > 0 ? (
                    <img
                      src={news.images[0]}
                      alt="Miniatura"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        background: "#e2e8f0",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                      }}
                    >
                      HIE
                    </div>
                  )}
                </div>
                <div>
                  <span className="activity-title">{news.title}</span>
                </div>
              </div>
              <div className="col-fecha">{news.date || "Ahora"}</div>
              <div className="col-editor">Tú</div>
              <div className="col-categoria">{news.category || "Noticias"}</div>
              <div className="col-estado">
                <span
                  className={`status-badge ${news.isDraft ? "pendiente" : "publicado"}`}
                >
                  {news.isDraft ? "Pendiente" : "Publicado"}
                </span>
              </div>
              <div
                className="col-acciones"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <button
                  title="Eliminar"
                  onClick={() => onDeleteNews(news.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#e11d48",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CREAR NOTICIA CON CKEDITOR 5 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content-esp"
            style={{ maxWidth: "800px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              <h2>Crear noticia</h2>
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
              className="modal-body-esp"
              style={{ gap: "20px" }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Edite y programe una publicación con formato enriquecido.
              </p>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "700",
                    color: "#0c2340",
                    marginBottom: "8px",
                  }}
                >
                  Título de la noticia
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ingrese el título..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "1rem",
                  }}
                  required
                />
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
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "1rem",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="Noticias">Noticias</option>
                  <option value="Articulos">Artículos</option>
                  <option value="Capacitación">Capacitación</option>
                  <option value="Institucional">Institucional</option>
                </select>
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
                  Imagen de portada
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ marginBottom: "10px" }}
                />
                {imagenUrl && (
                  <div>
                    <img
                      src={imagenUrl}
                      alt="Preview"
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
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
                {/* Editor CKEditor 5 con Negrita, Cursiva, Listas de viñetas y numéricas */}
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
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setCuerpoHtml(data);
                    }}
                  />
                </div>
              </div>

              <div
                className="modal-footer-esp"
                style={{
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  justifyContent: "flex-end",
                  gap: "15px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-cerrar-rojo"
                  style={{ backgroundColor: "#0c2340" }}
                >
                  Guardar
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
