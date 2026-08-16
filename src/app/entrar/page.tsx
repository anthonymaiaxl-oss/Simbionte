import { FormularioEntrada } from "./formulario";
import { OrbitaSimbionte } from "@/components/orbita-simbionte";

export const metadata = { title: "Entrar — Simbionte" };

export default function Entrar() {
  return (
    <main className="flex min-h-dvh">
      {/* Lado da marca. Some abaixo de lg: numa tela estreita, o nome e
          as órbitas empurrariam o formulário para fora da dobra. */}
      <section className="relative hidden w-1/2 border-r border-borda lg:block">
        <OrbitaSimbionte />
      </section>

      <section className="flex w-full flex-col justify-center px-[10%] lg:w-1/2">
        <FormularioEntrada />
      </section>
    </main>
  );
}
