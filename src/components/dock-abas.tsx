"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Barra de abas com magnificação estilo dock do macOS.
 *
 * Cada aba mede a distância horizontal entre o cursor e o seu próprio
 * centro, e converte essa distância em escala. Perto do cursor cresce,
 * as vizinhas crescem menos, as distantes ficam no tamanho normal — é
 * a diferença entre elas que cria a onda.
 *
 * A mola é o que separa isso de um hover comum: sem ela a escala salta
 * a cada movimento do mouse.
 *
 * O rótulo NÃO escala junto. Texto ampliado por transform fica borrado
 * e a linha de base dança; aqui só o corpo da aba cresce e o texto
 * segue nítido.
 */

const RAIO = 130;
/**
 * 1,18 e não 1,35: sem a pílula de fundo, cada aba tem contorno próprio,
 * e ampliar demais faz os contornos vizinhos se cruzarem. A escala é
 * transform — cresce por cima, não empurra ninguém.
 */
const AMPLIACAO = 1.18;

export type ItemAba = { id: string; rotulo: string };

export function DockAbas<T extends string>({
  itens,
  atual,
  aoTrocar,
}: {
  itens: readonly { id: T; rotulo: string }[];
  atual: T;
  aoTrocar: (id: T) => void;
}) {
  // Infinity = cursor fora da barra: distância infinita, escala 1.
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="dock__area">
      <motion.div
        role="tablist"
        aria-label="Áreas do painel"
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        className="dock"
      >
        {itens.map((item) => (
          <AbaDock
            key={item.id}
            item={item}
            mouseX={mouseX}
            ativa={atual === item.id}
            aoTrocar={() => aoTrocar(item.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function AbaDock<T extends string>({
  item,
  mouseX,
  ativa,
  aoTrocar,
}: {
  item: { id: T; rotulo: string };
  mouseX: MotionValue<number>;
  ativa: boolean;
  aoTrocar: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const semMovimento = useReducedMotion();

  const distancia = useTransform(mouseX, (x) => {
    const caixa = ref.current?.getBoundingClientRect();
    if (!caixa) return RAIO * 2;
    return x - caixa.x - caixa.width / 2;
  });

  const escalaCrua = useTransform(
    distancia,
    [-RAIO, 0, RAIO],
    [1, AMPLIACAO, 1],
  );

  const escala = useSpring(escalaCrua, {
    stiffness: 260,
    damping: 22,
    mass: 0.35,
  });

  return (
    <motion.button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={ativa}
      aria-controls={`painel-${item.id}`}
      onClick={aoTrocar}
      style={{ scale: escala }}
      className={`dock__aba ${ativa ? "dock__aba--ativa" : ""}`}
    >
      {/* Um fundo só, que viaja de aba em aba pelo layoutId. Trocar a
          classe faria a marca apagar aqui e acender ali; assim o olho
          acompanha o mesmo objeto se mudando de lugar. */}
      {ativa && (
        <motion.span
          layoutId="dock-fundo"
          className="dock__fundo"
          aria-hidden="true"
          transition={
            semMovimento
              ? { duration: 0 }
              : { type: "spring", stiffness: 400, damping: 34, mass: 0.6 }
          }
        />
      )}
      <span className="dock__rotulo" style={{ display: "inline-block" }}>
        {item.rotulo}
      </span>
    </motion.button>
  );
}
