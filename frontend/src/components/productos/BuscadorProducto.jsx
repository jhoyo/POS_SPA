import { useState, useEffect, useRef } from 'react'
import * as productosApi from '../../services/api/productos.api'
import ErrorMessage from '../common/ErrorMessage'

function BuscadorProducto({ onSeleccionar, onCrearRapido }) {
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState([])
  const [error, setError] = useState(null)
  const [codigoNoEncontrado, setCodigoNoEncontrado] = useState(null)
  const timeoutRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // El lector de código de barras HID escribe como si fuera un teclado,
    // por eso el input debe mantener el foco en la pantalla de ventas.
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!termino) {
      setResultados([])
      return undefined
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        setError(null)
        setCodigoNoEncontrado(null)
        const productos = await productosApi.listarProductos({ q: termino })
        setResultados(productos)
      } catch (err) {
        setError(err.message)
      }
    }, 300)
    return () => clearTimeout(timeoutRef.current)
  }, [termino])

  const handleSeleccionar = (producto) => {
    if (producto.stock_actual <= 0) {
      setError('Sin stock disponible')
      return
    }
    onSeleccionar(producto)
    setTermino('')
    setResultados([])
  }

  const handleKeyDown = async (event) => {
    if (event.key !== 'Enter') return
    try {
      const producto = await productosApi.buscarProductoPorCodigo(termino)
      if (!producto) {
        setCodigoNoEncontrado(termino)
        return
      }
      handleSeleccionar(producto)
    } catch {
      setCodigoNoEncontrado(termino)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        className="min-h-[44px] w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Buscar por nombre o escanear código de barras..."
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <ErrorMessage message={error} />
      {codigoNoEncontrado && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>Producto no encontrado. ¿Desea registrarlo?</span>
          <button
            type="button"
            className="text-blue-600 font-medium hover:underline whitespace-nowrap"
            onClick={() => onCrearRapido?.(codigoNoEncontrado)}
          >
            Alta rápida
          </button>
        </div>
      )}
      {resultados.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
          {resultados.map((producto) => (
            <li
              key={producto.id_producto}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
              onClick={() => handleSeleccionar(producto)}
            >
              <span>{producto.nombre}</span>
              <span className="text-gray-500">{producto.stock_actual} disp.</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BuscadorProducto
