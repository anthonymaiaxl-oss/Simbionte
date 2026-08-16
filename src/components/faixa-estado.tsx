/**
 * Faixa de estado do agente.
 *
 * Uma linha só, logo abaixo da Hero. Responde a pergunta nº1 de quem
 * abre o painel — "está funcionando?" — sem gastar uma seção inteira,
 * deixando o espaço nobre para as conversas que vêm depois.
 *
 * Os dados aqui são de exemplo. O tipo abaixo é o contrato: quando as
 * tabelas existirem, troque a origem e nada mais muda.
 */

export type EstadoAgente = "conectado" | "reconectando" | "fora";

export type Estado = {
  agente: EstadoAgente;
  desde: string;
  conversasAbertas: number;
  esperandoVoce: number;
};

const EXEMPLO: Estado = {
  agente: "conectado",
  desde: "09:12",
  conversasAbertas: 3,
  esperandoVoce: 1,
};

const APARENCIA: Record<EstadoAgente, { cor: string; texto: string }> = {
  conectado: { cor: "var(--color-pulso)", texto: "Conectado" },
  reconectando: { cor: "var(--color-alerta)", texto: "Reconectando" },
  fora: { cor: "var(--color-falha)", texto: "Fora do ar" },
};

export function FaixaEstado({ estado = EXEMPLO }: { estado?: Estado }) {
  const aparencia = APARENCIA[estado.agente];
  const temEspera = estado.esperandoVoce > 0;

  return (
    <section className="faixa" aria-label="Estado do agente">
      <div className="faixa__conteudo">
        <p className="faixa__estado">
          {/* O ponto pulsa só quando está no ar: parado, ele mesmo já diz
              que alguma coisa não está correndo. */}
          <span
            aria-hidden="true"
            className={`faixa__ponto ${
              estado.agente === "conectado" ? "faixa__ponto--vivo" : ""
            }`}
            style={{ backgroundColor: aparencia.cor }}
          />
          {/* Estado nunca é comunicado só por cor: o texto vem junto. */}
          <span style={{ color: aparencia.cor }}>{aparencia.texto}</span>
          <span className="faixa__desde">desde {estado.desde}</span>
        </p>

        <span className="faixa__risco" aria-hidden="true" />

        <p className="faixa__item">
          <strong className="faixa__numero">{estado.conversasAbertas}</strong>
          {estado.conversasAbertas === 1
            ? "conversa aberta"
            : "conversas abertas"}
        </p>

        <span className="faixa__risco" aria-hidden="true" />

        <p className={`faixa__item ${temEspera ? "faixa__item--atencao" : ""}`}>
          {temEspera ? (
            <>
              <strong className="faixa__numero">{estado.esperandoVoce}</strong>
              {estado.esperandoVoce === 1
                ? "esperando você"
                : "esperando você"}
            </>
          ) : (
            "ninguém esperando você"
          )}
        </p>
      </div>
    </section>
  );
}
