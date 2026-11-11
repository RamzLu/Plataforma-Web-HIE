import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import keycloak from '../../config/keycloak';
import api from '../../api/axiosConfig';
import { getCapacitaciones } from '../../api/capacitaciones.api';
import capacitacionesBanner from '../../assets/banner_capacitaciones.png';
import { sanitizeUrl } from '../../utils/sanitizeUrl';
import '../../styles/pages/admin/AdminCapacitacionesView.css';

const STATUS_LABELS = {
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  BORRADOR: 'Borrador',
  APROBADO: 'Aprobado',
  PUBLICADO: 'Publicado',
  RECHAZADO: 'Rechazado',
  ARCHIVADO: 'Archivado',
};

const SIMULATED_CAPACITACIONES = [
  {
    id: 'sim-cap-001',
    titulo: 'Primeros auxilios y RCP para la comunidad',
    descripcion: 'Capacitación abierta para conocer las maniobras iniciales de RCP y cómo actuar ante una emergencia.',
    contenido: 'Módulo 1: Reconocimiento de una emergencia.\nMódulo 2: Activación del sistema de emergencias.\nMódulo 3: Maniobras iniciales de RCP y uso del DEA.',
    modalidad: 'Presencial',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-10',
    horario: '09:00',
    ubicacion: 'Auditorio del Hospital Interdistrital Evita',
    disertantes: 'Equipo de Emergencias HIE',
    estado: 'PENDIENTE_APROBACION',
    activo: true,
    bannerUrl: capacitacionesBanner,
    bannerNombre: 'banner_capacitaciones.png',
    archivoTipo: 'documento',
    archivoNombre: 'programa-primeros-auxilios.pdf',
    archivoUrl: 'https://example.com/programa-primeros-auxilios.pdf',
    archivoTamano: '1.2 MB',
    videoUrl: '',
    enlaceUrl: '',
  },
  {
    id: 'sim-cap-002',
    titulo: 'Prevención del dengue: acciones en el hogar',
    descripcion: 'Material educativo para reconocer criaderos y prevenir la reproducción del mosquito.',
    contenido: 'Identificación de recipientes con agua.\nMedidas de prevención en patios y viviendas.\nSignos de alarma y cuándo consultar.',
    modalidad: 'Virtual',
    fechaInicio: '2026-12-15',
    fechaFin: '2026-12-15',
    horario: '18:00',
    ubicacion: 'Encuentro virtual',
    disertantes: 'Programa Provincial de Vectores',
    estado: 'PENDIENTE_APROBACION',
    activo: true,
    bannerUrl: capacitacionesBanner,
    bannerNombre: 'banner_capacitaciones.png',
    archivoTipo: 'video',
    archivoNombre: 'prevencion-dengue.mp4',
    archivoUrl: '',
    archivoTamano: '',
    videoUrl: 'https://example.com/prevencion-dengue',
    enlaceUrl: 'https://example.com/prevencion',
  },
  {
    id: 'sim-cap-003',
    titulo: 'Guía de preparación para estudios de laboratorio',
    descripcion: 'Recomendaciones generales para prepararse antes de realizarse análisis clínicos.',
    contenido: 'Consultá las indicaciones específicas del equipo de salud.\nLlevá la documentación solicitada.\nRespetá las pautas de ayuno cuando corresponda.',
    modalidad: 'Virtual',
    fechaInicio: '2026-12-02',
    fechaFin: '2026-12-02',
    horario: '10:00',
    ubicacion: 'Portal institucional',
    disertantes: 'Servicio de Laboratorio',
    estado: 'APROBADO',
    activo: true,
    bannerUrl: capacitacionesBanner,
    bannerNombre: 'banner_capacitaciones.png',
    archivoTipo: 'documento',
    archivoNombre: 'guia-preparacion-laboratorio.pdf',
    archivoUrl: 'https://example.com/guia-laboratorio.pdf',
    archivoTamano: '850 KB',
    videoUrl: '',
    enlaceUrl: '',
  },
  {
    id: 'sim-cap-004',
    titulo: 'Jornada de promoción de hábitos saludables',
    descripcion: 'Encuentro comunitario sobre alimentación, actividad física y cuidado integral.',
    contenido: 'Alimentación saludable.\nMovimiento y actividad física.\nRecursos locales de promoción de la salud.',
    modalidad: 'Presencial',
    fechaInicio: '2026-07-14',
    fechaFin: '2026-07-14',
    horario: '09:30',
    ubicacion: 'Centro de salud barrial',
    disertantes: 'Equipo de Promoción de la Salud',
    estado: 'PUBLICADO',
    activo: true,
    bannerUrl: capacitacionesBanner,
    bannerNombre: 'banner_capacitaciones.png',
    archivoTipo: 'imagen',
    archivoNombre: 'afiche-habitos-saludables.png',
    archivoUrl: capacitacionesBanner,
    archivoTamano: '',
    videoUrl: '',
    enlaceUrl: '',
  },
];

