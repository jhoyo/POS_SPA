# Tareas de Construcción — Frontend Sistema POS Spa Facial

**Versión:** 1.0
**Fecha:** 2026-07-01
**Basado en:** [spec.md](spec.md), [plan.md](plan.md), [skill-ith-backend.md](skill-ith-backend.md)
**Alcance:** Solo frontend (React 18 + Vite). El backend se cubre en [tasks.md](tasks.md).

---

## Cómo usar este documento

- Cada tarea tiene un **ID** (`F<fase>.<n>`), los **archivos** que toca (rutas relativas a `frontend/`, según la sección 5 de `plan.md`) y un **criterio de verificación visual** en formato **Given/When/Then** — es decir, algo que se pueda comprobar mirando la pantalla, no solo leyendo código.
- Las tareas están ordenadas por dependencia: no empieces una fase antes de cerrar la anterior, salvo que se indique lo contrario.
- Las referencias `HU-XX` apuntan a las historias de usuario de [spec.md](spec.md).
- Marca `[x]` al cerrar cada tarea.

### Convenciones aplicadas (de `skill-ith-backend.md` y `plan.md` secc. 5–6)

| Regla | Aplicación en frontend |
|---|---|
| Variables y funciones en inglés (`camelCase`) | `handleConfirmarPago()`, `cartTotal`, aunque el texto visible en UI sea español |
| Comentarios en español | Igual que el backend; solo donde el "por qué" no sea obvio |
| Componentes en `PascalCase.jsx`, hooks `useX.js` | Ya definido en `plan.md` secc. 5 y 6.1/6.2 |
| Respuestas de API `{ success, data }` / `{ success: false, error }` | `apiClient.js` debe leer este contrato del backend y normalizar el error para mostrarlo en UI |
| Nunca exponer errores internos/técnicos al usuario | Todo mensaje de error mostrado en pantalla debe ser lenguaje natural (restricción 5.4 del spec), aunque la API devuelva un código interno |

---

## Fase 0 — Configuración del Proyecto Frontend

- [ ] **F0.1 — Inicializar proyecto Vite + React**
  Archivos: `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html`
  Verificación visual:
  ```
  Given que ejecuto `npm run dev` dentro de `frontend/`
  When abro la URL local en el navegador
  Then veo la página por defecto de Vite/React cargada sin errores en consola
  ```

- [ ] **F0.2 — Configurar Tailwind CSS**
  Archivos: `frontend/tailwind.config.js`, `frontend/src/index.css`
  Verificación visual:
  ```
  Given que agrego una clase Tailwind (ej. `bg-blue-500 text-white p-4`) a un elemento de prueba en `App.jsx`
  When recargo la página
  Then el elemento se muestra con fondo azul, texto blanco y relleno, confirmando que Tailwind procesa las clases
  ```

- [ ] **F0.3 — ESLint + Prettier frontend**
  Archivos: `frontend/.eslintrc.json`, `frontend/.prettierrc`
  Verificación visual:
  ```
  Given un archivo de prueba con una variable declarada y no usada
  When ejecuto `npm run lint`
  Then la terminal reporta un warning/error señalando esa línea exacta
  ```

- [ ] **F0.4 — Estructura de carpetas vacía**
  Archivos: `frontend/src/{assets,components/{common,productos,ventas,inventario,caja},pages,hooks,context,services/api,routes,utils}/`
  Verificación visual:
  ```
  Given que reviso el árbol de carpetas de `frontend/src/`
  When lo comparo contra la sección 5 de `plan.md`
  Then todas las carpetas existen (con `.gitkeep` si están vacías) sin nombres adicionales no documentados
  ```

