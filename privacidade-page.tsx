// Página de Política de Privacidade — Next.js App Router.
//
// PARA QUE SERVE
// A Meta exige uma URL pública de política de privacidade para publicar um app
// (mudar de Development para Live). Esta página gera essa URL.
//
// COMO USAR
// 1. Salve como `app/privacidade/page.tsx`
// 2. Faça o deploy
// 3. A URL fica https://SEU-DOMINIO/privacidade
// 4. Cole essa URL no painel da Meta, em Configurações → Básico → URL da
//    Política de Privacidade
//
// ANTES DE PUBLICAR, TROQUE OS PLACEHOLDERS
// Procure por [COLCHETES] no texto. São dados que só você tem: razão social,
// e-mail de contato e CNPJ (se houver). Publicar com os colchetes visíveis
// passa a impressão de documento não terminado, e a Meta lê a página.
//
// AVISO IMPORTANTE
// Isto é um rascunho técnico, escrito a partir do que o sistema realmente faz —
// não é parecer jurídico. Atendimento de clínica trata dado de saúde, que a
// LGPD classifica como dado pessoal sensível e sujeita a regras mais rígidas.
// Antes de operar com paciente real, vale a revisão de alguém da área.

export const metadata = {
  title: "Política de Privacidade — Simbionte",
  description:
    "Como tratamos os dados pessoais recebidos pelo atendimento automatizado no WhatsApp.",
};

export default function PoliticaDePrivacidade() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-sm opacity-70">
        Última atualização: 17 de agosto de 2026
      </p>

      <div className="mt-10 space-y-10 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Quem somos</h2>
          <p className="mt-3">
            Esta política descreve como [NOME DA EMPRESA] trata os dados
            pessoais recebidos pelo atendimento automatizado no WhatsApp,
            operado em nome das clínicas contratantes.
          </p>
          <p className="mt-3">
            Contato para assuntos de privacidade: [E-MAIL DE CONTATO].
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Quais dados coletamos</h2>
          <p className="mt-3">
            Coletamos apenas o que chega pela conversa que você inicia no
            WhatsApp:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>seu número de telefone;</li>
            <li>o nome exibido no seu perfil do WhatsApp;</li>
            <li>
              o conteúdo das mensagens que você envia — texto, áudio, imagem e
              arquivos;
            </li>
            <li>
              dados de agendamento que você informar: serviço, data e horário;
            </li>
            <li>a data e a hora de cada mensagem.</li>
          </ul>
          <p className="mt-3">
            Não pedimos e não precisamos de CPF, endereço, dados de cartão ou
            documentos de identidade para atender você pelo WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Por que tratamos</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>responder à sua mensagem;</li>
            <li>registrar, consultar e remarcar agendamentos;</li>
            <li>manter o histórico da conversa, para não pedir a mesma informação duas vezes;</li>
            <li>encaminhar você a uma pessoa da equipe quando necessário.</li>
          </ul>
          <p className="mt-3">
            O tratamento acontece porque você iniciou a conversa e pediu
            atendimento. O sistema nunca envia mensagem para quem não escreveu
            primeiro, e não fazemos disparo em massa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Dados de saúde</h2>
          <p className="mt-3">
            Se você mencionar sintomas, tratamentos ou enviar exames, esse
            conteúdo é tratado como dado pessoal sensível pela Lei Geral de
            Proteção de Dados e recebe o mesmo cuidado do resto da conversa.
          </p>
          <p className="mt-3">
            O atendente virtual <strong>não é profissional de saúde</strong>.
            Ele não faz diagnóstico, não interpreta resultado de exame e não
            recomenda medicamento. Nessas situações, a conversa é encaminhada
            para a equipe da clínica.
          </p>
          <p className="mt-3">
            Evite enviar informações de saúde que não sejam necessárias para o
            seu atendimento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Com quem compartilhamos</h2>
          <p className="mt-3">
            Não vendemos dados e não os usamos para publicidade. O conteúdo da
            conversa passa por fornecedores de tecnologia que sustentam o
            atendimento:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <strong>Meta / WhatsApp</strong> — transporte das mensagens;
            </li>
            <li>
              <strong>OpenAI</strong> — geração da resposta, transcrição de
              áudio e descrição de imagem;
            </li>
            <li>
              <strong>n8n</strong> — orquestração do fluxo e armazenamento dos
              registros;
            </li>
            <li>
              <strong>Pinecone</strong> — base de conhecimento da clínica.
              Guarda informações sobre serviços e políticas da clínica, não
              conversas de pacientes.
            </li>
          </ul>
          <p className="mt-3">
            A clínica que você procurou também acessa a sua conversa e os seus
            agendamentos. Cada clínica enxerga apenas os próprios dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Por quanto tempo guardamos</h2>
          <p className="mt-3">
            Mantemos o histórico enquanto durar o relacionamento com a clínica,
            para dar continuidade ao atendimento. Você pode pedir a exclusão a
            qualquer momento pelo contato desta política, e a remoção é feita
            manualmente pela nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Seus direitos</h2>
          <p className="mt-3">
            A Lei Geral de Proteção de Dados garante que você peça:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>confirmação de que tratamos seus dados, e acesso a eles;</li>
            <li>correção de dado incompleto ou desatualizado;</li>
            <li>exclusão dos seus dados;</li>
            <li>informação sobre com quem compartilhamos;</li>
            <li>revogação do consentimento.</li>
          </ul>
          <p className="mt-3">
            Basta escrever para [E-MAIL DE CONTATO].
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Como parar de receber mensagens</h2>
          <p className="mt-3">
            Escreva para [E-MAIL DE CONTATO] ou peça na própria conversa para
            falar com uma pessoa da equipe e solicitar a interrupção. O
            atendimento automático é encerrado para o seu número.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Segurança</h2>
          <p className="mt-3">
            O acesso aos dados é restrito a quem opera o atendimento. As
            credenciais dos serviços ficam armazenadas de forma criptografada, e
            as consultas são separadas por clínica.
          </p>
          <p className="mt-3">
            Nenhum sistema é imune a incidentes. Se ocorrer algo que possa
            afetar você, comunicaremos pelos canais disponíveis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Mudanças nesta política</h2>
          <p className="mt-3">
            Se ela mudar, a data no topo é atualizada. Recomendamos reler de
            tempos em tempos.
          </p>
        </section>
      </div>
    </main>
  );
}
