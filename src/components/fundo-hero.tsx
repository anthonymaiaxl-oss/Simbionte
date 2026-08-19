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

/** Glifo do WhatsApp, para as marcas que sao simbolo em vez de texto. */
const CAMINHO_ZAP =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

type Marca = {
  /** Texto da marca, ou vazio quando ela e o simbolo do WhatsApp. */
  texto: string;
  /** Marca que e simbolo, nao numero. Sai do mesmo lugar, no mesmo ritmo. */
  simbolo?: boolean;
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

  // O simbolo do WhatsApp sai do mesmo ponto que os numeros, na mesma
  // escala e no mesmo ritmo — nao e outro efeito, e a mesma familia.
  // Angulos escolhidos nos vazios que sobravam entre as marcas de texto.
  { texto: "zap-1", simbolo: true, angulo: 126, distancia: 0.68, corpo: 2.1, giro: -9, atraso: 8.7, duracao: 27 },
  { texto: "zap-2", simbolo: true, angulo: 250, distancia: 0.34, corpo: 3.2, giro: 6, atraso: 19.2, duracao: 20 },
  { texto: "zap-3", simbolo: true, angulo: 32, distancia: 0.86, corpo: 1.4, giro: 12, atraso: 3.4, duracao: 31 },
  { texto: "zap-4", simbolo: true, angulo: 208, distancia: 0.9, corpo: 1.25, giro: -4, atraso: 25.3, duracao: 34 },
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
            {m.simbolo ? (
              // 1em: o simbolo acompanha o `corpo` da marca, entao a
              // escala vem da mesma regra que a dos numeros.
              <svg
                viewBox="0 0 24 24"
                style={{ width: "1em", height: "1em", display: "block" }}
                focusable="false"
              >
                <path d={CAMINHO_ZAP} fill="currentColor" />
              </svg>
            ) : (
              m.texto
            )}
          </span>
        );
      })}
    </div>
  );
}
