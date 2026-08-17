"use client";

import { useActionState } from "react";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { entrar } from "../acoes-auth";
import { ACESSO, type EstadoLogin } from "@/lib/auth";

const INICIAL: EstadoLogin = { erro: null };

export function FormularioEntrada() {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);

  return (
    <>
      <AnimatedForm
        header="Entrar no painel"
        subHeader="Use o acesso que enviamos para a sua empresa. Não existe cadastro aberto."
        submitButton="Entrar"
        errorField={estado.erro}
        enviando={pendente}
        action={acao}
        fields={[
          {
            id: "email",
            label: "E-mail",
            type: "email",
            required: true,
            placeholder: "voce@suaempresa.com.br",
          },
          {
            id: "senha",
            label: "Senha",
            type: "password",
            required: true,
            placeholder: "••••••••",
          },
        ]}
      />

      {/* Enquanto não há Supabase, a credencial fica à vista: esconder
          um acesso que já está no repositório não protege nada e só
          faria você procurar. */}
      <div className="mx-auto mt-8 w-full max-w-sm rounded-[10px] border border-alerta/30 bg-alerta/5 p-4">
        <p className="rotulo text-alerta">Acesso provisório</p>
        <p className="mt-2 text-sm leading-relaxed text-bruma">
          <span className="text-marfim">{ACESSO.email}</span>
          {" · "}
          <span className="text-marfim">{ACESSO.senha}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-bruma">
          Some quando o Supabase entrar.
        </p>
      </div>
    </>
  );
}
