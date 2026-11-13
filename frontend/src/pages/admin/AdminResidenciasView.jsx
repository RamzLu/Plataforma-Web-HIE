import SolicitudEliminacionAcciones from "../../components/admin/SolicitudEliminacionAcciones";
import { mensajeDeError } from "../../utils/mensajeDeError";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  Clock3,
  ExternalLink,
  File,
  FileText,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  ListChecks,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import keycloak from '../../config/keycloak';
import { cambiarEstadoResidencia, getResidencias } from '../../api/residencias.api';
import { sanitizeUrl } from '../../utils/sanitizeUrl';
import {
  AdminCambiosPill,
  AdminCambiosResaltados,
} from '../../components/admin/AdminCambiosResaltados';
import '../../styles/pages/admin/AdminResidenciasView.css';

const STATUS_LABELS = {
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  APROBADO: 'Aprobada',
  PUBLICADO: 'Publicada',
  RECHAZADO: 'Rechazada',
  ARCHIVADO: 'Archivada',
  BORRADOR: 'Borrador',
  PROGRAMADO: 'Programada',
};

const parseDate = (value) => {
  if (!value) return null;
  const dateKey = String(value).slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
    ? new Date(`${dateKey}T00:00:00`)
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return 'A confirmar';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStartDateValue = (residencia) =>
  residencia?.fechaInicio ||
  residencia?.fechaInicioVigencia ||
  residencia?.createdAt ||
  '';

const normalizeConvocatoria = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Abierta';
  const lower = raw.toLowerCase();
  if (lower.includes('cerrad')) return 'Cerrada';
  if (lower.includes('proxim') || lower.includes('próxim')) return 'Próximamente';
  if (lower.includes('abiert') || lower.includes('activ')) return 'Abierta';
  return raw;
};

const isConvocatoriaVigente = (residencia, hoy = new Date()) => {
  if (!residencia) return false;
  if (residencia.estado === 'ARCHIVADO' || residencia.estado === 'RECHAZADO') return false;
  const etiqueta = normalizeConvocatoria(residencia?.convocatoria);
  if (etiqueta !== 'Abierta') return false;

  const fin = parseDate(residencia?.fechaConvocatoria);
  if (!fin) return true;

  const finDelDia = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59, 59);
  return hoy <= finDelDia;
};

const formatVigencia = (residencia) => {
  if (!residencia) return 'Fechas a confirmar';
  const startRaw = getStartDateValue(residencia);
  const inicio = startRaw ? formatDate(startRaw) : '';
  const fin = residencia?.fechaConvocatoria
    ? formatDate(residencia.fechaConvocatoria)
    : '';

  if (inicio && fin) return `Inicio: ${inicio} – Cierre: ${fin}`;
  if (inicio) return `Inicio: ${inicio}`;
  if (fin) return `Cierre / Examen: ${fin}`;
  return 'Fechas a confirmar';
};

