const CODIGOS_POR_STATUS = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
};

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err?.name || 'Error'}: ${err?.message || 'Sin detalle'}`);
  if (err?.stack) console.error(err.stack);

  let statusCode = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : Number.isInteger(err?.status)
    ? err.status
    : 500;
  let message = 'Error interno del servidor. Por favor, intente nuevamente más tarde.';
  let errorCode = 'INTERNAL_ERROR';

  if (err instanceof SyntaxError && statusCode === 400 && 'body' in err) {
    statusCode = 400;
    message = 'El cuerpo de la solicitud no contiene un formato JSON válido.';
    errorCode = 'INVALID_JSON';
  } else if (err?.type === 'entity.too.large' || statusCode === 413) {
    statusCode = 413;
    message = 'El tamaño de los datos enviados supera el límite permitido.';
    errorCode = 'PAYLOAD_TOO_LARGE';
  } else if (err?.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Ya existe un registro con esos datos únicos.';
      errorCode = 'DUPLICATE_ENTRY';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'El registro solicitado no existe.';
      errorCode = 'NOT_FOUND';
    } else if (err.code === 'P2003') {
      statusCode = 409;
      message = 'No se puede completar la operación porque existen registros relacionados.';
      errorCode = 'FOREIGN_KEY_CONFLICT';
    } else {
      statusCode = 500;
    }
  } else if (typeof err?.name === 'string' && err.name.startsWith('PrismaClient')) {
    statusCode = 500;
  } else if (err?.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación en los datos enviados.';
    errorCode = 'VALIDATION_ERROR';
  } else if (statusCode >= 400 && statusCode < 500) {
    message = typeof err?.message === 'string' && err.message.trim()
      ? err.message
      : 'Solicitud inválida.';
    errorCode = CODIGOS_POR_STATUS[statusCode] || 'CLIENT_ERROR';
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};

export default errorHandler;
