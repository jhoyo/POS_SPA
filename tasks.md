# Tareas de Construcción — Backend Sistema POS Spa Facial

**Versión:** 1.0
**Fecha:** 2026-06-30
**Basado en:** [spec.md](spec.md), [plan.md](plan.md), [schema.sql](schema.sql)
**Alcance:** Solo backend (Node.js + Express + Supabase). El frontend se cubre en un `tasks.md` separado.

---

## Cómo usar este documento

- Cada tarea tiene un **ID** (`B<fase>.<n>`), los **archivos** que toca (rutas relativas a `backend/`) y un **criterio de terminado** verificable sin ambigüedad.
- Las tareas están ordenadas por dependencia: no empieces una fase antes de cerrar la anterior, salvo que se indique lo contrario.
- Las referencias `HU-XX` y `RN-XX` apuntan a las historias de usuario y reglas de negocio de [spec.md](spec.md).
- Marca `[x]` al cerrar cada tarea.

---

## Fase 0 — Configuración del Proyecto

- [ ] **B0.1 — Inicializar workspace backend**
  Archivos: `backend/package.json`
  Terminado cuando: `npm install` corre sin errores dentro de `backend/` y el `package.json` declara `express`, `@supabase/supabase-js`, `zod`, `dotenv` como dependencias.

- [ ] **B0.2 — Configurar ESLint + Prettier**
  Archivos: `backend/.eslintrc.json`, `backend/.prettierrc`
  Terminado cuando: `npm run lint` se ejecuta sin errores sobre un archivo de prueba vacío y reporta al menos un warning ante una variable no usada.

- [ ] **B0.3 — Crear estructura de carpetas vacía**
  Archivos: `backend/src/{config,routes,controllers,services,repositories,middlewares,validators,utils}/`, `backend/tests/{unit,integration}/`
  Terminado cuando: todas las carpetas de la sección 4 de `plan.md` existen (pueden tener un `.gitkeep` si están vacías).

- [ ] **B0.4 — Variables de entorno**
  Archivos: `backend/.env.example`, `backend/src/config/env.js`
  Terminado cuando: `env.js` lanza un error explícito al arrancar si falta `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` o `JWT_SECRET`; `.env.example` lista las 5 variables de la sección 7 de `plan.md`.

- [ ] **B0.5 — Cliente Supabase**
  Archivos: `backend/src/config/supabaseClient.js`
  Terminado cuando: el módulo exporta un cliente inicializado con `service_role key` y una llamada de prueba (`select 1`) contra una tabla real responde sin error de conexión.

- [ ] **B0.6 — Servidor Express mínimo**
  Archivos: `backend/src/app.js`, `backend/src/server.js`
  Terminado cuando: `node src/server.js` levanta el servidor en el puerto de `PORT` y `GET /health` responde `200 { "status": "ok" }`.

- [ ] **B0.7 — Ejecutar schema.sql en Supabase**
  Archivos: N/A (acción sobre el proyecto Supabase)
  Terminado cuando: las 11 tablas, los 6 tipos `ENUM` y las 3 vistas de `schema.sql` existen en el proyecto Supabase (verificable con `\dt` o el Table Editor) y el `INSERT` del usuario `admin` está presente en `usuarios`.

- [ ] **B0.8 — Middleware de manejo de errores global**
  Archivos: `backend/src/middlewares/errorHandler.middleware.js`, `backend/src/app.js`
  Terminado cuando: una ruta que lanza una excepción no controlada responde `500 { "error": { "codigo": "...", "mensaje": "..." } }` en vez de tumbar el proceso.

- [ ] **B0.9 — Middleware de validación con Zod**
  Archivos: `backend/src/middlewares/validate.middleware.js`
  Terminado cuando: aplicado a una ruta de prueba con un esquema Zod, un body inválido responde `400` con el detalle del campo que falló, y uno válido continúa al controlador.

---

## Fase 1 — Autenticación y Usuarios (HU-01, HU-02)

- [ ] **B1.1 — Repositorio de usuarios**
  Archivos: `backend/src/repositories/usuarios.repository.js`
  Terminado cuando: expone `buscarPorUsuario(usuario)`, `incrementarIntentosFallidos(id)`, `resetearIntentosFallidos(id)` y `bloquearHasta(id, fecha)`, cada una probada manualmente contra Supabase con un usuario semilla.

