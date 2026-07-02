import { supabase } from '../config/supabase-client.js';

async function crearSesion({ idUsuario, tokenHash }) {
  const { data, error } = await supabase
    .from('sesiones')
    .insert({ id_usuario: idUsuario, token_hash: tokenHash, activa: true })
    .select('*')
    .single();

  if (error) throw new Error(`Error al crear sesión: ${error.message}`);
  return data;
}

async function buscarPorTokenHash(tokenHash) {
  const { data, error } = await supabase
    .from('sesiones')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('activa', true)
    .maybeSingle();

  if (error) throw new Error(`Error al buscar sesión: ${error.message}`);
  return data;
}

async function actualizarUltimaActividad(id) {
  const { error } = await supabase.from('sesiones').update({ ultima_actividad: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(`Error al actualizar actividad de sesión: ${error.message}`);
}

async function invalidarSesion(id) {
  const { error } = await supabase.from('sesiones').update({ activa: false }).eq('id', id);
  if (error) throw new Error(`Error al invalidar sesión: ${error.message}`);
}

export { crearSesion, buscarPorTokenHash, actualizarUltimaActividad, invalidarSesion };
