import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  Clock3,
  Globe2,
  Lock,
  MapPin,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { getInstitucional } from '../../api/autoridades.api.js';
import fotoHeroHeader from '../../assets/foto-sede.jpg';
import fotoTemporalAutoridades from '../../assets/imagen-temporal-autoridades.jpg';
import '../../styles/pages/admin/AdminInstitucionalView.css';

// Valores institucionales fijos del proyecto (Inmutables por directiva institucional)
const MISIÓN_INSTITUCIONAL =
  'Brindar atención médica integral de alta complejidad, accesible, equitativa y gratuita a toda la comunidad formoseña y la región, con los más altos estándares científicos, tecnología biomédica de vanguardia y calidez humana.';

const VISIÓN_INSTITUCIONAL =
  'Ser un hospital público de referencia nacional y regional en alta complejidad, docencia e investigación biomédica, reconocido por la excelencia de sus servicios, la formación continua de sus profesionales y su compromiso con la salud como derecho humano inalienable.';

// Mock de respaldo con propuesta de cambio del Editor CMS para auditoría
const MOCK_INSTITUCIONAL_PENDIENTE = {
  estado: 'PENDIENTE_APROBACION',
  editorAutor: 'mlopez (Editor CMS)',
  fechaSolicitud: '2026-11-07T18:30:00.000Z',
  rejectionReason: null,
  nombreInstitucion: 'Hospital Interdistrital Evita - Centro de Alta Complejidad',
  nombreInstitucionModificado: true,
  presentacionHistoria:
    'El Hospital Interdistrital Evita es un centro de alta complejidad referente en la provincia de Formosa y el norte argentino, asentado sobre una moderna infraestructura de 19.000 metros cuadrados cubiertos proyectada bajo rigurosas normas sanitarias internacionales.',
  presentacionHistoriaModificado: false,
  sedeCentral: {
    titulo: 'Edificio Principal - Hospital Evita',
    tagSuperior: 'SEDE CENTRAL',
    direccion: 'Av. José de Luca Barberis N° 250',
    localidad: 'Formosa',
    provincia: 'Formosa',
    codigoPostal: 'CP 3600',
    parrafoDescripcion:
      'Infraestructura médica de vanguardia con 19.000 m² cubiertos diseñados bajo normas internacionales de arquitectura hospitalaria. Alberga la Guardia Central de Urgencias (24 hs), bloques quirúrgicos inteligentes, unidades de cuidados intensivos y el centro de diagnóstico por imágenes.',
    badgeAtencion: 'Guardia Activa 24 Hs.',
    altText: 'Edificio Principal Hospital Evita',
    imagenUrl: fotoHeroHeader,
    // Campos con modificaciones propuestas por el Editor CMS:
    direccionModificada: true,
    badgeAtencionModificado: false,
    descripcionModificada: true,
  },
  autoridades: [
    {
      id: 1,
      orden: 1,
      nombre: 'Dr. Jorge Alberto Gómez',
      cargo: 'Director Ejecutivo',
      descripcion: 'Médico Especialista en Cirugía General y Gestión de Servicios de Salud.',
      imagenUrl: fotoTemporalAutoridades,
      modificado: false,
    },
    {
      id: 2,
      orden: 2,
      nombre: 'Dra. María Elena Romero',
      cargo: 'Directora Médica Asistencial',
      descripcion: 'Especialista en Terapia Intensiva y Cuidados Críticos.',
      imagenUrl: fotoTemporalAutoridades,
      modificado: true,
    },
    {
      id: 3,
      orden: 3,
      nombre: 'Lic. Roberto Carlos Sánchez',
      cargo: 'Director Administrativo y Financiero',
      descripcion: 'Licenciado en Administración con orientación en Sistemas Sanitarios.',
      imagenUrl: fotoTemporalAutoridades,
      modificado: false,
    },
  ],
  redesSociales: {
    facebook: 'https://facebook.com/hospitalinterdistritalevita',
    instagram: 'https://instagram.com/hospital_evita_formosa',
    modificado: false,
  },
};

