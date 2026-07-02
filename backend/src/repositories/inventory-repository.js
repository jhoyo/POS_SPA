import { supabase } from '../config/supabase-client.js';

// Registra un movimiento (entrada, ajuste_positivo, ajuste_negativo) y actualiza el stock
// de forma atómica delegando en la función de Postgres fn_registrar_movimiento_inventario.
async function registrarMovimiento({ idProducto, tipo, cantidad, motivo, idUsuario, costoUnitario }) {
  const { data, error } = await supabase.rpc('fn_registrar_movimiento_inventario', {
    p_id_producto: idProducto,
    p_tipo: tipo,
    p_cantidad: cantidad,
    p_motivo: motivo,
    p_id_usuario: idUsuario,
    p_costo_unitario: costoUnitario ?? null,
  });

  if (error) {
    if (error.message?.includes('STOCK_INSUFICIENTE')) {
      throw { stockInsuficiente: true, message: 'El ajuste dejaría el stock en un valor negativo' };
    }
    throw new Error(`Error al registrar movimiento de inventario: ${error.message}`);
  }

  return data;
}

async function listarMovimientos({ idProducto, tipos }) {
  let consulta = supabase
    .from('movimientos_inventario')
    .select('*, usuarios:id_usuario(nombre)')
    .order('fecha_hora', { ascending: false });

  if (idProducto) consulta = consulta.eq('id_producto', idProducto);
  if (tipos && tipos.length > 0) consulta = consulta.in('tipo', tipos);

  const { data, error } = await consulta;
  if (error) throw new Error(`Error al listar movimientos de inventario: ${error.message}`);

  return (data || []).map((mov) => ({
    fecha_hora: mov.fecha_hora,
    cantidad: mov.cantidad,
    motivo: mov.motivo,
    tipo: mov.tipo,
    id_producto: mov.id_producto,
    nombre_usuario: mov.usuarios?.nombre || null,
  }));
}

export { registrarMovimiento, listarMovimientos };
