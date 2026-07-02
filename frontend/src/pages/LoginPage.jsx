import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'

const MAX_INTENTOS = 3
const MINUTOS_BLOQUEO = 5

function LoginPage() {
  const { iniciarSesion, loading } = useAuth()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [intentosFallidos, setIntentosFallidos] = useState(0)
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null)

  const bloqueado = bloqueadoHasta !== null && Date.now() < bloqueadoHasta

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (bloqueado) return
    setError(null)
    try {
      const usuarioAutenticado = await iniciarSesion(usuario, pin)
      setIntentosFallidos(0)
      navigate(usuarioAutenticado.rol === 'administrador' ? '/productos' : '/ventas')
    } catch (err) {
      const nuevosIntentos = intentosFallidos + 1
      setIntentosFallidos(nuevosIntentos)
      if (nuevosIntentos >= MAX_INTENTOS) {
        setBloqueadoHasta(Date.now() + MINUTOS_BLOQUEO * 60 * 1000)
        setError('Cuenta bloqueada temporalmente')
      } else {
        setError(err.message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-bold text-center text-blue-600">POS Spa Facial</h1>
        <Input
          label="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          disabled={bloqueado}
          required
        />
        <Input
          label="PIN"
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={bloqueado}
          required
        />
        <ErrorMessage message={error} />
        <Button type="submit" disabled={loading || bloqueado}>
          {bloqueado ? 'Cuenta bloqueada' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

export default LoginPage
