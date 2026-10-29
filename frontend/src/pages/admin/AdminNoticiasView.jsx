import React, { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, XCircle, CalendarClock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import keycloak from '../../config/keycloak';
import { getNoticias, evaluarNoticiaEstado } from '../../api/noticias.api';
import avatarHospital from '../../assets/logoHospitalEvita.png';
import '../../styles/pages/admin/AdminNoticiasView.css';

const AdminNoticiasView = ({ onPendingCountChange }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDIENTE');

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    index: 0,
  });

  const openLightbox = (images, index) => {
    setLightbox({ isOpen: true, images, index });
  };

  const closeLightbox = () => {
    setLightbox({ isOpen: false, images: [], index: 0 });
  };

  const nextLightboxImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
  }, []);

  const prevLightboxImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  }, []);

  useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeLightbox();
      } else if (e.key === 'ArrowRight' && lightbox.images.length > 1) {
        nextLightboxImage();
      } else if (e.key === 'ArrowLeft' && lightbox.images.length > 1) {
        prevLightboxImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, lightbox.images.length, nextLightboxImage, prevLightboxImage]);

  const syncPendingCount = useCallback(
    (list) => {
      if (typeof onPendingCountChange === 'function') {
        const count = list.filter(
          (item) => (item.estado || '').toUpperCase() === 'PENDIENTE_APROBACION'
        ).length;
        onPendingCountChange(count);
      }
    },
    [onPendingCountChange]
  );

  const cargarNoticias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNoticias(true);
      if (Array.isArray(data)) {
        const filtradas = data
          .filter((n) => (n.estado || '').toUpperCase() !== 'BORRADOR')
          .map((noticia) => {
            const estadoUpper = (noticia.estado || 'PENDIENTE_APROBACION').toUpperCase();
            let statusLabel = 'Pendiente de aprobación';
            if (estadoUpper === 'PUBLICADO' || estadoUpper === 'APROBADO') {
              statusLabel = 'Aprobado';
            } else if (estadoUpper === 'RECHAZADO') {
              statusLabel = 'Rechazado';
            } else if (estadoUpper === 'PROGRAMADO') {
              statusLabel = 'Programado';
            }

            return {
              id: noticia.id,
              title: noticia.title || noticia.titulo,
              date:
                noticia.date ||
                (noticia.createdAt
                  ? new Date(noticia.createdAt).toLocaleDateString('es-AR')
                  : 'Hoy'),
              editor: noticia.editor || 'Editor CMS',
              editedBy: noticia.editedBy || null,
              category: noticia.category || 'Noticias',
              estado: estadoUpper,
              status: statusLabel,
              content: Array.isArray(noticia.body)
                ? noticia.body.join('')
                : noticia.contenido || noticia.body || '',
              fechaPublicacion: noticia.fechaPublicacion || null,
              scheduledDate: noticia.fechaPublicacion
                ? new Date(noticia.fechaPublicacion).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' hs'
                : null,
              createdAt: noticia.createdAt,
              updatedAt: noticia.updatedAt,
              images: noticia.images || [],
              rejectionReason: noticia.rejectionReason || null,
            };
          })
          .sort((a, b) => {
            const aPending = a.estado === 'PENDIENTE_APROBACION' ? 0 : 1;
            const bPending = b.estado === 'PENDIENTE_APROBACION' ? 0 : 1;
            if (aPending !== bPending) return aPending - bPending;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        setNoticias(filtradas);
        syncPendingCount(filtradas);
      } else {
        setNoticias([]);
        syncPendingCount([]);
      }
    } catch (error) {
      console.error('Error al cargar noticias en el panel de administración:', error);
      toast.error('No se pudieron cargar las noticias para revisión.');
    } finally {
      setLoading(false);
    }
  }, [syncPendingCount]);

  useEffect(() => {
    cargarNoticias();
  }, [cargarNoticias]);

  const handleOpenModal = (noticia) => {
    setSelectedNews(noticia);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleCloseModal = () => {
    if (submitting) return;
    closeLightbox();
    setSelectedNews(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedNews || selectedNews.estado !== 'PENDIENTE_APROBACION' || submitting) return;
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }

      const response = await evaluarNoticiaEstado(
        selectedNews.id,
        { estado: 'APROBADO' },
        keycloak.token
      );

      const estadoFinal = (response?.noticia?.estado || 'PUBLICADO').toUpperCase();
      const nuevoStatusLabel = estadoFinal === 'PROGRAMADO' ? 'Programado' : 'Aprobado';

      const updatedList = noticias.map((item) =>
        item.id === selectedNews.id
          ? {
              ...item,
              estado: estadoFinal,
              status: nuevoStatusLabel,
              rejectionReason: null,
              updatedAt: response?.noticia?.updatedAt || new Date().toISOString(),
            }
          : item
      );

      setNoticias(updatedList);
      syncPendingCount(updatedList);

      if (estadoFinal === 'PROGRAMADO') {
        toast.success(`Noticia "${selectedNews.title}" APROBADA y programada exitosamente.`);
      } else {
        toast.success(`Noticia "${selectedNews.title}" APROBADA y publicada exitosamente.`);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error al aprobar la noticia:', error);
      toast.error(
        error?.response?.data?.message || 'Ocurrió un error al aprobar la noticia.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerReject = () => {
    if (!selectedNews || selectedNews.estado !== 'PENDIENTE_APROBACION') return;
    setIsRejecting(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedNews || selectedNews.estado !== 'PENDIENTE_APROBACION' || submitting) return;
    if (!rejectReason.trim()) {
      toast.error('Debes ingresar obligatoriamente un motivo para enviar la corrección al Editor CMS.');
      return;
    }

    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }

      const motivoLimpio = rejectReason.trim();
      const response = await evaluarNoticiaEstado(
        selectedNews.id,
        {
          estado: 'RECHAZADO',
          rejectionReason: motivoLimpio,
        },
        keycloak.token
      );

      const updatedList = noticias.map((item) =>
        item.id === selectedNews.id
          ? {
              ...item,
              estado: 'RECHAZADO',
              status: 'Rechazado',
              rejectionReason: motivoLimpio,
              updatedAt: response?.noticia?.updatedAt || new Date().toISOString(),
            }
          : item
      );

      setNoticias(updatedList);
      syncPendingCount(updatedList);

      toast.success('Noticia RECHAZADA. El motivo fue enviado al equipo de redacción (CMS).');
      handleCloseModal();
    } catch (error) {
      console.error('Error al rechazar la noticia:', error);
      toast.error(
        error?.response?.data?.message || 'Ocurrió un error al rechazar la noticia.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeClass = (status) => {
    if (status === 'Aprobado' || status === 'Programado') return 'status-aprobado-admin';
    if (status === 'Rechazado') return 'status-rechazado-admin';
    return 'status-pendiente-admin';
  };

  const getLayoutClass = (numImages) => {
    if (numImages >= 4) return 'layout-4-admin';
    if (numImages === 3) return 'layout-3-admin';
    if (numImages === 2) return 'layout-2-admin';
    return 'layout-1-admin';
  };

  const pendingCount = noticias.filter((n) => n.estado === 'PENDIENTE_APROBACION').length;
  const approvedCount = noticias.filter(
    (n) =>
      n.estado === 'PUBLICADO' ||
      n.estado === 'APROBADO' ||
      n.estado === 'PROGRAMADO'
  ).length;
  const rejectedCount = noticias.filter((n) => n.estado === 'RECHAZADO').length;

  const filteredNoticias = noticias.filter((item) => {
    if (statusFilter === 'PENDIENTE') {
      return item.estado === 'PENDIENTE_APROBACION';
    }
    if (statusFilter === 'APROBADO') {
      return (
        item.estado === 'PUBLICADO' ||
        item.estado === 'APROBADO' ||
        item.estado === 'PROGRAMADO'
      );
    }
    if (statusFilter === 'RECHAZADO') {
      return item.estado === 'RECHAZADO';
    }
    return true;
  });

  return (
    <div className="admin-review-container-admin">
      <div className="admin-page-header-admin">
        <span className="admin-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Revisión Editorial</h1>
        <p>Evalúa las solicitudes de publicación enviadas por el equipo de redactores del CMS.</p>
      </div>

      <div className="dashboard-card-admin">
        <h2 className="dashboard-card-title-admin">Listado de las Noticias</h2>
        <p className="news-view-subtitle-admin">
          Área de Revisión: Aprobación y rechazo de notificaciones recibidas desde el CMS
        </p>

        <div className="admin-news-filter-bar">
          <div className="admin-news-tabs-group" role="tablist" aria-label="Filtrar noticias por estado">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'PENDIENTE'}
              className={`admin-news-tab-item ${statusFilter === 'PENDIENTE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDIENTE')}
            >
              Pendientes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'APROBADO'}
              className={`admin-news-tab-item ${statusFilter === 'APROBADO' ? 'active' : ''}`}
              onClick={() => setStatusFilter('APROBADO')}
            >
              Aprobados
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'RECHAZADO'}
              className={`admin-news-tab-item ${statusFilter === 'RECHAZADO' ? 'active' : ''}`}
              onClick={() => setStatusFilter('RECHAZADO')}
            >
              Rechazados
            </button>
          </div>

          <span
            className={`admin-news-active-count-badge ${
              statusFilter === 'PENDIENTE'
                ? 'count-pending'
                : statusFilter === 'APROBADO'
                ? 'count-approved'
                : 'count-rejected'
            }`}
          >
            {statusFilter === 'PENDIENTE'
              ? `${pendingCount} ${pendingCount === 1 ? 'pendiente' : 'pendientes'}`
              : statusFilter === 'APROBADO'
              ? `${approvedCount} ${approvedCount === 1 ? 'aprobada' : 'aprobadas'}`
              : `${rejectedCount} ${rejectedCount === 1 ? 'rechazada' : 'rechazadas'}`}
          </span>
        </div>

        <div className="data-table-container-admin">
          <div className="data-table-header-admin">
            <div className="data-table-col-admin">CONTENIDO</div>
            <div className="data-table-col-admin">FECHA</div>
            <div className="data-table-col-admin">EDITOR</div>
            <div className="data-table-col-admin">CATEGORÍA</div>
            <div className="data-table-col-admin">ESTADO</div>
            <div className="data-table-col-admin" style={{ textAlign: 'center' }}>
              ACCIONES
            </div>
          </div>

          <div className="data-table-body-admin">
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                Cargando solicitudes de noticias...
              </div>
            ) : filteredNoticias.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                {statusFilter === 'PENDIENTE'
                  ? 'No hay noticias pendientes de aprobación en este momento.'
                  : statusFilter === 'APROBADO'
                  ? 'No hay noticias aprobadas registradas.'
                  : 'No hay noticias rechazadas registradas.'}
              </div>
            ) : (
              filteredNoticias.map((item) => {
                const wasEdited =
                  item.updatedAt &&
                  item.createdAt &&
                  new Date(item.updatedAt).getTime() >
                    new Date(item.createdAt).getTime() + 5000;

                return (
                  <div className="activity-row-admin" key={item.id}>
                    {/* CELDA 1: MIN-WIDTH PROTEGIDO */}
                    <div className="col-content-admin-box">
                      <div
                        className="news-thumb-box-admin"
                        onClick={() => handleOpenModal(item)}
                      >
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt="Miniatura"
                            className="news-thumb-img-admin"
                          />
                        ) : (
                          <div className="news-thumb-mock-admin">HIE</div>
                        )}
                      </div>
                      <div
                        className="news-title-interactive-admin"
                        onClick={() => handleOpenModal(item)}
                      >
                        <span className="news-title-clamped-admin" title={item.title}>
                          {item.title}
                        </span>
                        {item.editor && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              marginTop: '4px',
                            }}
                          >
                            Editado por {item.editedBy || item.editor} Sistema
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CELDA 2: FECHA */}
                    <div
                      className="col-text-admin"
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      <span>{item.date}</span>
                      {wasEdited && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontStyle: 'italic',
                          }}
                        >
                          (Editado)
                        </span>
                      )}
                    </div>

                    {/* CELDA 3: EDITOR */}
                    <div className="col-text-admin">{item.editor}</div>

                    {/* CELDA 4: CATEGORÍA */}
                    <div className="col-categoria-data-admin col-text-admin">
                      <span className="category-pill-admin">
                        {item.category || 'Noticias'}
                      </span>
                    </div>

                    {/* CELDA 5: ESTADO */}
                    <div>
                      <span className={`status-pill-admin ${getBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* CELDA 6: ACCIONES (SOLO VER) */}
                    <div className="col-acciones-admin">
                      <button
                        className="icon-btn-admin"
                        title={
                          item.estado === 'PENDIENTE_APROBACION'
                            ? 'Revisar y evaluar solicitud'
                            : 'Ver vista previa'
                        }
                        onClick={() => handleOpenModal(item)}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===============================================================
          MODAL DE VISUALIZACIÓN AISLADO PARA ADMIN
          =============================================================== */}
      {selectedNews && (
        <div className="modal-overlay-admin" onClick={handleCloseModal}>
          <div className="modal-content-esp-admin" onClick={(e) => e.stopPropagation()}>
            {selectedNews.scheduledDate &&
              (selectedNews.estado === 'PENDIENTE_APROBACION' ||
                selectedNews.estado === 'PROGRAMADO') && (
                <div className="scheduled-alert-admin">
                  <CalendarClock size={20} />
                  <span>
                    Atención: Esta noticia está programada para publicarse automáticamente el{' '}
                    {selectedNews.scheduledDate}.
                  </span>
                </div>
              )}

            <div className="modal-header-esp-admin">
              <h2>COMUNICADO INSTITUCIONAL</h2>
              <button
                className="btn-close-modal-admin"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div
              className="modal-body-esp-admin"
              style={
                !selectedNews.images || selectedNews.images.length === 0
                  ? { gridTemplateColumns: '1fr' }
                  : undefined
              }
            >
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
                  <div
                    className={`news-modal-images-grid-admin ${getLayoutClass(
                      selectedNews.images.length
                    )}`}
                  >
                    {selectedNews.images.slice(0, 4).map((img, idx) => {
                      const isLastAndHidden =
                        idx === 3 && selectedNews.images.length > 4;
                      const fotosRestantes = selectedNews.images.length - 4;
                      const imageUrls = selectedNews.images.map((i) => i.url || i);

                      return (
                        <div
                          className="modal-news-img-box-admin"
                          key={idx}
                          onClick={() => openLightbox(imageUrls, idx)}
                          title="Haga clic para maximizar la imagen"
                        >
                          <img src={img.url || img} alt={`Foto noticia ${idx + 1}`} />
                          {isLastAndHidden && (
                            <div className="mosaic-overlay-admin">
                              <span>+{fotosRestantes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SI YA FUE RECHAZADA, MOSTRAR EL MOTIVO EN MODO SOLO LECTURA */}
              {selectedNews.estado === 'RECHAZADO' && selectedNews.rejectionReason && (
                <div className="rejection-area-admin">
                  <label>
                    <AlertTriangle
                      size={16}
                      style={{ display: 'inline', verticalAlign: 'text-bottom' }}
                    />{' '}
                    Motivo del rechazo enviado al CMS:
                  </label>
                  <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.92rem' }}>
                    {selectedNews.rejectionReason}
                  </p>
                </div>
              )}

              {/* ÁREA DE JUSTIFICACIÓN DE RECHAZO (SOLO PARA SOLICITUDES PENDIENTES) */}
              {selectedNews.estado === 'PENDIENTE_APROBACION' && isRejecting && (
                <div className="rejection-area-admin">
                  <label htmlFor="rejection-reason">
                    <AlertTriangle
                      size={16}
                      style={{ display: 'inline', verticalAlign: 'text-bottom' }}
                    />{' '}
                    Mensaje de Justificación (Requerido):
                  </label>
                  <textarea
                    id="rejection-reason"
                    className="rejection-textarea-admin"
                    placeholder="Explica al editor el motivo del rechazo para que pueda corregirlo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {/* CONTROLES INFERIORES: EL ADMIN SOLO PUEDE ACEPTAR O RECHAZAR CAMBIOS PENDIENTES DEL CMS */}
            {selectedNews.estado === 'PENDIENTE_APROBACION' && (
              <div className="modal-footer-esp-admin">
                {!isRejecting ? (
                  <>
                    <button
                      className="btn-modal-admin btn-modal-danger-admin"
                      onClick={handleTriggerReject}
                      disabled={submitting}
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                    <button
                      className="btn-modal-admin btn-modal-success-admin"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <CheckCircle size={18} />{' '}
                      {submitting
                        ? 'Procesando...'
                        : `Aprobar ${selectedNews.scheduledDate ? 'y Programar' : ''}`}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-modal-admin btn-modal-cancel-admin"
                      onClick={() => setIsRejecting(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-modal-admin btn-modal-confirm-reject-admin"
                      onClick={handleConfirmReject}
                      disabled={submitting}
                    >
                      {submitting ? 'Enviando...' : 'Confirmar Rechazo'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox.isOpen && (
        <div className="lightbox-overlay-admin" onClick={closeLightbox}>
          <button
            type="button"
            className="lightbox-close-admin"
            onClick={closeLightbox}
            aria-label="Cerrar imagen maximizada"
          >
            &times;
          </button>
          <div
            className="lightbox-content-admin"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.images.length > 1 && (
              <button
                type="button"
                className="lightbox-arrow-admin lb-left-admin"
                onClick={prevLightboxImage}
                aria-label="Imagen anterior"
              >
                &#10094;
              </button>
            )}
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Vista ampliada ${lightbox.index + 1}`}
              className="lightbox-img-admin"
            />
            {lightbox.images.length > 1 && (
              <button
                type="button"
                className="lightbox-arrow-admin lb-right-admin"
                onClick={nextLightboxImage}
                aria-label="Imagen siguiente"
              >
                &#10095;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticiasView;
