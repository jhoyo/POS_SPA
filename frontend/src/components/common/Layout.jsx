import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'

function Layout({ children }) {
  const { usuario, rol, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const handleCerrarSesion = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <nav className="flex gap-4 items-center">
          <span className="font-bold text-blue-600">POS Spa Facial</span>
          <Link to="/ventas" className="text-gray-600 hover:text-blue-600">
            Ventas
          </Link>
          {rol === 'administrador' && (
            <Link to="/productos" className="text-gray-600 hover:text-blue-600">
              Productos
            </Link>
          )}
          <Link to="/inventario" className="text-gray-600 hover:text-blue-600">
            Inventario
          </Link>
          <Link to="/caja" className="text-gray-600 hover:text-blue-600">
            Caja
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {usuario?.nombre} · {rol}
          </span>
          <Button variant="secondary" onClick={handleCerrarSesion}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}

export default Layout
