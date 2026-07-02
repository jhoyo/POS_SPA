# POS Spa Facial — Frontend

Frontend en React 18 + Vite para el sistema de punto de venta del spa facial. Implementa los módulos de autenticación, catálogo de productos, punto de venta (carrito y cobro), corte de caja y control de inventario, siguiendo las convenciones de `skill-ith-backend.md` y las tareas descritas en `tasks-frontend.md`.

## Requisitos

- Node.js 18 o superior

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta la URL del backend:

```
VITE_API_URL=http://localhost:3000/api/v1
```

## Desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Módulos incluidos

- **Autenticación** (`src/pages/LoginPage.jsx`, `src/context/AuthContext.jsx`): login con usuario y PIN, bloqueo tras 3 intentos fallidos, sesión por rol (cajero/administrador).
- **Catálogo de productos** (`src/pages/ProductosPage.jsx`): alta, edición, desactivación con confirmación y búsqueda.
- **Punto de venta / carrito** (`src/pages/VentasPage.jsx`): búsqueda y escaneo de productos, carrito con descuentos (con autorización de PIN si exceden el máximo), pago simple/mixto, ticket, cancelación de venta.
- **Corte de caja** (`src/pages/CajaPage.jsx`): apertura de caja, corte X (parcial) y corte Z (cierre definitivo).
- **Nivel de inventario** (`src/pages/InventarioPage.jsx`): registro de entradas de mercancía (cajero/administrador), ajustes de inventario con motivo y confirmación si el stock quedaría en negativo (solo administrador), alerta de stock bajo y tabla de movimientos con filtro por tipo.
- **Manejo de errores**: `src/services/api/apiClient.js` normaliza las respuestas `{ success, data }` / `{ success: false, error }` del backend (convención de `skill-ith-backend.md`); `ErrorMessage.jsx` y `ErrorBoundary.jsx` evitan exponer errores técnicos al usuario final.

## Contrato esperado del backend

Este frontend consume el backend real ubicado en `backend/` (Express + Supabase) bajo `/api/v1`, con el contrato `{ success, data }` / `{ success: false, error }`. Los endpoints de inventario (`/inventario/entradas`, `/inventario/ajustes`, `/inventario/stock-bajo`, `/inventario/movimientos`) están alineados con `backend/src/routes/inventory-routes.js`.
