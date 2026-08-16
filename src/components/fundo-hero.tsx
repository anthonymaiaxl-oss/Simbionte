/**
 * Números irradiando de trás do texto da Hero.
 *
 * Todos nascem no mesmo ponto — atrás do nome — pequenos e invisíveis,
 * crescem enquanto viajam para fora e apagam ao chegar na borda. É a
 * diferença entre "surgir do nada e subir" e um fluxo com origem: o
 * olho entende de onde vêm.
 *
 * Cada um tem seu próprio ângulo, distância, escala final e tempo. As
 * escalas variam bastante de propósito — um punhado bem maior que o
 * resto é o que dá profundidade; se todos tivessem o mesmo corpo a
 * camada viraria papel de parede.
 *
 * Sem JavaScript: laço infinito de transform e opacity é o caso em que
 * o CSS ganha — roda no compositor e não custa um rAF por elemento.
 * Server component, zero JS no cliente.
 *
 * As distâncias vão em `vmin` para o alcance acompanhar a tela sem
 * estourar no celular nem encolher no monitor grande.
 */

type Marca = {
  texto: string;
  /** ângulo de saída, em graus, a partir do centro */
  angulo: number;
  /** distância percorrida, em vmin */
  alcance: number;
  /** corpo do texto em rem */
  corpo: number;
  /** escala ao chegar na borda */
  escalaFim: number;
  giro: number;
  atraso: number;
  duracao: number;
};

const MARCAS: Marca[] = [
  { texto: "24/7", angulo: 196, alcance: 38, corpo: 1.1, escalaFim: 1.5, giro: -8, atraso: 0, duracao: 17 },
  { texto: "1,4s", angulo: 158, alcance: 33, corpo: 0.8, escalaFim: 1.3, giro: 6, atraso: 5.1, duracao: 21 },
  { texto: "82%", angulo: 213, alcance: 41, corpo: 2.6, escalaFim: 1.9, giro: 11, atraso: 11.4, duracao: 15 },
  { texto: "348", angulo: 174, alcance: 36, corpo: 0.7, escalaFim: 1.2, giro: -3, atraso: 2.8, duracao: 23 },
  { texto: "0 filas", angulo: 141, alcance: 30, corpo: 1.35, escalaFim: 1.6, giro: 13, atraso: 8.6, duracao: 19 },
  { texto: "+38%", angulo: 232, alcance: 35, corpo: 0.95, escalaFim: 1.4, giro: -12, atraso: 14.2, duracao: 16 },
  { texto: "09:12", angulo: 118, alcance: 39, corpo: 0.75, escalaFim: 1.25, giro: 7, atraso: 6.9, duracao: 22 },
  { texto: "3 dias", angulo: 344, alcance: 34, corpo: 1.05, escalaFim: 1.45, giro: -10, atraso: 1.7, duracao: 20 },
  { texto: "2x", angulo: 22, alcance: 42, corpo: 3.1, escalaFim: 2.1, giro: 4, atraso: 9.8, duracao: 14 },
  { texto: "15min", angulo: 328, alcance: 31, corpo: 0.85, escalaFim: 1.35, giro: -6, atraso: 16.3, duracao: 24 },
  { texto: "0 perdidas", angulo: 6, alcance: 37, corpo: 0.7, escalaFim: 1.15, giro: 9, atraso: 4.4, duracao: 25 },
  { texto: "1 clique", angulo: 302, alcance: 33, corpo: 1.2, escalaFim: 1.55, giro: -14, atraso: 12.7, duracao: 18 },
  { texto: "3 abertas", angulo: 40, alcance: 29, corpo: 0.78, escalaFim: 1.3, giro: 3, atraso: 18.5, duracao: 21 },
  { texto: "∞", angulo: 64, alcance: 44, corpo: 3.6, escalaFim: 2.3, giro: -5, atraso: 3.5, duracao: 13 },
  { texto: "R$0", angulo: 258, alcance: 32, corpo: 1.6, escalaFim: 1.7, giro: 10, atraso: 20.1, duracao: 19 },
  { texto: "0,9s", angulo: 96, alcance: 36, corpo: 0.72, escalaFim: 1.2, giro: -9, atraso: 7.6, duracao: 23 },
  { texto: "100%", angulo: 282, alcance: 40, corpo: 2.1, escalaFim: 1.8, giro: 12, atraso: 15.9, duracao: 16 },
  { texto: "+2", angulo: 78, alcance: 27, corpo: 0.9, escalaFim: 1.4, giro: -7, atraso: 10.9, duracao: 20 },
];

const rad = (graus: number) => (graus * Math.PI) / 180;

export function FundoHero() {
  return (
    <div className="fundo-hero" aria-hidden="true">
      {MARCAS.map((m) => {
        // Achatado na vertical: a Hero é mais larga que alta, e um
        // espalhamento circular sairia da tela pelos lados de cima.
        const dx = Math.cos(rad(m.angulo)) * m.alcance;
        const dy = Math.sin(rad(m.angulo)) * m.alcance * 0.58;

        return (
          <span
            key={m.texto}
            className="fundo-hero__marca"
            style={{
              fontSize: `${m.corpo}rem`,
              ["--dx" as string]: `${dx.toFixed(2)}vmin`,
              ["--dy" as string]: `${dy.toFixed(2)}vmin`,
              ["--escala-fim" as string]: m.escalaFim,
              ["--giro" as string]: `${m.giro}deg`,
              animationDelay: `-${m.atraso}s`,
              animationDuration: `${m.duracao}s`,
            }}
          >
            {m.texto}
          </span>
        );
      })}
    </div>
  );
}
