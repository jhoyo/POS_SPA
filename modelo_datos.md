# Modelo de Datos — Sistema POS Spa Facial

**Versión:** 1.0  
**Fecha:** 2026-06-29  
**Base de datos:** SQLite 3  

---

## Diagrama Entidad-Relación

```mermaid
erDiagram

    categorias {
        INTEGER id_categoria PK
        TEXT    nombre
        TEXT    descripcion
        INTEGER activo
        TEXT    creado_en
    }

    usuarios {
        INTEGER id_usuario PK
        TEXT    nombre
        TEXT    usuario
        TEXT    pin_hash
        TEXT    rol
        INTEGER activo
        INTEGER intentos_fallidos
        TEXT    bloqueado_hasta
        TEXT    creado_en
        TEXT    actualizado_en
    }

    productos {
        INTEGER id_producto    PK
        TEXT    sku            UK
        TEXT    codigo_barras  UK
        TEXT    nombre
        TEXT    descripcion
        INTEGER id_categoria   FK
        REAL    precio_venta
        REAL    costo_unitario
        TEXT    unidad_medida
        INTEGER stock_actual
        INTEGER stock_minimo
        INTEGER activo
        TEXT    creado_en
        TEXT    actualizado_en
    }

    apertura_caja {
        INTEGER id_apertura       PK
        INTEGER id_usuario        FK
        INTEGER id_usuario_autorizo FK
        REAL    fondo_inicial
        TEXT    fecha_apertura
        TEXT    estado
        TEXT    observaciones
    }

    ventas {
        INTEGER id_venta           PK
        INTEGER folio              UK
        INTEGER id_apertura        FK
        INTEGER id_cajero          FK
        TEXT    fecha_hora
        REAL    subtotal
        REAL    iva
        REAL    descuento_total
        REAL    total
        REAL    cambio
        TEXT    estado
        INTEGER ticket_impreso
        INTEGER id_cajero_cancela  FK
        TEXT    fecha_cancelacion
        TEXT    motivo_cancelacion
        TEXT    creado_en
    }

    detalle_venta {
        INTEGER id_detalle      PK
        INTEGER id_venta        FK
        INTEGER id_producto     FK
        TEXT    nombre_producto
        REAL    precio_unitario
        INTEGER cantidad
        REAL    descuento_pct
        REAL    descuento_monto
        REAL    subtotal
        REAL    iva_linea
    }

    pagos_venta {
        INTEGER id_pago     PK
        INTEGER id_venta    FK
        TEXT    forma_pago
        REAL    monto
        TEXT    referencia
    }

    corte_caja {
        INTEGER id_corte             PK
        INTEGER id_apertura          FK
        INTEGER id_usuario           FK
        TEXT    tipo
        TEXT    fecha_hora
        REAL    total_efectivo
        REAL    total_tarjeta
        REAL    total_transferencia
        REAL    total_ventas
        REAL    total_descuentos
        INTEGER num_transacciones
        INTEGER num_cancelaciones
        REAL    fondo_inicial
        REAL    efectivo_esperado
        REAL    efectivo_declarado
        REAL    diferencia
        TEXT    observaciones
    }

    movimientos_inventario {
        INTEGER id_movimiento   PK
        INTEGER id_producto     FK
        INTEGER id_usuario      FK
        INTEGER id_venta        FK
        TEXT    tipo
        INTEGER cantidad
        REAL    costo_unitario
        INTEGER stock_anterior
        INTEGER stock_posterior
        TEXT    motivo
        TEXT    fecha_hora
    }

    log_auditoria {
        INTEGER id_log          PK
        INTEGER id_usuario      FK
        TEXT    accion
        TEXT    descripcion
        TEXT    tabla_afectada
        INTEGER id_registro
        TEXT    fecha_hora
    }

    configuracion {
        TEXT clave   PK
        TEXT valor
        TEXT descripcion
    }

    %% ── Relaciones ───────────────────────────────────────────────

    categorias          ||--o{ productos              : "clasifica"
    usuarios            ||--o{ apertura_caja          : "abre"
    usuarios            ||--o{ apertura_caja          : "autoriza"
    apertura_caja       ||--o{ ventas                 : "contiene"
    usuarios            ||--o{ ventas                 : "registra"
    usuarios            ||--o{ ventas                 : "cancela"
    ventas              ||--|{ detalle_venta           : "tiene"
    ventas              ||--|{ pagos_venta             : "se paga con"
    productos           ||--o{ detalle_venta           : "aparece en"
    apertura_caja       ||--o{ corte_caja              : "genera"
    usuarios            ||--o{ corte_caja              : "realiza"
    productos           ||--o{ movimientos_inventario  : "registra"
    usuarios            ||--o{ movimientos_inventario  : "ejecuta"
    ventas              ||--o{ movimientos_inventario  : "origina"
    usuarios            ||--o{ log_auditoria           : "genera"
```

