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

  /**
   * O robô aparece assim que o PRIMEIRO quadro chega, não quando os 58
   * terminam. Antes ele era o último elemento da página a surgir porque
   * esperava ~2,3 MB baixarem — e o quadro que aparece na tela é um só.
   *
   * Os outros 57 continuam sendo baixados por trás, sem segurar nada: o
   * mouse só precisa deles quando começa a se mexer.
   */
  useEffect(() => {
    const inicial = img.current;
    if (inicial?.complete && inicial.naturalWidth > 0) setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;

    // Escalonado a partir do quadro do meio para fora: os vizinhos do
    // atual são os primeiros que o cursor vai pedir.
    const meio = Math.floor(QUADROS / 2);
    const ordem = Array.from({ length: QUADROS }, (_, i) => i).sort(
      (a, b) => Math.abs(a - meio) - Math.abs(b - meio),
    );

    let cancelado = false;
    let indice = 0;

    const proximo = () => {
      if (cancelado || indice >= ordem.length) return;
      const im = new Image();
      im.onload = proximo;
      im.onerror = proximo;
      im.src = caminho(ordem[indice++]);
    };

    // Duas frentes em paralelo: rápido o bastante sem sufocar a rede.
    proximo();
    proximo();

    return () => {
      cancelado = true;
    };
  }, [pronto]);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={caminho(Math.floor(QUADROS / 2))}
          alt="Simbionte, o mascote do agente de WhatsApp."
          // Prioridade alta e decodificação síncrona: este é o quadro
          // que a pessoa vê, e ele competia com 57 irmãos invisíveis.
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setPronto(true)}
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
