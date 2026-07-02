-- =============================================================
-- Sistema POS - Spa Facial
-- Script DDL - PostgreSQL 14+
-- Versión: 1.1  |  Fecha: 2026-06-29
-- Migrado desde schema_original.sql (SQLite 3)
-- =============================================================
-- Cambios respecto a la versión SQLite:
--   1.  Eliminados los tres PRAGMA (no existen en PG)
--   2.  AUTOINCREMENT  →  SERIAL
--   3.  COLLATE NOCASE →  tipo CITEXT  (requiere extensión)
--   4.  datetime('now','localtime')  →  NOW()
--   5.  INSERT OR IGNORE  →  ON CONFLICT … DO NOTHING
--   6.  REAL (dinero)  →  NUMERIC(12,2)
--   7.  INTEGER (booleanos activo/ticket_impreso)  →  BOOLEAN
--   8.  TEXT (fechas)  →  TIMESTAMPTZ
--   9.  CHECK … IN (…) en columnas de dominio  →  tipos ENUM
--   10. CREATE VIEW IF NOT EXISTS  →  CREATE OR REPLACE VIEW
--   11. GROUP BY de v_resumen_turno ampliado (obligatorio en PG)
-- =============================================================

-- FK se activan por defecto en PostgreSQL; no necesita PRAGMA.

-- =============================================================
-- EXTENSIÓN: texto sin distinción mayúsculas/minúsculas
-- =============================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- =============================================================
-- TIPOS ENUMERADOS
--   Sustituyen los CHECK (col IN (...)) del esquema SQLite.
--   El bloque DO evita error si el tipo ya existe.
-- =============================================================

DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('administrador', 'cajero', 'esteticista');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE estado_caja AS ENUM ('abierta', 'cerrada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE estado_venta AS ENUM ('completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_corte AS ENUM ('X', 'Z');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE forma_pago_tipo AS ENUM ('efectivo', 'tarjeta', 'transferencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimiento AS ENUM
        ('entrada', 'venta', 'ajuste_positivo', 'ajuste_negativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- 1. CONFIGURACION
-- =============================================================

CREATE TABLE IF NOT EXISTS configuracion (
    clave        TEXT PRIMARY KEY,
    valor        TEXT NOT NULL,
    descripcion  TEXT
);

INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('negocio_nombre',          'Spa Facial',              'Razón social o nombre comercial'),
    ('negocio_rfc',             'XAXX010101000',           'RFC del negocio'),
    ('negocio_direccion',       '',                        'Dirección fiscal'),
    ('negocio_telefono',        '',                        'Teléfono de contacto'),
    ('ticket_leyenda',          '¡Gracias por su visita!', 'Leyenda al pie del ticket'),
    ('iva_porcentaje',          '16',                      'Tasa de IVA aplicada (%)'),
    ('descuento_maximo_cajero', '15',                      'Descuento máximo (%) sin autorización de admin'),
    ('inactividad_minutos',     '10',                      'Minutos de inactividad antes de bloquear sesión'),
    ('intentos_pin_maximo',     '3',                       'Intentos fallidos antes de bloquear cuenta'),
    ('bloqueo_minutos',         '5',                       'Minutos de bloqueo tras intentos fallidos'),
    ('backup_ruta',             '',                        'Ruta para respaldo automático de la BD')
ON CONFLICT (clave) DO NOTHING;

-- =============================================================
-- 2. CATEGORIAS
-- =============================================================

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  SERIAL      PRIMARY KEY,
    nombre        CITEXT      NOT NULL UNIQUE,          -- CITEXT: unicidad y búsqueda sin distinción may/min
    descripcion   TEXT,
    activo        BOOLEAN     NOT NULL DEFAULT TRUE,    -- era INTEGER CHECK (IN (0,1))
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()    -- era TEXT con datetime('now','localtime')
);

-- =============================================================
-- 3. USUARIOS
-- =============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario        SERIAL      PRIMARY KEY,
    nombre            TEXT        NOT NULL,
    usuario           CITEXT      NOT NULL UNIQUE,      -- login sin distinción de mayúsculas
    pin_hash          TEXT        NOT NULL,             -- bcrypt / Argon2; NUNCA texto plano
    rol               rol_usuario NOT NULL,             -- era TEXT CHECK (IN (...))
    activo            BOOLEAN     NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER     NOT NULL DEFAULT 0    CHECK (intentos_fallidos >= 0),
    bloqueado_hasta   TIMESTAMPTZ,                      -- era TEXT ISO-8601
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ
);

-- Usuario administrador inicial (PIN: 0000 — cambiar en primer uso)
INSERT INTO usuarios (nombre, usuario, pin_hash, rol)
    VALUES ('Administrador', 'admin', 'CAMBIAR_HASH_EN_PRIMER_USO', 'administrador')
ON CONFLICT (usuario) DO NOTHING;

-- =============================================================
-- 4. PRODUCTOS
-- =============================================================

CREATE TABLE IF NOT EXISTS productos (
    id_producto     SERIAL        PRIMARY KEY,
    sku             CITEXT        NOT NULL UNIQUE,
    codigo_barras   TEXT          UNIQUE,
    nombre          CITEXT        NOT NULL,
    descripcion     TEXT,
    id_categoria    INTEGER       REFERENCES categorias(id_categoria)
                                      ON UPDATE CASCADE
                                      ON DELETE SET NULL,
    precio_venta    NUMERIC(12,2) NOT NULL  CHECK (precio_venta > 0),   -- con IVA (RN-01)
    costo_unitario  NUMERIC(12,2) NOT NULL  DEFAULT 0  CHECK (costo_unitario >= 0),
    unidad_medida   TEXT          NOT NULL  DEFAULT 'pieza',
    stock_actual    INTEGER       NOT NULL  DEFAULT 0,
    stock_minimo    INTEGER       NOT NULL  DEFAULT 1   CHECK (stock_minimo >= 1),
    activo          BOOLEAN       NOT NULL  DEFAULT TRUE,
    creado_en       TIMESTAMPTZ   NOT NULL  DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_productos_sku           ON productos (sku);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos (codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_nombre        ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria     ON productos (id_categoria);

-- =============================================================
-- 5. APERTURA_CAJA
-- =============================================================

CREATE TABLE IF NOT EXISTS apertura_caja (
    id_apertura          SERIAL        PRIMARY KEY,
    id_usuario           INTEGER       NOT NULL
                             REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    id_usuario_autorizo  INTEGER
                             REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    fondo_inicial        NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (fondo_inicial >= 0),
    fecha_apertura       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    estado               estado_caja   NOT NULL DEFAULT 'abierta',
    observaciones        TEXT
);

CREATE INDEX IF NOT EXISTS idx_apertura_estado ON apertura_caja (estado);

-- =============================================================
-- 6. VENTAS
-- =============================================================

CREATE TABLE IF NOT EXISTS ventas (
    id_venta            SERIAL        PRIMARY KEY,
    folio               INTEGER       NOT NULL UNIQUE,           -- consecutivo irrepetible (RN-08)
    id_apertura         INTEGER       NOT NULL
                            REFERENCES apertura_caja(id_apertura) ON UPDATE CASCADE,
    id_cajero           INTEGER       NOT NULL
                            REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    fecha_hora          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    subtotal            NUMERIC(12,2) NOT NULL  CHECK (subtotal >= 0),
    iva                 NUMERIC(12,2) NOT NULL  CHECK (iva >= 0),
    descuento_total     NUMERIC(12,2) NOT NULL  DEFAULT 0  CHECK (descuento_total >= 0),
    total               NUMERIC(12,2) NOT NULL  CHECK (total >= 0),
    cambio              NUMERIC(12,2) NOT NULL  DEFAULT 0  CHECK (cambio >= 0),
    estado              estado_venta  NOT NULL  DEFAULT 'completada',
    ticket_impreso      BOOLEAN       NOT NULL  DEFAULT TRUE,
    id_cajero_cancela   INTEGER       REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    fecha_cancelacion   TIMESTAMPTZ,
    motivo_cancelacion  TEXT,
    creado_en           TIMESTAMPTZ   NOT NULL  DEFAULT NOW(),

    -- Si la venta se cancela, deben existir los campos de cancelación
    CONSTRAINT chk_cancelacion CHECK (
        (estado = 'completada') OR
        (estado = 'cancelada'
            AND id_cajero_cancela IS NOT NULL
            AND fecha_cancelacion IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_ventas_folio    ON ventas (folio);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha    ON ventas (fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_apertura ON ventas (id_apertura);
CREATE INDEX IF NOT EXISTS idx_ventas_cajero   ON ventas (id_cajero);
CREATE INDEX IF NOT EXISTS idx_ventas_estado   ON ventas (estado);

-- =============================================================
-- 7. DETALLE_VENTA
-- =============================================================

CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle      SERIAL        PRIMARY KEY,
    id_venta        INTEGER       NOT NULL
                        REFERENCES ventas(id_venta)     ON UPDATE CASCADE ON DELETE CASCADE,
    id_producto     INTEGER       NOT NULL
                        REFERENCES productos(id_producto) ON UPDATE CASCADE,
    -- snapshot al momento de la venta; aísla el historial de cambios al catálogo (HU-04)
    nombre_producto TEXT          NOT NULL,
    precio_unitario NUMERIC(12,2) NOT NULL  CHECK (precio_unitario > 0),
    cantidad        INTEGER       NOT NULL  CHECK (cantidad > 0),
    descuento_pct   NUMERIC(5,2)  NOT NULL  DEFAULT 0  CHECK (descuento_pct  BETWEEN 0 AND 100),
    descuento_monto NUMERIC(12,2) NOT NULL  DEFAULT 0  CHECK (descuento_monto >= 0),
    subtotal        NUMERIC(12,2) NOT NULL  CHECK (subtotal >= 0),
    iva_linea       NUMERIC(12,2) NOT NULL  DEFAULT 0  CHECK (iva_linea >= 0)
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta    ON detalle_venta (id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_venta (id_producto);

-- =============================================================
-- 8. PAGOS_VENTA
-- =============================================================

CREATE TABLE IF NOT EXISTS pagos_venta (
    id_pago     SERIAL          PRIMARY KEY,
    id_venta    INTEGER         NOT NULL
                    REFERENCES ventas(id_venta) ON UPDATE CASCADE ON DELETE CASCADE,
    forma_pago  forma_pago_tipo NOT NULL,
    monto       NUMERIC(12,2)   NOT NULL  CHECK (monto > 0),
    referencia  TEXT
);

CREATE INDEX IF NOT EXISTS idx_pagos_venta ON pagos_venta (id_venta);

-- =============================================================
-- 9. CORTE_CAJA
-- =============================================================

CREATE TABLE IF NOT EXISTS corte_caja (
    id_corte             SERIAL        PRIMARY KEY,
    id_apertura          INTEGER       NOT NULL
                             REFERENCES apertura_caja(id_apertura) ON UPDATE CASCADE,
    id_usuario           INTEGER       NOT NULL
                             REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    tipo                 tipo_corte    NOT NULL,
    fecha_hora           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    total_efectivo       NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (total_efectivo >= 0),
    total_tarjeta        NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (total_tarjeta >= 0),
    total_transferencia  NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (total_transferencia >= 0),
    total_ventas         NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (total_ventas >= 0),
    total_descuentos     NUMERIC(12,2) NOT NULL DEFAULT 0  CHECK (total_descuentos >= 0),
    num_transacciones    INTEGER       NOT NULL DEFAULT 0  CHECK (num_transacciones >= 0),
    num_cancelaciones    INTEGER       NOT NULL DEFAULT 0  CHECK (num_cancelaciones >= 0),
    fondo_inicial        NUMERIC(12,2) NOT NULL DEFAULT 0,
    efectivo_esperado    NUMERIC(12,2) NOT NULL DEFAULT 0,
    efectivo_declarado   NUMERIC(12,2),
    diferencia           NUMERIC(12,2),
    observaciones        TEXT,

    -- Corte Z requiere declaración y diferencia de efectivo
    CONSTRAINT chk_corte_z CHECK (
        (tipo = 'X') OR
        (tipo = 'Z'
            AND efectivo_declarado IS NOT NULL
            AND diferencia         IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_corte_apertura ON corte_caja (id_apertura);
CREATE INDEX IF NOT EXISTS idx_corte_tipo     ON corte_caja (tipo);
CREATE INDEX IF NOT EXISTS idx_corte_fecha    ON corte_caja (fecha_hora);

-- =============================================================
-- 10. MOVIMIENTOS_INVENTARIO
-- =============================================================

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento   SERIAL          PRIMARY KEY,
    id_producto     INTEGER         NOT NULL
                        REFERENCES productos(id_producto) ON UPDATE CASCADE,
    id_usuario      INTEGER         NOT NULL
                        REFERENCES usuarios(id_usuario)   ON UPDATE CASCADE,
    id_venta        INTEGER
                        REFERENCES ventas(id_venta)       ON UPDATE CASCADE,
    tipo            tipo_movimiento NOT NULL,
    cantidad        INTEGER         NOT NULL  CHECK (cantidad > 0),
    costo_unitario  NUMERIC(12,2),
    stock_anterior  INTEGER         NOT NULL,
    stock_posterior INTEGER         NOT NULL,
    motivo          TEXT,
    fecha_hora      TIMESTAMPTZ     NOT NULL  DEFAULT NOW(),

    CONSTRAINT chk_ajuste_motivo CHECK (
        (tipo IN ('entrada', 'venta')) OR
        (tipo IN ('ajuste_positivo', 'ajuste_negativo') AND motivo IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos_inventario (id_producto);
CREATE INDEX IF NOT EXISTS idx_mov_fecha    ON movimientos_inventario (fecha_hora);
CREATE INDEX IF NOT EXISTS idx_mov_tipo     ON movimientos_inventario (tipo);
CREATE INDEX IF NOT EXISTS idx_mov_venta    ON movimientos_inventario (id_venta);

-- =============================================================
-- 11. LOG_AUDITORIA
-- =============================================================

CREATE TABLE IF NOT EXISTS log_auditoria (
    id_log          SERIAL      PRIMARY KEY,
    id_usuario      INTEGER     REFERENCES usuarios(id_usuario) ON UPDATE CASCADE,
    accion          TEXT        NOT NULL,
    descripcion     TEXT        NOT NULL,
    tabla_afectada  TEXT,
    id_registro     INTEGER,
    fecha_hora      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_usuario ON log_auditoria (id_usuario);
CREATE INDEX IF NOT EXISTS idx_log_accion  ON log_auditoria (accion);
CREATE INDEX IF NOT EXISTS idx_log_fecha   ON log_auditoria (fecha_hora);

-- =============================================================
-- VISTAS DE UTILIDAD
--   CREATE OR REPLACE VIEW en lugar de CREATE VIEW IF NOT EXISTS
-- =============================================================

-- V1: Productos con stock igual o por debajo del mínimo
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT
    p.id_producto,
    p.sku,
    p.nombre,
    c.nombre                           AS categoria,
    p.stock_actual,
    p.stock_minimo,
    (p.stock_actual - p.stock_minimo)  AS diferencia
FROM productos p
LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
WHERE p.activo = TRUE                  -- era activo = 1
  AND p.stock_actual <= p.stock_minimo
ORDER BY diferencia;

-- V2: Resumen acumulado de ventas por turno (corte X/Z)
--   GROUP BY incluye todas las columnas no-agregadas (obligatorio en PG).
--   Se renombra el alias de pagos_venta a 'pv' para evitar ambigüedad.
CREATE OR REPLACE VIEW v_resumen_turno AS
SELECT
    a.id_apertura,
    a.fecha_apertura,
    u.nombre                                                                    AS cajero,
    COUNT(CASE WHEN v.estado = 'completada' THEN 1 END)                        AS num_ventas,
    COUNT(CASE WHEN v.estado = 'cancelada'  THEN 1 END)                        AS num_cancelaciones,
    COALESCE(SUM(CASE WHEN v.estado = 'completada' THEN v.total            ELSE 0 END), 0) AS total_ventas,
    COALESCE(SUM(CASE WHEN v.estado = 'completada' THEN v.iva              ELSE 0 END), 0) AS total_iva,
    COALESCE(SUM(CASE WHEN v.estado = 'completada' THEN v.descuento_total  ELSE 0 END), 0) AS total_descuentos,
    COALESCE(SUM(CASE WHEN pv.forma_pago = 'efectivo'      AND v.estado = 'completada' THEN pv.monto ELSE 0 END), 0) AS total_efectivo,
    COALESCE(SUM(CASE WHEN pv.forma_pago = 'tarjeta'       AND v.estado = 'completada' THEN pv.monto ELSE 0 END), 0) AS total_tarjeta,
    COALESCE(SUM(CASE WHEN pv.forma_pago = 'transferencia' AND v.estado = 'completada' THEN pv.monto ELSE 0 END), 0) AS total_transferencia
FROM apertura_caja a
JOIN  usuarios     u  ON a.id_usuario  = u.id_usuario
LEFT JOIN ventas   v  ON v.id_apertura = a.id_apertura
LEFT JOIN pagos_venta pv ON pv.id_venta = v.id_venta
GROUP BY
    a.id_apertura,     -- PK → determina a.fecha_apertura funcionalmente
    a.fecha_apertura,  -- explícita para compatibilidad con PG < 14
    u.id_usuario,      -- PK → determina u.nombre funcionalmente
    u.nombre;          -- explícita para compatibilidad con PG < 14

-- V3: Detalle completo de ticket (reimpresión)
--   Se elimina ORDER BY del cuerpo de la vista; agrégala en la consulta
--   que consuma la vista para resultados predecibles.
CREATE OR REPLACE VIEW v_ticket AS
SELECT
    v.id_venta,
    v.folio,
    v.fecha_hora,
    u.nombre                AS cajero,
    d.id_detalle,
    d.nombre_producto,
    d.cantidad,
    d.precio_unitario,
    d.descuento_pct,
    d.descuento_monto,
    d.subtotal              AS subtotal_linea,
    d.iva_linea,
    v.subtotal              AS subtotal_venta,
    v.iva                   AS iva_venta,
    v.descuento_total,
    v.total,
    v.cambio,
    v.estado,
    v.ticket_impreso
FROM ventas v
JOIN usuarios u      ON v.id_cajero  = u.id_usuario
JOIN detalle_venta d ON d.id_venta   = v.id_venta;

-- =============================================================
-- FIN DEL SCRIPT
-- =============================================================
