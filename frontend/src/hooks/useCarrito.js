import { useState, useCallback, useMemo } from 'react'

export function useCarrito() {
  const [lineas, setLineas] = useState([])

  const agregarProducto = useCallback((producto, cantidad = 1) => {
    setLineas((prev) => {
      const existente = prev.find((l) => l.idProducto === producto.id_producto)
      if (existente) {
        return prev.map((l) =>
          l.idProducto === producto.id_producto ? { ...l, cantidad: l.cantidad + cantidad } : l
        )
      }
      return [
        ...prev,
        {
          idProducto: producto.id_producto,
          nombre: producto.nombre,
          precioUnitario: producto.precio_venta,
          cantidad,
          descuentoPorcentaje: 0
        }
      ]
    })
  }, [])

  const actualizarCantidad = useCallback((idProducto, cantidad) => {
    setLineas((prev) => prev.map((l) => (l.idProducto === idProducto ? { ...l, cantidad } : l)))
  }, [])

  const aplicarDescuentoLinea = useCallback((idProducto, descuentoPorcentaje) => {
    setLineas((prev) =>
      prev.map((l) => (l.idProducto === idProducto ? { ...l, descuentoPorcentaje } : l))
    )
  }, [])

  const quitarProducto = useCallback((idProducto) => {
    setLineas((prev) => prev.filter((l) => l.idProducto !== idProducto))
  }, [])

  const vaciarCarrito = useCallback(() => {
    setLineas([])
  }, [])

  const total = useMemo(() => {
    return lineas.reduce((acc, l) => {
      const subtotalLinea = l.precioUnitario * l.cantidad
      const descuento = subtotalLinea * (l.descuentoPorcentaje / 100)
      return acc + (subtotalLinea - descuento)
    }, 0)
  }, [lineas])

  return {
    lineas,
    total,
    agregarProducto,
    actualizarCantidad,
    aplicarDescuentoLinea,
    quitarProducto,
    vaciarCarrito
  }
}
