import { AppError } from '../middlewares/error-handler-middleware.js';
import * as productosRepository from '../repositories/products-repository.js';

async function crearProducto(producto) {
  try {
    return await productosRepository.crear(producto);
  } catch (error) {
    if (error.codigoConflicto) {
      throw new AppError(409, error.message);
    }
    throw error;
  }
}

async function actualizarProducto(id, cambios) {
  const productoExistente = await productosRepository.buscarPorId(id);
  if (!productoExistente) {
    throw new AppError(404, 'El producto no existe');
  }

  // Editar precio/nombre nunca toca registros históricos de detalle_venta,
  // ya que ese detalle guarda su propio precio_unitario al momento de la venta.
  try {
    return await productosRepository.actualizar(id, cambios);
  } catch (error) {
    if (error.codigoConflicto) {
      throw new AppError(409, error.message);
    }
    throw error;
  }
}

async function desactivarProducto(id, confirmar) {
  const productoExistente = await productosRepository.buscarPorId(id);
  if (!productoExistente) {
    throw new AppError(404, 'El producto no existe');
  }

  if (productoExistente.stock_actual > 0 && !confirmar) {
    throw new AppError(
      409,
      `El producto tiene ${productoExistente.stock_actual} unidades en existencia. Confirme la desactivación para continuar.`
    );
  }

  const productoDesactivado = await productosRepository.desactivar(id);

  return {
    producto: productoDesactivado,
    advertencia: productoExistente.stock_actual > 0,
  };
}

async function buscarProductos({ q, codigoBarras }) {
  if (codigoBarras) {
    const producto = await productosRepository.buscarPorCodigoBarras(codigoBarras);
    if (!producto) {
      throw new AppError(404, 'No se encontró ningún producto con ese código de barras');
    }
    return [producto];
  }

  if (q) {
    return productosRepository.buscarPorNombre(q);
  }

  return productosRepository.listar();
}

async function listarStockBajo() {
  return productosRepository.listarStockBajo();
}

export { crearProducto, actualizarProducto, desactivarProducto, buscarProductos, listarStockBajo };
