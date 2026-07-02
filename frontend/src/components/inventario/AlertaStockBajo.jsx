import { useQuery } from '@tanstack/react-query'
import Badge from '../common/Badge'
import * as inventarioApi from '../../services/api/inventario.api'

function AlertaStockBajo() {
  const { data: productos = [] } = useQuery({
    queryKey: ['stock-bajo'],
    queryFn: () => inventarioApi.obtenerStockBajo(),
    refetchInterval: 60000
  })

  if (productos.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge color="amber">Stock bajo</Badge>
        <span className="text-sm font-semibold text-amber-800">
          {productos.length} producto(s) por debajo del stock mínimo
        </span>
      </div>
      <ul className="text-sm text-amber-800 flex flex-col gap-1">
        {productos.map((producto) => (
          <li key={producto.id_producto} className="flex justify-between">
            <span>
              {producto.nombre} ({producto.sku})
            </span>
            <span>
              Stock actual: {producto.stock_actual} / mínimo: {producto.stock_minimo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AlertaStockBajo
