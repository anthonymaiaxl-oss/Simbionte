"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { entrar } from "../acoes-auth";
import { ACESSO, type EstadoLogin } from "@/lib/auth";

const INICIAL: EstadoLogin = { erro: null };

export function FormularioEntrada() {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);
  const [forma, setForma] = useState({ email: "", senha: "" });

  const alterar =
    (campo: keyof typeof forma) => (event: ChangeEvent<HTMLInputElement>) =>
      setForma((f) => ({ ...f, [campo]: event.target.value }));

  return (
    <>
      {/* O `action` da Server Action fica no form; o AnimatedForm valida
          no cliente antes e só então deixa o envio seguir. */}
      <form action={acao} id="form-entrada" className="contents">
        <AnimatedForm
          header="Entrar no painel"
          subHeader="Use o acesso que enviamos para a sua empresa. Não existe cadastro aberto."
          submitButton="Entrar"
          errorField={estado.erro}
          enviando={pendente}
          onSubmit={(event) => {
            // A validação já passou: entrega o envio ao formulário que
            // carrega a Server Action.
            (event.currentTarget.closest("form") as HTMLFormElement)?.requestSubmit();
          }}
          fields={[
            {
              id: "email",
              label: "E-mail",
              type: "email",
              required: true,
              placeholder: "voce@suaempresa.com.br",
              onChange: alterar("email"),
            },
            {
              id: "senha",
              label: "Senha",
              type: "password",
              required: true,
              placeholder: "••••••••",
              onChange: alterar("senha"),
            },
          ]}
        />
      </form>

      {/* Enquanto não há Supabase, a credencial fica à vista: esconder
          um acesso que já está no código não protege nada e só faria
          você procurar. */}
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
