import { supabase } from '../config/supabase-client.js';

async function crearApertura({ idUsuario, fondoInicial, idUsuarioAutorizo = null }) {
  const { data, error } = await supabase
    .from('apertura_caja')
    .insert({
      id_usuario: idUsuario,
      fondo_inicial: fondoInicial,
      estado: 'abierta',
      id_usuario_autorizo: idUsuarioAutorizo,
      fecha_apertura: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(`Error al crear apertura de caja: ${error.message}`);
  return data;
}

async function obtenerAperturaAbierta(idUsuario) {
  const { data, error } = await supabase
    .from('apertura_caja')
    .select('*')
    .eq('id_usuario', idUsuario)
    .eq('estado', 'abierta')
    .maybeSingle();

  if (error) throw new Error(`Error al consultar apertura de caja: ${error.message}`);
  return data;
}

async function obtenerAperturaAbiertaGlobal() {
  const { data, error } = await supabase
    .from('apertura_caja')
    .select('*')
    .eq('estado', 'abierta')
    .maybeSingle();

  if (error) throw new Error(`Error al consultar apertura de caja global: ${error.message}`);
  return data;
}

async function buscarAperturaPorId(id) {
  const { data, error } = await supabase.from('apertura_caja').select('*').eq('id_apertura', id).maybeSingle();
  if (error) throw new Error(`Error al buscar apertura de caja: ${error.message}`);
  return data;
}

async function cerrarApertura(id) {
  // apertura_caja no tiene columna fecha_cierre (ver schema.sql); el cierre
  // queda registrado por el propio corte_caja (tipo 'Z', fecha_hora).
  const { error } = await supabase.from('apertura_caja').update({ estado: 'cerrada' }).eq('id_apertura', id);

  if (error) throw new Error(`Error al cerrar apertura de caja: ${error.message}`);
}

async function crearCorte({
  idAperturaCaja,
  tipo,
  efectivoDeclarado,
  efectivoEsperado,
  diferencia,
  fondoInicial,
  totalVentas,
  numTransacciones,
  totalEfectivo,
  totalTarjeta,
  totalTransferencia,
  idUsuario,
}) {
  const { data, error } = await supabase
    .from('corte_caja')
    .insert({
      id_apertura: idAperturaCaja,
      tipo,
      efectivo_declarado: efectivoDeclarado,
      efectivo_esperado: efectivoEsperado,
      diferencia,
      fondo_inicial: fondoInicial,
      total_ventas: totalVentas,
      num_transacciones: numTransacciones,
      total_efectivo: totalEfectivo || 0,
      total_tarjeta: totalTarjeta || 0,
      total_transferencia: totalTransferencia || 0,
      id_usuario: idUsuario,
      fecha_hora: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(`Error al registrar corte de caja: ${error.message}`);
  return data;
}

async function existeCorteZ(idAperturaCaja) {
  const { data, error } = await supabase
    .from('corte_caja')
    .select('id_corte')
    .eq('id_apertura', idAperturaCaja)
    .eq('tipo', 'Z')
    .maybeSingle();

  if (error) throw new Error(`Error al verificar corte Z existente: ${error.message}`);
  return Boolean(data);
}

export {
  crearApertura,
  obtenerAperturaAbierta,
  obtenerAperturaAbiertaGlobal,
  buscarAperturaPorId,
  cerrarApertura,
  crearCorte,
  existeCorteZ,
};