- [ ] **B1.2 — Servicio de login con PIN**
  Archivos: `backend/src/services/auth.service.js`
  Terminado cuando: dado un `usuario` y `pin` correctos, el servicio retorna un token de sesión; dado un PIN incorrecto, incrementa `intentos_fallidos` y retorna error sin revelar si el usuario existe.

- [ ] **B1.3 — Bloqueo tras intentos fallidos (HU-01)**
  Archivos: `backend/src/services/auth.service.js`
  Terminado cuando: al tercer PIN incorrecto consecutivo, `usuarios.bloqueado_hasta` se establece a `NOW() + bloqueo_minutos`, y un cuarto intento dentro de esa ventana responde `403 "Cuenta bloqueada temporalmente"` aunque el PIN sea correcto.

- [ ] **B1.4 — Endpoint POST /api/v1/auth/login**
  Archivos: `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`
  Terminado cuando: una petición con credenciales válidas responde `200` con `{ token, usuario: { id, nombre, rol } }`; con credenciales inválidas responde `401`.

- [ ] **B1.5 — Middleware de autenticación**
  Archivos: `backend/src/middlewares/auth.middleware.js`
  Terminado cuando: una ruta protegida sin token responde `401`; con un token expirado o manipulado responde `401`; con un token válido adjunta `req.usuario` y continúa.

- [ ] **B1.6 — Middleware de autorización por rol**
  Archivos: `backend/src/middlewares/role.middleware.js`
  Terminado cuando: una ruta restringida a `administrador` responde `403` si `req.usuario.rol` es `cajero` o `esteticista`, y `200` si es `administrador`.

- [ ] **B1.7 — Expiración de sesión por inactividad (HU-02)**
  Archivos: `backend/src/middlewares/auth.middleware.js`
  Terminado cuando: un token cuya última actividad registrada supera `inactividad_minutos` responde `401 "Sesión expirada"` en la siguiente petición, sin perder los datos de una venta en curso (la venta vive en el cliente hasta confirmarse, no en el token).

- [ ] **B1.8 — Endpoint POST /api/v1/auth/logout**
  Archivos: `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`
  Terminado cuando: tras llamar al endpoint con un token válido, una petición posterior con ese mismo token responde `401`.

---

## Fase 2 — Catálogo de Productos (HU-03, HU-04, HU-05)

- [ ] **B2.1 — CRUD de categorías**
  Archivos: `backend/src/routes/categorias.routes.js`, `backend/src/controllers/categorias.controller.js`, `backend/src/repositories/categorias.repository.js`
  Terminado cuando: `POST /api/v1/categorias` crea una categoría, `GET /api/v1/categorias` la lista, y crear una con `nombre` duplicado (case-insensitive, por `CITEXT`) responde `409`.

- [ ] **B2.2 — Esquema de validación de producto**
  Archivos: `backend/src/validators/producto.schema.js`
  Terminado cuando: el esquema Zod rechaza `precio_venta <= 0`, `stock_minimo < 1` y campos obligatorios faltantes (`nombre`, `sku`, `unidad_medida`).

- [ ] **B2.3 — Repositorio de productos**
  Archivos: `backend/src/repositories/productos.repository.js`
  Terminado cuando: expone `crear`, `buscarPorId`, `buscarPorSku`, `buscarPorCodigoBarras`, `buscarPorNombre` (LIKE), `actualizar` y `desactivar`, cada una verificada contra datos semilla en Supabase.

- [ ] **B2.4 — Endpoint POST /api/v1/productos (HU-03)**
  Archivos: `backend/src/routes/productos.routes.js`, `backend/src/controllers/productos.controller.js`, `backend/src/services/productos.service.js`
  Terminado cuando: crear un producto válido responde `201`; repetir el mismo `sku` responde `409 "El código de producto ya existe"`, replicando el criterio Given/When/Then de HU-03.

- [ ] **B2.5 — Endpoint PUT /api/v1/productos/:id (HU-04)**
  Archivos: `backend/src/routes/productos.routes.js`, `backend/src/controllers/productos.controller.js`
  Terminado cuando: editar `precio_venta` o `nombre` de un producto no modifica los registros existentes en `detalle_venta` (verificado consultando una venta previa con ese producto antes y después del cambio).

- [ ] **B2.6 — Desactivación con advertencia de stock (HU-04)**
  Archivos: `backend/src/services/productos.service.js`
  Terminado cuando: `DELETE /api/v1/productos/:id` sobre un producto con `stock_actual > 0` responde `200` con `{ advertencia: true }` solo si el body incluye `confirmar: true`; sin esa confirmación responde `409` con el mensaje de advertencia.

