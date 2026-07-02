import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler-middleware.js';
import { compararPin } from '../utils/password-util.js';
import { hashearToken } from '../utils/crypto-util.js';
import * as usuariosRepository from '../repositories/users-repository.js';
import * as sesionesRepository from '../repositories/sessions-repository.js';
import * as auditoriaRepository from '../repositories/audit-repository.js';
import { obtenerConfiguracion } from '../repositories/config-repository.js';

const MAX_INTENTOS_FALLIDOS = 3;

async function login(usuario, pin) {
  const registroUsuario = await usuariosRepository.buscarPorUsuario(usuario);

  // No revelar si el usuario existe o no ante credenciales inválidas
  if (!registroUsuario || !registroUsuario.activo) {
    throw new AppError(401, 'Usuario o PIN incorrectos');
  }

  if (registroUsuario.bloqueado_hasta && new Date(registroUsuario.bloqueado_hasta) > new Date()) {
    throw new AppError(403, 'Cuenta bloqueada temporalmente');
  }

  const pinValido = await compararPin(pin, registroUsuario.pin_hash);

  if (!pinValido) {
    const intentos = await usuariosRepository.incrementarIntentosFallidos(registroUsuario.id_usuario);

    if (intentos >= MAX_INTENTOS_FALLIDOS) {
      const configuracion = await obtenerConfiguracion();
      const bloqueadoHasta = new Date(Date.now() + configuracion.bloqueo_minutos * 60000).toISOString();
      await usuariosRepository.bloquearHasta(registroUsuario.id_usuario, bloqueadoHasta);
    }

    throw new AppError(401, 'Usuario o PIN incorrectos');
  }

  await usuariosRepository.resetearIntentosFallidos(registroUsuario.id_usuario);

  const token = jwt.sign(
    { id: registroUsuario.id_usuario, usuario: registroUsuario.usuario, rol: registroUsuario.rol },
    env.jwtSecret,
    { expiresIn: env.jwtExpiracion }
  );

  await sesionesRepository.crearSesion({ idUsuario: registroUsuario.id_usuario, tokenHash: hashearToken(token) });
  await auditoriaRepository.registrar(
    'LOGIN',
    'Inicio de sesión exitoso',
    registroUsuario.id_usuario,
    'usuarios',
    registroUsuario.id_usuario
  );

  return {
    token,
    usuario: { id: registroUsuario.id_usuario, nombre: registroUsuario.nombre, rol: registroUsuario.rol },
  };
}

async function logout(token, idUsuario, idSesion) {
  await sesionesRepository.invalidarSesion(idSesion);
  await auditoriaRepository.registrar('LOGOUT', 'Cierre de sesión', idUsuario, 'usuarios', idUsuario);
}

// Verifica un PIN de administrador para autorizar una acción sensible (descuentos,
// cancelaciones, doble apertura de caja, ajustes negativos de inventario, etc.)
async function autorizarConPinAdministrador(pin) {
  if (!pin) return null;

  const candidatos = await usuariosRepository.listar();
  for (const candidato of candidatos.filter((u) => u.rol === 'administrador' && u.activo)) {
    const registroCompleto = await usuariosRepository.buscarPorId(candidato.id);
    // eslint-disable-next-line no-await-in-loop
    const valido = await compararPin(pin, registroCompleto.pin_hash);
    if (valido) return registroCompleto;
  }

  return null;
}

export { login, logout, autorizarConPinAdministrador };
