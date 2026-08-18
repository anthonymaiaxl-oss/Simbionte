/**
 * Cliente do n8n.
 *
 * Só roda no servidor. O token nunca pode chegar ao navegador: quem tem
 * o token dispara qualquer fluxo da conta, inclusive mandar WhatsApp em
 * nome da empresa. Por isso nenhum componente com "use client" importa
 * este arquivo — quem precisa de dado passa por Server Action ou pela
 * rota /api/painel, que rodam do lado de cá.
 *
 * A base e o token vêm do ambiente. Sem eles o painel continua de pé com
 * os dados de exemplo: um .env faltando não pode derrubar a tela.
 */

const BASE = process.env.N8N_BASE_URL?.replace(/\/+$/, "") ?? "";
const TOKEN = process.env.N8N_TOKEN ?? "";

/**
 * Qual empresa este painel atende.
 *
 * O fluxo do n8n e multi-empresa: todo payload leva `empresaId`. Aqui ele
 * vem do ambiente, ou seja, UM painel por empresa — cada implantacao
 * aponta para a sua.
 *
 * Se um dia o mesmo painel precisar atender varias empresas, este valor
 * sai do ambiente e passa a vir da sessao de quem entrou. O resto do
 * codigo nao muda: `empresaId` ja e injetado num lugar so, logo abaixo.
 */
const EMPRESA = process.env.N8N_EMPRESA_ID ?? "";

/** Quanto esperar antes de desistir de uma chamada, em ms. */
const LIMITE = 8000;

export function configurado() {
  return BASE.length > 0 && TOKEN.length > 0 && EMPRESA.length > 0;
}

/** O que falta, para o painel dizer na tela em vez de so falhar. */
export function faltando(): string[] {
  const f: string[] = [];
  if (!BASE) f.push("N8N_BASE_URL");
  if (!TOKEN) f.push("N8N_TOKEN");
  if (!EMPRESA) f.push("N8N_EMPRESA_ID");
  return f;
}

export class ErroN8N extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly corpo?: string,
  ) {
    super(message);
    this.name = "ErroN8N";
  }
}

/**
 * Chama um webhook do n8n.
 *
 * `caminho` é o que vem depois de /webhook/ — por exemplo "conversas".
 *
 * Erro aqui nunca derruba a página: quem chama decide o que fazer, e a
 * camada de dados cai para o exemplo. Um fluxo fora do ar deve deixar o
 * painel desatualizado, não em branco.
 */
export async function chamarN8N<T>(
  caminho: string,
  opcoes: {
    metodo?: "GET" | "POST";
    corpo?: unknown;
    /** Segundos de cache. 0 = sempre fresco. */
    revalidar?: number;
  } = {},
): Promise<T> {
  if (!configurado()) {
    throw new ErroN8N(`Falta configurar: ${faltando().join(", ")}`);
  }

  const { metodo = "GET", corpo, revalidar = 0 } = opcoes;
  const corte = AbortSignal.timeout(LIMITE);

  // `empresaId` entra aqui, num lugar so, e nao em cada chamada: assim
  // nao existe endpoint que esqueceu de mandar. Em GET vai na query,
  // porque GET com corpo e ignorado por boa parte da infra.
  const url = new URL(`${BASE}/webhook/${caminho}`);
  if (metodo === "GET") url.searchParams.set("empresaId", EMPRESA);
  const corpoFinal =
    metodo === "POST"
      ? { empresaId: EMPRESA, ...(corpo as Record<string, unknown>) }
      : undefined;

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        // Header Auth do n8n: cadastre a credencial no nó Webhook com
        // este mesmo nome de header.
        "X-Simbionte-Token": TOKEN,
      },
      body: corpoFinal ? JSON.stringify(corpoFinal) : undefined,
      signal: corte,
      // GET com revalidar > 0 usa o cache do Next; POST nunca cacheia.
      ...(metodo === "GET" && revalidar > 0
        ? { next: { revalidate: revalidar } }
        : { cache: "no-store" as const }),
    });
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    throw new ErroN8N(`n8n inacessível (${caminho}): ${motivo}`);
  }

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new ErroN8N(
      `n8n respondeu ${resposta.status} em ${caminho}`,
      resposta.status,
      texto.slice(0, 500),
    );
  }

  const texto = await resposta.text();
  if (!texto.trim()) {
    throw new ErroN8N(
      `n8n devolveu corpo vazio em ${caminho}. No nó "Respond to Webhook", confira se o campo de resposta está preenchido.`,
    );
  }

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ErroN8N(
      `n8n devolveu algo que não é JSON em ${caminho}: ${texto.slice(0, 200)}`,
    );
  }
}
