import { AppError } from '../middlewares/error-handler-middleware.js';
import { calcularIva } from '../utils/iva-util.js';
import * as productosRepository from '../repositories/products-repository.js';
import * as ventasRepository from '../repositories/sales-repository.js';
import * as cajaRepository from '../repositories/cash-register-repository.js';
import * as auditoriaRepository from '../repositories/audit-repository.js';
import { obtenerConfiguracion } from '../repositories/config-repository.js';
import { autorizarConPinAdministrador } from './auth-service.js';

const MENSAJE_CAJA_CERRADA = 'Debe registrar el fondo para abrir una nueva caja';

async function registrarVenta({ idCajero, carrito, pagos, descuentoGeneral, pinAutorizacion }) {
  const apertura = await cajaRepository.obtenerAperturaAbierta(idCajero);
  if (!apertura) {
    throw new AppError(409, MENSAJE_CAJA_CERRADA);
  }

  const configuracion = await obtenerConfiguracion();

  // Construir el detalle con precios reales del catálogo (nunca confiar en el precio del cliente)
  const detalles = [];
  let subtotalGeneral = 0;
  let ivaGeneral = 0;
  let requiereAutorizacionDescuento = false;

  for (const item of carrito) {
    // eslint-disable-next-line no-await-in-loop
    const producto = await productosRepository.buscarPorId(item.id_producto);

    if (!producto || !producto.activo) {
      throw new AppError(404, `El producto ${item.id_producto} no existe o no está disponible`);
    }

    if (producto.stock_actual < item.cantidad) {
      throw new AppError(409, 'Sin stock disponible');
    }

    const precioLineaBruto = producto.precio_venta * item.cantidad;
    const descuentoLinea = item.descuento || 0;
    // RN-04 aplica también al descuento por producto, no solo al de toda la venta (HU-08)
    const descuentoPorcentajeLinea = precioLineaBruto > 0 ? (descuentoLinea / precioLineaBruto) * 100 : 0;
    if (descuentoPorcentajeLinea > configuracion.descuento_maximo_cajero) {
      requiereAutorizacionDescuento = true;
    }

    const precioLinea = precioLineaBruto - descuentoLinea;
    const { subtotal, iva } = calcularIva(precioLinea, configuracion.iva_rate);

    subtotalGeneral += subtotal;
    ivaGeneral += iva;

    detalles.push({
      id_producto: producto.id_producto,
      cantidad: item.cantidad,
      precio_unitario: producto.precio_venta,
      subtotal,
      iva,
      descuento: descuentoLinea,
    });
  }

  const descuentoTotal = descuentoGeneral || 0;
  const excedeDescuentoGeneral = descuentoTotal > configuracion.descuento_maximo_cajero;

  if (excedeDescuentoGeneral || requiereAutorizacionDescuento) {
    const administrador = await autorizarConPinAdministrador(pinAutorizacion);
    if (!administrador) {
      throw new AppError(403, 'El descuento excede el límite permitido. Se requiere autorización de un administrador');
    }

    await auditoriaRepository.registrar(
      'DESCUENTO_AUTORIZADO',
      `Descuento autorizado por ${administrador.usuario}${excedeDescuentoGeneral ? ` (venta: ${descuentoTotal})` : ' (línea de producto)'}`,
      idCajero,
      'ventas',
      null
    );
  }

  const total = Math.round((subtotalGeneral + ivaGeneral - descuentoTotal) * 100) / 100;
  const sumaPagos = Math.round(pagos.reduce((acumulado, pago) => acumulado + pago.monto, 0) * 100) / 100;

  if (sumaPagos < total) {
    const faltante = Math.round((total - sumaPagos) * 100) / 100;
    throw new AppError(400, `Monto insuficiente. Falta $${faltante.toFixed(2)}`);
  }

  const cambio = Math.round((sumaPagos - total) * 100) / 100;

  let resultado;
  try {
    resultado = await ventasRepository.crearVentaCompleta({
      idCajero,
      idAperturaCaja: apertura.id_apertura,
      subtotal: subtotalGeneral,
      iva: ivaGeneral,
      descuento: descuentoTotal,
      total,
      cambio,
      detalles,
      pagos,
    });
  } catch (error) {
    if (error.sinStock) {
      throw new AppError(409, 'Sin stock disponible');
    }
    throw error;
  }

  return {
    id: resultado.id,
    folio: resultado.folio,
    subtotal: subtotalGeneral,
    iva: ivaGeneral,
    descuento: descuentoTotal,
    total,
    cambio,
    pagos,
  };
}

async function cancelarVenta({ idVenta, idCajero, motivo, pinAutorizacion }) {
  const venta = await ventasRepository.buscarPorId(idVenta);
  if (!venta) {
    throw new AppError(404, 'La venta no existe');
  }

  if (venta.estado === 'cancelada') {
    throw new AppError(409, 'La venta ya se encuentra cancelada');
  }

  const administrador = await autorizarConPinAdministrador(pinAutorizacion);
  if (!administrador) {
    throw new AppError(403, 'Se requiere el PIN de un administrador para cancelar la venta');
  }

  try {
    await ventasRepository.cancelarVenta({ idVenta, idCajeroCancela: idCajero, motivo });
  } catch (error) {
    if (error.yaCancelada) {
      throw new AppError(409, error.message);
    }
    throw error;
  }

  await auditoriaRepository.registrar(
    'CANCELACION_VENTA',
    `Venta ${idVenta} cancelada por autorización de ${administrador.usuario}: ${motivo}`,
    idCajero,
    'ventas',
    idVenta
  );

  return ventasRepository.buscarPorId(idVenta);
}

async function obtenerTicket(idVenta) {
  const ticket = await ventasRepository.obtenerTicket(idVenta);
  if (!ticket || ticket.length === 0) {
    throw new AppError(404, 'La venta no existe');
  }
  return ticket;
}

async function reimprimirTicket(idVenta, idUsuario) {
  const ticket = await obtenerTicket(idVenta);

  await auditoriaRepository.registrar('REIMPRESION', `Reimpresión del ticket de la venta ${idVenta}`, idUsuario, 'ventas', idVenta);

  return ticket;
}

async function listarVentas(filtros) {
  return ventasRepository.listarConFiltros(filtros);
}

export { registrarVenta, cancelarVenta, obtenerTicket, reimprimirTicket, listarVentas, MENSAJE_CAJA_CERRADA };
