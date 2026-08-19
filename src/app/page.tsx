import { sair } from "@/app/acoes-auth";
import { buscarPainel } from "@/lib/painel-servidor";
import { lerSessao } from "@/lib/sessao";
import { ContaUsuario } from "@/components/conta-usuario";
import { ChatSimbionte } from "@/components/chat-simbionte";
import { FundoHero } from "@/components/fundo-hero";
import { MovimentoHero } from "@/components/movimento-hero";
import { BrilhoPonteiro } from "@/components/brilho-ponteiro";
import { Painel } from "@/components/painel";
import { RoboMascote } from "@/components/robo-mascote";
import { AnimatedText } from "@/components/ui/animated-text";

/**
 * Componente de servidor: fala com o n8n aqui, do lado de cá, e entrega
 * tudo pronto. Fosse o cliente a buscar, a tela apareceria vazia e
 * preencheria depois — e o token do n8n teria que sair daqui.
 *
 * `force-dynamic` porque painel de operação não pode vir congelado do
 * build: seria a conversa de ontem.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  // As duas leituras em paralelo: o topo nao precisa esperar o painel.
  const [dados, sessao] = await Promise.all([buscarPainel(), lerSessao()]);

  return (
    <>
      <BrilhoPonteiro />

      {/* z-40 fica acima do robô (z-30): se ele encostar no cabeçalho em
          alguma altura de tela, passa por trás em vez de por cima. */}
      <header className="relative z-40 mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <span className="font-[family-name:var(--fonte-gabarito)] text-lg font-bold tracking-tight">
          Simbionte
        </span>

        {sessao ? (
          <ContaUsuario
            email={sessao.email}
            nome={sessao.nome}
            empresa={sessao.empresa}
          />
        ) : (
          <form action={sair}>
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-full border border-borda px-5 text-sm text-bruma transition-colors hover:border-falha/50 hover:text-marfim"
            >
              Sair
            </button>
          </form>
        )}
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────
            O nome, o mascote e a conversa. O robô é cortado na linha do
            chat de propósito: ele emerge de dentro dela. */}
        <section className="hero mx-auto flex max-w-4xl flex-col items-center px-6 pb-14 pt-6 text-center sm:pt-10">
          <MovimentoHero />

          {/* Camadas do parallax: cada uma sobe numa taxa diferente. */}
          <div data-camada="fundo">
            <FundoHero />
          </div>

          <div data-camada="titulo">
            <p className="rotulo">Agente de WhatsApp</p>

            <h1 className="mt-6">
              <AnimatedText
                text="Simbionte"
                as="h1"
                duration={0.045}
                delay={0.05}
                className="items-center"
                textClassName="font-[family-name:var(--fonte-gabarito)] text-[4.1rem] font-extrabold leading-none tracking-[-0.035em] sm:text-9xl lg:text-[8.6rem]"
              />
              <span className="mt-5 block text-lg font-medium leading-snug text-bruma sm:text-2xl">
                Inteligência que conversa. Automação que trabalha.
              </span>
            </h1>
          </div>

          <div className="mt-6 w-full">
            <RoboMascote />
          </div>

          {/* Encosta no robô de propósito: o corpo dele é cortado nesta
              linha, então ele emerge de dentro da conversa. */}
          <div className="-mt-1 w-full">
            <ChatSimbionte dados={dados} />
          </div>
        </section>

        <Painel inicial={dados} />
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-bruma">Simbionte — painel do agente.</p>
      </footer>
    </>
  );
}
