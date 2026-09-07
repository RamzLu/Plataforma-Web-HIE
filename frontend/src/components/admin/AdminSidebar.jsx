import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, FileClock } from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard General", icon: LayoutDashboard },
    { id: "usuarios", label: "Gestión de Usuarios", icon: Users },
    { id: "roles", label: "Roles y Permisos", icon: ShieldCheck },
    { id: "auditoria", label: "Auditoría de Cambios", icon: FileClock },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Área del Logo / Distintivo */}
      <div className="admin-sidebar-logo-area">
        <div className="admin-logo-circle">
           <span>HIE</span>
        </div>
        <div className="admin-logo-text">
          <span className="admin-logo-text-top">HOSPITAL EVITA</span>
          <span className="admin-logo-text-bottom">ADMINISTRACIÓN</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="admin-sidebar-nav">
        <h3 className="admin-nav-title">Panel de TI</h3>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`admin-nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;