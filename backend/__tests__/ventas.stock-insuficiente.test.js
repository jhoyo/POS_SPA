import { jest } from '@jest/globals';

// Se mockean todas las dependencias de sales-service.js con factories explícitas
// para no ejecutar el módulo real (que conectaría con Supabase vía config/env.js).
// jest-hoist mueve estas llamadas antes de los `require` generados por los imports
// de abajo, así que el orden de aparición en el archivo no importa.
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

describe('registrarVenta — stock insuficiente al vender (HU-06)', () => {
  const APERTURA_ABIERTA = { id_apertura: 1, id_usuario: 7, fondo_inicial: 500 };
  const CONFIGURACION = { iva_rate: 0.16, descuento_maximo_cajero: 15 };

  beforeEach(() => {
    cajaRepository.obtenerAperturaAbierta.mockResolvedValue(APERTURA_ABIERTA);
    configRepository.obtenerConfiguracion.mockResolvedValue(CONFIGURACION);
  });

  it('rechaza la venta con 409 "Sin stock disponible" cuando la cantidad pedida excede el stock', async () => {
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 2
    });

    const carrito = [{ id_producto: 10, cantidad: 5, descuento: 0 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 580 }];

    await expect(
      registrarVenta({ idCajero: 7, carrito, pagos, descuentoGeneral: 0, pinAutorizacion: undefined })
    ).rejects.toMatchObject({ statusCode: 409, message: 'Sin stock disponible' });

    // No debe intentar crear la venta si el stock no alcanza (RN-06)
    expect(ventasRepository.crearVentaCompleta).not.toHaveBeenCalled();
  });

  it('permite la venta cuando la cantidad pedida es igual al stock disponible (límite exacto)', async () => {
    productosRepository.buscarPorId.mockResolvedValue({
      id_producto: 10,
      activo: true,
      precio_venta: 116,
      stock_actual: 5
    });
    ventasRepository.crearVentaCompleta.mockResolvedValue({ id: 1, folio: 1001 });

    const carrito = [{ id_producto: 10, cantidad: 5, descuento: 0 }];
    const pagos = [{ forma_pago: 'efectivo', monto: 580 }];

    await expect(
      registrarVenta({ idCajero: 7, carrito, pagos, descuentoGeneral: 0, pinAutorizacion: undefined })
    ).resolves.toMatchObject({ folio: 1001 });

    expect(ventasRepository.crearVentaCompleta).toHaveBeenCalledTimes(1);
  });
});
