import { useState } from 'react'
import Layout from '../components/common/Layout'
import BuscadorProducto from '../components/productos/BuscadorProducto'
import CarritoVenta from '../components/ventas/CarritoVenta'
import PanelPago from '../components/ventas/PanelPago'
import Ticket from '../components/ventas/Ticket'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import Spinner from '../components/common/Spinner'
import { useCarrito } from '../hooks/useCarrito'
import { useCaja } from '../context/CajaContext'
import * as ventasApi from '../services/api/ventas.api'

function VentasPage() {
  const carrito = useCarrito()
  const { cajaAbierta, cargandoCaja } = useCaja()
  const [ventaConfirmada, setVentaConfirmada] = useState(null)
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false)
  const [pinAutorizacion, setPinAutorizacion] = useState('')
  const [error, setError] = useState(null)

  const handleConfirmarPago = async (pagos) => {
    setError(null)
    try {
      // El backend (validators/sale-schema.js) espera `carrito`, con `descuento`
      // como monto en pesos por línea, no el porcentaje que maneja la UI.
      const payload = {
        carrito: carrito.lineas.map((l) => ({
          id_producto: l.idProducto,
          cantidad: l.cantidad,
          descuento: Math.round(l.precioUnitario * l.cantidad * (l.descuentoPorcentaje / 100) * 100) / 100
        })),
        pagos,
        descuento_general: 0,
        pin_autorizacion: pinAutorizacion || undefined
      }
      const resultado = await ventasApi.crearVenta(payload)
      // GET /ventas/:id (vista v_ticket) trae los renglones con nombre/cantidad/precio
      // para imprimir; la respuesta de POST /ventas no incluye esos datos.
      const filas = await ventasApi.obtenerVenta(resultado.id)
      setVentaConfirmada({ filas, pagos: resultado.pagos })
      carrito.vaciarCarrito()
      setPinAutorizacion('')
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const handleCancelarVenta = () => {
    carrito.vaciarCarrito()
    setModalCancelarAbierto(false)
  }

  if (cargandoCaja) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    )
  }

  if (!cajaAbierta) {
    return (
      <Layout>
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-700 font-medium">Debe registrar el fondo para abrir una nueva caja</p>
          <a href="/caja" className="text-blue-600 hover:underline block mt-2">
            Ir a apertura de caja
          </a>
        </div>
      </Layout>
    )
  }

  if (ventaConfirmada) {
    return (
      <Layout>
        <Ticket filas={ventaConfirmada.filas} pagos={ventaConfirmada.pagos} />
        <div className="text-center mt-4">
          <Button onClick={() => setVentaConfirmada(null)}>Nueva venta</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <BuscadorProducto onSeleccionar={(producto) => carrito.agregarProducto(producto)} />
          <ErrorMessage message={error} />
          <CarritoVenta carrito={carrito} onPinAutorizado={setPinAutorizacion} />
          {carrito.lineas.length > 0 && (
            <Button variant="secondary" onClick={() => setModalCancelarAbierto(true)}>
              Cancelar venta
            </Button>
          )}
        </div>
        <div>
          <PanelPago total={carrito.total} disabled={carrito.lineas.length === 0} onConfirmarPago={handleConfirmarPago} />
        </div>
      </div>

      <Modal isOpen={modalCancelarAbierto} title="Cancelar venta" onClose={() => setModalCancelarAbierto(false)}>
        <p className="text-gray-600 mb-4">
          ¿Seguro que deseas cancelar esta venta? El carrito se vaciará y no se registrará ningún movimiento en
          inventario ni en caja.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalCancelarAbierto(false)}>
            Volver
          </Button>
          <Button variant="danger" onClick={handleCancelarVenta}>
            Sí, cancelar
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}

export default VentasPage
