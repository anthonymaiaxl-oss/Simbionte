/**
 * Dados do painel.
 *
 * São de exemplo, mas os tipos aqui são o contrato: quando as tabelas do
 * Supabase existirem, troque só a origem e a interface não muda.
 */

export type EstadoConversa =
  | "ia"
  | "humano"
  | "pendente"
  | "erro"
  | "finalizada";

/** Quem escreveu. `humano` é alguém do time que assumiu o atendimento. */
export type Autor = "cliente" | "ia" | "humano";

export type Mensagem = {
  id: string;
  de: Autor;
  texto: string;
  hora: string;
};

export type Conversa = {
  id: string;
  nome: string;
  telefone: string;
  ultimaMensagem: string;
  quando: string;
  estado: EstadoConversa;
  /** true = o bot está pausado nesta conversa e só humano responde. */
  botPausado: boolean;
  naoLidas: number;
  mensagens: Mensagem[];
};

export const AUTORES: Record<Autor, { rotulo: string; cor: string }> = {
  cliente: { rotulo: "Cliente", cor: "var(--color-bruma)" },
  ia: { rotulo: "Simbionte", cor: "var(--color-simbionte-claro)" },
  humano: { rotulo: "Você", cor: "var(--color-alerta)" },
};

export type Numeros = {
  recebidas: number;
  respondidasIA: number;
  ativas: number;
  pendentes: number;
  humano: number;
  erro: number;
  finalizadas: number;
  taxaAutomacao: number;
};

/** Rótulo, cor e ordem de urgência de cada estado. */
export const ESTADOS: Record<
  EstadoConversa,
  { rotulo: string; cor: string; urgencia: number }
> = {
  pendente: { rotulo: "Pendente", cor: "var(--color-alerta)", urgencia: 0 },
  humano: {
    rotulo: "Atendimento humano",
    cor: "var(--color-pulso)",
    urgencia: 1,
  },
  erro: { rotulo: "Com erro", cor: "var(--color-falha)", urgencia: 2 },
  ia: { rotulo: "IA ativa", cor: "var(--color-simbionte-claro)", urgencia: 3 },
  finalizada: { rotulo: "Finalizada", cor: "var(--color-bruma)", urgencia: 4 },
};

export const NUMEROS: Numeros = {
  recebidas: 128,
  respondidasIA: 96,
  ativas: 7,
  pendentes: 2,
  humano: 3,
  erro: 1,
  finalizadas: 41,
  taxaAutomacao: 75,
};