- [ ] **B2.7 — Endpoint GET /api/v1/productos (búsqueda, HU-05)**
  Archivos: `backend/src/routes/productos.routes.js`, `backend/src/controllers/productos.controller.js`
  Terminado cuando: `GET /api/v1/productos?q=acei` retorna productos cuyo nombre contiene "acei" sin distinguir mayúsculas, y `GET /api/v1/productos?codigo_barras=XXXX` retorna exactamente un producto o `404`.

- [ ] **B2.8 — Tiempo de respuesta de búsqueda (restricción 5.2)**
  Archivos: `backend/src/repositories/productos.repository.js`
  Terminado cuando: con ≥500 productos semilla, `GET /api/v1/productos?q=...` responde en menos de 500 ms medido con una prueba local (`time curl` o script de benchmark).

---

## Fase 3 — Apertura de Caja (HU-13)

- [ ] **B3.1 — Repositorio de apertura de caja**
  Archivos: `backend/src/repositories/caja.repository.js`
  Terminado cuando: expone `crearApertura`, `obtenerAperturaAbierta(idUsuario)` y `obtenerAperturaAbiertaGlobal()`, verificadas contra Supabase.

- [ ] **B3.2 — Endpoint POST /api/v1/caja/apertura**
  Archivos: `backend/src/routes/caja.routes.js`, `backend/src/controllers/caja.controller.js`, `backend/src/services/caja.service.js`
  Terminado cuando: un cajero sin caja abierta puede abrir una con `fondo_inicial >= 0`; un `fondo_inicial` negativo responde `400`.

- [ ] **B3.3 — Bloqueo de doble apertura sin autorización**
  Archivos: `backend/src/services/caja.service.js`
  Terminado cuando: si ya existe una apertura en estado `abierta` de un turno anterior, un nuevo intento de apertura responde `409` salvo que el body incluya el PIN de un `administrador` válido, en cuyo caso se registra `id_usuario_autorizo`.

- [ ] **B3.4 — Endpoint GET /api/v1/caja/apertura/actual**
  Archivos: `backend/src/routes/caja.routes.js`, `backend/src/controllers/caja.controller.js`
  Terminado cuando: responde `200` con la apertura abierta del cajero autenticado, o `404` si no hay ninguna.

---

## Fase 4 — Ventas (HU-06, HU-07, HU-08, HU-09; RN-01, RN-02, RN-04, RN-06, RN-07, RN-08)

- [ ] **B4.1 — Utilidad de folio consecutivo (RN-08)**
  Archivos: `backend/src/utils/folio.util.js`
  Terminado cuando: dos llamadas concurrentes (probadas con `Promise.all`) generan folios distintos y consecutivos sin colisión, usando una secuencia de Postgres o un `SELECT ... FOR UPDATE`.

- [ ] **B4.2 — Utilidad de cálculo de IVA (RN-01)**
  Archivos: `backend/src/utils/iva.util.js`
  Terminado cuando: dado un `precio_venta` con IVA incluido, la función retorna `{ subtotal, iva }` tal que `subtotal + iva === precio_venta` (con redondeo a 2 decimales) para al menos 5 casos de prueba manual.

- [ ] **B4.3 — Esquema de validación de venta**
  Archivos: `backend/src/validators/venta.schema.js`
  Terminado cuando: rechaza un carrito vacío, cantidades `<= 0`, y pagos cuya suma de `monto` sea menor al `total` calculado.

- [ ] **B4.4 — Repositorio transaccional de ventas**
  Archivos: `backend/src/repositories/ventas.repository.js`
  Terminado cuando: `crearVentaCompleta(venta, detalles, pagos)` inserta en `ventas`, `detalle_venta`, `pagos_venta` y actualiza `stock_actual` en una sola transacción; si falla cualquier paso, ningún registro queda parcialmente insertado (verificado forzando un error a mitad del proceso).

- [ ] **B4.5 — Validación de caja abierta (RN-02)**
  Archivos: `backend/src/services/ventas.service.js`
  Terminado cuando: intentar registrar una venta sin `apertura_caja` en estado `abierta` para el cajero responde `409 "Debe registrar el fondo para abrir una nueva caja"`.

- [ ] **B4.6 — Validación de stock disponible**
  Archivos: `backend/src/services/ventas.service.js`
  Terminado cuando: agregar al carrito (vía API) un producto con `stock_actual = 0` responde `409 "Sin stock disponible"` sin crear la venta.

