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

    const realmRoles = Array.isArray(payload.realm_access?.roles)
      ? payload.realm_access.roles
      : [];
    const clientRoles = Object.values(payload.resource_access || {}).flatMap(
      (resObj) => (Array.isArray(resObj?.roles) ? resObj.roles : [])
    );
    const combinedRoles = [...new Set([...realmRoles, ...clientRoles])];

    req.user = {
      keycloakId: payload.sub,
      username: payload.preferred_username,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: combinedRoles,
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
  const allowedLower = allowedRoles.map((r) => String(r).toLowerCase().trim());
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
      return res.status(403).json({ error: 'No se encontraron roles para este usuario.' });
    }
    const userRolesLower = req.user.roles.map((r) => String(r).toLowerCase().trim());
    const hasRole = allowedLower.some((role) => userRolesLower.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    }
    next();
  };
};

// Roles de Keycloak (realm y client):
//  - cm: gestor de contenidos (crea y edita borradores/contenido en el CMS)
//  - admin-hief / admin-hie / admin: administradores (panel de supervisión y aprobación de noticias)
export const ROLES_CMS = ['cm', 'editor-cms', 'cms'];
export const ROLES_ADMIN = ['admin-hief', 'admin-hie', 'admin', 'administrator', 'administrador'];
export const ROLES_VISTA_ADMIN = [...ROLES_CMS, ...ROLES_ADMIN];

export const requireCmsAccess = [verifyToken, requireRole(...ROLES_CMS)];
export const requireAdminAccess = [verifyToken, requireRole(...ROLES_ADMIN)];

export const adminViewAccess = (req, res, next) => {
  req.adminView = false;
  if (req.query.admin !== 'true') return next();

  verifyToken(req, res, (err) => {
    if (err) return next(err);
    requireRole(...ROLES_VISTA_ADMIN)(req, res, (roleErr) => {
      if (roleErr) return next(roleErr);
      req.adminView = true;
      next();
    });
  });
};
