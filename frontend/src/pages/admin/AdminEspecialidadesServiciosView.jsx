import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  Clock3,
  Globe2,
  Search,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import keycloak from '../../config/keycloak';
import {
  getEspecialidades,
  evaluarEspecialidadEstado,
} from '../../api/especialidades.api.js';
import '../../styles/pages/admin/AdminEspecialidadesServiciosView.css';

const statusClass = (status) => {
  if (status === 'Aprobado' || status === 'Publicado') return 'admin-es-status-approved';
  if (status === 'Rechazado') return 'admin-es-status-rejected';
  return 'admin-es-status-pending';
};

const mapItemFromBackend = (item) => {
  const estadoUpper = (item.estado || 'PENDIENTE_APROBACION').toUpperCase();
  let statusLabel = 'Pendiente de aprobación';
  if (estadoUpper === 'PUBLICADO') {
    statusLabel = 'Publicado';
  } else if (estadoUpper === 'APROBADO') {
    statusLabel = 'Aprobado';
  } else if (estadoUpper === 'RECHAZADO') {
    statusLabel = 'Rechazado';
  }

  const reqText = Array.isArray(item.requisitos)
    ? item.requisitos.join('\n')
    : item.requisitos || '';

  return {
    id: item.id,
    name: item.nombre || '',
    type: item.esServicio ? 'Servicio' : 'Especialidad',
    esServicio: Boolean(item.esServicio),
    location: item.ubicacion || 'Sin ubicación asignada',
    description: item.descripcion || '',
    hours: item.horarios || '',
    requirements: reqText,
    documentation: item.documentacionNecesaria || '',
    referral: item.informacionDerivacion || '',
    editor: item.editor || 'Editor CMS',
    updatedAt: item.updatedAtFormatted || 'Reciente',
    status: statusLabel,
    estado: estadoUpper,
    published: estadoUpper === 'PUBLICADO',
    active: item.activo !== false,
    rejectionReason: item.rejectionReason || null,
  };
};