- [ ] **B4.7 — Endpoint POST /api/v1/ventas (HU-06)**
  Archivos: `backend/src/routes/ventas.routes.js`, `backend/src/controllers/ventas.controller.js`
  Terminado cuando: una venta con pago en efectivo suficiente responde `201` con el folio y el cambio calculado; un monto insuficiente responde `400 "Monto insuficiente. Falta $X.XX"`.

- [ ] **B4.8 — Pago mixto (HU-06)**
  Archivos: `backend/src/services/ventas.service.js`
  Terminado cuando: una venta con dos entradas en `pagos_venta` (ej. efectivo + tarjeta) cuya suma cubre el total se registra correctamente, y cada método queda desglosado en la respuesta.

- [ ] **B4.9 — Descuento por línea o por venta (HU-08, RN-04)**
  Archivos: `backend/src/services/ventas.service.js`
  Terminado cuando: un descuento `<= descuento_maximo_cajero` (de `configuracion`) se aplica sin restricción; uno mayor responde `403` a menos que el body incluya el PIN de un `administrador` válido, registrando el evento en `log_auditoria`.

- [ ] **B4.10 — Endpoint POST /api/v1/ventas/:id/cancelar (HU-07)**
  Archivos: `backend/src/routes/ventas.routes.js`, `backend/src/controllers/ventas.controller.js`
  Terminado cuando: cancelar una venta ya cobrada requiere PIN de `administrador`; al cancelarse, se llenan `id_cajero_cancela`, `fecha_cancelacion`, `motivo_cancelacion`, y se revierte el descuento de `stock_actual`.

- [ ] **B4.11 — Endpoint GET /api/v1/ventas/:id (ticket, HU-09)**
  Archivos: `backend/src/routes/ventas.routes.js`, `backend/src/controllers/ventas.controller.js`
  Terminado cuando: responde con el detalle completo de la venta (usando `v_ticket`) listo para reimpresión, incluyendo todas las líneas de `detalle_venta`.

- [ ] **B4.12 — Endpoint POST /api/v1/ventas/:id/reimprimir (HU-09)**
  Archivos: `backend/src/routes/ventas.routes.js`, `backend/src/controllers/ventas.controller.js`
  Terminado cuando: cada llamada inserta un registro en `log_auditoria` con `accion = 'REIMPRESION'`, y si la venta tiene más de 24 horas igual se permite (la restricción es solo de auditoría, no de bloqueo).

- [ ] **B4.13 — Endpoint GET /api/v1/ventas (filtros)**
  Archivos: `backend/src/routes/ventas.routes.js`, `backend/src/controllers/ventas.controller.js`
  Terminado cuando: soporta filtros por `folio`, `fecha_inicio`/`fecha_fin` e `id_cajero`, retornando solo las ventas que cumplen todos los filtros provistos.

---

## Fase 5 — Control de Inventario (HU-10, HU-11, HU-12)

- [ ] **B5.1 — Repositorio de movimientos de inventario**
  Archivos: `backend/src/repositories/inventario.repository.js`
  Terminado cuando: expone `registrarMovimiento(tipo, idProducto, cantidad, ...)` que inserta en `movimientos_inventario` y actualiza `productos.stock_actual` de forma atómica.

- [ ] **B5.2 — Endpoint POST /api/v1/inventario/entradas (HU-10)**
  Archivos: `backend/src/routes/inventario.routes.js`, `backend/src/controllers/inventario.controller.js`, `backend/src/services/inventario.service.js`
  Terminado cuando: una entrada con `cantidad > 0` incrementa `stock_actual` y registra `costo_unitario`; una `cantidad <= 0` responde `400 "La cantidad debe ser mayor a cero"`.

- [ ] **B5.3 — Endpoint POST /api/v1/inventario/ajustes (HU-12)**
  Archivos: `backend/src/routes/inventario.routes.js`, `backend/src/controllers/inventario.controller.js`
  Terminado cuando: un ajuste sin `motivo` responde `400`; un ajuste negativo que dejaría `stock_actual < 0` requiere `confirmar: true` en el body para proceder, igual que B2.6.

- [ ] **B5.4 — Alerta de stock mínimo (HU-11)**
  Archivos: `backend/src/routes/inventario.routes.js`, `backend/src/controllers/inventario.controller.js`
  Terminado cuando: `GET /api/v1/inventario/stock-bajo` retorna los productos de la vista `v_stock_bajo`, y queda vacío cuando ningún producto está por debajo de su mínimo.

