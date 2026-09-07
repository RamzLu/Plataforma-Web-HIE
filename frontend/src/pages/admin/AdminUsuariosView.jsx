import React from 'react';
import { Users } from 'lucide-react';
import '../../../styles/pages/AdminViews.css';

const AdminUsuariosView = () => {
  return (
    <div className="admin-view-container">
      {/* HEADER DE LA VISTA */}
      <div className="admin-page-title">
        <span className="admin-overtitle">GESTIÓN DE ACCESOS</span>
        <h1>Directorio de Usuarios</h1>
        <p>Administre las cuentas, credenciales y estados de los usuarios del sistema.</p>
      </div>

      {/* ÁREA DE TRABAJO */}
      <div className="admin-view-content">
         <div className="admin-card-base">
             <Users size={48} color="#cbd5e1" strokeWidth={1.5} />
             <p>El módulo de gestión de usuarios se construirá aquí.</p>
         </div>
      </div>
    </div>
  );
};

export default AdminUsuariosView;