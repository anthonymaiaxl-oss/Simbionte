"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { alternarPausa, enviarMensagem } from "@/app/acoes-painel";
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

/**
 * "IA digitando…" com três pontos pulsando.
 *
 * `role="status"` e não `role="alert"`: é informação de fundo, e alert
 * interromperia a leitura de tela a cada vez que a IA começasse a
 * escrever. O texto fica escrito por extenso para quem não vê os pontos.
 */
function IADigitando() {
  return (
    <div className="digitando" role="status">
      <span className="digitando__texto">IA digitando</span>
      <span className="digitando__pontos" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function ConversaAberta({
  conversa,
  aoMudar,
  aoVoltar,
}: {
  conversa: Conversa;
  /** Avisa o painel que algo mudou, para ele reler do n8n. */
  aoMudar: () => void;
  aoVoltar: () => void;
}) {
  const [assumido, setAssumido] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>(conversa.mensagens);
  const [texto, setTexto] = useState("");
  const [pausado, setPausado] = useState(conversa.botPausado);
  const [enviando, comecarEnvio] = useTransition();
  const [falha, setFalha] = useState<string | null>(null);

  /**
   * Liga ou desliga a IA.
   *
   * Otimista: a tela muda na hora e volta atrás se o n8n recusar. Numa
   * conversa ao vivo, esperar a ida e volta faz o operador clicar de
   * novo achando que não pegou — e dois cliques viram duas trocas.
   */
  const trocarPausa = (valor: boolean) => {
    setPausado(valor);
    setFalha(null);
    comecarEnvio(async () => {
      const r = await alternarPausa(conversa.id, valor);
      if (!r.ok) {
        setPausado(!valor);
        setFalha(r.erro);
      } else {
        aoMudar();
      }
    });
  };

  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const proximoId = useRef(1);

  // Quantas mensagens já existiam quando a conversa abriu. O histórico
  // entra em cascata — é o que dá a sensação de a conversa se montar —
  // mas mensagem nova tem que aparecer na hora: escalonar o que a pessoa
  // acabou de enviar vira lag, não animação.
  //
  // useState e não useRef porque este valor é lido durante o render, para
  // decidir o atraso de cada balão. Ler `ref.current` no render é
  // justamente o que o React proíbe; o setter aqui nunca é chamado, então
  // o valor fica congelado no que era na montagem — que é o que queremos.
  const [historico] = useState(conversa.mensagens.length);

  /**
   * A IA está compondo uma resposta agora.
   *
   * Sai do estado real da conversa, não de um timer decorativo: só faz
   * sentido enquanto a IA é quem responde. Pausar ou assumir derruba o
   * indicador na hora — seria mentira mostrar "IA digitando" logo depois
   * de calar o bot.
   *
   * TODO: quando o agente estiver ligado, isso vira o evento de
   * "resposta em geração" que vem do backend, em vez de derivar do estado.
   */
  const iaEscrevendo = !pausado && !assumido && conversa.estado === "ia";

  // Ao trocar de conversa tudo recomeça — histórico, rascunho e modo de
  // atendimento são daquela conversa, não do painel.
  //
  // Isso é feito remontando o componente pela `key` no pai, e não com um
  // efeito que chama setState: setState no corpo de um efeito dispara um
  // render em cascata. Trocar a key é a forma que o React recomenda para
  // "reiniciar estado quando uma prop muda".

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens, iaEscrevendo]);

  const assumir = () => {
    setAssumido(true);
    // Assumir sem pausar deixaria o bot respondendo por cima de você.
    trocarPausa(true);
    window.setTimeout(() => campo.current?.focus(), 60);
  };

  const devolver = () => {
    setAssumido(false);
    trocarPausa(false);
    setTexto("");
  };

  const enviar = () => {
    const conteudo = texto.trim();
    if (!conteudo) return;

    const id = `local-${proximoId.current++}`;
    setMensagens((m) => [
      ...m,
      {
        id,
        de: "humano",
        texto: conteudo,
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setTexto("");
    setFalha(null);
    campo.current?.focus();

    comecarEnvio(async () => {
      const r = await enviarMensagem(conversa.id, conteudo);
      if (!r.ok) {
        // Tira o balão e devolve o texto ao campo: mensagem que não saiu
        // não pode ficar no histórico parecendo entregue, e a pessoa não
        // pode perder o que escreveu.
        setMensagens((m) => m.filter((x) => x.id !== id));
        setTexto(conteudo);
        setFalha(r.erro);
      } else {
        aoMudar();
      }
    });
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
            onClick={() => trocarPausa(!pausado)}
            disabled={enviando}
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
            style={{
              ["--ordem" as string]: i < historico ? Math.min(i, 8) : 0,
            }}
          >
            <p className="balao__autor" style={{ color: AUTORES[m.de].cor }}>
              {AUTORES[m.de].rotulo}
              <span className="balao__hora">{m.hora}</span>
            </p>
            <p className="balao__texto">{m.texto}</p>
          </div>
        ))}

        {iaEscrevendo && <IADigitando />}

        <div ref={fim} />
      </div>

      {falha && (
        <p className="responder__falha" role="alert">
          {falha}
        </p>
      )}

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
