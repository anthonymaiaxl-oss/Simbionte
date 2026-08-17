/**
 * Números espalhados no fundo da Hero.
 *
 * A POSIÇÃO de cada um é layout: `left`/`top` em porcentagem, calculados
 * a partir de um ângulo e de uma distância. É isso que garante que eles
 * ocupem a tela toda, em todas as direções.
 *
 * A tentativa anterior punha a viagem inteira dentro do keyframe, com
 * `translate(calc(-50% + var(--dx)))`. Variável CSS não registrada não
 * interpola de forma confiável nesse contexto, e o resultado eram as 18
 * marcas amontoadas num quadrado de 70×60px, todas do mesmo lado.
 *
 * Agora a animação faz só o que animação faz bem: aparecer, respirar
 * para fora e apagar. Se ela falhar, o pior caso é ficarem paradas nos
 * lugares certos — não empilhadas num canto.
 *
 * Server component: zero JavaScript no cliente.
 */

type Marca = {
  texto: string;
  /** direção a partir do centro, em graus */
  angulo: number;
  /** distância do centro, de 0 a 1 */
  distancia: number;
  corpo: number;
  giro: number;
  atraso: number;
  duracao: number;
};

const MARCAS: Marca[] = [
  { texto: "24/7", angulo: 198, distancia: 0.62, corpo: 1.6, giro: -8, atraso: 0, duracao: 23 },
  { texto: "1,4s", angulo: 156, distancia: 0.84, corpo: 1.15, giro: 6, atraso: 7.8, duracao: 28 },
  { texto: "82%", angulo: 222, distancia: 0.44, corpo: 3.6, giro: 11, atraso: 16, duracao: 19 },
  { texto: "348", angulo: 176, distancia: 0.95, corpo: 1, giro: -3, atraso: 4.2, duracao: 32 },
  { texto: "0 filas", angulo: 138, distancia: 0.5, corpo: 1.95, giro: 13, atraso: 12.5, duracao: 25 },
  { texto: "+38%", angulo: 240, distancia: 0.78, corpo: 1.4, giro: -12, atraso: 20.5, duracao: 21 },
  { texto: "09:12", angulo: 112, distancia: 0.9, corpo: 1.1, giro: 7, atraso: 10.1, duracao: 30 },
  { texto: "3 dias", angulo: 340, distancia: 0.58, corpo: 1.5, giro: -10, atraso: 2.5, duracao: 26 },
  { texto: "2x", angulo: 18, distancia: 0.4, corpo: 4.4, giro: 4, atraso: 14.3, duracao: 18 },
  { texto: "15min", angulo: 322, distancia: 0.88, corpo: 1.2, giro: -6, atraso: 23.6, duracao: 33 },
  { texto: "0 perdidas", angulo: 4, distancia: 0.92, corpo: 1, giro: 9, atraso: 6.5, duracao: 35 },
  { texto: "1 clique", angulo: 296, distancia: 0.66, corpo: 1.7, giro: -14, atraso: 18.4, duracao: 23 },
  { texto: "3 abertas", angulo: 44, distancia: 0.8, corpo: 1.1, giro: 3, atraso: 26.8, duracao: 28 },
  { texto: "∞", angulo: 68, distancia: 0.46, corpo: 5.2, giro: -5, atraso: 5.1, duracao: 16 },
  { texto: "R$0", angulo: 262, distancia: 0.54, corpo: 2.3, giro: 10, atraso: 29.1, duracao: 25 },
  { texto: "0,9s", angulo: 92, distancia: 0.72, corpo: 1.05, giro: -9, atraso: 11, duracao: 32 },
  { texto: "100%", angulo: 284, distancia: 0.36, corpo: 3, giro: 12, atraso: 22.6, duracao: 21 },
  { texto: "+2", angulo: 74, distancia: 0.96, corpo: 1.3, giro: -7, atraso: 15.6, duracao: 26 },
];

/** Meia largura e meia altura do campo, em % do container. */
const RAIO_X = 46;
const RAIO_Y = 40;

/**
 * Altura da cabeça do robô dentro da Hero, em % — medido no navegador,
 * não chutado. Mudou de 43 para 52 quando o container passou a ocupar a
 * tela inteira: a caixa cresceu, então a mesma altura em pixels virou
 * outra porcentagem.
 */
const CENTRO_Y = 52;

const rad = (graus: number) => (graus * Math.PI) / 180;

export function FundoHero() {
  return (
    <div className="fundo-hero" aria-hidden="true">
      {MARCAS.map((m) => {
        const x = 50 + Math.cos(rad(m.angulo)) * m.distancia * RAIO_X;
        const y = CENTRO_Y + Math.sin(rad(m.angulo)) * m.distancia * RAIO_Y;

        // Deslocamento que traz a marca de volta à cabeça do robô no
        // início do ciclo. O container tem 100vw de largura, então cada
        // ponto percentual em x vale 1vw. Em y uso vw também, corrigido
        // pela proporção da Hero: não existe unidade para "altura do
        // container" em CSS, e a aproximação é imperceptível.
        const voltaX = -(x - 50);
        const voltaY = -(y - CENTRO_Y) * 0.62;

        return (
          <span
            key={m.texto}
            className="fundo-hero__marca"
            style={{
              left: `${x.toFixed(2)}%`,
              top: `${y.toFixed(2)}%`,
              fontSize: `${m.corpo}rem`,
              ["--volta-x" as string]: `${voltaX.toFixed(2)}vw`,
              ["--volta-y" as string]: `${voltaY.toFixed(2)}vw`,
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
