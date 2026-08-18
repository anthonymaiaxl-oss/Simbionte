import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Guardar e conferir senha.
 *
 * A Data Table nunca vê a senha — vê um hash. Se alguém exportar a tabela
 * em CSV, ou o n8n vazar, o que sai de lá não serve para entrar em lugar
 * nenhum. Como as pessoas reusam senha entre serviços, isso deixa de ser
 * um problema só deste projeto.
 *
 * scrypt e não SHA-256: SHA foi feito para ser RÁPIDO, e velocidade é
 * justamente o que ajuda quem tenta adivinhar senha em lote. scrypt é
 * deliberadamente lento e usa memória, o que torna o ataque caro.
 *
 * Vem do `node:crypto`, sem biblioteca nova: um pacote a menos para
 * manter, e este é o padrão da plataforma.
 */

const derivar = promisify(scrypt) as (
  senha: string,
  sal: string,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO = 64;

/**
 * Formato guardado: `scrypt$<sal>$<hash>`.
 *
 * O sal viaja junto porque ele não é segredo — a função dele é fazer com
 * que duas pessoas com a mesma senha tenham hashes diferentes, e que uma
 * tabela pronta de hashes não sirva.
 */
export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16).toString("hex");
  const hash = await derivar(senha, sal, TAMANHO);
  return `scrypt$${sal}$${hash.toString("hex")}`;
}

export async function conferirSenha(
  senha: string,
  guardado: string,
): Promise<boolean> {
  const partes = (guardado ?? "").split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;

  const [, sal, hex] = partes;
  let esperado: Buffer;
  try {
    esperado = Buffer.from(hex, "hex");
  } catch {
    return false;
  }
  if (esperado.length === 0) return false;

  const calculado = await derivar(senha, sal, esperado.length);

  // timingSafeEqual e não `===`: comparar byte a byte com saída antecipada
  // vaza, pelo tempo de resposta, quantos caracteres iniciais acertaram.
  return timingSafeEqual(esperado, calculado);
}
