import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RutaPrivada({ children, rolesPermitidos }) {
  const { isAuthenticated, rol } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/ventas" replace />
  }

  return children
}

export default RutaPrivada