const AdminInstitucionalView = () => {
  const [data, setData] = useState(MOCK_INSTITUCIONAL_PENDIENTE);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'

  // Estados de Rechazo
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchInstitucionalData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getInstitucional();
      if (response) {
        setData((prev) => ({
          ...prev,
          autoridades: response.autoridades || prev.autoridades,
          redesSociales: response.redesSociales || prev.redesSociales,
          sedeCentral: {
            ...prev.sedeCentral,
            ...(response.sedeCentral || {}),
          },
        }));
      }
    } catch (err) {
      console.info('Conexión pasiva a getInstitucional(): utilizando datos de auditoría de respaldo.', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga pasiva de información institucional
  useEffect(() => {
    fetchInstitucionalData();
  }, [fetchInstitucionalData]);

  // Conteos de estado editorial para las tarjetas superiores
  const counts = useMemo(() => {
    return {
      pending: data.estado === 'PENDIENTE_APROBACION' ? 1 : 0,
      approved: data.estado === 'APROBADO' ? 1 : 0,
      published: data.estado === 'PUBLICADO' ? 1 : 0,
      rejected: data.estado === 'RECHAZADO' ? 1 : 0,
    };
  }, [data.estado]);

  // Handler para Aprobar Modificaciones (RF-031)
  const handleApprove = () => {
    setIsSaving(true);
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        estado: 'APROBADO',
        rejectionReason: null,
      }));
      setFeedback({
        type: 'success',
        message: 'Modificaciones aprobadas exitosamente. El contenido quedó habilitado para que el Editor CMS lo publique.',
      });
      setShowRejectForm(false);
      setRejectReason('');
      setIsSaving(false);
    }, 400);
  };

  // Handler para Confirmar Rechazo (RF-031)
  const handleConfirmReject = () => {
    const reason = rejectReason.trim();
    if (!reason) return;

    setIsSaving(true);
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        estado: 'RECHAZADO',
        rejectionReason: reason,
      }));
      setFeedback({
        type: 'error',
        message: 'Se rechazaron las modificaciones y se notificó al Editor CMS con el motivo registrado.',
      });
      setShowRejectForm(false);
      setIsSaving(false);
    }, 400);
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectReason('');
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
  };

  const isPending = data.estado === 'PENDIENTE_APROBACION';
  const isApproved = data.estado === 'APROBADO';
  const isPublished = data.estado === 'PUBLICADO';
  const isRejected = data.estado === 'RECHAZADO';

  return (
    <div className="admin-inst-page-admin">
      {/* 1. Header de la Página */}
      <header className="admin-inst-header-admin">
        <div className="admin-inst-header-info-admin">
          <span className="admin-inst-overtitle-admin">PANEL DE CONTROL DIRECTIVO</span>
          <h1>Revisión de Contenido Institucional</h1>
          <p>
            Evaluá las actualizaciones de la información institucional pública del Hospital Interdistrital Evita enviadas desde el CMS antes de autorizar su publicación.
          </p>
        </div>
        <button
          type="button"
          className="admin-refresh-btn"
          onClick={fetchInstitucionalData}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </header>

      {/* Banner de Feedback superior dismissible */}
      {feedback && (
        <div
          className={`admin-inst-feedback-admin is-${feedback.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setFeedback(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar para resetear filtros */}
      <div className="admin-inst-summary-toolbar-admin">
        <button
          type="button"
          className={`admin-inst-reset-filter-admin ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          aria-pressed={statusFilter === 'ALL'}
          onClick={resetFilters}
        >
          Todos
        </button>
      </div>

      {/* 2. Tarjetas de Filtro Superiores (Soft UI) */}
      <section className="admin-inst-summary-grid-admin" aria-label="Estados de revisión institucional">
        {/* Tarjeta: Pendientes de revisión */}
        <button
          type="button"
          className={`admin-inst-summary-card-admin is-pending ${statusFilter === 'PENDING' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PENDING'}
          onClick={() => setStatusFilter('PENDING')}
        >
          <span className="admin-inst-card-icon-admin">
            <Clock3 size={22} />
          </span>
          <div className="admin-inst-card-text-admin">
            <small>Pendientes de revisión</small>
            <strong>{counts.pending}</strong>
          </div>
        </button>

        {/* Tarjeta: Aprobadas / Habilitadas */}
        <button
          type="button"
          className={`admin-inst-summary-card-admin is-approved ${statusFilter === 'APPROVED' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'APPROVED'}
          onClick={() => setStatusFilter('APPROVED')}
        >
          <span className="admin-inst-card-icon-admin">
            <CheckCircle size={22} />
          </span>
          <div className="admin-inst-card-text-admin">
            <small>Aprobadas p/ publicar</small>
            <strong>{counts.approved}</strong>
          </div>
        </button>

        {/* Tarjeta: Publicadas */}
        <button
          type="button"
          className={`admin-inst-summary-card-admin is-published ${statusFilter === 'PUBLISHED' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'PUBLISHED'}
          onClick={() => setStatusFilter('PUBLISHED')}
        >
          <span className="admin-inst-card-icon-admin">
            <Globe2 size={22} />
          </span>
          <div className="admin-inst-card-text-admin">
            <small>Publicadas en Portal</small>
            <strong>{counts.published}</strong>
          </div>
        </button>

        {/* Tarjeta: Rechazadas */}
        <button
          type="button"
          className={`admin-inst-summary-card-admin is-rejected ${statusFilter === 'REJECTED' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'REJECTED'}
          onClick={() => setStatusFilter('REJECTED')}
        >
          <span className="admin-inst-card-icon-admin">
            <XCircle size={22} />
          </span>
          <div className="admin-inst-card-text-admin">
            <small>Rechazadas</small>
            <strong>{counts.rejected}</strong>
          </div>
        </button>
      </section>

      {/* 3. Banner de Alerta de Estado Editorial */}
      <section
        className={`admin-inst-status-banner-admin ${
          isPending
            ? 'is-pending'
            : isApproved
            ? 'is-approved'
            : isPublished
            ? 'is-published'
            : 'is-rejected'
        }`}
        aria-live="polite"
      >
        <div className="admin-inst-banner-content-admin">
          <div className="admin-inst-banner-icon-wrap-admin">
            {isPending && <Clock3 size={22} color="#d97706" />}
            {isApproved && <CheckCircle2 size={22} color="#16a34a" />}
            {isPublished && <Globe2 size={22} color="#0284c7" />}
            {isRejected && <XCircle size={22} color="#dc2626" />}
          </div>
          <div>
            <h3 className="admin-inst-banner-title-admin">
              {isPending && 'Solicitud de Modificación Pendiente de Evaluación'}
              {isApproved && 'Modificaciones Aprobadas (Habilitadas para Publicar)'}
              {isPublished && 'Contenido Institucional Publicado y Vigente'}
              {isRejected && 'Modificaciones Rechazadas por Dirección'}
            </h3>
            <p className="admin-inst-banner-desc-admin">
              {isPending &&
                `El Editor CMS (${data.editorAutor}) envió actualizaciones sobre la sede central y datos institucionales. Verificá los campos resaltados antes de aprobar o rechazar.`}
              {isApproved &&
                'Las actualizaciones fueron aprobadas por Dirección. El Editor CMS ya tiene habilitada la publicación en el portal público.'}
              {isPublished &&
                'Esta información es la que se encuentra actualmente en producción en la sección Acerca de del Portal HIE.'}
              {isRejected &&
                `Solicitud rechazada. Motivo: "${data.rejectionReason || 'Correcciones pendientes requeridas'}"`}
            </p>
          </div>
        </div>

        <div className="admin-inst-banner-badge-admin">
          {isPending && <span>⏳ Estado: Pendiente de Revisión</span>}
          {isApproved && <span>✅ Estado: Aprobado</span>}
          {isPublished && <span>🌐 Estado: Publicado</span>}
          {isRejected && <span>❌ Estado: Rechazado</span>}
        </div>
      </section>

      {/* 4. BLOQUE 1: SEDE CENTRAL (Edificio Principal - Acerca de) */}
      <section className="admin-inst-card-admin" aria-labelledby="admin-inst-sede-title">
        <div className="admin-inst-card-header-admin">
          <div className="admin-inst-header-left-admin">
            <div className="admin-inst-section-icon-wrap-admin">
              <Building2 size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="admin-inst-card-title-admin" id="admin-inst-sede-title">
                Sede Central (Edificio Principal)
                <span className="admin-inst-section-badge-admin">Acerca de</span>
              </h2>
              <p className="admin-inst-card-subtitle-admin">
                Información institucional, dirección y fotografía del edificio central en el portal público
              </p>
            </div>
          </div>

          {data.sedeCentral?.direccionModificada && isPending && (
            <span className="admin-inst-changed-badge-admin">
              <AlertTriangle size={13} />
              Contiene cambios propuestos
            </span>
          )}
        </div>

        {/* Previsualización 1:1 idéntica a la vista del portal y CMS */}
        <div className="admin-inst-sede-preview-box-admin">
          <div className="admin-inst-sede-card-admin">
            <div className="admin-inst-sede-img-box-admin">
              <img
                src={data.sedeCentral?.imagenUrl || fotoHeroHeader}
                alt={data.sedeCentral?.altText || 'Edificio Principal Hospital Evita'}
              />
            </div>
            <div className="admin-inst-sede-content-admin">
              <span className="admin-inst-sede-tag-admin">
                {data.sedeCentral?.tagSuperior || 'SEDE CENTRAL'}
              </span>
              <h3 className="admin-inst-sede-title-admin">
                {data.sedeCentral?.titulo || 'Edificio Principal - Hospital Evita'}
              </h3>
              <p className="admin-inst-sede-address-admin">
                <strong>Ubicación:</strong>{' '}
                {data.sedeCentral?.direccion || 'Av. José de Luca Barberis N° 250, Formosa, Argentina'}
              </p>
              <p className="admin-inst-sede-desc-admin">
                {data.sedeCentral?.parrafoDescripcion}
              </p>
              <div className="admin-inst-sede-badge-list-admin">
                <span className="admin-inst-sede-badge-item-admin">
                  <Clock size={15} />
                  {data.sedeCentral?.badgeAtencion || 'Guardia Activa 24 Hs.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grilla detallada de campos (100% Solo Lectura) */}
        <div className="admin-inst-sede-grid-admin">
          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Título de la Sede</span>
            </div>
            <div className="admin-inst-readonly-input-admin">
              {data.sedeCentral?.titulo}
            </div>
          </div>

          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Tag Superior</span>
            </div>
            <div className="admin-inst-readonly-input-admin">
              {data.sedeCentral?.tagSuperior}
            </div>
          </div>

          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Dirección</span>
              {data.sedeCentral?.direccionModificada && isPending && (
                <span className="admin-inst-changed-badge-admin">
                  Modificación pendiente
                </span>
              )}
            </div>
            <div
              className={`admin-inst-readonly-input-admin ${
                data.sedeCentral?.direccionModificada && isPending ? 'is-highlighted' : ''
              }`}
            >
              <MapPin size={16} color="#0284c7" style={{ marginRight: '8px' }} />
              {data.sedeCentral?.direccion}
            </div>
          </div>

          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Localidad, Provincia y Código Postal</span>
            </div>
            <div className="admin-inst-readonly-input-admin">
              {data.sedeCentral?.localidad}, {data.sedeCentral?.provincia} ({data.sedeCentral?.codigoPostal})
            </div>
          </div>

          <div className="admin-inst-field-row-admin" style={{ gridColumn: '1 / -1' }}>
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Descripción y Capacidades del Edificio</span>
              {data.sedeCentral?.descripcionModificada && isPending && (
                <span className="admin-inst-changed-badge-admin">
                  Modificación pendiente
                </span>
              )}
            </div>
            <div
              className={`admin-inst-readonly-textarea-admin ${
                data.sedeCentral?.descripcionModificada && isPending ? 'is-highlighted' : ''
              }`}
            >
              {data.sedeCentral?.parrafoDescripcion}
            </div>
          </div>
        </div>
      </section>

      {/* 5. BLOQUE 2: IDENTIDAD, PRESENTACIÓN, MISIÓN Y VISIÓN */}
      <section className="admin-inst-card-admin" aria-labelledby="admin-inst-identity-title">
        <div className="admin-inst-card-header-admin">
          <div className="admin-inst-header-left-admin">
            <div className="admin-inst-section-icon-wrap-admin">
              <Building size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="admin-inst-card-title-admin" id="admin-inst-identity-title">
                Identidad Institucional & Principios
                <span className="admin-inst-section-badge-admin">Polo Sanitario</span>
              </h2>
              <p className="admin-inst-card-subtitle-admin">
                Denominación oficial, reseña institucional y pilares fundamentales del hospital
              </p>
            </div>
          </div>
        </div>

        {/* Información Modificable (Sujeta a Aprobación - RF-030, RF-031) */}
        <div className="admin-inst-identity-grid-admin">
          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Nombre Oficial de la Institución</span>
              {data.nombreInstitucionModificado && isPending && (
                <span className="admin-inst-changed-badge-admin">
                  Modificación pendiente
                </span>
              )}
            </div>
            <div
              className={`admin-inst-readonly-input-admin ${
                data.nombreInstitucionModificado && isPending ? 'is-highlighted' : ''
              }`}
            >
              <strong>{data.nombreInstitucion}</strong>
            </div>
          </div>

          <div className="admin-inst-field-row-admin">
            <div className="admin-inst-field-header-admin">
              <span className="admin-inst-label-admin">Presentación e Historia Institucional</span>
            </div>
            <div className="admin-inst-readonly-textarea-admin">
              {data.presentacionHistoria}
            </div>
          </div>
        </div>

        {/* DISTINCIÓN VISUAL OBLIGATORIA: Información Fija del Proyecto (No Editable) */}
        <div className="admin-inst-fixed-section-admin">
          {/* Misión Institucional (Fija) */}
          <div className="admin-inst-fixed-card-admin">
            <div className="admin-inst-fixed-card-header-admin">
              <div className="admin-inst-fixed-title-wrap-admin">
                <ShieldCheck size={18} color="#0284c7" />
                <h4>Misión Institucional</h4>
              </div>
              <span className="admin-inst-fixed-badge-admin">
                <Lock size={12} />
                Información Fija Institucional (No editable)
              </span>
            </div>
            <p className="admin-inst-fixed-text-admin">
              "{MISIÓN_INSTITUCIONAL}"
            </p>
          </div>

          {/* Visión Institucional (Fija) */}
          <div className="admin-inst-fixed-card-admin">
            <div className="admin-inst-fixed-card-header-admin">
              <div className="admin-inst-fixed-title-wrap-admin">
                <ShieldCheck size={18} color="#0284c7" />
                <h4>Visión Institucional</h4>
              </div>
              <span className="admin-inst-fixed-badge-admin">
                <Lock size={12} />
                Información Fija Institucional (No editable)
              </span>
            </div>
            <p className="admin-inst-fixed-text-admin">
              "{VISIÓN_INSTITUCIONAL}"
            </p>
          </div>
        </div>
      </section>

      {/* 6. BLOQUE 3: AUTORIDADES (Tabla 100% Solo Lectura) */}
      <section className="admin-inst-card-admin" aria-labelledby="admin-inst-authorities-title">
        <div className="admin-inst-card-header-admin">
          <div className="admin-inst-header-left-admin">
            <div className="admin-inst-section-icon-wrap-admin">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="admin-inst-card-title-admin" id="admin-inst-authorities-title">
                Autoridades del Hospital
                <span className="admin-inst-section-badge-admin">Equipo Directivo</span>
              </h2>
              <p className="admin-inst-card-subtitle-admin">
                Nómina vigente de autoridades y directores en el portal público
              </p>
            </div>
          </div>
          <span className="admin-inst-section-badge-admin">
            {data.autoridades?.length || 0} autoridades registradas
          </span>
        </div>

        <div className="admin-inst-table-wrap-admin">
          <table className="admin-inst-table-admin">
            <thead>
              <tr>
                <th scope="col" style={{ width: '80px', textAlign: 'center' }}>ORDEN</th>
                <th scope="col">NOMBRE Y DESCRIPCIÓN</th>
                <th scope="col">CARGO</th>
                <th scope="col" style={{ width: '120px' }}>FOTOGRAFÍA</th>
                <th scope="col" style={{ width: '140px', textAlign: 'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {data.autoridades?.map((a, idx) => (
                <tr key={a.id || idx}>
                  <td style={{ textAlign: 'center' }}>
                    <span className="admin-inst-order-badge-admin">#{a.orden || idx + 1}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: '#0c2340', fontSize: '0.94rem' }}>{a.nombre}</strong>
                      {a.descripcion && (
                        <span style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
                          {a.descripcion}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{a.cargo}</span>
                  </td>
                  <td>
                    {a.imagenUrl ? (
                      <img
                        src={a.imagenUrl}
                        alt={a.nombre}
                        className="admin-inst-authority-img-admin"
                        onError={(e) => {
                          e.target.src = fotoTemporalAutoridades;
                        }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Sin imagen</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {a.modificado && isPending ? (
                      <span className="admin-inst-changed-badge-admin">
                        Modificado
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Vigente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. BLOQUE 4: REDES SOCIALES */}
      <section className="admin-inst-card-admin" aria-labelledby="admin-inst-social-title">
        <div className="admin-inst-card-header-admin">
          <div className="admin-inst-header-left-admin">
            <div className="admin-inst-section-icon-wrap-admin" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <Share2 size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="admin-inst-card-title-admin" id="admin-inst-social-title">
                Redes Sociales Institucionales
              </h2>
              <p className="admin-inst-card-subtitle-admin">
                Canales oficiales de difusión vinculados en el pie del portal público
              </p>
            </div>
          </div>
        </div>

        <div className="admin-inst-social-grid-admin">
          <div className="admin-inst-social-field-admin">
            <div className="admin-inst-social-label-row-admin">
              <div className="admin-inst-social-icon-admin facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </div>
              <span className="admin-inst-label-admin">Facebook Institucional</span>
            </div>
            <div className="admin-inst-readonly-input-admin">
              <a
                href={data.redesSociales?.facebook}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {data.redesSociales?.facebook || 'No configurado'}
              </a>
            </div>
          </div>

          <div className="admin-inst-social-field-admin">
            <div className="admin-inst-social-label-row-admin">
              <div className="admin-inst-social-icon-admin instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <span className="admin-inst-label-admin">Instagram Institucional</span>
            </div>
            <div className="admin-inst-readonly-input-admin">
              <a
                href={data.redesSociales?.instagram}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {data.redesSociales?.instagram || 'No configurado'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CONTROLES DE REVISIÓN: APROBAR O RECHAZAR (RF-031 y RF-032) */}
      {isPending && (
        <section className="admin-inst-review-actions-card-admin" aria-label="Acciones de auditoría y revisión">
          <div className="admin-inst-review-actions-header-admin">
            <div className="admin-inst-review-actions-title-admin">
              <h3>Resolución de Auditoría Directiva</h3>
              <p>
                Al aprobar las modificaciones, el sistema habilitará al Editor CMS para publicarlas inmediatamente en el portal.
              </p>
            </div>

            {!showRejectForm && (
              <div className="admin-inst-action-btns-admin">
                <button
                  type="button"
                  className="admin-inst-btn-reject-admin"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSaving}
                >
                  <XCircle size={18} />
                  <span>Rechazar</span>
                </button>

                <button
                  type="button"
                  className="admin-inst-btn-approve-admin"
                  onClick={handleApprove}
                  disabled={isSaving}
                >
                  <CheckCircle2 size={18} />
                  <span>{isSaving ? 'Aprobando...' : 'Aprobar Modificaciones'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Formulario desplegable de motivo de rechazo */}
          {showRejectForm && (
            <div className="admin-inst-reject-box-admin">
              <label htmlFor="admin-inst-reject-reason">
                Motivo del Rechazo Obligatorio para el Editor CMS:
              </label>
              <textarea
                id="admin-inst-reject-reason"
                className="admin-inst-reject-textarea-admin"
                placeholder="Indicá detalladamente qué datos o campos deben corregirse antes de volver a enviar esta solicitud..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="admin-inst-reject-footer-admin">
                <button
                  type="button"
                  className="admin-inst-btn-cancel-admin"
                  onClick={handleCancelReject}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-inst-btn-confirm-reject-admin"
                  onClick={handleConfirmReject}
                  disabled={isSaving || !rejectReason.trim()}
                >
                  <XCircle size={16} />
                  <span>{isSaving ? 'Guardando...' : 'Confirmar Rechazo'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Si fue rechazado previamente, muestra el motivo registrado */}
      {isRejected && data.rejectionReason && (
        <section className="admin-inst-card-admin" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="admin-inst-rejected-notice-admin">
            <XCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Motivo de Rechazo Registrado:</strong>
              <p>{data.rejectionReason}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminInstitucionalView;

