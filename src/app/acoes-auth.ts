"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACESSO, COOKIE_SESSAO, type EstadoLogin } from "@/lib/auth";

/**
 * Autenticação provisória.
 *
 * Só esta função muda quando o Supabase entrar: a sessão já é um cookie
 * httpOnly e o resto do app não sabe de onde ela veio.
 */
export async function entrar(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha para entrar." };
  }

  // Um respiro antes de responder: sem ele, errar a senha devolve o erro
  // instantaneamente e parece que o formulário nem tentou.
  await new Promise((r) => setTimeout(r, 450));

  if (email !== ACESSO.email || senha !== ACESSO.senha) {
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
