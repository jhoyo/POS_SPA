import { AppError } from '../middlewares/error-handler-middleware.js';
import { hashPin } from '../utils/password-util.js';
import * as usuariosRepository from '../repositories/users-repository.js';

async function listarUsuarios() {
  return usuariosRepository.listar();
}

async function crearUsuario({ nombre, usuario, pin, rol }) {
  const existente = await usuariosRepository.buscarPorUsuario(usuario);
  if (existente) {
    throw new AppError(409, 'Ya existe un usuario con ese nombre de usuario');
  }

  const pinHash = await hashPin(pin);
  return usuariosRepository.crear({ nombre, usuario, pinHash, rol });
}

async function actualizarUsuario(id, cambios) {
  const usuarioExistente = await usuariosRepository.buscarPorId(id);
  if (!usuarioExistente) {
    throw new AppError(404, 'El usuario no existe');
  }

  const datosActualizados = { ...cambios };

  if (datosActualizados.pin) {
    datosActualizados.pin_hash = await hashPin(datosActualizados.pin);
    delete datosActualizados.pin;
  }

  return usuariosRepository.actualizar(id, datosActualizados);
}

async function desactivarUsuario(id) {
  const usuarioExistente = await usuariosRepository.buscarPorId(id);
  if (!usuarioExistente) {
    throw new AppError(404, 'El usuario no existe');
  }

  return usuariosRepository.actualizar(id, { activo: false });
}

export { listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario };
