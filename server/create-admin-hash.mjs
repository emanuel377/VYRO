import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
const input = createInterface({ input: process.stdin, output: process.stdout });
const password = await input.question('Nueva contraseña de administración: ');
input.close();
if (password.length < 16) { console.error('Usá al menos 16 caracteres.'); process.exit(1); }
const salt = randomBytes(16);
console.log(`NOVA_ADMIN_PASSWORD_HASH=${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`);
console.log(`NOVA_SESSION_SECRET=${randomBytes(32).toString('hex')}`);
