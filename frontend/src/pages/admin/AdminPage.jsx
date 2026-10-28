import React, { useState, useEffect, useRef } from 'react';

import '../../styles/pages/AdminPage.css'; 
import "../../styles/components/admin/AdminLayout.css"; 

import keycloak from '../../config/keycloak';
import { getNoticias } from '../../api/noticias.api';

import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import AccessDeniedScreen from '../../components/ui/AccessDeniedScreen';
// IMPORTAMOS TUS NUEVAS VISTAS MODULARES
import AdminDashboardView from '../admin/AdminDashboardView';
import AdminNoticiasView from '../admin/AdminNoticiasView';
import AdminEspecialidadesServiciosView from '../admin/AdminEspecialidadesServiciosView';
// import AdminUsuariosView from './admin/AdminUsuariosView';
// import AdminRolesView from './admin/AdminRolesView';
// import AdminAuditoriaView from './admin/AdminAuditoriaView';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("admin_active_tab") || "dashboard";
  });

  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Cargando...");
  const [pendingNoticiasCount, setPendingNoticiasCount] = useState(0);
  
  const isKeycloakInitialized = useRef(false);

  useEffect(() => {
    localStorage.setItem("admin_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!authenticated || !isAdmin) return;
    getNoticias(true)
      .then((data) => {
        if (Array.isArray(data)) {
          const pending = data.filter(
            (n) => (n.estado || "").toUpperCase() === "PENDIENTE_APROBACION"
          ).length;
          setPendingNoticiasCount(pending);
        }
      })
      .catch(() => {});
  }, [authenticated, isAdmin]);

  useEffect(() => {
    const checkAdminRole = () =>
      keycloak.hasRealmRole("admin-hief") ||
      keycloak.hasRealmRole("admin-hie") ||
      keycloak.hasRealmRole("admin");

    if (isKeycloakInitialized.current || keycloak.authenticated) {
      if (keycloak.authenticated) {
        setInitialized(true);
        setAuthenticated(true);
        setIsAdmin(checkAdminRole()); 
        const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || "Administrador de TI";
        setUserName(name);
      }
      return;
    }

    isKeycloakInitialized.current = true;

    keycloak.init({ onLoad: "login-required", checkLoginIframe: false })
      .then((auth) => {
        setInitialized(true);
        setAuthenticated(auth);
        
        if (auth) {
          setIsAdmin(checkAdminRole()); 
          const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || "Administrador de TI";
          setUserName(name);
        }
      })
      .catch((err) => {
        console.error("Error al inicializar Keycloak en panel Admin:", err);
        setInitialized(true); 
      });
  }, []);

  const handleLogout = () => {
    if (keycloak && typeof keycloak.logout === 'function') {
      localStorage.removeItem("admin_active_tab");
      keycloak.logout({ redirectUri: window.location.origin });
    } else {
      localStorage.removeItem("admin_active_tab");
      window.location.href = "/";
    }
  };

  if (!initialized) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#f8fafc',
        fontFamily: "'Manrope', system-ui, sans-serif"
      }}>
        <div className="cms-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          borderWidth: '4px', 
          borderTopColor: '#0c2340',
          borderColor: 'rgba(12, 35, 64, 0.1)'
        }}></div>
        <h2 style={{ 
          marginTop: '25px', 
          color: '#0c2340', 
          fontWeight: '700', 
          fontSize: '1.2rem',
          letterSpacing: '0.5px'
        }}>
          Iniciando Plataforma
        </h2>
        <p style={{ 
          color: '#64748b', 
          fontSize: '0.9rem', 
          marginTop: '8px' 
        }}>
          Conectando con el servidor de seguridad...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#f8fafc',
        fontFamily: "'Manrope', system-ui, sans-serif"
      }}>
        <div className="cms-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          borderWidth: '4px', 
          borderTopColor: '#0284c7',
          borderColor: 'rgba(2, 132, 199, 0.1)'
        }}></div>
        <h2 style={{ 
          marginTop: '25px', 
          color: '#0c2340', 
          fontWeight: '700', 
          fontSize: '1.2rem',
          letterSpacing: '0.5px'
        }}>
          Redirigiendo a Seguridad
        </h2>
        <p style={{ 
          color: '#64748b', 
          fontSize: '0.9rem', 
          marginTop: '8px' 
        }}>
          Redirigiendo a inicio de sesión...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDeniedScreen
        userName={userName}
        requiredPanel="el Panel de Administración (TI)"
      />
    );
  }

  return (
    <div className="admin-layout bg-slate-50">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingNoticiasCount={pendingNoticiasCount}
      />
      
      <div className="admin-main-wrapper">
        <AdminHeader 
          userName={userName} 
          onLogout={handleLogout} 
        />
        
        <main className="admin-content-area">
          {/* RENDERIZADO MODULAR DE TUS VISTAS */}
          {activeTab === "dashboard" && <AdminDashboardView />}
          {activeTab === "noticias" && (
            <AdminNoticiasView onPendingCountChange={setPendingNoticiasCount} />
          )}
          {activeTab === "servicios" && <AdminEspecialidadesServiciosView />}
          {activeTab === "usuarios" && <AdminUsuariosView />}
          {activeTab === "roles" && <AdminRolesView />}
          {activeTab === "auditoria" && <AdminAuditoriaView />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