const normalizeResidenciaRecord = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const estadoUpper = String(raw.estado || 'PENDIENTE_APROBACION')
    .trim()
    .toUpperCase();
  const startDate =
    raw.fechaInicio ||
    raw.fechaInicioVigencia ||
    (raw.createdAt ? String(raw.createdAt).slice(0, 10) : '');

  return {
    ...raw,
    id: raw.id ? String(raw.id) : `res-${Math.random().toString(36).slice(2, 9)}`,
    nombre: raw.nombre || 'Residencia sin título',
    categoria:
      raw.categoria ||
      'Formación Médica de Posgrado - Ministerio de Desarrollo Humano',
    fechaInicio: startDate,
    fechaInicioVigencia: startDate,
    fechaConvocatoria: raw.fechaConvocatoria || '',
    convocatoria: normalizeConvocatoria(raw.convocatoria),
    descripcion: raw.descripcion || '',
    descripcionPrograma: raw.descripcionPrograma || '',
    cupos: raw.cupos || '',
    duracion: raw.duracion || '4 Años • Sede Hospital Interdistrital Evita',
    requisitos: raw.requisitos || '',
    reglamentoRotacion:
      raw.reglamentoRotacion ||
      'Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia.',
    estado: STATUS_LABELS[estadoUpper] ? estadoUpper : 'PENDIENTE_APROBACION',
    bannerNombre: raw.bannerNombre || '',
    bannerUrl: raw.bannerUrl || '',
    documentoNombre: raw.documentoNombre || '',
    documentoTamano: raw.documentoTamano || '',
    documentoTipo: raw.documentoTipo || 'PDF',
    documentoUrl: raw.documentoUrl || '',
    fechaPublicacion: raw.fechaPublicacion || raw.fechaProgramada || null,
    requestedEstado: raw.requestedEstado || null,
    motivoRechazo: raw.motivoRechazo || raw.rejectionReason || '',
    rejectionReason: raw.rejectionReason || raw.motivoRechazo || '',
    editor: raw.editor || 'Editor CMS',
    fechaCarga: raw.fechaCarga || 'Reciente',
    fechaActualizacion: raw.fechaActualizacion || raw.fechaCarga || 'Reciente',
    cambios: Array.isArray(raw.cambios) ? raw.cambios : [],
    esActualizacion: Boolean(raw.esActualizacion),
  };
};

