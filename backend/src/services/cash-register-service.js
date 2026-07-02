import { AppError } from '../middlewares/error-handler-middleware.js';
import * as cajaRepository from '../repositories/cash-register-repository.js';
import * as ventasRepository from '../repositories/sales-repository.js';
import { autorizarConPinAdministrador } from './auth-service.js';

async function abrirCaja({ idUsuario, fondoInicial, pinAutorizacion }) {
  const aperturaPropia = await cajaRepository.obtenerAperturaAbierta(idUsuario);
  if (aperturaPropia) {
    throw new AppError(409, 'Ya tiene una apertura de caja en curso');
  }

  const aperturaAjena = await cajaRepository.obtenerAperturaAbiertaGlobal();

  let idUsuarioAutorizo = null;

  if (aperturaAjena) {
    const administrador = await autorizarConPinAdministrador(pinAutorizacion);
    if (!administrador) {
      throw new AppError(409, 'Existe una apertura de caja de un turno anterior. Se requiere autorización de un administrador');
    }
    idUsuarioAutorizo = administrador.id_usuario;
  }

  return cajaRepository.crearApertura({ idUsuario, fondoInicial, idUsuarioAutorizo });
}

async function obtenerAperturaActual(idUsuario) {
  const apertura = await cajaRepository.obtenerAperturaAbierta(idUsuario);
  if (!apertura) {
    throw new AppError(404, 'No hay una apertura de caja activa para este usuario');
  }
  return apertura;
}

async function calcularResumenTurno(idAperturaCaja) {
  const ventas = await ventasRepository.listarPorApertura(idAperturaCaja);

  const desglosePorFormaPago = {};
  let totalVentas = 0;

  for (const venta of ventas) {
    totalVentas += Number(venta.total);
    for (const pago of venta.pagos_venta || []) {
      desglosePorFormaPago[pago.forma_pago] = (desglosePorFormaPago[pago.forma_pago] || 0) + Number(pago.monto);
    }
  }

  return {
    total_ventas: Math.round(totalVentas * 100) / 100,
    num_transacciones: ventas.length,
    desglose_por_forma_pago: desglosePorFormaPago,
  };
}

async function generarCorteX(idUsuario) {
  const apertura = await obtenerAperturaActual(idUsuario);
  const resumen = await calcularResumenTurno(apertura.id_apertura);

  return {
    id_apertura_caja: apertura.id_apertura,
    fondo_inicial: apertura.fondo_inicial,
    fecha_apertura: apertura.fecha_apertura,
    ...resumen,
  };
}

async function generarCorteZ({ idUsuario, efectivoDeclarado }) {
  const apertura = await obtenerAperturaActual(idUsuario);

  const yaExisteCorteZ = await cajaRepository.existeCorteZ(apertura.id_apertura);
  if (yaExisteCorteZ) {
    throw new AppError(409, 'Ya se generó el corte Z para esta apertura de caja');
  }

  const resumen = await calcularResumenTurno(apertura.id_apertura);
  const efectivoEnVentas = resumen.desglose_por_forma_pago.efectivo || 0;
  const efectivoEsperado = Math.round((Number(apertura.fondo_inicial) + efectivoEnVentas) * 100) / 100;
  const diferencia = Math.round((efectivoDeclarado - efectivoEsperado) * 100) / 100;

  const corte = await cajaRepository.crearCorte({
    idAperturaCaja: apertura.id_apertura,
    tipo: 'Z',
    efectivoDeclarado,
    efectivoEsperado,
    diferencia,
    fondoInicial: apertura.fondo_inicial,
    totalVentas: resumen.total_ventas,
    numTransacciones: resumen.num_transacciones,
    totalEfectivo: resumen.desglose_por_forma_pago.efectivo || 0,
    totalTarjeta: resumen.desglose_por_forma_pago.tarjeta || 0,
    totalTransferencia: resumen.desglose_por_forma_pago.transferencia || 0,
    idUsuario,
  });

  await cajaRepository.cerrarApertura(apertura.id_apertura);

  return corte;
}

export { abrirCaja, obtenerAperturaActual, generarCorteX, generarCorteZ };
