import { NotaPapelera, AvisoPapelera } from "../../components/cms/Papelera";
import FiltrosEstado from "../../components/ui/FiltrosEstado";
import PortalLoader from "../../components/ui/PortalLoader";
import EtiquetaCategoria, { EtiquetaTipo } from "../../components/ui/EtiquetaCategoria";
import '../../styles/components/admin/AdminRevisionModal.css';
import SolicitudEliminacionAcciones, { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import SiguePublicado from "../../components/cms/SiguePublicado";
import AvisoVersionPublicada from "../../components/admin/AvisoVersionPublicada";
import { estaPublicadoEnPortal, tituloEnLista, vistaPublicados, abreVersionPublicada, comoVersionPublicada, sinPapelera } from "../../utils/publicacion.js";
import { mensajeDeError } from "../../utils/mensajeDeError";
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  RefreshCw,
  Search,
  X,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import keycloak from '../../config/keycloak';
import {
  getProfesionales,
  revisarProfesional,
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
    enPapelera: Boolean(item.enPapelera),
    papeleraDesde: item.papeleraDesde || null,
    papeleraVenceEl: item.papeleraVenceEl || null,
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
    requestedEstado: item.requestedEstado || null,
    visibleEnPortal: Boolean(item.visibleEnPortal),
    tituloPublicado: item.tituloPublicado || null,
    versionPublicada: item.versionPublicada || null,
  };
};

