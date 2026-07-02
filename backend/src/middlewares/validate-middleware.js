// Middleware genérico de validación: recibe un esquema Zod y valida req.body
function validateMiddleware(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const detalle = resultado.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');

      return res.status(400).json({
        success: false,
        error: `Datos inválidos: ${detalle}`,
      });
    }

    req.body = resultado.data;
    next();
  };
}

export { validateMiddleware };
