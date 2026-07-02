# Especificación de Requerimientos — Sistema POS para Spa Facial

**Versión:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Borrador  

---

## 1. Visión General del Sistema

Sistema de Punto de Venta (POS) orientado a spas faciales que integra la gestión de ventas, control de inventario de productos cosméticos y de consumo, y el cierre de caja diario. El sistema permite al personal registrar ventas rápidas, mantener el stock actualizado y generar reportes de corte de caja al final de cada turno o día.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Cajero** | Registra ventas, aplica descuentos autorizados, realiza el corte de caja. |
| **Esteticista** | Consulta disponibilidad de productos para uso en servicio; no registra ventas. |
| **Administrador** | Gestión total: productos, precios, usuarios, reportes, configuración del sistema. |
| **Sistema** | Procesos automáticos: alertas de stock bajo, cálculo de IVA, cierre automático de turno. |

---

## 3. Módulos del Sistema

1. Autenticación y gestión de usuarios
2. Catálogo de productos
3. Punto de venta (registro de ventas)
4. Control de inventario
5. Corte de caja
6. Reportes

---

## 4. Historias de Usuario y Criterios de Aceptación

### 4.1 Módulo: Autenticación

---

#### HU-01 — Inicio de sesión con PIN

**Como** cajero o administrador,  
**quiero** iniciar sesión con mi usuario y PIN numérico,  
**para** acceder al sistema de forma rápida durante el turno.

**Criterios de aceptación:**

```
Given que estoy en la pantalla de inicio
When ingreso un usuario y PIN válidos
Then el sistema me redirige al módulo correspondiente a mi rol

Given que ingreso un PIN incorrecto 3 veces consecutivas
When el tercer intento falla
Then el sistema bloquea mi cuenta por 5 minutos y muestra el mensaje "Cuenta bloqueada temporalmente"

Given que soy administrador y accedo desde la pantalla principal
When ingreso mis credenciales
Then tengo acceso al menú de administración; el cajero no ve ese menú
```

---

#### HU-02 — Cierre de sesión automático por inactividad

**Como** administrador del negocio,  
**quiero** que el sistema cierre la sesión si no hay actividad por 10 minutos,  
**para** proteger el acceso no autorizado a la caja.

**Criterios de aceptación:**

```
Given que el cajero dejó abierta la sesión sin actividad
When transcurren 10 minutos sin interacción
Then el sistema bloquea la pantalla y solicita el PIN para reanudar

Given que el cajero estaba en medio de una venta al bloquearse
When ingresa el PIN y reanuda la sesión
Then la venta en curso permanece intacta y puede continuar
```

---

### 4.2 Módulo: Catálogo de Productos

---

#### HU-03 — Registro de producto

**Como** administrador,  
**quiero** registrar nuevos productos con nombre, código de barras, precio, categoría y unidad de medida,  
**para** mantener un catálogo actualizado de lo que se vende en el spa.

**Criterios de aceptación:**

```
Given que estoy en el formulario de nuevo producto
When ingreso todos los campos obligatorios (nombre, SKU/código, precio de venta, unidad) y confirmo
Then el producto aparece activo en el catálogo y disponible para venta

Given que intento registrar un producto con un código SKU ya existente
When confirmo el formulario
Then el sistema rechaza el registro y muestra "El código de producto ya existe"

Given que dejo el campo de precio en blanco o con valor cero
When intento guardar
Then el sistema muestra el error "El precio de venta debe ser mayor a cero"
```

---

#### HU-04 — Edición de precio y datos de producto

**Como** administrador,  
**quiero** editar el precio y los datos de un producto existente,  
**para** mantener los precios actualizados sin crear un nuevo registro.

**Criterios de aceptación:**

```
Given que busco un producto existente en el catálogo
When modifico el precio y guardo
Then el nuevo precio aplica a partir de la siguiente venta; las ventas anteriores no se alteran

Given que edito el nombre de un producto
When guardo los cambios
Then el historial de ventas previas sigue mostrando el nombre original al momento de la venta

Given que intento desactivar un producto que tiene stock mayor a cero
When confirmo la desactivación
Then el sistema solicita confirmación adicional advirtiendo que aún existe inventario del producto
```

---

#### HU-05 — Búsqueda de producto

**Como** cajero,  
**quiero** buscar un producto por nombre, código de barras o categoría,  
**para** agregarlo rápidamente a una venta.

**Criterios de aceptación:**

