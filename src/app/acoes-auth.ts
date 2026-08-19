"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACESSO, COOKIE_SESSAO, type EstadoLogin } from "@/lib/auth";
import { chamarN8N, configurado } from "@/lib/n8n";
import { conferirSenha } from "@/lib/senha";

/**
 * Entrada no painel.
 *
 * A conta vive numa Data Table do n8n. O site pergunta por e-mail, recebe
 * o hash guardado e confere aqui — a senha digitada não sai deste
 * servidor, e o que está gravado lá não serve para entrar em lugar nenhum
 * se vazar.
 *
 * A credencial fixa continua valendo como reserva, e só é consultada
 * quando o n8n não responde ou não está configurado. Sem isso, um fluxo
 * fora do ar tranca você para fora do próprio painel.
 */

type UsuarioN8N = {
  email?: string;
  senha_hash?: string;
  senhaHash?: string;
  nome?: string;
  ativo?: boolean | string;
};

/** Aceita os dois nomes de coluna, para não obrigar a renomear no n8n. */
const hashDe = (u: UsuarioN8N) => u.senha_hash ?? u.senhaHash ?? "";

const estaAtivo = (v: unknown) => {
  // Sem a coluna, considera ativo: ninguém deve perder o acesso por não
  // ter criado um campo opcional.
  if (v === undefined || v === null || v === "") return true;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  return !["false", "0", "nao", "não", "inativo"].includes(s);
};

export async function entrar(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha para entrar." };
  }

  // Um respiro antes de responder: sem ele, errar a senha devolve o erro
  // instantaneamente e parece que o formulário nem tentou.
  await new Promise((r) => setTimeout(r, 450));

  let liberado = false;

  if (configurado()) {
    try {
      const bruto = await chamarN8N<UsuarioN8N | UsuarioN8N[]>(
        // `painel/usuario` e nao `usuario`: o fluxo do WhatsApp ja ocupa o
        // caminho `usuario` no n8n, e dois webhooks nao podem atender o
        // mesmo endereco. Mudar aqui evitou ter que mexer no fluxo que ja
        // estava funcionando.
        `painel/usuario?email=${encodeURIComponent(email)}`,
      );
      // O n8n devolve lista quando a busca traz linhas, e objeto quando o
      // próprio fluxo já separa a primeira. Os dois casos servem.
      const usuario = Array.isArray(bruto) ? bruto[0] : bruto;

      /**
       * Confere o e-mail da linha ANTES de olhar a senha.
       *
       * Parece redundante — o fluxo do n8n ja filtra por e-mail — mas foi
       * exatamente esse filtro que falhou em teste: o webhook devolvia a
       * primeira linha da tabela para qualquer e-mail pedido. Sem esta
       * conferencia, digitar um e-mail qualquer com a senha de outra
       * pessoa entrava.
       *
       * A regra e simples: quem decide se a linha serve e quem pediu, nao
       * quem respondeu.
       */
      const emailDaLinha = String(usuario?.email ?? "").trim().toLowerCase();
      const linhaConfere = emailDaLinha === email;

      if (!linhaConfere && usuario) {
        console.error(
          `[entrar] o n8n devolveu a linha de outro e-mail. Pedido: ${email}. ` +
            "Confira o filtro de email no no Data Table do webhook /usuario.",
        );
      }

      if (usuario && linhaConfere && estaAtivo(usuario.ativo)) {
        liberado = await conferirSenha(senha, hashDe(usuario));
      }
    } catch (e) {
      // Fluxo fora do ar não pode virar tela de erro no login: cai para a
      // reserva logo abaixo.
      console.error(
        "[entrar] n8n indisponível, tentando a credencial de reserva:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  // Reserva. Sai daqui quando a tabela de usuários estiver povoada e o
  // n8n estiver de pé de forma confiável.
  if (!liberado) {
    liberado = email === ACESSO.email && senha === ACESSO.senha;
  }

  if (!liberado) {
    // A mensagem não entrega qual dos dois campos errou.
    return { erro: "E-mail ou senha não conferem. Confira e tente de novo." };
  }

  const armazem = await cookies();
  armazem.set(COOKIE_SESSAO, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/");
}

export async function sair() {
  const armazem = await cookies();
  armazem.delete(COOKIE_SESSAO);
  redirect("/entrar");
}
