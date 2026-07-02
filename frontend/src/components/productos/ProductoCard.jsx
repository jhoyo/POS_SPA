import Badge from '../common/Badge'
import { formatCurrency } from '../../utils/formatCurrency'

function ProductoCard({ producto, onEditar, onDesactivar }) {
  const stockBajo = producto.stock_actual <= producto.stock_minimo

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-800">{producto.nombre}</h3>
        {stockBajo && <Badge color="amber">Stock bajo</Badge>}
      </div>
      <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
      <p className="text-lg font-bold text-blue-600">{formatCurrency(producto.precio_venta)}</p>
      <p className="text-sm text-gray-600">Stock: {producto.stock_actual}</p>
      <div className="flex gap-3 mt-2">
        <button className="text-sm text-blue-600 hover:underline" onClick={() => onEditar(producto)}>
          Editar
        </button>
        <button className="text-sm text-red-600 hover:underline" onClick={() => onDesactivar(producto)}>
          Desactivar
        </button>
      </div>
    </div>
  )
}

export default ProductoCard
