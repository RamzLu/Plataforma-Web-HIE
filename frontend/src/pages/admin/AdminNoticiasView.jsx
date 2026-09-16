import React, { useState } from 'react';
import { Eye, X, CheckCircle, XCircle, CalendarClock, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import '../../styles/pages/admin/AdminNoticiasView.css';

// MOCK DATA: Contexto hospitalario real, cero Lorem Ipsum.
const mockPayloadNoticias = [
  { 
    id: 1, 
    title: 'Nueva sala de oncología habilitada', 
    date: '16/09/2026', 
    editor: 'Ana López', 
    category: 'Institucional', 
    status: 'Pendiente de aprobación',
    content: 'El Hospital Interdistrital Evita Formosa ha inaugurado la nueva ala de atención oncológica, equipada con tecnología de última generación para el tratamiento ambulatorio de pacientes de toda la provincia...',
    scheduledDate: null
  },
  { 
    id: 2, 
    title: 'Campaña de Prevención del Dengue: Medidas precautorias', 
    date: '15/09/2026', 
    editor: 'Carlos Ruiz', 
    category: 'Prevención', 
    status: 'Pendiente de aprobación',
    content: 'Ante la llegada de las primeras lluvias de la temporada, el Ministerio recuerda las principales medidas preventivas en los hogares para evitar la proliferación del mosquito Aedes aegypti...',
    scheduledDate: '20/09/2026 08:00 AM' 
  },
  { 
    id: 3, 
    title: 'Actualización de turnos web para consultorios externos', 
    date: '14/09/2026', 
    editor: 'Ana López', 
    category: 'Guía y orientación', 
    status: 'Aprobado',
    content: 'A partir del próximo mes, los turnos para todas las especialidades médicas podrán solicitarse a través del nuevo portal web de la provincia de Formosa...',
    scheduledDate: null
  }
];

const AdminNoticiasView = () => {
  const [noticias, setNoticias] = useState(mockPayloadNoticias);
  const [selectedNews, setSelectedNews] = useState(null);
  
  // Gestión del estado de flujo UX del Modal
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ==============================
  // FLUJO DEL MODAL Y LÓGICA
  // ==============================
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
    // Lógica futura: Actualizar estado en el backend
    handleCloseModal();
  };

  const handleTriggerReject = () => {
    setIsRejecting(true); // Expande el UI para justificar el rechazo
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Debes ingresar obligatoriamente un motivo para enviar la corrección al Editor CMS.");
      return;
    }
    alert(`Noticia RECHAZADA. Motivo enviado: "${rejectReason}"`);
    // Lógica futura: Hacer POST/PUT al backend con el rejectReason
    handleCloseModal();
  };

  const getBadgeClass = (status) => {
    if (status === 'Aprobado') return 'status-aprobado';
    if (status === 'Rechazado') return 'status-rechazado';
    return 'status-pendiente';
  };

  return (
    <div className="admin-review-container">
      
      {/* HEADER SEMÁNTICO DE LA PÁGINA */}
      <div className="admin-page-header">
        <span className="admin-overtitle">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Revisión Editorial</h1>
        <p>Evalúa las solicitudes de publicación enviadas por el equipo de redactores del CMS.</p>
      </div>

      {/* DASHBOARD CARD PRINCIPAL */}
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Liatado de las Noticias</h2>
       <p className='news-view-subtitle-admin'>Área de Revisión: Aprobación y rechazo de notificaciones recibidas desde el CMS</p> <br />
        {/* TABLA DE DATOS (DATA GRID) */}
        <div className="data-table-container">
          <div className="data-table-header">
            <div className="data-table-col">CONTENIDO</div>
            <div className="data-table-col">FECHA</div>
            <div className="data-table-col">EDITOR</div>
            <div className="data-table-col">CATEGORÍA</div>
            <div className="data-table-col">ESTADO</div>
            <div className="data-table-col" style={{ textAlign: 'center' }}>ACCIONES</div>
          </div>

          <div className="data-table-body">
            {noticias.map((item) => (
              <div className="data-table-row" key={item.id}>
                <div className="col-content-title" title={item.title}>{item.title}</div>
                <div className="col-text">{item.date}</div>
                <div className="col-text">{item.editor}</div>
                <div className="col-text">{item.category}</div>
                <div>
                  <span className={`status-pill ${getBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                {/* RESTRICCIÓN DE NEGOCIO: Solo botón 'Ver/Expandir' permitido */}
                <div className="col-acciones">
                  <button className="icon-btn" title="Ver Solicitud" onClick={() => handleOpenModal(item)}>
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE VISUALIZACIÓN Y REVISIÓN */}
      {selectedNews && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* RENDERIZADO CONDICIONAL: ALERTA DE PROGRAMACIÓN */}
            {selectedNews.scheduledDate && (
              <div className="scheduled-alert">
                <CalendarClock size={20} />
                <span>Atención: Esta noticia está programada para publicarse automáticamente el {selectedNews.scheduledDate}.</span>
              </div>
            )}

            <div className="modal-header">
              <h2>Revisión de Contenido</h2>
              <button className="btn-close" onClick={handleCloseModal}><X size={24} /></button>
            </div>

            <div className="modal-body">
              {/* PAYLOAD DE LA NOTICIA (SOLO LECTURA) */}
              <h3 className="news-payload-title">{selectedNews.title}</h3>
              
              <div className="news-payload-image">
                <ImageIcon size={48} />
                <span style={{ marginTop: '10px' }}>Vista previa de la imagen adjunta</span>
              </div>

              <div className="news-payload-content">
                <p style={{ margin: 0 }}>{selectedNews.content}</p>
                <p style={{ marginTop: '15px', color: '#94a3b8', fontStyle: 'italic' }}>[Fin del contenido redactado]</p>
              </div>

              {/* FLUJO CONDICIONAL: ÁREA DE JUSTIFICACIÓN DE RECHAZO */}
              {isRejecting && (
                <div className="rejection-area">
                  <label htmlFor="rejection-reason">
                    <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Mensaje de Justificación (Requerido):
                  </label>
                  <textarea 
                    id="rejection-reason"
                    className="rejection-textarea"
                    placeholder="Explica al editor el motivo del rechazo para que pueda corregirlo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* CONTROLES INFERIORES DEL MODAL */}
            <div className="modal-footer">
              {!isRejecting ? (
                <>
                  <button className="btn-modal btn-modal-danger" onClick={handleTriggerReject}>
                    <XCircle size={18} /> Rechazar
                  </button>
                  <button className="btn-modal btn-modal-success" onClick={handleApprove}>
                    <CheckCircle size={18} /> Aprobar {selectedNews.scheduledDate && 'y Programar'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-modal btn-modal-cancel" onClick={() => setIsRejecting(false)}>
                    Cancelar
                  </button>
                  <button className="btn-modal btn-modal-confirm-reject" onClick={handleConfirmReject}>
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