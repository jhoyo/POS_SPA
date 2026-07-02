import 'dotenv/config';

const variablesRequeridas = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

for (const nombreVariable of variablesRequeridas) {
  if (!process.env[nombreVariable]) {
    throw new Error(`Falta la variable de entorno requerida: ${nombreVariable}`);
  }
}

export const env = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  jwtExpiracion: process.env.JWT_EXPIRACION || '12h',
};
