import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle,
  FileCheck2,
  FileText,
  FolderOpen,
  Globe2,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import '../../styles/pages/admin/AdminDocumentacionView.css';

const DOCUMENTATION_CATEGORIES = [
  'Guía y Orientación',
  'Información Institucional',
  'Prevención y Salud',
];

const initialDocuments = [
  {
    id: 'doc-001',
    title: 'Guía de preparación para estudios de laboratorio',
    description:
      'Indicaciones generales para la preparación previa a los análisis de laboratorio, incluyendo recomendaciones sobre ayuno y documentación necesaria.',
    category: 'Guía y Orientación',
    fileName: 'guia-preparacion-laboratorio.pdf',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    creator: 'María Gómez',
    createdAt: '04/11/2026',
    updatedAt: '04/11/2026',
    status: 'PENDIENTE',
    rejectionReason: '',
    previewText:
      'Esta guía reúne las recomendaciones generales para asistir a los estudios de laboratorio. Consulte siempre las indicaciones específicas brindadas por el equipo de salud.',
  },
  {
    id: 'doc-002',
    title: 'Protocolo institucional de higiene de manos',
    description:
      'Material institucional para la prevención y el control de infecciones en los espacios de atención.',
    category: 'Prevención y Salud',
    fileName: 'protocolo-higiene-manos.pdf',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    creator: 'Carlos Benítez',
    createdAt: '02/11/2026',
    updatedAt: '03/11/2026',
    status: 'APROBADO',
    rejectionReason: '',
    previewText:
      'El presente protocolo describe prácticas de higiene de manos para acompañar la seguridad de pacientes, visitantes y equipos de salud.',
  },
  {
    id: 'doc-003',
    title: 'Directorio de servicios hospitalarios',
    description:
      'Información de referencia sobre los servicios disponibles en el Hospital Interdistrital Evita.',
    category: 'Información Institucional',
    fileName: 'directorio-servicios.docx',
    fileType: 'DOCX',
    fileSize: '680 KB',
    creator: 'Lucía Ramírez',
    createdAt: '30/10/2026',
    updatedAt: '01/11/2026',
    status: 'RECHAZADO',
    rejectionReason: 'Actualizar los horarios informados y revisar la categoría asignada.',
    previewText:
      'Documento de referencia con información institucional de los servicios del Hospital.',
  },
  {
    id: 'doc-004',
    title: 'Recomendaciones para prevenir el dengue',
    description:
      'Consejos comunitarios para reducir criaderos de mosquitos y reconocer cuándo consultar al equipo de salud.',
    category: 'Prevención y Salud',
    fileName: 'prevencion-dengue.pdf',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    creator: 'María Gómez',
    createdAt: '28/10/2026',
    updatedAt: '29/10/2026',
    status: 'PENDIENTE',
    rejectionReason: '',
    previewText:
      'Eliminá recipientes que acumulen agua, mantené patios limpios y consultá al centro de salud ante síntomas. No te automediques.',
  },
];

const statusLabels = {
  PENDIENTE: 'Pendiente de aprobación',
  APROBADO: 'Aprobado',
  PUBLICADO: 'Publicado',
  RECHAZADO: 'Rechazado',
};

