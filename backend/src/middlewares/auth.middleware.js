import jwt from 'jsonwebtoken';

// 1. Valida el token general
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.decode(token);
    
    if (!decodedToken) {
      return res.status(401).json({ error: 'Token inválido o corrupto.' });
    }

    req.user = {
      keycloakId: decodedToken.sub,
      username: decodedToken.preferred_username,
      name: decodedToken.name || decodedToken.preferred_username,
      roles: decodedToken.realm_access?.roles || []
    };

    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(401).json({ error: 'Token no autorizado o expirado.' });
  }
};

// 2. Alias para las rutas de Admin
export const checkJwt = verifyToken;

// 3. Validador de roles
export const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'No se encontraron roles para este usuario.' });
    }
    const hasRole = req.user.roles.includes(roleName);
    if (!hasRole) {
      return res.status(403).json({ error: `Se requiere el rol '${roleName}'.` });
    }
    next();
  };
};