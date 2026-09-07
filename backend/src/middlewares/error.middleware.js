// Interceptor central de errores
const errorHandler = (err, req, res, next) => {
  // 1. Log del error en consola (ideal para depuración en desarrollo)
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack) console.error(err.stack);

  // 2. Valores por defecto
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // 3. Manejo de errores específicos de Prisma (opcional pero muy recomendado)
  if (err.name === 'PrismaClientKnownRequestError') {
    // Ejemplo: Violación de restricción única (ej. email duplicado)
    if (err.code === 'P2002') {
      statusCode = 409; 
      message = 'Ya existe un registro con esos datos únicos.';
      errorCode = 'DUPLICATE_ENTRY';
    }
    // Ejemplo: Registro no encontrado
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'El registro solicitado no existe.';
      errorCode = 'NOT_FOUND';
    }
  } 
  
  // 4. Manejo de errores de validación (si usas Joi, Zod o express-validator)
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación en los datos enviados.';
    errorCode = 'VALIDATION_ERROR';
  }

  // 5. Respuesta estandarizada al frontend
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      // Solo enviamos detalles adicionales si estamos en entorno de desarrollo
      ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack })
    }
  });
};

export default errorHandler;