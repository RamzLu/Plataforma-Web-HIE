import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
// Importamos la configuración de Keycloak para el token de seguridad
import keycloak from "../../config/keycloak";
// Importamos todo desde el paquete unificado
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
  Alignment // Plugin de alineación
} from "ckeditor5";
import "ckeditor5/ckeditor5.css"; // Estilos obligatorios del editor

const CmsNoticiasView = ({ newsList, onAddNewNews, onDeleteNews }) => {
  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("Noticias");
  const [imagenesUrls, setImagenesUrls] = useState([]); // Array para múltiples imágenes
  const [loading, setLoading] = useState(false); // <--- ¡AQUÍ ESTABA EL ERROR (Faltaba declarar esto)!

  // Manejo de carga de múltiples imágenes
  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]); // Acumula las imágenes seleccionadas
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim() || !cuerpoHtml.trim()) {
      alert("Por favor completa el título y el contenido de la noticia.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verificamos la seguridad con Keycloak
      const token = keycloak.token;
      if (!token) {
        alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
        keycloak.login();
        return;
      }

      // 2. Enviamos los datos REALES a tu servidor Node.js
      const response = await fetch('http://localhost:3000/api/cms/noticias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          titulo: titulo,
          contenido: cuerpoHtml
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar en el servidor");
      }

      // 3. Si Supabase lo guardó con éxito, actualizamos tu diseño visual
      const nuevaNoticia = {
        id: data.noticia?.id || Date.now(),
        title: titulo,
        body: [cuerpoHtml], 
        date: new Date().toLocaleDateString("es-AR"), // Fecha actual formato DD/MM/AAAA
        category: categoria || "Noticias",
        isDraft: false,
        images: imagenesUrls || [],
      };

      onAddNewNews(nuevaNoticia);
      
      // 4. Limpiamos el formulario
      setTitulo("");
      setCuerpoHtml("");
      if (typeof setImagenesUrls === "function") setImagenesUrls([]);
      setShowModal(false);
      alert("¡Noticia creada y publicada con éxito en Supabase!");

    } catch (error) {
      console.error("❌ Error al comunicarse con el backend:", error);
      alert(`No se pudo guardar la noticia: ${error.message}`);
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
        <button className="btn-crear-noticia-header" onClick={() => setShowModal(true)}>
          + CREAR NOTICIA
        </button>
      </div>

      {/* Tabla de Noticias */}
      <div className="doc-table-container">
        <div className="activity-table-head" style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}>
          <div className="col-content">CONTENIDO</div>
          <div className="col-fecha">FECHA</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-categoria">CATEGORÍA</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {newsList.map((news) => (
            <div className="activity-row" key={news.id} style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr" }}>
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
                  {news.images && news.images.length > 1 && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "2px" }}>
                      +{news.images.length - 1} imágenes más
                    </span>
                  )}
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
                <button title="Eliminar" onClick={() => onDeleteNews(news.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e11d48" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CREAR NOTICIA CON CKEDITOR Y MULTIPLES IMÁGENES */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-esp" style={{ maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp">
              <h2>Crear noticia</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body-esp" style={{ gap: "20px" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Edite y publique contenido institucional con formato y galería múltiple.</p>

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
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Imágenes adjuntas (Seleccione una o varias)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleMultipleImagesUpload} 
                  style={{ marginBottom: "12px" }} 
                />

                {/* Galería de vistas previas */}
                {imagenesUrls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    {imagenesUrls.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "70px", height: "70px" }}>
                        <img src={url} alt={`Preview ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", border: "1px solid #94a3b8" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                <label style={{ display: "block", fontWeight: "700", color: "#0c2340", marginBottom: "8px" }}>Cuerpo de la noticia</label>
                <div className="ckeditor-wrapper" style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                  <CKEditor
                    editor={ClassicEditor}
                    data={cuerpoHtml}
                    config={{
                      licenseKey: 'GPL', 
                      plugins: [
                        Essentials, Paragraph, Heading, Bold, Italic, 
                        Link, List, BlockQuote, Undo, Alignment
                      ],
                      toolbar: [
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'link',
                        'bulletedList',
                        'numberedList',
                        'alignment',
                        'blockQuote',
                        '|',
                        'undo',
                        'redo'
                      ],
                      alignment: {
                        options: ['left', 'center', 'right', 'justify']
                      },
                      link: {
                        addTargetToExternalLinks: true,
                        defaultProtocol: 'https://'
                      }
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setCuerpoHtml(data);
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer-esp" style={{ padding: 0, background: "transparent", border: "none", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                <button type="button" className="btn-cancelar-gris" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn-cerrar-rojo" style={{ backgroundColor: "#0c2340" }} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
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