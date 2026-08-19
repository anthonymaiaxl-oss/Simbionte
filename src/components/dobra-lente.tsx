/**
 * A passagem entre a Hero e o painel.
 *
 * O problema aqui sempre foi cor, não desenho: o verde do painel começava
 * de uma vez na borda de cima, e o encontro com o preto virava uma linha.
 * Isso está resolvido no CSS, em `.painel::before`. Tentei antes disfarçar
 * com um arco de luz e só apontei para o defeito.
 *
 * Com a borda resolvida, esta faixa ficou livre para dizer alguma coisa.
 * Ela virou um letreiro: três frases sobre o que o agente faz, correndo
 * devagar, e dois selos parados por cima.
 *
 * O símbolo do WhatsApp saiu daqui e foi para o fundo da Hero, junto dos
 * números que saem de trás do robô — lá ele pertence à mesma família de
 * marcas; aqui era um elemento solto.
 *
 * Componente de servidor: zero JavaScript.
 */

/**
 * Três frases, e só três.
 *
 * Falam com o dono da ótica, não com o cliente dele, e cada uma diz uma
 * coisa concreta que o agente faz. Nada de "solução inteligente" ou
 * "tecnologia de ponta": promessa vaga não vende para quem já viu muita.
 */
const FRASES = [
  "Atende 24 horas por dia, 7 dias por semana",
  "Nenhum cliente esperando resposta",
  "Você atende na loja. Ele atende no WhatsApp.",
];

const CAMINHO_ZAP =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

function Zap() {
  return (
    <svg className="letreiro__zap" viewBox="0 0 24 24" focusable="false">
      <path d={CAMINHO_ZAP} fill="currentColor" />
    </svg>
  );
}

/**
 * Uma volta completa do letreiro.
 *
 * Duas cópias iguais correm lado a lado e a animação desloca exatamente
 * a largura de uma. Quando a primeira sai, a segunda já está no lugar
 * dela — é o que faz o texto parecer não ter fim.
 */
function Volta() {
  return (
    <span className="letreiro__volta">
      {FRASES.map((f) => (
        <span key={f} className="letreiro__item">
          {f}
          <Zap />
        </span>
      ))}
    </span>
  );
}

/**
 * Selo com brilho girando por dentro.
 *
 * O brilho é um losango largo que roda devagar atrás do texto, recortado
 * pela borda arredondada. Vem da ideia daquele selo de premiação, mas
 * refeito nas cores da marca e sem os sete tons de arco-íris — aqui ele
 * precisa parecer parte da página, não um adesivo colado.
 */
function Selo({ texto, atraso }: { texto: string; atraso: number }) {
  return (
    <span className="selo">
      <span
        className="selo__brilho"
        style={{ animationDelay: `${atraso}s` }}
        aria-hidden="true"
      />
      <span className="selo__texto">{texto}</span>
    </span>
  );
}

export function DobraLente() {
  return (
    <div className="passagem">
      <div className="letreiro" aria-hidden="true">
        <div className="letreiro__trilho">
          <Volta />
          <Volta />
        </div>
      </div>

      <div className="passagem__selos">
        <Selo texto="Criado por Simbionte" atraso={0} />
        <Selo texto="Agente ativo agora" atraso={-3.5} />
      </div>
    </div>
  );
}
