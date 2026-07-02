import { jest } from '@jest/globals';

jest.mock('../src/repositories/cash-register-repository.js', () => ({
  obtenerAperturaAbierta: jest.fn(),
  existeCorteZ: jest.fn(),
  crearCorte: jest.fn(),
  cerrarApertura: jest.fn()
}));
jest.mock('../src/repositories/sales-repository.js', () => ({
  listarPorApertura: jest.fn()
}));
jest.mock('../src/services/auth-service.js', () => ({
  autorizarConPinAdministrador: jest.fn()
}));

import { generarCorteZ } from '../src/services/cash-register-service.js';
import * as cajaRepository from '../src/repositories/cash-register-repository.js';
import * as ventasRepository from '../src/repositories/sales-repository.js';

describe('generarCorteZ — corte de caja (HU-15, RN-05)', () => {
  const APERTURA_ABIERTA = { id_apertura: 1, id_usuario: 7, fondo_inicial: 1000 };

  beforeEach(() => {
    cajaRepository.obtenerAperturaAbierta.mockResolvedValue(APERTURA_ABIERTA);
    cajaRepository.existeCorteZ.mockResolvedValue(false);
    cajaRepository.crearCorte.mockImplementation(async (datos) => ({ id_corte: 99, ...datos }));
    cajaRepository.cerrarApertura.mockResolvedValue(undefined);
  });

  it('calcula el efectivo esperado (fondo inicial + ventas en efectivo) y la diferencia contra lo declarado', async () => {
    ventasRepository.listarPorApertura.mockResolvedValue([
      { total: 360, pagos_venta: [{ forma_pago: 'efectivo', monto: 360 }] }
    ]);

    const corte = await generarCorteZ({ idUsuario: 7, efectivoDeclarado: 1360 });

    expect(cajaRepository.crearCorte).toHaveBeenCalledWith(
      expect.objectContaining({
        idAperturaCaja: 1,
        tipo: 'Z',
        efectivoEsperado: 1360,
        efectivoDeclarado: 1360,
        diferencia: 0,
        fondoInicial: 1000,
        totalVentas: 360,
        numTransacciones: 1,
        totalEfectivo: 360
      })
    );
    expect(corte.diferencia).toBe(0);

    // El corte Z cierra el turno definitivamente (RN-05)
    expect(cajaRepository.cerrarApertura).toHaveBeenCalledWith(1);
  });

  it('registra un faltante cuando el efectivo declarado es menor al esperado', async () => {
    ventasRepository.listarPorApertura.mockResolvedValue([
      { total: 360, pagos_venta: [{ forma_pago: 'efectivo', monto: 360 }] }
    ]);

    const corte = await generarCorteZ({ idUsuario: 7, efectivoDeclarado: 1300 });

    // esperado 1360, declarado 1300 => diferencia -60 (faltante)
    expect(corte.diferencia).toBe(-60);
  });

  it('desglosa correctamente varias formas de pago en el resumen del turno', async () => {
    ventasRepository.listarPorApertura.mockResolvedValue([
      {
        total: 500,
        pagos_venta: [
          { forma_pago: 'efectivo', monto: 200 },
          { forma_pago: 'tarjeta', monto: 300 }
        ]
      }
    ]);

    await generarCorteZ({ idUsuario: 7, efectivoDeclarado: 1200 });

    expect(cajaRepository.crearCorte).toHaveBeenCalledWith(
      expect.objectContaining({
        totalEfectivo: 200,
        totalTarjeta: 300,
        totalTransferencia: 0,
        totalVentas: 500
      })
    );
  });

  it('rechaza generar un segundo corte Z para la misma apertura con 409 (RN-05)', async () => {
    cajaRepository.existeCorteZ.mockResolvedValue(true);

    await expect(generarCorteZ({ idUsuario: 7, efectivoDeclarado: 1000 })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Ya se generó el corte Z para esta apertura de caja'
    });

    expect(cajaRepository.crearCorte).not.toHaveBeenCalled();
    expect(cajaRepository.cerrarApertura).not.toHaveBeenCalled();
  });
});
