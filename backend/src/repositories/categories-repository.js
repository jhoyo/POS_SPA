import { supabase } from '../config/supabase-client.js';

async function crear(nombre) {
  const { data, error } = await supabase.from('categorias').insert({ nombre }).select('*').single();
  if (error) {
    if (error.code === '23505') {
      throw { codigoConflicto: true, message: 'Ya existe una categoría con ese nombre' };
    }
    throw new Error(`Error al crear categoría: ${error.message}`);
  }
  return data;
}

async function listar() {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre', { ascending: true });
  if (error) throw new Error(`Error al listar categorías: ${error.message}`);
  return data;
}

async function buscarPorNombre(nombre) {
  const { data, error } = await supabase.from('categorias').select('*').ilike('nombre', nombre).maybeSingle();
  if (error) throw new Error(`Error al buscar categoría: ${error.message}`);
  return data;
}

export { crear, listar, buscarPorNombre };
