import apiClient from './apiClient'

export function listarProductos(params = {}) {
  return apiClient.get('/productos', { params })
}

export function buscarProductoPorCodigo(codigoBarras) {
  return apiClient.get('/productos', { params: { codigo_barras: codigoBarras } })
}

export function crearProducto(producto) {
  return apiClient.post('/productos', producto)
}

export function actualizarProducto(idProducto, producto) {
  return apiClient.put(`/productos/${idProducto}`, producto)
}

export function desactivarProducto(idProducto, confirmar = false) {
  return apiClient.delete(`/productos/${idProducto}`, { data: { confirmar } })
}
