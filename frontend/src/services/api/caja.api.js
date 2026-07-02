import apiClient from './apiClient'

export function abrirCaja(fondoInicial, pinAutorizacion) {
  return apiClient.post('/caja/apertura', { fondo_inicial: fondoInicial, pin_autorizacion: pinAutorizacion })
}

export function obtenerAperturaActual() {
  return apiClient.get('/caja/apertura/actual')
}

export function obtenerCorteX() {
  return apiClient.get('/caja/corte-x')
}

export function generarCorteZ(efectivoDeclarado) {
  return apiClient.post('/caja/corte-z', { efectivo_declarado: efectivoDeclarado })
}
