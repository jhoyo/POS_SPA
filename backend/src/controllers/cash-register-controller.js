import * as cashRegisterService from '../services/cash-register-service.js';

async function abrir(req, res, next) {
  try {
    const { fondo_inicial: fondoInicial, pin_autorizacion: pinAutorizacion } = req.body;

    const apertura = await cashRegisterService.abrirCaja({
      idUsuario: req.usuario.id,
      fondoInicial,
      pinAutorizacion,
    });

    return res.status(201).json({ success: true, data: apertura });
  } catch (error) {
    return next(error);
  }
}

async function aperturaActual(req, res, next) {
  try {
    const apertura = await cashRegisterService.obtenerAperturaActual(req.usuario.id);
    return res.status(200).json({ success: true, data: apertura });
  } catch (error) {
    return next(error);
  }
}

async function corteX(req, res, next) {
  try {
    const corte = await cashRegisterService.generarCorteX(req.usuario.id);
    return res.status(200).json({ success: true, data: corte });
  } catch (error) {
    return next(error);
  }
}

async function corteZ(req, res, next) {
  try {
    const { efectivo_declarado: efectivoDeclarado } = req.body;

    const corte = await cashRegisterService.generarCorteZ({
      idUsuario: req.usuario.id,
      efectivoDeclarado,
    });

    return res.status(201).json({ success: true, data: corte });
  } catch (error) {
    return next(error);
  }
}

export { abrir, aperturaActual, corteX, corteZ };
