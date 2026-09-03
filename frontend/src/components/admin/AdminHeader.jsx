import React from 'react';
import { LogOut, User } from 'lucide-react';

const AdminHeader = ({ userName, onLogout }) => {
  return (
    <header className="admin-header">
      
      {/* Izquierda: Indicador Técnico Prisma DB */}
      <div className="admin-header-left">
        <div className="admin-db-status">
          <div className="status-dot-container">
            <span className="status-dot-ping"></span>
            <span className="status-dot-core"></span>
          </div>
          <span className="status-text">Prisma DB: Online</span>
        </div>
      </div>

      {/* Derecha: Perfil de Usuario y Logout */}
      <div className="admin-header-right">
        
        <div className="admin-user-profile">
          <div className="admin-user-avatar">
            <User size={20} />
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{userName}</span>
            <span className="admin-user-role">Administrador de TI</span>
          </div>
        </div>
        
        <div className="admin-header-divider"></div>

        <button 
          onClick={onLogout}
          className="admin-btn-logout"
          title="Cerrar Sesión"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;