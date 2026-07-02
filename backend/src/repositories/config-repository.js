import { supabase } from '../config/supabase-client.js';

const DEFAULTS = {
  bloqueo_minutos: 15,
  inactividad_minutos: 15,
  descuento_maximo_cajero: 10,
  iva_rate: 0.16,
};

// La tabla configuracion es clave/valor (una fila por parámetro, ver schema.sql),
// no una fila única con columnas con nombre. Si falta algún renglón, se usa el default.
async function obtenerConfiguracion() {
  const { data, error } = await supabase.from('configuracion').select('clave, valor');

  if (error) {
    throw new Error(`No se pudo leer la configuración: ${error.message}`);
  }

  const mapa = Object.fromEntries((data || []).map((fila) => [fila.clave, fila.valor]));

  return {
    bloqueo_minutos: mapa.bloqueo_minutos !== undefined ? Number(mapa.bloqueo_minutos) : DEFAULTS.bloqueo_minutos,
    inactividad_minutos:
      mapa.inactividad_minutos !== undefined ? Number(mapa.inactividad_minutos) : DEFAULTS.inactividad_minutos,
    descuento_maximo_cajero:
      mapa.descuento_maximo_cajero !== undefined
        ? Number(mapa.descuento_maximo_cajero)
        : DEFAULTS.descuento_maximo_cajero,
    iva_rate: mapa.iva_porcentaje !== undefined ? Number(mapa.iva_porcentaje) / 100 : DEFAULTS.iva_rate,
  };
}

export { obtenerConfiguracion };