export const CONVERSAS: Conversa[] = [
  {
    id: "c1",
    nome: "Carlos Meireles",
    telefone: "+55 65 99999-0000",
    ultimaMensagem: "Bom dia, ainda estão atendendo?",
    quando: "há 4 min",
    estado: "pendente",
    botPausado: false,
    naoLidas: 1,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Bom dia, ainda estão atendendo?", hora: "08:12" },
      { id: "m2", de: "ia", texto: "Bom dia! Estamos sim, das 8h às 18h. Como posso ajudar?", hora: "08:12" },
      { id: "m3", de: "cliente", texto: "Queria saber o preço do serviço de manutenção preventiva.", hora: "08:14" },
      { id: "m4", de: "ia", texto: "Temos um pacote mensal a partir de R$ 320. Quer os detalhes do que está incluso?", hora: "08:14" },
      { id: "m5", de: "cliente", texto: "Quero sim. E vocês atendem em Várzea Grande?", hora: "08:19" },
    ],
  },
  {
    id: "c2",
    nome: "Distribuidora Vale Verde",
    telefone: "+55 11 3255-8090",
    ultimaMensagem: "Preciso falar com alguém sobre a nota do pedido 8841.",
    quando: "há 11 min",
    estado: "pendente",
    botPausado: false,
    naoLidas: 2,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Oi, tudo bem? Preciso da segunda via de uma nota.", hora: "07:58" },
      { id: "m2", de: "ia", texto: "Claro. Me passa o número do pedido que eu localizo aqui.", hora: "07:58" },
      { id: "m3", de: "cliente", texto: "Pedido 8841.", hora: "08:03" },
      { id: "m4", de: "ia", texto: "Achei o pedido, mas a nota está retida no financeiro. Vou chamar alguém do time.", hora: "08:03" },
      { id: "m5", de: "cliente", texto: "Preciso falar com alguém sobre a nota do pedido 8841.", hora: "08:05" },
    ],
  },
  {
    id: "c3",
    nome: "Marina Fontes",
    telefone: "+55 11 98812-4471",
    ultimaMensagem: "Deixa eu verificar isso com a equipe.",
    quando: "há 22 min",
    estado: "humano",
    botPausado: true,
    naoLidas: 0,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Consigo remarcar a visita de quinta para sexta?", hora: "07:40" },
      { id: "m2", de: "ia", texto: "Deixa eu ver a agenda. Um instante.", hora: "07:40" },
      { id: "m3", de: "humano", texto: "Oi Marina, aqui é a Ana. Deixa eu verificar isso com a equipe.", hora: "07:47" },
    ],
  },
  {
    id: "c4",
    nome: "João Origuela",
    telefone: "+55 21 99640-1122",
    ultimaMensagem: "Temos um pacote mensal a partir de R$ 320. Quer os detalhes?",
    quando: "há 35 min",
    estado: "ia",
    botPausado: false,
    naoLidas: 0,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Olá, queria saber o preço do serviço.", hora: "07:28" },
      { id: "m2", de: "ia", texto: "Olá! Claro, vou te ajudar. Qual serviço te interessa?", hora: "07:28" },
      { id: "m3", de: "cliente", texto: "O de manutenção preventiva.", hora: "07:31" },
      { id: "m4", de: "ia", texto: "Temos um pacote mensal a partir de R$ 320. Quer os detalhes?", hora: "07:31" },
    ],
  },
  {
    id: "c5",
    nome: "Ateliê Nove Casas",
    telefone: "+55 48 99127-3364",
    ultimaMensagem: "Qual o prazo para pedidos acima de 50 peças?",
    quando: "há 1 h",
    estado: "ia",
    botPausado: false,
    naoLidas: 0,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Boa tarde! Vocês fazem pedidos grandes?", hora: "07:02" },
      { id: "m2", de: "ia", texto: "Fazemos sim. A partir de 20 peças já entra na tabela de atacado.", hora: "07:02" },
      { id: "m3", de: "cliente", texto: "Qual o prazo para pedidos acima de 50 peças?", hora: "07:05" },
    ],
  },
  {
    id: "c6",
    nome: "Rafael Brandão",
    telefone: "+55 31 98455-7781",
    ultimaMensagem: "Não consegui enviar o comprovante, deu erro aqui.",
    quando: "há 2 h",
    estado: "erro",
    botPausado: false,
    naoLidas: 1,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Vou mandar o comprovante do pagamento.", hora: "06:10" },
      { id: "m2", de: "ia", texto: "Perfeito, pode enviar que eu registro aqui.", hora: "06:10" },
      { id: "m3", de: "cliente", texto: "Não consegui enviar o comprovante, deu erro aqui.", hora: "06:18" },
    ],
  },
  {
    id: "c7",
    nome: "Camila Nunes",
    telefone: "+55 85 98220-5510",
    ultimaMensagem: "Obrigada! Já recebi o orçamento.",
    quando: "há 3 h",
    estado: "finalizada",
    botPausado: false,
    naoLidas: 0,
    mensagens: [
      { id: "m1", de: "cliente", texto: "Bom dia, pode me mandar o orçamento por aqui?", hora: "05:30" },
      { id: "m2", de: "ia", texto: "Bom dia! Acabei de enviar no seu e-mail e também aqui em PDF.", hora: "05:31" },
      { id: "m3", de: "cliente", texto: "Obrigada! Já recebi o orçamento.", hora: "05:44" },
    ],
  },
];
export type Contato = {
  id: string;
  nome: string;
  telefone: string;
  primeiroContato: string;
  ultimoContato: string;
  conversas: number;
  etiquetas: string[];
};

export const CONTATOS: Contato[] = [
  {
    id: "p1",
    nome: "Carlos Meireles",
    telefone: "+55 65 99999-0000",
    primeiroContato: "14 ago",
    ultimoContato: "há 4 min",
    conversas: 3,
    etiquetas: ["orçamento", "manutenção"],
  },
  {
    id: "p2",
    nome: "Distribuidora Vale Verde",
    telefone: "+55 11 3255-8090",
    primeiroContato: "03 jul",
    ultimoContato: "há 11 min",
    conversas: 14,
    etiquetas: ["cliente", "financeiro"],
  },
  {
    id: "p3",
    nome: "Marina Fontes",
    telefone: "+55 11 98812-4471",
    primeiroContato: "12 ago",
    ultimoContato: "há 22 min",
    conversas: 5,
    etiquetas: ["agendamento"],
  },
  {
    id: "p4",
    nome: "João Origuela",
    telefone: "+55 21 99640-1122",
    primeiroContato: "16 ago",
    ultimoContato: "há 35 min",
    conversas: 1,
    etiquetas: ["orçamento"],
  },
  {
    id: "p5",
    nome: "Ateliê Nove Casas",
    telefone: "+55 48 99127-3364",
    primeiroContato: "28 jul",
    ultimoContato: "há 1 h",
    conversas: 8,
    etiquetas: ["atacado", "cliente"],
  },
  {
    id: "p6",
    nome: "Rafael Brandão",
    telefone: "+55 31 98455-7781",
    primeiroContato: "09 ago",
    ultimoContato: "há 2 h",
    conversas: 2,
    etiquetas: ["pagamento"],
  },
  {
    id: "p7",
    nome: "Camila Nunes",
    telefone: "+55 85 98220-5510",
    primeiroContato: "01 ago",
    ultimoContato: "há 3 h",
    conversas: 6,
    etiquetas: ["orçamento", "atendida"],
  },
];

export type Configuracao = {
  nomeAgente: string;
  boasVindas: string;
  inicio: string;
  fim: string;
  passarParaHumano: string;
  responderForaDoHorario: boolean;
};

