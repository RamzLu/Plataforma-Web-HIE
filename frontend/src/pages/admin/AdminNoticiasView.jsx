import React, { useState } from 'react';
import { Eye, X, CheckCircle, XCircle, CalendarClock, AlertTriangle } from 'lucide-react';
// IMPORTANTE: Verifica la ruta de tu logo
import avatarHospital from "../../assets/logoHospitalEvita.png"
import '../../styles/pages/admin/AdminNoticiasView.css';

const mockPayloadNoticias = [
  { 
    id: 1, 
    title: 'Nueva sala de oncología habilitada', 
    date: '16/09/2026', 
    editor: 'Ana López', 
    category: 'Noticias', 
    status: 'Pendiente de aprobación',
    content: '<p>Médicos Neumonólogos y Técnicos en Endoscopía del Hospital Interdistrital Evita participaron del Curso Teórico-Práctico...<br/><br/>🙌 Esta importante instancia de capacitación y actualización profesional permitió a nuestros equipos continuar fortaleciendo sus conocimientos.</p>',
    scheduledDate: null,
    images: ['https://via.placeholder.com/800x600/f1f5f9/94a3b8?text=Oncologia+1', 'https://via.placeholder.com/800x600/f8fafc/64748b?text=Oncologia+2'] 
  },
  { 
    id: 2, 
    title: 'Campaña de Prevención del Dengue: Medidas precautorias', 
    date: '15/09/2026', 
    editor: 'Carlos Ruiz', 
    category: 'Noticias', 
    status: 'Pendiente de aprobación',
    content: '<p>Ante la llegada de las primeras lluvias de la temporada, el Ministerio recuerda las principales medidas preventivas...</p>',
    scheduledDate: '20/09/2026 08:00 AM',
    images: ['https://via.placeholder.com/800x600/e2e8f0/475569?text=Dengue+Prevencion']
  },
  { 
    id: 3, 
    title: 'Actualización de turnos web para consultorios externos, este es un título extremadamente largo para comprobar que la fila no se desborde', 
    date: '14/09/2026', 
    editor: 'Ana López', 
    category: 'Noticias', 
    status: 'Aprobado',
    content: '<p>A partir del próximo mes, los turnos para todas las especialidades médicas podrán solicitarse a través del nuevo portal web...</p>',
    scheduledDate: null,
    images: []
  }
];

