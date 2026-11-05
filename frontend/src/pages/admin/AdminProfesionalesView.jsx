import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle,
  Eye,
  Globe2,
  Search,
  Stethoscope,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import fotoDoctor from '../../assets/foto-doctor-ejemplo.jpg';
import fotoDoctora from '../../assets/foto-doctora-ejemplo.jpg';
import '../../styles/pages/admin/AdminProfesionalesView.css';

const initialProfesionales = [
  {
    id: 'prof-001',
    nombre: 'Lucía Fernández',
    cargo: 'Médica especialista',
    matricula: 'MP 2841',
    especialidad: 'Cardiología',
    area: 'Consultorios externos',
    tipo: 'Especialidad médica',
    descripcion:
      'Atención integral de personas adultas, seguimiento cardiovascular y orientación para la prevención.',
    imagen: fotoDoctora,
    editor: 'María Gómez',
    fechaCarga: '04/11/2026',
    fechaActualizacion: '04/11/2026',
    estado: 'PENDIENTE',
    activo: true,
    publicado: false,
    motivoRechazo: '',
  },
  {
    id: 'prof-002',
    nombre: 'Martín Ríos',
    cargo: 'Médico de planta',
    matricula: 'MP 1936',
    especialidad: 'Clínica médica',
    area: 'Atención ambulatoria',
    tipo: 'Especialidad médica',
    descripcion:
      'Abordaje clínico integral, evaluación inicial y acompañamiento de pacientes adultos.',
    imagen: fotoDoctor,
    editor: 'Carlos Benítez',
    fechaCarga: '02/11/2026',
    fechaActualizacion: '03/11/2026',
    estado: 'APROBADO',
    activo: true,
    publicado: false,
    motivoRechazo: '',
  },
  {
    id: 'prof-003',
    nombre: 'Sofía Acosta',
    cargo: 'Licenciada en diagnóstico por imágenes',
    matricula: 'MP 3472',
    especialidad: 'Diagnóstico por imágenes',
    area: 'Diagnóstico y tratamiento',
    tipo: 'Servicio de apoyo',
    descripcion:
      'Profesional del equipo de diagnóstico por imágenes. La información pública se encuentra aprobada.',
    imagen: null,
    editor: 'María Gómez',
    fechaCarga: '29/10/2026',
    fechaActualizacion: '01/11/2026',
    estado: 'APROBADO',
    activo: true,
    publicado: true,
    motivoRechazo: '',
  },
  {
    id: 'prof-004',
    nombre: 'Valentina López',
    cargo: 'Licenciada en Nutrición',
    matricula: 'MP 5108',
    especialidad: 'Nutrición',
    area: 'Atención ambulatoria',
    tipo: 'Servicio de apoyo',
    descripcion:
      'Orientación nutricional y acompañamiento para el cuidado integral de la salud.',
    imagen: fotoDoctora,
    editor: 'Carlos Benítez',
    fechaCarga: '27/10/2026',
    fechaActualizacion: '30/10/2026',
    estado: 'RECHAZADO',
    activo: false,
    publicado: false,
    motivoRechazo: 'Revisar la descripción y completar la información del área de atención.',
  },
];

