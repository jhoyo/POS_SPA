import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { hashearToken } from '../utils/crypto-util.js';
import { buscarPorTokenHash, actualizarUltimaActividad, invalidarSesion } from '../repositories/sessions-repository.js';
import { obtenerConfiguracion } from '../repositories/config-repository.js';

async function authMiddleware(req, res, next) {
  try {
    const encabezado = req.headers.authorization || '';
    const [esquema, token] = encabezado.split(' ');

    if (esquema !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'No se proporcionó un token de autenticación' });
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }

    const tokenHash = hashearToken(token);
    const sesion = await buscarPorTokenHash(tokenHash);

    if (!sesion) {
      return res.status(401).json({ success: false, error: 'La sesión no es válida' });
    }

    const configuracion = await obtenerConfiguracion();
    const minutosInactivo = (Date.now() - new Date(sesion.ultima_actividad).getTime()) / 60000;

    if (minutosInactivo > configuracion.inactividad_minutos) {
      await invalidarSesion(sesion.id);
      return res.status(401).json({ success: false, error: 'Sesión expirada' });
    }

    await actualizarUltimaActividad(sesion.id);

    req.usuario = { id: payload.id, usuario: payload.usuario, rol: payload.rol };
    req.sesion = sesion;
    req.token = token;

    next();
  } catch {
    return res.status(401).json({ success: false, error: 'No fue posible validar la sesión' });
  }
}

export { authMiddleware };