export const CONFIGURACAO: Configuracao = {
  nomeAgente: "Simbionte",
  boasVindas:
    "Oi! Sou o Simbionte, atendo aqui pela empresa. Me conta o que você precisa que eu resolvo ou chamo alguém do time.",
  inicio: "08:00",
  fim: "18:00",
  passarParaHumano:
    "Quando a pessoa pedir para falar com um atendente, reclamar de cobrança ou repetir a mesma dúvida três vezes.",
  responderForaDoHorario: true,
};

/**
 * Um agendamento fechado pela IA, esperando a conferência na loja.
 *
 * É o fim do caminho do atendimento: o cliente mandou a receita, a IA leu,
 * ele confirmou, escolheu a lente e marcou o horário. O que falta é
 * humano — medidas, armação e a conferência de que a lente serve mesmo.
 */
export type Agendamento = {
  id: string;
  nome: string;
  telefone: string;

  /** Marca e linha, como aparece no catálogo: "Hoya Hilux". */
  lente: string;
  /** Tratamentos por extenso, não em código: "BlueControl", "Antirreflexo". */
  tratamentos: string[];
  preco: string;

  quando: string;
  /** O que a IA leu da receita, resumido: "OD -2,00 · OE -1,75". */
  grau: string;
  /**
   * Link do arquivo da receita.
   *
   * Vazio quando a foto ainda não foi arquivada — e nesse caso a tela diz
   * isso, em vez de mostrar um botão que não leva a lugar nenhum.
   */
  receitaUrl?: string;

  /** aguardando | conferido | ajustado */
  status: "aguardando" | "conferido" | "ajustado";
  /** Preenchido quando a conferência mudou alguma coisa. */
  observacao?: string;
};

/**
 * O painel inteiro, do jeito que a tela consome.
 *
 * Mora aqui e não no módulo de servidor de propósito: os componentes de
 * cliente precisam deste tipo, e o módulo de servidor é marcado com
 * `server-only` — importar de lá quebraria o build, que é exatamente o
 * que aquela marcação existe para fazer.
 */
export type DadosPainel = {
  conversas: Conversa[];
  numeros: Numeros;
  contatos: Contato[];
  agendamentos: Agendamento[];
  /**
   * Verdadeiro quando o n8n ainda não devolve `agendamentos` e a tela
   * está mostrando os exemplos.
   *
   * Existe para a tela poder DIZER isso. Dado falso sem aviso é pior do
   * que tela vazia: a pessoa confere um pedido que não existe, ou
   * confia que a lista está completa quando ela nem chegou.
   */
  agendaExemplo?: boolean;
  configuracao: Configuracao;
  /** De onde veio o dado: a tela avisa quando está em exemplo. */
  origem: "n8n" | "exemplo";
  /** Só preenchido quando o n8n falhou e caímos no exemplo. */
  aviso?: string;
};

/** O painel de exemplo, para quando o n8n não estiver configurado. */
/**
 * Agendamentos de exemplo.
 *
 * Existem para a aba poder ser construída e testada antes de o fluxo do
 * n8n existir. Os três casos cobrem o que a tela precisa saber lidar:
 * um normal, um com a receita ainda não arquivada, e um já conferido com
 * ajuste feito pela colaboradora.
 */
export const AGENDAMENTOS: Agendamento[] = [
  {
    id: "a1",
    nome: "Marina Fontes",
    telefone: "+55 11 98812-4471",
    lente: "Hoya Hilux 1.60",
    tratamentos: ["Antirreflexo", "BlueControl"],
    preco: "R$ 780,00",
    quando: "Quarta, 20/08 às 09:00",
    grau: "OD -2,00 -0,75 180° · OE -1,75 -0,50 175°",
    receitaUrl: "#",
    status: "aguardando",
  },
  {
    id: "a2",
    nome: "Carlos Meireles",
    telefone: "+55 65 99999-0000",
    lente: "Gradual Multifocal 1.67",
    tratamentos: ["Antirreflexo", "Fotossensível"],
    preco: "R$ 1.420,00",
    quando: "Quinta, 21/08 às 14:30",
    grau: "OD +1,50 · OE +1,25 · ADD +2,00",
    status: "aguardando",
  },
  {
    id: "a3",
    nome: "Ateliê Nove Casas",
    telefone: "+55 48 99127-3364",
    lente: "Hoya Visão Simples 1.59",
    tratamentos: ["Antirrisco"],
    preco: "R$ 460,00",
    quando: "Ontem às 16:00",
    grau: "OD -0,75 · OE -1,00",
    receitaUrl: "#",
    status: "ajustado",
    observacao: "Índice trocado para 1.67 na conferência — grau maior que o lido.",
  },
];

export const PAINEL_EXEMPLO: DadosPainel = {
  conversas: CONVERSAS,
  numeros: NUMEROS,
  contatos: CONTATOS,
  agendamentos: AGENDAMENTOS,
  configuracao: CONFIGURACAO,
  origem: "exemplo",
};