const formatDate = (value) => {
  if (!value) return 'A confirmar';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'A confirmar';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatPeriod = (training) => {
  const start = formatDate(training.fechaInicio);
  const end = formatDate(training.fechaFin);
  if (!training.fechaInicio && !training.fechaFin) return 'Fechas a confirmar';
  if (!training.fechaFin || training.fechaInicio === training.fechaFin) return start;
  if (!training.fechaInicio) return `Hasta ${end}`;
  return `${start} – ${end}`;
};

const AdminCapacitacionesView = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [isSimulation, setIsSimulation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pendingAction, setPendingAction] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const cargarCapacitaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCapacitaciones();
      if (!Array.isArray(data)) {
        throw new Error('La respuesta de capacitaciones no tiene un formato válido.');
      }
      setCapacitaciones(data.length > 0 ? data : SIMULATED_CAPACITACIONES);
      setIsSimulation(data.length === 0);
    } catch (loadError) {
      console.error('Error al cargar capacitaciones para revisión:', loadError);
      setCapacitaciones(SIMULATED_CAPACITACIONES);
      setIsSimulation(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCapacitaciones();
  }, [cargarCapacitaciones]);

  const selectedTraining = capacitaciones.find((training) => training.id === selectedId);
  const capacitacionesVisibles = useMemo(
    () => capacitaciones.filter((training) => training.estado !== 'BORRADOR'),
    [capacitaciones],
  );

  const filteredCapacitaciones = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return capacitacionesVisibles.filter((training) => {
      const matchesStatus = statusFilter === 'TODOS' || training.estado === statusFilter;
      const searchableContent = [
        training.titulo,
        training.descripcion,
        training.contenido,
        training.modalidad,
        training.ubicacion,
        training.disertantes,
        training.archivoNombre,
        training.enlaceUrl,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');

      return matchesStatus && (!query || searchableContent.includes(query));
    });
  }, [capacitacionesVisibles, search, statusFilter]);

  const counts = useMemo(
    () => ({
      pending: capacitacionesVisibles.filter((training) => training.estado === 'PENDIENTE_APROBACION').length,
      approved: capacitacionesVisibles.filter((training) => training.estado === 'APROBADO').length,
      published: capacitacionesVisibles.filter((training) => training.estado === 'PUBLICADO').length,
      rejected: capacitacionesVisibles.filter((training) => training.estado === 'RECHAZADO').length,
      archived: capacitacionesVisibles.filter((training) => training.estado === 'ARCHIVADO').length,
    }),
    [capacitacionesVisibles],
  );

  const closeDetails = () => {
    setSelectedId(null);
    setPendingAction('');
    setRejectReason('');
    setActionError('');
  };

  const startReviewAction = (action) => {
    setPendingAction(action);
    setRejectReason('');
    setActionError('');
  };

  const runReviewAction = async () => {
    if (
      !selectedTraining ||
      !['APROBADO', 'RECHAZADO'].includes(pendingAction) ||
      isSaving
    ) return;
    const reason = rejectReason.trim();
    if (pendingAction === 'RECHAZADO' && !reason) {
      setActionError('Ingresá el motivo del rechazo para continuar.');
      return;
    }

    setIsSaving(true);
    setActionError('');
    try {
      const isArchiving = selectedTraining.requestedEstado === 'ARCHIVADO';
      const finalEstado = pendingAction === 'APROBADO'
        ? (isArchiving ? 'ARCHIVADO' : 'PUBLICADO')
        : 'RECHAZADO';

      if (isSimulation) {
        setCapacitaciones((current) =>
          current.map((training) =>
            training.id === selectedTraining.id
              ? {
                  ...training,
                  estado: finalEstado,
                  motivoRechazo: pendingAction === 'RECHAZADO' ? reason : '',
                }
              : training,
          ),
        );
        setFeedback(
          isArchiving && pendingAction === 'APROBADO'
            ? `“${selectedTraining.titulo}” fue archivada con éxito.`
            : `“${selectedTraining.titulo}” quedó ${STATUS_LABELS[finalEstado]?.toLocaleLowerCase('es') || finalEstado}.`
        );
        closeDetails();
        return;
      }

      const token = keycloak?.token || localStorage.getItem('token') || '';
      const response = await api.patch(
        `/cms/capacitaciones/${selectedTraining.id}/revision`,
        { estado: pendingAction, motivoRechazo: reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const result = response.data;
      if (!result?.capacitacion) {
        throw new Error('El servidor no devolvió la capacitación actualizada.');
      }
      setCapacitaciones((current) =>
        current.map((training) =>
          training.id === result.capacitacion.id ? result.capacitacion : training,
        ),
      );
      setFeedback(
        isArchiving && pendingAction === 'APROBADO'
          ? `“${selectedTraining.titulo}” fue archivada con éxito.`
          : `“${selectedTraining.titulo}” quedó ${STATUS_LABELS[result.capacitacion.estado]?.toLocaleLowerCase('es') || result.capacitacion.estado}.`
      );
      closeDetails();
    } catch (saveError) {
      console.error('Error al actualizar el estado de la capacitación:', saveError);
      setActionError(
        saveError.response?.data?.error ||
          saveError.response?.data?.message ||
          saveError.message ||
          'No se pudo actualizar la capacitación.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('TODOS');
    setSearch('');
  };

  return (
    <div className="admin-training-page admin-review-container-admin">
      <header className="admin-page-header-admin admin-view-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="admin-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
            <h1>Gestión de Capacitaciones Públicas</h1>
            <p>Revisá los contenidos y recursos antes de aprobarlos para publicación.</p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={cargarCapacitaciones}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      {feedback && (
        <div className="admin-training-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <div className="admin-training-summary-toolbar">
        <button
          type="button"
          className={`admin-training-reset-filter ${statusFilter === 'TODOS' && !search ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'TODOS' && !search}
          onClick={resetFilters}
        >
          Todos
        </button>
      </div>

      <section className="admin-training-summary" aria-label="Filtrar capacitaciones por estado">
        <button
          type="button"
          className={`admin-training-summary-card is-pending ${statusFilter === 'PENDIENTE_APROBACION' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE_APROBACION'}
          onClick={() => setStatusFilter('PENDIENTE_APROBACION')}
        >
          <span><Clock3 size={19} /></span>
          <div><small>Pendientes de revisión</small><strong>{counts.pending}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-training-summary-card is-approved ${statusFilter === 'APROBADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APROBADO'}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span><CheckCircle size={19} /></span>
          <div><small>Aprobadas</small><strong>{counts.approved}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-training-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span><Globe2 size={19} /></span>
          <div><small>Publicadas</small><strong>{counts.published}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-training-summary-card is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span><XCircle size={19} /></span>
          <div><small>Rechazadas</small><strong>{counts.rejected}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-training-summary-card is-archived ${statusFilter === 'ARCHIVADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'ARCHIVADO'}
          onClick={() => setStatusFilter('ARCHIVADO')}
        >
          <span><Archive size={19} /></span>
          <div><small>Archivadas</small><strong>{counts.archived}</strong></div>
        </button>
      </section>

      <section className="dashboard-card-admin admin-training-card" aria-labelledby="admin-training-list-title">
        <div className="admin-training-card-heading">
          <div>
            <h2 className="dashboard-card-title-admin" id="admin-training-list-title">
              Listado de Capacitaciones
            </h2>
            <p className="news-view-subtitle-admin">
              Área de Revisión: Aprobación y rechazo de capacitaciones recibidas desde el CMS
            </p>
          </div>
          <span className="admin-training-result-count">
            {filteredCapacitaciones.length} {filteredCapacitaciones.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-training-toolbar">
          <label className="admin-training-search">
            <Search size={18} aria-hidden="true" />
            <span className="admin-training-visually-hidden">Buscar capacitaciones</span>
            <input
              type="search"
              placeholder="Buscar por título, contenido o recurso..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-training-table-wrap">
          <table className="admin-training-table">
            <thead>
              <tr>
                <th scope="col">Capacitación</th>
                <th scope="col">Fechas / modalidad</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="admin-training-empty" colSpan="3">Cargando capacitaciones...</td></tr>
              ) : filteredCapacitaciones.length === 0 ? (
                <tr>
                  <td className="admin-training-empty" colSpan="3">
                    No se encontraron capacitaciones con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredCapacitaciones.map((training) => (
                    <tr key={training.id}>
                      <td data-label="Capacitación">
                        <div className="admin-training-title-cell">
                          {training.bannerUrl ? (
                            <img src={sanitizeUrl(training.bannerUrl)} alt="" loading="lazy" />
                          ) : (
                            <span className="admin-training-placeholder"><GraduationCap size={19} /></span>
                          )}
                          <span>
                            <button
                              type="button"
                              className="admin-training-title-button"
                              onClick={() => setSelectedId(training.id)}
                            >
                              {training.titulo}
                            </button>
                            <small>{training.descripcion || 'Sin descripción'}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Fechas / modalidad">
                        <div className="admin-training-meta-cell">
                          <span><CalendarDays size={14} />{formatPeriod(training)}</span>
                          <small>{training.modalidad || 'Modalidad a confirmar'}</small>
                        </div>
                      </td>
                      <td data-label="Estado">
                        <span className={`admin-training-status is-${training.estado?.toLowerCase() || 'borrador'}`}>
                          {STATUS_LABELS[training.estado] || training.estado || 'Sin estado'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTraining && (
        <div className="admin-training-overlay" onClick={closeDetails}>
          <section
            className="admin-training-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-training-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-training-modal-header">
              <div className="admin-training-modal-heading">
                <span>Revisión de contenido público</span>
                <div className="admin-training-title-row">
                  <h2 id="admin-training-modal-title">{selectedTraining.titulo}</h2>
                  <span className={`admin-training-status is-${selectedTraining.estado?.toLowerCase() || 'borrador'}`}>
                    {STATUS_LABELS[selectedTraining.estado] || selectedTraining.estado || 'Sin estado'}
                  </span>
                </div>
              </div>
              <button type="button" aria-label="Cerrar detalle" onClick={closeDetails}>
                <X size={20} />
              </button>
            </header>

            <div className="admin-training-modal-body">
              {selectedTraining.estado === 'PENDIENTE_APROBACION' && selectedTraining.requestedEstado === 'ARCHIVADO' && (
                <div style={{
                  margin: '0 0 16px 0',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Archive size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div>
                    <strong>Solicitud de archivado:</strong> El editor del CMS solicita archivar esta capacitación y retirarla del portal público.
                  </div>
                </div>
              )}
              <div className="admin-training-info-grid">
                <article className="is-wide">
                  <h3>Modalidad de la capacitación</h3>
                  <p>{selectedTraining.modalidad || 'A confirmar'}</p>
                </article>
                <article>
                  <h3>Fecha de inicio / encuentro</h3>
                  <p>{formatDate(selectedTraining.fechaInicio)}</p>
                </article>
                <article>
                  <h3>Fecha de finalización</h3>
                  <p>{selectedTraining.fechaFin ? formatDate(selectedTraining.fechaFin) : 'No especificada'}</p>
                </article>
                <article>
                  <h3>Horario</h3>
                  <p>{selectedTraining.horario || 'A confirmar'}</p>
                </article>
                <article>
                  <h3>Lugar / plataforma</h3>
                  <p>{selectedTraining.ubicacion || 'A confirmar'}</p>
                </article>
                <article className="is-wide">
                  <h3>Disertantes / docentes a cargo</h3>
                  <p>{selectedTraining.disertantes || 'No informados'}</p>
                </article>
                <article className="is-wide">
                  <h3>Enlace a video / clase virtual</h3>
                  {selectedTraining.videoUrl ? (
                    <p className="admin-training-inline-resource">
                      <Video size={17} />
                      <a href={sanitizeUrl(selectedTraining.videoUrl)} target="_blank" rel="noopener noreferrer">
                        Revisar video externo <ExternalLink size={14} />
                      </a>
                    </p>
                  ) : (
                    <p>No se adjuntó un enlace de video.</p>
                  )}
                </article>
                <article className="is-wide">
                  <h3>Descripción breve</h3>
                  <p>{selectedTraining.descripcion || 'Sin descripción cargada.'}</p>
                </article>
                <article className="is-wide">
                  <h3>Temarios y contenidos académicos</h3>
                  <p className="admin-training-content">{selectedTraining.contenido || 'Sin contenido detallado.'}</p>
                </article>
              </div>

              <section className="admin-training-resources" aria-label="Banner o portada de la capacitación">
                <h3>Banner / Portada de la tarjeta</h3>
                {selectedTraining.bannerUrl && (
                  <a
                    className="admin-training-resource-image"
                    href={sanitizeUrl(selectedTraining.bannerUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={sanitizeUrl(selectedTraining.bannerUrl)} alt={selectedTraining.bannerNombre || 'Imagen de la capacitación'} />
                    <span><ImageIcon size={16} /> {selectedTraining.bannerNombre || 'Imagen de portada'} <ExternalLink size={14} /></span>
                  </a>
                )}
                {!selectedTraining.bannerUrl && (
                  <p className="admin-training-no-resources">No se adjuntó un banner o portada.</p>
                )}
              </section>

              <section className="admin-training-resources" aria-label="Material didáctico adjunto">
                <h3>Material didáctico adjunto (contenido)</h3>
                {selectedTraining.archivoTipo === 'imagen' && selectedTraining.archivoUrl && (
                  <a
                    className="admin-training-resource-image"
                    href={sanitizeUrl(selectedTraining.archivoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={sanitizeUrl(selectedTraining.archivoUrl)} alt={selectedTraining.archivoNombre || 'Imagen asociada'} />
                    <span><ImageIcon size={16} /> {selectedTraining.archivoNombre || 'Imagen asociada'} <ExternalLink size={14} /></span>
                  </a>
                )}
                {selectedTraining.archivoTipo === 'video' && selectedTraining.archivoUrl && (
                  <div className="admin-training-resource-link">
                    <Video size={18} />
                    <a href={sanitizeUrl(selectedTraining.archivoUrl)} target="_blank" rel="noopener noreferrer">
                      {selectedTraining.archivoNombre || 'Abrir video asociado'} <ExternalLink size={14} />
                    </a>
                  </div>
                )}
                {selectedTraining.archivoTipo === 'documento' && selectedTraining.archivoUrl && (
                  <div className="admin-training-resource-link">
                    <FileText size={18} />
                    <a href={sanitizeUrl(selectedTraining.archivoUrl)} target="_blank" rel="noopener noreferrer">
                      {selectedTraining.archivoNombre || 'Abrir documento asociado'} <ExternalLink size={14} />
                    </a>
                    {selectedTraining.archivoTamano && <small>{selectedTraining.archivoTamano}</small>}
                  </div>
                )}
                {selectedTraining.archivoUrl &&
                  !['imagen', 'video', 'documento'].includes(selectedTraining.archivoTipo) && (
                    <div className="admin-training-resource-link">
                      <FileText size={18} />
                      <a href={sanitizeUrl(selectedTraining.archivoUrl)} target="_blank" rel="noopener noreferrer">
                        {selectedTraining.archivoNombre || 'Abrir archivo asociado'} <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                {selectedTraining.enlaceUrl && (
                  <div className="admin-training-resource-link">
                    <Globe2 size={18} />
                    <a href={sanitizeUrl(selectedTraining.enlaceUrl)} target="_blank" rel="noopener noreferrer">
                      Revisar enlace externo <ExternalLink size={14} />
                    </a>
                  </div>
                )}
                {!selectedTraining.archivoUrl &&
                  !selectedTraining.enlaceUrl && (
                    <p className="admin-training-no-resources">No se adjuntó material didáctico.</p>
                  )}
              </section>

              {selectedTraining.rejectionReason && (
                <div className="admin-training-rejection-note">
                  <strong>Motivo del rechazo</strong>
                  <p>{selectedTraining.rejectionReason}</p>
                </div>
              )}

              {selectedTraining.motivoRechazo && (
                <div className="admin-training-rejection-note">
                  <strong>Motivo del rechazo</strong>
                  <p>{selectedTraining.motivoRechazo}</p>
                </div>
              )}

              {selectedTraining.estado === 'PENDIENTE_APROBACION' && (
                <div className="admin-training-review-actions">
                  <button type="button" className="admin-training-action is-approve" onClick={() => startReviewAction('APROBADO')}>
                    {selectedTraining.requestedEstado === 'ARCHIVADO' ? (
                      <>
                        <Archive size={17} /> Aprobar archivado
                      </>
                    ) : (
                      <>
                        <CheckCircle size={17} /> Aprobar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-training-action is-reject"
                    onClick={() => {
                      startReviewAction('RECHAZADO');
                    }}
                  >
                    <XCircle size={17} /> Rechazar
                  </button>
                </div>
              )}

              {pendingAction && (
                <div className="admin-training-confirmation" role="group" aria-label="Confirmar acción">
                  {pendingAction === 'RECHAZADO' ? (
                    <>
                      <label>
                        <span>Motivo del rechazo <b>(requerido)</b></span>
                        <textarea
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                          rows="3"
                          maxLength="1000"
                          required
                          placeholder="Indicá qué debe corregirse antes de volver a enviar el contenido."
                        />
                      </label>
                      <p>El contenido quedará rechazado y no estará disponible para publicación.</p>
                    </>
                  ) : selectedTraining.requestedEstado === 'ARCHIVADO' ? (
                    <p>¿Confirmás archivar esta capacitación? Se retirará de la visualización pública.</p>
                  ) : (
                    <p>¿Confirmás aprobar este contenido? Quedará habilitado para continuar con su publicación desde el CMS.</p>
                  )}
                  {actionError && <p className="admin-training-error" role="alert">{actionError}</p>}
                  <div>
                    <button
                      type="button"
                      className="admin-training-cancel"
                      onClick={() => {
                        setPendingAction('');
                        setRejectReason('');
                        setActionError('');
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={`admin-training-confirm is-${pendingAction.toLowerCase()}`}
                      onClick={runReviewAction}
                      disabled={isSaving || (pendingAction === 'RECHAZADO' && !rejectReason.trim())}
                    >
                      {isSaving ? 'Guardando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminCapacitacionesView;
