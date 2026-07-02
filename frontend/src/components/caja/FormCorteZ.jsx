import { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import { formatCurrency } from '../../utils/formatCurrency'

function FormCorteZ({ onGenerarCorteZ }) {
  const [efectivoDeclarado, setEfectivoDeclarado] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const corte = await onGenerarCorteZ(Number(efectivoDeclarado))
      setResultado(corte)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (resultado) {
    const colorDiferencia = resultado.diferencia === 0 ? 'text-green-700' : 'text-red-600'
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-2 max-w-md">
        <p className="text-center font-bold text-gray-800">Corte Z generado</p>
        <div className="flex justify-between">
          <span>Fondo inicial</span>
          <span>{formatCurrency(resultado.fondo_inicial)}</span>
        </div>
        <div className="flex justify-between">
          <span>Efectivo esperado</span>
          <span>{formatCurrency(resultado.efectivo_esperado)}</span>
        </div>
        <div className="flex justify-between">
          <span>Efectivo declarado</span>
          <span>{formatCurrency(resultado.efectivo_declarado)}</span>
        </div>
        <div className={`flex justify-between font-bold ${colorDiferencia}`}>
          <span>Diferencia</span>
          <span>{formatCurrency(resultado.diferencia)}</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <Input
        label="Efectivo contado"
        type="number"
        step="0.01"
        value={efectivoDeclarado}
        onChange={(e) => setEfectivoDeclarado(e.target.value)}
        required
      />
      <ErrorMessage message={error} />
      <Button type="submit" disabled={guardando}>
        Generar corte Z
      </Button>
    </form>
  )
}

export default FormCorteZ
