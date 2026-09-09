import React, { useState } from 'react';
import { 
  FileText, 
  FileArchive, 
  Layout, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  ExternalLink,
  UserCheck,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import '../../styles/components/admin/AdminDashboardView.css'; 

const AdminDashboardView = ({ setActiveTab }) => {
  const [filterModule, setFilterModule] = useState('all');

  const pendingItems = [
    {
      id: 1,
      title: 'Campaña Prevención Dengue 2026',
      module: 'Noticias',
      tabKey: 'noticias',
      author: 'Editor CMS',
      date: 'Hace 2 horas',
      badgeColor: '#0ea5e9'
    },
    {
      id: 2,
      title: 'Formulario Alta Paciente V3.pdf',
      module: 'Documentación',
      tabKey: 'documentacion',
      author: 'Administrador',
      date: 'Hace 4 horas',
      badgeColor: '#10b981'
    },
    {
      id: 3,
      title: 'Nuevo Profesional: Dr. Gómez (Cardiología)',
      module: 'Profesionales',
      tabKey: 'profesionales',
      author: 'Editor CMS',
      date: 'Ayer',
      badgeColor: '#0284c7'
    },
    {
      id: 4,
      title: 'Curso Actualización RCP y Primeros Auxilios',
      module: 'Capacitaciones',
      tabKey: 'capacitaciones',
      author: 'Coord. Docencia',
      date: 'Ayer',
      badgeColor: '#059669'
    }
  ];

  const filteredItems = filterModule === 'all' 
    ? pendingItems 
    : pendingItems.filter(item => item.tabKey === filterModule);

  return (
    <div className="admin-dashboard-container">
      
      {/* TÍTULO DE LA SECCIÓN */}
      <div className="admin-page-title">
        <div className="admin-title-badge">PANEL DE CONTROL</div>
        <h1>Resumen del Portal</h1>
        <p>Vista general del estado de los contenidos, recursos activos y solicitudes pendientes de aprobación.</p>
      </div>

      {/* BLOQUE SUPERIOR: KPIS EN GRID BALANCEADO (6 TARJETAS EN 3 COLUMNAS / RESPONSIVE) */}
      <section className="dashboard-kpis-section">
        <div className="kpi-grid-redesigned">
          
          {/* Tarjeta 1: Noticias */}
          <div className="kpi-card-refined">
            <div className="kpi-card-top">
              <span className="kpi-label">Noticias Publicadas</span>
              <div className="kpi-icon-wrapper" style={{ color: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.08)' }}>
                <FileText size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">142</span>
            </div>
            <div className="kpi-footer-trend positive">
              <span className="trend-badge"><ArrowUpRight size={14} strokeWidth={3} /> +12</span>
              <span className="trend-text">este mes</span>
            </div>
          </div>

          {/* Tarjeta 2: Documentos */}
          <div className="kpi-card-refined">
            <div className="kpi-card-top">
              <span className="kpi-label">Documentos Activos</span>
              <div className="kpi-icon-wrapper" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                <FileArchive size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">85</span>
            </div>
            <div className="kpi-footer-trend positive">
              <span className="trend-badge"><CheckCircle2 size={14} strokeWidth={3} /> Al día</span>
              <span className="trend-text">repositorio verificado</span>
            </div>
          </div>

          {/* Tarjeta 3: Profesionales */}
          <div className="kpi-card-refined">
            <div className="kpi-card-top">
              <span className="kpi-label">Profesionales Activos</span>
              <div className="kpi-icon-wrapper" style={{ color: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.08)' }}>
                <UserCheck size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">48</span>
            </div>
            <div className="kpi-footer-trend positive">
              <span className="trend-badge"><ArrowUpRight size={14} strokeWidth={3} /> +3</span>
              <span className="trend-text">incorporaciones</span>
            </div>
          </div>

          {/* Tarjeta 4: Capacitaciones */}
          <div className="kpi-card-refined">
            <div className="kpi-card-top">
              <span className="kpi-label">Capacitaciones</span>
              <div className="kpi-icon-wrapper" style={{ color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.08)' }}>
                <GraduationCap size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">12</span>
            </div>
            <div className="kpi-footer-trend positive">
              <span className="trend-badge"><CheckCircle2 size={14} strokeWidth={3} /> Abiertas</span>
              <span className="trend-text">con cupos libres</span>
            </div>
          </div>

          {/* Tarjeta 5: Banners */}
          <div className="kpi-card-refined">
            <div className="kpi-card-top">
              <span className="kpi-label">Banners en Carrusel</span>
              <div className="kpi-icon-wrapper" style={{ color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.08)' }}>
                <Layout size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">4</span>
            </div>
            <div className="kpi-footer-trend neutral">
              <span className="trend-badge neutral-pill"><CheckCircle2 size={14} strokeWidth={3} /> Óptimo</span>
              <span className="trend-text">rotación activa</span>
            </div>
          </div>

          {/* Tarjeta 6: Solicitudes Pendientes */}
          <div className="kpi-card-refined alert-highlight">
            <div className="kpi-card-top">
              <span className="kpi-label">Pendientes de Revisión</span>
              <div className="kpi-icon-wrapper" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <AlertCircle size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: '#d97706' }}>7</span>
            </div>
            <div className="kpi-footer-trend warning">
              <span className="trend-badge warning-pill">Acción requerida</span>
              <span className="trend-text">solicitudes en cola</span>
            </div>
          </div>

        </div>
      </section>

      {/* FILA INTERMEDIA: ESTADÍSTICAS EN CONTENEDOR DEDICADO + RESUMEN OPERATIVO */}
      <section className="dashboard-analytics-row">
        
        {/* Gráfico de Anillo: Distribución de Contenidos Proporcionado */}
        <div className="chart-card-proportional">
          <div className="card-header-clean">
            <div>
              <h3>Distribución de Contenidos</h3>
              <p className="card-subtitle">Balance de recursos publicados en el portal</p>
            </div>
            <span className="status-indicator-pill">231 Total Activos</span>
          </div>

          <div className="chart-body-layout">
            <div className="donut-wrapper-square">
              <svg viewBox="0 0 100 100" className="donut-svg-element">
                {/* Fondo sutil del círculo */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                {/* Noticias (Celeste #0ea5e9) - 60% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0ea5e9" strokeWidth="10" strokeDasharray="143.2 95.5" strokeDashoffset="0" strokeLinecap="round" />
                {/* Documentos (Verde #10b981) - 35% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="83.5 155.2" strokeDashoffset="-148" strokeLinecap="round" />
                {/* Banners (Morado #7c3aed) - 5% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#7c3aed" strokeWidth="10" strokeDasharray="12 226.7" strokeDashoffset="-236" strokeLinecap="round" />
              </svg>
              
              <div className="donut-center-content">
                <span className="donut-center-number">231</span>
                <span className="donut-center-label">Activos</span>
              </div>
            </div>

            <div className="breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-info">
                  <span className="dot" style={{ backgroundColor: '#0ea5e9' }}></span>
                  <span className="name">Noticias</span>
                </div>
                <div className="breakdown-numbers">
                  <span className="count">142</span>
                  <span className="percentage">60%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '60%', backgroundColor: '#0ea5e9' }}></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-info">
                  <span className="dot" style={{ backgroundColor: '#10b981' }}></span>
                  <span className="name">Documentos</span>
                </div>
                <div className="breakdown-numbers">
                  <span className="count">85</span>
                  <span className="percentage">35%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '35%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-info">
                  <span className="dot" style={{ backgroundColor: '#7c3aed' }}></span>
                  <span className="name">Banners</span>
                </div>
                <div className="breakdown-numbers">
                  <span className="count">4</span>
                  <span className="percentage">5%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '5%', backgroundColor: '#7c3aed' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Acceso Rápido y Resumen Operativo */}
        <div className="quick-nav-card">
          <div className="card-header-clean">
            <div>
              <h3>Gestión y Accesos Directos</h3>
              <p className="card-subtitle">Navega a los módulos correspondientes</p>
            </div>
          </div>

          <div className="quick-nav-grid">
            <button className="nav-shortcut-btn" onClick={() => setActiveTab && setActiveTab('noticias')}>
              <div className="shortcut-icon" style={{ color: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.08)' }}>
                <FileText size={18} />
              </div>
              <div className="shortcut-meta">
                <span className="shortcut-title">Noticias</span>
                <span className="shortcut-sub">142 publicadas</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </button>

            <button className="nav-shortcut-btn" onClick={() => setActiveTab && setActiveTab('contenidos')}>
              <div className="shortcut-icon" style={{ color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.08)' }}>
                <Layout size={18} />
              </div>
              <div className="shortcut-meta">
                <span className="shortcut-title">Contenidos</span>
                <span className="shortcut-sub">Banners y secciones</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </button>

            <button className="nav-shortcut-btn" onClick={() => setActiveTab && setActiveTab('documentacion')}>
              <div className="shortcut-icon" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                <FileArchive size={18} />
              </div>
              <div className="shortcut-meta">
                <span className="shortcut-title">Documentación</span>
                <span className="shortcut-sub">85 archivos</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </button>

            <button className="nav-shortcut-btn" onClick={() => setActiveTab && setActiveTab('profesionales')}>
              <div className="shortcut-icon" style={{ color: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.08)' }}>
                <UserCheck size={18} />
              </div>
              <div className="shortcut-meta">
                <span className="shortcut-title">Profesionales</span>
                <span className="shortcut-sub">48 registrados</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </button>

            <button className="nav-shortcut-btn" onClick={() => setActiveTab && setActiveTab('capacitaciones')}>
              <div className="shortcut-icon" style={{ color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.08)' }}>
                <GraduationCap size={18} />
              </div>
              <div className="shortcut-meta">
                <span className="shortcut-title">Capacitaciones</span>
                <span className="shortcut-sub">12 disponibles</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </button>
          </div>
        </div>

      </section>

      {/* SECCIÓN INFERIOR: Solicitudes Pendientes con Filtro y Botones Rediseñados */}
      <section className="dashboard-bottom-section">
        <div className="section-header-modern">
          <div className="header-left">
            <div className="section-title-wrap">
              <h2>Contenidos y Solicitudes Pendientes</h2>
              <span className="badge-count">7 pendientes</span>
            </div>
            <p className="section-desc">Revisa y autoriza publicaciones cargadas por los editores</p>
          </div>
          

        </div>
        
        {/* Tabla / Lista de Solicitudes Pendientes estilizada */}
        <div className="admin-pending-card">
          <div className="pending-list">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="pending-list-row">
                <div className="pending-item-details">
                  <div className="pending-primary-row">
                    <span className="pending-module-badge" style={{ color: item.badgeColor, backgroundColor: `${item.badgeColor}15` }}>
                      {item.module}
                    </span>
                    <span className="pending-title">{item.title}</span>
                  </div>
                  <div className="pending-secondary-row">
                    <span className="meta-author">Autor: <strong>{item.author}</strong></span>
                    <span className="meta-separator">•</span>
                    <span className="meta-date"><Clock size={13} /> {item.date}</span>
                  </div>
                </div>

                <div className="pending-actions">
                  <button 
                    onClick={() => setActiveTab && setActiveTab(item.tabKey)}
                    className="btn-review-action"
                  >
                    <span>Revisar</span>
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminDashboardView;