import { useEffect, useRef, useState, useCallback } from 'react'

const EVENTOS_ACTIVIDAD = ['mousemove', 'keydown', 'click', 'touchstart']

export function useSesionInactividad(minutos = 10) {
  const [bloqueado, setBloqueado] = useState(false)
  const timeoutRef = useRef(null)

  const reiniciarTemporizador = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setBloqueado(true), minutos * 60 * 1000)
  }, [minutos])

  const reanudar = useCallback(() => {
    setBloqueado(false)
    reiniciarTemporizador()
  }, [reiniciarTemporizador])

  useEffect(() => {
    reiniciarTemporizador()
    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador))
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador))
    }
  }, [reiniciarTemporizador])

  return { bloqueado, reanudar }
}
