"use client";

import { useEffect, useRef, useState } from "react";
import olhosPorQuadro from "../../public/robo/verde/olhos.json";

/**
 * Mascote por sequência de quadros — 58 WebP recortados, com alfa.
 *
 * Fica parado na Hero: rola junto com a página, sem ancorar no canto.
 *
 * O cursor escolhe o quadro (eixo X) e desloca de leve na vertical
 * (eixo Y). E ele pisca sozinho: pálpebras posicionadas a partir das
 * coordenadas reais dos olhos EM CADA QUADRO — a cabeça gira, então uma
 * posição fixa erraria em quase todos.
 */

type Olho = { x: number; y: number; l: number; a: number };

const OLHOS = olhosPorQuadro as (Olho[] | null)[];
const QUADROS = OLHOS.length;

const INTERVALO_PISCADA = 3000;
const DURACAO_PISCADA = 130;

const caminho = (i: number) =>
  `/robo/verde/frame_${String(i + 1).padStart(3, "0")}.webp`;

export function RoboMascote() {
  const [pronto, setPronto] = useState(false);
  const [quadroAtual, setQuadroAtual] = useState(Math.floor(QUADROS / 2));
  const [piscando, setPiscando] = useState(false);

  const img = useRef<HTMLImageElement>(null);
  const camada = useRef<HTMLDivElement>(null);
  const quadro = useRef(Math.floor(QUADROS / 2));

  useEffect(() => {
    let vivo = true;
    let faltam = QUADROS;
    const contar = () => {
      if (!vivo) return;
      faltam -= 1;
      if (faltam <= 0) setPronto(true);
    };
    for (let i = 0; i < QUADROS; i++) {
      const im = new Image();
      im.onload = contar;
      im.onerror = contar;
      im.src = caminho(i);
    }
    return () => {
      vivo = false;
    };
  }, []);

  // Piscada. Um pouco de variação no intervalo para não virar metrônomo.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let fechar: number;
    let abrir: number;

    const ciclo = () => {
      setPiscando(true);
      abrir = window.setTimeout(() => setPiscando(false), DURACAO_PISCADA);
      fechar = window.setTimeout(
        ciclo,
        INTERVALO_PISCADA + Math.random() * 1200,
      );
    };

    fechar = window.setTimeout(ciclo, INTERVALO_PISCADA);
    return () => {
      window.clearTimeout(fechar);
      window.clearTimeout(abrir);
    };
  }, []);

  // Cursor: escolhe o quadro e desloca de leve na vertical.
  useEffect(() => {
    let frame = 0;

    const aoMover = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = img.current;
        if (!el) return;

        const px = Math.min(Math.max(e.clientX / window.innerWidth, 0), 1);
        const i = Math.round(px * (QUADROS - 1));
        if (i !== quadro.current) {
          quadro.current = i;
          el.src = caminho(i);
          // O estado só existe para as pálpebras acompanharem a cabeça.
          setQuadroAtual(i);
        }

        const c = camada.current;
        if (c) {
          const q = Math.min(Math.max(e.clientY / window.innerHeight, 0), 1);
          c.style.transform = `translateY(${(((q - 0.5) * 2) * 12).toFixed(2)}px)`;
        }
      });
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", aoMover);
    };
  }, []);

  const olhos = OLHOS[quadroAtual] ?? OLHOS[Math.floor(QUADROS / 2)];

  return (
    <div className={`robo-palco ${pronto ? "robo-palco--pronto" : ""}`}>
      <div ref={camada} className="robo-camada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={caminho(Math.floor(QUADROS / 2))}
          alt="Simbionte, o mascote do agente de WhatsApp."
          className="robo-quadro"
          draggable={false}
        />

        {/* Pálpebras: descem do topo do olho, como pálpebra de verdade.
            Cor do visor, para o olho sumir dentro dele. */}
        {olhos?.map((o, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`robo-palpebra ${piscando ? "robo-palpebra--fechada" : ""}`}
            style={{
              left: `${o.x - o.l / 2 - 0.6}%`,
              top: `${o.y - o.a / 2 - 0.8}%`,
              width: `${o.l + 1.2}%`,
              height: `${o.a + 1.6}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
