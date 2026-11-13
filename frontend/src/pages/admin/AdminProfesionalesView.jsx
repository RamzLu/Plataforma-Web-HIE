import SolicitudEliminacionAcciones from "../../components/admin/SolicitudEliminacionAcciones";
import { mensajeDeError } from "../../utils/mensajeDeError";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle,
  Clock3,
  Globe2,
  RefreshCw,
  Search,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import keycloak from '../../config/keycloak';
import {
  getProfesionales,
  evaluarProfesionalEstado,
} from '../../api/profesionales.api.js';
import { AdminCambiosPill, AdminCambiosResaltados } from '../../components/admin/AdminCambiosResaltados.jsx';
import '../../styles/pages/admin/AdminProfesionalesView.css';
import Paginacion from "../../components/ui/Paginacion";
import { usePaginacion } from "../../hooks/usePaginacion";

const estadoLabels = {
  PENDIENTE: 'Pendiente de aprobación',
  PUBLICADO: 'Publicado',
  APROBADO: 'Publicado',
  RECHAZADO: 'Rechazado',
};

const mapProfesionalFromBackend = (item) => {
  const estadoUpper = (
    item.estado || (item.publicado ? 'PUBLICADO' : 'PENDIENTE_APROBACION')
  ).toUpperCase();

  let estado = 'PENDIENTE';
  if (estadoUpper === 'PUBLICADO' || estadoUpper === 'APROBADO') {
    estado = 'PUBLICADO';
  } else if (estadoUpper === 'RECHAZADO') {
    estado = 'RECHAZADO';
  }

  const nombreCompleto = `${item.nombre || ''} ${item.apellido || ''}`.trim() || 'Profesional';
  const esServicio = Boolean(item.esServicioClave);

  return {
    id: item.id,
    nombre: nombreCompleto,
    solicitudEliminacion: item.solicitudEliminacion || null,
    cargo: item.cargo || 'Profesional de planta',
    matricula: item.matricula || '',
    especialidad: item.especialidadNombre || 'Sin asignar',
    area: esServicio ? 'Servicio clave' : 'Especialidad médica',
    tipo: esServicio ? 'Servicio de apoyo' : 'Especialidad médica',
    descripcion: item.descripcion || '',
    imagen: item.imagenUrl || null,
    editor: item.editor || 'Editor CMS',
    fechaCarga: item.fechaCarga || 'Reciente',
    fechaActualizacion: item.fechaActualizacion || item.fechaCarga || 'Reciente',
    estado,
    activo: item.activo !== false,
    publicado: estado === 'PUBLICADO',
    motivoRechazo: item.rejectionReason || '',
    cambios: Array.isArray(item.cambios) ? item.cambios : [],
    esActualizacion: Boolean(item.esActualizacion),
  };
};

