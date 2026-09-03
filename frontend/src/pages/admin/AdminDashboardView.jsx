import React from 'react';
import { Users, ShieldCheck, Activity, Database, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import '../../styles/components/admin/AdminDashboardView.css'; 

const AdminDashboardView = () => {
  return (
    <div className="admin-dashboard-container">
      
      {/* TÍTULO DE LA SECCIÓN */}
      <div className="admin-page-title">
        <span className="admin-overtitle">PANEL DE INFRAESTRUCTURA</span>
        <h1>Métricas del Sistema</h1>
        <p>Monitoreo en tiempo real de usuarios, accesos y estado de la plataforma.</p>
      </div>

      <div className="dashboard-top-grid">
        
        {/* COLUMNA IZQUIERDA: 4 KPIs */}
        <div className="kpi-grid">
          
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#0ea5e9', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.1)' }}>
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">124</div>
            <div className="kpi-label">Usuarios Registrados</div>
            <div className="kpi-trend positive">
              <ArrowUpRight size={16} strokeWidth={3} /> 12 nuevos este mes
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#7c3aed', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.1)' }}>
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">5</div>
            <div className="kpi-label">Roles Activos</div>
            <div className="kpi-trend neutral">
              <CheckCircle2 size={16} strokeWidth={3} /> Configuración estable
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)' }}>
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">99.9%</div>
            <div className="kpi-label">Uptime del Servidor</div>
            <div className="kpi-trend positive">
              <ArrowUpRight size={16} strokeWidth={3} /> Rendimiento óptimo
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#f59e0b', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.1)' }}>
              <Database size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">42MB</div>
            <div className="kpi-label">Carga de Base de Datos</div>
            <div className="kpi-trend positive">
              <CheckCircle2 size={16} strokeWidth={3} /> Sincronizado
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Gráfico de Anillo */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Distribución de Roles</h3>
          </div>

          <div className="donut-container">
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              {/* Médicos (Celeste) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0ea5e9" strokeWidth="12" strokeDasharray="150 101" strokeDashoffset="0" strokeLinecap="round" />
              {/* Redactores CMS (Morado) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#7c3aed" strokeWidth="12" strokeDasharray="50 201" strokeDashoffset="-160" strokeLinecap="round" />
              {/* Admins TI (Verde) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="15 236" strokeDashoffset="-220" strokeLinecap="round" />
            </svg>
            
            <div className="donut-center-text">
              <span className="value">124</span>
              <span className="label">Usuarios Totales</span>
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#0ea5e9"}}></div> Médicos (60%)</div>
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#7c3aed"}}></div> Redactores CMS (20%)</div>
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#10b981"}}></div> Administradores TI (5%)</div>
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#cbd5e1"}}></div> Otros (15%)</div>
          </div>
        </div>

      </div>

      <div className="dashboard-bottom-section">
        <div className="section-header-row">
          <h2>Actividad Reciente del Sistema</h2>
          <button className="btn-gestionar-todas">Ver Auditoría Completa</button>
        </div>
        
        <div className="admin-table-wrapper" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)"}}>
           <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", color: "#475569", fontWeight: "500", display: "flex", justifyContent: "space-between" }}>
             <span><strong>Luana Ramirez</strong> actualizó permisos del rol <em>CMS</em></span>
             <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Hace 2 horas</span>
           </div>
           <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", color: "#475569", fontWeight: "500", display: "flex", justifyContent: "space-between" }}>
             <span><strong>Sistema</strong> generó respaldo automático de Prisma DB</span>
             <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Hace 5 horas</span>
           </div>
           <div style={{ padding: "12px 0", color: "#475569", fontWeight: "500", display: "flex", justifyContent: "space-between" }}>
             <span><strong>Viviana González</strong> ingresó al panel de TI</span>
             <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Hoy, 08:30</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;