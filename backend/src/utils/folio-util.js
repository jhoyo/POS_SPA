import { supabase } from '../config/supabase-client.js';

// Genera un folio consecutivo usando la función atómica fn_generar_folio (ver sql/functions.sql).
// Al ejecutarse dentro de Postgres con UPDATE ... RETURNING, dos llamadas concurrentes
// jamás obtienen el mismo valor.
async function generarFolioConsecutivo() {
  const { data, error } = await supabase.rpc('fn_generar_folio');

  if (error) {
    throw new Error(`No se pudo generar el folio de venta: ${error.message}`);
  }

  return data;
}

export { generarFolioConsecutivo };
