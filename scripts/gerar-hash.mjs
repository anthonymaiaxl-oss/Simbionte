/**
 * Gera o hash de uma senha para colar na coluna `senha_hash` da Data
 * Table do n8n.
 *
 * Dois modos:
 *   node scripts/gerar-hash.mjs            -> pergunta a senha
 *   node scripts/gerar-hash.mjs "a-senha"  -> recebe pronta
 *
 * O modo que pergunta é o preferido: senha passada como argumento fica
 * no histórico do terminal e aparece na lista de processos do sistema.
 *
 * A senha em si não é gravada em lugar nenhum — nem aqui, nem no n8n.
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const derivar = promisify(scrypt);

async function perguntar() {
  const leitor = createInterface({ input: stdin, output: stdout });
  const senha = await leitor.question("Digite a senha e aperte Enter: ");
  leitor.close();
  return senha;
}

const senha = process.argv[2] ?? (await perguntar());

if (!senha || !senha.trim()) {
  console.error("\nSenha vazia. Rode de novo e digite alguma coisa.");
  process.exit(1);
}

const sal = randomBytes(16).toString("hex");
const hash = await derivar(senha, sal, 64);

console.log("\n--- copie a linha inteira abaixo ---\n");
console.log(`scrypt$${sal}$${hash.toString("hex")}`);
console.log("\n--- cole na coluna senha_hash do n8n ---");
