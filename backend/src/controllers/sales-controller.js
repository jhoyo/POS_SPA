import * as salesService from '../services/sales-service.js';

async function crear(req, res, next) {
  try {
    const { carrito, pagos, descuento_general: descuentoGeneral, pin_autorizacion: pinAutorizacion } = req.body;

    const resultado = await salesService.registrarVenta({
      idCajero: req.usuario.id,
      carrito,
      pagos,
      descuentoGeneral,
      pinAutorizacion,
    });

    return res.status(201).json({ success: true, data: resultado });
  } catch (error) {
    return next(error);
  }
}

async function cancelar(req, res, next) {
  try {
    const { motivo_cancelacion: motivo, pin_autorizacion: pinAutorizacion } = req.body;

    const venta = await salesService.cancelarVenta({
      idVenta: Number(req.params.id),
      idCajero: req.usuario.id,
      motivo,
      pinAutorizacion,
    });

    return res.status(200).json({ success: true, data: venta });
  } catch (error) {
    return next(error);
  }
}

async function obtenerTicket(req, res, next) {
  try {
    const ticket = await salesService.obtenerTicket(Number(req.params.id));
    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    return next(error);
  }
}

async function reimprimir(req, res, next) {
  try {
    const ticket = await salesService.reimprimirTicket(Number(req.params.id), req.usuario.id);
    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    return next(error);
  }
}

async function listar(req, res, next) {
  try {
    const { folio, fecha_inicio: fechaInicio, fecha_fin: fechaFin, id_cajero: idCajero } = req.query;

    const ventas = await salesService.listarVentas({
      folio: folio ? Number(folio) : undefined,
      fechaInicio,
      fechaFin,
      idCajero: idCajero ? Number(idCajero) : undefined,
    });

    return res.status(200).json({ success: true, data: ventas });
  } catch (error) {
    return next(error);
  }
}

export { crear, cancelar, obtenerTicket, reimprimir, listar };
