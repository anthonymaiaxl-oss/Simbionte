/** Compoe quadros sobre magenta: qualquer preto opaco salta aos olhos. */
import sharp from "sharp";
import path from "node:path";

const QUADROS = ["frame_001", "frame_015", "frame_029", "frame_045"];
const LADO = 380;
const saida = path.join(process.cwd(), "diagnostico.png");

const pecas = [];
for (let i = 0; i < QUADROS.length; i++) {
  const buf = await sharp(
    path.join(process.cwd(), "public", "robo", "verde", `${QUADROS[i]}.webp`),
  )
    .resize(LADO, LADO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  pecas.push({ input: buf, left: i * LADO, top: 0 });
}

await sharp({
  create: {
    width: LADO * QUADROS.length,
    height: LADO,
    channels: 4,
    background: { r: 255, g: 0, b: 190, alpha: 1 },
  },
})
  .composite(pecas)
  .png()
  .toFile(saida);

console.log("gerado:", saida);
