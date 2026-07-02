import * as authService from '../services/auth-service.js';

async function login(req, res, next) {
  try {
    const { usuario, pin } = req.body;
    const resultado = await authService.login(usuario, pin);
    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.token, req.usuario.id, req.sesion.id);
    return res.status(200).json({ success: true, data: { mensaje: 'Sesión cerrada correctamente' } });
  } catch (error) {
    return next(error);
  }
}

export { login, logout };
