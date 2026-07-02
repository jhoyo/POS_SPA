import { formatCurrency } from '../../utils/formatCurrency'

function ResumenCorteX({ resumen }) {
  if (!resumen) return null

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3 max-w-md">
      <p className="text-center font-bold text-amber-600 uppercase tracking-wide">
        CORTE PARCIAL — NO CIERRA CAJA
      </p>
      <div className="flex justify-between">
        <span>Número de transacciones</span>
        <span className="font-semibold">{resumen.num_transacciones}</span>
      </div>
      <div className="flex justify-between">
        <span>Total acumulado</span>
        <span className="font-semibold">{formatCurrency(resumen.total_ventas)}</span>
      </div>
      <hr />
      {Object.entries(resumen.desglose_por_forma_pago || {}).map(([formaPago, monto]) => (
        <div key={formaPago} className="flex justify-between text-sm text-gray-600">
          <span>{formaPago}</span>
          <span>{formatCurrency(monto)}</span>
        </div>
      ))}
    </div>
  )
}

export default ResumenCorteX
