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
  Clock
} from 'lucide-react';
// IMPORTAMOS RECHARTS
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import '../../styles/pages/admin/AdminDashboardView.css'; 

// ==============================
// DATOS DINÁMICOS PARA EL GRÁFICO
// ==============================
const noticiasData = [
  { name: 'Institucional', value: 85, color: '#0ea5e9' },
  { name: 'Prevención', value: 35, color: '#10b981' },
  { name: 'Guía y orientación', value: 22, color: '#7c3aed' },
];

const documentosData = [
  { name: 'Información Institucional', value: 40, color: '#6d28d9' },
  { name: 'Guía y orientación', value: 25, color: '#f59e0b' },
  { name: 'Prevención Institucional', value: 20, color: '#14b8a6' },
];

const specialtiesData = [
  { name: 'Clínica Médica', value: 12, color: '#6d28d9' },
  { name: 'Pediatría', value: 8, color: '#0ea5e9' },
  { name: 'Ginecología', value: 6, color: '#10b981' },
  { name: 'Traumatología', value: 7, color: '#f59e0b' },
  { name: 'Oftalmología', value: 4, color: '#f43f5e' },
  { name: 'Cirugía General', value: 5, color: '#8b5cf6' },
];

const AdminDashboardView = ({ setActiveTab }) => {
  const [filterModule, setFilterModule] = useState('all');
  
  // ESTADO PARA EL GRÁFICO (Por defecto en Noticias)
  const [chartType, setChartType] = useState('noticias');

  // LÓGICA DE SELECCIÓN DE DATOS
  let currentChartData = [];
  let chartTitle = "";
  let chartCenterLabel = "";

  if (chartType === "profesionales") {
    currentChartData = specialtiesData;
    chartTitle = "Total Profesionales";
    chartCenterLabel = "Total Prof.";
  } else if (chartType === "documentacion") {
    currentChartData = documentosData;
    chartTitle = "Total Documentos";
    chartCenterLabel = "Total Docs.";
  } else {
    currentChartData = noticiasData;
    chartTitle = "Total Noticias";
    chartCenterLabel = "Total Noti.";
  }

  const chartTotal = currentChartData.reduce((acc, curr) => acc + curr.value, 0);

  const pendingItems = [
    { id: 1, title: 'Campaña Prevención Dengue 2026', module: 'Noticias', tabKey: 'noticias', author: 'Editor CMS', date: 'Hace 2 horas', badgeColor: '#0ea5e9' },
    { id: 2, title: 'Formulario Alta Paciente V3.pdf', module: 'Documentación', tabKey: 'documentacion', author: 'Administrador', date: 'Hace 4 horas', badgeColor: '#10b981' },
    { id: 3, title: 'Nuevo Profesional: Dr. Gómez (Cardiología)', module: 'Profesionales', tabKey: 'profesionales', author: 'Editor CMS', date: 'Ayer', badgeColor: '#0284c7' },
    { id: 4, title: 'Curso Actualización RCP y Primeros Auxilios', module: 'Capacitaciones', tabKey: 'capacitaciones', author: 'Coord. Docencia', date: 'Ayer', badgeColor: '#059669' }
  ];

  const filteredItems = filterModule === 'all' 
    ? pendingItems 
    : pendingItems.filter(item => item.tabKey === filterModule);

  return (
    <div className="admin-dashboard-container">
      
      {/* TÍTULO DE LA SECCIÓN + ALERTA SUPERIOR DE REVISIONES */}
      <div className="admin-page-title">
        <div className="admin-title-content">
          <div className="admin-title-badge">PANEL DE CONTROL</div>
          <h1>Resumen del Portal</h1>
          <p>Vista general del estado de los contenidos, recursos activos y solicitudes pendientes de aprobación.</p>
        </div>

        {/* Notificación (Aviso) a la Derecha */}
        <div className="admin-header-alert-box">
          <div className="alert-box-icon">
            <AlertCircle size={24} strokeWidth={2.2} />
          </div>
          <div className="alert-box-data">
            <div className="alert-box-top">
              <span className="alert-box-num">7</span>
              <span className="alert-box-label">Pendientes de Revisión</span>
            </div>
            <div className="alert-box-bottom">
              <span className="alert-warning-pill">Acción requerida</span>
              <span>solicitudes en cola</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE SUPERIOR: KPIS EN GRID BALANCEADO (Ahora son 5) */}
      <section className="dashboard-kpis-section">
        <div className="kpi-grid-redesigned">
          
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

        </div>
      </section>

      {/* FILA INTERMEDIA: GRÁFICO RECHARTS + RESUMEN OPERATIVO */}
      <section className="dashboard-analytics-row">
        
        {/* GRÁFICO DINÁMICO (RECHARTS) */}
        <div className="stat-card-chart">
          <div className="chart-header">
            <h3 className="chart-title">{chartTitle}</h3>
            {/* Selector de categoría */}
            <select 
              className="chart-btn"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="noticias">Noticias</option>
              <option value="documentacion">Documentos</option>
              <option value="profesionales">Profesionales</option>
            </select>
          </div>
          
          <div className="chart-body">
            {currentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Tooltip 
                    wrapperStyle={{ zIndex: 100 }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4b5563'
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />

                  <Pie
                    data={currentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={5}
                  >
                    {currentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9f8fc3', fontSize: '0.9rem' }}>
                  Sin datos para graficar
               </div>
            )}
            
            {/* Texto en el centro de la dona */}
            {currentChartData.length > 0 && (
              <div className="chart-center-text">
                <span className="chart-total-num">{chartTotal}</span>
                <span className="chart-total-label">{chartCenterLabel}</span>
              </div>
            )}
          </div>

          {/* Leyenda inferior dinámica */}
          <div className="chart-legend">
            {currentChartData.map((entry, index) => (
              <div className="legend-item" key={index}>
                <span className="legend-dot" style={{ backgroundColor: entry.color }}></span>
                <span className="legend-text" title={entry.name}>{entry.name} ({entry.value})</span>
              </div>
            ))}
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

      {/* SECCIÓN INFERIOR: Solicitudes Pendientes */}
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