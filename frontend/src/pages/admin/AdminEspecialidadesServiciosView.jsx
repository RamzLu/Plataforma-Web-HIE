import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle,
  Clock3,
  Globe2,
  Search,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';
import '../../styles/pages/admin/AdminEspecialidadesServiciosView.css';

const initialItems = [
  {
    id: 1,
    name: 'Cardiología',
    type: 'Especialidad',
    association: 'Consultorios externos',
    description: 'Atención y seguimiento de enfermedades cardiovasculares.',
    hours: 'Lunes a viernes, de 8:00 a 12:00',
    location: 'Consultorios externos - Planta baja',
    requirements: 'Presentar documento de identidad y orden médica.',
    documentation: 'Orden médica y estudios previos, si los hubiera.',
    referral: 'Derivación desde clínica médica u otra especialidad.',
    editor: 'Ana López',
    updatedAt: '12/10/2026',
    status: 'Pendiente de aprobación',
    published: false,
    active: true,
  },
  {
    id: 2,
    name: 'Diagnóstico por imágenes',
    type: 'Servicio',
    association: 'Diagnóstico y tratamiento',
    description: 'Realización de estudios de diagnóstico por imágenes.',
    hours: 'Lunes a viernes, de 7:00 a 18:00',
    location: 'Edificio central - Planta baja',
    requirements: 'Consultar indicaciones específicas al solicitar el turno.',
    documentation: 'Orden médica y documento de identidad.',
    referral: 'Se requiere orden del profesional tratante.',
    editor: 'Carlos Ruiz',
    updatedAt: '10/10/2026',
    status: 'Rechazado',
    rejectionReason: 'Falta indicar las instrucciones para solicitar un turno.',
    published: false,
    active: true,
  },
  {
    id: 3,
    name: 'Clínica médica',
    type: 'Especialidad',
    association: 'Consultorios externos',
    description: 'Atención integral para la prevención, diagnóstico y tratamiento.',
    hours: 'Lunes a viernes, de 8:00 a 16:00',
    location: 'Consultorios externos - Planta baja',
    requirements: 'Presentar documento de identidad.',
    documentation: 'Documento de identidad y estudios previos.',
    referral: 'Acceso directo o derivación según disponibilidad.',
    editor: 'Ana López',
    updatedAt: '08/10/2026',
    status: 'Aprobado',
    published: true,
    active: true,
  },
];

const statusClass = (status) => {
  if (status === 'Aprobado' || status === 'Publicado') return 'admin-es-status-approved';
  if (status === 'Rechazado') return 'admin-es-status-rejected';
  return 'admin-es-status-pending';
};

