import * as categoriesService from '../services/categories-service.js';

async function crear(req, res, next) {
  try {
    const categoria = await categoriesService.crearCategoria(req.body.nombre);
    return res.status(201).json({ success: true, data: categoria });
  } catch (error) {
    return next(error);
  }
}

async function listar(req, res, next) {
  try {
    const categorias = await categoriesService.listarCategorias();
    return res.status(200).json({ success: true, data: categorias });
  } catch (error) {
    return next(error);
  }
}

export { crear, listar };