```
Given que estoy en el módulo de ventas
When escaneo un código de barras con el lector
Then el producto correspondiente se agrega automáticamente al carrito con cantidad 1

Given que escribo las primeras letras del nombre de un producto
When hay al menos un resultado
Then el sistema muestra una lista filtrada en tiempo real (máx. 0.5 s)

Given que el código escaneado no existe en el catálogo
When el lector envía el código
Then el sistema muestra "Producto no encontrado. ¿Desea registrarlo?" con opción de alta rápida
```

---

### 4.3 Módulo: Punto de Venta (Ventas)

---

#### HU-06 — Registro de una venta

**Como** cajero,  
**quiero** agregar productos al carrito y registrar el cobro con diferentes formas de pago,  
**para** cerrar transacciones de manera eficiente.

**Criterios de aceptación:**

```
Given que el carrito tiene al menos un producto
When selecciono la forma de pago (efectivo, tarjeta, transferencia) e ingreso el monto recibido
Then el sistema calcula el cambio, registra la venta y genera el ticket

Given que la venta se paga con efectivo y el monto ingresado es menor al total
When intento confirmar el pago
Then el sistema muestra el error "Monto insuficiente. Falta $X.XX" y no cierra la venta

Given que una venta se completa exitosamente
When se confirma el cobro
Then el inventario de cada producto vendido se descuenta automáticamente

Given que el cajero aplica más de un método de pago en la misma venta (pago mixto)
When la suma de los montos ingresados cubre el total
Then el sistema acepta la transacción y registra el desglose por método de pago
```

---

#### HU-07 — Cancelación de venta

**Como** cajero,  
**quiero** cancelar una venta antes de confirmar el cobro,  
**para** corregir errores sin afectar el inventario ni la caja.

**Criterios de aceptación:**

```
Given que hay productos en el carrito y aún no se confirma el cobro
When presiono "Cancelar venta" y confirmo la acción
Then el carrito se vacía y no se registra ningún movimiento en inventario ni en caja

Given que una venta ya fue cobrada y entregada al cliente
When el cajero solicita cancelarla
Then solo el administrador puede autorizar la cancelación ingresando su PIN
```

---

#### HU-08 — Aplicar descuento

**Como** cajero,  
**quiero** aplicar un descuento porcentual o en monto fijo a un producto o a la venta completa,  
**para** ofrecer promociones o precio preferencial a clientes frecuentes.

**Criterios de aceptación:**

```
Given que tengo un producto en el carrito
When aplico un descuento porcentual (ej. 10%)
Then el precio del producto se recalcula en pantalla y el subtotal refleja el descuento

Given que un cajero intenta aplicar un descuento mayor al máximo configurado (ej. >20%)
When ingresa el porcentaje
Then el sistema solicita el PIN del administrador para autorizar el descuento

Given que se aplica un descuento a la venta completa
When se genera el ticket
Then el ticket muestra el precio original, el descuento aplicado y el precio final por línea
```

---

#### HU-09 — Reimpresión de ticket

**Como** cajero,  
**quiero** reimprimir el ticket de una venta reciente,  
**para** entregárselo al cliente si el original se perdió o dañó.

**Criterios de aceptación:**

```
Given que busco una venta por número de folio o por fecha/hora
When encuentro el registro y selecciono "Reimprimir"
Then se genera el mismo ticket original con la leyenda "REIMPRESIÓN" visible

Given que intento reimprimir una venta de más de 24 horas
When selecciono la opción
Then el sistema permite la reimpresión pero registra el evento en el log de auditoría
```

---

### 4.4 Módulo: Control de Inventario

---

#### HU-10 — Registro de entrada de mercancía

**Como** administrador,  
**quiero** registrar la recepción de productos de un proveedor,  
**para** actualizar el stock disponible sin necesidad de un conteo manual.

**Criterios de aceptación:**

```
Given que selecciono un producto existente y registro una entrada con cantidad y costo
When guardo el movimiento
Then el stock del producto aumenta en la cantidad indicada y se registra el costo unitario de esa entrada

Given que registro una entrada con cantidad cero o negativa
When intento guardar
Then el sistema rechaza el movimiento con el mensaje "La cantidad debe ser mayor a cero"

Given que registro la entrada de un producto nuevo que aún no existe en el catálogo
When confirmo la entrada
Then el sistema ofrece la opción de crear el producto en el catálogo antes de continuar
```

---

#### HU-11 — Alerta de stock mínimo

**Como** administrador,  
**quiero** recibir una alerta visible cuando el stock de un producto baje del mínimo configurado,  
**para** realizar el pedido al proveedor a tiempo.

**Criterios de aceptación:**

