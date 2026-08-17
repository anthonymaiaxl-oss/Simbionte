"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Grupo de chips com indicador deslizante.
 *
 * O fundo do item ativo é um único elemento que o Motion move de um chip
 * para outro pelo `layoutId`: em vez de apagar aqui e acender ali, o
 * mesmo retângulo viaja. É isso que dá a sensação de continuidade — o
 * olho segue o objeto e entende que a seleção mudou de lugar, não que
 * duas coisas diferentes piscaram.
 *
 * O `grupo` existe porque o layoutId é global: dois grupos de chips na
 * mesma tela com o mesmo id fariam o fundo saltar de um para o outro.
 */

export type ItemChip = {
  id: string;
  rotulo: string;
  /** Opcional: filtros mostram quantidade, ordenação não. */
  conta?: number;
};

export function Chips<T extends string>({
  itens,
  atual,
  aoTrocar,
  grupo,
  rotuloGrupo,
}: {
  itens: readonly { id: T; rotulo: string; conta?: number }[];
  atual: T;
  aoTrocar: (id: T) => void;
  grupo: string;
  rotuloGrupo: string;
}) {
  const semMovimento = useReducedMotion();

  return (
    <div className="filtros__chips" role="group" aria-label={rotuloGrupo}>
      {itens.map((item) => {
        const ativo = atual === item.id;
        return (
          <button
            key={item.id}
            type="button"
            /* aria-pressed em vez de só classe: o leitor de tela precisa
               saber que o filtro está ligado. */
            aria-pressed={ativo}
            onClick={() => aoTrocar(item.id)}
            className={`chip ${ativo ? "chip--ativo" : ""}`}
          >
            {ativo && (
              <motion.span
                layoutId={`chip-fundo-${grupo}`}
                className="chip__fundo"
                aria-hidden="true"
                transition={
                  semMovimento
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 32, mass: 0.6 }
                }
              />
            )}
            <span className="chip__texto">{item.rotulo}</span>
            {item.conta !== undefined && (
              <span className="chip__conta">{item.conta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
