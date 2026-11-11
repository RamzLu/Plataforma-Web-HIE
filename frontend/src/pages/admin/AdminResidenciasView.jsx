import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import keycloak from '../../config/keycloak';
import { cambiarEstadoResidencia, getResidencias } from '../../api/residencias.api';
import bannerResidencias from '../../assets/medicos-residencias.jpg';
import { sanitizeUrl } from '../../utils/sanitizeUrl';
import '../../styles/pages/admin/AdminResidenciasView.css';

const STATUS_LABELS = {
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  APROBADO: 'Aprobada',
  PUBLICADO: 'Publicada',
  RECHAZADO: 'Rechazada',
  ARCHIVADO: 'Archivada',
  BORRADOR: 'Borrador',
};

const INITIAL_MOCK_RESIDENCIAS = [
  {
    id: 'sim-res-001',
    nombre: 'Residencia en Clínica Médica',
    categoria: 'Formación Médica de Posgrado - Ministerio de Desarrollo Humano',
    fechaInicio: '2026-08-01',
    fechaInicioVigencia: '2026-08-01',
    fechaConvocatoria: '2026-12-15',
    convocatoria: 'Abierta',
    descripcion:
      'Entrenamiento clínico intensivo en salas de internación general, cuidados intermedios y consultorios de orientación diagnóstica del Hospital Interdistrital Evita.',
    descripcionPrograma:
      'El programa formativo del Servicio de Clínica Médica del Hospital Interdistrital Evita prepara a los médicos residentes para abordar patologías clínicas complejas de alta prevalencia y cuadros atípicos, con enfoque en medicina humanizada, pases de sala interdisciplinarios y ateneos bibliográficos semanales.',
    cupos: '8 vacantes',
    duracion: '4 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico habilitado nacional o convalidado.\nInscripción formal en el Sistema Único de Residencias de Formosa.\nMatrícula profesional de la provincia de Formosa (o en trámite oficial).\nAprobación de la entrevista con el Comité de Docencia e Investigación.',
    reglamentoRotacion:
      'Descargue el cronograma de actividades, régimen de guardias docentes y plan de evaluación de Residencia.',
    estado: 'PENDIENTE_APROBACION',
    bannerNombre: 'residencia-clinica-medica-banner.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Programa_Formativo_Clinica_Medica_2026.pdf',
    documentoTamano: '1.4 MB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/programa-clinica-medica.pdf',
    motivoRechazo: '',
  },
  {
    id: 'sim-res-002',
    nombre: 'Residencia en Tocoginecología',
    categoria: 'Formación Médica de Posgrado - Ministerio de Desarrollo Humano',
    fechaInicio: '2026-09-10',
    fechaInicioVigencia: '2026-09-10',
    fechaConvocatoria: '2027-02-28',
    convocatoria: 'Proximamente',
    descripcion:
      'Formación médico-quirúrgica integral en obstetricia de alto riesgo, centro obstétrico, control prenatal y cirugía ginecológica.',
    descripcionPrograma:
      'El programa contempla rotaciones estructuradas en sala de partos, internación obstétrica, consultorios especializados de patología cervical, ecografía tocoginecológica y cirugías programadas de baja, mediana y alta complejidad.',
    cupos: '4 vacantes',
    duracion: '4 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico otorgado por universidad reconocida.\nInscripción en el Examen Único de Residencias Médicas.\nCertificado de aptitud psicofísica vigente.\nEntrevista presencial con el Comité de Docencia e Investigación.',
    reglamentoRotacion:
      'Bases curriculares, esquema de rotaciones por centro obstétrico y cronograma del próximo llamado.',
    estado: 'PENDIENTE_APROBACION',
    bannerNombre: 'banner-tocoginecologia-hie.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Bases_Residencia_Tocoginecologia_HIE.pdf',
    documentoTamano: '920 KB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/bases-tocoginecologia.pdf',
    motivoRechazo: '',
  },
  {
    id: 'sim-res-003',
    nombre: 'Residencia en Terapia Intensiva Adultos',
    categoria: 'Cuidados Críticos de Alta Complejidad - HIE',
    fechaInicio: '2026-07-15',
    fechaInicioVigencia: '2026-07-15',
    fechaConvocatoria: '2026-12-20',
    convocatoria: 'Abierta',
    descripcion:
      'Capacitación intensiva en soporte vital avanzado, monitoreo hemodinámico invasivo, asistencia respiratoria mecánica y neurointensivismo.',
    descripcionPrograma:
      'Orientada al manejo integral del paciente crítico en la Unidad de Terapia Intensiva del hospital, incorporando simulación clínica avanzada, ecografía multisistémica crítica (POCUS) y protocolos de procuración.',
    cupos: '5 vacantes',
    duracion: '4 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico habilitado.\nInscripción en el concurso provincial de residencias de salud.\nCurso de RCP básico/avanzado actualizado.\nDisponibilidad de dedicación exclusiva.',
    reglamentoRotacion:
      'Programa académico oficial, competencias por año formativo y régimen de guardias activas.',
    estado: 'APROBADO',
    bannerNombre: 'uti-adultos-portada.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Plan_Estudios_UTI_Adultos_2026.pdf',
    documentoTamano: '1.8 MB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/plan-uti-adultos.pdf',
    motivoRechazo: '',
  },
  {
    id: 'sim-res-004',
    nombre: 'Residencia en Pediatría',
    categoria: 'Formación Médica de Posgrado - Ministerio de Desarrollo Humano',
    fechaInicio: '2026-08-15',
    fechaInicioVigencia: '2026-08-15',
    fechaConvocatoria: '2027-03-31',
    convocatoria: 'Abierta',
    descripcion:
      'Formación en internación pediátrica, emergencias infantiles, recepción del recién nacido y consultorios de seguimiento del niño sano.',
    descripcionPrograma:
      'Rotaciones por salas de internación conjunta, guardia de emergencias pediátricas, neonatología y atención ambulatoria con tutoría permanente del plantel médico de planta.',
    cupos: '6 vacantes',
    duracion: '3 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico nacional o convalidado.\nInscripción provincial vigente.\nEsquema de vacunación completo para personal de salud.\nAprobación de evaluación escrita y entrevista docente.',
    reglamentoRotacion:
      'Programa de rotaciones hospitalarias y régimen de guardias del Servicio de Pediatría.',
    estado: 'PUBLICADO',
    bannerNombre: 'banner-pediatria.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Programa_Residencia_Pediatria_HIE.pdf',
    documentoTamano: '1.1 MB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/programa-pediatria.pdf',
    motivoRechazo: '',
  },
  {
    id: 'sim-res-005',
    nombre: 'Residencia en Cardiología Clínica',
    categoria: 'Especialidades Clínicas y Diagnóstico Cardiovascular',
    fechaInicio: '2026-08-01',
    fechaInicioVigencia: '2026-08-01',
    fechaConvocatoria: '2026-11-30',
    convocatoria: 'Abierta',
    descripcion:
      'Especialización en unidad coronaria, ergometría, ecocardiografía Doppler, electrofisiología básica y rehabilitación cardiovascular.',
    descripcionPrograma:
      'Desarrollo de competencias diagnósticas y terapéuticas en patología cardiovascular aguda y crónica, con participación activa en hemodinamia e interconsultas de alta complejidad.',
    cupos: '4 vacantes',
    duracion: '4 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico.\nCertificado de antecedentes ético-profesionales.\nInscripción en el Sistema Provincial de Residencias.\nAprobación de examen único.',
    reglamentoRotacion:
      'Cronograma anual de rotaciones por Unidad Coronaria, Consultorios Externos y Hemodinamia.',
    estado: 'PUBLICADO',
    bannerNombre: 'cardiologia-clinica-banner.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Programa_Cardiologia_HIE_2026.pdf',
    documentoTamano: '1.5 MB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/programa-cardiologia.pdf',
    motivoRechazo: '',
  },
  {
    id: 'sim-res-006',
    nombre: 'Residencia en Medicina Familiar y Comunitaria',
    categoria: 'Atención Primaria y Salud Comunitaria',
    fechaInicio: '2026-06-01',
    fechaInicioVigencia: '2026-06-01',
    fechaConvocatoria: '2026-10-15',
    convocatoria: 'Abierta',
    descripcion:
      'Formación integral en centros de salud y primer nivel de atención con articulación directa en el hospital interdistrital.',
    descripcionPrograma:
      'El trayecto formativo abarca consultorio de demanda espontánea, seguimiento de enfermedades crónicas no transmisibles, visitas domiciliarias y redes integradas de servicios de salud.',
    cupos: '10 vacantes',
    duracion: '3 Años • Red Provincial y Sede HIE',
    requisitos:
      'Título de Médico.\nDisponibilidad para rotaciones programadas en centros de salud.\nInscripción provincial.',
    reglamentoRotacion:
      'Programa de rotaciones comunitarias y pautas de evaluación anual.',
    estado: 'RECHAZADO',
    motivoRechazo:
      'Falta adjuntar el archivo PDF oficial con las bases provinciales actualizadas y la fecha límite de inscripción debe adecuarse al cronograma del Ministerio de Desarrollo Humano.',
    bannerNombre: '',
    bannerUrl: '',
    documentoNombre: '',
    documentoTamano: '',
    documentoTipo: 'PDF',
    documentoUrl: '',
  },
  {
    id: 'sim-res-007',
    nombre: 'Residencia en Cirugía General',
    categoria: 'Formación Médica Quirúrgica de Posgrado',
    fechaInicio: '2026-02-01',
    fechaInicioVigencia: '2026-02-01',
    fechaConvocatoria: '2026-05-30',
    convocatoria: 'Cerrada',
    descripcion:
      'Convocatoria correspondiente al ciclo lectivo anterior con totalidad de plazas cubiertas en bloque quirúrgico y guardia.',
    descripcionPrograma:
      'Entrenamiento progresivo en cirugía laparoscópica, trauma, guardia quirúrgica de urgencias, bloque quirúrgico central y seguimiento postoperatorio.',
    cupos: '5 vacantes',
    duracion: '4 Años • Sede Hospital Interdistrital Evita',
    requisitos:
      'Título de Médico.\nMatrícula profesional provincial.\nExamen único aprobado y orden de mérito.',
    reglamentoRotacion:
      'Reglamento histórico de guardias quirúrgicas y programa de rotaciones 2026.',
    estado: 'ARCHIVADO',
    bannerNombre: 'cirugia-general-hie.jpg',
    bannerUrl: bannerResidencias,
    documentoNombre: 'Reglamento_Cirugia_General_2026.pdf',
    documentoTamano: '1.1 MB',
    documentoTipo: 'PDF',
    documentoUrl: 'https://example.com/residencias/reglamento-cirugia.pdf',
    motivoRechazo: '',
  },
];

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
    (raw.createdAt ? String(raw.createdAt).slice(0, 10) : '2026-08-01');

  return {
    ...raw,
    id: raw.id ?? `res-${Math.random().toString(36).slice(2, 9)}`,
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
    requestedEstado: raw.requestedEstado || null,
    motivoRechazo: raw.motivoRechazo || raw.rejectionReason || '',
  };
};