const estadoLabels = {
  PENDIENTE: 'Pendiente de aprobación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

const AdminProfesionalesView = () => {
  const [profesionales, setProfesionales] = useState(initialProfesionales);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedProfessional = profesionales.find((item) => item.id === selectedId);

  const filteredProfesionales = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');

    return profesionales.filter((item) => {
      const matchesStatus = statusFilter === 'TODOS' || item.estado === statusFilter;
      const matchesType = typeFilter === 'TODOS' || item.tipo === typeFilter;
      const searchableText = [
        item.nombre,
        item.cargo,
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

  const pendingCount = profesionales.filter((item) => item.estado === 'PENDIENTE').length;
  const approvedCount = profesionales.filter((item) => item.estado === 'APROBADO').length;
  const publishedCount = profesionales.filter((item) => item.publicado && item.activo).length;

  const closeDetails = () => {
    setSelectedId(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const updateProfessional = (id, changes) => {
    setProfesionales((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  };

  const handleApprove = () => {
    if (!selectedProfessional) return;

    updateProfessional(selectedProfessional.id, {
      estado: 'APROBADO',
      motivoRechazo: '',
      fechaActualizacion: 'Hoy',
    });
    setFeedback(
      `${selectedProfessional.nombre} fue aprobado. La publicación se administra por separado.`
    );
  };

  const handleReject = () => {
    if (!selectedProfessional || !rejectReason.trim()) return;

    updateProfessional(selectedProfessional.id, {
      estado: 'RECHAZADO',
      publicado: false,
      motivoRechazo: rejectReason.trim(),
      fechaActualizacion: 'Hoy',
    });
    setFeedback(`Se registró el rechazo de ${selectedProfessional.nombre} con su motivo.`);
    closeDetails();
  };

  const getInitials = (name) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('es');

  return (
    <div className="admin-prof-page">
      <header className="admin-prof-header">
        <div>
          <span className="admin-prof-overtitle">PANEL DE CONTROL DIRECTIVO</span>
          <h1>Revisión de Profesionales</h1>
          <p>Revisá y respondé las solicitudes de profesionales enviadas por el CMS.</p>
        </div>
      </header>

      <div className="admin-prof-demo-note" role="note">
        <span className="admin-prof-demo-dot" />
        Vista de diseño con datos ilustrativos. Las acciones aún no se conectan al backend.
      </div>

      {feedback && (
        <div className="admin-prof-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <section className="admin-prof-summary" aria-label="Resumen de profesionales">
        <article className="admin-prof-summary-card is-pending">
          <span className="admin-prof-summary-icon"><UserRound size={19} /></span>
          <div>
            <span>Pendientes de revisión</span>
            <strong>{pendingCount}</strong>
          </div>
        </article>
        <article className="admin-prof-summary-card is-approved">
          <span className="admin-prof-summary-icon"><BadgeCheck size={19} /></span>
          <div>
            <span>Aprobados</span>
            <strong>{approvedCount}</strong>
          </div>
        </article>
        <article className="admin-prof-summary-card is-published">
          <span className="admin-prof-summary-icon"><Globe2 size={19} /></span>
          <div>
            <span>Visibles al público</span>
            <strong>{publishedCount}</strong>
          </div>
        </article>
        <article className="admin-prof-summary-card is-total">
          <span className="admin-prof-summary-icon"><Users size={19} /></span>
          <div>
            <span>Registros consultados</span>
            <strong>{profesionales.length}</strong>
          </div>
        </article>
      </section>

      <section className="admin-prof-card" aria-labelledby="admin-prof-list-title">
        <div className="admin-prof-card-heading">
          <div>
            <h2 id="admin-prof-list-title">Directorio profesional</h2>
            <p>Consultá perfiles, asociaciones y estado editorial de cada registro.</p>
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
            <span>Estado editorial</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendiente de aprobación</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
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
          <table className="admin-prof-table">
            <thead>
              <tr>
                <th scope="col">Profesional</th>
                <th scope="col">Especialidad / área</th>
                <th scope="col">Editor / fecha</th>
                <th scope="col">Estado editorial</th>
                <th scope="col">Publicación</th>
                <th scope="col"><span className="admin-prof-visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredProfesionales.map((item) => (
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
                        <strong>{item.nombre}</strong>
                        <span>{item.cargo}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Especialidad / área">
                    <div className="admin-prof-association-cell">
                      <strong><Stethoscope size={14} />{item.especialidad}</strong>
                      <span><Building2 size={14} />{item.area}</span>
                    </div>
                  </td>
                  <td data-label="Editor / fecha">
                    <div className="admin-prof-editor-cell">
                      <span>{item.editor}</span>
                      <small><CalendarDays size={13} />{item.fechaActualizacion}</small>
                    </div>
                  </td>
                  <td data-label="Estado editorial">
                    <span className={`admin-prof-status is-${item.estado.toLowerCase()}`}>
                      {estadoLabels[item.estado]}
                    </span>
                  </td>
                  <td data-label="Publicación">
                    <span className={`admin-prof-publication ${item.publicado ? 'is-visible' : ''} ${!item.activo ? 'is-inactive' : ''}`}>
                      {item.publicado && item.activo
                        ? 'Publicado'
                        : item.publicado
                          ? 'Desactivado'
                          : item.estado === 'APROBADO'
                            ? 'Pendiente de publicación'
                            : 'No publicado'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      type="button"
                      className="admin-prof-view-button"
                      aria-label={`Ver información de ${item.nombre}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProfesionales.length === 0 && (
                <tr>
                  <td className="admin-prof-empty" colSpan="6">
                    No se encontraron profesionales con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  <span className={`admin-prof-status is-${selectedProfessional.estado.toLowerCase()}`}>
                    {estadoLabels[selectedProfessional.estado]}
                  </span>
                </div>
              </div>

              <div className="admin-prof-detail-grid">
                <article className="admin-prof-detail">
                  <h4>Especialidad asociada</h4>
                  <p>{selectedProfessional.especialidad}</p>
                </article>
                <article className="admin-prof-detail">
                  <h4>Área correspondiente</h4>
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
                    {!selectedProfessional.activo
                      ? 'Desactivado'
                      : selectedProfessional.publicado
                        ? 'Publicado y activo'
                        : selectedProfessional.estado === 'APROBADO'
                          ? 'Aprobado, pendiente de publicación'
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
                    >
                      <XCircle size={17} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="admin-prof-button is-primary"
                      onClick={handleApprove}
                    >
                      <CheckCircle size={17} /> Aprobar solicitud
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
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="admin-prof-button is-danger"
                      onClick={handleReject}
                      disabled={!rejectReason.trim()}
                    >
                      Confirmar rechazo
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