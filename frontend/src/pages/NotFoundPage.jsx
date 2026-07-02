import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-gray-600 mb-4">La ruta que buscas no existe.</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
