import crypto from 'crypto';

function hashearToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export { hashearToken };
