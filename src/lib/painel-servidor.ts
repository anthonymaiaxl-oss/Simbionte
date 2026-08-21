import "server-only";

import { chamarN8N, configurado, ErroN8N, faltando } from "@/lib/n8n";
import {
  AGENDAMENTOS,
  CONFIGURACAO,
  PAINEL_EXEMPLO,
  type Configuracao,
  type Agendamento,
  type Contato,
  type Conversa,
  type DadosPainel,
  type EstadoConversa,
  type Mensagem,
  type Numeros,
} from "@/lib/dados-painel";

/**
 * De onde o painel tira os dados.
 *
 * Uma chamada só traz o painel inteiro. É mais fácil de montar do lado
 * do n8n — um fluxo, alguns nós de Data Table, um "Respond to Webhook" —
 * e o painel recarrega tudo de uma vez em vez de coordenar cinco pedidos
 * que podem chegar fora de ordem.
 *
 * Nada aqui confia no formato que chega. Data Table do n8n devolve o que
 * foi gravado, e basta um fluxo escrever número como texto para a tela
 * quebrar. Os conversores abaixo aceitam os dois e normalizam.
 */


/* -- Conversores tolerantes ----------------------------------- */

const texto = (v: unknown, padrao = ""): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : padrao;

const numero = (v: unknown, padrao = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    // Aceita "75", "75%" e "75,5" — o que uma planilha ou um humano
    // digitando na Data Table costuma produzir.
    const n = Number(v.replace("%", "").replace(",", ".").trim());
    if (Number.isFinite(n)) return n;
  }
  return padrao;
};

const booleano = (v: unknown, padrao = false): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (["true", "1", "sim", "yes"].includes(s)) return true;
    if (["false", "0", "nao", "não", "no", ""].includes(s)) return false;
  }
  if (typeof v === "number") return v !== 0;
  return padrao;
};

const ESTADOS_VALIDOS: EstadoConversa[] = [
  "pendente",
  "humano",
  "erro",
  "ia",
  "finalizada",
];

const estado = (v: unknown): EstadoConversa => {
  const s = texto(v).toLowerCase().trim();
  return (ESTADOS_VALIDOS as string[]).includes(s)
    ? (s as EstadoConversa)
    : "ia";
};

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function paraMensagem(bruto: unknown, i: number): Mensagem {
  const m = (bruto ?? {}) as Record<string, unknown>;
  const de = texto(m.de).toLowerCase();
  return {
    id: texto(m.id, `m-${i}`),
    de: de === "cliente" || de === "humano" ? de : "ia",
    texto: texto(m.texto),
    hora: texto(m.hora),
  };
}

function paraConversa(bruto: unknown, i: number): Conversa {
  const c = (bruto ?? {}) as Record<string, unknown>;
  const mensagens = lista(c.mensagens).map(paraMensagem);
  return {
    id: texto(c.id, `c-${i}`),
    nome: texto(c.nome, "Sem nome"),
    telefone: texto(c.telefone),
    // Se o fluxo não mandar o resumo, usa a última mensagem: melhor do
    // que uma linha vazia na lista.
    ultimaMensagem:
      texto(c.ultimaMensagem) || mensagens.at(-1)?.texto || "",
    quando: texto(c.quando),
    estado: estado(c.estado),
    botPausado: booleano(c.botPausado),
    naoLidas: numero(c.naoLidas),
    mensagens,
  };
}

/**
 * Um agendamento vindo do n8n.
 *
 * `tratamentos` chega como lista ou como texto separado por vírgula — o
 * fluxo pode montar de qualquer um dos dois jeitos, e obrigar um formato
 * só seria criar armadilha para o meu eu do futuro.
 */
function paraAgendamento(bruto: unknown, i: number): Agendamento {
  const a = (bruto ?? {}) as Record<string, unknown>;

  const tratamentos = Array.isArray(a.tratamentos)
    ? a.tratamentos.map((t) => texto(t)).filter(Boolean)
    : texto(a.tratamentos)
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean);

  const status = texto(a.status).toLowerCase().trim();

  return {
    id: texto(a.id, `ag-${i}`),
    nome: texto(a.nome, "Sem nome"),
    telefone: texto(a.telefone),
    lente: texto(a.lente),
    tratamentos,
    preco: texto(a.preco),
    quando: texto(a.quando),
    grau: texto(a.grau),
    receitaUrl: texto(a.receitaUrl) || undefined,
    // Qualquer coisa fora dos três conhecidos vira "aguardando": é o
    // estado que pede atenção, e errar para o lado de pedir conferência é
    // melhor do que marcar como conferido algo que ninguém olhou.
    status:
      status === "conferido" || status === "ajustado" ? status : "aguardando",
    observacao: texto(a.observacao) || undefined,
  };
}

function paraContato(bruto: unknown, i: number): Contato {
  const c = (bruto ?? {}) as Record<string, unknown>;
  return {
    id: texto(c.id, `k-${i}`),
    nome: texto(c.nome, "Sem nome"),
    telefone: texto(c.telefone),
    primeiroContato: texto(c.primeiroContato),
    ultimoContato: texto(c.ultimoContato),
    conversas: numero(c.conversas),
    etiquetas: lista(c.etiquetas).map((e) => texto(e)).filter(Boolean),
  };
}

function paraNumeros(bruto: unknown): Numeros {
  const n = (bruto ?? {}) as Record<string, unknown>;
  return {
    recebidas: numero(n.recebidas),
    respondidasIA: numero(n.respondidasIA),
    ativas: numero(n.ativas),
    pendentes: numero(n.pendentes),
    humano: numero(n.humano),
    erro: numero(n.erro),
    finalizadas: numero(n.finalizadas),
    taxaAutomacao: numero(n.taxaAutomacao),
  };
}

function paraConfiguracao(bruto: unknown): Configuracao {
  const c = (bruto ?? {}) as Record<string, unknown>;
  return {
    nomeAgente: texto(c.nomeAgente, CONFIGURACAO.nomeAgente),
    boasVindas: texto(c.boasVindas, CONFIGURACAO.boasVindas),
    inicio: texto(c.inicio, CONFIGURACAO.inicio),
    fim: texto(c.fim, CONFIGURACAO.fim),
    passarParaHumano: texto(
      c.passarParaHumano,
      CONFIGURACAO.passarParaHumano,
    ),
    responderForaDoHorario: booleano(
      c.responderForaDoHorario,
      CONFIGURACAO.responderForaDoHorario,
    ),
  };
}

/* -- Leitura -------------------------------------------------- */

export async function buscarPainel(): Promise<DadosPainel> {
  if (!configurado()) {
    return {
      ...PAINEL_EXEMPLO,
      origem: "exemplo",
      agendaExemplo: true,
      aviso: `Falta configurar: ${faltando().join(", ")}.`,
    };
  }

  try {
    const bruto = await chamarN8N<Record<string, unknown>>("painel");

    // Campo ausente e campo vazio são coisas diferentes. Ausente = o
    // fluxo do n8n ainda não devolve agenda, e a tela mostra exemplo
    // avisando que é exemplo. Vazio = o fluxo respondeu e não há
    // agendamento nenhum, e aí a tela tem que dizer isso, não inventar.
    const agendaVeio = bruto.agendamentos !== undefined;

    return {
      conversas: lista(bruto.conversas).map(paraConversa),
      numeros: paraNumeros(bruto.numeros),
      contatos: lista(bruto.contatos).map(paraContato),
      agendamentos: agendaVeio
        ? lista(bruto.agendamentos).map(paraAgendamento)
        : AGENDAMENTOS,
      agendaExemplo: !agendaVeio,
      configuracao: paraConfiguracao(bruto.configuracao),
      origem: "n8n",
    };
  } catch (e) {
    // Fluxo fora do ar deixa o painel desatualizado, nunca em branco.
    const motivo =
      e instanceof ErroN8N ? e.message : "Falha desconhecida ao ler o n8n.";
    console.error("[painel] caindo para dados de exemplo:", motivo);
    return {
      ...PAINEL_EXEMPLO,
      origem: "exemplo",
      agendaExemplo: true,
      aviso: motivo,
    };
  }
}
