import { formatCurrency } from '../../utils/formatCurrency'

function LineaVenta({ linea, onCantidadChange, onDescuentoChange, onQuitar }) {
  const subtotal = linea.precioUnitario * linea.cantidad
  const descuento = subtotal * (linea.descuentoPorcentaje / 100)
  const totalLinea = subtotal - descuento

  return (
    <tr className="border-b">
      <td className="py-2">{linea.nombre}</td>
      <td className="py-2">
        <input
          type="number"
          min="1"
          className="w-16 border rounded px-2 py-1"
          value={linea.cantidad}
          onChange={(e) => onCantidadChange(linea.idProducto, Number(e.target.value))}
        />
      </td>
      <td className="py-2">{formatCurrency(linea.precioUnitario)}</td>
      <td className="py-2">
        <input
          type="number"
          min="0"
          max="100"
          className="w-16 border rounded px-2 py-1"
          value={linea.descuentoPorcentaje}
          onChange={(e) => onDescuentoChange(linea.idProducto, Number(e.target.value))}
        />
        %
      </td>
      <td className="py-2 font-semibold">{formatCurrency(totalLinea)}</td>
      <td className="py-2">
        <button className="text-red-600 hover:underline" onClick={() => onQuitar(linea.idProducto)}>
          Quitar
        </button>
      </td>
    </tr>
  )
}

export default LineaVenta
