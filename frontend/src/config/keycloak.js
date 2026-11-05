import Keycloak from 'keycloak-js';

// Configuración de tu servidor de identidad (Keycloak)
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'hie-realm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'hie-cms-client'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

// El backend ahora valida la expiracion del token: lo renovamos antes de que venza.
keycloak.onTokenExpired = () => {
  keycloak.updateToken(30).catch(() => keycloak.login());
};
