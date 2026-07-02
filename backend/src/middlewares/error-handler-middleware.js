// Error controlado de aplicación: se traduce directamente en una respuesta HTTP
class AppError extends Error {
  constructor(statusCode, mensaje) {
    super(mensaje);
    this.statusCode = statusCode;
  }
}

// Middleware global: captura cualquier error no manejado y evita tumbar el proceso
function errorHandlerMiddleware(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[error]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Nunca exponer detalles internos del error al cliente
  return res.status(500).json({
    success: false,
    error: 'Ocurrió un error interno en el servidor',
  });
}

export { AppError, errorHandlerMiddleware };
