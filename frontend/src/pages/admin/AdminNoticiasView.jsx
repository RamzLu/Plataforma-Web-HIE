import '../../styles/components/admin/AdminRevisionModal.css';
import SolicitudEliminacionAcciones, { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import { mensajeDeError } from "../../utils/mensajeDeError";
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, CalendarClock, CalendarDays, AlertTriangle, Globe2, Clock3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import keycloak from '../../config/keycloak';
import { getNoticias, evaluarNoticiaEstado } from '../../api/noticias.api';
import avatarHospital from '../../assets/logoHospitalEvita.png';
import DefaultNewsImage from '../../components/ui/DefaultNewsImage';
import { sanitizeHtml } from '../../utils/sanitizeHtml.js';
import { AdminCambiosPill, AdminCambiosResaltados } from '../../components/admin/AdminCambiosResaltados.jsx';
import '../../styles/pages/admin/AdminNoticiasView.css';
import Paginacion from "../../components/ui/Paginacion";
import { usePaginacion } from "../../hooks/usePaginacion";

const AdminNoticiasView = ({ onPendingCountChange }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');

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
          (item) =>
            (item.estado || '').toUpperCase() === 'PENDIENTE_APROBACION' ||
            Boolean(item.solicitudEliminacion)
        ).length;
        onPendingCountChange(count);
      }
    },
    [onPendingCountChange]
  );

  const cargarNoticias = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getNoticias(true);
        if (Array.isArray(data)) {
          const filtradas = data
            .filter((n) => (n.estado || '').toUpperCase() !== 'BORRADOR')
            .map((noticia) => {
              const estadoUpper = (noticia.estado || 'PENDIENTE_APROBACION').toUpperCase();
              let statusLabel = 'Pendiente de aprobación';
              if (estadoUpper === 'PUBLICADO') {
                statusLabel = 'Publicado';
              } else if (estadoUpper === 'APROBADO') {
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
                requestedEstado: noticia.requestedEstado || null,
                previousEstado: noticia.previousEstado || null,
                solicitudEliminacion: noticia.solicitudEliminacion || null,
                cambios: Array.isArray(noticia.cambios) ? noticia.cambios : [],
                esActualizacion: Boolean(noticia.esActualizacion),
              };
            })
            .sort((a, b) => {
              const aPending = a.estado === 'PENDIENTE_APROBACION' || a.solicitudEliminacion ? 0 : 1;
              const bPending = b.estado === 'PENDIENTE_APROBACION' || b.solicitudEliminacion ? 0 : 1;
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
        if (!silent) {
          console.error('Error al cargar noticias en el panel de administración:', error);
          toast.error('No se pudieron cargar las noticias para revisión.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [syncPendingCount]
  );

  useEffect(() => {
    cargarNoticias(false);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarNoticias(true);
      }
    }, 60000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        cargarNoticias(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
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

      const estadoFinal = (response?.noticia?.estado || 'APROBADO').toUpperCase();

      if (estadoFinal === 'BORRADOR') {
        const updatedList = noticias.filter((item) => item.id !== selectedNews.id);
        setNoticias(updatedList);
        syncPendingCount(updatedList);
        toast.success(
          `Cambio aprobado: la noticia "${selectedNews.title}" pasó a estado Borrador en el CMS.`
        );
        handleCloseModal();
        return;
      }

      const nuevoStatusLabel =
        estadoFinal === 'PUBLICADO'
          ? 'Publicado'
          : estadoFinal === 'PROGRAMADO'
          ? 'Programado'
          : 'Aprobado';

      const updatedList = noticias.map((item) =>
        item.id === selectedNews.id
          ? {
              ...item,
              estado: estadoFinal,
              status: nuevoStatusLabel,
              requestedEstado: null,
              rejectionReason: null,
              fechaPublicacion:
                response?.noticia?.fechaPublicacion ?? item.fechaPublicacion,
              updatedAt: response?.noticia?.updatedAt || new Date().toISOString(),
            }
          : item
      );

      setNoticias(updatedList);
      syncPendingCount(updatedList);

      if (estadoFinal === 'PROGRAMADO') {
        toast.success(`Noticia "${selectedNews.title}" APROBADA y programada exitosamente.`);
      } else if (estadoFinal === 'PUBLICADO') {
        toast.success(`Noticia "${selectedNews.title}" fue publicada por el CMS.`);
      } else {
        toast.success(
          `Noticia "${selectedNews.title}" APROBADA. El CMS ya puede gestionar su publicación.`
        );
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error al aprobar la noticia:', error);
      toast.error(
        mensajeDeError(error, 'Ocurrió un error al aprobar la noticia.')
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
        mensajeDeError(error, 'Ocurrió un error al rechazar la noticia.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getLayoutClass = (numImages) => {
    if (numImages >= 4) return 'layout-4-admin';
    if (numImages === 3) return 'layout-3-admin';
    if (numImages === 2) return 'layout-2-admin';
    return 'layout-1-admin';
  };

  // Las solicitudes de eliminación también esperan respuesta del admin: cuentan como pendientes.
  const pendingCount = noticias.filter(
    (n) => n.estado === 'PENDIENTE_APROBACION' || Boolean(n.solicitudEliminacion)
  ).length;
  const approvedCount = noticias.filter(
    (n) =>
      n.estado === 'APROBADO' ||
      n.estado === 'PROGRAMADO'
  ).length;
  const publishedCount = noticias.filter((n) => n.estado === 'PUBLICADO').length;
  const rejectedCount = noticias.filter((n) => n.estado === 'RECHAZADO').length;

  const filteredNoticias = noticias.filter((item) => {
    if (statusFilter === 'PENDIENTE') {
      return item.estado === 'PENDIENTE_APROBACION' || Boolean(item.solicitudEliminacion);
    }
    if (statusFilter === 'APROBADO') {
      return item.estado === 'APROBADO' || item.estado === 'PROGRAMADO';
    }
    if (statusFilter === 'PUBLICADO') {
      return item.estado === 'PUBLICADO';
    }
    if (statusFilter === 'RECHAZADO') {
      return item.estado === 'RECHAZADO';
    }
    return true;
  });
  const paginacion = usePaginacion(filteredNoticias, 10, [statusFilter]);

  return (
    <div className="admin-review-container-admin">
      <div className="admin-page-header-admin admin-view-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="admin-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
            <h1>Revisión Editorial</h1>
            <p>Evalúa las solicitudes de publicación enviadas por el equipo de redactores del CMS.</p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => cargarNoticias(false)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="admin-news-summary-toolbar">
        <button
          type="button"
          className={`admin-news-reset-filter ${statusFilter === 'TODOS' ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'TODOS'}
          onClick={() => setStatusFilter('TODOS')}
        >
          Todos
        </button>
      </div>
      <div className="admin-news-summary" role="group" aria-label="Filtrar noticias por estado">
        <button
          type="button"
          className={`admin-news-summary-card is-pending ${statusFilter === 'PENDIENTE' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE'}
          onClick={() => setStatusFilter('PENDIENTE')}
        >
          <span className="admin-news-summary-icon"><Clock3 size={19} /></span>
          <span className="admin-news-summary-copy">
            <span>Pendientes de aprobación</span>
            <strong>{pendingCount}</strong>
          </span>
        </button>
        <button
          type="button"
          className={`admin-news-summary-card is-approved ${statusFilter === 'APROBADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APROBADO'}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span className="admin-news-summary-icon"><CheckCircle size={19} /></span>
          <span className="admin-news-summary-copy">
            <span>Aprobados para CMS</span>
            <strong>{approvedCount}</strong>
          </span>
        </button>
        <button
          type="button"
          className={`admin-news-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span className="admin-news-summary-icon"><Globe2 size={19} /></span>
          <span className="admin-news-summary-copy">
            <span>Visibles al público</span>
            <strong>{publishedCount}</strong>
          </span>
        </button>
        <button
          type="button"
          className={`admin-news-summary-card is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span className="admin-news-summary-icon"><XCircle size={19} /></span>
          <span className="admin-news-summary-copy">
            <span>Rechazados</span>
            <strong>{rejectedCount}</strong>
          </span>
        </button>
      </div>

      <div className="dashboard-card-admin">
        <div className="admin-news-card-heading">
          <div>
            <h2 className="dashboard-card-title-admin">Listado de Noticias</h2>
            <p className="news-view-subtitle-admin">
              Área de Revisión: Aprobación y rechazo de noticias recibidas desde el CMS
            </p>
          </div>
          <span className="admin-news-result-count">
            {filteredNoticias.length} {filteredNoticias.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
        <div className="data-table-container-admin">
          <div className="data-table-header-admin">
            <div className="data-table-col-admin">CONTENIDO</div>
            <div className="data-table-col-admin">EDITOR / FECHA</div>
            <div className="data-table-col-admin">CATEGORÍA</div>
            <div className="data-table-col-admin">ESTADO</div>
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
                  : statusFilter === 'PUBLICADO'
                  ? 'No hay noticias publicadas registradas.'
                  : statusFilter === 'RECHAZADO'
                  ? 'No hay noticias rechazadas registradas.'
                  : 'No hay noticias registradas.'}
              </div>
            ) : (
              paginacion.itemsPagina.map((item) => {
                const wasEdited =
                  item.updatedAt &&
                  item.createdAt &&
                  new Date(item.updatedAt).getTime() >
                    new Date(item.createdAt).getTime() + 5000;

                return (
                  <div className="activity-row-admin" key={item.id}>
                                        <div className="col-content-admin-box">
                      <div
                        className="news-thumb-box-admin"
                        onClick={() => handleOpenModal(item)}
                      >
                        {item.images && item.images.length > 0 && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt="Miniatura"
                            className="news-thumb-img-admin"
                          />
                        ) : (
                          <DefaultNewsImage alt="Miniatura" compact />
                        )}
                      </div>
                      <button
                        type="button"
                        className="news-title-interactive-admin"
                        onClick={() => handleOpenModal(item)}
                      >
                        <span className="news-title-clamped-admin" title={item.title}>
                          {item.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <AdminCambiosPill count={item.cambios?.length} esActualizacion={item.esActualizacion} />
                        </div>
                      </button>
                    </div>

                                        <div
                      className="col-text-admin"
                      style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.editor}</span>
                      <small style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                        <CalendarDays size={13} />
                        {item.date}
                        {wasEdited && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748b',
                              fontStyle: 'italic',
                              marginLeft: '3px',
                            }}
                          >
                            (Editado)
                          </span>
                        )}
                      </small>
                    </div>

                                        <div className="col-categoria-data-admin col-text-admin">
                      <span
                        className={`category-pill-admin ${item.category === 'General' ? 'general' : ''}`}
                        style={{
                          backgroundColor:
                            item.category === 'General' ? '#f1f5f9' : '#e0f2fe',
                          color: item.category === 'General' ? '#475569' : '#0284c7',
                        }}
                      >
                        {item.category || 'General'}
                      </span>
                    </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      {item.solicitudEliminacion ? (
                        <EtiquetaEliminacion />
                      ) : (
                        <EtiquetaEstado estado={item.status} texto={item.status} />
                      )}
                      {item.estado === 'PENDIENTE_APROBACION' &&
                        item.requestedEstado === 'BORRADOR' && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#b45309',
                            }}
                          >
                            Solicita pasar a Borrador
                          </span>
                        )}
                      {(item.estado === 'PROGRAMADO' || item.estado === 'APROBADO') &&
                        item.fechaPublicacion && (
                          <span className="status-programmed-date-admin">
                            Para:{' '}
                            {new Date(item.fechaPublicacion).toLocaleDateString('es-AR')} -{' '}
                            {new Date(item.fechaPublicacion).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}{' '}
                            hs
                          </span>
                        )}
                    </div>

                  </div>
                );
              })
            )}
            <Paginacion {...paginacion} etiqueta="noticias" />
          </div>
        </div>
      </div>

            {selectedNews && (
        <div className="modal-overlay-admin admin-rev-overlay" onClick={handleCloseModal}>
          <div className="modal-content-esp-admin admin-rev-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-esp-admin admin-rev-header">
              <div>
                <span className="admin-rev-kicker">Información pública</span>
                <h2 className="admin-rev-title">Revisión de noticia</h2>
              </div>
              <button
                className="btn-close-modal-admin admin-rev-close"
                aria-label="Cerrar detalle"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

<div className="modal-body-esp-admin admin-rev-body">
              {selectedNews.estado === 'PENDIENTE_APROBACION' &&
                selectedNews.requestedEstado === 'BORRADOR' && (
                  <div className="admin-rev-alert">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Solicitud de cambio de estado:</strong> El editor del CMS solicita pasar esta noticia
                      publicada a <strong>Borrador</strong> (retirarla del portal público).
                    </div>
                  </div>
                )}

              {selectedNews.scheduledDate &&
                (selectedNews.estado === 'PENDIENTE_APROBACION' ||
                  selectedNews.estado === 'PROGRAMADO') && (
                  <div className="admin-rev-alert is-info">
                    <CalendarClock size={18} />
                    <div>
                      <strong>Publicación programada:</strong> Esta noticia está programada para publicarse
                      automáticamente el {selectedNews.scheduledDate}.
                    </div>
                  </div>
                )}

              {selectedNews.esActualizacion && selectedNews.cambios?.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <AdminCambiosResaltados
                    cambios={selectedNews.cambios}
                    esActualizacion={selectedNews.esActualizacion}
                  />
                </div>
              )}
              <div className="preview-mock-left-admin admin-rev-card">
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
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNews.content) }} />
                </div>
              </div>

                            {selectedNews.images && selectedNews.images.length > 0 && selectedNews.images[0] ? (
                <div className="news-modal-images-section-admin admin-rev-card">
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
              ) : (
                <div className="news-modal-default-img-wrap-admin">
                  <DefaultNewsImage alt={selectedNews.title} />
                </div>
              )}

{selectedNews.estado === 'RECHAZADO' && selectedNews.rejectionReason && (
                <div className="admin-rev-note">
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

              {selectedNews.estado === 'PENDIENTE_APROBACION' && isRejecting && (
                <div className="admin-rev-field">
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
              {selectedNews.solicitudEliminacion && (
                <div className="admin-rev-solicitud">
                  <SolicitudEliminacionAcciones
                    solicitud={selectedNews.solicitudEliminacion}
                    entidad="noticia"
                    id={selectedNews.id}
                    titulo={selectedNews.title}
                    onResuelto={async () => {
                      handleCloseModal();
                      await cargarNoticias(true);
                    }}
                  />
                </div>
              )}
            </div>


{selectedNews.estado === 'PENDIENTE_APROBACION' && (
              <div className="modal-footer-esp-admin admin-rev-footer">
                {!isRejecting ? (
                  <>
                    <button
                      className="btn-modal-admin btn-modal-danger-admin admin-rev-button is-danger"
                      onClick={handleTriggerReject}
                      disabled={submitting}
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                    <button
                      className="btn-modal-admin btn-modal-success-admin admin-rev-button is-primary"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <CheckCircle size={18} />{' '}
                      {submitting
                        ? 'Procesando...'
                        : selectedNews.requestedEstado === 'BORRADOR'
                        ? 'Aprobar paso a Borrador'
                        : `Aprobar ${selectedNews.scheduledDate ? 'y Programar' : ''}`}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-modal-admin btn-modal-cancel-admin admin-rev-button is-secondary"
                      onClick={() => setIsRejecting(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-modal-admin btn-modal-confirm-reject-admin admin-rev-button is-danger"
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
