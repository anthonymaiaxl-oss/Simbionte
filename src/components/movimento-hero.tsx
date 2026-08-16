"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * Rolagem suave e parallax da Hero.
 *
 * Não usa imagens de camada como o exemplo original: as camadas são o
 * próprio conteúdo — números do fundo, brilho e o bloco do nome. Cada
 * uma sobe numa taxa diferente conforme a página rola, e é a diferença
 * entre elas que cria a profundidade.
 *
 * O ROBÔ FICA DE FORA de propósito. Ele já é posicionado por scroll
 * (segue a vaga na Hero e depois ancora no canto); somar um transform
 * do GSAP em cima brigaria com esse cálculo a cada frame.
 *
 * O Lenis não sequestra a posição de rolagem — ele anima `window.scrollTo`,
 * então `scrollY` continua correto e os eventos de scroll continuam
 * disparando. É por isso que a ancoragem do robô segue funcionando.
 */

const CAMADAS: { seletor: string; yPercent: number }[] = [
  { seletor: "[data-camada='fundo']", yPercent: 42 },
  { seletor: "[data-camada='titulo']", yPercent: 16 },
];

export function MovimentoHero() {
  useEffect(() => {
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.registerPlugin(ScrollTrigger);

    const hero = document.querySelector<HTMLElement>(".hero");

    const contexto = gsap.context(() => {
      if (semMovimento || !hero) return;

      const linha = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      CAMADAS.forEach(({ seletor, yPercent }, i) => {
        const alvos = hero.querySelectorAll(seletor);
        if (!alvos.length) return;
        linha.to(alvos, { yPercent, ease: "none" }, i === 0 ? undefined : "<");
      });
    });

    // Rolagem suave. Sem isso o parallax fica com a cadência serrilhada
    // da roda do mouse em vez de deslizar.
    let lenis: Lenis | null = null;
    let aoTick: ((tempo: number) => void) | null = null;

    if (!semMovimento) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      aoTick = (tempo: number) => lenis?.raf(tempo * 1000);
      gsap.ticker.add(aoTick);
      gsap.ticker.lagSmoothing(0);
    }

    return () => {
      contexto.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (aoTick) gsap.ticker.remove(aoTick);
      lenis?.destroy();
    };
  }, []);

  return null;
}
