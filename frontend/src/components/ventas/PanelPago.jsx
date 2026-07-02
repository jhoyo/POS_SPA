import { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import { formatCurrency } from '../../utils/formatCurrency'

const FORMAS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' }
]

function PanelPago({ total, disabled, onConfirmarPago }) {
  const [pagos, setPagos] = useState([{ forma_pago: 'efectivo', monto: '' }])
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [cambio, setCambio] = useState(null)

  const sumaPagos = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)

  const handleAgregarPago = () => {
    setPagos((prev) => [...prev, { forma_pago: 'tarjeta', monto: '' }])
  }

  const handlePagoChange = (index, campo, valor) => {
    setPagos((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)))
  }

  const handleQuitarPago = (index) => {
    setPagos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirmar = async () => {
    setError(null)
    setCambio(null)
    if (sumaPagos < total) {
      const faltante = (total - sumaPagos).toFixed(2)
      setError(`Monto insuficiente. Falta $${faltante}`)
      return
    }
    setProcesando(true)
    try {
      await onConfirmarPago(pagos.map((p) => ({ forma_pago: p.forma_pago, monto: Number(p.monto) })))
      setCambio(sumaPagos - total)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-gray-800">Cobro</h3>
      <p className="text-lg font-bold text-blue-600">Total: {formatCurrency(total)}</p>

      {pagos.map((pago, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">Forma de pago</label>
            <select
              className="min-h-[44px] border border-gray-300 rounded-lg px-3"
              value={pago.forma_pago}
              onChange={(e) => handlePagoChange(index, 'forma_pago', e.target.value)}
              disabled={disabled}
            >
              {FORMAS_PAGO.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Monto"
            type="number"
            step="0.01"
            value={pago.monto}
            onChange={(e) => handlePagoChange(index, 'monto', e.target.value)}
            disabled={disabled}
          />
          {pagos.length > 1 && (
            <Button variant="secondary" type="button" onClick={() => handleQuitarPago(index)}>
              Quitar
            </Button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="text-sm text-blue-600 hover:underline text-left"
        onClick={handleAgregarPago}
        disabled={disabled}
      >
        + Agregar otra forma de pago (pago mixto)
      </button>

      <ErrorMessage message={error} />

      {cambio !== null && <p className="text-green-700 font-semibold">Cambio: {formatCurrency(cambio)}</p>}

      <Button onClick={handleConfirmar} disabled={disabled || procesando}>
        Confirmar pago
      </Button>
    </div>
  )
}

export default PanelPago
