-- =====================================================================
-- Funciones y tablas auxiliares requeridas por el backend
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla de sesiones (soporta logout inmediato y expiración por inactividad)
-- ---------------------------------------------------------------------
create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  id_usuario integer not null references usuarios(id_usuario),
  token_hash text not null unique,
  fecha_inicio timestamptz not null default now(),
  ultima_actividad timestamptz not null default now(),
  activa boolean not null default true
);

create index if not exists idx_sesiones_token_hash on sesiones(token_hash);

-- ---------------------------------------------------------------------
-- Contador atómico para folios consecutivos de venta (RN-08)
-- ---------------------------------------------------------------------
create table if not exists contadores (
  nombre text primary key,
  valor bigint not null default 0
);

insert into contadores (nombre, valor)
values ('folio_venta', 0)
on conflict (nombre) do nothing;

create or replace function fn_generar_folio()
returns bigint
language plpgsql
as $$
declare
  nuevo_valor bigint;
begin
  update contadores
    set valor = valor + 1
    where nombre = 'folio_venta'
    returning valor into nuevo_valor;
  return nuevo_valor;
end;
$$;

-- ---------------------------------------------------------------------
-- Creación atómica de una venta completa (cabecera + detalle + pagos + stock)
-- ---------------------------------------------------------------------
-- Postgres identifica las funciones por nombre + tipos de parámetros: al agregar
-- p_cambio, "create or replace" NO sustituye la firma anterior de 8 argumentos,
-- crea una segunda función sobrecargada. Hay que eliminar la versión vieja primero.
drop function if exists fn_crear_venta(integer, integer, numeric, numeric, numeric, numeric, jsonb, jsonb);

