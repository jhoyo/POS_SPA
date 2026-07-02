import { createContext, useContext, useState, useCallback } from 'react'
import * as authApi from '../services/api/auth.api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('pos_usuario')
    return guardado ? JSON.parse(guardado) : null
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const iniciarSesion = useCallback(async (nombreUsuario, pin) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.login(nombreUsuario, pin)
      localStorage.setItem('pos_token', data.token)
      localStorage.setItem('pos_usuario', JSON.stringify(data.usuario))
      setUsuario(data.usuario)
      return data.usuario
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Aunque el logout remoto falle, igual se limpia la sesión local
    } finally {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_usuario')
      setUsuario(null)
    }
  }, [])

  const value = {
    usuario,
    isAuthenticated: !!usuario,
    rol: usuario?.rol ?? null,
    loading,
    error,
    iniciarSesion,
    cerrarSesion
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