const AdminProfesionalesView = ({ onPendingCountChange }) => {
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [verPublicada, setVerPublicada] = useState(false);
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
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [cargarDatos]);

  const profesionalBase = profesionales.find((item) => item.id === selectedId);
  const selectedProfessional =
    profesionalBase && verPublicada && profesionalBase.versionPublicada
      ? comoVersionPublicada(profesionalBase, mapProfesionalFromBackend)
      : profesionalBase;

  const filteredProfesionales = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');

    return (statusFilter === 'PAPELERA' ? profesionales.filter((x) => x?.enPapelera) : sinPapelera(profesionales)).filter((item) => {
      const matchesStatus =
        statusFilter === 'TODOS' || statusFilter === 'PAPELERA' ||
        (statusFilter === 'PENDIENTE' && Boolean(item.solicitudEliminacion)) ||
        (statusFilter === 'PUBLICADO'
          ? estaPublicadoEnPortal(item)
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
  const paginacion = usePaginacion(vistaPublicados(filteredProfesionales, statusFilter === 'PUBLICADO'), 10, [search, statusFilter, typeFilter]);

  const pendingCount = sinPapelera(profesionales).filter(
    (item) => item.estado === 'PENDIENTE' || Boolean(item.solicitudEliminacion)
  ).length;
  const rejectedCount = sinPapelera(profesionales).filter((item) => item.estado === 'RECHAZADO').length;
  const publishedCount = sinPapelera(profesionales).filter(estaPublicadoEnPortal).length;
  const papeleraCount = profesionales.filter((item) => item.enPapelera).length;

  const closeDetails = () => {
    setSelectedId(null);
    setVerPublicada(false);
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedProfessional || submitting) return;
    try {
      setSubmitting(true);
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => { });
      }
      await revisarProfesional(selectedProfessional.id, 'APROBAR');
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
        await keycloak.updateToken(30).catch(() => { });
      }
      await revisarProfesional(selectedProfessional.id, 'RECHAZAR', rejectReason.trim());
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
      <FiltrosEstado
        activa={statusFilter}
        onCambiar={setStatusFilter}
        opciones={[
          { clave: "PENDIENTE", tipo: "pendiente", cuenta: pendingCount },
          { clave: "PUBLICADO", tipo: "publicado", cuenta: publishedCount },
          { clave: "RECHAZADO", tipo: "rechazado", cuenta: rejectedCount },
          { clave: "PAPELERA", tipo: "papelera", cuenta: papeleraCount },
        ]}
      />

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

        {statusFilter === 'PAPELERA' && <AvisoPapelera soloLectura />}
        <div className="admin-prof-table-wrap">
          {loading ? (
            <PortalLoader message="Cargando fichas de profesionales..." />
          ) : (
            <>
              <table className="admin-prof-table admin-prof-table-admin">
                <thead>
                  <tr>
                    <th scope="col" className="admin-prof-th-profesional-admin">Profesional</th>
                    <th scope="col" className="admin-prof-th-cargo-admin">Cargo o función</th>
                    <th scope="col" className="admin-prof-th-area-admin">Área asignada</th>
                    <th scope="col" className="admin-prof-th-clasificacion-admin">Clasificación</th>
                    <th scope="col" className="admin-prof-th-estado-admin">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginacion.itemsPagina.map((item) => (
                    <tr
                      key={item.id}
                      className="admin-prof-row-clickable-admin"
                      onClick={() => {
                        setSelectedId(item.id);
                        setVerPublicada(abreVersionPublicada(item, statusFilter === 'PUBLICADO'));
                      }}
                    >
                      <td data-label="Profesional" className="admin-prof-td-profesional-admin">
                        <div className="admin-prof-person-cell admin-prof-person-cell-admin">
                          <div className="admin-prof-avatar admin-prof-avatar-admin">
                            {item.imagen ? (
                              <img src={item.imagen} alt={`Fotografía de ${item.nombre}`} />
                            ) : (
                              <span aria-label="Sin fotografía">{getInitials(item.nombre)}</span>
                            )}
                          </div>
                          <div className="admin-prof-person-copy admin-prof-person-copy-admin">
                            <button
                              type="button"
                              className="admin-prof-name-button admin-prof-name-button-admin"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedId(item.id);
                                setVerPublicada(abreVersionPublicada(item, statusFilter === 'PUBLICADO'));
                              }}
                            >
                              {tituloEnLista(item, statusFilter === 'PUBLICADO', item.nombre)}
                            </button>
                            <div className="admin-prof-matricula-wrap-admin">
                              <span className="admin-prof-matricula-text-admin">{item.matricula || 'Sin matrícula'}</span>
                              <AdminCambiosPill oculto={statusFilter === 'PUBLICADO'} count={item.cambios?.length} esActualizacion={item.esActualizacion} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Cargo o función" className="admin-prof-td-cargo-admin">
                        <span className="admin-prof-cargo-text-admin">{item.cargo || '-'}</span>
                      </td>
                      <td data-label="Área asignada" className="admin-prof-td-area-admin">
                        <div className="admin-prof-area-cell-admin">
                          <EtiquetaCategoria categoria={item.especialidad || 'Sin asignar'} tono="gris" />
                        </div>
                      </td>
                      <td data-label="Clasificación" className="admin-prof-td-clasificacion-admin">
                        <div className="admin-prof-clasificacion-cell-admin">
                          <EtiquetaTipo esServicio={item.area === 'Servicio clave'} />
                        </div>
                      </td>
                      <td data-label="Estado" className="admin-prof-td-estado-admin">
                        {item.solicitudEliminacion && statusFilter !== 'PUBLICADO' ? (
                          <EtiquetaEliminacion />
                        ) : (
                          <>
                            <EtiquetaEstado
                              estado={item.publicado || item.estadoVista ? 'PUBLICADO' : item.estado}
                              texto={item.publicado || item.estadoVista ? 'Publicado' : estadoLabels[item.estado]}
                            />
                            <SiguePublicado item={item} activo={statusFilter === 'PUBLICADO'} />
                            <NotaPapelera item={item} />
                            {item.solicitudEliminacion && (
                              <div style={{ marginTop: '4px' }}>
                                <EtiquetaEliminacion nota />
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredProfesionales.length === 0 && (
                    <tr>
                      <td className="admin-prof-empty" colSpan="5">
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
        <div className="admin-prof-overlay admin-rev-overlay admin-prof-rv-overlay" onClick={closeDetails}>
          <section
            className="admin-prof-modal admin-rev-modal admin-prof-rv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-prof-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-prof-rv-header">
              <h2 id="admin-prof-modal-title" className="admin-prof-rv-title">Revisión de profesional</h2>
              <button type="button" className="admin-prof-rv-close" aria-label="Cerrar detalle" onClick={closeDetails}>
                <X size={20} />
              </button>
            </header>

            <div className="admin-prof-rv-body">
              <div className="admin-prof-rv-card admin-prof-rv-status">
                <span className="admin-prof-rv-status-label">Estado actual</span>
                <EtiquetaEstado
                  estado={selectedProfessional.publicado ? 'PUBLICADO' : selectedProfessional.estado}
                  texto={selectedProfessional.publicado ? 'Publicado' : estadoLabels[selectedProfessional.estado]}
                />
              </div>

              {selectedProfessional.estado === 'PENDIENTE' &&
                ['BORRADOR', 'ARCHIVADO'].includes(selectedProfessional.requestedEstado) && (
                  <div className="admin-prof-rv-alert" role="note">
                    <AlertTriangle size={18} aria-hidden="true" />
                    <div>
                      <strong>Solicitud de retiro:</strong> el editor del CMS pide pasar este profesional a{' '}
                      <strong>{selectedProfessional.requestedEstado === 'BORRADOR' ? 'Borrador' : 'Archivado'}</strong>.
                      Si lo aprobás, deja de verse en el portal.
                    </div>
                  </div>
                )}

              <AvisoVersionPublicada item={selectedProfessional} />
              <AdminCambiosResaltados
                cambios={selectedProfessional.cambios}
                esActualizacion={selectedProfessional.esActualizacion}
              />

              <section className="admin-prof-rv-card admin-prof-rv-profile">
                <div className="admin-prof-rv-photo">
                  {selectedProfessional.imagen ? (
                    <img
                      src={selectedProfessional.imagen}
                      alt={`Fotografía de ${selectedProfessional.nombre}`}
                    />
                  ) : (
                    <span>{getInitials(selectedProfessional.nombre)}</span>
                  )}
                </div>
                <div className="admin-prof-rv-summary">
                  <div className="admin-prof-rv-role">{selectedProfessional.cargo}</div>
                  <h3 className="admin-prof-rv-name">{selectedProfessional.nombre}</h3>
                  <div className="admin-prof-rv-license">{selectedProfessional.matricula || 'Matrícula no informada'}</div>
                </div>
              </section>

              <section className="admin-prof-rv-grid">
                <div className="admin-prof-rv-card admin-prof-rv-field">
                  <div className="admin-prof-rv-field-label">Especialidad / Servicio asociado</div>
                  <div className="admin-prof-rv-field-value">{selectedProfessional.especialidad}</div>
                </div>
                <div className="admin-prof-rv-card admin-prof-rv-field">
                  <div className="admin-prof-rv-field-label">Clasificación</div>
                  <div className="admin-prof-rv-field-value">{selectedProfessional.area}</div>
                </div>
              </section>

              <div className="admin-prof-rv-card admin-prof-rv-field">
                <div className="admin-prof-rv-field-label">Descripción / Perfil profesional</div>
                <div className="admin-prof-rv-field-text">{selectedProfessional.descripcion || selectedProfessional.cargo || 'Sin descripción cargada.'}</div>
              </div>

              <div className="admin-prof-rv-card admin-prof-rv-sent">
                <div>
                  Enviado por <strong>{selectedProfessional.editor}</strong>
                </div>
                <div>
                  Última modificación: <strong>{selectedProfessional.fechaActualizacion}</strong>
                </div>
              </div>

              {selectedProfessional.motivoRechazo && (
                <div className="admin-rev-note">
                  <strong>Motivo del rechazo anterior</strong>
                  <p>{selectedProfessional.motivoRechazo}</p>
                </div>
              )}

              {isRejecting && (
                <label className="admin-rev-field">
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

              {selectedProfessional.solicitudEliminacion && (
                <div className="admin-rev-solicitud">
                  <SolicitudEliminacionAcciones
                    solicitud={selectedProfessional.solicitudEliminacion}
                    entidad="profesional"
                    id={selectedProfessional.id}
                    titulo={selectedProfessional.nombre}
                    onResuelto={async () => {
                      closeDetails();
                      await cargarDatos(true);
                    }}
                  />
                </div>
              )}
            </div>

            {selectedProfessional.estado === 'PENDIENTE' && (
              <footer className="admin-prof-rv-footer">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      className="admin-prof-rv-btn is-danger"
                      onClick={() => setIsRejecting(true)}
                      disabled={submitting}
                    >
                      <XCircle size={16} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="admin-prof-rv-btn is-primary"
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
                      className="admin-prof-rv-btn is-secondary"
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
                      className="admin-prof-rv-btn is-danger"
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