const AdminResidenciasView = ({ onPendingCountChange } = {}) => {
  const [residencias, setResidencias] = useState(INITIAL_MOCK_RESIDENCIAS);
  const [isSimulation, setIsSimulation] = useState(true);
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
      if (!Array.isArray(data) || data.length === 0) {
        setResidencias(INITIAL_MOCK_RESIDENCIAS);
        setIsSimulation(true);
        return;
      }

      const normalizadas = data
        .map(normalizeResidenciaRecord)
        .filter(Boolean);

      // Integrar registros reales de la BD manteniendo los mocks de estados que no existan aún en BD
      // para permitir probar todos los filtros y flujos condicionales del modal.
      const nombresExistentes = new Set(
        normalizadas.map((item) => item.nombre.toLocaleLowerCase('es').trim()),
      );
      const mocksComplementarios = INITIAL_MOCK_RESIDENCIAS.filter(
        (mock) => !nombresExistentes.has(mock.nombre.toLocaleLowerCase('es').trim()),
      );

      setResidencias([...normalizadas, ...mocksComplementarios]);
      setIsSimulation(false);
    } catch (loadError) {
      console.error('Aviso al cargar residencias (usando datos iniciales):', loadError);
      setResidencias(INITIAL_MOCK_RESIDENCIAS);
      setIsSimulation(true);
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
      pending: residenciasVisibles.filter((r) => r?.estado === 'PENDIENTE_APROBACION').length,
      approved: residenciasVisibles.filter((r) => r?.estado === 'APROBADO').length,
      published: residenciasVisibles.filter((r) => r?.estado === 'PUBLICADO').length,
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
      const matchesStatus = statusFilter === 'TODOS' || item?.estado === statusFilter;
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
      const finalEstado = isArchiving ? 'ARCHIVADO' : 'APROBADO';
      const isMockItem =
        isSimulation || String(selectedResidencia?.id || '').startsWith('sim-res');

      if (!isMockItem) {
        try {
          const token = keycloak?.token || localStorage.getItem('token') || '';
          await cambiarEstadoResidencia(selectedResidencia.id, 'APROBADO', token);
        } catch (apiErr) {
          console.warn('Actualización optimista local para aprobación de residencia:', apiErr);
        }
      }

      setResidencias((current) =>
        current.map((item) =>
          item?.id === selectedResidencia.id
            ? {
                ...item,
                estado: finalEstado,
                motivoRechazo: '',
                rejectionReason: '',
              }
            : item,
        ),
      );

      setFeedback(
        isArchiving
          ? `La residencia “${selectedResidencia?.nombre || 'Residencia'}” fue archivada con éxito.`
          : `La solicitud de “${selectedResidencia?.nombre || 'Residencia'}” fue aprobada correctamente.`
      );
      closeDetails();
    } catch (err) {
      console.error('Error al aprobar la residencia:', err);
      setActionError(
        err?.response?.data?.error ||
          err?.message ||
          'No se pudo aprobar la solicitud de residencia.',
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
      const isMockItem =
        isSimulation || String(selectedResidencia?.id || '').startsWith('sim-res');

      if (!isMockItem) {
        try {
          const token = keycloak?.token || localStorage.getItem('token') || '';
          await cambiarEstadoResidencia(selectedResidencia.id, 'RECHAZADO', token, reason);
        } catch (apiErr) {
          console.warn('Actualización optimista local para rechazo de residencia:', apiErr);
        }
      }

      setResidencias((current) =>
        current.map((item) =>
          item?.id === selectedResidencia.id
            ? {
                ...item,
                estado: 'RECHAZADO',
                motivoRechazo: reason,
                rejectionReason: reason,
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
        err?.response?.data?.error ||
          err?.message ||
          'No se pudo registrar el rechazo de la residencia.',
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
              placeholder="Buscar por residencia, especialidad, categoría o estado de convocatoria..."
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
                <th scope="col">Convocatoria</th>
                <th scope="col">Fecha de Inicio / Vigencia</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="admin-res-empty-admin" colSpan="4">
                    Cargando residencias...
                  </td>
                </tr>
              ) : filteredResidencias.length === 0 ? (
                <tr>
                  <td className="admin-res-empty-admin" colSpan="4">
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
                              <Stethoscope size={19} />
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
                          </span>
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedResidencia && (
        <div className="admin-res-overlay-admin" onClick={closeDetails}>
          <section
            className="admin-res-modal-admin"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-res-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-res-modal-header-admin">
              <div className="admin-res-modal-heading-admin">
                <span>Revisión de solicitud • Solo lectura</span>
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
                  {isSelectedVigente && (
                    <span className="admin-res-vigente-badge-admin">
                      <span className="admin-res-pulse-admin" aria-hidden="true" />
                      Vigente
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={closeDetails}
              >
                <X size={20} />
              </button>
            </header>

            <div className="admin-res-modal-body-admin">
              {isSelectedPending && selectedResidencia?.requestedEstado === 'ARCHIVADO' && (
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
                    <strong>Solicitud de archivado:</strong> El editor del CMS solicita archivar esta residencia y retirarla del portal público.
                  </div>
                </div>
              )}
              <div className="admin-res-info-grid-admin">
                <article className="is-wide">
                  <h3>Nombre de la Residencia</h3>
                  <p>{selectedResidencia?.nombre || 'No especificado'}</p>
                </article>

                <article className="is-wide">
                  <h3>Categoría Institucional</h3>
                  <p>{selectedResidencia?.categoria || 'No especificada'}</p>
                </article>

                <article>
                  <h3>Fecha de Inicio / Apertura</h3>
                  <p>{formatDate(getStartDateValue(selectedResidencia))}</p>
                </article>

                <article>
                  <h3>Fecha Límite / Fecha de Examen</h3>
                  <p>{formatDate(selectedResidencia?.fechaConvocatoria)}</p>
                </article>

                <article>
                  <h3>Estado de la Convocatoria</h3>
                  <p>{normalizeConvocatoria(selectedResidencia?.convocatoria)}</p>
                </article>

                <article>
                  <h3>Duración Oficial y Cupos</h3>
                  <p>
                    {selectedResidencia?.duracion || 'Duración a confirmar'}
                    {selectedResidencia?.cupos ? ` • ${selectedResidencia.cupos}` : ''}
                  </p>
                </article>

                <article className="is-wide">
                  <h3>Resumen Breve del Encabezado</h3>
                  <p>
                    {selectedResidencia?.descripcion ||
                      'Sin resumen breve cargado por el editor.'}
                  </p>
                </article>

                <article className="is-wide">
                  <h3>Descripción del Programa Académico</h3>
                  <p className="admin-res-preline-admin">
                    {selectedResidencia?.descripcionPrograma ||
                      'Sin descripción detallada del programa académico.'}
                  </p>
                </article>

                <article className="is-wide">
                  <h3>Requisitos para la Postulación Provincial</h3>
                  {requisitosList.length > 0 ? (
                    <ul className="admin-res-requisitos-list-admin">
                      {requisitosList.map((reqItem, index) => (
                        <li key={`${index}-${reqItem.slice(0, 20)}`}>{reqItem}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No se registraron requisitos de postulación.</p>
                  )}
                </article>
              </div>

              <section
                className="admin-res-resources-admin"
                aria-label="Imagen de banner o portada"
              >
                <h3>Imagen de Banner / Portada</h3>
                {bannerUrlSafe ? (
                  <a
                    className="admin-res-resource-image-admin"
                    href={bannerUrlSafe}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={bannerUrlSafe}
                      alt={
                        selectedResidencia?.bannerNombre ||
                        'Imagen de portada de la residencia'
                      }
                    />
                    <span>
                      <ImageIcon size={16} />
                      {selectedResidencia?.bannerNombre || 'Imagen de portada'}
                      <ExternalLink size={14} />
                    </span>
                  </a>
                ) : (
                  <p className="admin-res-no-resources-admin">
                    No se adjuntó imagen de banner para la tarjeta.
                  </p>
                )}
              </section>

              <section
                className="admin-res-resources-admin"
                aria-label="Reglamento y documento adjunto"
              >
                <h3>Reglamento, Programa de Rotación y Documentos Asociados</h3>
                <p className="admin-res-legend-text-admin">
                  <strong>Leyenda configurada en CMS: </strong>
                  {selectedResidencia?.reglamentoRotacion ||
                    'Sin leyenda de reglamento especificada.'}
                </p>

                {documentoUrlSafe || selectedResidencia?.documentoNombre ? (
                  <div className="admin-res-resource-link-admin">
                    <FileText size={18} />
                    {documentoUrlSafe ? (
                      <a
                        href={documentoUrlSafe}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedResidencia?.documentoNombre ||
                          'Abrir programa o reglamento adjunto'}{' '}
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span>
                        {selectedResidencia?.documentoNombre ||
                          'Documento adjunto'}
                      </span>
                    )}
                    {(selectedResidencia?.documentoTipo ||
                      selectedResidencia?.documentoTamano) && (
                      <small>
                        {[
                          selectedResidencia?.documentoTipo,
                          selectedResidencia?.documentoTamano,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </small>
                    )}
                  </div>
                ) : (
                  <p className="admin-res-no-resources-admin">
                    No se adjuntó ningún documento PDF o Word del programa formativo.
                  </p>
                )}
              </section>

              {(selectedResidencia?.motivoRechazo ||
                selectedResidencia?.rejectionReason) && (
                <div className="admin-res-rejection-note-admin">
                  <strong>Motivo del rechazo informado al CMS</strong>
                  <p>
                    {selectedResidencia?.motivoRechazo ||
                      selectedResidencia?.rejectionReason}
                  </p>
                </div>
              )}

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
                    Al confirmar, la residencia pasará a estado Rechazada y el editor podrá visualizar esta justificación.
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
