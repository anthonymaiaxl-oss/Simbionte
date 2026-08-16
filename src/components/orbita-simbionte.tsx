"use client";

import { memo } from "react";
import { OrbitingCircles, Ripple } from "@/components/ui/modern-animated-sign-in";
import { AnimatedText } from "@/components/ui/animated-text";

/**
 * Lado esquerdo da entrada: o nome no centro e os símbolos do produto
 * orbitando em volta.
 *
 * Os ícones são SVG inline, não imagens de CDN. Além de não depender de
 * rede nem de liberar domínio no next.config, eles herdam a cor — o que
 * permite dar tons diferentes por órbita sem gerar arquivo novo.
 *
 * São símbolos do que este produto faz: WhatsApp, balão de conversa,
 * confirmação de leitura, robô, relógio, faísca de IA. Nada de logos de
 * tecnologia, que não dizem nada a quem entra no painel.
 */

function Zap() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.470 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12 2a10 10 0 00-8.6 15.06L2 22l5.06-1.33A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31A8.2 8.2 0 1112 20.2z" />
    </svg>
  );
}

function Balao() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0112 3.1a8.4 8.4 0 019 8.4z" />
    </svg>
  );
}

function Lidas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 12.5l4 4 8-9" />
      <path d="M9.5 16.5l1 1 8-9" />
    </svg>
  );
}

function Robo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="4" />
      <circle cx="9" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 7V3.5M10.4 3.5h3.2" />
    </svg>
  );
}

function Relogio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 1.9" />
    </svg>
  );
}

function Faisca() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.7L19.6 9.6l-5.7 1.9L12 17.2l-1.9-5.7L4.4 9.6l5.7-1.9L12 2z" />
    </svg>
  );
}

function Fone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <path d="M4 14h2.5a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1zM20 14h-2.5a1 1 0 00-1 1v3a1 1 0 001 1H19a1 1 0 001-1z" />
    </svg>
  );
}

type Corpo = {
  icone: () => React.ReactNode;
  tamanho: number;
  raio: number;
  duracao: number;
  atraso: number;
  reverso?: boolean;
  cor: string;
  trilha?: boolean;
};

const CORPOS: Corpo[] = [
  { icone: Balao, tamanho: 26, raio: 96, duracao: 22, atraso: 0, cor: "var(--color-bruma)" },
  { icone: Lidas, tamanho: 26, raio: 96, duracao: 22, atraso: 11, cor: "var(--color-pulso)" },
  { icone: Zap, tamanho: 38, raio: 168, duracao: 28, atraso: 0, reverso: true, cor: "var(--color-simbionte-claro)", trilha: true },
  { icone: Robo, tamanho: 38, raio: 168, duracao: 28, atraso: 14, reverso: true, cor: "var(--color-marfim)" },
  { icone: Relogio, tamanho: 30, raio: 240, duracao: 34, atraso: 0, cor: "var(--color-bruma)", trilha: true },
  { icone: Faisca, tamanho: 26, raio: 240, duracao: 34, atraso: 12, cor: "var(--color-pulso)" },
  { icone: Fone, tamanho: 30, raio: 240, duracao: 34, atraso: 24, cor: "var(--color-bruma)" },
];

export const OrbitaSimbionte = memo(function OrbitaSimbionte() {
  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <Ripple />

      {/* Mesma tipografia e mesma onda verde do nome na home: quem entra
          reconhece de onde veio. */}
      <div className="relative z-10 px-8">
        <AnimatedText
          text="Simbionte"
          duration={0.045}
          delay={0.05}
          className="items-center"
          textClassName="font-[family-name:var(--fonte-gabarito)] text-6xl font-extrabold leading-none tracking-[-0.035em] xl:text-7xl"
        />
      </div>

      {CORPOS.map((c, i) => (
        <OrbitingCircles
          key={i}
          radius={c.raio}
          duration={c.duracao}
          delay={c.atraso}
          reverse={c.reverso}
          path={c.trilha ?? false}
          className="border-none bg-transparent"
        >
          <span
            className="grid place-items-center rounded-full border border-borda bg-superficie/80 backdrop-blur-sm"
            style={{
              width: c.tamanho + 18,
              height: c.tamanho + 18,
              color: c.cor,
            }}
          >
            <span
              style={{ width: c.tamanho * 0.62, height: c.tamanho * 0.62 }}
              className="[&>svg]:h-full [&>svg]:w-full"
            >
              {c.icone()}
            </span>
          </span>
        </OrbitingCircles>
      ))}
    </section>
  );
});
