"use server";

import { chamarN8N, configurado, ErroN8N, faltando } from "@/lib/n8n";
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
      erro: `n8n não configurado. Falta: ${faltando().join(", ")}`,
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

/**
 * Manda a mensagem que a pessoa escreveu para o WhatsApp do cliente.
 *
 * O campo se chama `mensagem`, e nao `texto`, para casar com o payload
 * que o fluxo do n8n ja recebe hoje. `empresaId` entra sozinho no
 * cliente — nao precisa vir daqui.
 */
export async function enviarMensagem(
  conversaId: string,
  texto: string,
): Promise<Resultado> {
  const limpo = texto.trim();
  if (!limpo) return { ok: false, erro: "Mensagem vazia." };
  return tentar("conversa/mensagem", { conversaId, mensagem: limpo });
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
/** Anexo do chat, ja convertido para texto em base64 pelo navegador. */
export type AnexoEnviado = {
  nome: string;
  mime: string;
  /** Conteudo em base64, sem o prefixo `data:`. */
  dados: string;
};

/**
 * Teto do que sobe junto com a pergunta.
 *
 * Base64 engorda o arquivo em cerca de um terco, e o webhook do n8n tem
 * limite de corpo. Barrar aqui, com aviso claro, e melhor do que deixar
 * o envio falhar la com um erro que nao explica nada.
 */
const LIMITE_ANEXO = 4 * 1024 * 1024;

export async function perguntarAoSimbionte(
  pergunta: string,
  anexos: AnexoEnviado[] = [],
): Promise<{ ok: true; resposta: string } | { ok: false; erro: string }> {
  const limpa = pergunta.trim();
  if (!limpa && anexos.length === 0) {
    return { ok: false, erro: "Pergunta vazia." };
  }

  const grande = anexos.find((a) => a.dados.length > LIMITE_ANEXO);
  if (grande) {
    return {
      ok: false,
      erro: `"${grande.nome}" é grande demais para enviar. O limite é de 3 MB por arquivo.`,
    };
  }

  if (!configurado()) {
    return {
      ok: false,
      erro: `n8n não configurado. Falta: ${faltando().join(", ")}`,
    };
  }

  try {
    const r = await chamarN8N<{ resposta?: string; output?: string }>(
      // `painel/perguntar`: os caminhos do painel ficam todos sob `painel/`
      // para nao disputar endereco com o fluxo do WhatsApp.
      "painel/perguntar",
      {
        metodo: "POST",
        // `anexos` leva no maximo um item hoje: o fluxo do n8n transcreve
        // audio ou descreve imagem, um por vez, e junta ao texto.
        corpo: { pergunta: limpa, mensagem: limpa, anexos },
      },
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
