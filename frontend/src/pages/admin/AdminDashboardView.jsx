import React from 'react';
import { FileText, FileArchive, Layout, AlertCircle, ArrowUpRight, CheckCircle2, ExternalLink } from 'lucide-react';
// Asegurate de que la ruta al CSS sea la correcta según tu proyecto
import '../../styles/components/admin/AdminDashboardView.css'; 

const AdminDashboardView = ({ setActiveTab }) => {
  return (
    <div className="admin-dashboard-container">
      
      {/* TÍTULO DE LA SECCIÓN */}
      <div className="admin-page-title">
        <span className="admin-overtitle">PANEL DE CONTROL</span>
        <h1>Resumen del Portal</h1>
        <p>Vista general del estado de los contenidos y solicitudes pendientes de aprobación.</p>
      </div>

      <div className="dashboard-top-grid">
        
        {/* COLUMNA IZQUIERDA: 4 KPIs (Resumen de Contenidos - RF-006 y RF-007) */}
        <div className="kpi-grid">
          
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#0ea5e9', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.1)' }}>
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">142</div>
            <div className="kpi-label">Noticias Publicadas</div>
            <div className="kpi-trend positive">
              <ArrowUpRight size={16} strokeWidth={3} /> 12 nuevas este mes
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)' }}>
              <FileArchive size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">85</div>
            <div className="kpi-label">Documentos en Repositorio</div>
            <div className="kpi-trend positive">
              <CheckCircle2 size={16} strokeWidth={3} /> Repositorio actualizado
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#7c3aed', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.1)' }}>
              <Layout size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">4</div>
            <div className="kpi-label">Banners Activos</div>
            <div className="kpi-trend neutral">
              <CheckCircle2 size={16} strokeWidth={3} /> Carrusel óptimo
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ color: '#f59e0b', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.1)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="kpi-value">7</div>
            <div className="kpi-label">Pendientes de Aprobación</div>
            <div className="kpi-trend neutral" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              Requieren revisión
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Gráfico de Anillo (Distribución de Contenidos - RF-009) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Distribución de Contenidos</h3>
          </div>

          <div className="donut-container">
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              {/* Noticias (Celeste) - 60% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0ea5e9" strokeWidth="12" strokeDasharray="150 101" strokeDashoffset="0" strokeLinecap="round" />
              {/* Documentos (Verde) - 35% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="87 164" strokeDashoffset="-160" strokeLinecap="round" />
              {/* Banners (Morado) - 5% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#7c3aed" strokeWidth="12" strokeDasharray="15 236" strokeDashoffset="-250" strokeLinecap="round" />
            </svg>
            
            <div className="donut-center-text">
              <span className="value">231</span>
              <span className="label">Total Activos</span>
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#0ea5e9"}}></div> Noticias (60%)</div>
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#10b981"}}></div> Documentos (35%)</div>
            <div className="legend-item"><div className="legend-dot" style={{backgroundColor: "#7c3aed"}}></div> Banners (5%)</div>
          </div>
        </div>

      </div>

      {/* SECCIÓN INFERIOR: Solicitudes Pendientes (RF-007 y RF-008) */}
      <div className="dashboard-bottom-section">
        <div className="section-header-row">
          <h2>Contenidos y Solicitudes Pendientes</h2>
          <button 
            className="btn-gestionar-todas"
            onClick={() => setActiveTab && setActiveTab('noticias')}
          >
            Ir a Gestión de Noticias
          </button>
        </div>
        
        <div className="admin-table-wrapper" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)"}}>
           {/* Fila 1 */}
           <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <span style={{ color: "#0f172a", fontWeight: "600", display: "block" }}>Campaña Prevención Dengue 2026</span>
               <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Módulo: Noticias | Autor: Editor CMS</span>
             </div>
             <button 
               onClick={() => setActiveTab && setActiveTab('noticias')}
               style={{ background: "none", border: "none", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600" }}
             >
               Revisar <ExternalLink size={16} />
             </button>
           </div>
           
           {/* Fila 2 */}
           <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <span style={{ color: "#0f172a", fontWeight: "600", display: "block" }}>Formulario Alta Paciente V3.pdf</span>
               <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Módulo: Documentación | Autor: Administrador</span>
             </div>
             <button 
               onClick={() => setActiveTab && setActiveTab('documentacion')}
               style={{ background: "none", border: "none", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600" }}
             >
               Revisar <ExternalLink size={16} />
             </button>
           </div>

           {/* Fila 3 */}
           <div style={{ padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div>
               <span style={{ color: "#0f172a", fontWeight: "600", display: "block" }}>Nuevo Profesional: Dr. Gómez (Cardiología)</span>
               <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Módulo: Profesionales | Autor: Editor CMS</span>
             </div>
             <button 
               onClick={() => setActiveTab && setActiveTab('profesionales')}
               style={{ background: "none", border: "none", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "600" }}
             >
               Revisar <ExternalLink size={16} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;