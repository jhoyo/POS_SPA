import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

// `filas` es el arreglo que devuelve GET /ventas/:id (vista v_ticket de Postgres):
// una fila por línea de detalle_venta, todas repitiendo los datos de cabecera de la venta.
function Ticket({ filas, pagos, reimpresion }) {
  if (!filas || filas.length === 0) return null

  const cabecera = filas[0]

  return (
    <div className="bg-white border border-dashed border-gray-400 rounded-lg p-6 max-w-sm mx-auto font-mono text-sm">
      {reimpresion && <p className="text-center font-bold text-red-600 mb-2">REIMPRESIÓN</p>}
      <p className="text-center font-bold">Spa Facial</p>
      <p className="text-center text-xs text-gray-500 mb-3">
        Folio: {cabecera.folio} · {formatDate(cabecera.fecha_hora)} · Cajero: {cabecera.cajero}
      </p>
      <hr className="my-2" />
      {filas.map((fila) => (
        <div key={fila.id_detalle} className="flex justify-between">
          <span>
            {fila.cantidad} x {fila.nombre_producto}
          </span>
          <span>{formatCurrency(fila.subtotal_linea + fila.iva_linea)}</span>
        </div>
      ))}
      <hr className="my-2" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(cabecera.subtotal_venta)}</span>
      </div>
      <div className="flex justify-between">
        <span>IVA</span>
        <span>{formatCurrency(cabecera.iva_venta)}</span>
      </div>
      {cabecera.descuento_total > 0 && (
        <div className="flex justify-between">
          <span>Descuento</span>
          <span>-{formatCurrency(cabecera.descuento_total)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>{formatCurrency(cabecera.total)}</span>
      </div>
      <hr className="my-2" />
      {pagos?.map((pago, index) => (
        <div key={index} className="flex justify-between">
          <span>{pago.forma_pago}</span>
          <span>{formatCurrency(pago.monto)}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span>Cambio</span>
        <span>{formatCurrency(cabecera.cambio)}</span>
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">¡Gracias por su compra!</p>
    </div>
  )
}

export default Ticket
