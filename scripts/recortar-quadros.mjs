/**
 * Recorta o fundo preto dos quadros do mascote e grava WebP com alfa.
 *
 * O fundo aqui é #000000 puro, então o corte é direto: inunda a partir
 * da borda por pixels quase pretos. O que salva as partes escuras do
 * robô (visor, mãos, juntas) é a conectividade — elas são interiores,
 * cercadas pelo casco, e a inundação nunca chega nelas.
 *
 * A base do quadro não entra na semente: o corpo do robô é cortado pela
 * borda de baixo, então ali a borda é robô, não fundo.
 *
 * Todos os quadros saem no MESMO recorte (união das caixas de todos),
 * para o robô não parecer mudar de tamanho de um quadro para o outro.
 */

import sharp from "sharp";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const ENTRADA = process.argv[2];
const SAIDA = path.join(process.cwd(), "public", "robo", "verde");

if (!ENTRADA) {
  console.error("uso: node scripts/recortar-quadros.mjs <pasta-com-os-png>");
  process.exit(1);
}

/** Fundo preto puro; a folga cobre o ruído de compressão. */
const LIMITE_PRETO = 26;
/** Manchas menores que isto são sujeira do render, não o robô. */
const MANCHA_MINIMA = 400;

async function recortar(arquivo) {
  const { data, info } = await sharp(arquivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const escuro = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const i = k * C;
    const lum = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    if (lum < LIMITE_PRETO) escuro[k] = 1;
  }

  const fundo = new Uint8Array(W * H);
  const fila = new Int32Array(W * H);
  let cauda = 0;
  const semear = (x, y) => {
    const k = y * W + x;
    if (escuro[k] && !fundo[k]) {
      fundo[k] = 1;
      fila[cauda++] = k;
    }
  };

  for (let x = 0; x < W; x++) semear(x, 0);
  for (let y = 0; y < H; y++) {
    semear(0, y);
    semear(W - 1, y);
  }
  // A base inteira tambem entra na semente. Parece arriscado — o corpo
  // do robo e cortado por ela — mas `semear` so aceita pixel escuro, e o
  // corpo ali e branco. O que isso resolve: as cunhas de fundo presas
  // entre o tronco e o braco, que descem ate a base e antes ficavam
  // opacas, aparecendo como manchas pretas embaixo do braco.
  for (let x = 0; x < W; x++) semear(x, H - 1);

  for (let cabeca = 0; cabeca < cauda; cabeca++) {
    const k = fila[cabeca];
    const y = (k / W) | 0;
    const x = k - y * W;
    if (x > 0) semear(x - 1, y);
    if (x < W - 1) semear(x + 1, y);
    if (y > 0) semear(x, y - 1);
    if (y < H - 1) semear(x, y + 1);
  }

  // Tira só manchas pequenas (poeira do render). Não dá para manter
  // "o maior componente": ao cortar, braços podem se separar do tronco
  // e todos os pedaços grandes são legítimos.
  const rotulo = new Int32Array(W * H).fill(-1);
  const tamanhos = [];
  const pilha = new Int32Array(W * H);
  let proximo = 0;

  for (let inicio = 0; inicio < W * H; inicio++) {
    if (fundo[inicio] || rotulo[inicio] !== -1) continue;
    const meu = proximo++;
    let topo = 0;
    let tam = 0;
    pilha[topo++] = inicio;
    rotulo[inicio] = meu;
    while (topo > 0) {
      const k = pilha[--topo];
      tam++;
      const y = (k / W) | 0;
      const x = k - y * W;
      if (x > 0 && !fundo[k - 1] && rotulo[k - 1] === -1) { rotulo[k - 1] = meu; pilha[topo++] = k - 1; }
      if (x < W - 1 && !fundo[k + 1] && rotulo[k + 1] === -1) { rotulo[k + 1] = meu; pilha[topo++] = k + 1; }
      if (y > 0 && !fundo[k - W] && rotulo[k - W] === -1) { rotulo[k - W] = meu; pilha[topo++] = k - W; }
      if (y < H - 1 && !fundo[k + W] && rotulo[k + W] === -1) { rotulo[k + W] = meu; pilha[topo++] = k + W; }
    }
    tamanhos[meu] = tam;
  }
  for (let k = 0; k < W * H; k++) {
    if (!fundo[k] && tamanhos[rotulo[k]] < MANCHA_MINIMA) fundo[k] = 1;
  }

  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = y * W + x;
      const i = k * C;
      if (fundo[k]) {
        data[i + 3] = 0;
        continue;
      }
      let viz = 0, tot = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W) continue;
          tot++;
          if (fundo[ny * W + nx]) viz++;
        }
      }
      data[i + 3] = viz > 0 ? Math.round(255 * (1 - viz / tot)) : 255;

      if (data[i + 3] > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { data, W, H, C, minX, maxX, minY, maxY };
}

const arquivos = (await readdir(ENTRADA)).filter((f) => f.endsWith(".png")).sort();
const quadros = [];

for (const a of arquivos) {
  quadros.push(await recortar(path.join(ENTRADA, a)));
}

// União das caixas: um recorte só para todos os quadros.
const uniao = quadros.reduce(
  (u, q) => ({
    minX: Math.min(u.minX, q.minX),
    maxX: Math.max(u.maxX, q.maxX),
    minY: Math.min(u.minY, q.minY),
    maxY: Math.max(u.maxY, q.maxY),
  }),
  { minX: Infinity, maxX: 0, minY: Infinity, maxY: 0 },
);

const larguras = quadros.map((q) => q.maxX - q.minX);
const alturas = quadros.map((q) => q.maxY - q.minY);
const faixa = (a) => `${Math.min(...a)}..${Math.max(...a)} (var ${Math.max(...a) - Math.min(...a)})`;
console.log(`caixa por quadro  largura ${faixa(larguras)}  altura ${faixa(alturas)}`);
console.log(`recorte comum     x ${uniao.minX}..${uniao.maxX}  y ${uniao.minY}..${uniao.maxY}`);

const larg = uniao.maxX - uniao.minX + 1;
const alt = uniao.maxY - uniao.minY + 1;

await rm(SAIDA, { recursive: true, force: true });
await mkdir(SAIDA, { recursive: true });

// Exporta em 1:1. Ampliar não recupera detalhe que o vídeo não tem, e o
// recorte (517px) já é maior que o tamanho de exibição (330px) — só
// custaria peso. A qualidade alta aqui serve para o WebP não somar uma
// segunda geração de artefato por cima da compressão do vídeo.
for (let i = 0; i < quadros.length; i++) {
  const q = quadros[i];
  await sharp(q.data, { raw: { width: q.W, height: q.H, channels: q.C } })
    .extract({ left: uniao.minX, top: uniao.minY, width: larg, height: alt })
    .webp({ quality: 96, alphaQuality: 100, effort: 6 })
    .toFile(path.join(SAIDA, `frame_${String(i + 1).padStart(3, "0")}.webp`));
}

console.log(`gravados ${quadros.length} quadros de ${larg}x${alt} em public/robo/verde`);
console.log(
  "\nATENCAO: este script apaga e recria a pasta, entao levou o olhos.json junto.\n" +
    "Rode em seguida:  node scripts/detectar-olhos.mjs",
);
