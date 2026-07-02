import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Adjunta el token de sesión a cada petición saliente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normaliza el contrato del backend: { success: true, data } / { success: false, error }
// (convención definida en skill-ith-backend.md), para que el resto de la app
// solo trabaje con datos limpios o con un Error legible en español.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body.success === 'boolean') {
      if (body.success) {
        return body.data
      }
      return Promise.reject(new Error(body.error || 'Ocurrió un error inesperado'))
    }
    return body
  },
  (error) => {
    const mensajeBackend = error.response?.data?.error
    const mensaje = mensajeBackend || 'No se pudo conectar con el servidor. Intenta de nuevo.'
    return Promise.reject(new Error(mensaje))
  }
)

export default apiClient
