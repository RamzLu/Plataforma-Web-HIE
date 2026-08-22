import Keycloak from 'keycloak-js';

// Configuración de tu servidor de identidad (Keycloak)
const keycloakConfig = {
  url: 'http://localhost:8080', // URL donde correrá Keycloak
  realm: 'hie-realm',           // El "Reino" o espacio de trabajo de tu hospital
  clientId: 'hie-cms-client'    // El nombre de esta aplicación frontend para Keycloak
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;