const AdminResidenciasView = ({ onPendingCountChange } = {}) => {
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const cargarResidencias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResidencias(true);
      if (!Array.isArray(data)) {
        setResidencias([]);
        return;
      }

      const normalizadas = data
        .map(normalizeResidenciaRecord)
        .filter(Boolean);

      setResidencias(normalizadas);
    } catch (loadError) {
      console.error('Error al cargar residencias:', loadError);
      setResidencias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarResidencias();
  }, [cargarResidencias]);

  const residenciasVisibles = useMemo(
    () =>
      (Array.isArray(residencias) ? residencias : []).filter(
        (item) => item && item.estado !== 'BORRADOR',
      ),
    [residencias],
  );

  const counts = useMemo(
    () => ({
      // Las solicitudes de eliminación también esperan respuesta del admin: cuentan como pendientes.
      pending: residenciasVisibles.filter(
        (r) => r?.estado === 'PENDIENTE_APROBACION' || Boolean(r?.solicitudEliminacion)
      ).length,
      approved: residenciasVisibles.filter((r) => r?.estado === 'APROBADO').length,
      published: residenciasVisibles.filter((r) => r?.estado === 'PUBLICADO').length,
      scheduled: residenciasVisibles.filter((r) => r?.estado === 'PROGRAMADO').length,
      rejected: residenciasVisibles.filter((r) => r?.estado === 'RECHAZADO').length,
      archived: residenciasVisibles.filter((r) => r?.estado === 'ARCHIVADO').length,
    }),
    [residenciasVisibles],
  );

  useEffect(() => {
    if (typeof onPendingCountChange === 'function') {
      onPendingCountChange(counts.pending);
    }
  }, [counts.pending, onPendingCountChange]);

  const filteredResidencias = useMemo(() => {
    const query = (search || '').trim().toLocaleLowerCase('es');
    return residenciasVisibles.filter((item) => {
      const matchesStatus =
        statusFilter === 'TODOS' ||
        item?.estado === statusFilter ||
        (statusFilter === 'PENDIENTE_APROBACION' && Boolean(item?.solicitudEliminacion));
      const searchableContent = [
        item?.nombre,
        item?.categoria,
        item?.convocatoria,
        item?.descripcion,
        item?.descripcionPrograma,
        item?.duracion,
        item?.cupos,
        item?.documentoNombre,
        item?.fechaInicio,
        item?.fechaConvocatoria,
        item?.editor,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');

      return matchesStatus && (!query || searchableContent.includes(query));
    });
  }, [residenciasVisibles, search, statusFilter]);

  const selectedResidencia = useMemo(
    () => residenciasVisibles.find((item) => item?.id === selectedId) || null,
    [residenciasVisibles, selectedId],
  );

  const closeDetails = () => {
    setSelectedId(null);
    setShowRejectForm(false);
    setRejectReason('');
    setActionError('');
  };

  useEffect(() => {
    if (!selectedResidencia) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        closeDetails();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedResidencia, isSaving]);

  const openReview = (id) => {
    if (!id) return;
    setSelectedId(id);
    setShowRejectForm(false);
    setRejectReason('');
    setActionError('');
  };

  const resetFilters = () => {
    setStatusFilter('TODOS');
    setSearch('');
  };

  const handleApprove = async () => {
    if (!selectedResidencia || isSaving) return;
    setIsSaving(true);
    setActionError('');

    try {
      const isArchiving = selectedResidencia?.requestedEstado === 'ARCHIVADO';
      const isScheduling =
        selectedResidencia?.requestedEstado === 'PROGRAMADO' ||
        Boolean(selectedResidencia?.fechaPublicacion && new Date(selectedResidencia.fechaPublicacion) > new Date());
      const finalEstado = isArchiving ? 'ARCHIVADO' : isScheduling ? 'PROGRAMADO' : 'PUBLICADO';
      const token = keycloak?.token || localStorage.getItem('token') || '';

      await cambiarEstadoResidencia(selectedResidencia.id, 'APROBADO', token);

      setResidencias((current) =>
        current.map((item) =>
          item?.id === selectedResidencia.id
            ? {
                ...item,
                estado: finalEstado,
                motivoRechazo: '',
                rejectionReason: '',
                requestedEstado: null,
                cambios: [],
                esActualizacion: false,
              }
            : item,
        ),
      );

      setFeedback(
        isArchiving
          ? `La residencia “${selectedResidencia?.nombre || 'Residencia'}” fue archivada con éxito.`
          : isScheduling
          ? `La residencia “${selectedResidencia?.nombre || 'Residencia'}” fue aprobada y programada correctamente.`
          : `La solicitud de “${selectedResidencia?.nombre || 'Residencia'}” fue aprobada correctamente.`
      );
      closeDetails();
    } catch (err) {
      console.error('Error al aprobar la residencia:', err);
      setActionError(
        mensajeDeError(err, 'No se pudo aprobar la solicitud de residencia.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedResidencia || isSaving) return;
    const reason = (rejectReason || '').trim();
    if (!reason) {
      setActionError('Ingresá el motivo del rechazo para notificar al editor del CMS.');
      return;
    }

    setIsSaving(true);
    setActionError('');

    try {
      const token = keycloak?.token || localStorage.getItem('token') || '';
      await cambiarEstadoResidencia(selectedResidencia.id, 'RECHAZADO', token, reason);

      setResidencias((current) =>
        current.map((item) =>
          item?.id === selectedResidencia.id
            ? {
                ...item,
                estado: 'RECHAZADO',
                motivoRechazo: reason,
                rejectionReason: reason,
                requestedEstado: null,
              }
            : item,
        ),
      );

      setFeedback(
        `La solicitud de “${selectedResidencia?.nombre || 'Residencia'}” fue rechazada y se adjuntó el motivo para el CMS.`,
      );
      closeDetails();
    } catch (err) {
      console.error('Error al rechazar la residencia:', err);
      setActionError(
        mensajeDeError(err, 'No se pudo registrar el rechazo de la residencia.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const requisitosList = useMemo(() => {
    const raw = selectedResidencia?.requisitos || '';
    return String(raw)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [selectedResidencia]);

  const bannerUrlSafe = sanitizeUrl(selectedResidencia?.bannerUrl);
  const documentoUrlSafe = sanitizeUrl(selectedResidencia?.documentoUrl);
  const isSelectedPending = selectedResidencia?.estado === 'PENDIENTE_APROBACION';
  const isSelectedVigente = selectedResidencia ? isConvocatoriaVigente(selectedResidencia) : false;

  const convLabelSelected = selectedResidencia ? normalizeConvocatoria(selectedResidencia?.convocatoria) : 'Abierta';
  const convSlugSelected = convLabelSelected
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return (
    <div className="admin-res-page-admin admin-review-container-admin">
      <header className="admin-page-header-admin admin-view-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="admin-overtitle-admin">GESTIÓN ACADÉMICA Y FORMATIVA</span>
            <h1>Gestión de Residencias Públicas</h1>
            <p>
              Revisá las convocatorias, programas formativos y documentación antes de aprobarlos para su publicación en el portal.
            </p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={cargarResidencias}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      {feedback && (
        <div className="admin-res-feedback-admin" role="status">
          <span>{feedback}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setFeedback('')}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="admin-res-summary-toolbar-admin">
        <button
          type="button"
          className={`admin-res-reset-filter-admin ${statusFilter === 'TODOS' && !search ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'TODOS' && !search}
          onClick={resetFilters}
        >
          Todos
        </button>
      </div>

      <section
        className="admin-res-summary-admin"
        aria-label="Filtrar residencias por estado"
      >
        <button
          type="button"
          className={`admin-res-summary-card-admin is-pending ${statusFilter === 'PENDIENTE_APROBACION' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE_APROBACION'}
          onClick={() => setStatusFilter('PENDIENTE_APROBACION')}
        >
          <span>
            <Clock3 size={19} />
          </span>
          <div>
            <small>Pendientes de revisión</small>
            <strong>{counts.pending}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`admin-res-summary-card-admin is-approved ${statusFilter === 'APROBADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APROBADO'}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span>
            <CheckCircle size={19} />
          </span>
          <div>
            <small>Aprobadas</small>
            <strong>{counts.approved}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`admin-res-summary-card-admin is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span>
            <Globe2 size={19} />
          </span>
          <div>
            <small>Publicadas</small>
            <strong>{counts.published}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`admin-res-summary-card-admin is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span>
            <XCircle size={19} />
          </span>
          <div>
            <small>Rechazadas</small>
            <strong>{counts.rejected}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`admin-res-summary-card-admin is-archived ${statusFilter === 'ARCHIVADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'ARCHIVADO'}
          onClick={() => setStatusFilter('ARCHIVADO')}
        >
          <span>
            <Archive size={19} />
          </span>
          <div>
            <small>Archivadas</small>
            <strong>{counts.archived}</strong>
          </div>
        </button>
      </section>

      <section
        className="dashboard-card-admin admin-res-card-admin"
        aria-labelledby="admin-res-list-title"
      >
        <div className="admin-res-card-heading-admin">
          <div>
            <h2 className="dashboard-card-title-admin" id="admin-res-list-title">
              Listado de Residencias
            </h2>
            <p className="news-view-subtitle-admin">
              Área de Revisión: Aprobación y publicación de Residencias
            </p>
          </div>
          <span className="admin-res-result-count-admin">
            {filteredResidencias.length}{' '}
            {filteredResidencias.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-res-toolbar-admin">
          <label className="admin-res-search-admin">
            <Search size={18} aria-hidden="true" />
            <span className="admin-res-visually-hidden-admin">Buscar residencias</span>
            <input
              type="search"
              placeholder="Buscar por residencia, especialidad, categoría, editor o convocatoria..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-res-table-wrap-admin">
          <table className="admin-res-table-admin">
            <thead>
              <tr>
                <th scope="col">Residencia / Especialidad</th>
                <th scope="col">Editor / Fecha</th>
                <th scope="col">Convocatoria</th>
                <th scope="col">Fecha de Inicio / Vigencia</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="admin-res-empty-admin" colSpan="5">
                    Cargando residencias...
                  </td>
                </tr>
              ) : filteredResidencias.length === 0 ? (
                <tr>
                  <td className="admin-res-empty-admin" colSpan="5">
                    No se encontraron residencias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredResidencias.map((item) => {
                  const vigente = isConvocatoriaVigente(item);
                  const convLabel = normalizeConvocatoria(item?.convocatoria);
                  const convSlug = convLabel
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                  const thumbUrl = sanitizeUrl(item?.bannerUrl);

                  return (
                    <tr
                      key={item?.id}
                      className={`admin-res-row-clickable-admin ${vigente ? 'is-vigente' : ''}`}
                      onClick={() => openReview(item?.id)}
                    >
                      <td data-label="Residencia / Especialidad">
                        <div className="admin-res-title-cell-admin">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt="" loading="lazy" />
                          ) : (
                            <span
                              className="admin-res-placeholder-admin"
                              aria-hidden="true"
                            >
                              <GraduationCap size={19} />
                            </span>
                          )}
                          <span>
                            <button
                              type="button"
                              className="admin-res-title-button-admin"
                              onClick={(event) => {
                                event.stopPropagation();
                                openReview(item?.id);
                              }}
                            >
                              {item?.nombre || 'Residencia sin nombre'}
                            </button>
                            <small>
                              {item?.categoria || 'Formación Médica de Posgrado'}
                              {item?.duracion ? ` • ${item.duracion}` : ''}
                            </small>
                            <AdminCambiosPill
                              count={item?.cambios?.length}
                              esActualizacion={item?.esActualizacion}
                            />
                          </span>
                        </div>
                      </td>

                      <td data-label="Editor / Fecha">
                        <div className="admin-res-editor-cell" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                            {item?.editor || 'Editor CMS'}
                          </span>
                          <small style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 500 }}>
                            <CalendarDays size={13} />
                            {item?.fechaActualizacion || item?.fechaCarga || 'Reciente'}
                          </small>
                        </div>
                      </td>

                      <td data-label="Convocatoria">
                        <div className="admin-res-conv-cell-admin">
                          <span className={`admin-res-call-badge-admin is-${convSlug}`}>
                            {convLabel}
                          </span>
                          {item?.cupos && (
                            <small className="admin-res-cupos-meta-admin">
                              <Users size={13} aria-hidden="true" />
                              {item.cupos}
                            </small>
                          )}
                        </div>
                      </td>

                      <td data-label="Fecha de Inicio / Vigencia">
                        <div className="admin-res-meta-cell-admin">
                          <span>
                            <CalendarDays size={14} aria-hidden="true" />
                            {formatVigencia(item)}
                          </span>
                          {vigente && (
                            <span className="admin-res-vigente-badge-admin">
                              <span
                                className="admin-res-pulse-admin"
                                aria-hidden="true"
                              />
                              Convocatoria vigente
                            </span>
                          )}
                        </div>
                      </td>

                      <td data-label="Estado">
                        <span
                          className={`admin-res-status-admin is-${(item?.estado || 'borrador').toLowerCase()}`}
                        >
                          {STATUS_LABELS[item?.estado] || item?.estado || 'Sin estado'}
                        </span>
                        {item.solicitudEliminacion && (
                        <SolicitudEliminacionAcciones
                          solicitud={item.solicitudEliminacion}
                          entidad="residencia"
                          id={item.id}
                          titulo={item.nombre}
                          onResuelto={() => cargarResidencias()}
                        />
                      )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL DE REVISIÓN REDISEÑADO • ELEGANTE, CLARO Y ARMONIOSO */}
      {selectedResidencia && (
        <div className="admin-res-overlay-admin" onClick={closeDetails}>
          <section
            className="admin-res-modal-admin"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-res-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header del Modal */}
            <header className="admin-res-modal-header-admin">
              <div className="admin-res-modal-heading-admin">
                <span className="admin-res-modal-kicker-admin">
                  REVISIÓN EDITORIAL • PROGRAMA FORMATIVO DE POSGRADO
                </span>
                <div className="admin-res-title-row-admin">
                  <h2 id="admin-res-modal-title">
                    {selectedResidencia?.nombre || 'Residencia'}
                  </h2>
                  <span
                    className={`admin-res-status-admin is-${(selectedResidencia?.estado || 'borrador').toLowerCase()}`}
                  >
                    {STATUS_LABELS[selectedResidencia?.estado] ||
                      selectedResidencia?.estado ||
                      'Sin estado'}
                  </span>
                  <span className={`admin-res-call-badge-admin is-${convSlugSelected}`}>
                    {convLabelSelected}
                  </span>
                  {isSelectedVigente && (
                    <span className="admin-res-vigente-badge-admin">
                      <span className="admin-res-pulse-admin" aria-hidden="true" />
                      Convocatoria vigente
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="admin-res-modal-close-btn"
                aria-label="Cerrar detalle"
                onClick={closeDetails}
              >
                <X size={20} />
              </button>
            </header>

            {/* Cuerpo del Modal */}
            <div className="admin-res-modal-body-admin">
              {/* Alerta de Solicitud de Archivado */}
              {isSelectedPending && selectedResidencia?.requestedEstado === 'ARCHIVADO' && (
                <div className="admin-res-archive-alert">
                  <Archive size={18} className="admin-res-archive-alert-icon" />
                  <div>
                    <strong>Solicitud de archivado:</strong> El editor del CMS solicita archivar esta residencia y retirarla del portal público.
                  </div>
                </div>
              )}

              {/* Alerta de Publicación Programada */}
              {selectedResidencia?.fechaPublicacion && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.85rem',
                  }}
                >
                  <Clock3 size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <strong>Publicación programada:</strong> Esta residencia se publicará automáticamente en el portal el{' '}
                    <strong>{new Date(selectedResidencia.fechaPublicacion).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}</strong>.
                  </div>
                </div>
              )}

              {/* Cambios resaltados de edición */}
              <AdminCambiosResaltados
                cambios={selectedResidencia.cambios}
                esActualizacion={selectedResidencia.esActualizacion}
              />

              {/* Alerta de Rechazo Previo */}
              {(selectedResidencia?.motivoRechazo || selectedResidencia?.rejectionReason) && (
                <div className="admin-res-rejection-note-admin">
                  <strong>Motivo de rechazo registrado</strong>
                  <p>{selectedResidencia?.motivoRechazo || selectedResidencia?.rejectionReason}</p>
                </div>
              )}

              {/* BLOQUE 1: Ficha Clave / Datos de Convocatoria (4 columnas limpias) */}
              <div className="admin-res-summary-strip">
                <div className="admin-res-summary-strip-item">
                  <div className="admin-res-strip-icon-wrap">
                    <Building2 size={16} />
                  </div>
                  <div className="admin-res-strip-info">
                    <span className="admin-res-strip-label">Categoría Institucional</span>
                    <strong className="admin-res-strip-value" title={selectedResidencia?.categoria}>
                      {selectedResidencia?.categoria || 'Formación Médica de Posgrado'}
                    </strong>
                  </div>
                </div>

                <div className="admin-res-summary-strip-item">
                  <div className="admin-res-strip-icon-wrap">
                    <CalendarDays size={16} />
                  </div>
                  <div className="admin-res-strip-info">
                    <span className="admin-res-strip-label">Período de Convocatoria</span>
                    <strong className="admin-res-strip-value">
                      {formatDate(getStartDateValue(selectedResidencia))} → {formatDate(selectedResidencia?.fechaConvocatoria)}
                    </strong>
                  </div>
                </div>

                <div className="admin-res-summary-strip-item">
                  <div className="admin-res-strip-icon-wrap">
                    <Clock3 size={16} />
                  </div>
                  <div className="admin-res-strip-info">
                    <span className="admin-res-strip-label">Duración y Cupos</span>
                    <strong className="admin-res-strip-value">
                      {selectedResidencia?.duracion || '4 Años'}
                      {selectedResidencia?.cupos ? ` • ${selectedResidencia.cupos}` : ''}
                    </strong>
                  </div>
                </div>

                <div className="admin-res-summary-strip-item">
                  <div className="admin-res-strip-icon-wrap">
                    <CheckCircle size={16} />
                  </div>
                  <div className="admin-res-strip-info">
                    <span className="admin-res-strip-label">Estado del Llamado</span>
                    <strong className="admin-res-strip-value">
                      {convLabelSelected}
                    </strong>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: Contenido y Programa Académico */}
              <div className="admin-res-section-card">
                <div className="admin-res-section-card-header">
                  <div className="admin-res-section-card-title">
                    <BookOpen size={18} />
                    <h3>Programa Formativo y Contenido Académico</h3>
                  </div>
                </div>
                <div className="admin-res-section-card-body">
                  {selectedResidencia?.descripcion && (
                    <div className="admin-res-lead-callout">
                      <span className="admin-res-lead-callout-tag">Resumen Breve del Encabezado</span>
                      <p>{selectedResidencia.descripcion}</p>
                    </div>
                  )}

                  <div className="admin-res-program-desc">
                    <h4 className="admin-res-subheading">Descripción del Programa Académico</h4>
                    <p className="admin-res-preline-admin">
                      {selectedResidencia?.descripcionPrograma ||
                        'Sin descripción detallada del programa académico informada por el editor.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: Requisitos de Postulación */}
              <div className="admin-res-section-card">
                <div className="admin-res-section-card-header">
                  <div className="admin-res-section-card-title">
                    <ListChecks size={18} />
                    <h3>Requisitos para la Postulación Provincial</h3>
                  </div>
                  {requisitosList.length > 0 && (
                    <span className="admin-res-counter-badge">
                      {requisitosList.length} {requisitosList.length === 1 ? 'requisito' : 'requisitos'}
                    </span>
                  )}
                </div>
                <div className="admin-res-section-card-body">
                  {requisitosList.length > 0 ? (
                    <ul className="admin-res-checklist">
                      {requisitosList.map((reqItem, index) => (
                        <li key={`${index}-${reqItem.slice(0, 20)}`} className="admin-res-checklist-item">
                          <span className="admin-res-check-icon">
                            <Check size={14} />
                          </span>
                          <span>{reqItem}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-res-empty-hint">No se registraron requisitos específicos para esta postulación.</p>
                  )}
                </div>
              </div>

              {/* BLOQUE 4: Recursos y Documentos Oficiales (2 columnas armonizadas) */}
              <div className="admin-res-section-card">
                <div className="admin-res-section-card-header">
                  <div className="admin-res-section-card-title">
                    <FileText size={18} />
                    <h3>Recursos y Documentos Asociados</h3>
                  </div>
                </div>
                <div className="admin-res-resources-split">
                  {/* Banner / Portada */}
                  <div className="admin-res-resource-box">
                    <span className="admin-res-resource-box-title">Imagen de Banner / Portada</span>
                    {bannerUrlSafe ? (
                      <div className="admin-res-banner-preview-box">
                        <img
                          src={bannerUrlSafe}
                          alt={selectedResidencia?.bannerNombre || 'Imagen de portada'}
                          className="admin-res-banner-img"
                        />
                        <div className="admin-res-banner-meta">
                          <span className="admin-res-banner-name" title={selectedResidencia?.bannerNombre}>
                            <ImageIcon size={14} />
                            {selectedResidencia?.bannerNombre || 'Banner de portada'}
                          </span>
                          <a
                            href={bannerUrlSafe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-res-open-link"
                          >
                            Ver completa <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-res-banner-placeholder">
                        <ImageIcon size={28} />
                        <span>No se adjuntó imagen de portada para esta residencia.</span>
                      </div>
                    )}
                  </div>

                  {/* Documento y Leyenda */}
                  <div className="admin-res-resource-box">
                    <span className="admin-res-resource-box-title">Reglamento y Documento Oficial</span>
                    <div className="admin-res-doc-card">
                      <div className="admin-res-doc-legend">
                        <span className="admin-res-legend-label">Leyenda configurada en CMS:</span>
                        <p>
                          {selectedResidencia?.reglamentoRotacion ||
                            'Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia.'}
                        </p>
                      </div>

                      {documentoUrlSafe || selectedResidencia?.documentoNombre ? (
                        <div className="res-file-selected-card">
                          <div className="res-file-selected-left">
                            <div
                              className={`res-file-type-icon ${String(selectedResidencia?.documentoNombre || '').toLowerCase().endsWith('.doc') || String(selectedResidencia?.documentoNombre || '').toLowerCase().endsWith('.docx') ? 'doc' : 'pdf'}`}
                            >
                              <FileText size={18} />
                            </div>
                            <div className="res-file-meta">
                              <span
                                className="res-file-name"
                                title={selectedResidencia?.documentoNombre || 'Documento adjunto'}
                              >
                                {selectedResidencia?.documentoNombre || 'Documento adjunto'}
                              </span>
                              <span className="res-file-size">
                                {selectedResidencia?.documentoTamano || 'Documento disponible'} • Formato{' '}
                                {selectedResidencia?.documentoTipo || 'PDF'}
                              </span>
                            </div>
                          </div>

                          {documentoUrlSafe && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <a
                                href={documentoUrlSafe}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-res-file-btn"
                                title="Visualizar documento"
                              >
                                <File size={16} />
                              </a>
                              <a
                                href={documentoUrlSafe}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-res-file-btn secondary"
                                title="Abrir en pestaña nueva"
                              >
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="admin-res-doc-empty">
                          <FileText size={20} />
                          <span>No se adjuntó documento PDF del programa.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 5: Metadatos Editoriales */}
              <div className="admin-res-review-meta">
                <span>
                  Enviado por: <strong>{selectedResidencia.editor || 'Editor CMS'}</strong>
                </span>
                <span>
                  Última modificación: <strong>{selectedResidencia.fechaActualizacion || 'Reciente'}</strong>
                </span>
                <span>
                  Estado editorial: <strong>{STATUS_LABELS[selectedResidencia.estado] || selectedResidencia.estado}</strong>
                </span>
              </div>

              {/* Formulario de Rechazo inline */}
              {isSelectedPending && showRejectForm && (
                <div
                  className="admin-res-confirmation-admin"
                  role="group"
                  aria-label="Formulario de justificación de rechazo"
                >
                  <label htmlFor="admin-res-reject-textarea">
                    <span>
                      Motivo del rechazo para el editor del CMS{' '}
                      <b>(obligatorio)</b>
                    </span>
                    <textarea
                      id="admin-res-reject-textarea"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows="3"
                      maxLength="1000"
                      required
                      placeholder="Indicá detalladamente qué correcciones debe realizar el editor del CMS antes de volver a enviar esta residencia..."
                    />
                  </label>
                  <p>
                    Al confirmar, la residencia pasará a estado Rechazada y el editor del CMS podrá visualizar esta justificación en su panel.
                  </p>
                  {actionError && (
                    <p className="admin-res-error-admin" role="alert">
                      {actionError}
                    </p>
                  )}
                  <div className="admin-res-confirm-buttons-admin">
                    <button
                      type="button"
                      className="admin-res-cancel-btn-admin"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                        setActionError('');
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="admin-res-action-btn-admin is-reject"
                      onClick={handleConfirmReject}
                      disabled={isSaving || !rejectReason.trim()}
                    >
                      <XCircle size={17} />
                      {isSaving ? 'Guardando...' : 'Confirmar rechazo'}
                    </button>
                  </div>
                </div>
              )}

              {!showRejectForm && actionError && (
                <p className="admin-res-error-admin" role="alert">
                  {actionError}
                </p>
              )}
            </div>

            {/* Footer de Acciones */}
            {isSelectedPending && (
              <footer className="admin-res-modal-footer-admin">
                <div className="admin-res-footer-pending-admin">
                  <div className="admin-res-review-actions-admin">
                    <button
                      type="button"
                      className="admin-res-action-btn-admin is-approve"
                      onClick={handleApprove}
                      disabled={isSaving}
                    >
                      {selectedResidencia?.requestedEstado === 'ARCHIVADO' ? (
                        <>
                          <Archive size={17} />
                          {isSaving && !showRejectForm ? 'Archivando...' : 'Aprobar archivado'}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={17} />
                          {isSaving && !showRejectForm
                            ? 'Aprobando...'
                            : 'Aprobar solicitud'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-res-action-btn-admin is-reject"
                      aria-expanded={showRejectForm}
                      onClick={() => {
                        setShowRejectForm(true);
                        setActionError('');
                      }}
                      disabled={isSaving}
                    >
                      <XCircle size={17} />
                      Rechazar
                    </button>
                  </div>
                </div>
              </footer>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminResidenciasView;
