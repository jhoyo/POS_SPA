# POS Spa Facial

Sistema de Punto de Venta (POS) para spas faciales: gestión de ventas, catálogo de
productos, control de inventario y corte de caja diario. Permite al personal registrar
ventas rápidas, mantener el stock actualizado y cerrar la caja al final de cada turno.

Ver la especificación funcional completa en [spec.md](spec.md) (historias de usuario,
reglas de negocio y restricciones técnicas) y el plan de arquitectura en [plan.md](plan.md).

## Actores del sistema

| Actor | Rol |
|---|---|
| **Cajero** | Registra ventas, aplica descuentos autorizados, abre/cierra caja. |
| **Esteticista** | Consulta disponibilidad de productos; no vende. |
| **Administrador** | Catálogo, precios, usuarios, inventario, reportes y auditoría. |

## Estado actual del proyecto

Implementado y funcional: **autenticación**, **catálogo de productos**, **punto de
venta (carrito y cobro)**, **inventario** (entradas, ajustes, alertas de stock bajo) y
**corte de caja** (X y Z). El módulo de **reportes** (HU-16 del spec) todavía no está
implementado ni en backend ni en frontend.

---

## Tecnologías usadas

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite, React Router, TanStack Query, Axios, Tailwind CSS |
| Backend | Node.js + Express (ES modules) |
| Base de datos | Supabase (PostgreSQL), vía `@supabase/supabase-js` con `service_role key` |
| Autenticación | JWT (`jsonwebtoken`) + PIN con hash `bcrypt`/`bcryptjs` |
| Validación | Zod |
| Documentación de API | OpenAPI 3.0 + `swagger-ui-express` |
| Pruebas (backend) | Jest + Babel (`@babel/preset-env`, `babel-jest`) |
| Seguridad HTTP | `helmet`, `cors` |

---

## Estructura de carpetas

```
pos/
├── spec.md                  # Especificación funcional (historias de usuario, reglas de negocio)
├── plan.md                  # Arquitectura, stack y convenciones de nombres
├── schema.sql                # Esquema de la base de datos (tablas, ENUMs, vistas)
├── modelo_datos.md           # Modelo de datos en prosa
├── er_diagram.svg            # Diagrama entidad-relación
├── tasks.md                  # Tareas de construcción del backend
├── tasks-frontend.md         # Tareas de construcción del frontend
├── skill-ith-backend.md      # Convenciones de código y de respuesta de la API
│
├── backend/
│   ├── src/
│   │   ├── app.js                    # Configuración de Express (middlewares, rutas, swagger)
│   │   ├── server.js                 # Punto de entrada
│   │   ├── config/                   # env.js, supabaseClient.js
│   │   ├── routes/                   # auth, usuarios, categorias, productos, ventas,
│   │   │                             # inventario, caja, auditoria
│   │   ├── controllers/              # Un controlador por recurso
│   │   ├── services/                 # Lógica de negocio
│   │   ├── repositories/             # Única capa que consulta Supabase
│   │   ├── middlewares/              # auth, role, validate, errorHandler
│   │   ├── validators/                # Esquemas Zod por recurso
│   │   ├── utils/                    # folio, IVA, password, tokens
│   │   └── docs/
│   │       └── openapi.js            # Spec OpenAPI 3.0 servido en /api-docs
│   ├── sql/
│   │   └── functions.sql             # Funciones y tablas auxiliares (ejecutar tras schema.sql)
│   ├── __tests__/                    # Pruebas Jest (mockean los repositorios)
│   ├── babel.config.js
│   ├── jest.config.js
│   └── package.json
│
└── frontend/
    └── src/
        ├── main.jsx / App.jsx
        ├── pages/                    # LoginPage, VentasPage, ProductosPage,
        │                             # InventarioPage, CajaPage, NotFoundPage
        ├── components/
        │   ├── common/                # Button, Input, Modal, Layout, ErrorBoundary...
        │   ├── productos/, ventas/, inventario/, caja/
        ├── context/                  # AuthContext, CajaContext
        ├── hooks/                    # useCarrito, useSesionInactividad
        ├── routes/                   # AppRouter, RutaPrivada
        ├── services/api/             # Un cliente por recurso (Axios)
        └── utils/                    # formatCurrency, formatDate
```

---

## Requisitos previos

- Node.js 18 o superior
- Una cuenta y un proyecto en [Supabase](https://supabase.com)

---

## Instalación

### 1. Base de datos (Supabase)

En el **SQL Editor** de tu proyecto de Supabase, ejecuta en este orden:

1. [schema.sql](schema.sql) — crea las tablas, tipos `ENUM` y vistas (`v_stock_bajo`, `v_ticket`, etc.), y siembra un usuario `admin` inicial (hay que asignarle un PIN real con hash bcrypt antes de poder iniciar sesión; no queda utilizable con el valor placeholder del `INSERT` del script).
2. [backend/sql/functions.sql](backend/sql/functions.sql) — crea la tabla `sesiones`, el contador de folios y las funciones Postgres (`fn_crear_venta`, `fn_cancelar_venta`, `fn_registrar_movimiento_inventario`) que hacen atómicas las operaciones de venta e inventario.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # completa los valores (ver "Variables de entorno" abajo)
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # ajusta VITE_API_URL si tu backend no corre en localhost:3000
```

---

## Variables de entorno

### `backend/.env`

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key de Supabase (nunca la `anon key`; nunca en el frontend) |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens de sesión |
| `PORT` | No (default `3000`) | Puerto del servidor Express |
| `FRONTEND_ORIGIN` | No (default `*`) | Origen permitido por CORS, ej. `http://localhost:5173` |
| `BCRYPT_SALT_ROUNDS` | No (default `10`) | Costo del hash de PIN |
| `JWT_EXPIRACION` | No (default `12h`) | Vigencia del token, ej. `12h` |

El servidor **falla al arrancar** con un error explícito si falta `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` o `JWT_SECRET` (ver `src/config/env.js`).

### `frontend/.env`

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_URL` | Sí | URL base de la API, ej. `http://localhost:3000/api/v1` |

---

## Cómo correr el proyecto en desarrollo

Backend y frontend se levantan por separado, en dos terminales:

```bash
# Terminal 1 — backend (recarga automática con node --watch)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (Vite)
cd frontend
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3000/api/v1**
- Health check: **http://localhost:3000/health**
- Documentación interactiva de la API (Swagger UI): **http://localhost:3000/api-docs**
  (JSON crudo del spec en `/api-docs.json`)

### Pruebas (backend)

```bash
cd backend
npm test              # corre las suites de __tests__/ con Jest
npm run test:coverage # con reporte de cobertura
```

---

## Convenciones del proyecto

Ver [skill-ith-backend.md](skill-ith-backend.md) para el detalle completo. En resumen:

- Variables y funciones en inglés (`camelCase`); comentarios en español.
- Archivos en inglés, minúsculas, con guiones (`product-routes.js`).
- Toda respuesta de la API sigue el mismo contrato: éxito `{ success: true, data }`,
  error `{ success: false, error: "mensaje" }` — nunca se exponen detalles técnicos
  internos al cliente.
- Capas del backend en cadena estricta: `routes → controllers → services → repositories`.
