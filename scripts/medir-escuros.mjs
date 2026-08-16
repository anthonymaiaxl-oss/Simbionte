/**
 * Compara o preto do FUNDO com o preto do ROBO (visor, maos, juntas).
 *
 * Se houver folga entre os dois, da para apagar o fundo preso embaixo do
 * braco sem comer as partes escuras que fazem parte do boneco.
 */

import sharp from "sharp";
import path from "node:path";

const QUADRO = process.argv[2] ?? "frame_001";
const arquivo = path.join(
  process.cwd(),
  "public",
  "robo",
  "verde",
  `${QUADRO}.webp`,
);

const { data, info } = await sharp(arquivo)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const lum = (i) =>
  (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;

// Histograma de luminancia SO nos pixels opacos (o que sobrou do recorte)
const faixas = new Array(12).fill(0);
let opacos = 0;
for (let k = 0; k < W * H; k++) {
  const i = k * C;
  if (data[i + 3] < 200) continue;
  opacos++;
  faixas[Math.min(Math.floor(lum(i) / 10), 11)]++;
}

console.log(`${QUADRO}  ${W}x${H}  opacos: ${opacos}`);
console.log("luminancia dos pixels opacos:");
faixas.forEach((n, i) => {
  if (n === 0) return;
  const rotulo = i === 11 ? "110+" : `${i * 10}-${i * 10 + 9}`;
  console.log(
    `  ${rotulo.padStart(7)}  ${String(n).padStart(7)}  ${((n / opacos) * 100).toFixed(2)}%`,
  );
});

// Regioes opacas MUITO escuras que nao tocam a borda = candidatas a
// fundo preso. Marca o maior aglomerado para eu ver onde fica.
const escuro = new Uint8Array(W * H);
for (let k = 0; k < W * H; k++) {
  const i = k * C;
  if (data[i + 3] >= 200 && lum(i) < 14) escuro[k] = 1;
}

const visto = new Uint8Array(W * H);
const pilha = new Int32Array(W * H);
const grupos = [];
for (let ini = 0; ini < W * H; ini++) {
  if (!escuro[ini] || visto[ini]) continue;
  let topo = 0;
  pilha[topo++] = ini;
  visto[ini] = 1;
  let n = 0, minX = W, maxX = 0, minY = H, maxY = 0;
  while (topo > 0) {
    const k = pilha[--topo];
    const y = (k / W) | 0;
    const x = k - y * W;
    n++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x > 0 && escuro[k - 1] && !visto[k - 1]) { visto[k - 1] = 1; pilha[topo++] = k - 1; }
    if (x < W - 1 && escuro[k + 1] && !visto[k + 1]) { visto[k + 1] = 1; pilha[topo++] = k + 1; }
    if (y > 0 && escuro[k - W] && !visto[k - W]) { visto[k - W] = 1; pilha[topo++] = k - W; }
    if (y < H - 1 && escuro[k + W] && !visto[k + W]) { visto[k + W] = 1; pilha[topo++] = k + W; }
  }
  grupos.push({ n, minX, maxX, minY, maxY });
}

grupos.sort((a, b) => b.n - a.n);
console.log("\nmaiores regioes quase pretas e opacas (lum < 14):");
grupos.slice(0, 6).forEach((g) => {
  console.log(
    `  ${String(g.n).padStart(6)} px   x ${g.minX}..${g.maxX}  y ${g.minY}..${g.maxY}` +
      `   (${((g.minX / W) * 100).toFixed(0)}%,${((g.minY / H) * 100).toFixed(0)}%)`,
  );
});
