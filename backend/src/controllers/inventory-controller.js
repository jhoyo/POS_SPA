import * as inventoryService from '../services/inventory-service.js';

async function registrarEntrada(req, res, next) {
  try {
    const { id_producto: idProducto, cantidad, costo_unitario: costoUnitario, motivo } = req.body;

    const resultado = await inventoryService.registrarEntrada({
      idProducto,
      cantidad,
      costoUnitario,
      motivo,
      idUsuario: req.usuario.id,
    });

    return res.status(201).json({ success: true, data: resultado });
  } catch (error) {
    return next(error);
  }
}

async function registrarAjuste(req, res, next) {
  try {
    const { id_producto: idProducto, cantidad, tipo, motivo, confirmar } = req.body;

    const resultado = await inventoryService.registrarAjuste({
      idProducto,
      cantidad,
      tipo,
      motivo,
      confirmar,
      idUsuario: req.usuario.id,
    });

    return res.status(201).json({ success: true, data: resultado });
  } catch (error) {
    return next(error);
  }
}

async function stockBajo(req, res, next) {
  try {
    const productos = await inventoryService.listarStockBajo();
    return res.status(200).json({ success: true, data: productos });
  } catch (error) {
    return next(error);
  }
}

async function listarMovimientos(req, res, next) {
  try {
    const { id_producto: idProducto, tipo } = req.query;

    const movimientos = await inventoryService.listarMovimientos({
      idProducto: idProducto ? Number(idProducto) : undefined,
      tipos: tipo ? tipo.split(',') : undefined,
    });

    return res.status(200).json({ success: true, data: movimientos });
  } catch (error) {
    return next(error);
  }
}

export { registrarEntrada, registrarAjuste, stockBajo, listarMovimientos };
