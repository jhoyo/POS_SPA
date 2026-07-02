# Plan de Implementación — Sistema POS Spa Facial

**Versión:** 1.0
**Fecha:** 2026-06-30
**Basado en:** [spec.md](spec.md), [modelo_datos.md](modelo_datos.md), [schema.sql](schema.sql)
**Estado:** Borrador — no incluye código, solo arquitectura y convenciones

---

## 1. Objetivo del Documento

Definir el stack tecnológico, la organización de carpetas y las convenciones de nombres que seguirá la implementación del sistema, de forma que cualquier desarrollador (o agente) pueda generar código consistente sin necesidad de relitigar decisiones de estructura en cada módulo.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| Frontend | **React 18 + Vite** | SPA del punto de venta, operable con teclado/touch (restricción 5.4 del spec) |
| Backend | **Node.js + Express** | API REST que centraliza la lógica de negocio (folios, IVA, descuentos, corte de caja) |
| Base de datos | **Supabase (PostgreSQL)** | Persistencia; usa el esquema de [schema.sql](schema.sql) ya adaptado a Postgres |
| Autenticación | **Supabase Auth** (sesión) + PIN propio en `usuarios.pin_hash` | Doble capa: sesión de app + PIN rápido por turno (HU-01) |
| Cliente DB | **@supabase/supabase-js** | Usado solo en el backend con `service_role` key; el frontend nunca toca la BD directo |
| Validación | **Zod** | Validación de payloads en controladores/middlewares |
| HTTP cliente (frontend) | **Axios** | Consumo de la API propia |
| Estado de servidor (frontend) | **TanStack Query** | Cache, reintentos y sincronización de datos de ventas/inventario |
| Estilos | **Tailwind CSS** | Velocidad de maquetado; soporta touch-friendly UI |
| Impresión de tickets | **node-thermal-printer** (backend) | Compatibilidad con impresoras térmicas 58/80 mm (restricción 5.1) |
| Pruebas backend | **Vitest + Supertest** | Pruebas unitarias e integración de endpoints |
| Pruebas frontend | **Vitest + React Testing Library** | Pruebas de componentes y flujos de venta |
| Lint/formato | **ESLint + Prettier** | Consistencia de estilo en ambos paquetes |
| Gestión de monorepo | **npm workspaces** | Backend y frontend en un solo repositorio, dependencias compartidas mínimas |

### Justificación de decisiones clave

- **Express como capa intermedia, no acceso directo del frontend a Supabase:** la lógica de negocio (folio consecutivo, cálculo de IVA, validación de corte Z, límites de descuento) vive en el backend, no en el cliente, para que las reglas de negocio (sección 6 del spec) no dependan de que el frontend las respete.
- **Supabase Postgres aprovecha el trabajo ya hecho:** `schema.sql` ya está listo con tipos `ENUM`, `CITEXT` y `NUMERIC(12,2)`; se ejecuta tal cual en el proyecto de Supabase.
- **PIN propio + Supabase Auth:** Supabase Auth maneja la sesión de la app (token JWT), pero el PIN de 4 dígitos (HU-01) se valida aparte en cada operación sensible, igual que en un POS físico.

---

## 3. Arquitectura General

```
┌─────────────────┐        HTTPS / REST        ┌──────────────────┐        ┌─────────────────┐
│   React + Vite   │ ───────────────────────▶  │  Express API      │ ─────▶ │ Supabase         │
│  (SPA, navegador) │ ◀───────────────────────  │  (Node.js)         │ ◀───── │ (PostgreSQL +    │
└─────────────────┘        JSON                └──────────────────┘        │  Auth + Storage) │
                                                                            └─────────────────┘
```

- El frontend nunca usa la `service_role key` de Supabase; solo conoce la URL del backend.
- El backend usa la `service_role key` para operaciones de servidor y aplica sus propias reglas antes de tocar la base de datos.
- Impresión de tickets ocurre en el backend (o en un servicio local conectado a la impresora) para no depender de drivers en el navegador.

---

