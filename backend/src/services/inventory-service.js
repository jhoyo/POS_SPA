import { AppError } from '../middlewares/error-handler-middleware.js';
import * as productosRepository from '../repositories/products-repository.js';
import * as inventarioRepository from '../repositories/inventory-repository.js';
import * as auditoriaRepository from '../repositories/audit-repository.js';

async function registrarEntrada({ idProducto, cantidad, costoUnitario, motivo, idUsuario }) {
  const producto = await productosRepository.buscarPorId(idProducto);
  if (!producto) {
    throw new AppError(404, 'El producto no existe');
  }

  if (cantidad <= 0) {
    throw new AppError(400, 'La cantidad debe ser mayor a cero');
  }

  return inventarioRepository.registrarMovimiento({
    idProducto,
    tipo: 'entrada',
    cantidad,
    motivo,
    idUsuario,
    costoUnitario,
  });
}

async function registrarAjuste({ idProducto, cantidad, tipo, motivo, confirmar, idUsuario }) {
  const producto = await productosRepository.buscarPorId(idProducto);
  if (!producto) {
    throw new AppError(404, 'El producto no existe');
  }

  if (!motivo) {
    throw new AppError(400, 'El motivo es obligatorio');
  }

  const dejariaNegativo = tipo === 'ajuste_negativo' && producto.stock_actual - cantidad < 0;

  if (dejariaNegativo && !confirmar) {
    throw new AppError(
      409,
      `Este ajuste dejaría el stock en un valor negativo (stock actual: ${producto.stock_actual}). Confirme para continuar.`
    );
  }

  let resultado;
  try {
    resultado = await inventarioRepository.registrarMovimiento({
      idProducto,
      tipo,
      cantidad,
      motivo,
      idUsuario,
    });
  } catch (error) {
    if (error.stockInsuficiente) {
      throw new AppError(409, error.message);
    }
    throw error;
  }

  await auditoriaRepository.registrar(
    'AJUSTE_INVENTARIO',
    `Ajuste ${tipo} de ${cantidad} unidades en producto ${idProducto}: ${motivo}`,
    idUsuario,
    'movimientos_inventario',
    idProducto
  );

  return resultado;
}

async function listarStockBajo() {
  return productosRepository.listarStockBajo();
}

async function listarMovimientos(filtros) {
  return inventarioRepository.listarMovimientos(filtros);
}

export { registrarEntrada, registrarAjuste, listarStockBajo, listarMovimientos };
