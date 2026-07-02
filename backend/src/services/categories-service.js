import { AppError } from '../middlewares/error-handler-middleware.js';
import * as categoriasRepository from '../repositories/categories-repository.js';

async function crearCategoria(nombre) {
  try {
    return await categoriasRepository.crear(nombre);
  } catch (error) {
    if (error.codigoConflicto) {
      throw new AppError(409, error.message);
    }
    throw error;
  }
}

async function listarCategorias() {
  return categoriasRepository.listar();
}

export { crearCategoria, listarCategorias };
