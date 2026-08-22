import React, { useEffect, useState } from 'react';
import keycloak from '../config/keycloak';
// import '../styles/pages/CmsPage.css'; // Opcional, por si quieres darle estilos luego

const CmsPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Inicializamos Keycloak forzando el login si no hay sesión
    keycloak.init({ onLoad: 'login-required' })
      .then(auth => {
        setAuthenticated(auth);
        setInitialized(true);
      })
      .catch(error => {
        console.error('Error al inicializar Keycloak:', error);
        setInitialized(true);
      });
  }, []);

  // Pantalla de carga mientras Keycloak decide si el usuario tiene permiso o debe ir al Login
  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Verificando credenciales de seguridad...</h2>
      </div>
    );
  }

  // Si pasó la barrera, renderizamos el panel
  if (authenticated) {
    return (
      <div style={{ padding: '10rem', textAlign: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <h1>Este es el panel de admin y cmd</h1>
        
        <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
          Bienvenido al sistema, <strong>{keycloak.tokenParsed?.preferred_username || 'Usuario'}</strong>
        </p>

        <button 
          onClick={() => keycloak.logout()}
          style={{ 
            marginTop: '2rem', 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Cerrar Sesión Segura
        </button>
      </div>
    );
  }

  // Por seguridad, si llega aquí sin autenticarse, no renderizamos nada (Keycloak ya lo estará redirigiendo)
  return null;
};

export default CmsPage;