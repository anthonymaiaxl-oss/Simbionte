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

/**
 * O quadro pedido, ou o mais perto dele que já esteja em memória.
 *
 * Trocar o `src` para um quadro que ainda não baixou deixa a imagem em
 * branco até ele chegar — o robô pisca e o giro parece travado. Melhor
 * mostrar o vizinho que já existe: a diferença entre dois quadros
 * consecutivos é pequena, e ninguém percebe que ficou um para trás.
 */
function maisProximoCarregado(pedido: number, prontos: Set<number>) {
  if (prontos.size === 0 || prontos.has(pedido)) return pedido;

  for (let d = 1; d < QUADROS; d++) {
    if (prontos.has(pedido - d)) return pedido - d;
    if (prontos.has(pedido + d)) return pedido + d;
  }
  return pedido;
}

export function RoboMascote() {
  const [pronto, setPronto] = useState(false);
  const [quadroAtual, setQuadroAtual] = useState(Math.floor(QUADROS / 2));
  const [piscando, setPiscando] = useState(false);

  const img = useRef<HTMLImageElement>(null);
  const camada = useRef<HTMLDivElement>(null);
  const quadro = useRef(Math.floor(QUADROS / 2));

  /**
   * Quais quadros já estão na memória do navegador.
   *
   * No localhost todos vinham do disco na hora, então isso não fazia
   * falta. Servido pela rede, trocar o `src` para um quadro que ainda
   * não chegou deixa a imagem em branco até ele baixar — foi isso que
   * fez o giro parecer quadro a quadro na Vercel.
   */
  const carregados = useRef<Set<number>>(new Set());

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
    if (inicial?.complete && inicial.naturalWidth > 0) {
      carregados.current.add(quadro.current);
      setPronto(true);
    }
  }, []);

  /**
   * Baixa os 58 quadros de uma vez, sem esperar o primeiro.
   *
   * Antes eram duas frentes em série, e só começavam depois do quadro
   * inicial chegar. Na Vercel isso levava segundos, e nesse meio-tempo
   * o cursor pedia quadros que ainda não existiam.
   *
   * A Vercel serve por HTTP/2, que multiplexa: 58 pedidos de ~40 KB
   * numa conexão só custam pouco mais que um pedido grande.
   */
  useEffect(() => {
    const meio = Math.floor(QUADROS / 2);

    // Do meio para fora: os vizinhos do quadro atual são os primeiros
    // que o cursor vai pedir.
    const ordem = Array.from({ length: QUADROS }, (_, i) => i).sort(
      (a, b) => Math.abs(a - meio) - Math.abs(b - meio),
    );

    let cancelado = false;
    const imagens: HTMLImageElement[] = [];

    for (const i of ordem) {
      const im = new Image();
      im.fetchPriority = i === meio ? "high" : "low";
      im.onload = () => {
        if (!cancelado) carregados.current.add(i);
      };
      im.src = caminho(i);
      imagens.push(im);
    }

    return () => {
      cancelado = true;
      imagens.forEach((im) => (im.onload = null));
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
        const pedido = Math.round(px * (QUADROS - 1));
        const i = maisProximoCarregado(pedido, carregados.current);

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
