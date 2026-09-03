import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/pages/AdminPage.css'; 

import keycloak from '../config/keycloak';

// IMPORTAMOS TUS NUEVAS VISTAS MODULARES
import AdminDashboardView from './admin/AdminDashboardView';
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
  
  const isKeycloakInitialized = useRef(false);

  useEffect(() => {
    localStorage.setItem("admin_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isKeycloakInitialized.current || keycloak.authenticated) {
      if (keycloak.authenticated) {
        setInitialized(true);
        setAuthenticated(true);
        setIsAdmin(keycloak.hasRealmRole("admin-hief")); 
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
          setIsAdmin(keycloak.hasRealmRole("admin-hief")); 
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <span className="text-slate-500 font-medium animate-pulse">
          Conectando con el servidor de seguridad...
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <span className="text-slate-500 font-medium">Redirigiendo a inicio de sesión...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-slate-200 max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado al Panel TI</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Tu cuenta actual no tiene los permisos necesarios (Rol "admin"). Por favor, cierra sesión e ingresa con tus credenciales administrativas.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-[#0c2340] text-white py-2.5 rounded-lg font-medium hover:bg-[#0a1c33] transition-colors"
          >
            Cerrar Sesión Actual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout bg-slate-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="admin-main-wrapper">
        <AdminHeader 
          userName={userName} 
          onLogout={handleLogout} 
        />
        
        <main className="admin-content-area">
          {/* RENDERIZADO MODULAR DE TUS VISTAS */}
          {activeTab === "dashboard" && <AdminDashboardView />}
          {activeTab === "usuarios" && <AdminUsuariosView />}
          {activeTab === "roles" && <AdminRolesView />}
          {activeTab === "auditoria" && <AdminAuditoriaView />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;