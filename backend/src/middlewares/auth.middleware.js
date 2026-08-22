import { auth } from 'express-oauth2-jwt-bearer';

// Configuramos el verificador de tokens apuntando a tu Keycloak local
export const checkJwt = auth({
  // URL de los metadatos de Keycloak (donde Express descarga las claves públicas para verificar la firma)
  issuerBaseURL: 'http://localhost:8080/realms/hie-realm',
  // El identificador del cliente que creamos en Keycloak
  audience: 'hie-cms-client',
});

// Middleware opcional para verificar roles específicos (Ej: solo admins)
export const requireRole = (roleRequired) => {
  return (req, res, next) => {
    try {
      // La librería auth() inyecta un objeto 'auth' o 'auth.payload' en el request
      const tokenPayload = req.auth?.payload;
      
      if (!tokenPayload) {
        return res.status(401).json({ error: 'No autorizado: Token no encontrado o inválido.' });
      }

      // Keycloak guarda los roles del realm dentro de realm_access.roles
      const roles = tokenPayload.realm_access?.roles || [];

      // Validamos si el usuario posee el rol requerido
      if (!roles.includes(roleRequired)) {
        return res.status(403).json({ 
          error: `Acceso denegado: Se requiere el rol '${roleRequired}' para realizar esta acción.` 
        });
      }

      next(); // Si tiene el rol, lo dejamos pasar a la ruta
    } catch (error) {
      console.error('Error al verificar roles:', error);
      res.status(500).json({ error: 'Error interno al procesar los permisos.' });
    }
  };
};