const AdminDocumentacionView = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedDocument = documents.find((document) => document.id === selectedId);
  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');

    return documents.filter((document) => {
      const matchesStatus = statusFilter === 'TODOS' || document.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'TODOS' || document.category === categoryFilter;
      const searchableText = [
        document.title,
        document.description,
        document.category,
        document.fileName,
        document.creator,
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

  const pendingCount = documents.filter((document) => document.status === 'PENDIENTE').length;
  const approvedCount = documents.filter((document) => document.status === 'APROBADO').length;
  const publishedCount = documents.filter((document) => document.status === 'PUBLICADO').length;
  const rejectedCount = documents.filter((document) => document.status === 'RECHAZADO').length;

  const closeDetails = () => {
    setSelectedId(null);
    setIsRejecting(false);
    setRejectReason('');
  };

  const updateDocumentStatus = (status, reason = '') => {
    if (!selectedDocument || selectedDocument.status !== 'PENDIENTE') return;

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === selectedDocument.id
          ? {
              ...document,
              status,
              rejectionReason: reason,
              updatedAt: 'Hoy',
            }
          : document
      )
    );

    setFeedback(
      status === 'APROBADO'
        ? `“${selectedDocument.title}” fue aprobado y queda disponible para publicación por el CMS.`
        : `“${selectedDocument.title}” fue rechazado y se envió el motivo al CMS.`
    );
    closeDetails();
  };

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (!reason) return;
    updateDocumentStatus('RECHAZADO', reason);
  };

  return (
    <div className="admin-doc-page">
      <header className="admin-doc-header admin-view-heading">
        <span className="admin-doc-overtitle">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Revisión de Documentación</h1>
        <p>Consultá y evaluá los documentos públicos enviados por el CMS.</p>
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
          className={`admin-doc-summary-card is-approved ${statusFilter === 'APROBADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APROBADO'}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span><FileCheck2 size={19} /></span>
          <div><small>Aprobados para CMS</small><strong>{approvedCount}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-doc-summary-card is-published ${statusFilter === 'PUBLICADO' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLICADO'}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span><Globe2 size={19} /></span>
          <div><small>Visibles al público</small><strong>{publishedCount}</strong></div>
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
            <h2 id="admin-doc-list-title">Documentos recibidos</h2>
            <p>Abrí el título para revisar descripción, categoría y vista previa del archivo.</p>
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
              <option value="TODOS">Todos</option>
              {DOCUMENTATION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>

        <div className="admin-doc-table-wrap">
          <table className="admin-doc-table">
            <thead>
              <tr>
                <th scope="col">Documento / archivo</th>
                <th scope="col">Categoría / tipo</th>
                <th scope="col">Creador / fecha</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((document) => (
                <tr key={document.id}>
                  <td data-label="Documento / archivo">
                    <div className="admin-doc-title-cell">
                      <span className={`admin-doc-file-icon is-${document.fileType.toLowerCase()}`}>
                        <FileText size={18} />
                      </span>
                      <span>
                        <button
                          type="button"
                          className="admin-doc-title-button"
                          onClick={() => setSelectedId(document.id)}
                        >
                          {document.title}
                        </button>
                        <small>{document.fileName}</small>
                      </span>
                    </div>
                  </td>
                  <td data-label="Categoría / tipo">
                    <div className="admin-doc-category-cell">
                      <strong>{document.category}</strong>
                      <small>{document.fileType} · {document.fileSize}</small>
                    </div>
                  </td>
                  <td data-label="Creador / fecha">
                    <div className="admin-doc-creator-cell">
                      <span>{document.creator}</span>
                      <small><CalendarDays size={13} />{document.updatedAt}</small>
                    </div>
                  </td>
                  <td data-label="Estado">
                    <span className={`admin-doc-status is-${document.status.toLowerCase()}`}>
                      {statusLabels[document.status]}
                    </span>
                    {document.status === 'APROBADO' && (
                      <small className="admin-doc-cms-hint">Disponible para CMS</small>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr><td className="admin-doc-empty" colSpan="4">No se encontraron documentos con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDocument && (
        <div className="admin-doc-overlay" onClick={closeDetails}>
          <section
            className="admin-doc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-doc-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-doc-modal-header">
              <div>
                <span>Revisión de documento público</span>
                <h2 id="admin-doc-modal-title">{selectedDocument.title}</h2>
              </div>
              <button type="button" aria-label="Cerrar detalle" onClick={closeDetails}>
                <X size={20} />
              </button>
            </header>

            <div className="admin-doc-modal-body">
              <div className="admin-doc-info-grid">
                <article><h3>Descripción</h3><p>{selectedDocument.description}</p></article>
                <article><h3>Categoría</h3><p>{selectedDocument.category}</p></article>
                <article><h3>Tipo de documento</h3><p>{selectedDocument.fileType}</p></article>
                <article><h3>Creador</h3><p>{selectedDocument.creator}</p></article>
                <article className="is-wide">
                  <h3>Archivo asociado</h3>
                  <p>{selectedDocument.fileName} <span>· {selectedDocument.fileSize}</span></p>
                </article>
              </div>

              <section className="admin-doc-preview" aria-label="Vista previa ilustrativa del documento">
                <div className="admin-doc-preview-toolbar">
                  <span><FileText size={16} /> Vista previa del archivo</span>
                  <small>{selectedDocument.fileType} · Página 1 de 1</small>
                </div>
                <article className="admin-doc-preview-page">
                  <div className="admin-doc-preview-brand">HOSPITAL INTERDISTRITAL EVITA · FORMOSA</div>
                  <div className="admin-doc-preview-rule" />
                  <span className="admin-doc-preview-category">{selectedDocument.category}</span>
                  <h3>{selectedDocument.title}</h3>
                  <p>{selectedDocument.description}</p>
                  <p>{selectedDocument.previewText}</p>
                  <div className="admin-doc-preview-footer">Material informativo institucional</div>
                </article>
                <p className="admin-doc-preview-disclaimer">Representación visual de ejemplo; el visor se conectará al archivo real al integrar el backend.</p>
              </section>

              <div className="admin-doc-state-row">
                <span>Estado actual</span>
                <strong className={`admin-doc-status is-${selectedDocument.status.toLowerCase()}`}>
                  {statusLabels[selectedDocument.status]}
                </strong>
                {selectedDocument.status === 'APROBADO' && (
                  <small>El CMS puede continuar con la publicación.</small>
                )}
              </div>

              {selectedDocument.rejectionReason && (
                <div className="admin-doc-rejection-note">
                  <strong>Motivo del rechazo</strong>
                  <p>{selectedDocument.rejectionReason}</p>
                </div>
              )}

              {isRejecting && (
                <label className="admin-doc-rejection-field">
                  <span>Motivo del rechazo <b>(requerido)</b></span>
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

            {selectedDocument.status === 'PENDIENTE' && (
              <footer className="admin-doc-modal-footer">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      className="admin-doc-button is-danger"
                      onClick={() => setIsRejecting(true)}
                    >
                      <XCircle size={17} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="admin-doc-button is-primary"
                      onClick={() => updateDocumentStatus('APROBADO')}
                    >
                      <CheckCircle size={17} /> Aprobar documento
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-doc-button is-secondary"
                      onClick={() => {
                        setIsRejecting(false);
                        setRejectReason('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="admin-doc-button is-danger"
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

export default AdminDocumentacionView;