const AdminNoticiasView = () => {
  const [noticias, setNoticias] = useState(mockPayloadNoticias);
  const [selectedNews, setSelectedNews] = useState(null);
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleOpenModal = (noticia) => {
    setSelectedNews(noticia);
    setIsRejecting(false); 
    setRejectReason("");
  };

  const handleCloseModal = () => {
    setSelectedNews(null);
    setIsRejecting(false);
  };

  const handleApprove = () => {
    alert(`Noticia "${selectedNews.title}" APROBADA exitosamente.`);
    handleCloseModal();
  };

  const handleTriggerReject = () => {
    setIsRejecting(true); 
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Debes ingresar obligatoriamente un motivo para enviar la corrección al Editor CMS.");
      return;
    }
    alert(`Noticia RECHAZADA. Motivo enviado: "${rejectReason}"`);
    handleCloseModal();
  };

  const getBadgeClass = (status) => {
    if (status === 'Aprobado') return 'status-aprobado-admin';
    if (status === 'Rechazado') return 'status-rechazado-admin';
    return 'status-pendiente-admin';
  };

  const getLayoutClass = (numImages) => {
    if (numImages >= 4) return "layout-4-admin";
    if (numImages === 3) return "layout-3-admin";
    if (numImages === 2) return "layout-2-admin";
    return "layout-1-admin";
  };

  return (
    <div className="admin-review-container-admin">
      
      <div className="admin-page-header-admin">
        <span className="admin-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Revisión Editorial</h1>
        <p>Evalúa las solicitudes de publicación enviadas por el equipo de redactores del CMS.</p>
      </div>

      <div className="dashboard-card-admin">
        <h2 className="dashboard-card-title-admin">Listado de las Noticias</h2>
       <p className="news-view-subtitle-admin">Área de Revisión: Aprobación y rechazo de notificaciones recibidas desde el CMS</p> <br />
        
        <div className="data-table-container-admin">
          <div className="data-table-header-admin">
            <div className="data-table-col-admin">CONTENIDO</div>
            <div className="data-table-col-admin">FECHA</div>
            <div className="data-table-col-admin">EDITOR</div>
            <div className="data-table-col-admin">CATEGORÍA</div>
            <div className="data-table-col-admin">ESTADO</div>
            <div className="data-table-col-admin" style={{ textAlign: 'center' }}>ACCIONES</div>
          </div>

          <div className="data-table-body-admin">
            {noticias.map((item) => (
              <div className="activity-row-admin" key={item.id}>
                
                {/* CELDA 1: MIN-WIDTH PROTEGIDO */}
                <div className="col-content-admin-box">
                  <div className="news-thumb-box-admin" onClick={() => handleOpenModal(item)}>
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt="Miniatura" className="news-thumb-img-admin" />
                    ) : (
                      <div className="news-thumb-mock-admin">HIE</div>
                    )}
                  </div>
                  <div className="news-title-interactive-admin" onClick={() => handleOpenModal(item)}>
                    <span className="news-title-clamped-admin" title={item.title}>
                      {item.title}
                    </span>
                    {item.editor && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                        Editado por {item.editor} Sistema
                      </span>
                    )}
                  </div>
                </div>

                {/* CELDA 2: FECHA */}
                <div className="col-text-admin" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{item.date}</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>(Editado)</span>
                </div>
                
                {/* CELDA 3: EDITOR */}
                <div className="col-text-admin">{item.editor}</div>
                
                {/* CELDA 4: CATEGORÍA */}
                <div className="col-categoria-data-admin col-text-admin">
                  <span className="category-pill-admin">Noticias</span>
                </div>

                {/* CELDA 5: ESTADO */}
                <div>
                  <span className={`status-pill-admin ${getBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                {/* CELDA 6: ACCIONES (SOLO VER) */}
                <div className="col-acciones-admin">
                  <button className="icon-btn-admin" title="Ver Solicitud" onClick={() => handleOpenModal(item)}>
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===============================================================
          MODAL DE VISUALIZACIÓN AISLADO PARA ADMIN
          =============================================================== */}
      {selectedNews && (
        <div className="modal-overlay-admin" onClick={handleCloseModal}>
          <div className="modal-content-esp-admin" onClick={(e) => e.stopPropagation()}>
            
            {selectedNews.scheduledDate && (
              <div className="scheduled-alert-admin">
                <CalendarClock size={20} />
                <span>Atención: Esta noticia está programada para publicarse automáticamente el {selectedNews.scheduledDate}.</span>
              </div>
            )}

            <div className="modal-header-esp-admin">
              <h2>COMUNICADO INSTITUCIONAL</h2>
              <button className="btn-close-modal-admin" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body-esp-admin">
              
              {/* COLUMNA IZQUIERDA (Info y Título) */}
              <div className="preview-mock-left-admin">
                <div className="modal-author-row-admin">
                  <div className="hospital-avatar-admin">
                    <img src={avatarHospital} alt="Avatar Hospital" />
                  </div>
                  <div className="author-meta-admin">
                    <h3>Hospital Interdistrital Evita Formosa</h3>
                    <span>{selectedNews.date}</span>
                  </div>
                </div>

                <div className="news-modal-headline-admin">
                  <h3 className="news-modal-title-admin">{selectedNews.title}</h3>
                </div>

                <div className="news-modal-body-text-admin">
                  <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
                </div>
              </div>

              {/* COLUMNA DERECHA (Mosaico de Imágenes) */}
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className="news-modal-images-section-admin">
                  <div className={`news-modal-images-grid-admin ${getLayoutClass(selectedNews.images.length)}`}>
                    {selectedNews.images.map((img, idx) => (
                      <div className="modal-news-img-box-admin" key={idx}>
                        <img src={img} alt={`Foto noticia ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ÁREA DE JUSTIFICACIÓN DE RECHAZO */}
              {isRejecting && (
                <div className="rejection-area-admin">
                  <label htmlFor="rejection-reason">
                    <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Mensaje de Justificación (Requerido):
                  </label>
                  <textarea 
                    id="rejection-reason"
                    className="rejection-textarea-admin"
                    placeholder="Explica al editor el motivo del rechazo para que pueda corregirlo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* CONTROLES INFERIORES DEL MODAL (Aprobar/Rechazar) */}
            <div className="modal-footer-esp-admin">
              {!isRejecting ? (
                <>
                  <button className="btn-modal-admin btn-modal-danger-admin" onClick={handleTriggerReject}>
                    <XCircle size={18} /> Rechazar
                  </button>
                  <button className="btn-modal-admin btn-modal-success-admin" onClick={handleApprove}>
                    <CheckCircle size={18} /> Aprobar {selectedNews.scheduledDate && 'y Programar'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-modal-admin btn-modal-cancel-admin" onClick={() => setIsRejecting(false)}>
                    Cancelar
                  </button>
                  <button className="btn-modal-admin btn-modal-confirm-reject-admin" onClick={handleConfirmReject}>
                    Confirmar Rechazo
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticiasView;