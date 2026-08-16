"use client";

import { useEffect, useMemo, useState } from "react";
import { Agente } from "@/components/agente";
import { Contatos } from "@/components/contatos";
import { ConversaAberta } from "@/components/conversa-aberta";
import { DockAbas } from "@/components/dock-abas";
import {
  CONVERSAS,
  ESTADOS,
  NUMEROS,
  type Conversa,
  type EstadoConversa,
} from "@/lib/dados-painel";

/**
 * Painel de opera��o: n�meros e conversas.
 *
 * Duas abas porque s�o dois modos de uso diferentes � "como foi o dia"
 * e "quem precisa de mim agora" � e misturar os dois numa tela s� faz o
 * urgente sumir no meio do balan�o.
 *
 * As conversas abrem primeiro na ordem de urg�ncia, n�o por hor�rio:
 * quem est� esperando resposta humana vem antes de quem j� foi atendido.
 */

type Aba = "conversas" | "numeros" | "contatos" | "agente";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "conversas", rotulo: "Conversas" },
  { id: "numeros", rotulo: "Números" },
  { id: "contatos", rotulo: "Contatos" },
  { id: "agente", rotulo: "Agente" },
];

const FILTROS: { id: EstadoConversa | "todas"; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "pendente", rotulo: "Pendentes" },
  { id: "humano", rotulo: "Atendimento humano" },
  { id: "ia", rotulo: "IA ativa" },
  { id: "erro", rotulo: "Com erro" },
  { id: "finalizada", rotulo: "Finalizadas" },
];

export function Painel() {
  const [aba, setAba] = useState<Aba>("conversas");

  return (
    <section className="painel" aria-label="Painel de operação">
      <div className="painel__interno">
        <DockAbas itens={ABAS} atual={aba} aoTrocar={setAba} />

        {/* A key for�a o React a remontar ao trocar de aba, e com isso a
            anima��o de entrada roda de novo. Sem ela a troca � seca. */}
        <div key={aba} className="painel__area">
          {aba === "conversas" && <Conversas />}
          {aba === "numeros" && <Numeros />}
          {aba === "contatos" && <Contatos />}
          {aba === "agente" && <Agente />}
        </div>
      </div>
    </section>
  );
}

/* -- Conversas ------------------------------------------------ */

