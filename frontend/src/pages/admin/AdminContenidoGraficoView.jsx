import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock3,
  CheckCircle,
  Globe2,
  XCircle,
  Archive,
  Search,
  X,
  Eye,
  Layers,
  ArrowRight,
  FileClock,
} from 'lucide-react';
import { getContenidosGraficos } from '../../api/contenidoGrafico.api';
import {
  DEFAULT_CARRUSEL_INICIO,
  DEFAULT_PACIENTES_INICIO,
  DEFAULT_APRENDE_INICIO,
  DEFAULT_RESIDENCIAS_HERO,
  PORTAL_INTERNAL_ROUTES,
  getPortalRouteLabel,
  resolveGraphicImageUrl,
} from '../../utils/contenidoGraficoPresets';
import {
  PortalCarouselPreview,
  PortalPatientInfoPreview,
  PortalAprendePreview,
  PortalResidenciasHeroPreview,
} from '../../components/cms/CmsContenidoGraficoCorrectionModal';
import '../../styles/pages/admin/AdminContenidoGraficoView.css';

const STATUS_LABELS = {
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  APROBADO: 'Aprobada',
  PUBLICADO: 'Publicada',
  RECHAZADO: 'Rechazada',
  ARCHIVADO: 'Archivada',
  BORRADOR: 'Borrador',
};

const INITIAL_ESPACIOS = [
  { ...DEFAULT_CARRUSEL_INICIO, estado: 'PENDIENTE_APROBACION' },
  { ...DEFAULT_PACIENTES_INICIO, estado: 'PUBLICADO' },
  { ...DEFAULT_APRENDE_INICIO, estado: 'APROBADO' },
  { ...DEFAULT_RESIDENCIAS_HERO, estado: 'PENDIENTE_APROBACION' },
];