create or replace function fn_crear_venta(
  p_id_cajero integer,
  p_id_apertura_caja integer,
  p_subtotal numeric,
  p_iva numeric,
  p_descuento numeric,
  p_total numeric,
  p_cambio numeric,
  p_detalles jsonb,
  p_pagos jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_id_venta integer;
  v_folio bigint;
  v_item jsonb;
  v_pago jsonb;
  v_stock_actual numeric;
  v_nombre_producto text;
  v_id_producto integer;
  v_cantidad numeric;
begin
  v_folio := fn_generar_folio();

  insert into ventas (folio, id_cajero, id_apertura, subtotal, iva, descuento_total, total, cambio, estado, fecha_hora)
  values (v_folio, p_id_cajero, p_id_apertura_caja, p_subtotal, p_iva, p_descuento, p_total, p_cambio, 'completada', now())
  returning id_venta into v_id_venta;

  for v_item in select * from jsonb_array_elements(p_detalles)
  loop
    v_id_producto := (v_item->>'id_producto')::integer;
    v_cantidad := (v_item->>'cantidad')::numeric;

    select stock_actual, nombre into v_stock_actual, v_nombre_producto
      from productos
      where id_producto = v_id_producto
      for update;

    if v_stock_actual is null then
      raise exception 'Producto % no existe', v_id_producto;
    end if;

    if v_stock_actual < v_cantidad then
      raise exception 'Sin stock disponible para el producto %', v_id_producto;
    end if;

    insert into detalle_venta (
      id_venta, id_producto, nombre_producto, precio_unitario, cantidad, descuento_monto, subtotal, iva_linea
    )
    values (
      v_id_venta,
      v_id_producto,
      v_nombre_producto,
      (v_item->>'precio_unitario')::numeric,
      v_cantidad,
      coalesce((v_item->>'descuento')::numeric, 0),
      (v_item->>'subtotal')::numeric,
      (v_item->>'iva')::numeric
    );

    update productos
      set stock_actual = stock_actual - v_cantidad
      where id_producto = v_id_producto;

    insert into movimientos_inventario (
      id_producto, id_usuario, id_venta, tipo, cantidad, stock_anterior, stock_posterior, motivo, fecha_hora
    )
    values (
      v_id_producto, p_id_cajero, v_id_venta, 'venta', v_cantidad,
      v_stock_actual, v_stock_actual - v_cantidad, 'Venta folio ' || v_folio, now()
    );
  end loop;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into pagos_venta (id_venta, forma_pago, monto)
    values (v_id_venta, (v_pago->>'forma_pago')::forma_pago_tipo, (v_pago->>'monto')::numeric);
  end loop;

  return jsonb_build_object('id', v_id_venta, 'folio', v_folio);
end;
$$;

-- ---------------------------------------------------------------------
-- Cancelación atómica de una venta (revierte stock)
-- ---------------------------------------------------------------------
create or replace function fn_cancelar_venta(
  p_id_venta integer,
  p_id_cajero_cancela integer,
  p_motivo text
)
returns void
language plpgsql
as $$
declare
  v_estado text;
  v_detalle record;
  v_stock_actual numeric;
begin
  select estado into v_estado from ventas where id_venta = p_id_venta for update;

  if v_estado is null then
    raise exception 'La venta no existe';
  end if;

  if v_estado = 'cancelada' then
    raise exception 'La venta ya se encuentra cancelada';
  end if;

  update ventas
    set estado = 'cancelada',
        id_cajero_cancela = p_id_cajero_cancela,
        fecha_cancelacion = now(),
        motivo_cancelacion = p_motivo
    where id_venta = p_id_venta;

  for v_detalle in select id_producto, cantidad from detalle_venta where id_venta = p_id_venta
  loop
    select stock_actual into v_stock_actual from productos where id_producto = v_detalle.id_producto for update;

    update productos
      set stock_actual = stock_actual + v_detalle.cantidad
      where id_producto = v_detalle.id_producto;

    -- tipo_movimiento no tiene un valor 'cancelacion'; se registra como ajuste_positivo
    -- (motivo y id_venta dejan trazabilidad de que el origen fue una cancelación)
    insert into movimientos_inventario (
      id_producto, id_usuario, id_venta, tipo, cantidad, stock_anterior, stock_posterior, motivo, fecha_hora
    )
    values (
      v_detalle.id_producto, p_id_cajero_cancela, p_id_venta, 'ajuste_positivo', v_detalle.cantidad,
      v_stock_actual, v_stock_actual + v_detalle.cantidad, 'Cancelación venta ' || p_id_venta, now()
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Registro atómico de movimiento de inventario (entrada / ajuste)
-- ---------------------------------------------------------------------
create or replace function fn_registrar_movimiento_inventario(
  p_id_producto integer,
  p_tipo text,
  p_cantidad numeric,
  p_motivo text,
  p_id_usuario integer,
  p_costo_unitario numeric default null
)
returns jsonb
language plpgsql
as $$
declare
  v_stock_actual numeric;
  v_delta numeric;
  v_stock_posterior numeric;
begin
  select stock_actual into v_stock_actual from productos where id_producto = p_id_producto for update;

  if v_stock_actual is null then
    raise exception 'El producto no existe';
  end if;

  if p_tipo = 'entrada' or p_tipo = 'ajuste_positivo' then
    v_delta := p_cantidad;
  elsif p_tipo = 'ajuste_negativo' then
    v_delta := -p_cantidad;
  else
    raise exception 'Tipo de movimiento inválido: %', p_tipo;
  end if;

  if (v_stock_actual + v_delta) < 0 then
    raise exception 'STOCK_INSUFICIENTE';
  end if;

  v_stock_posterior := v_stock_actual + v_delta;

  update productos set stock_actual = v_stock_posterior where id_producto = p_id_producto;

  insert into movimientos_inventario (
    id_producto, id_usuario, tipo, cantidad, costo_unitario, stock_anterior, stock_posterior, motivo, fecha_hora
  )
  values (
    p_id_producto, p_id_usuario, p_tipo::tipo_movimiento, p_cantidad, p_costo_unitario, v_stock_actual, v_stock_posterior, p_motivo, now()
  );

  return jsonb_build_object('stock_actual', v_stock_posterior);
end;
$$;
