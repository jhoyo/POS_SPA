import apiClient from './apiClient'

export function registrarEntrada({ idProducto, cantidad, costoUnitario, motivo }) {
  return apiClient.post('/inventario/entradas', {
    id_producto: idProducto,
    cantidad,
    costo_unitario: costoUnitario,
    motivo
  })
}

export function registrarAjuste({ idProducto, cantidad, tipo, motivo, confirmar }) {
  return apiClient.post('/inventario/ajustes', {
    id_producto: idProducto,
    cantidad,
    tipo,
    motivo,
    confirmar
  })
}

export function obtenerStockBajo() {
  return apiClient.get('/inventario/stock-bajo')
}

export function listarMovimientos(params = {}) {
  return apiClient.get('/inventario/movimientos', { params })
}
