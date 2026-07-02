import * as productsService from '../services/products-service.js';

async function crear(req, res, next) {
  try {
    const producto = await productsService.crearProducto(req.body);
    return res.status(201).json({ success: true, data: producto });
  } catch (error) {
    return next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const producto = await productsService.actualizarProducto(Number(req.params.id), req.body);
    return res.status(200).json({ success: true, data: producto });
  } catch (error) {
    return next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const resultado = await productsService.desactivarProducto(Number(req.params.id), req.body.confirmar);
    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return next(error);
  }
}

async function buscar(req, res, next) {
  try {
    const { q, codigo_barras: codigoBarras } = req.query;
    const productos = await productsService.buscarProductos({ q, codigoBarras });
    return res.status(200).json({ success: true, data: productos });
  } catch (error) {
    return next(error);
  }
}

async function stockBajo(req, res, next) {
  try {
    const productos = await productsService.listarStockBajo();
    return res.status(200).json({ success: true, data: productos });
  } catch (error) {
    return next(error);
  }
}

export { crear, actualizar, desactivar, buscar, stockBajo };
