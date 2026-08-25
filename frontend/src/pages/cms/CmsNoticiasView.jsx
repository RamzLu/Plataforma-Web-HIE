import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import keycloak from "../../config/keycloak";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Link,
  List,
  BlockQuote,
  Undo,
  Alignment
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const CmsNoticiasView = ({ newsList, onAddNewNews, onDeleteNews, onUpdateNews }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("Noticias");
  const [imagenesUrls, setImagenesUrls] = useState([]); 
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitulo("");
    setCuerpoHtml("");
    setCategoria("Noticias");
    setImagenesUrls([]);
    setShowModal(true);
  };

  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setTitulo(news.title || "");
    setCuerpoHtml(news.body?.[0] || "");
    setCategoria(news.category || "Noticias");
    setImagenesUrls(news.images || []);
    setShowModal(true);
  };

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]);
    }
  };

const handleRemoveImage = (indexToRemove) => {
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

const handleSave = async (e) => {
    e.preventDefault();
    
    // Blindamos la conversión a string por si viene en formato de arreglo u otro tipo
    const textoContenido = typeof cuerpoHtml === 'string' 
      ? cuerpoHtml 
      : (Array.isArray(cuerpoHtml) ? cuerpoHtml[0] || "" : String(cuerpoHtml || ""));

    if (!titulo.trim() || !textoContenido.trim()) {
      alert("Por favor completa el título y el contenido de la noticia.");
      return;
    }

    setLoading(true);

    try {
      const token = keycloak.token;
      if (!token) {
        alert("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('contenido', textoContenido);

      formData.append('imagenesExistentes', JSON.stringify(imagenesUrls));

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('imagenes', fileInput.files[i]);
        }
      }

      const url = editingId 
        ? `http://localhost:3000/api/cms/noticias/${editingId}`
        : 'http://localhost:3000/api/cms/noticias';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
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
      };

      if (editingId) {
        if (onUpdateNews) onUpdateNews(noticiaFormateada);
        alert("¡Noticia actualizada con éxito!");
      } else {
        onAddNewNews(noticiaFormateada);
        alert("¡Noticia creada con éxito!");
      }

      setShowModal(false);
    } catch (error) {
      console.error("Error en handleSave:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-dashboard-card">
      <div className="cms-news-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h3 className="cms-card-title" style={{ margin: 0 }}>Listado de las noticias</h3>
          <p style={{ color: "#475569", fontSize: "0.9rem", margin: "5px 0 0 0" }}>Administre las publicaciones del portal.</p>
        </div>
        <button className="btn-crear-noticia-header" onClick={handleOpenCreate}>
          + CREAR NOTICIA
        </button>
      </div>

      <div className="doc-table-container">
        <div className="activity-table-head" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1.2fr" }}>
          <div className="col-content">CONTENIDO</div>
          <div className="col-fecha">FECHA</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-categoria">CATEGORÍA</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {newsList.map((news) => (
            <div className="activity-row" key={news.id} style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1.2fr" }}>
              <div className="col-content" style={{ flexDirection: "row", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid #cbd5e1" }}>
                  {news.images && news.images.length > 0 ? (
                    <img src={news.images[0]} alt="Miniatura" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ background: "#e2e8f0", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold", color: "#94a3b8" }}>HIE</div>
                  )}
                </div>
                <div>
                  <span className="activity-title" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {news.title}
                  </span>
                </div>
              </div>
              <div className="col-fecha">{news.date || "Ahora"}</div>
              <div className="col-editor">Tú</div>
              <div className="col-categoria">{news.category || "Noticias"}</div>
              <div className="col-estado">
                <span className={`status-badge ${news.isDraft ? "pendiente" : "publicado"}`}>
                  {news.isDraft ? "Pendiente" : "Publicado"}
                </span>
              </div>
              <div className="col-acciones" style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button title="Editar" onClick={() => handleOpenEdit(news)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0284c7", fontSize: "1.1rem" }}>✏️</button>

                <button title="Eliminar" onClick={() => onDeleteNews(news.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e11d48", fontSize: "1.1rem" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp" style={{ maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar noticia" : "Crear noticia"}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body-esp" style={{ gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Título de la noticia</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ingrese el título..."
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", backgroundColor: "#fff" }}
                >
                  <option value="Noticias">Noticias</option>
                  <option value="Articulos">Artículos</option>
                  <option value="Capacitación">Capacitación</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Imágenes adjuntas</label>
                <input type="file" accept="image/*" multiple onChange={handleMultipleImagesUpload} style={{ marginBottom: "12px" }} />

                {imagenesUrls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    {imagenesUrls.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "70px", height: "70px" }}>
                        <img src={url} alt={`Preview ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid #94a3b8" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Cuerpo de la noticia</label>
                <div className="ckeditor-wrapper" style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                  <CKEditor
                    editor={ClassicEditor}
                    data={cuerpoHtml}
                    config={{
                      licenseKey: 'GPL', 
                      plugins: [Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo, Alignment],
                      toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'alignment', 'blockQuote', '|', 'undo', 'redo'],
                      alignment: { options: ['left', 'center', 'right', 'justify'] }
                    }}
                    onChange={(event, editor) => setCuerpoHtml(editor.getData())}
                  />
                </div>
              </div>

              <div className="modal-footer-esp" style={{ padding: 0, background: "transparent", border: "none", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                <button type="button" className="btn-cancelar-gris" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancelar
                </button>
<button type="submit" className="btn-cerrar-rojo" style={{ backgroundColor: "#0c2340" }} disabled={loading}>
  {loading ? "Guardando..." : (editingId ? "Actualizar" : "Guardar")}
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