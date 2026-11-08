import React, { useState, useEffect, useRef } from 'react';

import '../../styles/pages/AdminPage.css'; 
import "../../styles/components/admin/AdminLayout.css"; 

import keycloak from '../../config/keycloak';
import { getNoticias } from '../../api/noticias.api';
import { getEspecialidades } from '../../api/especialidades.api';
import { getDocumentos } from '../../api/documentos.api';

import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import AccessDeniedScreen from '../../components/ui/AccessDeniedScreen';
// IMPORTAMOS TUS NUEVAS VISTAS MODULARES
import AdminDashboardView from '../admin/AdminDashboardView';
import AdminNoticiasView from '../admin/AdminNoticiasView';
import AdminEspecialidadesServiciosView from '../admin/AdminEspecialidadesServiciosView';
import AdminProfesionalesView from '../admin/AdminProfesionalesView';
import AdminDocumentacionView from '../admin/AdminDocumentacionView';
import AdminCapacitacionesView from '../admin/AdminCapacitacionesView';
import AdminResidenciasView from '../admin/AdminResidenciasView';
import AdminContenidoGraficoView from '../admin/AdminContenidoGraficoView';
import AdminInstitucionalView from '../admin/AdminInstitucionalView';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("admin_active_tab");
    const obsoleteTabs = ["usuarios", "roles", "auditoria"];
    return obsoleteTabs.includes(saved) ? "dashboard" : (saved || "dashboard");
  });

  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("Cargando...");
  const [pendingNoticiasCount, setPendingNoticiasCount] = useState(0);
  const [pendingEspecialidadesCount, setPendingEspecialidadesCount] = useState(0);
  const [pendingDocumentosCount, setPendingDocumentosCount] = useState(0);
  
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

    getEspecialidades(true)
      .then((data) => {
        if (Array.isArray(data)) {
          const pending = data.filter(
            (e) => (e.estado || "").toUpperCase() === "PENDIENTE_APROBACION"
          ).length;
          setPendingEspecialidadesCount(pending);
        }
      })
      .catch(() => {});

    getDocumentos(true)
      .then((data) => {
        if (Array.isArray(data)) {
          const pending = data.filter(
            (d) => (d.estado || "").toUpperCase() === "PENDIENTE_APROBACION"
          ).length;
          setPendingDocumentosCount(pending);
        }
      })
      .catch(() => {});
  }, [authenticated, isAdmin]);

  useEffect(() => {
    const checkAdminRole = () => {
      const realmRoles = (keycloak?.tokenParsed?.realm_access?.roles || []).map((r) =>
        r.toLowerCase()
      );
      const clientRoles = Object.values(keycloak?.tokenParsed?.resource_access || {})
        .flatMap((r) => r?.roles || [])
        .map((r) => r.toLowerCase());
      const allRoles = [...new Set([...realmRoles, ...clientRoles])];
      const targetAdminRoles = ["admin-hief", "admin-hie", "admin", "administrator", "administrador"];
      return targetAdminRoles.some(
        (role) =>
          keycloak?.hasRealmRole?.(role) ||
          keycloak?.hasResourceRole?.(role) ||
          allRoles.includes(role.toLowerCase())
      );
    };

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
    <div className="admin-layout">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingNoticiasCount={pendingNoticiasCount}
        pendingEspecialidadesCount={pendingEspecialidadesCount}
        pendingDocumentosCount={pendingDocumentosCount}
      />
      
      <div className="admin-main-wrapper">
        <AdminHeader 
          userName={userName} 
          onLogout={handleLogout} 
          activeTab={activeTab}
        />
        
        <main className="admin-content-area">
          {/* RENDERIZADO MODULAR DE TUS VISTAS */}
          {activeTab === "dashboard" && <AdminDashboardView />}
          {activeTab === "noticias" && (
            <AdminNoticiasView onPendingCountChange={setPendingNoticiasCount} />
          )}
          {activeTab === "servicios" && (
            <AdminEspecialidadesServiciosView
              onPendingCountChange={setPendingEspecialidadesCount}
            />
          )}
          {activeTab === "profesionales" && <AdminProfesionalesView />}
          {activeTab === "documentacion" && (
            <AdminDocumentacionView
              onPendingCountChange={setPendingDocumentosCount}
            />
          )}
          {activeTab === "capacitaciones" && <AdminCapacitacionesView />}
          {activeTab === "residencias" && <AdminResidenciasView />}
          {activeTab === "graficos" && <AdminContenidoGraficoView />}
          {activeTab === "institucional" && <AdminInstitucionalView />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