- [ ] **B5.5 — Validación de stock mínimo en creación/edición de producto**
  Archivos: `backend/src/validators/producto.schema.js`
  Terminado cuando: un `stock_minimo <= 0` responde `400 "El stock mínimo debe ser al menos 1"` (cubre el segundo criterio de HU-11).

- [ ] **B5.6 — Endpoint GET /api/v1/inventario/movimientos (HU-12)**
  Archivos: `backend/src/routes/inventario.routes.js`, `backend/src/controllers/inventario.controller.js`
  Terminado cuando: soporta `?id_producto=` y `?tipo=ajuste_positivo,ajuste_negativo`, retornando movimientos con `fecha_hora`, `cantidad`, `motivo` y el `nombre` del usuario que lo ejecutó.

---

## Fase 6 — Corte de Caja (HU-14, HU-15; RN-05)

- [ ] **B6.1 — Endpoint GET /api/v1/caja/corte-x (HU-14)**
  Archivos: `backend/src/routes/caja.routes.js`, `backend/src/controllers/caja.controller.js`, `backend/src/services/caja.service.js`
  Terminado cuando: usando `v_resumen_turno`, responde el acumulado de ventas, número de transacciones y desglose por forma de pago de la apertura activa, sin modificar el estado de `apertura_caja`.

- [ ] **B6.2 — Acumulado correcto en cortes X sucesivos**
  Archivos: `backend/src/services/caja.service.js`
  Terminado cuando: generar un corte X, registrar una venta adicional, y generar otro corte X muestra el acumulado total desde la apertura (no solo desde el corte X anterior).

- [ ] **B6.3 — Endpoint POST /api/v1/caja/corte-z (HU-15, RN-05)**
  Archivos: `backend/src/routes/caja.routes.js`, `backend/src/controllers/caja.controller.js`, `backend/src/services/caja.service.js`
  Terminado cuando: recibe `efectivo_declarado`, calcula `efectivo_esperado` y `diferencia`, inserta el registro en `corte_caja` con `tipo = 'Z'`, y cambia `apertura_caja.estado` a `cerrada`.

- [ ] **B6.4 — Inmutabilidad del corte Z (RN-05)**
  Archivos: `backend/src/services/caja.service.js`
  Terminado cuando: no existe ningún endpoint `PUT`/`PATCH` sobre `corte_caja`, y un segundo intento de corte Z sobre la misma apertura responde `409`.

- [ ] **B6.5 — Bloqueo de ventas tras corte Z**
  Archivos: `backend/src/services/ventas.service.js`
  Terminado cuando: tras un corte Z exitoso, `POST /api/v1/ventas` para ese cajero responde `409 "Debe registrar el fondo para abrir una nueva caja"` (reutiliza B4.5).

---

## Fase 7 — Reportes (HU-16)

- [ ] **B7.1 — Endpoint GET /api/v1/reportes/ventas**
  Archivos: `backend/src/routes/reportes.routes.js`, `backend/src/controllers/reportes.controller.js`, `backend/src/services/reportes.service.js`
  Terminado cuando: dado un rango de fechas, responde `total_ventas`, `num_tickets`, `ticket_promedio` y desglose por forma de pago.

- [ ] **B7.2 — Filtro por cajero**
  Archivos: `backend/src/services/reportes.service.js`
  Terminado cuando: `GET /api/v1/reportes/ventas?id_cajero=3` retorna solo las métricas de las ventas de ese cajero en el rango.

- [ ] **B7.3 — Top 5 productos más vendidos**
  Archivos: `backend/src/services/reportes.service.js`
  Terminado cuando: el reporte incluye un arreglo `top_productos` de máximo 5 elementos ordenado por cantidad vendida descendente.

- [ ] **B7.4 — Manejo de rango sin movimientos**
  Archivos: `backend/src/controllers/reportes.controller.js`
  Terminado cuando: un rango de fechas sin ventas responde `200` con todos los totales en cero y `top_productos: []`, no un error.

---

## Fase 8 — Auditoría y Seguridad Transversal (sección 5.3 del spec)

- [ ] **B8.1 — Repositorio de log de auditoría**
  Archivos: `backend/src/repositories/auditoria.repository.js`
  Terminado cuando: expone `registrar(accion, descripcion, idUsuario, tablaAfectada, idRegistro)` y no expone ningún método de actualización o borrado.

