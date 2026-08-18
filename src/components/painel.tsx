"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useReducedMotion } from "motion/react";
import { alternarPausa } from "@/app/acoes-painel";
import { Agente } from "@/components/agente";
import { Chips } from "@/components/chips";
import { Contatos } from "@/components/contatos";
import { ConversaAberta } from "@/components/conversa-aberta";
import { DockAbas } from "@/components/dock-abas";
import {
  ESTADOS,
  type Conversa,
  type DadosPainel,
  type EstadoConversa,
  type Numeros as TipoNumeros,
} from "@/lib/dados-painel";

/**
 * Painel de operação: números e conversas.
 *
 * Os dados chegam prontos do servidor, que já falou com o n8n. Se o n8n
 * estiver fora ou sem configurar, vem o exemplo com `origem: "exemplo"`
 * — e a tela avisa, porque painel de operação mostrando número inventado
 * sem dizer que é inventado é pior do que painel vazio.
 *
 * As conversas abrem primeiro na ordem de urgência, não por horário:
 * quem está esperando resposta humana vem antes de quem já foi atendido.
 */

type Aba = "conversas" | "numeros" | "contatos" | "agente";

/* O id continua "numeros" — é a chave do aria-controls. Só o rótulo
   mudou para "Painel". */
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "conversas", rotulo: "Conversas" },
  { id: "numeros", rotulo: "Painel" },
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

export function Painel({ inicial }: { inicial: DadosPainel }) {
  const [aba, setAba] = useState<Aba>("conversas");

  /**
   * Rede de seguranca contra a pagina se reposicionar ao trocar de aba.
   *
   * A causa raiz esta no ScrollTrigger, e foi tratada la (ele restaurava
   * a rolagem gravada a cada mudanca de layout). Isto aqui e o cinto:
   * guarda onde a pessoa estava, e devolve se alguma coisa mexer.
   *
   * Sao tres tentativas porque quem mexe pode agir em momentos
   * diferentes — antes da pintura, no quadro seguinte, ou depois de um
   * calculo assincrono. Cada uma so age se a posicao realmente mudou,
   * entao rolagem legitima da pessoa nao e atrapalhada.
   */
  const posicao = useRef<number | null>(null);

  const trocarAba = (nova: Aba) => {
    posicao.current = window.scrollY;
    setAba(nova);
  };

  useLayoutEffect(() => {
    const y = posicao.current;
    if (y === null) return;

    const devolver = () => {
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
    };

    devolver();
    const quadro = requestAnimationFrame(devolver);
    const atrasado = window.setTimeout(() => {
      devolver();
      posicao.current = null;
    }, 180);

    return () => {
      cancelAnimationFrame(quadro);
      window.clearTimeout(atrasado);
    };
  }, [aba]);
  const [dados, setDados] = useState(inicial);
  const [lendo, setLendo] = useState(false);
  const [falhaAoLer, setFalhaAoLer] = useState<string | null>(null);

  const atualizar = async () => {
    setLendo(true);
    setFalhaAoLer(null);
    try {
      const r = await fetch("/api/painel", { cache: "no-store" });
      if (r.status === 401) {
        // Sessão caiu enquanto a aba estava aberta: recarregar leva para
        // a tela de entrada pelo proxy.
        window.location.reload();
        return;
      }
      if (!r.ok) throw new Error(`resposta ${r.status}`);
      setDados((await r.json()) as DadosPainel);
    } catch (e) {
      setFalhaAoLer(e instanceof Error ? e.message : "Não consegui atualizar.");
    } finally {
      setLendo(false);
    }
  };

  return (
    <section className="painel" aria-label="Painel de operação">
      <div className="painel__interno">
        <BarraOrigem
          dados={dados}
          lendo={lendo}
          falha={falhaAoLer}
          aoAtualizar={atualizar}
        />

        <DockAbas itens={ABAS} atual={aba} aoTrocar={trocarAba} />

        {/* A key força o React a remontar ao trocar de aba, e com isso a
            animação de entrada — e a contagem dos números — roda de
            novo. Sem ela a troca é seca. */}
        <div key={aba} className="painel__area">
          {aba === "conversas" && (
            <Conversas conversas={dados.conversas} aoMudar={atualizar} />
          )}
          {aba === "numeros" && <Numeros numeros={dados.numeros} />}
          {aba === "contatos" && <Contatos contatos={dados.contatos} />}
          {aba === "agente" && <Agente configuracao={dados.configuracao} />}
        </div>
      </div>
    </section>
  );
}

/**
 * Diz de onde veio o dado e deixa recarregar.
 *
 * Quando está em exemplo o aviso é obrigatório: alguém olhando "2
 * pendentes" precisa saber se são dois clientes esperando de verdade ou
 * um número de mentira.
 */
function BarraOrigem({
  dados,
  lendo,
  falha,
  aoAtualizar,
}: {
  dados: DadosPainel;
  lendo: boolean;
  falha: string | null;
  aoAtualizar: () => void;
}) {
  const exemplo = dados.origem === "exemplo";

  return (
    <div className="origem">
      <span className={`origem__selo ${exemplo ? "origem__selo--exemplo" : ""}`}>
        <span className="origem__ponto" aria-hidden="true" />
        {exemplo ? "Dados de exemplo" : "Ao vivo pelo n8n"}
      </span>

      {exemplo && dados.aviso && (
        <span className="origem__motivo" title={dados.aviso}>
          {dados.aviso}
        </span>
      )}

      {falha && <span className="origem__falha">{falha}</span>}

      <button
        type="button"
        onClick={aoAtualizar}
        disabled={lendo}
        className="origem__atualizar"
      >
        {lendo ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}

/* -- Conversas ------------------------------------------------ */

function Conversas({
  conversas,
  aoMudar,
}: {
  conversas: Conversa[];
  aoMudar: () => void;
}) {
  const [filtro, setFiltro] = useState<EstadoConversa | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const aberta = conversas.find((c) => c.id === abertaId) ?? null;

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return conversas
      .filter((c) => {
        if (filtro !== "todas" && c.estado !== filtro) return false;
        if (!termo) return true;
        // Busca por nome e por telefone, ignorando a formatação do número.
        const numero = c.telefone.replace(/\D/g, "");
        return (
          c.nome.toLowerCase().includes(termo) ||
          numero.includes(termo.replace(/\D/g, ""))
        );
      })
      .sort((a, b) => ESTADOS[a.estado].urgencia - ESTADOS[b.estado].urgencia);
  }, [conversas, filtro, busca]);

  const filtrosComConta = useMemo(
    () =>
      FILTROS.map((f) => ({
        ...f,
        conta:
          f.id === "todas"
            ? conversas.length
            : conversas.filter((c) => c.estado === f.id).length,
      })),
    [conversas],
  );

  if (aberta) {
    return (
      <div id="painel-conversas" role="tabpanel">
        {/* A key remonta o componente ao trocar de conversa: e com isso
            histórico, rascunho e modo de atendimento recomeçam sem
            precisar de um efeito chamando setState. */}
        <ConversaAberta
          key={aberta.id}
          conversa={aberta}
          aoMudar={aoMudar}
          aoVoltar={() => setAbertaId(null)}
        />
      </div>
    );
  }

  return (
    <div id="painel-conversas" role="tabpanel">
      <div className="filtros">
        <Chips
          itens={filtrosComConta}
          atual={filtro}
          aoTrocar={setFiltro}
          grupo="estado"
          rotuloGrupo="Filtrar por estado"
        />

        <label htmlFor="busca-conversas" className="sr-only">
          Buscar conversa por nome ou número
        </label>
        <input
          id="busca-conversas"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou número…"
          className="busca"
        />
      </div>

      {lista.length === 0 ? (
        <p className="vazio">
          {conversas.length === 0 ? (
            "Nenhuma conversa ainda. Assim que alguém chamar o número, ela aparece aqui."
          ) : (
            <>
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
            </>
          )}
        </p>
      ) : (
        <ul className="conversas">
          {lista.map((c, i) => (
            <LinhaConversa
              key={c.id}
              conversa={c}
              indice={i}
              aoMudar={aoMudar}
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
  aoAbrir,
  aoMudar,
  indice,
}: {
  conversa: Conversa;
  aoAbrir: () => void;
  aoMudar: () => void;
  indice: number;
}) {
  const estado = ESTADOS[conversa.estado];
  const [pendente, comecar] = useTransition();

  // Otimista: o botão responde na hora e volta atrás se o n8n recusar.
  // Esperar a ida e volta faz o clique parecer que não funcionou.
  const [pausado, setPausado] = useState(conversa.botPausado);
  const [erro, setErro] = useState(false);

  const alternar = () => {
    const novo = !pausado;
    setPausado(novo);
    setErro(false);
    comecar(async () => {
      const r = await alternarPausa(conversa.id, novo);
      if (!r.ok) {
        setPausado(!novo);
        setErro(true);
      } else {
        aoMudar();
      }
    });
  };

  return (
    <li className="conversa" style={{ ["--ordem" as string]: indice }}>
      {/* O botão é invisível e cobre o cartão inteiro, em vez de
          envolver o conteúdo. Assim a caixa toda abre a conversa sem
          aninhar o "Pausar bot" dentro de outro botão — o que seria
          HTML inválido e quebraria o teclado. O botão de pausa sobe na
          pilha e continua clicável por cima. */}
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
              <span className="sr-only"> mensagens não lidas</span>
            </span>
          )}
          {/* Cor com rótulo junto: estado nunca só por cor. */}
          <span
            className="conversa__selo"
            style={{ color: estado.cor, borderColor: estado.cor }}
          >
            {estado.rotulo}
          </span>
        </span>

        <button
          type="button"
          onClick={alternar}
          disabled={pendente}
          aria-pressed={pausado}
          className={`pausa ${pausado ? "pausa--ligada" : ""}`}
        >
          {erro
            ? "Não deu — tentar de novo"
            : pausado
              ? "Bot pausado"
              : "Pausar bot"}
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

/* -- Números -------------------------------------------------- */

const CARTOES: { chave: keyof TipoNumeros; rotulo: string; alerta?: boolean }[] =
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
 * Número que sobe até o valor.
 *
 * Sempre termina no valor exato — a animação é enfeite, o dado não pode
 * depender dela. Com movimento reduzido, aparece direto.
 */
function Contador({ ate }: { ate: number }) {
  const semMovimento = useReducedMotion();

  // Começa em 0 já no render. Nenhum setState no corpo do efeito: isso
  // dispara render em cascata, e valor inicial é assunto do render.
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (semMovimento) return;

    const duracao = 900;
    const inicio = performance.now();
    let frame = 0;

    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / duracao, 1);
      // desacelera no fim: sobe rápido e assenta
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(ate * suave));
      if (t < 1) frame = requestAnimationFrame(passo);
    };

    frame = requestAnimationFrame(passo);

    // Rede de segurança. Em aba de segundo plano o requestAnimationFrame
    // não roda, e sem isto o cartão ficaria mostrando 0 até a pessoa
    // voltar para a aba — o número é o dado, a animação é só o caminho
    // até ele. setTimeout é limitado a 1x por segundo em aba oculta, mas
    // dispara; é justamente o que precisamos aqui.
    const rede = window.setTimeout(() => setValor(ate), duracao + 120);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(rede);
    };
  }, [ate, semMovimento]);

  // Sem movimento o número aparece pronto, sem passar por estado nenhum.
  return <>{semMovimento ? ate : valor}</>;
}

function Numeros({ numeros }: { numeros: TipoNumeros }) {
  return (
    <div id="painel-numeros" role="tabpanel" className="numeros">
      {CARTOES.map((c, i) => {
        const valor = numeros[c.chave];
        // Só pinta de âmbar o que realmente pede ação: zero pendente é
        // boa notícia e não deve gritar.
        const pedeAcao = c.alerta && valor > 0;
        return (
          <article
            key={c.chave}
            className="cartao"
            style={{ ["--ordem" as string]: i }}
          >
            <p
              className={`cartao__valor ${pedeAcao ? "cartao__valor--atencao" : ""}`}
            >
              <Contador ate={valor} />
            </p>
            <p className="cartao__rotulo">{c.rotulo}</p>
          </article>
        );
      })}

      {/* Mesmo tamanho dos outros: a barra mora no rodapé do cartão, que
          todos têm reservado. O destaque vem da borda e da cor, não de
          ocupar o dobro de espaço e quebrar a grade. */}
      <article
        className="cartao cartao--destaque"
        style={{ ["--ordem" as string]: CARTOES.length }}
      >
        <p className="cartao__valor">
          <Contador ate={numeros.taxaAutomacao} />%
        </p>
        <p className="cartao__rotulo">Resolvidas sem humano</p>
        <span
          className="cartao__barra"
          aria-hidden="true"
          style={{ ["--parte" as string]: `${numeros.taxaAutomacao}%` }}
        />
      </article>
    </div>
  );
}
