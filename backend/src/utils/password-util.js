import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

async function hashPin(pin) {
  return bcrypt.hash(pin, env.bcryptSaltRounds);
}

async function compararPin(pin, pinHash) {
  return bcrypt.compare(pin, pinHash);
}

export { hashPin, compararPin };
