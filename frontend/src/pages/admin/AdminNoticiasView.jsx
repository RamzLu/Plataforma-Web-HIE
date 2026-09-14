import React, { useState } from 'react';
import { Search, Edit3, Trash2, CheckCircle, XCircle, Image as ImageIcon, ArrowLeft, Archive, CalendarClock, Save } from 'lucide-react';
import '../../styles/pages/admin/AdminNoticiasView.css';

const initialNews = [
  { id: 1, title: 'Inauguración de la nueva sala de pediatría', category: 'Institucional', author: 'Editor CMS', date: '14/09/2026', status: 'Publicado', content: 'Detalle de la inauguración de la sala de pediatría...' },
  { id: 2, title: 'Campaña de Vacunación Antigripal 2026', category: 'Prevención', author: 'Editor CMS', date: '12/09/2026', status: 'Pendiente', content: 'Inicia la campaña de vacunación para grupos de riesgo.' },
  { id: 3, title: 'Nuevos horarios de atención en consultorios', category: 'Guía y orientación', author: 'Editor CMS', date: '10/09/2026', status: 'Borrador', content: 'Los horarios se actualizarán a partir del próximo mes.' },
];

const AdminNoticiasView = () => {
  const [news, setNews] = useState(initialNews);
  const [view, setView] = useState('list'); 
  const [currentNews, setCurrentNews] = useState(null);

  // ==============================
  // NAVEGACIÓN Y APERTURA DE EDITOR ADMIN
  // ==============================
  const handleOpenReview = (noticia) => {
    setCurrentNews(noticia);
    setView('editor');
  };

  const handleClose = () => {
    setCurrentNews(null);
    setView('list');
  };

  // ==============================
  // ACCIONES EXCLUSIVAS DEL ADMINISTRADOR
  // ==============================
  
  const handleSaveChanges = () => {
    alert("RF-011: Cambios en el texto o archivos adjuntos guardados correctamente.");
    handleClose();
  };

  const handlePublish = () => {
    alert("RF-016 / RF-019: ¡Noticia aprobada y publicada oficialmente en el portal Red Evita Formosa!");
    handleClose();
  };

  const handleProgram = () => {
    alert("RF-012: Noticia programada. Se publicará automáticamente en la fecha seleccionada.");
    handleClose();
  };

  const handleReject = () => {
    const motivo = window.prompt("RF-017: Indica el motivo del rechazo para notificar al CMS:");
    if (motivo) {
      alert("Noticia rechazada. Se notificó al editor con el motivo.");
      handleClose();
    }
  };

  const handleArchive = (id) => {
    if (window.confirm("RF-020: ¿Seguro que deseas archivar/desactivar esta noticia? Dejará de ser pública.")) {
      alert(`Noticia ${id} archivada correctamente.`);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar definitivamente este registro del sistema?")) {
      alert(`Noticia ${id} eliminada.`);
    }
  };

  const getStatusClass = (status) => {
    const s = status.toLowerCase();
    if (s === 'borrador') return 'status-borrador';
    if (s === 'pendiente') return 'status-pendiente';
    if (s === 'publicado') return 'status-publicado';
    if (s === 'programado') return 'status-programado';
    if (s === 'rechazado') return 'status-rechazado';
    return 'status-archivado';
  };

  // ==============================
  // RENDER: LISTADO ADMINISTRADOR
  // ==============================
  if (view === 'list') {
    return (
      <div className="admin-noticias-container">
        
        <div className="noticias-header-row">
          <div className="noticias-search">
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Buscar noticia por título..." />
          </div>
        </div>

        <div className="noticias-list-container">
          <div className="noticias-grid-header">
            <div className="noticias-header-col">Título y Detalles</div>
            <div className="noticias-header-col">Autor (CMS)</div>
            <div className="noticias-header-col">Fecha</div>
            <div className="noticias-header-col">Estado</div>
            <div className="noticias-header-col" style={{ textAlign: 'right' }}>Acciones</div>
          </div>

          {news.map((item) => (
            <div className="noticias-row" key={item.id}>
              <div>
                <div className="noticia-titulo">{item.title}</div>
                <div className="noticia-meta">Categoría: {item.category}</div>
              </div>
              <div className="noticia-text">{item.author}</div>
              <div className="noticia-text">{item.date}</div>
              <div>
                <span className={`status-pill ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              
              <div className="noticias-acciones">
                {/* RF-015: Revisión de Pendientes y Edición Total */}
                <button className={`btn-icon-pill ${item.status === 'Pendiente' ? 'review' : ''}`} title="Revisar Solicitud / Modificar" onClick={() => handleOpenReview(item)}>
                  {item.status === 'Pendiente' ? <><CheckCircle size={16} /> Revisar</> : <Edit3 size={16} />}
                </button>
                
                {/* RF-020: Archivar/Desactivar */}
                {(item.status === 'Publicado' || item.status === 'Programado') && (
                  <button className="btn-icon-pill" title="Archivar/Desactivar" onClick={() => handleArchive(item.id)}>
                    <Archive size={16} />
                  </button>
                )}

                <button className="btn-icon-pill" title="Eliminar Definitivamente" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==============================
  // RENDER: EDITOR / REVISOR ADMIN
  // ==============================
  return (
    <div className="admin-noticias-container">
      <div className="editor-container">
        <div className="editor-header">
          <h2>Revisión y Administración de Noticia</h2>
          <button className="btn-pill outline" onClick={handleClose}>
            <ArrowLeft size={18} /> Volver
          </button>
        </div>

        {/* RF-012: Edición del estado por parte del Administrador */}
        <div className="form-group" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <label className="form-label" style={{ color: '#0f172a' }}>Gestión de Estado de Publicación</label>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <select className="form-select" defaultValue={currentNews?.status || "Borrador"}>
              <option value="Borrador">Borrador</option>
              <option value="Pendiente">Pendiente de Aprobación</option>
              <option value="Publicado">Publicado</option>
              <option value="Programado">Programado</option>
              <option value="Archivado">Archivado</option>
            </select>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
            Puedes forzar un estado desde aquí, o usar los botones de acción rápida al final del formulario.
          </p>
        </div>

        {/* RF-011: Administrador puede editar el título que hizo el CMS */}
        <div className="form-group">
          <label className="form-label">Título de la noticia (Editable por Admin)</label>
          <input type="text" className="form-input" defaultValue={currentNews?.title} />
        </div>

        {/* RF-011: Administrador puede editar el cuerpo que hizo el CMS */}
        <div className="form-group">
          <label className="form-label">Cuerpo de la noticia (Editable por Admin)</label>
          <textarea className="form-textarea" defaultValue={currentNews?.content}></textarea>
        </div>

        {/* RF-013: Adjuntar archivos a una noticia por parte del Administrador */}
        <div className="form-group">
          <label className="form-label">Adjuntar Imágenes / Documentos Adicionales</label>
          <div className="image-dropzone">
            <ImageIcon size={32} style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontWeight: '600', margin: '0 0 5px 0' }}>Arrastra tu imagen o documento aquí (RF-013)</p>
            <span style={{ fontSize: '0.85rem' }}>Formatos: JPG, PNG, WEBP, PDF</span>
          </div>
        </div>

        {/* BOTONES DE DECISIÓN DEL ADMINISTRADOR */}
        <div className="editor-actions">
          <button className="btn-pill outline" onClick={handleSaveChanges}>
            <Save size={18} /> Guardar Cambios 
          </button>
          
          <button className="btn-pill danger" onClick={handleReject}>
            <XCircle size={18} /> Rechazar Solicitud
          </button>

          <button className="btn-pill warning" onClick={handleProgram}>
            <CalendarClock size={18} /> Programar
          </button>
          
          <button className="btn-pill success" onClick={handlePublish}>
            <CheckCircle size={18} /> Publicar Inmediatamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNoticiasView;