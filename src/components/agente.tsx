"use client";

import { useState } from "react";
import { CONFIGURACAO } from "@/lib/dados-painel";

/**
 * Como o agente se comporta.
 *
 * O botão de salvar só acorda quando algo muda: salvar sem alteração é
 * um clique que não faz nada, e um botão sempre aceso ensina a pessoa a
 * ignorá-lo.
 */

export function Agente() {
  const [forma, setForma] = useState(CONFIGURACAO);
  const [salvo, setSalvo] = useState(false);

  const mudou = JSON.stringify(forma) !== JSON.stringify(CONFIGURACAO);

  const alterar = <K extends keyof typeof forma>(
    campo: K,
    valor: (typeof forma)[K],
  ) => {
    setForma((f) => ({ ...f, [campo]: valor }));
    setSalvo(false);
  };

  return (
    <div id="painel-agente" role="tabpanel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: gravar na tabela de configuração do agente.
          setSalvo(true);
        }}
        className="agente"
      >
        <div className="agente__campo">
          <label htmlFor="nome-agente">Como o agente se apresenta</label>
          <input
            id="nome-agente"
            value={forma.nomeAgente}
            onChange={(e) => alterar("nomeAgente", e.target.value)}
            aria-describedby="apoio-nome"
            className="entrada"
          />
          <p id="apoio-nome" className="agente__apoio">
            É o nome que aparece na primeira mensagem para quem chama.
          </p>
        </div>

        <div className="agente__campo">
          <label htmlFor="boas-vindas">Mensagem de boas-vindas</label>
          <textarea
            id="boas-vindas"
            rows={3}
            value={forma.boasVindas}
            onChange={(e) => alterar("boasVindas", e.target.value)}
            aria-describedby="apoio-boas-vindas"
            className="entrada entrada--area"
          />
          <p id="apoio-boas-vindas" className="agente__apoio">
            Enviada uma vez, no primeiro contato de cada pessoa.
          </p>
        </div>

        <fieldset className="agente__grupo">
          <legend className="rotulo">Horário de atendimento</legend>
          <div className="agente__horas">
            <div className="agente__campo">
              <label htmlFor="inicio">Começa às</label>
              <input
                id="inicio"
                type="time"
                value={forma.inicio}
                onChange={(e) => alterar("inicio", e.target.value)}
                className="entrada"
              />
            </div>
            <div className="agente__campo">
              <label htmlFor="fim">Termina às</label>
              <input
                id="fim"
                type="time"
                value={forma.fim}
                onChange={(e) => alterar("fim", e.target.value)}
                className="entrada"
              />
            </div>
          </div>

          <label className="interruptor">
            <input
              type="checkbox"
              checked={forma.responderForaDoHorario}
              onChange={(e) =>
                alterar("responderForaDoHorario", e.target.checked)
              }
            />
            <span className="interruptor__trilho" aria-hidden="true">
              <span className="interruptor__bola" />
            </span>
            <span>
              Responder fora do horário avisando quando a equipe volta
            </span>
          </label>
        </fieldset>

        <div className="agente__campo">
          <label htmlFor="passar-humano">Quando passar para uma pessoa</label>
          <textarea
            id="passar-humano"
            rows={3}
            value={forma.passarParaHumano}
            onChange={(e) => alterar("passarParaHumano", e.target.value)}
            aria-describedby="apoio-humano"
            className="entrada entrada--area"
          />
          <p id="apoio-humano" className="agente__apoio">
            Escreva com suas palavras. A conversa vai para a aba de
            conversas marcada como pendente.
          </p>
        </div>

        <div className="agente__rodape">
          <button type="submit" disabled={!mudou} className="assumir">
            Salvar alterações
          </button>
          {/* O botão diz "Salvar alterações" e a confirmação diz
              "Alterações salvas": a ação mantém o nome pelo fluxo. */}
          <p aria-live="polite" className="agente__aviso">
            {salvo
              ? "Alterações salvas."
              : mudou
                ? "Você tem alterações não salvas."
                : ""}
          </p>
        </div>
      </form>
    </div>
  );
}
