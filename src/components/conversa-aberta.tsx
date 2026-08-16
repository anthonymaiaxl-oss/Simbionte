"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUTORES,
  ESTADOS,
  type Conversa,
  type Mensagem,
} from "@/lib/dados-painel";

/**
 * Uma conversa aberta: histórico, pausa da IA e assumir o atendimento.
 *
 * Duas ações que parecem a mesma coisa e não são:
 *
 *   Pausar IA        → o bot cala. Ninguém responde até alguém entrar.
 *   Assumir          → o bot cala E abre o campo para você escrever.
 *
 * Por isso assumir também pausa: seria pior os dois responderem juntos.
 * Pausar sozinho continua existindo para quem só quer silenciar o bot
 * sem ir escrever agora.
 */

export function ConversaAberta({
  conversa,
  pausado,
  aoPausar,
  aoVoltar,
}: {
  conversa: Conversa;
  pausado: boolean;
  aoPausar: (valor: boolean) => void;
  aoVoltar: () => void;
}) {
  const [assumido, setAssumido] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>(conversa.mensagens);
  const [texto, setTexto] = useState("");

  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const proximoId = useRef(1);

  // Ao trocar de conversa, recomeça: histórico, rascunho e o modo de
  // atendimento são daquela conversa, não do painel.
  useEffect(() => {
    setMensagens(conversa.mensagens);
    setAssumido(false);
    setTexto("");
  }, [conversa]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  const assumir = () => {
    setAssumido(true);
    // Assumir sem pausar deixaria o bot respondendo por cima de você.
    aoPausar(true);
    window.setTimeout(() => campo.current?.focus(), 60);
  };

  const devolver = () => {
    setAssumido(false);
    aoPausar(false);
    setTexto("");
  };

  const enviar = () => {
    const conteudo = texto.trim();
    if (!conteudo) return;
    // TODO: enviar para o WhatsApp pela API do agente.
    setMensagens((m) => [
      ...m,
      {
        id: `local-${proximoId.current++}`,
        de: "humano",
        texto: conteudo,
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setTexto("");
    campo.current?.focus();
  };

  const estado = ESTADOS[conversa.estado];

  return (
    <div className="aberta">
      <button type="button" onClick={aoVoltar} className="aberta__voltar">
        ← Voltar para conversas
      </button>

      <header className="aberta__cabeca">
        <span className="conversa__inicial" aria-hidden="true">
          {conversa.nome
            .split(" ")
            .filter((p) => p.length > 2)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase()}
        </span>

        <span className="aberta__quem">
          <span className="conversa__nome">{conversa.nome}</span>
          <span className="aberta__linha">
            <span className="conversa__telefone">{conversa.telefone}</span>
            <span
              className="conversa__selo"
              style={{ color: estado.cor, borderColor: estado.cor }}
            >
              {estado.rotulo}
            </span>
          </span>
        </span>

        <span className="aberta__acoes">
          <button
            type="button"
            onClick={() => aoPausar(!pausado)}
            aria-pressed={pausado}
            className={`pausa ${pausado ? "pausa--ligada" : ""}`}
          >
            {pausado ? "IA pausada" : "Pausar IA"}
          </button>

          {assumido ? (
            // Assumir sem volta seria um beco: a pessoa responde o que
            // precisava e fica presa no modo manual. Devolver religa a
            // IA e fecha o campo, na mesma tela.
            <button type="button" onClick={devolver} className="devolver">
              Devolver para a IA
            </button>
          ) : (
            <button type="button" onClick={assumir} className="assumir">
              Assumir atendimento
            </button>
          )}
        </span>
      </header>

      <div className="thread" role="log" aria-label={`Conversa com ${conversa.nome}`}>
        {mensagens.map((m, i) => (
          <div
            key={m.id}
            className={`balao balao--${m.de}`}
            style={{ ["--ordem" as string]: Math.min(i, 8) }}
          >
            <p className="balao__autor" style={{ color: AUTORES[m.de].cor }}>
              {AUTORES[m.de].rotulo}
              <span className="balao__hora">{m.hora}</span>
            </p>
            <p className="balao__texto">{m.texto}</p>
          </div>
        ))}
        <div ref={fim} />
      </div>

      {assumido ? (
        <div className="responder">
          <p className="responder__aviso">
            Você assumiu esta conversa. A IA está pausada e não vai responder.
          </p>
          <div className="responder__linha">
            <label htmlFor="resposta" className="sr-only">
              Sua resposta para {conversa.nome}
            </label>
            <textarea
              ref={campo}
              id="resposta"
              rows={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder={`Responder para ${conversa.nome.split(" ")[0]}…`}
              className="chat__campo"
            />
            <button
              type="button"
              onClick={enviar}
              disabled={!texto.trim()}
              className="chat__enviar"
              aria-label="Enviar resposta"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <p className="responder__dica">
          {pausado
            ? "A IA está pausada nesta conversa. Assuma o atendimento para responder por aqui."
            : "A IA está respondendo esta conversa. Assuma o atendimento para escrever você mesmo."}
        </p>
      )}
    </div>
  );
}
