// Middleware de autorización: recibe la lista de roles permitidos para la ruta
function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, error: 'No tiene permisos para realizar esta acción' });
    }
    next();
  };
}

export { roleMiddleware };
