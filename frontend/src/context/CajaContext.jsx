import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as cajaApi from '../services/api/caja.api'
import { useAuth } from './AuthContext'

const CajaContext = createContext(null)

export function CajaProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [apertura, setApertura] = useState(null)
  const [cargandoCaja, setCargandoCaja] = useState(false)

  const consultarAperturaActual = useCallback(async () => {
    setCargandoCaja(true)
    try {
      const data = await cajaApi.obtenerAperturaActual()
      setApertura(data)
    } catch {
      // No hay apertura activa para el cajero autenticado
      setApertura(null)
    } finally {
      setCargandoCaja(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      consultarAperturaActual()
    } else {
      setApertura(null)
    }
  }, [isAuthenticated, consultarAperturaActual])

  const abrirCaja = useCallback(async (fondoInicial, pinAdmin) => {
    const data = await cajaApi.abrirCaja(fondoInicial, pinAdmin)
    setApertura(data)
    return data
  }, [])

  const cerrarCajaLocal = useCallback(() => {
    setApertura(null)
  }, [])

  const value = {
    apertura,
    cajaAbierta: !!apertura,
    cargandoCaja,
    abrirCaja,
    cerrarCajaLocal,
    consultarAperturaActual
  }

  return <CajaContext.Provider value={value}>{children}</CajaContext.Provider>
}

export function useCaja() {
  const context = useContext(CajaContext)
  if (!context) {
    throw new Error('useCaja debe usarse dentro de un CajaProvider')
  }
  return context
}
