import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/common/Layout'
import ProductoCard from '../components/productos/ProductoCard'
import ProductoForm from '../components/productos/ProductoForm'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import ErrorMessage from '../components/common/ErrorMessage'
import * as productosApi from '../services/api/productos.api'

function ProductosPage() {
  const queryClient = useQueryClient()
  const [formAbierto, setFormAbierto] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)
  const [productoDesactivar, setProductoDesactivar] = useState(null)
  const [error, setError] = useState(null)

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosApi.listarProductos()
  })

  const invalidarProductos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['productos'] })
  }, [queryClient])

  const handleGuardar = async (datos) => {
    if (productoEditar) {
      await productosApi.actualizarProducto(productoEditar.id_producto, datos)
    } else {
      await productosApi.crearProducto(datos)
    }
    invalidarProductos()
    setFormAbierto(false)
    setProductoEditar(null)
  }

  const handleDesactivar = async (confirmar) => {
    setError(null)
    try {
      await productosApi.desactivarProducto(productoDesactivar.id_producto, confirmar)
      invalidarProductos()
      setProductoDesactivar(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de productos</h1>
        <Button
          onClick={() => {
            setProductoEditar(null)
            setFormAbierto(true)
          }}
        >
          Nuevo producto
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productos.map((producto) => (
            <ProductoCard
              key={producto.id_producto}
              producto={producto}
              onEditar={(p) => {
                setProductoEditar(p)
                setFormAbierto(true)
              }}
              onDesactivar={(p) => setProductoDesactivar(p)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={formAbierto}
        title={productoEditar ? 'Editar producto' : 'Nuevo producto'}
        onClose={() => setFormAbierto(false)}
      >
        <ProductoForm productoInicial={productoEditar} onGuardar={handleGuardar} onCancelar={() => setFormAbierto(false)} />
      </Modal>

      <Modal isOpen={!!productoDesactivar} title="Confirmar desactivación" onClose={() => setProductoDesactivar(null)}>
        <p className="text-gray-600 mb-2">
          El producto <strong>{productoDesactivar?.nombre}</strong> aún tiene stock disponible (
          {productoDesactivar?.stock_actual}).
        </p>
        <p className="text-gray-600 mb-4">¿Deseas desactivarlo de todas formas?</p>
        <ErrorMessage message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setProductoDesactivar(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => handleDesactivar(true)}>
            Desactivar
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}

export default ProductosPage
