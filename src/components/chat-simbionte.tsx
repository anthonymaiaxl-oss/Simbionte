"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paperclip, Send, Sparkles, Search, X } from "lucide-react";

/**
 * Conversa com o Simbionte.
 *
 * Modelo novo, características nossas. O que mudou em relação ao
 * componente original:
 *
 * - Fundo branco e acento azul trocados pelo escuro e o verde da marca.
 * - Microfone removido: não existe entrada por voz aqui, e botão que não
 *   funciona é pior que botão ausente.
 * - "Think" e "Deep Search" viraram "Analisar" e "Buscar no histórico" —
 *   os dois modos que fazem sentido para quem pergunta sobre os próprios
 *   atendimentos.
 * - As sugestões continuam: são o que ensina a pessoa o que dá para
 *   perguntar.
 *
 * Ainda não fala com IA nenhuma. `enviar` é o ponto onde a chamada entra.
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

export function ChatSimbionte() {
  const [indice, setIndice] = useState(0);
  const [mostrarDica, setMostrarDica] = useState(true);
  const [ativo, setAtivo] = useState(false);
  const [analisar, setAnalisar] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<string[]>([]);

  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  // Gira as sugestões enquanto ninguém está escrevendo.
  useEffect(() => {
    if (ativo || texto) return;

    const relogio = setInterval(() => {
      setMostrarDica(false);
      setTimeout(() => {
        setIndice((i) => (i + 1) % SUGESTOES_ROTATIVAS.length);
        setMostrarDica(true);
      }, 400);
    }, 3600);

    return () => clearInterval(relogio);
  }, [ativo, texto]);

  // Clique fora fecha, desde que não haja rascunho para perder.
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) {
        if (!texto) setAtivo(false);
      }
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [texto]);

  const enviar = () => {
    if (!texto.trim()) return;
    // TODO: chamar a IA com acesso ao banco da empresa.
    setTexto("");
    campo.current?.focus();
  };

  const aberto = ativo || Boolean(texto);

  return (
    <div className="chat">
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
            {anexos.map((nome, i) => (
              <li key={`${nome}-${i}`} className="chat__anexo">
                <span className="chat__anexo-nome">{nome}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnexos((a) => a.filter((_, j) => j !== i));
                  }}
                  className="chat__anexo-tirar"
                  aria-label={`Remover ${nome}`}
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

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
              const nomes = Array.from(e.target.files ?? []).map((f) => f.name);
              if (nomes.length) setAnexos((a) => [...a, ...nomes]);
              e.target.value = "";
            }}
          />

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
                  enviar();
                }
              }}
              className="chat__campo"
            />

            {/* A dica entra letra a letra saindo de desfoque. É o que faz
                a troca parecer escrita em vez de substituição. */}
            <div className="chat__dica" aria-hidden="true">
              <AnimatePresence mode="wait">
                {mostrarDica && !ativo && !texto && (
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
                              y: { type: "spring", stiffness: 90, damping: 20 },
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
                        {letra === " " ? " " : letra}
                      </motion.span>
                    ))}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              enviar();
            }}
            disabled={!texto.trim()}
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
    </div>
  );
}
