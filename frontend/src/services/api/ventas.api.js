import apiClient from './apiClient'

export function crearVenta(venta) {
  return apiClient.post('/ventas', venta)
}

export function obtenerVenta(idVenta) {
  return apiClient.get(`/ventas/${idVenta}`)
}

export function cancelarVenta(idVenta, motivoCancelacion, pinAutorizacion) {
  return apiClient.post(`/ventas/${idVenta}/cancelar`, {
    motivo_cancelacion: motivoCancelacion,
    pin_autorizacion: pinAutorizacion
  })
}

export function reimprimirVenta(idVenta) {
  return apiClient.post(`/ventas/${idVenta}/reimprimir`)
}

export function buscarVentas(params = {}) {
  return apiClient.get('/ventas', { params })
}
