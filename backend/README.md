# Backend — Sistema POS Spa Facial

## Instalación

1. Copia estos archivos sobre la carpeta `backend/` de tu proyecto existente.
2. Instala dependencias:
   ```
   cd backend
   npm install
   ```
3. Copia `.env.example` a `.env` y completa los valores:
   ```
   cp .env.example .env
   ```
4. En el SQL Editor de Supabase, ejecuta primero tu `schema.sql` (si aún no lo has hecho) y
   después `sql/functions.sql`, incluido en este paquete. Ese archivo crea:
   - La tabla `sesiones` (necesaria para `logout` y expiración de sesión por inactividad).
   - La tabla `contadores` y la función `fn_generar_folio` (folios consecutivos sin colisiones).
   - Las funciones `fn_crear_venta`, `fn_cancelar_venta` y `fn_registrar_movimiento_inventario`,
     que garantizan que las operaciones de venta/inventario sean atómicas (todo o nada).

   Este backend asume que tu `schema.sql` ya incluye una fila en la tabla `configuracion` con las
   columnas `bloqueo_minutos`, `inactividad_minutos`, `descuento_maximo_cajero` e `iva_rate`. Si no
   existe ninguna fila, el sistema usa valores por defecto (15 min de bloqueo, 15 min de
   inactividad, 10% de descuento máximo, 16% de IVA).

5. Levanta el servidor:
   ```
   npm run dev
   ```
   `GET /health` debe responder `{ "status": "ok" }`.

## Estructura

```
src/
  config/        cliente de Supabase y variables de entorno
  middlewares/    auth, autorización por rol, validación, manejo de errores
  validators/     esquemas Zod por módulo
  repositories/   acceso a datos (Supabase)
  services/       lógica de negocio
  controllers/    capa HTTP
  routes/         definición de endpoints
```

## Endpoints principales

| Método | Ruta | Rol requerido |
|---|---|---|
| POST | /api/v1/auth/login | público |
| POST | /api/v1/auth/logout | autenticado |
| GET/POST/PUT/DELETE | /api/v1/usuarios | administrador |
| GET/POST | /api/v1/categorias | autenticado / administrador |
| GET/POST/PUT/DELETE | /api/v1/productos | autenticado / administrador |
| GET/POST | /api/v1/ventas | autenticado |
| POST | /api/v1/ventas/:id/cancelar | cajero o administrador (requiere PIN admin) |
| POST | /api/v1/ventas/:id/reimprimir | autenticado |
| POST | /api/v1/inventario/entradas | administrador o cajero |
| POST | /api/v1/inventario/ajustes | administrador |
| GET | /api/v1/inventario/stock-bajo | autenticado |
| POST | /api/v1/caja/apertura | cajero o administrador |
| GET | /api/v1/caja/corte-x | cajero o administrador |
| POST | /api/v1/caja/corte-z | cajero o administrador |
| GET | /api/v1/auditoria | administrador |

Todas las respuestas siguen el formato:
- Éxito: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": "Mensaje descriptivo" }`