function Conversas() {
  const [filtro, setFiltro] = useState<EstadoConversa | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [pausados, setPausados] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONVERSAS.map((c) => [c.id, c.botPausado])),
  );

  const aberta = CONVERSAS.find((c) => c.id === abertaId) ?? null;

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return CONVERSAS.filter((c) => {
      if (filtro !== "todas" && c.estado !== filtro) return false;
      if (!termo) return true;
      // Busca por nome e por telefone, ignorando a formata��o do n�mero.
      const numero = c.telefone.replace(/\D/g, "");
      return (
        c.nome.toLowerCase().includes(termo) ||
        numero.includes(termo.replace(/\D/g, ""))
      );
    }).sort(
      (a, b) => ESTADOS[a.estado].urgencia - ESTADOS[b.estado].urgencia,
    );
  }, [filtro, busca]);

  const contar = (id: EstadoConversa | "todas") =>
    id === "todas"
      ? CONVERSAS.length
      : CONVERSAS.filter((c) => c.estado === id).length;

  if (aberta) {
    return (
      <div id="painel-conversas" role="tabpanel">
        <ConversaAberta
          conversa={aberta}
          pausado={pausados[aberta.id]}
          aoPausar={(v) => setPausados((p) => ({ ...p, [aberta.id]: v }))}
          aoVoltar={() => setAbertaId(null)}
        />
      </div>
    );
  }

  return (
    <div id="painel-conversas" role="tabpanel">
      <div className="filtros">
        <div className="filtros__chips" role="group" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              /* aria-pressed em vez de div com classe: o leitor de tela
                 precisa saber que o filtro est� ligado. */
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={`chip ${filtro === f.id ? "chip--ativo" : ""}`}
            >
              {f.rotulo}
              <span className="chip__conta">{contar(f.id)}</span>
            </button>
          ))}
        </div>

        <label htmlFor="busca-conversas" className="sr-only">
          Buscar conversa por nome ou n�mero
        </label>
        <input
          id="busca-conversas"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou n�mero�"
          className="busca"
        />
      </div>

      {lista.length === 0 ? (
        <p className="vazio">
          Nenhuma conversa com esse filtro.{" "}
          <button
            type="button"
            onClick={() => {
              setFiltro("todas");
              setBusca("");
            }}
            className="vazio__acao"
          >
            Ver todas
          </button>
        </p>
      ) : (
        <ul className="conversas">
          {lista.map((c, i) => (
            <LinhaConversa
              key={c.id}
              conversa={c}
              indice={i}
              pausado={pausados[c.id]}
              aoAlternar={() =>
                setPausados((p) => ({ ...p, [c.id]: !p[c.id] }))
              }
              aoAbrir={() => setAbertaId(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LinhaConversa({
  conversa,
  pausado,
  aoAlternar,
  aoAbrir,
  indice,
}: {
  conversa: Conversa;
  pausado: boolean;
  aoAlternar: () => void;
  aoAbrir: () => void;
  indice: number;
}) {
  const estado = ESTADOS[conversa.estado];

  return (
    <li className="conversa" style={{ ["--ordem" as string]: indice }}>
      {/* O bot�o � invis�vel e cobre o cart�o inteiro, em vez de
          envolver o conte�do. Assim a caixa toda abre a conversa sem
          aninhar o "Pausar bot" dentro de outro bot�o � o que seria
          HTML inv�lido e quebraria o teclado. O bot�o de pausa sobe na
          pilha e continua clic�vel por cima. */}
      <button
        type="button"
        onClick={aoAbrir}
        className="conversa__alvo"
        aria-label={`Abrir conversa com ${conversa.nome}`}
      />

      <span className="conversa__inicial" aria-hidden="true">
        {iniciais(conversa.nome)}
      </span>

      <span className="conversa__corpo">
        <span className="conversa__topo">
          <span className="conversa__nome">{conversa.nome}</span>
          <span className="conversa__telefone">{conversa.telefone}</span>
        </span>
        <span className="conversa__mensagem">{conversa.ultimaMensagem}</span>
      </span>

      <span className="conversa__lado">
        <span className="conversa__quando">{conversa.quando}</span>

        <span className="conversa__marcas">
          {conversa.naoLidas > 0 && (
            <span className="conversa__naolidas">
              {conversa.naoLidas}
              <span className="sr-only"> mensagens n�o lidas</span>
            </span>
          )}
          {/* Cor com r�tulo junto: estado nunca s� por cor. */}
          <span
            className="conversa__selo"
            style={{ color: estado.cor, borderColor: estado.cor }}
          >
            {estado.rotulo}
          </span>
        </span>

        <button
          type="button"
          onClick={aoAlternar}
          aria-pressed={pausado}
          className={`pausa ${pausado ? "pausa--ligada" : ""}`}
        >
          {pausado ? "Bot pausado" : "Pausar bot"}
        </button>
      </span>
    </li>
  );
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* -- N�meros -------------------------------------------------- */

const CARTOES: { chave: keyof typeof NUMEROS; rotulo: string; alerta?: boolean }[] =
  [
    { chave: "recebidas", rotulo: "Mensagens recebidas" },
    { chave: "respondidasIA", rotulo: "Respondidas pela IA" },
    { chave: "ativas", rotulo: "Conversas ativas" },
    { chave: "pendentes", rotulo: "Pendentes", alerta: true },
    { chave: "humano", rotulo: "Atendimento humano" },
    { chave: "erro", rotulo: "Com erro", alerta: true },
    { chave: "finalizadas", rotulo: "Finalizadas" },
  ];

/**
 * N�mero que sobe at� o valor.
 *
 * Sempre termina no valor exato � a anima��o � enfeite, o dado n�o pode
 * depender dela. Com movimento reduzido, aparece direto.
 */
function Contador({ ate }: { ate: number }) {
  const [valor, setValor] = useState(ate);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duracao = 900;
    const inicio = performance.now();
    let frame = 0;

    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / duracao, 1);
      // desacelera no fim: sobe r�pido e assenta
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(ate * suave));
      if (t < 1) frame = requestAnimationFrame(passo);
    };

    setValor(0);
    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [ate]);

  return <>{valor}</>;
}

function Numeros() {
  return (
    <div id="painel-numeros" role="tabpanel" className="numeros">
      {CARTOES.map((c, i) => {
        const valor = NUMEROS[c.chave];
        // S� pinta de �mbar o que realmente pede a��o: zero pendente �
        // boa not�cia e n�o deve gritar.
        const pedeAcao = c.alerta && valor > 0;
        return (
          <article
            key={c.chave}
            className="cartao"
            style={{ ["--ordem" as string]: i }}
          >
            <p className={`cartao__valor ${pedeAcao ? "cartao__valor--atencao" : ""}`}>
              <Contador ate={valor} />
            </p>
            <p className="cartao__rotulo">{c.rotulo}</p>
          </article>
        );
      })}

      <article
        className="cartao cartao--destaque"
        style={{ ["--ordem" as string]: CARTOES.length }}
      >
        <p className="cartao__valor">
          <Contador ate={NUMEROS.taxaAutomacao} />%
        </p>
        <p className="cartao__rotulo">Resolvidas sem humano</p>
        <span
          className="cartao__barra"
          aria-hidden="true"
          style={{ ["--parte" as string]: `${NUMEROS.taxaAutomacao}%` }}
        />
      </article>
    </div>
  );
}