## 4. Estructura de Carpetas — Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                  # carga y valida variables de entorno
│   │   ├── supabaseClient.js       # cliente Supabase con service_role key
│   │   └── constants.js            # IVA, límites de descuento, etc. (espejo de tabla configuracion)
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── productos.routes.js
│   │   ├── categorias.routes.js
│   │   ├── ventas.routes.js
│   │   ├── inventario.routes.js
│   │   ├── caja.routes.js
│   │   ├── reportes.routes.js
│   │   └── index.js                # registra todas las rutas bajo /api/v1
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── productos.controller.js
│   │   ├── ventas.controller.js
│   │   ├── inventario.controller.js
│   │   ├── caja.controller.js
│   │   └── reportes.controller.js
│   │
│   ├── services/                   # lógica de negocio (HU-06, HU-08, HU-13..16, RN-01..08)
│   │   ├── auth.service.js
│   │   ├── productos.service.js
│   │   ├── ventas.service.js
│   │   ├── inventario.service.js
│   │   ├── caja.service.js
│   │   └── reportes.service.js
│   │
│   ├── repositories/                # única capa que ejecuta queries a Supabase
│   │   ├── usuarios.repository.js
│   │   ├── productos.repository.js
│   │   ├── ventas.repository.js
│   │   ├── inventario.repository.js
│   │   └── caja.repository.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js       # valida JWT de Supabase
│   │   ├── role.middleware.js       # restringe por rol (administrador/cajero/esteticista)
│   │   ├── validate.middleware.js   # aplica esquemas Zod a req.body
│   │   └── errorHandler.middleware.js
│   │
│   ├── validators/                  # esquemas Zod, uno por recurso
│   │   ├── producto.schema.js
│   │   ├── venta.schema.js
│   │   ├── inventario.schema.js
│   │   └── caja.schema.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── folio.util.js            # generador de folio consecutivo (RN-08)
│   │   ├── iva.util.js              # cálculo/desglose de IVA (RN-01)
│   │   └── currency.util.js
│   │
│   ├── app.js                       # configuración de Express (middlewares globales, cors)
│   └── server.js                    # punto de entrada, levanta el servidor
│
├── tests/
│   ├── unit/
│   │   └── services/
│   └── integration/
│       └── routes/
│
├── .env.example
├── package.json
└── README.md
```

**Regla de capas:** `routes` → `controllers` → `services` → `repositories` → Supabase. Un controlador nunca llama directamente a un repositorio; un servicio nunca arma respuestas HTTP.

---

## 5. Estructura de Carpetas — Frontend

```
frontend/
├── public/
│
├── src/
│   ├── assets/                      # logos, íconos, imágenes
│   │
│   ├── components/                  # componentes reutilizables, organizados por dominio
│   │   ├── common/                  # Button, Modal, Input, Badge, Spinner
│   │   ├── productos/               # ProductoCard, ProductoForm, BuscadorProducto
│   │   ├── ventas/                  # CarritoVenta, LineaVenta, PanelPago
│   │   ├── inventario/              # TablaMovimientos, AlertaStockBajo
│   │   └── caja/                    # ResumenCorteX, FormCorteZ
│   │
│   ├── pages/                       # una página por ruta principal
│   │   ├── LoginPage.jsx
│   │   ├── VentasPage.jsx
│   │   ├── ProductosPage.jsx
│   │   ├── InventarioPage.jsx
│   │   ├── CajaPage.jsx
│   │   └── ReportesPage.jsx
│   │
│   ├── hooks/                       # hooks custom (useCarrito, useSesionInactividad)
│   │
│   ├── context/                     # AuthContext, CajaContext (sesión y turno abiertos)
│   │
│   ├── services/
│   │   └── api/                     # un archivo por recurso, todos usan apiClient
│   │       ├── apiClient.js         # instancia Axios con baseURL + interceptores
│   │       ├── auth.api.js
│   │       ├── productos.api.js
│   │       ├── ventas.api.js
│   │       ├── inventario.api.js
│   │       └── caja.api.js
│   │
│   ├── routes/
│   │   ├── AppRouter.jsx
│   │   └── RutaPrivada.jsx          # protege rutas según rol (HU-01)
│   │
│   ├── utils/
│   │   ├── formatCurrency.js        # formato $X,XXX.XX MXN (restricción 5.4)
│   │   └── formatDate.js            # formato DD/MM/AAAA
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                    # Tailwind entrypoint
│
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 6. Convenciones de Nombres

