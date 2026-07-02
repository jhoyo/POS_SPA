import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as inventarioApi from '../../services/api/inventario.api'
import { formatDate } from '../../utils/formatDate'
import Spinner from '../common/Spinner'

const TIPOS_FILTRO = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'entrada', etiqueta: 'Entradas' },
  { valor: 'ajuste_positivo', etiqueta: 'Ajustes positivos' },
  { valor: 'ajuste_negativo', etiqueta: 'Ajustes negativos' }
]

function TablaMovimientos() {
  const [tipo, setTipo] = useState('')

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['movimientos-inventario', tipo],
    queryFn: () => inventarioApi.listarMovimientos(tipo ? { tipo } : {})
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Filtrar por tipo</label>
        <select
          className="min-h-[44px] border border-gray-300 rounded-lg px-3"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {TIPOS_FILTRO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : movimientos.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No hay movimientos para este filtro.</p>
      ) : (
        <table className="w-full text-left bg-white rounded-xl shadow-sm overflow-hidden">
          <thead>
            <tr className="text-sm text-gray-500 border-b">
              <th className="py-2 px-3">Fecha</th>
              <th className="py-2 px-3">Tipo</th>
              <th className="py-2 px-3">Cantidad</th>
              <th className="py-2 px-3">Motivo</th>
              <th className="py-2 px-3">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-2 px-3">{formatDate(mov.fecha_hora)}</td>
                <td className="py-2 px-3">{mov.tipo}</td>
                <td className="py-2 px-3">{mov.cantidad}</td>
                <td className="py-2 px-3">{mov.motivo}</td>
                <td className="py-2 px-3">{mov.nombre_usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TablaMovimientos
