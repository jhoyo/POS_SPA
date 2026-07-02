import { supabase } from '../config/supabase-client.js';

// Crea la venta completa (cabecera + detalle + pagos + descuento de stock) en una sola
// transacción, delegando la atomicidad a la función de Postgres fn_crear_venta.
async function crearVentaCompleta({ idCajero, idAperturaCaja, subtotal, iva, descuento, total, cambio, detalles, pagos }) {
  const { data, error } = await supabase.rpc('fn_crear_venta', {
    p_id_cajero: idCajero,
    p_id_apertura_caja: idAperturaCaja,
    p_subtotal: subtotal,
    p_iva: iva,
    p_descuento: descuento,
    p_total: total,
    p_cambio: cambio,
    p_detalles: detalles,
    p_pagos: pagos,
  });

  if (error) {
    if (error.message?.includes('Sin stock disponible')) {
      throw { sinStock: true, message: error.message };
    }
    throw new Error(`Error al registrar la venta: ${error.message}`);
  }

  return data;
}

async function cancelarVenta({ idVenta, idCajeroCancela, motivo }) {
  const { error } = await supabase.rpc('fn_cancelar_venta', {
    p_id_venta: idVenta,
    p_id_cajero_cancela: idCajeroCancela,
    p_motivo: motivo,
  });

  if (error) {
    if (error.message?.includes('ya se encuentra cancelada')) {
      throw { yaCancelada: true, message: error.message };
    }
    throw new Error(`Error al cancelar la venta: ${error.message}`);
  }
}

async function buscarPorId(id) {
  const { data, error } = await supabase.from('ventas').select('*').eq('id_venta', id).maybeSingle();
  if (error) throw new Error(`Error al buscar venta: ${error.message}`);
  return data;
}

async function obtenerTicket(id) {
  const { data, error } = await supabase.from('v_ticket').select('*').eq('id_venta', id);
  if (error) throw new Error(`Error al obtener ticket: ${error.message}`);
  return data;
}

async function listarConFiltros({ folio, fechaInicio, fechaFin, idCajero }) {
  let consulta = supabase.from('ventas').select('*').order('fecha_hora', { ascending: false });

  if (folio) consulta = consulta.eq('folio', folio);
  if (fechaInicio) consulta = consulta.gte('fecha_hora', fechaInicio);
  if (fechaFin) consulta = consulta.lte('fecha_hora', fechaFin);
  if (idCajero) consulta = consulta.eq('id_cajero', idCajero);

  const { data, error } = await consulta;
  if (error) throw new Error(`Error al listar ventas: ${error.message}`);
  return data;
}

async function listarDetalle(idVenta) {
  const { data, error } = await supabase.from('detalle_venta').select('*').eq('id_venta', idVenta);
  if (error) throw new Error(`Error al listar detalle de venta: ${error.message}`);
  return data;
}

async function listarPagos(idVenta) {
  const { data, error } = await supabase.from('pagos_venta').select('*').eq('id_venta', idVenta);
  if (error) throw new Error(`Error al listar pagos de venta: ${error.message}`);
  return data;
}

async function listarPorApertura(idAperturaCaja) {
  const { data, error } = await supabase
    .from('ventas')
    .select('*, pagos_venta(*)')
    .eq('id_apertura', idAperturaCaja)
    .eq('estado', 'completada');

  if (error) throw new Error(`Error al listar ventas de la apertura: ${error.message}`);
  return data;
}

export {
  crearVentaCompleta,
  cancelarVenta,
  buscarPorId,
  obtenerTicket,
  listarConFiltros,
  listarDetalle,
  listarPagos,
  listarPorApertura,
};
