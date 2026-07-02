import * as usersService from '../services/users-service.js';

async function listar(req, res, next) {
  try {
    const usuarios = await usersService.listarUsuarios();
    return res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const usuario = await usersService.crearUsuario(req.body);
    return res.status(201).json({ success: true, data: usuario });
  } catch (error) {
    return next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await usersService.actualizarUsuario(Number(req.params.id), req.body);
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    return next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const usuario = await usersService.desactivarUsuario(Number(req.params.id));
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    return next(error);
  }
}

export { listar, crear, actualizar, desactivar };
