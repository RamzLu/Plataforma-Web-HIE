import '../../styles/components/admin/AdminRevisionModal.css';
import SolicitudEliminacionAcciones, { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import { mensajeDeError } from "../../utils/mensajeDeError";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  FileText,
  FolderOpen,
  Globe2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import keycloak from '../../config/keycloak';
import { getDocumentos, evaluarDocumentoEstado } from '../../api/documentos.api.js';
import { sanitizeUrl } from '../../utils/sanitizeUrl.js';
import { AdminCambiosPill, AdminCambiosResaltados } from '../../components/admin/AdminCambiosResaltados.jsx';
import '../../styles/pages/admin/AdminDocumentacionView.css';

const statusLabels = {
  PENDIENTE: 'Pendiente de aprobación',
  APROBADO: 'Aprobado',
  PUBLICADO: 'Publicado',
  RECHAZADO: 'Rechazado',
  BORRADOR: 'Borrador',
};

const mapDocumentFromBackend = (doc) => {
  const estadoUpper = (doc.estado || 'PENDIENTE_APROBACION').toUpperCase();

  let statusKey = 'PENDIENTE';
  if (estadoUpper === 'PUBLICADO') statusKey = 'PUBLICADO';
  else if (estadoUpper === 'APROBADO') statusKey = 'APROBADO';
  else if (estadoUpper === 'RECHAZADO') statusKey = 'RECHAZADO';
  else if (estadoUpper === 'BORRADOR') statusKey = 'BORRADOR';

  let fechaFormateada = 'Reciente';
  if (doc.createdAt) {
    try {
      fechaFormateada = new Date(doc.createdAt).toLocaleDateString('es-AR');
    } catch {
      // Fecha inválida: se muestra el texto por defecto.
    }
  }

  return {
    id: doc.id?.toString() || '',
    title: doc.title || doc.titulo || 'Sin título',
    solicitudEliminacion: doc.solicitudEliminacion || null,
    description: doc.description || doc.descripcion || '',
    category: doc.category || doc.categoria || 'Información institucional',
    fileName: doc.fileName || doc.nombreArchivo || 'documento.pdf',
    fileType: (doc.fileType || 'PDF').toUpperCase(),
    fileSize: doc.fileSize || '',
    fileUrl: doc.fileUrl || '',
    creator: doc.creator || doc.editor || 'Editor CMS',
    editedBy: doc.editedBy || null,
    createdAt: fechaFormateada,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('es-AR') : fechaFormateada,
    status: statusKey,
    estado: estadoUpper,
    rejectionReason: doc.rejectionReason || '',
    previewText: doc.description || 'Documento institucional para revisión y evaluación.',
    cambios: Array.isArray(doc.cambios) ? doc.cambios : [],
    esActualizacion: Boolean(doc.esActualizacion),
  };
};

const AdminDocumentacionView = ({ onPendingCountChange }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const syncPendingCount = useCallback(
    (list) => {
      if (typeof onPendingCountChange === 'function') {
        const count = list.filter((doc) => doc.status === 'PENDIENTE' || Boolean(doc.solicitudEliminacion)).length;
        onPendingCountChange(count);
      }
    },
    [onPendingCountChange]
  );

  const cargarDocumentos = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getDocumentos(true);
        if (Array.isArray(data)) {
          const mapeados = data
            .filter((doc) => (doc.estado || '').toUpperCase() !== 'BORRADOR')
            .map(mapDocumentFromBackend)
            .sort((a, b) => {
              const aPending = a.status === 'PENDIENTE' || a.solicitudEliminacion ? 0 : 1;
              const bPending = b.status === 'PENDIENTE' || b.solicitudEliminacion ? 0 : 1;
              if (aPending !== bPending) return aPending - bPending;
              return a.title.localeCompare(b.title);
            });

          setDocuments(mapeados);
          syncPendingCount(mapeados);
        } else {
          setDocuments([]);
          syncPendingCount([]);
        }
      } catch (error) {
        if (!silent) {
          console.error('Error al cargar documentos en el panel de administración:', error);
          toast.error('No se pudieron cargar los documentos para revisión.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [syncPendingCount]
  );

  useEffect(() => {
    cargarDocumentos(false);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        cargarDocumentos(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [cargarDocumentos]);

  const categories = useMemo(() => {
    const set = new Set();
    documents.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set).sort();
  }, [documents]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedId) || null,
    [documents, selectedId]
  );

  const isPdf = useMemo(() => {
    if (!selectedDocument) return false;
    const name = (selectedDocument.fileName || '').toLowerCase();
    const type = (selectedDocument.fileType || '').toLowerCase();
    const url = (selectedDocument.fileUrl || '').toLowerCase();
    return name.endsWith('.pdf') || type === 'pdf' || url.includes('.pdf');
  }, [selectedDocument]);

  const safeFileUrl = useMemo(() => {
    if (!selectedDocument?.fileUrl) return '';
    return sanitizeUrl(selectedDocument.fileUrl, '', { allowBlob: true });
  }, [selectedDocument]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');

    return documents.filter((doc) => {
      let matchesStatus = true;
      if (statusFilter === 'PENDIENTE') matchesStatus = doc.status === 'PENDIENTE' || Boolean(doc.solicitudEliminacion);
      else if (statusFilter === 'PUBLICADO') matchesStatus = doc.status === 'PUBLICADO' || doc.status === 'APROBADO';
      else if (statusFilter === 'RECHAZADO') matchesStatus = doc.status === 'RECHAZADO';

      const matchesCategory =
        categoryFilter === 'TODOS' || doc.category === categoryFilter;

      const searchableText = [
        doc.title,
        doc.description,
        doc.category,
        doc.fileName,
        doc.creator,
      ]
        .join(' ')
        .toLocaleLowerCase('es');

      return (
        matchesStatus &&
        matchesCategory &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [categoryFilter, documents, search, statusFilter]);

  const pendingCount = useMemo(
    () => documents.filter((doc) => doc.status === 'PENDIENTE' || Boolean(doc.solicitudEliminacion)).length,
    [documents]
  );
  const publishedCount = useMemo(
    () => documents.filter((doc) => doc.status === 'PUBLICADO' || doc.status === 'APROBADO').length,
    [documents]
  );
  const rejectedCount = useMemo(
    () => documents.filter((doc) => doc.status === 'RECHAZADO').length,
    [documents]
  );

  const closeDetails = () => {
    setSelectedId(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedDocument || selectedDocument.status !== 'PENDIENTE' || submitting) return;

    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }

      await evaluarDocumentoEstado(
        selectedDocument.id,
        { estado: 'APROBADO' },
        keycloak.token
      );

      toast.success(`“${selectedDocument.title}” fue aprobado y publicado.`);
      setFeedback(`“${selectedDocument.title}” fue aprobado y ya está visible en el portal.`);
      closeDetails();
      await cargarDocumentos(true);
    } catch (error) {
      console.error('Error al aprobar documento:', error);
      toast.error(mensajeDeError(error, 'Error al aprobar el documento.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || selectedDocument.status !== 'PENDIENTE' || submitting) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Debe ingresar el motivo del rechazo.');
      return;
    }

    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }

      await evaluarDocumentoEstado(
        selectedDocument.id,
        { estado: 'RECHAZADO', rejectionReason: reason },
        keycloak.token
      );

      toast.success(`“${selectedDocument.title}” fue rechazado.`);
      setFeedback(`“${selectedDocument.title}” fue rechazado y se enviaron las correcciones al CMS.`);
      closeDetails();
      await cargarDocumentos(true);
    } catch (error) {
      console.error('Error al rechazar documento:', error);
      toast.error(mensajeDeError(error, 'Error al rechazar el documento.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-doc-page">
      <header className="admin-doc-header admin-view-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="admin-doc-overtitle">PANEL DE CONTROL DIRECTIVO</span>
            <h1>Revisión de Documentación</h1>
            <p>Consultá y evaluá los documentos públicos enviados por el CMS para su aprobación.</p>
          </div>
          <button
            type="button"
            className="admin-doc-button admin-rev-button is-secondary"
            onClick={() => cargarDocumentos(false)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'center' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      {feedback && (
        <div className="admin-doc-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <div className="admin-doc-summary-toolbar">
        <button
          type="button"
          className={`admin-doc-reset-filter ${statusFilter === 'TODOS' ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'TODOS'}
          onClick={() => setStatusFilter('TODOS')}
        >
          Todos
        </button>
      </div>

      <section className="admin-doc-summary" aria-label="Filtrar documentos por estado">
        <button
          type="button"
          className={`admin-doc-summary-card is-pending ${statusFilter === 'PENDIENTE' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE'}
          onClick={() => setStatusFilter('PENDIENTE')}
        >
          <span><FolderOpen size={19} /></span>
          <div><small>Pendientes de aprobación</small><strong>{pendingCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-doc-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span><Globe2 size={19} /></span>
          <div><small>Publicados en el portal</small><strong>{publishedCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-doc-summary-card is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span><XCircle size={19} /></span>
          <div><small>Rechazados</small><strong>{rejectedCount}</strong></div>
        </button>
      </section>

      <section className="admin-doc-card" aria-labelledby="admin-doc-list-title">
        <div className="admin-doc-card-heading">
          <div>
            <h2 id="admin-doc-list-title">Listado de Documentos</h2>
            <p>Área de Revisión: Aprobación y rechazo de documentos recibidos desde el CMS</p>
          </div>
          <span className="admin-doc-result-count">
            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-doc-toolbar">
          <label className="admin-doc-search">
            <Search size={18} aria-hidden="true" />
            <span className="admin-doc-visually-hidden">Buscar documentos</span>
            <input
              type="search"
              placeholder="Buscar por título, categoría, archivo o creador..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="admin-doc-filter">
            <span>Categoría</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="TODOS">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-doc-table-wrap">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div className="cms-spinner" style={{ margin: '0 auto 15px auto', width: '36px', height: '36px' }}></div>
              <p>Cargando documentos para revisión...</p>
            </div>
          ) : (
            <table className="admin-doc-table">
              <thead>
                <tr>
                  <th scope="col">Documento / archivo</th>
                  <th scope="col">Editor / fecha</th>
                  <th scope="col">Categoría / tipo</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td data-label="Documento / archivo">
                      <div className="admin-doc-title-cell">
                        <span className={`admin-doc-file-icon is-${doc.fileType.toLowerCase()}`}>
                          <FileText size={18} />
                        </span>
                        <span>
                          <button
                            type="button"
                            className="admin-doc-title-button"
                            onClick={() => setSelectedId(doc.id)}
                          >
                            {doc.title}
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <small>{doc.fileName}</small>
                            <AdminCambiosPill count={doc.cambios?.length} esActualizacion={doc.esActualizacion} />
                          </div>
                        </span>
                      </div>
                    </td>
                    <td data-label="Editor / fecha">
                      <div className="admin-doc-creator-cell" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{doc.editor || doc.creator}</span>
                        <small style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }}><CalendarDays size={13} />{doc.updatedAt}</small>
                      </div>
                    </td>
                    <td data-label="Categoría / tipo">
                      <div className="admin-doc-category-cell">
                        <strong>{doc.category}</strong>
                        <small>{doc.fileType} {doc.fileSize ? `· ${doc.fileSize}` : ''}</small>
                      </div>
                    </td>
                    <td data-label="Estado">
                      {doc.solicitudEliminacion ? (
                        <EtiquetaEliminacion />
                      ) : (
                        <EtiquetaEstado estado={doc.status} texto={statusLabels[doc.status] || doc.status} />
                      )}
                      {doc.status === 'PENDIENTE' && (
                        <small className="admin-doc-cms-hint" style={{ color: '#d97706' }}>Requiere tu revisión</small>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td className="admin-doc-empty" colSpan="4">
                      No se encontraron documentos en esta vista.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedDocument && (
        <div className="admin-doc-overlay admin-rev-overlay admin-doc-rv-overlay" onClick={closeDetails}>
          <section
            className="admin-doc-modal admin-rev-modal admin-doc-rv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-doc-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-doc-rv-header">
              <h2 id="admin-doc-modal-title" className="admin-doc-rv-title">Revisión de documento</h2>
              <button type="button" className="admin-doc-rv-close" aria-label="Cerrar detalle" onClick={closeDetails}>
                <X size={20} />
              </button>
            </header>

            <div className="admin-doc-rv-body">
              <section className="admin-doc-rv-card admin-doc-rv-status">
                <span className="admin-doc-rv-status-label">Estado actual</span>
                <EtiquetaEstado estado={selectedDocument.status} texto={statusLabels[selectedDocument.status] || selectedDocument.status} />
              </section>

              <AdminCambiosResaltados
                cambios={selectedDocument.cambios}
                esActualizacion={selectedDocument.esActualizacion}
              />

              <section className="admin-doc-rv-card admin-doc-rv-title-card">
                <div className="admin-doc-rv-title-label">Título del documento</div>
                <h3 className="admin-doc-rv-doc-title">{selectedDocument.title}</h3>
              </section>

              <section className="admin-doc-rv-card admin-doc-rv-field">
                <div className="admin-doc-rv-field-label">Descripción</div>
                <p className="admin-doc-rv-field-text">{selectedDocument.description || 'Sin descripción detallada.'}</p>
              </section>

              <div className="admin-doc-rv-grid">
                <section className="admin-doc-rv-card admin-doc-rv-field">
                  <div className="admin-doc-rv-field-label">Categoría</div>
                  <p className="admin-doc-rv-field-text is-strong">{selectedDocument.category}</p>
                </section>
                <section className="admin-doc-rv-card admin-doc-rv-field">
                  <div className="admin-doc-rv-field-label">Tipo de documento</div>
                  <p className="admin-doc-rv-field-text is-strong is-upper">{selectedDocument.fileType}</p>
                </section>
              </div>

              <section className="admin-doc-rv-card admin-doc-rv-field">
                <div className="admin-doc-rv-field-label">Subido por</div>
                <p className="admin-doc-rv-field-text is-strong">{selectedDocument.creator}</p>
              </section>

              <section className="admin-doc-rv-card admin-doc-rv-field">
                <div className="admin-doc-rv-field-label">Archivo adjunto</div>
                {safeFileUrl ? (
                  <div className="admin-doc-rv-file">
                    <svg className="admin-doc-rv-file-icon" width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      />
                    </svg>
                    <span className="admin-doc-rv-file-name">{selectedDocument.fileName}</span>
                    {selectedDocument.fileSize && <span className="admin-doc-rv-file-size">· {selectedDocument.fileSize}</span>}
                  </div>
                ) : (
                  <p className="admin-doc-rv-field-text">Sin archivo adjunto</p>
                )}
              </section>

              <section className="admin-doc-rv-card admin-doc-rv-preview" aria-label="Vista previa del documento">
                <div className="admin-doc-rv-preview-header">
                  <div>
                    <h3 className="admin-doc-rv-preview-title">Vista previa del documento</h3>
                    <p className="admin-doc-rv-preview-sub">
                      {safeFileUrl
                        ? isPdf
                          ? 'Visualizador PDF integrado'
                          : 'Vista previa no disponible para este formato'
                        : 'Esperando archivo...'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-doc-rv-expand"
                    onClick={() => {
                      if (safeFileUrl) window.open(safeFileUrl, '_blank', 'noopener,noreferrer');
                    }}
                    disabled={!safeFileUrl}
                    aria-label="Abrir en pestaña nueva"
                    title="Abrir archivo en pestaña nueva"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="admin-doc-rv-viewer">
                  {safeFileUrl ? (
                    isPdf ? (
                      <iframe src={`${safeFileUrl}#toolbar=0`} title="Vista previa del documento" />
                    ) : (
                      <div className="admin-doc-rv-viewer-msg">
                        <FileText size={40} strokeWidth={1.5} />
                        <p>Archivo {selectedDocument.fileType || 'DOCX'} adjunto</p>
                        <span>La vista previa integrada está disponible para formato PDF. Usá el botón de arriba para abrir o descargar el archivo.</span>
                      </div>
                    )
                  ) : (
                    <div className="admin-doc-rv-viewer-msg">
                      <span>No hay archivo disponible para previsualizar.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="admin-doc-rv-card admin-doc-rv-audit">
                <div>
                  Enviado por <strong>{selectedDocument.editedBy || selectedDocument.creator}</strong>
                </div>
                <div>
                  Última modificación: <span className="admin-doc-rv-audit-date">{selectedDocument.updatedAt}</span>
                </div>
              </section>

              {selectedDocument.rejectionReason && (
                <div className="admin-rev-note">
                  <strong>Motivo del rechazo</strong>
                  <p>{selectedDocument.rejectionReason}</p>
                </div>
              )}

              {isRejecting && (
                <label className="admin-rev-field">
                  <span>Motivo del rechazo <b>(requerido)</b></span>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Indicá qué debe corregir el Editor CMS en este documento..."
                    rows="3"
                    autoFocus
                  />
                </label>
              )}

              {selectedDocument.solicitudEliminacion && (
                <div className="admin-rev-solicitud">
                  <SolicitudEliminacionAcciones
                    solicitud={selectedDocument.solicitudEliminacion}
                    entidad="documento"
                    id={selectedDocument.id}
                    titulo={selectedDocument.title}
                    onResuelto={async () => {
                      closeDetails();
                      await cargarDocumentos(true);
                    }}
                  />
                </div>
              )}
            </div>

            {selectedDocument.status === 'PENDIENTE' && (
              <footer className="admin-doc-rv-footer">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      className="admin-doc-rv-btn is-danger"
                      onClick={() => setIsRejecting(true)}
                      disabled={submitting}
                    >
                      <XCircle size={16} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="admin-doc-rv-btn is-primary"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <Check size={16} strokeWidth={2.5} /> {submitting ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-doc-rv-btn is-secondary"
                      onClick={() => {
                        setIsRejecting(false);
                        setRejectReason('');
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="admin-doc-rv-btn is-danger"
                      onClick={handleReject}
                      disabled={submitting || !rejectReason.trim()}
                    >
                      {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                  </>
                )}
              </footer>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentacionView;
