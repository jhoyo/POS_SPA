import { useState } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

function FormAperturaCaja({ onAbrirCaja }) {
  const [fondoInicial, setFondoInicial] = useState('')
  const [pinAdmin, setPinAdmin] = useState('')
  const [requierePin, setRequierePin] = useState(false)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (fondoInicial === '' || Number(fondoInicial) < 0) {
      setError('El fondo inicial debe ser mayor o igual a cero')
      return
    }
    setGuardando(true)
    try {
      await onAbrirCaja(Number(fondoInicial), requierePin ? pinAdmin : undefined)
    } catch (err) {
      // Si ya existe una caja abierta de un turno anterior, el backend responde
      // pidiendo autorización de un administrador (HU-13); se revela el campo de PIN.
      if (err.message?.toLowerCase().includes('administrador')) {
        setRequierePin(true)
      }
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {requierePin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Ya existe una caja abierta de un turno anterior. Ingresa el PIN de un administrador para continuar.
        </div>
      )}
      <Input
        label="Fondo inicial"
        type="number"
        step="0.01"
        value={fondoInicial}
        onChange={(e) => setFondoInicial(e.target.value)}
        required
      />
      {requierePin && (
        <Input
          label="PIN de administrador"
          type="password"
          value={pinAdmin}
          onChange={(e) => setPinAdmin(e.target.value)}
          required
        />
      )}
      <ErrorMessage message={error} />
      <Button type="submit" disabled={guardando}>
        Abrir caja
      </Button>
    </form>
  )
}

export default FormAperturaCaja