---

## Descripción de Tablas

### `categorias`
Agrupación de productos (ej. Hidratantes, Exfoliantes, Aceites). Permite filtros en el catálogo y reportes por categoría.

### `usuarios`
Usuarios del sistema con roles `administrador`, `cajero` y `esteticista`. El `pin_hash` almacena el hash del PIN numérico (bcrypt/Argon2). `intentos_fallidos` y `bloqueado_hasta` soportan la política de bloqueo de HU-01.

### `productos`
Catálogo completo. `precio_venta` incluye IVA (RN-01). El `nombre_producto` se copia en `detalle_venta` al momento de la venta para preservar el historial aunque cambie el nombre (HU-04). `stock_actual` se actualiza vía trigger o lógica de aplicación al confirmar una venta.

### `apertura_caja`
Representa un turno de caja. Una apertura en estado `abierta` debe existir para poder registrar ventas (RN-02). `id_usuario_autorizo` registra al administrador que aprobó una apertura forzada.

### `ventas`
Encabezado de cada transacción. `folio` es consecutivo e irrepetible (RN-08). `subtotal` es el monto sin IVA; `iva` es el desglose; `total` = subtotal + iva − descuento_total. Los campos de cancelación solo se llenan cuando `estado = 'cancelada'`.

### `detalle_venta`
Una fila por producto vendido. Guarda un **snapshot** de `nombre_producto` y `precio_unitario` en el momento de la venta para que el historial no cambie si se editan los datos del producto (HU-04).

### `pagos_venta`
Permite pagos mixtos (HU-06). Cada fila representa un método de pago aplicado a la venta. La suma de `monto` de todas las filas ≥ `ventas.total`.

### `corte_caja`
Registra tanto cortes parciales (tipo `X`) como cierres definitivos (tipo `Z`). `efectivo_esperado` = `fondo_inicial` + `total_efectivo` − cambios entregados. `diferencia` = `efectivo_declarado` − `efectivo_esperado` (positivo = sobrante, negativo = faltante). Solo el corte Z cierra la `apertura_caja` (RN-05).

### `movimientos_inventario`
Bitácora inmutable de cada cambio de stock. `tipo` puede ser `entrada`, `venta`, `ajuste_positivo` o `ajuste_negativo`. `id_venta` es nulo para entradas y ajustes manuales. Conserva `stock_anterior` y `stock_posterior` para trazabilidad completa (HU-12).

### `log_auditoria`
Registro inmutable de acciones críticas: cancelaciones, descuentos fuera de límite, ajustes de inventario, reimpresiones tardías. No expuesto al rol cajero (sec. 5.3).

### `configuracion`
Tabla clave-valor para parámetros del negocio: nombre del spa, RFC, dirección, tasa de IVA, descuento máximo sin autorización, logo, etc. (restricción 5.6).

---

## Notas de Diseño

| Decisión | Justificación |
|---|---|
| `precio_venta` como `REAL` | Suficiente precisión para montos < $1,000,000 MXN. Para mayor rigor financiero usar `INTEGER` de centavos. |
| Snapshot en `detalle_venta` | Cumple HU-04: el historial no se altera al editar nombre o precio del producto. |
| `pagos_venta` separada | Soporta pagos mixtos (HU-06) sin columnas nullable ni diseño rígido en `ventas`. |
| `stock_actual` en `productos` | Desnormalización intencional para consultas O(1) de stock. `movimientos_inventario` es la fuente verdadera para reconstruirlo. |
| `folio` como `INTEGER UNIQUE` | Permite verificación de secuencia con `MAX(folio)` sin depender del autoincrement de `id_venta`. |
| Fechas como `TEXT` ISO-8601 | SQLite no tiene tipo DATE nativo; `TEXT` con formato `YYYY-MM-DD HH:MM:SS` es ordenable y comparable. |
