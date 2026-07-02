import { supabase } from '../config/supabase-client.js';

async function buscarPorUsuario(usuario) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .maybeSingle();

  if (error) throw new Error(`Error al buscar usuario: ${error.message}`);
  return data;
}

async function buscarPorId(id) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id_usuario', id).maybeSingle();
  if (error) throw new Error(`Error al buscar usuario: ${error.message}`);
  return data;
}

async function listar() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id:id_usuario, nombre, usuario, rol, activo, creado_en')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al listar usuarios: ${error.message}`);
  return data;
}

async function crear({ nombre, usuario, pinHash, rol }) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nombre, usuario, pin_hash: pinHash, rol, intentos_fallidos: 0, activo: true })
    .select('id:id_usuario, nombre, usuario, rol, activo')
    .single();

  if (error) throw new Error(`Error al crear usuario: ${error.message}`);
  return data;
}

async function actualizar(id, cambios) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(cambios)
    .eq('id_usuario', id)
    .select('id:id_usuario, nombre, usuario, rol, activo')
    .single();

  if (error) throw new Error(`Error al actualizar usuario: ${error.message}`);
  return data;
}

async function incrementarIntentosFallidos(id) {
  const usuario = await buscarPorId(id);
  const nuevoValor = (usuario?.intentos_fallidos || 0) + 1;

  const { error } = await supabase.from('usuarios').update({ intentos_fallidos: nuevoValor }).eq('id_usuario', id);
  if (error) throw new Error(`Error al actualizar intentos fallidos: ${error.message}`);
  return nuevoValor;
}

async function resetearIntentosFallidos(id) {
  const { error } = await supabase
    .from('usuarios')
    .update({ intentos_fallidos: 0, bloqueado_hasta: null })
    .eq('id_usuario', id);

  if (error) throw new Error(`Error al resetear intentos fallidos: ${error.message}`);
}

async function bloquearHasta(id, fecha) {
  const { error } = await supabase.from('usuarios').update({ bloqueado_hasta: fecha }).eq('id_usuario', id);
  if (error) throw new Error(`Error al bloquear usuario: ${error.message}`);
}

export {
  buscarPorUsuario,
  buscarPorId,
  listar,
  crear,
  actualizar,
  incrementarIntentosFallidos,
  resetearIntentosFallidos,
  bloquearHasta,
};