const AdminEspecialidadesServiciosView = () => {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState(null);
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    return items.filter((item) => {
      const matchesType = typeFilter === 'Todos' || item.type === typeFilter;
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'PENDIENTE' && item.status === 'Pendiente de aprobación') ||
        (statusFilter === 'APROBADO' && item.status === 'Aprobado' && !item.published) ||
        (statusFilter === 'PUBLICADO' && item.published && item.active) ||
        (statusFilter === 'RECHAZADO' && item.status === 'Rechazado');
      const matchesSearch = !normalizedSearch
        || `${item.name} ${item.association} ${item.editor}`.toLocaleLowerCase('es').includes(normalizedSearch);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter, typeFilter]);

  const closeDetails = () => {
    setSelectedItem(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const updateItem = (id, changes) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === id ? { ...item, ...changes } : item
    )));
    setSelectedItem((currentItem) => (
      currentItem?.id === id ? { ...currentItem, ...changes } : currentItem
    ));
  };

  const handleApprove = () => {
    updateItem(selectedItem.id, { status: 'Aprobado', published: false });
    setFeedback(`${selectedItem.name} fue aprobado. El CMS ya puede publicarlo.`);
    closeDetails();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setFeedback('Ingresá un motivo para que el Editor CMS pueda corregir la información.');
      return;
    }
    updateItem(selectedItem.id, {
      status: 'Rechazado',
      rejectionReason: rejectReason.trim(),
      published: false,
    });
    setFeedback(`${selectedItem.name} fue rechazado y se registró el motivo para el CMS.`);
    closeDetails();
  };

  const handleToggleActive = () => {
    const nextActive = !selectedItem.active;
    updateItem(selectedItem.id, { active: nextActive, published: nextActive && selectedItem.published });
    setFeedback(`${selectedItem.name} ${nextActive ? 'fue activado' : 'fue desactivado'}.`);
  };

  const pendingCount = items.filter((item) => item.status === 'Pendiente de aprobación').length;
  const approvedCount = items.filter((item) => item.status === 'Aprobado' && !item.published).length;
  const publishedCount = items.filter((item) => item.published && item.active).length;
  const rejectedCount = items.filter((item) => item.status === 'Rechazado').length;

  return (
    <div className="admin-es-page">
      <header className="admin-es-page-header admin-view-heading">
        <span className="admin-es-overtitle">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Servicios y Especialidades</h1>
        <p>Revisá la información enviada por el CMS y gestioná su aprobación y vigencia pública.</p>
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
            <h2 id="admin-es-list-title">Información cargada</h2>
            <p>Revisá descripciones, requisitos, horarios, ubicación y asociaciones antes de aprobar.</p>
          </div>
          <span className="admin-es-result-count">
            {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        <div className="admin-es-toolbar">
          <label className="admin-es-search">
            <Search size={18} aria-hidden="true" />
            <span className="admin-es-visually-hidden">Buscar por nombre, asociación o editor</span>
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
          <table className="admin-es-table">
            <thead>
              <tr>
                <th scope="col">Servicio / Especialidad</th>
                <th scope="col">Tipo</th>
                <th scope="col">Asociación</th>
                <th scope="col">Editor / fecha</th>
                <th scope="col">Revisión</th>
                <th scope="col">Publicación</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      type="button"
                      className="admin-es-name-button"
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className="admin-es-item-icon"><Stethoscope size={18} /></span>
                      <span>{item.name}</span>
                    </button>
                  </td>
                  <td>{item.type}</td>
                  <td>{item.association}</td>
                  <td>
                    <span>{item.editor}</span>
                    <small>{item.updatedAt}</small>
                  </td>
                  <td>
                    <span className={`admin-es-status ${statusClass(item.published ? 'Publicado' : item.status)}`}>
                      {item.published ? 'Publicado' : item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-es-publication ${item.published ? 'is-published' : ''}`}>
                      {!item.active
                        ? 'Desactivado'
                        : item.published
                          ? 'Publicado'
                          : item.status === 'Aprobado'
                            ? 'Disponible para CMS'
                            : 'No disponible'                            }
                    </span>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td className="admin-es-empty" colSpan="6">No se encontraron servicios o especialidades.</td>
                </tr>
              )}
            </tbody>
          </table>
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
                <span>{selectedItem.type} · {selectedItem.association}</span>
                <h2 id="admin-es-modal-title">{selectedItem.name}</h2>
              </div>
              <button type="button" className="admin-es-close-button" aria-label="Cerrar detalle" onClick={closeDetails}>
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
                  <p>{selectedItem.requirements || 'Sin información cargada.'}</p>
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
                <span>Enviado por <strong>{selectedItem.editor}</strong></span>
                <span>Última modificación: <strong>{selectedItem.updatedAt}</strong></span>
                <span>Estado: <strong>{selectedItem.status}</strong></span>
                <span>Vigencia: <strong>{selectedItem.active ? 'Activa' : 'Desactivada'}</strong></span>
                {selectedItem.rejectionReason && (
                  <span>Motivo del rechazo: <strong>{selectedItem.rejectionReason}</strong></span>
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
                  <button type="button" className="admin-es-button admin-es-button-danger" onClick={() => setIsRejecting(true)}>
                    <XCircle size={17} /> Rechazar
                  </button>
                  <button type="button" className="admin-es-button admin-es-button-primary" onClick={handleApprove}>
                    <CheckCircle size={17} /> Aprobar
                  </button>
                </>
              )}
              {isRejecting && (
                <>
                  <button type="button" className="admin-es-button admin-es-button-secondary" onClick={() => setIsRejecting(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="admin-es-button admin-es-button-danger" onClick={handleReject}>
                    Confirmar rechazo
                  </button>
                </>
              )}
              {selectedItem.status === 'Aprobado' && !isRejecting && (
                <button
                  type="button"
                  className={`admin-es-button ${selectedItem.active ? 'admin-es-button-danger' : 'admin-es-button-primary'}`}
                  onClick={handleToggleActive}
                >
                  {selectedItem.active ? 'Desactivar información' : 'Activar información'}
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
