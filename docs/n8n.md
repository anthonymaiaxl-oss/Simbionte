# Ligar o painel ao n8n

O site nunca fala com o WhatsApp direto. Ele fala só com o n8n, e o n8n
fala com a Meta Cloud API e com a Data Table. Assim o token da Meta e as
credenciais ficam num lugar só.

```
Navegador ──▶ Next (servidor) ──▶ n8n Cloud ──▶ Meta Cloud API
                                      │
                                      └──▶ Data Table (estado)
```

O token do n8n **nunca** vai para o navegador. Quem chama é o servidor do
Next, por Server Action ou pela rota `/api/painel`.

---

## 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
N8N_BASE_URL=https://SUACONTA.app.n8n.cloud
N8N_TOKEN=<um segredo longo e aleatório>
```

Sem elas o painel sobe com os dados de exemplo e mostra o selo
**"Dados de exemplo"** — ele não quebra, mas também não mente.

Na Vercel: Settings → Environment Variables, as mesmas duas.

## 2. Autenticação no n8n

Em cada nó **Webhook**, aba *Authentication*, escolha **Header Auth** e
crie uma credencial com:

| campo | valor |
|---|---|
| Name  | `X-Simbionte-Token` |
| Value | o mesmo de `N8N_TOKEN` |

Sem isso, qualquer pessoa que descobrir a URL dispara seus fluxos —
inclusive mandar WhatsApp em nome da empresa.

---

## 3. Os cinco webhooks

Todos em `POST`, menos o primeiro. Todos precisam terminar num nó
**"Respond to Webhook"** com o corpo em JSON — se ele responder vazio, o
painel trata como falha e cai no exemplo.

### 3.1 `GET /webhook/painel` — o painel inteiro

Uma chamada só traz tudo. Responda:

```json
{
  "conversas": [
    {
      "id": "5511999999999",
      "nome": "Carlos Meireles",
      "telefone": "+55 11 99999-9999",
      "ultimaMensagem": "Bom dia, ainda tem em estoque?",
      "quando": "09:12",
      "estado": "pendente",
      "botPausado": false,
      "naoLidas": 2,
      "mensagens": [
        { "id": "m1", "de": "cliente", "texto": "Bom dia", "hora": "09:10" },
        { "id": "m2", "de": "ia",      "texto": "Bom dia! Como ajudo?", "hora": "09:10" }
      ]
    }
  ],
  "numeros": {
    "recebidas": 128, "respondidasIA": 96, "ativas": 7,
    "pendentes": 2, "humano": 3, "erro": 1,
    "finalizadas": 41, "taxaAutomacao": 75
  },
  "contatos": [
    {
      "id": "c1", "nome": "Carlos Meireles", "telefone": "+55 11 99999-9999",
      "primeiroContato": "12/08", "ultimoContato": "hoje",
      "conversas": 4, "etiquetas": ["cliente", "orçamento"]
    }
  ],
  "configuracao": {
    "nomeAgente": "Simbionte",
    "boasVindas": "Oi! Sou o assistente da...",
    "inicio": "08:00", "fim": "18:00",
    "passarParaHumano": "Quando a pessoa pedir atendente...",
    "responderForaDoHorario": true
  }
}
```

**`estado`** só aceita: `pendente`, `humano`, `erro`, `ia`, `finalizada`.
Qualquer outra coisa vira `ia`.

**`de`** só aceita: `cliente`, `ia`, `humano`.

Não precisa acertar o tipo: número pode vir como texto (`"75"`, `"75%"`),
booleano pode vir como `"true"`/`"sim"`/`1`. O painel normaliza. Campo
que faltar vira vazio ou zero — não quebra a tela.

### 3.2 `POST /webhook/conversa/mensagem` — responder pelo painel

Recebe:
```json
{ "conversaId": "5511999999999", "texto": "Já separei o seu pedido." }
```
Deve mandar pela Meta Cloud API e gravar na Data Table.
Responda qualquer JSON (ex.: `{"ok": true}`).

### 3.3 `POST /webhook/conversa/pausa` — ligar/desligar a IA

```json
{ "conversaId": "5511999999999", "pausado": true }
```
Grave o campo na Data Table. **O fluxo que responde as mensagens que
chegam precisa checar esse campo antes de responder** — senão o botão
"Pausar IA" não pausa nada.

### 3.4 `POST /webhook/agente/config` — salvar a configuração

Recebe o objeto `configuracao` inteiro (item 3.1).

### 3.5 `POST /webhook/simbionte/perguntar` — o chat da Hero

```json
{ "pergunta": "Quantas conversas estão abertas agora? [modo: analisar]" }
```
Responda `{"resposta": "..."}` ou `{"output": "..."}` — aceito os dois,
porque `output` é o nome que o nó de **AI Agent** já usa.

Enquanto este não existir, o chat responde sozinho com os números do
painel. Assim que ele subir, o chat passa a usar a IA sem mexer no site.

---

## 4. Sugestão de colunas na Data Table

**conversas**: `id`, `nome`, `telefone`, `estado`, `botPausado`,
`naoLidas`, `ultimaMensagem`, `quando`

**mensagens**: `id`, `conversaId`, `de`, `texto`, `hora`, `criadoEm`

**config**: linha única com os campos de `configuracao`

---

## 5. Testar

Com `N8N_BASE_URL` e `N8N_TOKEN` preenchidos, o selo no topo do painel
deve virar **"Ao vivo pelo n8n"**. Se continuar em "Dados de exemplo", o
motivo aparece do lado — e o erro completo sai no terminal do `npm run
dev`, prefixado com `[painel]`.

Teste um webhook direto:

```bash
curl -H "X-Simbionte-Token: SEU_TOKEN" https://SUACONTA.app.n8n.cloud/webhook/painel
```

## 6. O que ainda falta

- **Anexos e áudio do chat** ficam só no navegador. Mandá-los ao n8n pede
  upload multipart, que faço quando o webhook do chat existir.
- **Atualização é manual**, pelo botão "Atualizar". Tempo real pediria
  polling ou SSE — vale decidir depois de ver o volume real.
- **A senha do painel ainda é a provisória** em `src/lib/auth.ts`.