### 6.1 Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Carpetas | `kebab-case`, sustantivo plural | `productos/`, `movimientos-inventario/` |
| Componentes React | `PascalCase.jsx` | `CarritoVenta.jsx`, `FormCorteZ.jsx` |
| Hooks | `camelCase` con prefijo `use` | `useCarrito.js`, `useSesionInactividad.js` |
| Servicios backend | `camelCase` + sufijo de capa | `ventas.service.js`, `ventas.repository.js` |
| Rutas backend | `camelCase` + `.routes.js` | `ventas.routes.js` |
| Esquemas de validación | `camelCase` + `.schema.js` | `venta.schema.js` |
| Utilidades | `camelCase` + `.util.js` | `folio.util.js` |
| Pruebas | mismo nombre del archivo probado + `.test.js` | `ventas.service.test.js` |

### 6.2 Código JavaScript/React

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | `camelCase` | `calcularTotalVenta()`, `stockActual` |
| Componentes y clases | `PascalCase` | `function CarritoVenta()` |
| Constantes globales/config | `UPPER_SNAKE_CASE` | `IVA_PORCENTAJE`, `DESCUENTO_MAXIMO_CAJERO` |
| Booleanos | prefijo `is`/`tiene`/`puede` | `isVentaCancelada`, `tieneDescuento` |
| Manejadores de eventos | prefijo `handle` o `on` | `handleConfirmarPago`, `onAgregarProducto` |
| Props de componentes | `camelCase` | `<CarritoVenta productos={productos} />` |

### 6.3 Base de datos (ya establecido en schema.sql)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case`, plural | `detalle_venta`, `movimientos_inventario` |
| Columnas | `snake_case` | `precio_venta`, `fecha_cancelacion` |
| Llaves primarias | `id_<entidad_singular>` | `id_producto`, `id_venta` |
| Llaves foráneas | mismo nombre que la PK referenciada | `id_producto` en `detalle_venta` |
| Tipos ENUM | `snake_case` + sufijo descriptivo | `rol_usuario`, `estado_venta` |
| Índices | `idx_<tabla>_<columna>` | `idx_ventas_folio` |
| Vistas | prefijo `v_` | `v_resumen_turno` |

### 6.4 API REST

| Elemento | Convención | Ejemplo |
|---|---|---|
| Base path | `/api/v1` | `/api/v1/ventas` |
| Recursos | `kebab-case`, plural, sustantivo | `/api/v1/productos`, `/api/v1/corte-caja` |
| Acciones no-CRUD | verbo en sub-recurso | `POST /api/v1/ventas/:id/cancelar` |
| Query params de filtro | `snake_case` | `?fecha_inicio=2026-06-01&id_cajero=3` |
| Respuestas de error | objeto `{ error: { codigo, mensaje } }` | `{ error: { codigo: "STOCK_INSUFICIENTE", mensaje: "..." } }` |

### 6.5 Variables de entorno

| Convención | Ejemplo |
|---|---|
| `UPPER_SNAKE_CASE`, prefijadas por servicio | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `JWT_SECRET` |
| Frontend (Vite) con prefijo obligatorio | `VITE_API_BASE_URL` |

### 6.6 Git

| Elemento | Convención | Ejemplo |
|---|---|---|
| Ramas | `tipo/descripcion-kebab-case` | `feature/corte-caja-z`, `fix/calculo-iva` |
| Commits | [Conventional Commits](https://www.conventionalcommits.org/) | `feat: agregar endpoint de corte Z`, `fix: corrige redondeo de IVA` |

---

## 7. Variables de Entorno Esperadas

**Backend (`.env`):**
```
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NODE_ENV=development
```

**Frontend (`.env`):**
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 8. Próximos Pasos

1. Inicializar el monorepo (`npm init -w backend -w frontend`) y configurar ESLint/Prettier compartidos.
2. Crear el proyecto en Supabase y ejecutar [schema.sql](schema.sql).
3. Implementar el backend en orden de dependencia: `usuarios` → `productos`/`categorias` → `apertura_caja` → `ventas`/`detalle_venta`/`pagos_venta` → `corte_caja` → `movimientos_inventario` → `reportes`.
4. Implementar el frontend en paralelo a cada endpoint disponible, siguiendo las HU del spec como criterio de "hecho".

---

*Fin del documento — v1.0*
