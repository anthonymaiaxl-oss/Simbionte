/**
 * Recomprime os quadros do mascote.
 *
 * Qualidade 96 gerava 53 KB por quadro, 3,1 MB no total. Servido pela
 * rede isso demora, e enquanto os quadros não chegam o giro trava.
 * Em 88 cai para ~33 KB sem diferença visível no tamanho de exibição.
 *
 * Grava numa pasta temporária e só então substitui: escrever por cima
 * direto falha quando o OneDrive está sincronizando o arquivo.
 */

import sharp from "sharp";
import { readdir, mkdir, rm, rename, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "robo", "verde");
const TEMP = path.join(process.cwd(), ".quadros-temp");
const QUALIDADE = 88;

const arquivos = (await readdir(DIR)).filter((f) => f.endsWith(".webp")).sort();

await rm(TEMP, { recursive: true, force: true });
await mkdir(TEMP, { recursive: true });

let antes = 0;
let depois = 0;

for (const a of arquivos) {
  const origem = path.join(DIR, a);
  antes += (await stat(origem)).size;

  await sharp(origem)
    .webp({ quality: QUALIDADE, alphaQuality: 100, effort: 6 })
    .toFile(path.join(TEMP, a));

  depois += (await stat(path.join(TEMP, a))).size;
}

// Só troca depois que todos foram gerados: se algo falhar no meio, os
// originais continuam intactos.
for (const a of arquivos) {
  await rename(path.join(TEMP, a), path.join(DIR, a));
}
await rm(TEMP, { recursive: true, force: true });

console.log(`${arquivos.length} quadros`);
console.log(
  `${(antes / 1048576).toFixed(2)} MB -> ${(depois / 1048576).toFixed(2)} MB ` +
    `(${Math.round((1 - depois / antes) * 100)}% menor)`,
);
console.log(`media: ${Math.round(depois / arquivos.length / 1024)} KB por quadro`);
console.log("\nRode em seguida: node scripts/detectar-olhos.mjs");
