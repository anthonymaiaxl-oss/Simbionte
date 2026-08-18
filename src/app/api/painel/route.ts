import { NextResponse } from "next/server";
import { buscarPainel } from "@/lib/painel-servidor";

/**
 * O painel inteiro, para o cliente atualizar sem recarregar a página.
 *
 * A carga inicial NÃO passa por aqui — ela vem pronta do componente de
 * servidor, senão a tela apareceria vazia e piscaria ao preencher. Esta
 * rota serve para o "Atualizar" e para a releitura periódica.
 *
 * Quem está sem sessão recebe 401 do proxy antes de chegar neste
 * arquivo.
 */

// Nunca prerenderizar: o painel é dado vivo, e uma resposta congelada em
// build mostraria a conversa de ontem.
export const dynamic = "force-dynamic";

export async function GET() {
  const dados = await buscarPainel();
  return NextResponse.json(dados, {
    headers: { "Cache-Control": "no-store" },
  });
}