- [ ] **F0.5 — Variables de entorno**
  Archivos: `frontend/.env.example`
  Verificación visual:
  ```
  Given que abro `frontend/.env.example`
  When busco la variable de conexión a la API
  Then encuentro `VITE_API_BASE_URL=http://localhost:3000/api/v1` documentada, tal como indica la sección 7 de `plan.md`
  ```

- [ ] **F0.6 — apiClient.js con manejo de respuesta estándar**
  Archivos: `frontend/src/services/api/apiClient.js`
  Verificación visual:
  ```
  Given que el backend responde `{ success: false, error: "PIN incorrecto" }`
  When cualquier pantalla de prueba llama a un endpoint que falla
  Then la pantalla recibe únicamente el mensaje "PIN incorrecto" (no el objeto crudo ni un stack trace) listo para mostrarse al usuario

  Given que el backend responde `{ success: true, data: {...} }`
  When la llamada es exitosa
  Then el código consumidor recibe directamente el contenido de `data`, sin necesidad de desenvolver el sobre en cada pantalla
  ```

- [ ] **F0.7 — AppRouter.jsx con rutas placeholder**
  Archivos: `frontend/src/routes/AppRouter.jsx`, `frontend/src/App.jsx`, `frontend/src/main.jsx`
  Verificación visual:
  ```
  Given que navego manualmente a `/login`, `/ventas`, `/productos`, `/inventario`, `/caja` y `/reportes`
  When cada ruta carga
  Then cada una muestra al menos un texto placeholder distinto (ej. "Página de Ventas") sin pantalla en blanco ni error 404
  ```

- [ ] **F0.8 — Componentes comunes base (Button, Input, Modal, Badge, Spinner)**
  Archivos: `frontend/src/components/common/Button.jsx`, `Input.jsx`, `Modal.jsx`, `Badge.jsx`, `Spinner.jsx`
  Verificación visual:
  ```
  Given una página de prueba que renderiza los 5 componentes con props de ejemplo
  When la observo en el navegador
  Then `Button` se ve clicable con estado `:hover` distinguible, `Modal` se abre centrado sobre un overlay semitransparente al invocarlo, `Spinner` gira de forma continua, y `Badge`/`Input` respetan el tamaño mínimo táctil (≥ 44px de alto) exigido por la restricción 5.4 del spec
  ```

---

## Fase 1 — Autenticación (HU-01, HU-02)

- [ ] **F1.1 — LoginPage.jsx (formulario usuario + PIN)**
  Archivos: `frontend/src/pages/LoginPage.jsx`
  Verificación visual:
  ```
  Given que estoy en `/login`
  When ingreso un usuario y un PIN válidos y presiono "Entrar"
  Then soy redirigido a la pantalla correspondiente a mi rol (HU-01)
  ```

- [ ] **F1.2 — Bloqueo visual tras 3 PIN incorrectos**
  Archivos: `frontend/src/pages/LoginPage.jsx`
  Verificación visual:
  ```
  Given que ingreso un PIN incorrecto 3 veces consecutivas
  When falla el tercer intento
  Then el formulario se deshabilita y muestra el mensaje "Cuenta bloqueada temporalmente" en un banner rojo visible, sin permitir un cuarto intento inmediato (HU-01)
  ```

- [ ] **F1.3 — Redirección y menú condicional según rol**
  Archivos: `frontend/src/context/AuthContext.jsx`, `frontend/src/routes/AppRouter.jsx`
  Verificación visual:
  ```
  Given que inicio sesión como administrador
  When llego a la pantalla principal
  Then veo el menú de administración (Productos, Inventario, Reportes, Configuración)

  Given que inicio sesión como cajero
  When llego a la pantalla principal
  Then no veo las opciones de administración en el menú (HU-01)
  ```

- [ ] **F1.4 — RutaPrivada.jsx (protección por rol)**
  Archivos: `frontend/src/routes/RutaPrivada.jsx`
  Verificación visual:
  ```
  Given que estoy autenticado como cajero
  When intento navegar directamente a la URL de una página exclusiva de administrador
  Then soy redirigido fuera de esa página (a `/login` o a una pantalla de "acceso no autorizado") sin ver su contenido
  ```

- [ ] **F1.5 — useSesionInactividad hook + bloqueo de pantalla (HU-02)**
  Archivos: `frontend/src/hooks/useSesionInactividad.js`, `frontend/src/components/common/Modal.jsx`
  Verificación visual:
  ```
  Given que dejo la sesión sin actividad (sin clics ni teclas) durante 10 minutos
  When transcurre ese tiempo
  Then aparece una pantalla de bloqueo modal solicitando el PIN, cubriendo el resto de la interfaz
  ```

- [ ] **F1.6 — Reanudación de sesión conserva venta en curso (HU-02)**
  Archivos: `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/VentasPage.jsx`
  Verificación visual:
  ```
  Given que el carrito tiene productos agregados cuando se bloquea la pantalla por inactividad
  When ingreso el PIN correcto para reanudar
  Then el carrito muestra exactamente los mismos productos y cantidades que antes del bloqueo
  ```

---

## Fase 2 — Layout General y Navegación

- [ ] **F2.1 — Layout principal con barra de navegación por rol**
  Archivos: `frontend/src/components/common/Layout.jsx` (o equivalente en `common/`)
  Verificación visual:
  ```
  Given que estoy autenticado
  When reviso el encabezado o barra lateral
  Then veo el nombre del usuario, su rol y un botón de "Cerrar sesión" visibles en todas las páginas internas
  ```

- [ ] **F2.2 — Página no encontrada (404)**
  Archivos: `frontend/src/pages/NotFoundPage.jsx`, `frontend/src/routes/AppRouter.jsx`
  Verificación visual:
  ```
  Given que navego a una ruta inexistente (ej. `/xyz`)
  When la página carga
  Then veo un mensaje "Página no encontrada" con un enlace para volver al inicio, no una pantalla en blanco
  ```

- [ ] **F2.3 — Indicador de carga global con TanStack Query**
  Archivos: `frontend/src/components/common/Spinner.jsx`, integración en páginas que consultan datos
  Verificación visual:
  ```
  Given que una página dispara una consulta a la API (ej. lista de productos)
  When la respuesta tarda en llegar
  Then se muestra un `Spinner` en el área de contenido hasta que los datos llegan, y desaparece al recibirlos
  ```

---

## Fase 3 — Catálogo de Productos (HU-03, HU-04, HU-05)

- [ ] **F3.1 — ProductosPage.jsx (listado)**
  Archivos: `frontend/src/pages/ProductosPage.jsx`, `frontend/src/components/productos/ProductoCard.jsx`
  Verificación visual:
  ```
  Given que soy administrador y entro a `/productos`
  When la página carga
  Then veo una lista/grid de tarjetas de producto con nombre, precio y stock actual visibles
  ```

- [ ] **F3.2 — ProductoForm.jsx (alta de producto, HU-03)**
  Archivos: `frontend/src/components/productos/ProductoForm.jsx`
  Verificación visual:
  ```
  Given que estoy en el formulario de nuevo producto
  When lleno nombre, SKU, precio y unidad y presiono "Guardar"
  Then el producto aparece en el listado de `/productos` sin recargar la página completa
  ```

- [ ] **F3.3 — Validación visual de errores en ProductoForm**
  Archivos: `frontend/src/components/productos/ProductoForm.jsx`
  Verificación visual:
  ```
  Given que ingreso un SKU que ya existe y confirmo
  When el backend rechaza la operación
  Then el formulario muestra "El código de producto ya existe" junto al campo de SKU, en texto rojo, sin cerrar el formulario

  Given que dejo el precio en blanco o en cero y confirmo
  When intento guardar
  Then veo el mensaje "El precio de venta debe ser mayor a cero" junto al campo de precio (HU-03)
  ```

- [ ] **F3.4 — Edición de producto (HU-04)**
  Archivos: `frontend/src/components/productos/ProductoForm.jsx`, `frontend/src/pages/ProductosPage.jsx`
  Verificación visual:
  ```
  Given que selecciono "Editar" sobre un producto existente
  When cambio el precio y guardo
  Then el listado refleja el nuevo precio inmediatamente y el formulario se cierra sin error
  ```

- [ ] **F3.5 — Confirmación de desactivación con stock > 0 (HU-04)**
  Archivos: `frontend/src/components/productos/ProductoForm.jsx`, `frontend/src/components/common/Modal.jsx`
  Verificación visual:
  ```
  Given que intento desactivar un producto con stock mayor a cero
  When presiono "Desactivar"
  Then aparece un modal de confirmación advirtiendo que aún existe inventario, y el producto solo se desactiva si confirmo por segunda vez
  ```

- [ ] **F3.6 — BuscadorProducto.jsx (búsqueda en tiempo real, HU-05)**
  Archivos: `frontend/src/components/productos/BuscadorProducto.jsx`
  Verificación visual:
  ```
  Given que escribo las primeras letras del nombre de un producto en el buscador
  When existe al menos un resultado
  Then la lista filtrada se actualiza en pantalla en menos de 0.5 s, sin necesidad de presionar un botón de búsqueda
  ```

- [ ] **F3.7 — Alta rápida desde código no encontrado (HU-05)**
  Archivos: `frontend/src/components/productos/BuscadorProducto.jsx`
  Verificación visual:
  ```
  Given que escaneo un código de barras que no existe en el catálogo
  When el sistema no encuentra coincidencia
  Then aparece el mensaje "Producto no encontrado. ¿Desea registrarlo?" con un botón que abre `ProductoForm` prellenado con ese código
  ```

---

## Fase 4 — Punto de Venta (HU-06, HU-07, HU-08, HU-09)

- [ ] **F4.1 — VentasPage.jsx (layout principal)**
  Archivos: `frontend/src/pages/VentasPage.jsx`
  Verificación visual:
  ```
  Given que soy cajero y entro a `/ventas`
  When la página carga
  Then veo el buscador de productos, el carrito vacío y el panel de pago deshabilitado (sin productos aún)
  ```

- [ ] **F4.2 — CarritoVenta.jsx + LineaVenta.jsx**
  Archivos: `frontend/src/components/ventas/CarritoVenta.jsx`, `frontend/src/components/ventas/LineaVenta.jsx`
  Verificación visual:
  ```
  Given que agrego dos productos distintos al carrito
  When reviso el carrito
  Then veo dos líneas, cada una con nombre, cantidad, precio unitario y subtotal, y un total general correcto en la parte inferior
  ```

- [ ] **F4.3 — Escaneo de código de barras agrega producto automáticamente (HU-05/HU-06)**
  Archivos: `frontend/src/pages/VentasPage.jsx`, `frontend/src/hooks/useCarrito.js`
  Verificación visual:
  ```
  Given que el foco está en la pantalla de ventas
  When escaneo un código de barras válido con el lector
  Then el producto se agrega al carrito con cantidad 1 sin que el cajero toque el teclado ni el mouse
  ```

- [ ] **F4.4 — PanelPago.jsx (forma de pago y cambio, HU-06)**
  Archivos: `frontend/src/components/ventas/PanelPago.jsx`
  Verificación visual:
  ```
  Given que el carrito tiene productos y selecciono "Efectivo"
  When ingreso un monto recibido mayor al total y confirmo
  Then el panel muestra el cambio calculado antes de cerrar la venta
  ```

- [ ] **F4.5 — Validación de monto insuficiente (HU-06)**
  Archivos: `frontend/src/components/ventas/PanelPago.jsx`
  Verificación visual:
  ```
  Given que pago en efectivo con un monto menor al total
  When presiono "Confirmar pago"
  Then veo el error "Monto insuficiente. Falta $X.XX" en el panel, y la venta permanece abierta (no se cierra)
  ```

- [ ] **F4.6 — Pago mixto (HU-06)**
  Archivos: `frontend/src/components/ventas/PanelPago.jsx`
  Verificación visual:
  ```
  Given que agrego un monto en efectivo y otro en tarjeta cuya suma cubre el total
  When confirmo el pago
  Then el ticket resultante muestra el desglose de ambos métodos con sus montos respectivos
  ```

- [ ] **F4.7 — Vista de ticket / impresión (RN-07)**
  Archivos: `frontend/src/components/ventas/Ticket.jsx` (o ubicación equivalente en `ventas/`)
  Verificación visual:
  ```
  Given que una venta se confirma exitosamente
  When se genera el ticket
  Then la vista muestra folio, fecha/hora, cada producto con cantidad y precio, subtotal, IVA desglosado, total, forma de pago y cambio entregado
  ```

- [ ] **F4.8 — Cancelar venta antes de cobrar (HU-07)**
  Archivos: `frontend/src/pages/VentasPage.jsx`, `frontend/src/components/common/Modal.jsx`
  Verificación visual:
  ```
  Given que hay productos en el carrito y aún no confirmo el cobro
  When presiono "Cancelar venta" y confirmo en el modal
  Then el carrito queda vacío y regreso al estado inicial de la pantalla de ventas
  ```

- [ ] **F4.9 — Cancelación de venta cobrada requiere PIN admin (HU-07)**
  Archivos: `frontend/src/components/ventas/PanelPago.jsx` (o componente de gestión de venta), `frontend/src/components/common/Modal.jsx`
  Verificación visual:
  ```
  Given que una venta ya fue cobrada
  When el cajero intenta cancelarla
  Then aparece un modal solicitando el PIN de un administrador, y la cancelación solo procede si el PIN es válido
  ```

- [ ] **F4.10 — Aplicar descuento con autorización de PIN si excede el máximo (HU-08)**
  Archivos: `frontend/src/components/ventas/LineaVenta.jsx`, `frontend/src/components/ventas/CarritoVenta.jsx`
  Verificación visual:
  ```
  Given que aplico un descuento porcentual dentro del límite permitido (ej. 10%)
  When confirmo el descuento
  Then el precio de la línea se recalcula en pantalla de inmediato

  Given que ingreso un descuento mayor al máximo configurado (ej. >20%)
  When intento aplicarlo
  Then aparece un modal solicitando el PIN de administrador antes de aceptar el descuento
  ```

- [ ] **F4.11 — Reimpresión de ticket (HU-09)**
  Archivos: `frontend/src/pages/VentasPage.jsx` (o página de historial de ventas)
  Verificación visual:
  ```
  Given que busco una venta por folio o por fecha/hora
  When selecciono "Reimprimir"
  Then se muestra el mismo ticket original con la leyenda "REIMPRESIÓN" visible en la parte superior
  ```

- [ ] **F4.12 — Bloqueo visual de producto sin stock (HU-11)**
  Archivos: `frontend/src/components/productos/BuscadorProducto.jsx`, `frontend/src/components/ventas/CarritoVenta.jsx`
  Verificación visual:
  ```
  Given que el stock de un producto es cero
  When intento agregarlo al carrito
  Then veo la advertencia "Sin stock disponible" y el producto no se agrega a la lista del carrito
  ```

---

## Fase 5 — Control de Inventario (HU-10, HU-11, HU-12)

- [ ] **F5.1 — InventarioPage.jsx (layout)**
  Archivos: `frontend/src/pages/InventarioPage.jsx`
  Verificación visual:
  ```
  Given que soy administrador y entro a `/inventario`
  When la página carga
  Then veo pestañas o secciones separadas para "Entradas", "Ajustes" y "Movimientos"
  ```

- [ ] **F5.2 — Formulario de entrada de mercancía (HU-10)**
  Archivos: `frontend/src/components/inventario/` (nuevo formulario de entrada)
  Verificación visual:
  ```
  Given que selecciono un producto existente y registro una entrada con cantidad y costo
  When guardo el movimiento
  Then el stock mostrado en pantalla para ese producto aumenta de inmediato en la cantidad indicada

  Given que ingreso una cantidad cero o negativa
  When intento guardar
  Then veo el mensaje "La cantidad debe ser mayor a cero" sin que se registre el movimiento
  ```

- [ ] **F5.3 — Formulario de ajuste de inventario (HU-12)**
  Archivos: `frontend/src/components/inventario/` (nuevo formulario de ajuste)
  Verificación visual:
  ```
  Given que registro un ajuste negativo (merma) con un motivo
  When guardo el ajuste
  Then el stock se reduce en pantalla y el motivo queda visible en el detalle del movimiento
  ```

- [ ] **F5.4 — Confirmación de stock negativo (HU-12)**
  Archivos: `frontend/src/components/inventario/`, `frontend/src/components/common/Modal.jsx`
  Verificación visual:
  ```
  Given que el ajuste dejaría el stock en negativo
  When intento guardar
  Then aparece un modal con el mensaje "El stock quedará en negativo. ¿Confirmar?" antes de aplicar el cambio
  ```

- [ ] **F5.5 — AlertaStockBajo.jsx (HU-11)**
  Archivos: `frontend/src/components/inventario/AlertaStockBajo.jsx`
  Verificación visual:
  ```
  Given que al menos un producto está por debajo de su stock mínimo
  When el administrador entra a su panel principal
  Then ve una alerta visible (banner o badge) listando el nombre del producto y el stock actual
  ```

- [ ] **F5.6 — TablaMovimientos.jsx con filtros (HU-12)**
  Archivos: `frontend/src/components/inventario/TablaMovimientos.jsx`
  Verificación visual:
  ```
  Given que filtro el historial de movimientos por tipo "ajuste"
  When se aplica el filtro
  Then la tabla muestra solo los ajustes, cada fila con fecha, cantidad, motivo y usuario que lo realizó
  ```

---

## Fase 6 — Corte de Caja (HU-13, HU-14, HU-15)

- [ ] **F6.1 — Modal obligatorio de apertura de caja (HU-13)**
  Archivos: `frontend/src/components/caja/` (nuevo modal/formulario de apertura), `frontend/src/context/` (contexto de caja)
  Verificación visual:
  ```
  Given que inicio sesión como cajero y no hay caja abierta
  When intento acceder a la pantalla de ventas
  Then se muestra un modal bloqueante solicitando el monto del fondo inicial antes de permitir cualquier venta
  ```

- [ ] **F6.2 — Advertencia de caja abierta de turno anterior (HU-13)**
  Archivos: mismo componente de F6.1
  Verificación visual:
  ```
  Given que ya existe una caja abierta de un turno anterior sin cerrar
  When inicio sesión como cajero
  Then veo una advertencia en pantalla y un campo para que un administrador ingrese su PIN antes de continuar
  ```

- [ ] **F6.3 — CajaPage.jsx (layout)**
  Archivos: `frontend/src/pages/CajaPage.jsx`
  Verificación visual:
  ```
  Given que entro a `/caja`
  When la página carga
  Then veo botones diferenciados para "Corte X" y "Corte Z", y el estado actual de la caja (abierta/cerrada)
  ```

- [ ] **F6.4 — ResumenCorteX.jsx (HU-14)**
  Archivos: `frontend/src/components/caja/ResumenCorteX.jsx`
  Verificación visual:
  ```
  Given que solicito el corte X
  When el resumen se muestra
  Then veo el desglose de ventas por forma de pago, el número de transacciones, el monto total, y el texto "CORTE PARCIAL — NO CIERRA CAJA" visible
  ```

- [ ] **F6.5 — FormCorteZ.jsx (HU-15)**
  Archivos: `frontend/src/components/caja/FormCorteZ.jsx`
  Verificación visual:
  ```
  Given que solicito el corte Z e ingreso el efectivo contado
  When confirmo el cierre
  Then veo el fondo inicial, el efectivo esperado, el efectivo declarado y la diferencia (sobrante/faltante) resaltada en color (verde si es cero, rojo/ámbar si hay diferencia)
  ```

- [ ] **F6.6 — Bloqueo de ventas tras corte Z (HU-15)**
  Archivos: `frontend/src/pages/VentasPage.jsx`
  Verificación visual:
  ```
  Given que se realizó el corte Z exitosamente
  When intento entrar a la pantalla de ventas sin abrir una nueva caja
  Then veo el mensaje "Debe registrar el fondo para abrir una nueva caja" en vez del formulario de venta
  ```

---

## Fase 7 — Reportes (HU-16)

- [ ] **F7.1 — ReportesPage.jsx con filtro de fechas**
  Archivos: `frontend/src/pages/ReportesPage.jsx`
  Verificación visual:
  ```
  Given que selecciono un rango de fechas y presiono "Generar reporte"
  When el reporte carga
  Then veo el total de ventas, número de tickets, ticket promedio y el desglose por forma de pago
  ```

- [ ] **F7.2 — Filtro por cajero**
  Archivos: `frontend/src/pages/ReportesPage.jsx`
  Verificación visual:
  ```
  Given que selecciono un cajero específico en el filtro
  When el reporte se actualiza
  Then las métricas mostradas corresponden únicamente a las ventas de ese cajero en el periodo seleccionado
  ```

- [ ] **F7.3 — Top 5 productos más vendidos**
  Archivos: `frontend/src/pages/ReportesPage.jsx`
  Verificación visual:
  ```
  Given que el reporte tiene datos de ventas
  When reviso la sección de productos
  Then veo una lista de máximo 5 productos ordenados de mayor a menor cantidad vendida
  ```

- [ ] **F7.4 — Estado vacío sin movimientos**
  Archivos: `frontend/src/pages/ReportesPage.jsx`
  Verificación visual:
  ```
  Given que selecciono un rango de fechas sin ventas registradas
  When el reporte se genera
  Then veo el mensaje "Sin movimientos para el período seleccionado", sin ningún error en pantalla
  ```

---

## Fase 8 — Utilidades Transversales y Usabilidad (secc. 5.4 del spec)

- [ ] **F8.1 — formatCurrency.js**
  Archivos: `frontend/src/utils/formatCurrency.js`
  Verificación visual:
  ```
  Given cualquier monto mostrado en el carrito, ticket o reportes
  When se renderiza en pantalla
  Then aparece con el formato `$X,XXX.XX MXN`, consistente en todas las páginas
  ```

- [ ] **F8.2 — formatDate.js**
  Archivos: `frontend/src/utils/formatDate.js`
  Verificación visual:
  ```
  Given cualquier fecha mostrada en tickets, movimientos o reportes
  When se renderiza en pantalla
  Then aparece con el formato `DD/MM/AAAA`, consistente en todas las páginas
  ```

- [ ] **F8.3 — Componente de mensajes de error en lenguaje natural**
  Archivos: `frontend/src/components/common/ErrorMessage.jsx` (o `Toast.jsx`)
  Verificación visual:
  ```
  Given que cualquier llamada a la API falla
  When el error se muestra al usuario
  Then el texto es comprensible en español (ej. "No se pudo guardar el producto") y no contiene códigos técnicos, stack traces ni nombres de tablas
  ```

- [ ] **F8.4 — Soporte de teclado y pantalla táctil en flujo de venta (restricción 5.4)**
  Archivos: `frontend/src/pages/VentasPage.jsx`, `frontend/src/components/ventas/*`
  Verificación visual:
  ```
  Given que navego el flujo completo de venta (agregar producto → cobrar → imprimir) usando solo el teclado (Tab/Enter)
  When completo la venta
  Then lo logro en un máximo de 3 acciones del usuario, sin necesidad de tocar el mouse (RN de usabilidad, secc. 5.4)
  ```

---

## Fase 9 — Pruebas Frontend

- [ ] **F9.1 — Configurar Vitest + React Testing Library**
  Archivos: `frontend/vitest.config.js`, `frontend/package.json`
  Verificación visual:
  ```
  Given que ejecuto `npm test` dentro de `frontend/`
  When corre una prueba dummy de renderizado
  Then la terminal reporta el resultado en verde (passed) sin configuración adicional
  ```

- [ ] **F9.2 — Pruebas de LoginPage**
  Archivos: `frontend/tests/LoginPage.test.jsx`
  Verificación visual:
  ```
  Given una prueba que simula 3 intentos de PIN incorrecto
  When se ejecuta la suite
  Then la prueba confirma que el mensaje "Cuenta bloqueada temporalmente" se renderiza en el DOM
  ```

- [ ] **F9.3 — Pruebas del flujo de venta (CarritoVenta + PanelPago)**
  Archivos: `frontend/tests/VentasPage.test.jsx`
  Verificación visual:
  ```
  Given una prueba que agrega dos productos y paga con monto exacto
  When se ejecuta la suite
  Then la prueba confirma que se renderiza la vista de ticket con el total correcto
  ```

- [ ] **F9.4 — Pruebas de FormCorteZ**
  Archivos: `frontend/tests/FormCorteZ.test.jsx`
  Verificación visual:
  ```
  Given una prueba que declara un efectivo distinto al esperado
  When se ejecuta la suite
  Then la prueba confirma que el componente renderiza la diferencia calculada en pantalla
  ```

---

## Fase 10 — Documentación de Cierre

- [ ] **F10.1 — README del frontend**
  Archivos: `frontend/README.md`
  Verificación visual:
  ```
  Given que un desarrollador nuevo sigue los pasos del README
  When ejecuta `npm install` y `npm run dev`
  Then la aplicación levanta correctamente en el navegador siguiendo únicamente las instrucciones documentadas
  ```

---

## Resumen de Cobertura

| Fase | HU cubiertas | # Tareas |
|---|---|---|
| 0 — Configuración | Restricción 5.4 (base UI) | 8 |
| 1 — Autenticación | HU-01, HU-02 | 6 |
| 2 — Layout general | — | 3 |
| 3 — Productos | HU-03, HU-04, HU-05 | 7 |
| 4 — Punto de venta | HU-06, HU-07, HU-08, HU-09, HU-11 | 12 |
| 5 — Inventario | HU-10, HU-11, HU-12 | 6 |
| 6 — Corte de caja | HU-13, HU-14, HU-15 | 6 |
| 7 — Reportes | HU-16 | 4 |
| 8 — Utilidades/usabilidad | Sección 5.4 | 4 |
| 9 — Pruebas | — | 4 |
| 10 — Documentación | — | 1 |
| **Total** | | **61** |

---

*Fin del documento — v1.0*
