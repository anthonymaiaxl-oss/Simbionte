/**
 * Gera o hash de uma senha para colar na coluna `senha_hash` da Data
 * Table do n8n.
 *
 * Modos:
 *   node scripts/gerar-hash.mjs            -> pergunta a senha
 *   node scripts/gerar-hash.mjs "a-senha"  -> recebe pronta
 *
 * No modo que pergunta, apertar Enter sem digitar nada faz o script
 * sortear uma senha forte — serve para quem não quer escolher.
 *
 * O modo que pergunta é o preferido: senha passada como argumento fica no
 * histórico do terminal e aparece na lista de processos do sistema.
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
  const resposta = await leitor.question(
    "Digite a senha que voce quer usar (ou so aperte Enter para eu sortear uma): ",
  );
  leitor.close();
  return resposta;
}

/**
 * Senha sorteada, para quem não quer escolher.
 *
 * Sai melhor que a maioria das escolhidas à mão. O alfabeto não tem os
 * caracteres ambíguos (0/O, 1/l/I), então dá para ditar por telefone ou
 * copiar à mão sem gerar confusão depois.
 */
function sortear() {
  const alfabeto = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...randomBytes(20)].map((b) => alfabeto[b % alfabeto.length]).join("");
}

let senha = process.argv[2] ?? (await perguntar());
let sorteada = false;

if (!senha || !senha.trim()) {
  senha = sortear();
  sorteada = true;
}

const sal = randomBytes(16).toString("hex");
const hash = await derivar(senha, sal, 64);

if (sorteada) {
  console.log("\n=========================================================");
  console.log("  ESTA E A SUA SENHA DE LOGIN. Guarde agora:");
  console.log("");
  console.log(`      ${senha}`);
  console.log("");
  console.log("  Ela nao fica salva em lugar nenhum. Se fechar sem anotar,");
  console.log("  e so rodar de novo e gerar outra.");
  console.log("=========================================================");
}

console.log("\n--- copie a linha inteira abaixo ---\n");
console.log(`scrypt$${sal}$${hash.toString("hex")}`);
console.log("\n--- cole na coluna senha_hash do n8n ---");
