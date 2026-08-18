"use server";

import { chamarN8N, configurado, ErroN8N } from "@/lib/n8n";
import type { Configuracao } from "@/lib/dados-painel";

/**
 * O que o painel escreve de volta no n8n.
 *
 * Server Actions e não rotas de API: o token do n8n fica deste lado sem
 * precisar de arquivo de rota nenhum, e o cliente chama como se fosse
 * uma função. Arquivo "use server" só exporta função assíncrona — por
 * isso não tem constante nem tipo exportado aqui.
 *
 * Nenhuma delas lança. Um fluxo fora do ar tem que virar um aviso na
 * tela, não uma tela de erro do React: a pessoa está no meio de um
 * atendimento e precisa saber que a mensagem não saiu, sem perder o que
 * digitou.
 */

export type Resultado = { ok: true } | { ok: false; erro: string };

async function tentar(
  caminho: string,
  corpo: unknown,
): Promise<Resultado> {
  if (!configurado()) {
    return {
      ok: false,
      erro: "n8n não configurado. Faltam N8N_BASE_URL e N8N_TOKEN.",
    };
  }

  try {
    await chamarN8N(caminho, { metodo: "POST", corpo });
    return { ok: true };
  } catch (e) {
    const erro =
      e instanceof ErroN8N ? e.message : "Falha ao falar com o n8n.";
    console.error(`[acoes-painel] ${caminho}:`, erro);
    return { ok: false, erro };
  }
}

/** Manda a mensagem que a pessoa escreveu para o WhatsApp do cliente. */
export async function enviarMensagem(
  conversaId: string,
  texto: string,
): Promise<Resultado> {
  const limpo = texto.trim();
  if (!limpo) return { ok: false, erro: "Mensagem vazia." };
  return tentar("conversa/mensagem", { conversaId, texto: limpo });
}

/** Liga ou desliga a IA numa conversa. */
export async function alternarPausa(
  conversaId: string,
  pausado: boolean,
): Promise<Resultado> {
  return tentar("conversa/pausa", { conversaId, pausado });
}

/** Grava as configurações do agente. */
export async function salvarConfiguracao(
  config: Configuracao,
): Promise<Resultado> {
  return tentar("agente/config", config);
}

/**
 * Pergunta do chat da Hero.
 *
 * Esta devolve texto em vez de só ok/erro, porque a resposta é o produto
 * da chamada.
 */
export async function perguntarAoSimbionte(
  pergunta: string,
): Promise<{ ok: true; resposta: string } | { ok: false; erro: string }> {
  const limpa = pergunta.trim();
  if (!limpa) return { ok: false, erro: "Pergunta vazia." };

  if (!configurado()) {
    return {
      ok: false,
      erro: "n8n não configurado. Faltam N8N_BASE_URL e N8N_TOKEN.",
    };
  }

  try {
    const r = await chamarN8N<{ resposta?: string; output?: string }>(
      "simbionte/perguntar",
      { metodo: "POST", corpo: { pergunta: limpa } },
    );
    // `output` é o nome que o nó de Agente do n8n usa por padrão; aceito
    // os dois para não obrigar a renomear campo no fluxo.
    const resposta = r.resposta ?? r.output ?? "";
    if (!resposta.trim()) {
      return { ok: false, erro: "O agente respondeu vazio." };
    }
    return { ok: true, resposta };
  } catch (e) {
    const erro =
      e instanceof ErroN8N ? e.message : "Falha ao falar com o n8n.";
    console.error("[acoes-painel] simbionte/perguntar:", erro);
    return { ok: false, erro };
  }
}
