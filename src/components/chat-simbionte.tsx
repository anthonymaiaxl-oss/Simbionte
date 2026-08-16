"use client";

import { useRef, useState } from "react";

/**
 * Barra de conversa com o Simbionte.
 *
 * Fica logo abaixo do robô, na linha em que o corpo dele é cortado —
 * a intenção é que ele pareça emergir de dentro da própria conversa,
 * em vez de o corte parecer um erro.
 *
 * Ainda não fala com IA nenhuma. A função `enviar` é o ponto onde a
 * chamada entra depois; o campo, o anexo, as sugestões e os estados de
 * envio já estão prontos ao redor dela.
 */

const SUGESTOES = [
  "Quantas conversas estão abertas agora?",
  "Qual dúvida mais se repetiu esta semana?",
  "Alguém ficou sem resposta ontem?",
  "Resuma os atendimentos de hoje",
];

export function ChatSimbionte() {
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<string[]>([]);
  const campo = useRef<HTMLTextAreaElement>(null);
  const seletorArquivo = useRef<HTMLInputElement>(null);

  const enviar = () => {
    const pergunta = texto.trim();
    if (!pergunta) return;
    // TODO: chamar a IA com acesso ao banco da empresa.
    setTexto("");
    campo.current?.focus();
  };

  const usarSugestao = (s: string) => {
    setTexto(s);
    campo.current?.focus();
  };

  return (
    <div className="chat">
      <div className="chat__caixa">
        {anexos.length > 0 && (
          <ul className="chat__anexos">
            {anexos.map((nome, i) => (
              <li key={`${nome}-${i}`} className="chat__anexo">
                <span className="chat__anexo-nome">{nome}</span>
                <button
                  type="button"
                  onClick={() => setAnexos((a) => a.filter((_, j) => j !== i))}
                  className="chat__anexo-tirar"
                  aria-label={`Remover ${nome}`}
                >
                  <IconeFechar />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="chat__linha">
          <button
            type="button"
            onClick={() => seletorArquivo.current?.click()}
            className="chat__acao"
            aria-label="Anexar documento"
          >
            <IconeClipe />
          </button>

          <input
            ref={seletorArquivo}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,image/*"
            className="sr-only"
            onChange={(e) => {
              const nomes = Array.from(e.target.files ?? []).map((f) => f.name);
              if (nomes.length) setAnexos((a) => [...a, ...nomes]);
              e.target.value = "";
            }}
          />

          <span className="chat__faisca" aria-hidden="true">
            <IconeFaisca />
          </span>

          <label htmlFor="pergunta-simbionte" className="sr-only">
            Sua pergunta para o Simbionte
          </label>
          <textarea
            ref={campo}
            id="pergunta-simbionte"
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia; Shift+Enter quebra linha. É o que a pessoa
              // já espera de qualquer campo de conversa.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Tire suas dúvidas sobre os atendimentos…"
            className="chat__campo"
          />

          <button
            type="button"
            onClick={enviar}
            disabled={!texto.trim()}
            className="chat__enviar"
            aria-label="Perguntar ao Simbionte"
          >
            <IconeSeta />
          </button>
        </div>
      </div>

      <ul className="chat__sugestoes">
        {SUGESTOES.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => usarSugestao(s)}
              className="chat__sugestao"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Ícones em SVG, não emoji: escalam, herdam a cor e não dependem da
   fonte do sistema. */

function IconeClipe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.49" />
    </svg>
  );
}

function IconeFaisca() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.7L19.6 9.6l-5.7 1.9L12 17.2l-1.9-5.7L4.4 9.6l5.7-1.9L12 2z" />
      <path d="M18.5 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity="0.6" />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
