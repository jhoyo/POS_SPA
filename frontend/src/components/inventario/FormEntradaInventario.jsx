import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import * as productosApi from '../../services/api/productos.api'
import * as inventarioApi from '../../services/api/inventario.api'

function FormEntradaInventario() {
  const queryClient = useQueryClient()
  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosApi.listarProductos()
  })

  const [idProducto, setIdProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [costoUnitario, setCostoUnitario] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setExito(null)
    if (!idProducto) {
      setError('Selecciona un producto')
      return
    }
    if (!cantidad || Number(cantidad) <= 0) {
      setError('La cantidad debe ser mayor a cero')
      return
    }
    setGuardando(true)
    try {
      await inventarioApi.registrarEntrada({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        costoUnitario: costoUnitario ? Number(costoUnitario) : undefined,
        motivo: motivo || undefined
      })
      setExito('Entrada registrada. El stock se actualizó correctamente.')
      setCantidad('')
      setCostoUnitario('')
      setMotivo('')
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['stock-bajo'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Producto</label>
        <select
          className="min-h-[44px] border border-gray-300 rounded-lg px-3"
          value={idProducto}
          onChange={(e) => setIdProducto(e.target.value)}
        >
          <option value="">Selecciona un producto...</option>
          {productos.map((producto) => (
            <option key={producto.id_producto} value={producto.id_producto}>
              {producto.nombre} ({producto.sku})
            </option>
          ))}
        </select>
      </div>
      <Input label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      <Input
        label="Costo unitario"
        type="number"
        step="0.01"
        value={costoUnitario}
        onChange={(e) => setCostoUnitario(e.target.value)}
      />
      <Input label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      <ErrorMessage message={error} />
      {exito && <p className="text-green-700 text-sm font-medium">{exito}</p>}
      <Button type="submit" disabled={guardando}>
        Registrar entrada
      </Button>
    </form>
  )
}

export default FormEntradaInventario
