import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import VentasPage from '../pages/VentasPage'
import ProductosPage from '../pages/ProductosPage'
import InventarioPage from '../pages/InventarioPage'
import CajaPage from '../pages/CajaPage'
import NotFoundPage from '../pages/NotFoundPage'
import RutaPrivada from './RutaPrivada'

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/ventas"
        element={
          <RutaPrivada rolesPermitidos={['cajero', 'administrador']}>
            <VentasPage />
          </RutaPrivada>
        }
      />
      <Route
        path="/productos"
        element={
          <RutaPrivada rolesPermitidos={['administrador']}>
            <ProductosPage />
          </RutaPrivada>
        }
      />
      <Route
        path="/inventario"
        element={
          <RutaPrivada rolesPermitidos={['cajero', 'administrador']}>
            <InventarioPage />
          </RutaPrivada>
        }
      />
      <Route
        path="/caja"
        element={
          <RutaPrivada rolesPermitidos={['cajero', 'administrador']}>
            <CajaPage />
          </RutaPrivada>
        }
      />
      <Route path="/" element={<Navigate to="/ventas" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