- [ ] **B8.2 — Auditoría conectada a eventos críticos**
  Archivos: `backend/src/services/ventas.service.js`, `backend/src/services/inventario.service.js`
  Terminado cuando: cancelaciones (B4.10), descuentos fuera de límite (B4.9), ajustes de inventario (B5.3) y reimpresiones (B4.12) generan cada uno una fila en `log_auditoria` verificable por consulta directa.

- [ ] **B8.3 — Restricción de acceso al log de auditoría**
  Archivos: `backend/src/routes/auditoria.routes.js`
  Terminado cuando: `GET /api/v1/auditoria` responde `403` para roles distintos de `administrador`.

- [ ] **B8.4 — Hash de PIN en creación de usuario**
  Archivos: `backend/src/services/usuarios.service.js`
  Terminado cuando: un PIN nunca se almacena en texto plano (verificable inspeccionando `usuarios.pin_hash` tras crear un usuario) y usa bcrypt o Argon2 con factor de costo razonable (≥10 rondas si es bcrypt).

- [ ] **B8.5 — CORS y cabeceras de seguridad básicas**
  Archivos: `backend/src/app.js`
  Terminado cuando: el servidor responde con cabeceras CORS limitadas al origen del frontend configurado (`VITE_API_BASE_URL` no se usa aquí, sino una variable `FRONTEND_ORIGIN` propia del backend), y `helmet` (u equivalente) está activo.

---

## Fase 9 — Pruebas Automatizadas

- [ ] **B9.1 — Configurar Vitest + Supertest**
  Archivos: `backend/vitest.config.js`, `backend/package.json`
  Terminado cuando: `npm test` ejecuta al menos una prueba dummy y reporta resultado en consola.

- [ ] **B9.2 — Pruebas unitarias de utilidades críticas**
  Archivos: `backend/tests/unit/folio.util.test.js`, `backend/tests/unit/iva.util.test.js`
  Terminado cuando: ambas suites pasan y cubren al menos el caso feliz y un caso límite (folio concurrente, IVA con redondeo) cada una.

- [ ] **B9.3 — Pruebas de integración del flujo de venta**
  Archivos: `backend/tests/integration/ventas.routes.test.js`
  Terminado cuando: un test crea apertura de caja → registra venta → verifica descuento de stock → cancela la venta → verifica reversión de stock, todo contra una base de datos de prueba (no producción).

- [ ] **B9.4 — Pruebas de integración del corte de caja**
  Archivos: `backend/tests/integration/caja.routes.test.js`
  Terminado cuando: un test cubre apertura → venta → corte X (no cierra) → corte Z (cierra) → intento de venta posterior (rechazado), tal como describe HU-13 a HU-15.

- [ ] **B9.5 — Umbral mínimo de cobertura**
  Archivos: `backend/vitest.config.js`
  Terminado cuando: `npm run test:coverage` reporta cobertura ≥70% en `src/services/` y `src/utils/`.

---

## Fase 10 — Documentación de Cierre

- [ ] **B10.1 — README del backend**
  Archivos: `backend/README.md`
  Terminado cuando: incluye pasos de instalación, variables de entorno requeridas, comando para correr migraciones (`schema.sql`) y comando para levantar el servidor en desarrollo.

- [ ] **B10.2 — Documentación de endpoints**
  Archivos: `backend/docs/api.md` o colección Postman/Insomnia exportada
  Terminado cuando: todos los endpoints de las Fases 1–7 están documentados con método, ruta, body de ejemplo y posibles códigos de error.

---

## Resumen de Cobertura

| Fase | HU / RN cubiertas | # Tareas |
|---|---|---|
| 0 — Configuración | Restricción 5.1 (Supabase/Postgres) | 9 |
| 1 — Auth | HU-01, HU-02 | 8 |
| 2 — Productos | HU-03, HU-04, HU-05; restricción 5.2 | 8 |
| 3 — Apertura de caja | HU-13 | 4 |
| 4 — Ventas | HU-06, HU-07, HU-08, HU-09; RN-01,02,04,06,07,08 | 13 |
| 5 — Inventario | HU-10, HU-11, HU-12 | 6 |
| 6 — Corte de caja | HU-14, HU-15; RN-05 | 5 |
| 7 — Reportes | HU-16 | 4 |
| 8 — Auditoría/seguridad | Sección 5.3 | 5 |
| 9 — Pruebas | — | 5 |
| 10 — Documentación | — | 2 |
| **Total** | | **69** |

---

*Fin del documento — v1.0*
