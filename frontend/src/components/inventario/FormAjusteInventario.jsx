import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import Modal from '../common/Modal'
import * as productosApi from '../../services/api/productos.api'
import * as inventarioApi from '../../services/api/inventario.api'

const TIPOS_AJUSTE = [
  { valor: 'ajuste_negativo', etiqueta: 'Ajuste negativo (merma, robo, muestra)' },
  { valor: 'ajuste_positivo', etiqueta: 'Ajuste positivo (corrección a favor)' }
]

function FormAjusteInventario() {
  const queryClient = useQueryClient()
  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosApi.listarProductos()
  })

  const [idProducto, setIdProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [tipo, setTipo] = useState('ajuste_negativo')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false)

  const invalidarConsultas = () => {
    queryClient.invalidateQueries({ queryKey: ['productos'] })
    queryClient.invalidateQueries({ queryKey: ['stock-bajo'] })
    queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
  }

  const enviarAjuste = async (confirmar) => {
    setError(null)
    setGuardando(true)
    try {
      await inventarioApi.registrarAjuste({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        tipo,
        motivo,
        confirmar
      })
      setExito('Ajuste registrado correctamente.')
      setCantidad('')
      setMotivo('')
      setModalConfirmarAbierto(false)
      invalidarConsultas()
    } catch (err) {
      // El backend responde 409 pidiendo confirmación cuando el ajuste dejaría el stock en negativo (HU-12)
      if (err.message?.toLowerCase().includes('negativo') && !confirmar) {
        setModalConfirmarAbierto(true)
      } else {
        setError(err.message)
      }
    } finally {
      setGuardando(false)
    }
  }

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
    if (!motivo) {
      setError('El motivo es obligatorio')
      return
    }
    await enviarAjuste(false)
  }

  return (
    <>
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
                {producto.nombre} ({producto.sku}) · Stock: {producto.stock_actual}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipo de ajuste</label>
          <select
            className="min-h-[44px] border border-gray-300 rounded-lg px-3"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS_AJUSTE.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <Input label="Cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <Input label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <ErrorMessage message={error} />
        {exito && <p className="text-green-700 text-sm font-medium">{exito}</p>}
        <Button type="submit" disabled={guardando}>
          Registrar ajuste
        </Button>
      </form>

      <Modal isOpen={modalConfirmarAbierto} title="Confirmar ajuste" onClose={() => setModalConfirmarAbierto(false)}>
        <p className="text-gray-600 mb-4">El stock quedará en negativo. ¿Confirmar?</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalConfirmarAbierto(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => enviarAjuste(true)}>
            Sí, confirmar
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default FormAjusteInventario
