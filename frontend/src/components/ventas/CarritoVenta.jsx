import { useState } from 'react'
import LineaVenta from './LineaVenta'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import { formatCurrency } from '../../utils/formatCurrency'

// Default de RN-04 en spec.md: el administrador puede configurar este valor;
// aquí se usa como límite de referencia en el cliente antes de pedir autorización.
const DESCUENTO_MAXIMO_CAJERO = 15

function CarritoVenta({ carrito, onPinAutorizado }) {
  const { lineas, total, actualizarCantidad, aplicarDescuentoLinea, quitarProducto } = carrito
  const [pinModalAbierto, setPinModalAbierto] = useState(false)
  const [descuentoPendiente, setDescuentoPendiente] = useState(null)
  const [pinAdmin, setPinAdmin] = useState('')
  const [errorPin, setErrorPin] = useState(null)

  const handleDescuentoChange = (idProducto, descuentoPorcentaje) => {
    if (descuentoPorcentaje > DESCUENTO_MAXIMO_CAJERO) {
      setDescuentoPendiente({ idProducto, descuentoPorcentaje })
      setPinModalAbierto(true)
      return
    }
    aplicarDescuentoLinea(idProducto, descuentoPorcentaje)
  }

  const confirmarDescuentoConPin = () => {
    // La validación definitiva del PIN ocurre en el backend al confirmar la venta;
    // aquí solo se habilita la línea para continuar el flujo visual.
    if (!pinAdmin) {
      setErrorPin('Ingresa el PIN del administrador')
      return
    }
    aplicarDescuentoLinea(descuentoPendiente.idProducto, descuentoPendiente.descuentoPorcentaje)
    // El backend valida el PIN al confirmar la venta (POST /ventas); aquí solo se
    // captura para reenviarlo como pin_autorizacion junto con el resto del carrito.
    onPinAutorizado?.(pinAdmin)
    setPinModalAbierto(false)
    setPinAdmin('')
    setErrorPin(null)
    setDescuentoPendiente(null)
  }

  if (lineas.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        El carrito está vacío. Agrega un producto para comenzar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-500 border-b">
            <th className="py-2">Producto</th>
            <th className="py-2">Cant.</th>
            <th className="py-2">Precio</th>
            <th className="py-2">Desc.</th>
            <th className="py-2">Total</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea) => (
            <LineaVenta
              key={linea.idProducto}
              linea={linea}
              onCantidadChange={actualizarCantidad}
              onDescuentoChange={handleDescuentoChange}
              onQuitar={quitarProducto}
            />
          ))}
        </tbody>
      </table>
      <div className="text-right text-xl font-bold text-gray-800">Total: {formatCurrency(total)}</div>

      <Modal isOpen={pinModalAbierto} title="Autorización de descuento" onClose={() => setPinModalAbierto(false)}>
        <p className="text-sm text-gray-600 mb-3">
          El descuento supera el {DESCUENTO_MAXIMO_CAJERO}% permitido. Ingresa el PIN de un administrador para
          autorizarlo.
        </p>
        <Input label="PIN de administrador" type="password" value={pinAdmin} onChange={(e) => setPinAdmin(e.target.value)} />
        <ErrorMessage message={errorPin} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setPinModalAbierto(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmarDescuentoConPin}>Autorizar</Button>
        </div>
      </Modal>
    </div>
  )
}

export default CarritoVenta
