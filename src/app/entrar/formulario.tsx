"use client";

import { useActionState } from "react";
import { AnimatedForm } from "@/components/ui/modern-animated-sign-in";
import { entrar } from "../acoes-auth";
import { type EstadoLogin } from "@/lib/auth";

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
    </>
  );
}
