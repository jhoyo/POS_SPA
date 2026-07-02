import { supabase } from '../config/supabase-client.js';

async function registrar(accion, descripcion, idUsuario, tablaAfectada, idRegistro) {
  const { error } = await supabase.from('log_auditoria').insert({
    accion,
    descripcion,
    id_usuario: idUsuario,
    tabla_afectada: tablaAfectada,
    id_registro: idRegistro,
    fecha_hora: new Date().toISOString(),
  });

  if (error) throw new Error(`Error al registrar auditoría: ${error.message}`);
}

async function listar() {
  const { data, error } = await supabase
    .from('log_auditoria')
    .select('*, usuarios:id_usuario(nombre)')
    .order('fecha_hora', { ascending: false })
    .limit(500);

  if (error) throw new Error(`Error al listar auditoría: ${error.message}`);
  return data;
}

// Intencionalmente NO se exponen métodos de actualización ni borrado: el log de
// auditoría debe ser inmutable.
export { registrar, listar };
