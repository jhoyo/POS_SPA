import 'dotenv/config';

const variablesRequeridas = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

for (const nombreVariable of variablesRequeridas) {
  if (!process.env[nombreVariable]) {
    throw new Error(`Falta la variable de entorno requerida: ${nombreVariable}`);
  }
}

// FRONTEND_ORIGIN admite uno o varios orígenes separados por coma
// (ej. "http://localhost:5173,https://pos-spa-three.vercel.app").
function parsearOrigenes(valor) {
  if (!valor) return '*';
  const origenes = valor
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
  return origenes.length > 1 ? origenes : origenes[0];
}

export const env = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: parsearOrigenes(process.env.FRONTEND_ORIGIN),
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  jwtExpiracion: process.env.JWT_EXPIRACION || '12h',
};
