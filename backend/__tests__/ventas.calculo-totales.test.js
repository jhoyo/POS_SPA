import { jest } from '@jest/globals';

jest.mock('../src/repositories/cash-register-repository.js', () => ({
  obtenerAperturaAbierta: jest.fn()
}));
jest.mock('../src/repositories/config-repository.js', () => ({
  obtenerConfiguracion: jest.fn()
}));
jest.mock('../src/repositories/products-repository.js', () => ({
  buscarPorId: jest.fn()
}));
jest.mock('../src/repositories/sales-repository.js', () => ({
  crearVentaCompleta: jest.fn()
}));
jest.mock('../src/repositories/audit-repository.js', () => ({
  registrar: jest.fn()
}));
jest.mock('../src/services/auth-service.js', () => ({
  autorizarConPinAdministrador: jest.fn()
}));

import { registrarVenta } from '../src/services/sales-service.js';
import * as cajaRepository from '../src/repositories/cash-register-repository.js';
import * as configRepository from '../src/repositories/config-repository.js';
import * as productosRepository from '../src/repositories/products-repository.js';
import * as ventasRepository from '../src/repositories/sales-repository.js';

describe('registrarVenta — cálculo de totales de venta (HU-06, RN-01)', () => {
  const APERTURA_ABIERTA = { id_apertura: 1, id_usuario: 7, fondo_inicial: 500 };
  const CONFIGURACION = { iva_rate: 0.16, descuento_maximo_cajero: 15 };

  beforeEach(() => {
    cajaRepository.obtenerAperturaAbierta.mockResolvedValue(APERTURA_ABIERTA);
    configRepository.obtenerConfiguracion.mockResolvedValue(CONFIGURACION);
    ventasRepository.crearVentaCompleta.mockResolvedValue({ id: 1, folio: 2002 });
  });

  it('desglosa correctamente subtotal e IVA (16%) de un producto con precio con IVA incluido', async () => {
    // precio_venta = 116 (IVA incluido) => subtotal 100.00 + iva 16.00, x2 unidades
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 10
    });

    const carrito = [{ id_producto: 10, cantidad: 2, descuento: 0 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 232 }];

    const resultado = await registrarVenta({
      idCajero: 7,
      carrito,
      pagos,
      descuentoGeneral: 0,
      pinAutorizacion: undefined
    });

    expect(resultado.subtotal).toBe(200);
    expect(resultado.iva).toBe(32);
    expect(resultado.total).toBe(232);
    expect(resultado.cambio).toBe(0);
    expect(resultado.folio).toBe(2002);
  });

  it('calcula el cambio cuando el monto pagado supera el total', async () => {
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 10
    });

    const carrito = [{ id_producto: 10, cantidad: 2, descuento: 0 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 300 }];

    const resultado = await registrarVenta({
      idCajero: 7,
      carrito,
      pagos,
      descuentoGeneral: 0,
      pinAutorizacion: undefined
    });

    expect(resultado.total).toBe(232);
    expect(resultado.cambio).toBe(68);
  });

  it('rechaza el pago con 400 "Monto insuficiente" cuando la suma de pagos no cubre el total', async () => {
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 10
    });

    const carrito = [{ id_producto: 10, cantidad: 2, descuento: 0 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 100 }];

    await expect(
      registrarVenta({ idCajero: 7, carrito, pagos, descuentoGeneral: 0, pinAutorizacion: undefined })
    ).rejects.toMatchObject({ statusCode: 400, message: 'Monto insuficiente. Falta $132.00' });

    expect(ventasRepository.crearVentaCompleta).not.toHaveBeenCalled();
  });

  it('resta el descuento por línea del total antes de calcular el IVA', async () => {
    // precio_venta = 116, cantidad 1, descuento de $16 en esa línea => precioLinea = 100
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 10
    });

    const carrito = [{ id_producto: 10, cantidad: 1, descuento: 16 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 100 }];

    const resultado = await registrarVenta({
      idCajero: 7,
      carrito,
      pagos,
      descuentoGeneral: 0,
      pinAutorizacion: undefined
    });

    // calcularIva(100, 0.16) => subtotal 86.21, iva 13.79 (redondeado a 2 decimales)
    expect(resultado.subtotal + resultado.iva).toBeCloseTo(100, 2);
    expect(resultado.total).toBe(100);
  });
});
