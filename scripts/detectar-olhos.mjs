/**
 * Acha os dois olhos em cada quadro e grava as posições em JSON.
 *
 * A cabeça gira ao longo da sequência, então os olhos não ficam parados:
 * uma posição fixa serviria para um quadro e erraria em todos os outros.
 * Aqui cada quadro tem a sua.
 *
 * Critério: pixel aceso e verde. O casco é branco (verde não domina) e o
 * visor é quase preto, então só os olhos passam. Depois separo em
 * esquerdo/direito pelo centro do conjunto.
 *
 * As posições saem em PORCENTAGEM do quadro, para servirem em qualquer
 * tamanho de exibição.
 */

import sharp from "sharp";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PASTA = path.join(process.cwd(), "public", "robo", "verde");

async function olhosDoQuadro(arquivo) {
  const { data, info } = await sharp(path.join(PASTA, arquivo))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const pontos = [];
  // Os olhos vivem no terço superior; limitar evita pegar o "S" do peito.
  const ate = Math.floor(H * 0.55);

  for (let y = 0; y < ate; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (g > 150 && g > r + 40 && g > b + 40) pontos.push([x, y]);
    }
  }

  if (pontos.length < 40) return null;

  // Separar por "esquerda/direita do centro" não serve: os anéis verdes
  // das orelhas também são verdes e acesos, e grudavam no olho, dando
  // caixas de 29% de largura. Componentes conectados resolvem — os olhos
  // são os dois blobs cheios e maiores; as orelhas são anéis finos.
  const verde = new Uint8Array(W * H);
  for (const [x, y] of pontos) verde[y * W + x] = 1;

  const visto = new Uint8Array(W * H);
  const pilha = new Int32Array(W * H);
  const blobs = [];

  for (let k = 0; k < W * H; k++) {
    if (!verde[k] || visto[k]) continue;
    let topo = 0;
    pilha[topo++] = k;
    visto[k] = 1;
    let minX = W, maxX = 0, minY = H, maxY = 0, area = 0;

    while (topo > 0) {
      const p = pilha[--topo];
      const y = (p / W) | 0;
      const x = p - y * W;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x > 0 && verde[p - 1] && !visto[p - 1]) { visto[p - 1] = 1; pilha[topo++] = p - 1; }
      if (x < W - 1 && verde[p + 1] && !visto[p + 1]) { visto[p + 1] = 1; pilha[topo++] = p + 1; }
      if (y > 0 && verde[p - W] && !visto[p - W]) { visto[p - W] = 1; pilha[topo++] = p - W; }
      if (y < H - 1 && verde[p + W] && !visto[p + W]) { visto[p + W] = 1; pilha[topo++] = p + W; }
    }

    const larg = maxX - minX + 1;
    const alt = maxY - minY + 1;
    // Preenchimento: area do blob dividida pela area da caixa.
    // Olho e uma elipse cheia (~0,75). Orelha e um ANEL, vazado no meio,
    // e fica bem abaixo disso. E o que separa os dois quando a cabeca
    // vira e a orelha aparece maior que o olho.
    blobs.push({ area, minX, maxX, minY, maxY, cheio: area / (larg * alt) });
  }

  const solidos = blobs.filter((b) => b.cheio > 0.55);
  const dois = solidos.sort((a, b) => b.area - a.area).slice(0, 2);
  // Com a cabeca totalmente virada um olho some de vista: devolver um so
  // e o correto — piscar um olho invisivel seria pior.
  if (dois.length === 0) return null;

  dois.sort((a, b) => a.minX - b.minX);

  return dois.map((c) => ({
    x: +(((c.minX + c.maxX) / 2 / W) * 100).toFixed(3),
    y: +(((c.minY + c.maxY) / 2 / H) * 100).toFixed(3),
    l: +(((c.maxX - c.minX + 1) / W) * 100).toFixed(3),
    a: +(((c.maxY - c.minY + 1) / H) * 100).toFixed(3),
  }));
}

const arquivos = (await readdir(PASTA))
  .filter((f) => f.endsWith(".webp"))
  .sort();

const todos = [];
let falhas = 0;

for (const a of arquivos) {
  const olhos = await olhosDoQuadro(a);
  if (!olhos) {
    falhas++;
    // repete o último válido em vez de deixar buraco
    todos.push(todos[todos.length - 1] ?? null);
  } else {
    todos.push(olhos);
  }
}

await writeFile(
  path.join(PASTA, "olhos.json"),
  JSON.stringify(todos),
  "utf8",
);

const larguras = todos.filter(Boolean).map((o) => o[0].l);
console.log(
  `${todos.length} quadros, ${falhas} sem detecção`,
);
console.log(
  `olho esquerdo: largura ${Math.min(...larguras).toFixed(2)}%..${Math.max(...larguras).toFixed(2)}%`,
);
console.log("exemplo quadro 1:", JSON.stringify(todos[0]));
console.log("exemplo quadro 29:", JSON.stringify(todos[28]));