const AdminProfesionalesView = ({ onPendingCountChange }) => {
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const syncPendingCount = useCallback(
    (list) => {
      if (typeof onPendingCountChange === 'function') {
        const count = list.filter((item) => item.estado === 'PENDIENTE' || Boolean(item.solicitudEliminacion)).length;
        onPendingCountChange(count);
      }
    },
    [onPendingCountChange]
  );

  const cargarDatos = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await getProfesionales(true);
        if (Array.isArray(data)) {
          const filtrados = data
            .filter((item) => (item.estado || '').toUpperCase() !== 'ARCHIVADO')
            .map(mapProfesionalFromBackend)
            .sort((a, b) => {
              const aPending = a.estado === 'PENDIENTE' || a.solicitudEliminacion ? 0 : 1;
              const bPending = b.estado === 'PENDIENTE' || b.solicitudEliminacion ? 0 : 1;
              if (aPending !== bPending) return aPending - bPending;
              return a.nombre.localeCompare(b.nombre);
            });
          setProfesionales(filtrados);
          syncPendingCount(filtrados);
        } else {
          setProfesionales([]);
          syncPendingCount([]);
        }
      } catch (error) {
        if (!silent) {
          console.error('Error al cargar profesionales:', error);
          toast.error('No se pudieron cargar los profesionales.');
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

  const selectedProfessional = profesionales.find((item) => item.id === selectedId);

  const filteredProfesionales = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');

    return profesionales.filter((item) => {
      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'PENDIENTE' && Boolean(item.solicitudEliminacion)) ||
        (statusFilter === 'PUBLICADO'
          ? item.publicado
          : item.estado === statusFilter);
      const matchesType = typeFilter === 'TODOS' || item.tipo === typeFilter;
      const searchableText = [
        item.nombre,
        item.cargo,
        item.matricula,
        item.especialidad,
        item.area,
        item.editor,
      ]
        .join(' ')
        .toLocaleLowerCase('es');

      return (
        matchesStatus &&
        matchesType &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [profesionales, search, statusFilter, typeFilter]);
  const paginacion = usePaginacion(filteredProfesionales, 10, [search, statusFilter, typeFilter]);

  const pendingCount = profesionales.filter(
    (item) => item.estado === 'PENDIENTE' || Boolean(item.solicitudEliminacion)
  ).length;
  const rejectedCount = profesionales.filter((item) => item.estado === 'RECHAZADO').length;
  const publishedCount = profesionales.filter((item) => item.publicado).length;

  const closeDetails = () => {
    setSelectedId(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedProfessional || submitting) return;
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      await evaluarProfesionalEstado(
        selectedProfessional.id,
        { estado: 'APROBADO' },
        keycloak.token
      );
      toast.success(`"${selectedProfessional.nombre}" fue aprobado y publicado.`);
      setFeedback(`"${selectedProfessional.nombre}" fue aprobado y publicado con éxito.`);
      closeDetails();
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al aprobar profesional:', error);
      toast.error(mensajeDeError(error, 'Error al aprobar al profesional.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProfessional || submitting) return;
    if (!rejectReason.trim()) {
      toast.error('Ingresá un motivo para que el Editor CMS pueda corregir la ficha.');
      return;
    }
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      await evaluarProfesionalEstado(
        selectedProfessional.id,
        {
          estado: 'RECHAZADO',
          rejectionReason: rejectReason.trim(),
        },
        keycloak.token
      );
      toast.success(`"${selectedProfessional.nombre}" fue rechazado. Se notificó al Editor CMS.`);
      setFeedback(`Se registró el rechazo de "${selectedProfessional.nombre}" con su motivo.`);
      closeDetails();
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al rechazar profesional:', error);
      toast.error(mensajeDeError(error, 'Error al rechazar al profesional.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('es');

  return (
    <div className="admin-prof-page">
      <header className="admin-prof-header admin-view-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
          <div>
            <span className="admin-prof-overtitle">PANEL DE CONTROL DIRECTIVO</span>
            <h1>Revisión de Profesionales</h1>
            <p>Revisá y respondé las solicitudes de profesionales enviadas por el CMS.</p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => cargarDatos(false)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      {feedback && (
        <div className="admin-prof-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <div className="admin-prof-summary-toolbar">
        <button
          type="button"
          className={`admin-prof-reset-filter ${statusFilter === 'TODOS' ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'TODOS'}
          onClick={() => setStatusFilter('TODOS')}
        >
          Todos
        </button>
      </div>
      <section className="admin-prof-summary" aria-label="Filtrar profesionales por estado">
        <button
          type="button"
          className={`admin-prof-summary-card is-pending ${statusFilter === 'PENDIENTE' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDIENTE'}
          onClick={() => setStatusFilter('PENDIENTE')}
        >
          <span className="admin-prof-summary-icon"><Clock3 size={19} /></span>
          <div>
            <span>Pendientes de aprobación</span>
            <strong>{pendingCount}</strong>
          </div>
        </button>
        <button
          type="button"
          className={`admin-prof-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span className="admin-prof-summary-icon"><Globe2 size={19} /></span>
          <div>
            <span>Visibles al público</span>
            <strong>{publishedCount}</strong>
          </div>
        </button>
        <button
          type="button"
          className={`admin-prof-summary-card is-rejected ${statusFilter === 'RECHAZADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'RECHAZADO'}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span className="admin-prof-summary-icon"><XCircle size={19} /></span>
          <div>
            <span>Rechazados</span>
            <strong>{rejectedCount}</strong>
          </div>
        </button>
      </section>

      <section className="admin-prof-card" aria-labelledby="admin-prof-list-title">
        <div className="admin-prof-card-heading">
          <div>
            <h2 id="admin-prof-list-title">
              Listado de Profesionales
            </h2>
            <p>Área de Revisión: Aprobación y rechazo de profesionales recibidos desde el CMS</p>
          </div>
          <span className="admin-prof-results-count">
            {filteredProfesionales.length} {filteredProfesionales.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-prof-toolbar">
          <label className="admin-prof-search">
            <Search size={18} aria-hidden="true" />
            <span className="admin-prof-visually-hidden">Buscar profesional, especialidad, área o editor</span>
            <input
              type="search"
              placeholder="Buscar por nombre, especialidad, área..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="admin-prof-filter">
            <span>Asociación</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="TODOS">Todas</option>
              <option value="Especialidad médica">Especialidad médica</option>
              <option value="Servicio de apoyo">Servicio de apoyo</option>
            </select>
          </label>
        </div>

        <div className="admin-prof-table-wrap">
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
              <p style={{ fontSize: '0.95rem' }}>Cargando fichas de profesionales...</p>
            </div>
          ) : (
            <>
            <table className="admin-prof-table">
              <thead>
                <tr>
                  <th scope="col">Profesional</th>
                  <th scope="col">Editor / fecha</th>
                  <th scope="col">Especialidad / área</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginacion.itemsPagina.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Profesional">
                      <div className="admin-prof-person-cell">
                        <div className="admin-prof-avatar">
                          {item.imagen ? (
                            <img src={item.imagen} alt={`Fotografía de ${item.nombre}`} />
                          ) : (
                            <span aria-label="Sin fotografía">{getInitials(item.nombre)}</span>
                          )}
                        </div>
                        <div className="admin-prof-person-copy">
                          <button
                            type="button"
                            className="admin-prof-name-button"
                            onClick={() => setSelectedId(item.id)}
                          >
                            {item.nombre}
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{item.cargo}</span>
                            <AdminCambiosPill count={item.cambios?.length} esActualizacion={item.esActualizacion} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Editor / fecha">
                      <div className="admin-prof-editor-cell" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.editor}</span>
                        <small style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }}><CalendarDays size={13} />{item.fechaActualizacion}</small>
                      </div>
                    </td>
                    <td data-label="Especialidad / área">
                      <div className="admin-prof-association-cell">
                        <strong><Stethoscope size={14} />{item.especialidad}</strong>
                        <span><Building2 size={14} />{item.area}</span>
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`admin-prof-status is-${item.publicado ? 'aprobado' : item.estado.toLowerCase()}`}
                      >
                        {item.publicado ? 'Publicado' : estadoLabels[item.estado]}
                      </span>
                      {item.solicitudEliminacion && (
                        <SolicitudEliminacionAcciones
                          solicitud={item.solicitudEliminacion}
                          entidad="profesional"
                          id={item.id}
                          titulo={item.nombre}
                          onResuelto={() => cargarDatos(true)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProfesionales.length === 0 && (
                  <tr>
                    <td className="admin-prof-empty" colSpan="4">
                      No se encontraron profesionales con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Paginacion {...paginacion} etiqueta="profesionales" />
            </>
          )}
        </div>
        <p className="admin-prof-grouping-note">
          La agrupación por tipo es referencial y queda sujeta a validación institucional; no reemplaza las asociaciones registradas.
        </p>
      </section>

      {selectedProfessional && (
        <div className="admin-prof-overlay" onClick={closeDetails}>
          <section
            className="admin-prof-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-prof-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-prof-modal-header">
              <div>
                <span>Revisión de información pública</span>
                <h2 id="admin-prof-modal-title">{selectedProfessional.nombre}</h2>
              </div>
              <button type="button" className="admin-prof-close" aria-label="Cerrar detalle" onClick={closeDetails}>
                <X size={20} />
              </button>
            </header>

            <div className="admin-prof-modal-body">
              <AdminCambiosResaltados
                cambios={selectedProfessional.cambios}
                esActualizacion={selectedProfessional.esActualizacion}
              />
              <div className="admin-prof-profile">
                <div className="admin-prof-profile-photo">
                  {selectedProfessional.imagen ? (
                    <img
                      src={selectedProfessional.imagen}
                      alt={`Fotografía de ${selectedProfessional.nombre}`}
                    />
                  ) : (
                    <span>{getInitials(selectedProfessional.nombre)}</span>
                  )}
                </div>
                <div className="admin-prof-profile-summary">
                  <span className="admin-prof-role">{selectedProfessional.cargo}</span>
                  <h3>{selectedProfessional.nombre}</h3>
                  <span>{selectedProfessional.matricula || 'Matrícula no informada'}</span>
                  <span className={`admin-prof-status is-${selectedProfessional.publicado ? 'aprobado' : selectedProfessional.estado.toLowerCase()}`}>
                    {selectedProfessional.publicado ? 'Publicado' : estadoLabels[selectedProfessional.estado]}
                  </span>
                </div>
              </div>

              <div className="admin-prof-detail-grid">
                <article className="admin-prof-detail">
                  <h4>Especialidad / Servicio asociado</h4>
                  <p>{selectedProfessional.especialidad}</p>
                </article>
                <article className="admin-prof-detail">
                  <h4>Clasificación</h4>
                  <p>{selectedProfessional.area}</p>
                </article>
                <article className="admin-prof-detail admin-prof-detail-wide">
                  <h4>Descripción pública</h4>
                  <p>{selectedProfessional.descripcion || 'Sin descripción cargada.'}</p>
                </article>
                <article className="admin-prof-detail">
                  <h4>Enviado por el Editor CMS</h4>
                  <p>{selectedProfessional.editor}</p>
                </article>
                <article className="admin-prof-detail">
                  <h4>Fecha de carga / actualización</h4>
                  <p>{selectedProfessional.fechaCarga} · {selectedProfessional.fechaActualizacion}</p>
                </article>
              </div>

              <div className="admin-prof-state-panel">
                <div>
                  <span>Estado editorial</span>
                  <strong>{estadoLabels[selectedProfessional.estado]}</strong>
                </div>
                <div>
                  <span>Presencia pública</span>
                  <strong>
                    {selectedProfessional.publicado
                      ? 'Publicado y visible en el portal'
                      : 'No publicado'}
                  </strong>
                </div>
              </div>

              {selectedProfessional.motivoRechazo && (
                <div className="admin-prof-rejection-note">
                  <strong>Motivo del rechazo anterior</strong>
                  <p>{selectedProfessional.motivoRechazo}</p>
                </div>
              )}

              {isRejecting && (
                <label className="admin-prof-rejection-field">
                  <span>Motivo del rechazo <b>(requerido)</b></span>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Indicá qué información debe corregir el Editor CMS..."
                    rows="3"
                    autoFocus
                  />
                </label>
              )}
            </div>

            {selectedProfessional.estado === 'PENDIENTE' && (
              <footer className="admin-prof-modal-footer">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      className="admin-prof-button is-danger"
                      onClick={() => setIsRejecting(true)}
                      disabled={submitting}
                    >
                      <XCircle size={17} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="admin-prof-button is-primary"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <CheckCircle size={17} /> {submitting ? 'Aprobando...' : 'Aprobar solicitud'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-prof-button is-secondary"
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
                      className="admin-prof-button is-danger"
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || submitting}
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

export default AdminProfesionalesView;