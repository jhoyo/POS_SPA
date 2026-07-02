import apiClient from './apiClient'

export function login(usuario, pin) {
  return apiClient.post('/auth/login', { usuario, pin })
}

export function logout() {
  return apiClient.post('/auth/logout')
}
