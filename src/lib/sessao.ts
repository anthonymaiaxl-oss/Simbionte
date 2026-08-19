import "server-only";

import { cookies } from "next/headers";
import { chamarN8N, configurado } from "@/lib/n8n";
import { COOKIE_SESSAO } from "@/lib/auth";

/**
 * Quem está logado, do ponto de vista do servidor.
 *
 * O e-mail vem do cookie de sessão; nome e empresa vêm da tabela
 * `usuarios` do n8n. A busca falhar não pode derrubar a página: sem ela a
 * pessoa continua logada e o topo mostra só o e-mail.
 */

export type Sessao = {
  email: string;
  nome?: string;
  empresa?: string;
};

type LinhaUsuario = {
  email?: string;
  nome?: string;
  empresaId?: string;
};

export async function lerSessao(): Promise<Sessao | null> {
  const armazem = await cookies();
  const email = armazem.get(COOKIE_SESSAO)?.value?.trim().toLowerCase();
  if (!email) return null;

  if (!configurado()) return { email };

  try {
    const bruto = await chamarN8N<LinhaUsuario | LinhaUsuario[]>(
      `painel/usuario?email=${encodeURIComponent(email)}`,
    );
    const u = Array.isArray(bruto) ? bruto[0] : bruto;

    // A mesma conferência do login: só uso a linha se ela for do e-mail
    // que pedi. Já vi o filtro do n8n devolver a primeira linha da tabela.
    if (u && String(u.email ?? "").trim().toLowerCase() === email) {
      return { email, nome: u.nome, empresa: u.empresaId };
    }
  } catch {
    // Silêncio de propósito: o topo da página não é lugar de mostrar erro
    // de integração, e o e-mail sozinho já identifica a sessão.
  }

  return { email };
}
