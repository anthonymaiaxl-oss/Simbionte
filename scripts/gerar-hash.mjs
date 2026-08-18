/**
 * Gera o hash de uma senha para colar na coluna `senha_hash` da Data
 * Table do n8n.
 *
 *   node scripts/gerar-hash.mjs "a-senha-aqui"
 *
 * A senha em si nunca é gravada em lugar nenhum — nem aqui, nem lá.
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt);
const senha = process.argv[2];

if (!senha) {
  console.error('Uso: node scripts/gerar-hash.mjs "sua-senha"');
  process.exit(1);
}

const sal = randomBytes(16).toString("hex");
const hash = await derivar(senha, sal, 64);

console.log(`scrypt$${sal}$${hash.toString("hex")}`);