const AdminEspecialidadesServiciosView = ({ onPendingCountChange }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const syncPendingCount = useCallback(
    (list) => {
      if (typeof onPendingCountChange === 'function') {
        const count = list.filter(
          (item) => item.status === 'Pendiente de aprobación'
        ).length;
        onPendingCountChange(count);
      }
    },
    [onPendingCountChange]
  );

  const cargarDatos = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getEspecialidades(true);
        if (Array.isArray(data)) {
          // Excluimos registros archivados internamente por CMS (el Admin solo aprueba/rechaza revisiones)
          const filtradas = data
            .filter((item) => (item.estado || '').toUpperCase() !== 'ARCHIVADO')
            .map(mapItemFromBackend)
            .sort((a, b) => {
              const aPending = a.status === 'Pendiente de aprobación' ? 0 : 1;
              const bPending = b.status === 'Pendiente de aprobación' ? 0 : 1;
              if (aPending !== bPending) return aPending - bPending;
              return a.name.localeCompare(b.name);
            });
          setItems(filtradas);
          syncPendingCount(filtradas);
        } else {
          setItems([]);
          syncPendingCount([]);
        }
      } catch (error) {
        if (!silent) {
          console.error('Error al cargar especialidades y servicios:', error);
          toast.error('No se pudieron cargar los servicios y especialidades.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [syncPendingCount]
  );

  useEffect(() => {
    cargarDatos(false);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarDatos(true);
      }
    }, 60000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        cargarDatos(true);
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [cargarDatos]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    return items.filter((item) => {
      const matchesType = typeFilter === 'Todos' || item.type === typeFilter;
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'PENDIENTE' && item.status === 'Pendiente de aprobación') ||
        (statusFilter === 'APROBADO' && item.status === 'Aprobado') ||
        (statusFilter === 'PUBLICADO' && item.status === 'Publicado') ||
        (statusFilter === 'RECHAZADO' && item.status === 'Rechazado');
      const matchesSearch =
        !normalizedSearch ||
        `${item.name} ${item.location || ''} ${item.editor || ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedSearch);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter, typeFilter]);

  const closeDetails = () => {
    setSelectedItem(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedItem || submitting) return;
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      await evaluarEspecialidadEstado(
        selectedItem.id,
        { estado: 'APROBADO', isServicio: selectedItem.esServicio },
        keycloak.token
      );
      toast.success(`"${selectedItem.name}" fue aprobado y publicado.`);
      setFeedback(`"${selectedItem.name}" fue aprobado con éxito.`);
      closeDetails();
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error(error.response?.data?.error || 'Error al aprobar la información.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || submitting) return;
    if (!rejectReason.trim()) {
      toast.error('Ingresá un motivo para que el Editor CMS pueda corregir la información.');
      return;
    }
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      await evaluarEspecialidadEstado(
        selectedItem.id,
        {
          estado: 'RECHAZADO',
          rejectionReason: rejectReason.trim(),
          isServicio: selectedItem.esServicio,
        },
        keycloak.token
      );
      toast.success(`"${selectedItem.name}" fue rechazado. Se notificó al Editor CMS.`);
      setFeedback(`"${selectedItem.name}" fue rechazado.`);
      closeDetails();
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error(error.response?.data?.error || 'Error al rechazar la información.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = items.filter((item) => item.status === 'Pendiente de aprobación').length;
  const approvedCount = items.filter((item) => item.status === 'Aprobado').length;
  const publishedCount = items.filter((item) => item.status === 'Publicado').length;
  const rejectedCount = items.filter((item) => item.status === 'Rechazado').length;

  return (
    <div className="admin-es-page">
      <header className="admin-es-page-header admin-view-heading">
        <span className="admin-es-overtitle">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Revisión de Servicios y Especialidades</h1>
        <p>Evalúa las solicitudes enviadas por el equipo de redacción del CMS para decidir su aprobación o rechazo.</p>
      </header>

      {feedback && (
        <div className="admin-es-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-es-summary-toolbar">
        <button
          type="button"
          className={`admin-es-reset-filter ${statusFilter === 'Todos' ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'Todos'}
          onClick={() => setStatusFilter('Todos')}
        >
          Todos
        </button>
      </div>
      <section className="admin-es-summary" aria-label="Filtrar servicios y especialidades por estado">
        <button
          type="button"
          className={`admin-es-summary-card is-pending ${statusFilter === 'PENDIENTE' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE'}
          onClick={() => setStatusFilter('PENDIENTE')}
        >
          <span><Clock3 size={19} /></span>
          <div><small>Pendientes de aprobación</small><strong>{pendingCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-es-summary-card is-approved ${statusFilter === 'APROBADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APROBADO'}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span><BadgeCheck size={19} /></span>
          <div><small>Aprobados para CMS</small><strong>{approvedCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-es-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span><Globe2 size={19} /></span>
          <div><small>Visibles al público</small><strong>{publishedCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-es-summary-card is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span><XCircle size={19} /></span>
          <div><small>Rechazados</small><strong>{rejectedCount}</strong></div>
        </button>
      </section>

      <section className="admin-es-card" aria-labelledby="admin-es-list-title">
        <div className="admin-es-card-heading">
          <div>
            <h2 id="admin-es-list-title">Información para evaluación</h2>
            <p>Revisá descripciones, requisitos, horarios, ubicación y documentación médica antes de aprobar o rechazar.</p>
          </div>
          <span className="admin-es-result-count">
            {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-es-toolbar">
          <label className="admin-es-search">
            <Search size={18} aria-hidden="true" />
            <span className="admin-es-visually-hidden">Buscar por nombre, ubicación o editor</span>
            <input
              type="search"
              placeholder="Buscar servicios o especialidades..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="admin-es-filter">
            <span>Tipo</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option>Todos</option>
              <option>Servicio</option>
              <option>Especialidad</option>
            </select>
          </label>
        </div>

        <div className="admin-es-table-wrap">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div
                className="cms-spinner"
                style={{
                  width: '36px',
                  height: '36px',
                  margin: '0 auto 16px auto',
                  borderWidth: '3px',
                  borderTopColor: '#0c2340',
                }}
              ></div>
              <p style={{ fontSize: '0.95rem' }}>Cargando información médica y asistencial...</p>
            </div>
          ) : (
            <table className="admin-es-table">
              <thead>
                <tr>
                  <th scope="col">Servicio / Especialidad</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Editor / fecha</th>
                  <th scope="col">Revisión</th>
                  <th scope="col">Publicación</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={`${item.esServicio ? 'srv' : 'esp'}-${item.id}`}>
                    <td>
                      <button
                        type="button"
                        className="admin-es-name-button"
                        onClick={() => setSelectedItem(item)}
                      >
                        <span className="admin-es-item-icon">
                          <Stethoscope size={18} />
                        </span>
                        <span>{item.name}</span>
                      </button>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.location}</td>
                    <td data-label="Editor / fecha">
                      <div className="admin-es-editor-cell" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#0c2340' }}>{item.editor}</span>
                        <small style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                          <CalendarDays size={13} />
                          {item.updatedAt}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-es-status ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-es-publication ${item.status === 'Publicado' || item.status === 'Aprobado' ? 'is-published' : ''}`}>
                        {item.status === 'Publicado'
                          ? 'Publicado'
                          : item.status === 'Aprobado'
                          ? 'Disponible para CMS'
                          : 'No disponible'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td className="admin-es-empty" colSpan="6">
                      No se encontraron servicios o especialidades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedItem && (
        <div className="admin-es-modal-overlay" onClick={closeDetails}>
          <section
            className="admin-es-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-es-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-es-modal-header">
              <div>
                <span>
                  {selectedItem.type} · {selectedItem.location}
                </span>
                <h2 id="admin-es-modal-title">{selectedItem.name}</h2>
              </div>
              <button
                type="button"
                className="admin-es-close-button"
                aria-label="Cerrar detalle"
                onClick={closeDetails}
              >
                <X size={20} />
              </button>
            </header>

            <div className="admin-es-modal-body">
              <div className="admin-es-detail-grid">
                <article className="admin-es-detail admin-es-detail-wide">
                  <h3>Descripción</h3>
                  <p>{selectedItem.description || 'Sin descripción cargada.'}</p>
                </article>
                <article className="admin-es-detail">
                  <h3>Horarios</h3>
                  <p>{selectedItem.hours || 'Sin información cargada.'}</p>
                </article>
                <article className="admin-es-detail">
                  <h3>Ubicación</h3>
                  <p>{selectedItem.location || 'Sin información cargada.'}</p>
                </article>
                <article className="admin-es-detail">
                  <h3>Requisitos</h3>
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {selectedItem.requirements || 'Sin información cargada.'}
                  </p>
                </article>
                <article className="admin-es-detail">
                  <h3>Documentación necesaria</h3>
                  <p>{selectedItem.documentation || 'Sin información cargada.'}</p>
                </article>
                <article className="admin-es-detail admin-es-detail-wide">
                  <h3>Información de derivación</h3>
                  <p>{selectedItem.referral || 'Sin información cargada.'}</p>
                </article>
              </div>

              <div className="admin-es-review-meta">
                <span>
                  Enviado por <strong>{selectedItem.editor}</strong>
                </span>
                <span>
                  Última modificación: <strong>{selectedItem.updatedAt}</strong>
                </span>
                <span>
                  Estado: <strong>{selectedItem.status}</strong>
                </span>
                {selectedItem.rejectionReason && (
                  <span style={{ color: '#b91c1c' }}>
                    Motivo del rechazo: <strong>{selectedItem.rejectionReason}</strong>
                  </span>
                )}
              </div>

              {isRejecting && (
                <label className="admin-es-rejection-field">
                  <span>Motivo del rechazo (requerido)</span>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Indicá qué debe corregir el Editor CMS..."
                    rows="3"
                    autoFocus
                  />
                </label>
              )}
            </div>

            <footer className="admin-es-modal-footer">
              {selectedItem.status === 'Pendiente de aprobación' && !isRejecting && (
                <>
                  <button
                    type="button"
                    className="admin-es-button admin-es-button-danger"
                    onClick={() => setIsRejecting(true)}
                    disabled={submitting}
                  >
                    <XCircle size={17} /> Rechazar
                  </button>
                  <button
                    type="button"
                    className="admin-es-button admin-es-button-primary"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    <CheckCircle size={17} /> Aprobar
                  </button>
                </>
              )}
              {isRejecting && (
                <>
                  <button
                    type="button"
                    className="admin-es-button admin-es-button-secondary"
                    onClick={() => setIsRejecting(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-es-button admin-es-button-danger"
                    onClick={handleReject}
                    disabled={submitting}
                  >
                    Confirmar rechazo
                  </button>
                </>
              )}
              {selectedItem.status !== 'Pendiente de aprobación' && !isRejecting && (
                <button
                  type="button"
                  className="admin-es-button admin-es-button-secondary"
                  onClick={closeDetails}
                >
                  Cerrar
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminEspecialidadesServiciosView;
