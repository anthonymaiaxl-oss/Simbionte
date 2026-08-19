"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Maximize2,
  Mic,
  Minimize2,
  Paperclip,
  Search,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { perguntarAoSimbionte } from "@/app/acoes-painel";
import type { DadosPainel } from "@/lib/dados-painel";

/**
 * Conversa com o Simbionte.
 *
 * O fio de mensagens fica ACIMA da caixa de escrever, e só nasce quando
 * existe a primeira mensagem: com a página recém-aberta a caixa é o
 * assunto, e um fio vazio só empurraria ela para baixo.
 *
 * Enquanto a IA não está ligada, quem responde é `respostaLocal`. A
 * chamada ao n8n é tentada primeiro e a resposta local só entra quando
 * ela falha — assim, no dia em que o fluxo existir, o chat passa a
 * responder de verdade sem precisar mexer aqui.
 *
 * O microfone grava de verdade, com MediaRecorder. Antes ele nem existia,
 * justamente para não ter botão de enfeite.
 */

const SUGESTOES_ROTATIVAS = [
  "Quantas conversas estão abertas agora?",
  "Qual dúvida mais se repetiu esta semana?",
  "Alguém ficou sem resposta ontem?",
  "Resuma os atendimentos de hoje",
  "Quem pediu orçamento e não voltou?",
];

const ATALHOS = [
  "Quantas conversas estão abertas agora?",
  "Qual dúvida mais se repetiu esta semana?",
  "Alguém ficou sem resposta ontem?",
];

type Anexo = {
  id: string;
  nome: string;
  tamanho: number;
  /** Presente só em áudio gravado: é o que o <audio> toca. */
  url?: string;
  ehAudio?: boolean;
  /**
   * O conteúdo em si. Antes o anexo guardava só o nome, e por isso o
   * arquivo nunca saía do navegador — a IA recebia a palavra "orçamento.pdf"
   * e nada mais. É este blob que vai para o n8n transcrever ou descrever.
   */
  blob?: Blob;
  mime?: string;
};

/**
 * Converte o arquivo para base64, sem o prefixo `data:`.
 *
 * O n8n recebe texto no corpo do webhook e reconstrói o binário do outro
 * lado; mandar assim evita montar um envio multipart só para isso.
 */
function paraBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("não consegui ler o arquivo"));
    leitor.onload = () => {
      const texto = String(leitor.result);
      resolve(texto.slice(texto.indexOf(",") + 1));
    };
    leitor.readAsDataURL(blob);
  });
}

type MensagemChat = {
  id: string;
  de: "voce" | "simbionte";
  texto: string;
  anexos: Anexo[];
};

const tamanhoLegivel = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const relogio = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * A resposta enquanto não existe IA.
 *
 * Onde dá, responde com o número real que já está na tela — perguntar
 * "quantas conversas abertas" e ouvir um número inventado seria pior do
 * que não responder. Onde não dá, assume que ainda não sabe: nenhuma
 * destas finge ter olhado dado que não tem.
 */
function respostaLocal(pergunta: string, dados?: DadosPainel): string {
  const p = pergunta.toLowerCase();
  const n = dados?.numeros;
  const ressalva = dados?.origem === "n8n" ? "" : " (painel de exemplo)";

  if (n && /aberta|ativa|andamento|quantas|quantos/.test(p)) {
    return `Agora são ${n.ativas} conversas ativas, ${n.pendentes} esperando resposta e ${n.humano} em atendimento humano${ressalva}.`;
  }
  if (n && /pendente|esperando|sem resposta|nao respond|não respond/.test(p)) {
    return `Tem ${n.pendentes} conversa(s) pendente(s) e ${n.erro} com erro${ressalva}. A aba Conversas, no filtro Pendentes, mostra quem são.`;
  }
  if (n && /resum|hoje|dia|semana/.test(p)) {
    return `Entraram ${n.recebidas} mensagens, a IA respondeu ${n.respondidasIA} e ${n.finalizadas} conversas foram finalizadas — ${n.taxaAutomacao}% resolvidas sem humano${ressalva}.`;
  }
  if (n && /erro|falha|problema/.test(p)) {
    return `${n.erro} conversa(s) com erro${ressalva}. Elas aparecem no filtro "Com erro".`;
  }

  return "Ainda não estou ligado ao meu cérebro — o fluxo do n8n é o próximo passo. Quando ele subir, respondo esta pergunta com os dados reais dos seus atendimentos.";
}

export function ChatSimbionte({ dados }: { dados?: DadosPainel }) {
  const [indice, setIndice] = useState(0);
  const [mostrarDica, setMostrarDica] = useState(true);
  const [ativo, setAtivo] = useState(false);
  const [analisar, setAnalisar] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [pensando, setPensando] = useState(false);

  /**
   * Fio ampliado.
   *
   * Fechado ele para na altura de umas quatro mensagens e rola por
   * dentro. Sem esse teto, uma conversa longa empurra o painel inteiro
   * para baixo e o robo sai da tela.
   */
  const [ampliado, setAmpliado] = useState(false);

  // Gravação
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [erroMic, setErroMic] = useState<string | null>(null);

  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const fio = useRef<HTMLDivElement>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const proximoId = useRef(1);

  // Gira as sugestões enquanto ninguém está escrevendo e o fio está vazio.
  useEffect(() => {
    if (ativo || texto || mensagens.length > 0) return;

    const t = setInterval(() => {
      setMostrarDica(false);
      setTimeout(() => {
        setIndice((i) => (i + 1) % SUGESTOES_ROTATIVAS.length);
        setMostrarDica(true);
      }, 400);
    }, 3600);

    return () => clearInterval(t);
  }, [ativo, texto, mensagens.length]);

  // Clique fora fecha, desde que não haja rascunho para perder.
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      const dentro =
        caixa.current?.contains(e.target as Node) ||
        fio.current?.contains(e.target as Node);
      if (dentro) return;
      if (!texto) setAtivo(false);
      // Clicar fora tambem devolve o fio ao tamanho pequeno: ampliado e um
      // estado de leitura, nao o estado normal da pagina.
      setAmpliado(false);
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [texto]);

  /**
   * Rola o fio ao chegar mensagem — e SO o fio.
   *
   * Com scrollIntoView a rolagem subia para o ancestral rolavel mais
   * proximo, que enquanto o fio e curto ainda e a pagina: o robo subia
   * junto e o corte do corpo dele ficava boiando no meio da tela. Mexer
   * no scrollTop do proprio container nao toca na pagina.
   */
  useEffect(() => {
    const f = fio.current;
    if (!f) return;
    f.scrollTo({ top: f.scrollHeight, behavior: "smooth" });
  }, [mensagens, pensando]);

  // Cronômetro da gravação.
  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [gravando]);

  const comecarGravacao = async () => {
    setErroMic(null);
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(fluxo);
      pedacos.current = [];
      let decorrido = 0;
      const cronometro = setInterval(() => (decorrido += 1), 1000);

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) pedacos.current.push(e.data);
      };

      rec.onstop = () => {
        clearInterval(cronometro);
        const blob = new Blob(pedacos.current, { type: rec.mimeType });
        setAnexos((a) => [
          ...a,
          {
            id: `audio-${proximoId.current++}`,
            nome: `Áudio ${relogio(decorrido)}`,
            tamanho: blob.size,
            url: URL.createObjectURL(blob),
            ehAudio: true,
            blob,
            mime: rec.mimeType || "audio/webm",
          },
        ]);
        // Sem isto o indicador de gravação do navegador fica aceso e a
        // aba segue marcada como usando o microfone.
        fluxo.getTracks().forEach((t) => t.stop());
      };

      rec.start();
      gravador.current = rec;
      setSegundos(0);
      setGravando(true);
      setAtivo(true);
    } catch {
      setErroMic("Não consegui acessar o microfone. Verifique a permissão do navegador.");
    }
  };

  const pararGravacao = () => {
    gravador.current?.stop();
    gravador.current = null;
    setGravando(false);
  };

  const enviar = async () => {
    const conteudo = texto.trim();
    if (!conteudo && anexos.length === 0) return;

    setMensagens((m) => [
      ...m,
      {
        id: `v-${proximoId.current++}`,
        de: "voce",
        texto: conteudo,
        anexos,
      },
    ]);

    // Os anexos passam a ser da mensagem enviada; a caixa esvazia sem
    // revogar as URLs, senão o áudio já postado pararia de tocar.
    const enviados = anexos;
    setTexto("");
    setAnexos([]);
    setAtivo(true);
    setPensando(true);
    campo.current?.focus();

    // Tenta o n8n; se ele não estiver de pé, responde localmente. O chat
    // funciona hoje e passa a valer de verdade quando o fluxo subir.
    let resposta: string;
    try {
      // Só o que tem conteúdo sobe. Anexo sem blob é de uma sessão antiga
      // restaurada, e mandar o nome sozinho não ajuda a IA em nada.
      const paraEnviar = await Promise.all(
        enviados
          .filter((a) => a.blob)
          .map(async (a) => ({
            nome: a.nome,
            mime: a.mime ?? a.blob!.type ?? "application/octet-stream",
            dados: await paraBase64(a.blob!),
          })),
      );

      const r = await perguntarAoSimbionte(
        [
          conteudo,
          analisar ? "[modo: analisar]" : "",
          buscar ? "[modo: buscar no histórico]" : "",
        ]
          .filter(Boolean)
          .join(" "),
        paraEnviar,
      );
      resposta = r.ok ? r.resposta : r.erro || respostaLocal(conteudo, dados);
    } catch {
      resposta = respostaLocal(conteudo, dados);
    }

    setPensando(false);
    setMensagens((m) => [
      ...m,
      {
        id: `s-${proximoId.current++}`,
        de: "simbionte",
        texto: resposta,
        anexos: [],
      },
    ]);
  };

  // Com o fio na tela, ele e a caixa viram um balao continuo: o corte do
  // corpo do robo encosta na borda de cima dele em vez de flutuar.
  const temFio = mensagens.length > 0 || pensando;
  const aberto = ativo || Boolean(texto) || anexos.length > 0;
  const podeEnviar = Boolean(texto.trim()) || anexos.length > 0;

  return (
    <div className={`chat ${temFio ? "chat--com-fio" : ""}`}>
      {/* Fio e caixa dentro do mesmo balão: assim o contorno que segue o
          ponteiro corre em volta do conjunto. Com um anel em cada um, o
          brilho parava na costura entre os dois e desenhava uma linha no
          meio. */}
      <div className="chat__balao">
      {/* Fio de mensagens. Só existe depois da primeira. */}
      {temFio && (
        <div className={`chat__fio-area ${ampliado ? "chat__fio-area--alto" : ""}`}>
          <button
            type="button"
            onClick={() => setAmpliado((v) => !v)}
            aria-pressed={ampliado}
            className="chat__ampliar"
            title={ampliado ? "Reduzir a conversa" : "Ampliar a conversa"}
          >
            {ampliado ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="sr-only">
              {ampliado ? "Reduzir a conversa" : "Ampliar a conversa"}
            </span>
          </button>

        <div
          ref={fio}
          className="chat__fio"
          /* Sem isto o Lenis captura a roda do mouse e rola a PAGINA em vez
             do fio: mensagem longa ficava impossivel de ler. */
          data-lenis-prevent
          role="log"
          aria-label="Conversa com o Simbionte"
        >
          {mensagens.map((m) => (
            <div key={m.id} className={`chat__msg chat__msg--${m.de}`}>
              {m.texto && <p className="chat__msg-texto">{m.texto}</p>}

              {m.anexos.length > 0 && (
                <ul className="chat__msg-anexos">
                  {m.anexos.map((a) => (
                    <li key={a.id}>
                      {a.ehAudio && a.url ? (
                        <audio controls src={a.url} className="chat__audio">
                          Seu navegador não toca áudio.
                        </audio>
                      ) : (
                        <span className="chat__msg-anexo">
                          {a.nome}
                          <span className="chat__msg-anexo-tam">
                            {tamanhoLegivel(a.tamanho)}
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {pensando && (
            <div className="digitando" role="status">
              <span className="digitando__texto">Simbionte pensando</span>
              <span className="digitando__pontos" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
          </div>
        </div>
      )}

      <motion.div
        ref={caixa}
        className="chat__caixa"
        onClick={() => setAtivo(true)}
        initial={false}
        animate={{ height: aberto ? 132 : 72 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      >
        {anexos.length > 0 && (
          <ul className="chat__anexos">
            {anexos.map((a, i) => (
              <li key={a.id} className="chat__anexo">
                <span className="chat__anexo-nome">
                  {a.nome}
                  <span className="chat__msg-anexo-tam">
                    {tamanhoLegivel(a.tamanho)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (a.url) URL.revokeObjectURL(a.url);
                    setAnexos((lista) => lista.filter((_, j) => j !== i));
                  }}
                  className="chat__anexo-tirar"
                  aria-label={`Remover ${a.nome}`}
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {erroMic && <p className="chat__erro">{erroMic}</p>}

        <div className="chat__linha">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              arquivo.current?.click();
            }}
            className="chat__acao"
            aria-label="Anexar documento"
          >
            <Paperclip size={19} />
          </button>

          <input
            ref={arquivo}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,image/*"
            className="sr-only"
            onChange={(e) => {
              const novos = Array.from(e.target.files ?? []).map((f) => ({
                id: `f-${proximoId.current++}`,
                nome: f.name,
                tamanho: f.size,
                blob: f,
                mime: f.type || "application/octet-stream",
              }));
              if (novos.length) setAnexos((a) => [...a, ...novos]);
              // Limpa para o mesmo arquivo poder ser escolhido de novo.
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (gravando) pararGravacao();
              else void comecarGravacao();
            }}
            className={`chat__acao ${gravando ? "chat__acao--gravando" : ""}`}
            aria-label={gravando ? "Parar gravação" : "Gravar áudio"}
            aria-pressed={gravando}
          >
            {gravando ? <Square size={16} /> : <Mic size={19} />}
          </button>

          {gravando ? (
            <div className="chat__gravando" aria-live="polite">
              <span className="chat__gravando-ponto" aria-hidden="true" />
              Gravando {relogio(segundos)}
            </div>
          ) : (
            <div className="chat__campo-area">
              <label htmlFor="pergunta-simbionte" className="sr-only">
                Sua pergunta para o Simbionte
              </label>
              <input
                ref={campo}
                id="pergunta-simbionte"
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onFocus={() => setAtivo(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                className="chat__campo"
              />

              {/* A dica entra letra a letra saindo de desfoque. É o que faz
                  a troca parecer escrita em vez de substituição. */}
              <div className="chat__dica" aria-hidden="true">
                <AnimatePresence mode="wait">
                  {mostrarDica && !ativo && !texto && mensagens.length === 0 && (
                    <motion.span
                      key={indice}
                      className="chat__dica-texto"
                      initial="inicial"
                      animate="dentro"
                      exit="fora"
                      variants={{
                        inicial: {},
                        dentro: { transition: { staggerChildren: 0.02 } },
                        fora: {
                          transition: {
                            staggerChildren: 0.012,
                            staggerDirection: -1,
                          },
                        },
                      }}
                    >
                      {SUGESTOES_ROTATIVAS[indice].split("").map((letra, i) => (
                        <motion.span
                          key={i}
                          style={{ display: "inline-block" }}
                          variants={{
                            inicial: { opacity: 0, filter: "blur(10px)", y: 8 },
                            dentro: {
                              opacity: 1,
                              filter: "blur(0px)",
                              y: 0,
                              transition: {
                                opacity: { duration: 0.22 },
                                filter: { duration: 0.35 },
                                y: {
                                  type: "spring",
                                  stiffness: 90,
                                  damping: 20,
                                },
                              },
                            },
                            fora: {
                              opacity: 0,
                              filter: "blur(10px)",
                              y: -8,
                              transition: {
                                opacity: { duration: 0.18 },
                                filter: { duration: 0.25 },
                              },
                            },
                          }}
                        >
                          {/* Espaco rigido: um inline-block com um espaco comum dentro
                              colapsa para largura zero, e a frase saia toda
                              grudada. */}
                          {letra === " " ? " " : letra}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void enviar();
            }}
            disabled={!podeEnviar}
            className="chat__enviar"
            aria-label="Perguntar ao Simbionte"
          >
            <Send size={17} />
          </button>
        </div>

        {/* Modos. Aparecem só com a caixa aberta: fechada, competiriam
            com a pergunta, que é o que importa. */}
        <motion.div
          className="chat__modos"
          initial={false}
          animate={aberto ? "vendo" : "escondido"}
          variants={{
            escondido: {
              opacity: 0,
              y: 14,
              pointerEvents: "none",
              transition: { duration: 0.2 },
            },
            vendo: {
              opacity: 1,
              y: 0,
              pointerEvents: "auto",
              transition: { duration: 0.3, delay: 0.06 },
            },
          }}
        >
          <button
            type="button"
            aria-pressed={analisar}
            onClick={(e) => {
              e.stopPropagation();
              setAnalisar((v) => !v);
            }}
            className={`chat__modo ${analisar ? "chat__modo--ligado" : ""}`}
          >
            <Sparkles size={16} />
            Analisar
          </button>

          <button
            type="button"
            aria-pressed={buscar}
            onClick={(e) => {
              e.stopPropagation();
              setBuscar((v) => !v);
            }}
            className={`chat__modo ${buscar ? "chat__modo--ligado" : ""}`}
          >
            <Search size={16} />
            Buscar no histórico
          </button>
        </motion.div>
      </motion.div>
      </div>

      {/* Os atalhos somem depois da primeira pergunta: eles ensinam o que
          dá para perguntar, e quem já perguntou não precisa mais da aula. */}
      {mensagens.length === 0 && (
        <ul className="chat__sugestoes">
          {ATALHOS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  setTexto(s);
                  setAtivo(true);
                  campo.current?.focus();
                }}
                className="chat__sugestao"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
