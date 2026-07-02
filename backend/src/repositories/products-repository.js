import { supabase } from '../config/supabase-client.js';

// Postgres solo permite un valor UNIQUE duplicado si es NULL; una cadena vacía ''
// SÍ cuenta como duplicado. Por eso codigo_barras debe guardarse como null, nunca ''.
function normalizarProducto(producto) {
  if (producto.codigo_barras === '') {
    return { ...producto, codigo_barras: null };
  }
  return producto;
}

// El código 23505 de Postgres se dispara para CUALQUIER columna UNIQUE (sku o
// codigo_barras); el nombre de la restricción en error.message indica cuál fue.
function mensajeDuplicado(error) {
  if (error.message?.includes('codigo_barras')) {
    return 'El código de barras ya está registrado en otro producto';
  }
  return 'El código de producto ya existe';
}

async function crear(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert(normalizarProducto(producto))
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw { codigoConflicto: true, message: mensajeDuplicado(error) };
    }
    throw new Error(`Error al crear producto: ${error.message}`);
  }

  return data;
}

async function buscarPorId(id) {
  const { data, error } = await supabase.from('productos').select('*').eq('id_producto', id).maybeSingle();
  if (error) throw new Error(`Error al buscar producto: ${error.message}`);
  return data;
}

async function buscarPorSku(sku) {
  const { data, error } = await supabase.from('productos').select('*').eq('sku', sku).maybeSingle();
  if (error) throw new Error(`Error al buscar producto por SKU: ${error.message}`);
  return data;
}

async function buscarPorCodigoBarras(codigoBarras) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('codigo_barras', codigoBarras)
    .maybeSingle();

  if (error) throw new Error(`Error al buscar producto por código de barras: ${error.message}`);
  return data;
}

async function buscarPorNombre(query) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .ilike('nombre', `%${query}%`)
    .eq('activo', true)
    .order('nombre', { ascending: true })
    .limit(50);

  if (error) throw new Error(`Error al buscar productos: ${error.message}`);
  return data;
}

async function listar({ soloActivos = true } = {}) {
  let consulta = supabase.from('productos').select('*').order('nombre', { ascending: true });
  if (soloActivos) consulta = consulta.eq('activo', true);

  const { data, error } = await consulta;
  if (error) throw new Error(`Error al listar productos: ${error.message}`);
  return data;
}

async function actualizar(id, cambios) {
  const { data, error } = await supabase
    .from('productos')
    .update(normalizarProducto(cambios))
    .eq('id_producto', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw { codigoConflicto: true, message: mensajeDuplicado(error) };
    }
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }

  return data;
}

async function desactivar(id) {
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id_producto', id)
    .select('*')
    .single();

  if (error) throw new Error(`Error al desactivar producto: ${error.message}`);
  return data;
}

async function listarStockBajo() {
  const { data, error } = await supabase.from('v_stock_bajo').select('*');
  if (error) throw new Error(`Error al consultar stock bajo: ${error.message}`);
  return data;
}

export {
  crear,
  buscarPorId,
  buscarPorSku,
  buscarPorCodigoBarras,
  buscarPorNombre,
  listar,
  actualizar,
  desactivar,
  listarStockBajo,
};