const AdminContenidoGraficoView = ({ onPendingCountChange } = {}) => {
  const [espacios, setEspacios] = useState(INITIAL_ESPACIOS);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [filtroPagina, setFiltroPagina] = useState('');

  // Estados del modal de revisión de solo lectura
  const [selectedEspacio, setSelectedEspacio] = useState(null);
  const [safeIndex, setSafeIndex] = useState(0);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cargarEspacios = async () => {
      try {
        const data = await getContenidosGraficos();
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          // Si vienen del backend, se fusionan asegurando estructura
          const map = new Map(data.map((item) => [item.id, item]));
          const merged = INITIAL_ESPACIOS.map((init) => map.get(init.id) || init);
          setEspacios(merged);
        }
      } catch (err) {
        console.warn('Aviso: usando espacios fijos iniciales para auditoría de Admin.', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    cargarEspacios();
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      pending: espacios.filter((e) => (e.estado || '').toUpperCase().includes('PENDIENTE')).length,
      approved: espacios.filter((e) => (e.estado || '').toUpperCase() === 'APROBADO').length,
      published: espacios.filter((e) => (e.estado || '').toUpperCase() === 'PUBLICADO').length,
      rejected: espacios.filter((e) => (e.estado || '').toUpperCase() === 'RECHAZADO').length,
      archived: espacios.filter((e) => (e.estado || '').toUpperCase() === 'ARCHIVADO').length,
    }),
    [espacios],
  );

  useEffect(() => {
    if (typeof onPendingCountChange === 'function') {
      onPendingCountChange(counts.pending);
    }
  }, [counts.pending, onPendingCountChange]);

  const paginasDisponibles = useMemo(() => {
    return Array.from(new Set(espacios.map((e) => e.page).filter(Boolean)));
  }, [espacios]);

  const espaciosFiltrados = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return espacios.filter((item) => {
      const est = (item.estado || 'PUBLICADO').toUpperCase();
      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'PENDIENTE_APROBACION' && est.includes('PENDIENTE')) ||
        est === statusFilter;

      const matchesPagina = !filtroPagina || item.page?.toLowerCase() === filtroPagina.toLowerCase();

      const text = [item.nombre, item.descripcion, item.page, item.tipo, item.ubicacion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);

      return matchesStatus && matchesPagina && matchesSearch;
    });
  }, [espacios, statusFilter, filtroPagina, search]);

  const openReviewModal = (espacio) => {
    setSelectedEspacio(espacio);
    setSafeIndex(0);
    setShowRejectForm(false);
    setRejectReason('');
    setActionError('');
  };

  const closeReviewModal = () => {
    if (isSaving) return;
    setSelectedEspacio(null);
    setSafeIndex(0);
    setShowRejectForm(false);
    setRejectReason('');
    setActionError('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedEspacio && !isSaving) {
        closeReviewModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEspacio, isSaving]);

  const handleApprove = () => {
    if (!selectedEspacio || isSaving) return;
    setIsSaving(true);
    setActionError('');
    try {
      setEspacios((prev) =>
        prev.map((e) =>
          e.id === selectedEspacio.id
            ? { ...e, estado: 'APROBADO', rejectionReason: '' }
            : e,
        ),
      );
      setFeedback(`Se aprobó correctamente la sección “${selectedEspacio.nombre}”.`);
      closeReviewModal();
    } catch (err) {
      setActionError('No se pudo aprobar la sección.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReject = () => {
    if (!selectedEspacio || isSaving) return;
    const reason = (rejectReason || '').trim();
    if (!reason) {
      setActionError('Debe ingresar obligatoriamente el motivo del rechazo para el editor CMS.');
      return;
    }
    setIsSaving(true);
    setActionError('');
    try {
      setEspacios((prev) =>
        prev.map((e) =>
          e.id === selectedEspacio.id
            ? { ...e, estado: 'RECHAZADO', rejectionReason: reason }
            : e,
        ),
      );
      setFeedback(`Se rechazó la sección “${selectedEspacio.nombre}” con el motivo registrado.`);
      closeReviewModal();
    } catch (err) {
      setActionError('No se pudo registrar el rechazo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Identificación del tipo de sección fija activa
  const isCarruselInicio = selectedEspacio?.id === 'espacio-banner-inicio';
  const isSeccionPacientes = selectedEspacio?.id === 'espacio-seccion-pacientes';
  const isSeccionAprende = selectedEspacio?.id === 'espacio-aprende-inicio';
  const isTarjetaResidencias =
    selectedEspacio?.id === 'espacio-residencias-destacado' ||
    selectedEspacio?.esTarjetaResidencias;

  const imagenes = Array.isArray(selectedEspacio?.imagenes) ? selectedEspacio.imagenes : [];
  const currentSafeIndex = Math.min(safeIndex, Math.max(0, imagenes.length - 1));
  const activeImage = imagenes[currentSafeIndex] || null;

  const isSelectedPending =
    (selectedEspacio?.estado || '').toUpperCase().includes('PENDIENTE');

  return (
    <div className="admin-cg-page-admin admin-review-container-admin">
      {/* 1. Header de la página */}
      <header className="admin-page-header-admin admin-view-heading">
        <span className="admin-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
        <h1>Gestión de Contenidos Gráficos</h1>
        <p>
          Revisá y auditá los elementos visuales, su ubicación y orden de presentación en las páginas
          del Portal HIEF antes de su aprobación.
        </p>
      </header>

      {/* Banner de Feedback */}
      {feedback && (
        <div className="admin-cg-feedback-admin" role="status">
          <span>{feedback}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setFeedback('')}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Toolbar botón Todos */}
      <div className="admin-cg-summary-toolbar-admin">
        <button
          type="button"
          className={`admin-cg-reset-filter-admin ${
            statusFilter === 'TODOS' && !filtroPagina && !search ? 'is-active' : ''
          }`}
          onClick={() => {
            setStatusFilter('TODOS');
            setFiltroPagina('');
            setSearch('');
          }}
        >
          Todos
        </button>
      </div>

      {/* 5 Tarjetas Superiores Interactivas */}
      <section className="admin-cg-summary-admin" aria-label="Filtrar contenidos gráficos por estado">
        <button
          type="button"
          className={`admin-cg-summary-card-admin is-pending ${
            statusFilter === 'PENDIENTE_APROBACION' ? 'is-selected' : ''
          }`}
          onClick={() => setStatusFilter('PENDIENTE_APROBACION')}
        >
          <span><Clock3 size={19} /></span>
          <div><small>Pendientes de revisión</small><strong>{counts.pending}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-cg-summary-card-admin is-approved ${
            statusFilter === 'APROBADO' ? 'is-selected' : ''
          }`}
          onClick={() => setStatusFilter('APROBADO')}
        >
          <span><CheckCircle size={19} /></span>
          <div><small>Aprobadas</small><strong>{counts.approved}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-cg-summary-card-admin is-published ${
            statusFilter === 'PUBLICADO' ? 'is-selected' : ''
          }`}
          onClick={() => setStatusFilter('PUBLICADO')}
        >
          <span><Globe2 size={19} /></span>
          <div><small>Publicadas</small><strong>{counts.published}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-cg-summary-card-admin is-rejected ${
            statusFilter === 'RECHAZADO' ? 'is-selected' : ''
          }`}
          onClick={() => setStatusFilter('RECHAZADO')}
        >
          <span><XCircle size={19} /></span>
          <div><small>Rechazadas</small><strong>{counts.rejected}</strong></div>
        </button>
        <button
          type="button"
          className={`admin-cg-summary-card-admin is-archived ${
            statusFilter === 'ARCHIVADO' ? 'is-selected' : ''
          }`}
          onClick={() => setStatusFilter('ARCHIVADO')}
        >
          <span><Archive size={19} /></span>
          <div><small>Archivadas</small><strong>{counts.archived}</strong></div>
        </button>
      </section>

      {/* 2. Contenedor Principal (Dashboard-Card) y Tabla de 4 Secciones Fijas */}
      <section className="dashboard-card-admin admin-cg-card-admin" aria-labelledby="admin-cg-list-title">
        <div className="admin-cg-card-heading-admin">
          <div>
            <h2 className="dashboard-card-title-admin" id="admin-cg-list-title">
              Listado de Contenidos Gráficos
            </h2>
            <p className="news-view-subtitle-admin">
              Área de Revisión: Aprobación y auditoría de las 4 secciones fijas predefinidas del portal
            </p>
          </div>
          <span className="admin-cg-result-count-admin">
            {espaciosFiltrados.length} {espaciosFiltrados.length === 1 ? 'sección fija' : 'secciones fijas'}
          </span>
        </div>

        {/* Buscador y filtro de página */}
        <div className="admin-cg-toolbar-admin">
          <label className="admin-cg-search-admin">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por nombre de sección, página o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="admin-cg-page-filter-wrap-admin">
            <select
              value={filtroPagina}
              onChange={(e) => setFiltroPagina(e.target.value)}
              className="admin-cg-select-filter-admin"
            >
              <option value="">Todas las páginas</option>
              {paginasDisponibles.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla Data Grid SIN columna de acciones (toda la fila abre el modal) */}
        <div className="admin-cg-table-wrap-admin">
          <table className="admin-cg-table-admin">
            <thead>
              <tr>
                <th scope="col">CONTENIDO GRÁFICO</th>
                <th scope="col">PÁGINA Y UBICACIÓN</th>
                <th scope="col">TIPO Y ORDEN</th>
                <th scope="col">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="admin-cg-empty-admin">
                    Cargando secciones fijas del portal...
                  </td>
                </tr>
              ) : espaciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-cg-empty-admin">
                    No hay contenidos gráficos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                espaciosFiltrados.map((item, index) => {
                  const est = (item.estado || 'PUBLICADO').toUpperCase();
                  const isApproved = est === 'APROBADO' || est === 'PUBLICADO';
                  const isRejected = est === 'RECHAZADO';
                  const isPending = est.includes('PENDIENTE');
                  const isArchived = est === 'ARCHIVADO';

                  const imgs = Array.isArray(item.imagenes) ? item.imagenes : [];
                  const coverImg = resolveGraphicImageUrl(imgs[0]);

                  return (
                    <tr
                      key={item.id}
                      className="admin-cg-row-clickable-admin"
                      onClick={() => openReviewModal(item)}
                      title="Hacé clic para auditar y revisar esta sección"
                    >
                      {/* Columna 1: Contenido Gráfico */}
                      <td data-label="CONTENIDO GRÁFICO">
                        <div className="admin-cg-title-cell-admin">
                          <div className="admin-cg-thumb-box-admin">
                            {coverImg ? (
                              <img
                                src={coverImg}
                                alt={item.altText || item.nombre}
                                className="admin-cg-thumb-img-admin"
                              />
                            ) : (
                              <div className="admin-cg-placeholder-admin">
                                <Layers size={19} />
                              </div>
                            )}
                            <span className="admin-cg-thumb-count-admin">
                              {imgs.length} {imgs.length === 1 ? 'img' : 'imgs'}
                            </span>
                          </div>

                          <div className="admin-cg-info-col-admin">
                            <button
                              type="button"
                              className="admin-cg-title-button-admin"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(item);
                              }}
                            >
                              {item.nombre}
                            </button>
                            <small>{item.descripcion}</small>
                            {isRejected && item.rejectionReason && (
                              <span className="admin-cg-rejection-pill-preview-admin">
                                <strong>Motivo:</strong> {item.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna 2: Página y Ubicación */}
                      <td data-label="PÁGINA Y UBICACIÓN">
                        <div className="admin-cg-meta-cell-admin">
                          <span className="admin-cg-page-badge-admin">{item.page}</span>
                          <small className="admin-cg-submeta-admin">{item.ubicacion || item.tipo}</small>
                        </div>
                      </td>

                      {/* Columna 3: Tipo y Orden */}
                      <td data-label="TIPO Y ORDEN">
                        <div className="admin-cg-meta-cell-admin">
                          <span className="admin-cg-type-text-admin">{item.tipo}</span>
                          <small className="admin-cg-order-text-admin">
                            Orden #{item.orden || index + 1}
                            {item.dimensiones && ` • ${item.dimensiones}`}
                          </small>
                        </div>
                      </td>

                      {/* Columna 4: Estado */}
                      <td data-label="ESTADO">
                        <div className="admin-cg-status-wrapper-admin">
                          {isApproved && (
                            <span className="admin-cg-status-admin is-aprobado">
                              <span className="admin-cg-dot-admin" />
                              {est === 'APROBADO' ? 'APROBADA' : 'PUBLICADA'}
                            </span>
                          )}
                          {isPending && (
                            <span className="admin-cg-status-admin is-pendiente_aprobacion">
                              <span className="admin-cg-dot-admin" />
                              PENDIENTE
                            </span>
                          )}
                          {isRejected && (
                            <span className="admin-cg-status-admin is-rechazado">
                              <span className="admin-cg-dot-admin" />
                              RECHAZADA
                            </span>
                          )}
                          {isArchived && (
                            <span className="admin-cg-status-admin is-archivado">
                              <span className="admin-cg-dot-admin" />
                              ARCHIVADA
                            </span>
                          )}
                          <span className="admin-cg-active-pill-admin is-active">
                            Activo
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================
          MODAL DE REVISIÓN EXACTO DEL CMS (READ-ONLY + SOFT UI)
          ========================================================= */}
      {selectedEspacio && (
        <div className="admin-cg-overlay-admin" onClick={closeReviewModal}>
          <div
            className="admin-cg-modal-admin"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-cg-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="admin-cg-modal-header-admin">
              <div className="admin-cg-modal-heading-admin">
                <span>AUDITORÍA Y CONTROL • SOLO LECTURA</span>
                <div className="admin-cg-title-row-admin">
                  <h2 id="admin-cg-modal-title">{selectedEspacio.nombre}</h2>
                  <span
                    className={`admin-cg-status-admin is-${(selectedEspacio.estado || 'PUBLICADO').toLowerCase()}`}
                  >
                    {STATUS_LABELS[selectedEspacio.estado] || selectedEspacio.estado}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-cg-close-x-btn-admin"
                onClick={closeReviewModal}
                disabled={isSaving}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal: Previsualización idéntica al CMS + Inputs Read-Only */}
            <div className="admin-cg-modal-body-admin">
              {/* Motivo de rechazo previo si existiera */}
              {selectedEspacio.rejectionReason && (
                <div className="admin-cg-rejection-banner-admin">
                  <strong>Motivo de rechazo registrado para el CMS:</strong>
                  <p>{selectedEspacio.rejectionReason}</p>
                </div>
              )}

              {/* 1. Previsualización viva idéntica a cómo se ve en el portal */}
              <div className="admin-cg-section-card-admin">
                <label className="admin-cg-label-admin">
                  Previsualización en el Portal Público{' '}
                  <small>
                    ({selectedEspacio.page} • {selectedEspacio.tipo} • {selectedEspacio.dimensiones})
                  </small>
                </label>

                <div className="admin-cg-portal-preview-container-admin">
                  {isCarruselInicio ? (
                    <PortalCarouselPreview
                      imagenes={imagenes}
                      activeIndex={currentSafeIndex}
                      onChangeSlide={setSafeIndex}
                      textoSuperpuesto={selectedEspacio.textoSuperpuesto}
                      textoBoton={selectedEspacio.textoBoton}
                      altText={selectedEspacio.altText}
                    />
                  ) : isSeccionPacientes ? (
                    <PortalPatientInfoPreview
                      items={imagenes}
                      activeIndex={currentSafeIndex}
                      onSelectItem={setSafeIndex}
                    />
                  ) : isSeccionAprende ? (
                    <PortalAprendePreview
                      items={imagenes}
                      activeIndex={currentSafeIndex}
                      onSelectItem={setSafeIndex}
                    />
                  ) : isTarjetaResidencias ? (
                    <PortalResidenciasHeroPreview
                      titulo={selectedEspacio.titulo}
                      parrafoDescripcion={selectedEspacio.parrafoDescripcion}
                      textoBoton={selectedEspacio.textoBoton}
                      enlaceUrl={selectedEspacio.enlaceUrl}
                      imagen={activeImage}
                      altText={selectedEspacio.altText}
                    />
                  ) : (
                    <div className="admin-cg-preview-empty-admin">
                      Previsualización no disponible
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Parámetros de Presentación y Datos del CMS en Solo Lectura */}
              {/* TIPO: RESIDENCIAS */}
              {isTarjetaResidencias && (
                <div className="admin-cg-section-card-admin">
                  <div className="admin-cg-editor-header-bar-admin">
                    <span>Parámetros de la Tarjeta Informativa de Residencias</span>
                    <small>Valores cargados en el CMS (Read-Only)</small>
                  </div>

                  <div className="admin-cg-form-grid-admin">
                    <div className="is-full">
                      <label className="admin-cg-label-admin">Título de la Sección</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin"
                        value={selectedEspacio.titulo || ''}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="is-full">
                      <label className="admin-cg-label-admin">Párrafo Descriptivo</label>
                      <textarea
                        className="admin-cg-readonly-input-admin"
                        rows={3}
                        value={selectedEspacio.parrafoDescripcion || ''}
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="admin-cg-label-admin">Texto del Botón</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin"
                        value={selectedEspacio.textoBoton || ''}
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="admin-cg-label-admin">
                        Redirección del Botón (Módulo Interno del Sistema)
                      </label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin is-redirect"
                        value={getPortalRouteLabel(selectedEspacio.enlaceUrl) || selectedEspacio.enlaceUrl || 'Sin redirección'}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="is-full">
                      <label className="admin-cg-label-admin">Texto Alternativo de la Imagen (ALT)</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin"
                        value={selectedEspacio.altText || ''}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TIPO: SECCIÓN APRENDÉ CON EL EVITA */}
              {isSeccionAprende && (
                <div className="admin-cg-section-card-admin">
                  <div className="admin-cg-editor-header-bar-admin">
                    <span>Componentes de la Sección Aprendé con el Evita</span>
                    <small>Hacé clic en cualquier pestaña para auditar ese elemento</small>
                  </div>

                  <div className="admin-cg-tabs-selector-admin">
                    {imagenes.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        className={`admin-cg-tab-btn-admin ${idx === currentSafeIndex ? 'is-active' : ''}`}
                        onClick={() => setSafeIndex(idx)}
                      >
                        {idx === 0 ? 'Bloque Principal' : `Tarjeta #${idx} (${item.titulo || 'Sin título'})`}
                      </button>
                    ))}
                  </div>

                  {activeImage && currentSafeIndex === 0 && (
                    <div className="admin-cg-form-grid-admin">
                      <div>
                        <label className="admin-cg-label-admin">Subtítulo Superior</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.subtituloEncabezado || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div>
                        <label className="admin-cg-label-admin">Título Principal</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.titulo || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Párrafo Descriptivo</label>
                        <textarea
                          className="admin-cg-readonly-input-admin"
                          rows={3}
                          value={activeImage.parrafoDescripcion || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Texto Alternativo (ALT)</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.altText || ''}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  {activeImage && currentSafeIndex > 0 && (
                    <div className="admin-cg-form-grid-admin">
                      <div>
                        <label className="admin-cg-label-admin">Etiqueta Superior</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.etiquetaSuperior || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div>
                        <label className="admin-cg-label-admin">Título de la Tarjeta</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.titulo || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">
                          Redirección al Módulo Interno
                        </label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin is-redirect"
                          value={getPortalRouteLabel(activeImage.enlaceUrl) || activeImage.enlaceUrl || 'Sin redirección'}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Texto Alternativo (ALT)</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.altText || ''}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIPO: INFORMACIÓN PARA PACIENTES */}
              {isSeccionPacientes && (
                <div className="admin-cg-section-card-admin">
                  <div className="admin-cg-editor-header-bar-admin">
                    <span>Desplegables de Información para Pacientes (5 ítems fijos)</span>
                    <small>Seleccioná un desplegable para auditar su contenido</small>
                  </div>

                  <div className="admin-cg-tabs-selector-admin">
                    {imagenes.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        className={`admin-cg-tab-btn-admin ${idx === currentSafeIndex ? 'is-active' : ''}`}
                        onClick={() => setSafeIndex(idx)}
                      >
                        #{idx + 1} {item.titulo || `Desplegable ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {activeImage && (
                    <div className="admin-cg-form-grid-admin">
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Título del Desplegable #{currentSafeIndex + 1}</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.titulo || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Texto Desplegable (Contenido Informativo)</label>
                        <textarea
                          className="admin-cg-readonly-input-admin"
                          rows={3}
                          value={activeImage.textoDesplegable || ''}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="is-full">
                        <label className="admin-cg-label-admin">Texto Alternativo (ALT)</label>
                        <input
                          type="text"
                          className="admin-cg-readonly-input-admin"
                          value={activeImage.altText || ''}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIPO: CARRUSEL PRINCIPAL DE INICIO */}
              {isCarruselInicio && (
                <div className="admin-cg-section-card-admin">
                  <div className="admin-cg-editor-header-bar-admin">
                    <span>Parámetros del Carrusel Principal</span>
                    <small>Configuración general y diapositivas (Read-Only)</small>
                  </div>

                  <div className="admin-cg-form-grid-admin">
                    <div className="is-full">
                      <label className="admin-cg-label-admin">Texto Superpuesto en el Carrusel</label>
                      <textarea
                        className="admin-cg-readonly-input-admin"
                        rows={3}
                        value={selectedEspacio.textoSuperpuesto || ''}
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="admin-cg-label-admin">Texto del Botón</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin"
                        value={selectedEspacio.textoBoton || 'Sin botón'}
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="admin-cg-label-admin">Redirección del Botón (Módulo Interno)</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin is-redirect"
                        value={getPortalRouteLabel(selectedEspacio.enlaceUrl) || selectedEspacio.enlaceUrl || 'Sin redirección'}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="is-full">
                      <label className="admin-cg-label-admin">Texto Alternativo General (ALT)</label>
                      <input
                        type="text"
                        className="admin-cg-readonly-input-admin"
                        value={selectedEspacio.altText || ''}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="is-full">
                      <label className="admin-cg-label-admin">
                        Diapositivas Activas ({imagenes.length} imágenes)
                      </label>
                      <div className="admin-cg-carrusel-slides-bar-admin">
                        {imagenes.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            className={`admin-cg-slide-chip-admin ${idx === currentSafeIndex ? 'is-active' : ''}`}
                            onClick={() => setSafeIndex(idx)}
                          >
                            <span>Slide #{idx + 1}</span>
                            <small>{img.fileName || `Imagen ${idx + 1}`}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parámetros de Presentación del Sistema */}
              <div className="admin-cg-params-summary-bar-admin">
                <div>
                  <small>PÁGINA DESTINO</small>
                  <strong>{selectedEspacio.page}</strong>
                </div>
                <div>
                  <small>TIPO DE BLOQUE</small>
                  <strong>{selectedEspacio.tipo}</strong>
                </div>
                <div>
                  <small>UBICACIÓN</small>
                  <strong>{selectedEspacio.ubicacion}</strong>
                </div>
                <div>
                  <small>ORDEN</small>
                  <strong>#{selectedEspacio.orden || 1}</strong>
                </div>
                <div>
                  <small>ESTADO EDITORIAL</small>
                  <strong className="is-status">{STATUS_LABELS[selectedEspacio.estado] || selectedEspacio.estado}</strong>
                </div>
              </div>

              {/* Formulario condicional para escribir motivo de rechazo */}
              {isSelectedPending && showRejectForm && (
                <div className="admin-cg-rejection-form-admin" role="group" aria-label="Justificación del Rechazo">
                  <label htmlFor="admin-cg-reject-reason-field">
                    <span>
                      Motivo del Rechazo para el Editor CMS <b>(Obligatorio)</b>
                    </span>
                    <textarea
                      id="admin-cg-reject-reason-field"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Indicá con claridad qué corrección debe realizar el editor en esta sección..."
                      required
                    />
                  </label>
                  <p>Al confirmar el rechazo, el contenido volverá al CMS con este motivo visible para ser corregido.</p>
                  {actionError && <p className="admin-cg-error-text-admin">{actionError}</p>}
                  <div className="admin-cg-rejection-btn-row-admin">
                    <button
                      type="button"
                      className="admin-cg-cancel-reject-btn-admin"
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
                      className="admin-cg-confirm-reject-btn-admin"
                      onClick={handleConfirmReject}
                      disabled={isSaving || !rejectReason.trim()}
                    >
                      Confirmar Rechazo
                    </button>
                  </div>
                </div>
              )}

              {!showRejectForm && actionError && (
                <p className="admin-cg-error-text-admin">{actionError}</p>
              )}
            </div>

            {/* Footer con Lógica Condicional Estricta:
                - Si es Pendiente: SÓLO Aprobar y Rechazar.
                - Si es Aprobada, Publicada, Rechazada o Archivada: NO renderiza botones.
                - NUNCA lleva botón de cerrar abajo ni publicar/archivar. */}
            {isSelectedPending && (
              <div className="admin-cg-modal-footer-admin">
                <div className="admin-cg-footer-actions-group-admin">
                  <button
                    type="button"
                    className="admin-cg-btn-action-admin is-approve"
                    onClick={handleApprove}
                    disabled={isSaving}
                  >
                    <CheckCircle size={17} />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="admin-cg-btn-action-admin is-reject"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContenidoGraficoView;