```
Given que el stock de un producto cae por debajo del mínimo configurado
When ocurre la última venta que provoca esa caída
Then el sistema muestra una alerta en el panel del administrador con el nombre del producto y stock actual

Given que el administrador configura el stock mínimo de un producto
When el valor es cero o negativo
Then el sistema rechaza la configuración con el mensaje "El stock mínimo debe ser al menos 1"

Given que el stock de un producto llegó a cero
When un cajero intenta agregar ese producto al carrito
Then el sistema muestra la advertencia "Sin stock disponible" y no lo agrega
```

---

#### HU-12 — Ajuste de inventario

**Como** administrador,  
**quiero** realizar ajustes manuales de inventario (merma, robo, muestra gratis),  
**para** mantener el conteo de stock exacto.

**Criterios de aceptación:**

```
Given que selecciono un producto y registro un ajuste negativo (merma) con motivo
When guardo el ajuste
Then el stock se reduce y queda registrado el motivo, la fecha, la hora y el usuario

Given que el ajuste manual dejaría el stock en negativo
When intento guardar
Then el sistema solicita confirmación explícita con el mensaje "El stock quedará en negativo. ¿Confirmar?"

Given que el administrador consulta el historial de movimientos de un producto
When filtra por tipo "ajuste"
Then ve la lista de todos los ajustes con fecha, cantidad, motivo y usuario que lo realizó
```

---

### 4.5 Módulo: Corte de Caja

---

#### HU-13 — Apertura de caja (fondo inicial)

**Como** cajero,  
**quiero** registrar el fondo inicial de efectivo al empezar el turno,  
**para** que el corte final pueda calcular la diferencia correctamente.

**Criterios de aceptación:**

```
Given que inicio sesión como cajero al principio del turno
When el sistema detecta que no hay caja abierta
Then me solicita registrar el monto del fondo inicial antes de poder realizar ventas

Given que ya hay una caja abierta del turno anterior sin cerrar
When inicio sesión como cajero
Then el sistema muestra una advertencia y requiere que el administrador autorice con PIN para continuar
```

---

#### HU-14 — Corte de caja parcial (X)

**Como** cajero,  
**quiero** generar un corte parcial (corte X) en cualquier momento del turno,  
**para** revisar el estado de la caja sin cerrar las operaciones del día.

**Criterios de aceptación:**

```
Given que solicito el corte X durante el turno
When el sistema procesa la solicitud
Then muestra el resumen de ventas por forma de pago, número de transacciones y monto total acumulado

Given que se genera un corte X
When reviso el reporte
Then el reporte indica claramente "CORTE PARCIAL — NO CIERRA CAJA" y no afecta el estado operativo

Given que se realizan ventas después de un corte X
When genero otro corte X
Then el nuevo corte refleja el acumulado total desde la apertura, no solo desde el último corte X
```

---

#### HU-15 — Corte de caja final (Z)

**Como** cajero o administrador,  
**quiero** realizar el corte de caja final (corte Z) al terminar el turno,  
**para** reconciliar el efectivo físico con las ventas registradas.

**Criterios de aceptación:**

```
Given que solicito el corte Z al final del turno
When el sistema procesa el cierre
Then muestra el total de ventas por forma de pago, el efectivo esperado en caja, el fondo inicial y la diferencia (sobrante/faltante)

Given que el cajero declara el efectivo contado y este no coincide con el esperado
When se confirma el corte Z
Then el sistema registra la diferencia (positiva o negativa) y la asocia al cajero del turno

Given que se realiza el corte Z exitosamente
When el cajero intenta registrar una nueva venta sin abrir caja
Then el sistema bloquea la operación e indica "Debe registrar el fondo para abrir una nueva caja"

Given que se realiza el corte Z
When el administrador consulta los reportes
Then el corte Z aparece en el historial con fecha, hora, cajero, total de ventas y diferencia de caja
```

---

#### HU-16 — Reporte de ventas del día

**Como** administrador,  
**quiero** consultar el reporte de ventas del día agrupado por categoría de producto, por cajero y por forma de pago,  
**para** analizar el desempeño del negocio.

**Criterios de aceptación:**

```
Given que selecciono el reporte diario y el rango de fechas
When el sistema genera el reporte
Then muestra: total de ventas, número de tickets, ticket promedio, desglose por forma de pago y top 5 productos más vendidos

Given que aplico un filtro por cajero específico
When se actualiza el reporte
Then solo muestra las ventas registradas por ese cajero en el periodo seleccionado

Given que el día no tiene ventas registradas
When consulto el reporte
Then el sistema muestra "Sin movimientos para el período seleccionado" sin error
```

---

## 5. Restricciones Técnicas

### 5.1 Plataforma y arquitectura

