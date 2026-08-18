"use client";

import { useEffect } from "react";

/**
 * Brilho verde que segue o ponteiro, na borda das caixas.
 *
 * Mesmo efeito do campo de senha da tela de entrada, espalhado para o
 * resto da página. Lá ele é um componente por campo; aqui seria caro —
 * são dezenas de caixas, e um listener de mouse em cada uma faz o
 * navegador chamar dezenas de funções a cada pixel de movimento.
 *
 * Então é UM listener só, na janela. Ele descobre qual caixa está sob o
 * cursor com `closest` e escreve a posição em duas variáveis CSS dessa
 * caixa. Quem desenha o brilho é o CSS, no `::after` — o JavaScript não
 * pinta nada, só informa onde o mouse está.
 *
 * A escrita é direta, sem requestAnimationFrame. Envolver em rAF parecia
 * mais econômico, mas amarra o efeito a um quadro sendo composto — em
 * aba de segundo plano, ou em navegador embutido que não compõe, o rAF
 * simplesmente não roda e o brilho nunca acende. É o mesmo caminho que o
 * campo da tela de entrada já usa: ler o retângulo e escrever, no
 * próprio evento.
 */

/** Quem ganha brilho. Precisa casar com o seletor do CSS. */
const CAIXAS = [
  ".conversa",
  ".cartao",
  ".chat__balao",
  ".chat__msg",
  ".tabela__caixa",
  ".agente",
  ".aberta__cabeca",
  ".responder",
  ".dock__aba",
  ".chip",
].join(",");

export function BrilhoPonteiro() {
  useEffect(() => {
    // Quem pediu menos movimento não precisa de luz perseguindo cursor.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ultimo: HTMLElement | null = null;

    const apagar = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.removeProperty("--brilho");
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    };

    const aoMover = (e: PointerEvent) => {
      const alvo = (e.target as HTMLElement)?.closest?.(
        CAIXAS,
      ) as HTMLElement | null;

      // Saiu da caixa anterior: apaga o brilho dela em vez de deixar
      // aceso no último ponto onde o mouse passou.
      if (ultimo && ultimo !== alvo) {
        apagar(ultimo);
        ultimo = null;
      }
      if (!alvo) return;

      const r = alvo.getBoundingClientRect();
      alvo.style.setProperty("--mx", `${e.clientX - r.left}px`);
      alvo.style.setProperty("--my", `${e.clientY - r.top}px`);
      alvo.style.setProperty("--brilho", "1");
      ultimo = alvo;
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", aoMover);
      apagar(ultimo);
    };
  }, []);

  // Não desenha nada: só liga o ouvinte.
  return null;
}
