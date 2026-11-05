import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from 'jose';

let keycloakConfig = null;

const getKeycloakConfig = () => {
  if (keycloakConfig) return keycloakConfig;

  const baseUrl = process.env.KEYCLOAK_URL?.replace(/\/+$/, '');
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!baseUrl || !realm || !clientId) {
    throw new Error('Faltan variables KEYCLOAK_URL / KEYCLOAK_REALM / KEYCLOAK_CLIENT_ID en el entorno.');
  }

  const issuer = `${baseUrl}/realms/${realm}`;

  keycloakConfig = {
    issuer,
    clientId,
    jwks: createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`)),
  };
  return keycloakConfig;
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const { issuer, clientId, jwks } = getKeycloakConfig();

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      algorithms: ['RS256'],
      clockTolerance: 5,
    });

    if (payload.typ && payload.typ !== 'Bearer') {
      return res.status(401).json({ error: 'Tipo de token no permitido.' });
    }

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

    const esErrorDeToken =
      error instanceof joseErrors.JOSEError &&
      !(error instanceof joseErrors.JWKSTimeout) &&
      error.code !== 'ERR_JOSE_GENERIC';

    if (esErrorDeToken) {
      return res.status(401).json({ error: 'Token inválido o no autorizado.' });
    }

    console.error('[Auth] No se pudo verificar el token:', error.message);
    return res.status(503).json({ error: 'Servicio de autenticación no disponible.' });
  }
};

export const checkJwt = verifyToken;

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

// Roles de Keycloak (realm):
//  - cm: gestor de contenidos (crea y edita borradores/contenido en el CMS)
//  - admin-hief / admin-hie / admin: administradores (panel de supervisión y aprobación de noticias)
export const ROLES_CMS = ['cm'];
export const ROLES_ADMIN = ['admin-hief', 'admin-hie', 'admin'];
export const ROLES_VISTA_ADMIN = [...ROLES_CMS, ...ROLES_ADMIN];

export const requireCmsAccess = [verifyToken, requireRole(...ROLES_CMS)];
export const requireAdminAccess = [verifyToken, requireRole(...ROLES_ADMIN)];

export const adminViewAccess = (req, res, next) => {
  req.adminView = false;
  if (req.query.admin !== 'true') return next();

  verifyToken(req, res, () => {
    requireRole(...ROLES_VISTA_ADMIN)(req, res, () => {
      req.adminView = true;
      next();
    });
  });
};
