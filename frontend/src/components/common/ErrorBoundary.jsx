import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Se registra solo en consola; el usuario final nunca ve el detalle técnico
    console.error('Error no controlado en la aplicación:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center px-6">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Ocurrió un problema inesperado</h1>
            <p className="text-gray-600 mb-4">
              Intenta recargar la página. Si el problema continúa, contacta al administrador.
            </p>
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-lg min-h-[44px]"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