| Restricción | Detalle |
|---|---|
| Tipo de aplicación | Aplicación de escritorio con capacidad offline-first; la red es deseable pero no obligatoria para operar. |
| Sistema operativo objetivo | Windows 10/11 (64 bits) como plataforma principal. |
| Base de datos | SQLite para operación local. Posibilidad de sincronización con servidor central en versiones futuras. |
| Impresión de tickets | Compatible con impresoras térmicas de 58 mm y 80 mm vía puerto USB/COM o red. |
| Lector de código de barras | Entrada por teclado HID (plug & play, sin driver especial). |

### 5.2 Rendimiento

- El tiempo de respuesta de cualquier búsqueda de producto no debe exceder **500 ms** con un catálogo de hasta 5,000 productos.
- El registro de una venta (desde confirmar cobro hasta imprimir ticket) debe completarse en **menos de 3 segundos**.
- La base de datos debe soportar al menos **2 años de historial de ventas** sin degradación perceptible del rendimiento.

### 5.3 Seguridad

- Las contraseñas/PINs se deben almacenar con hash (bcrypt o Argon2); nunca en texto plano.
- Solo el administrador puede acceder a: configuración del sistema, ajustes de inventario, edición de precios y reportes históricos completos.
- Toda acción crítica (cancelación de venta, descuento fuera de límite, ajuste de inventario) debe quedar registrada en un log de auditoría con usuario, fecha y hora.
- El log de auditoría no puede ser modificado ni eliminado por el cajero.

### 5.4 Usabilidad

- La interfaz de ventas debe ser operable con teclado, ratón y pantalla táctil.
- La navegación entre los pasos de una venta (agregar producto → cobrar → imprimir) debe realizarse con un máximo de **3 acciones del usuario**.
- El sistema debe mostrar mensajes de error en lenguaje natural sin códigos técnicos visibles al usuario final.
- El sistema debe estar disponible en **español (México)**, incluyendo formato de moneda `$X,XXX.XX MXN` y fecha `DD/MM/AAAA`.

### 5.5 Confiabilidad y disponibilidad

- Ante un corte de luz o cierre forzado del sistema, la última venta en curso (no confirmada) puede descartarse, pero no deben perderse ventas ya confirmadas.
- El sistema debe realizar un respaldo automático de la base de datos al inicio de cada jornada (apertura de caja) en una ruta configurable por el administrador.
- En caso de fallo de la impresora, la venta se registra igual y el sistema ofrece reintentar la impresión o marcarla como "ticket no impreso".

### 5.6 Mantenibilidad

- El código debe separar claramente la lógica de negocio de la capa de presentación.
- La configuración del negocio (nombre, RFC, dirección, leyenda del ticket, IVA aplicable) debe estar centralizada en un archivo o tabla de configuración, no dispersa en el código.
- Debe existir un modo de prueba/demo que opere sobre una base de datos separada sin afectar los datos de producción.

---

## 6. Reglas de Negocio Principales

| ID | Regla |
|---|---|
| RN-01 | El precio de venta al público incluye IVA (16%). El sistema debe poder desglosar el IVA para efectos del ticket. |
| RN-02 | No se pueden realizar ventas si la caja no está abierta (fondo inicial registrado). |
| RN-03 | Un producto desactivado no puede ser agregado a nuevas ventas, pero mantiene su historial. |
| RN-04 | El descuento máximo aplicable por un cajero sin autorización es configurable por el administrador (default: 15%). |
| RN-05 | El corte Z cierra definitivamente el turno; no se puede reabrir ni modificar. |
| RN-06 | El stock no puede quedar negativo de forma automática; solo mediante ajuste manual explícito. |
| RN-07 | Cada ticket debe incluir: folio consecutivo, fecha/hora, productos con cantidad y precio, subtotal, IVA desglosado, total, forma de pago y cambio entregado. |
| RN-08 | El folio de ticket es único, consecutivo e irrepetible; no se reinicia con cada turno. |

---

## 7. Glosario

| Término | Definición |
|---|---|
| **Corte X** | Reporte parcial de caja que muestra el estado actual sin cerrar el turno. |
| **Corte Z** | Cierre definitivo de caja del turno; liquida el período y reinicia los acumuladores. |
| **Fondo inicial** | Cantidad de efectivo colocada en caja al inicio del turno para dar cambio. |
| **SKU** | Stock Keeping Unit — código único identificador de un producto. |
| **Merma** | Pérdida de inventario por caducidad, daño o uso en demostración. |
| **Ticket** | Comprobante de venta impreso entregado al cliente. |
| **Folio** | Número consecutivo único asignado a cada ticket de venta. |

---

*Fin del documento — v1.0*
