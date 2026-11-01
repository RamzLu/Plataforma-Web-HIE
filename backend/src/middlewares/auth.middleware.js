import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from 'jose';

// ---------------------------------------------------------------------------
// Configuración de Keycloak (se lee de variables de entorno, sin valores por defecto)
// ---------------------------------------------------------------------------
let keycloakConfig = null;

const getKeycloakConfig = () => {
  if (keycloakConfig) return keycloakConfig;

  const baseUrl = process.env.KEYCLOAK_URL?.replace(/\/+$/, '');
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!baseUrl || !realm || !clientId) {
    // Falla cerrado: sin configuración NO se acepta ningún token.
    throw new Error('Faltan variables KEYCLOAK_URL / KEYCLOAK_REALM / KEYCLOAK_CLIENT_ID en el entorno.');
  }

  const issuer = `${baseUrl}/realms/${realm}`;

  keycloakConfig = {
    issuer,
    clientId,
    // jose descarga las claves públicas de Keycloak, las cachea y las rota solo.
    jwks: createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`)),
  };
  return keycloakConfig;
};

// 1. Valida el token general (firma, emisor, expiración, algoritmo y cliente)
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const { issuer, clientId, jwks } = getKeycloakConfig();

    const { payload } = await jwtVerify(token, jwks, {
      issuer,                    // el token debe haber sido emitido por NUESTRO realm
      algorithms: ['RS256'],     // evita "alg: none" y ataques de confusión de algoritmo
      clockTolerance: 5,         // segundos de tolerancia por desfase de relojes
    });

    // Debe ser un access token (no un ID token ni un refresh token)
    if (payload.typ && payload.typ !== 'Bearer') {
      return res.status(401).json({ error: 'Tipo de token no permitido.' });
    }

    // Debe haber sido emitido para este cliente (evita reutilizar tokens de otras apps del realm)
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (payload.azp !== clientId && !audiences.includes(clientId)) {
      return res.status(401).json({ error: 'El token no fue emitido para esta aplicación.' });
    }

    if (!payload.sub) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    req.user = {
      keycloakId: payload.sub,
      username: payload.preferred_username,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
    };

    return next();
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return res.status(401).json({ error: 'Token expirado.' });
    }

    // Token mal formado, firma inválida, emisor incorrecto, clave desconocida, etc.
    const esErrorDeToken =
      error instanceof joseErrors.JOSEError &&
      !(error instanceof joseErrors.JWKSTimeout) &&
      error.code !== 'ERR_JOSE_GENERIC';

    if (esErrorDeToken) {
      return res.status(401).json({ error: 'Token inválido o no autorizado.' });
    }

    // Keycloak inalcanzable o configuración faltante: no es culpa del cliente.
    console.error('[Auth] No se pudo verificar el token:', error.message);
    return res.status(503).json({ error: 'Servicio de autenticación no disponible.' });
  }
};

// 2. Alias para las rutas de Admin
export const checkJwt = verifyToken;

// 3. Validador de roles: deja pasar si el usuario tiene AL MENOS UNO de los roles indicados
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'No se encontraron roles para este usuario.' });
    }
    const hasRole = allowedRoles.some((role) => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    }
    next();
  };
};

// Rol de Keycloak (realm) que puede operar el CMS:
//  - cm: gestor de contenidos
// 'admin-hief' (supervision/aprobacion) NO accede al CMS: pertenece al panel de administracion.
// El super admin de Keycloak (gestiona usuarios/roles) no se contempla todavia.
export const ROLES_CMS = ['cm'];

// 4. Atajo: token válido + rol de CMS
export const requireCmsAccess = [verifyToken, requireRole(...ROLES_CMS)];
