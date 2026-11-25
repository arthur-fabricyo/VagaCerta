# VagaCerta — design

**Data:** 18/11/2026 · **Prazo de entrega:** 04/12/2026 (Projeto Integrador — Front-end + Banco de Dados + IA)

Fontes: `kb/KB-ESTACIONAMENTO.md` (regras de negócio) e `kb/EDITAL_PROJETO_INTEGRADOR_FRONTEND_BANCO_IA.html` (requisitos e critérios de avaliação).

## 1. Intenção

O VagaCerta é um sistema web para o operador de um estacionamento. Na entrada, ele fotografa o veículo e a IA sugere a placa lida na foto. O operador confirma a placa e abre a visita. Na saída, o sistema calcula a permanência e o valor pela tarifa vigente. Também mostra o histórico de cada placa, com os dias e horários em que o carro costuma vir.

**Por quê:** é o trabalho final do trio. A nota depende de demonstrar ao vivo, num link do Vercel, o fluxo React → API → banco relacional → tela, com uma IA real e útil. Também depende das evidências: SQL, índice com EXPLAIN, GitHub e prints. O edital avalia domínio e funcionamento, não complexidade.

**Frase do produto:** "O VagaCerta ajuda operadores de estacionamento a registrar entradas e saídas sem digitar placas, porque hoje a anotação manual é lenta e sujeita a erro."

## 2. Objetivos, não objetivos e anti-objetivos

**Objetivos (MVP)**
1. **Entrada com IA.** A foto é tirada pela câmera do celular ou enviada por upload. A IA sugere a placa e informa a confiança, e o operador confirma ou corrige. A visita é aberta com a foto, a placa, o horário e a tarifa vigente. Não pode haver duas visitas abertas para a mesma placa na mesma unidade.
2. **Saída.** O operador localiza a visita aberta e registra a saída. O sistema mostra o tempo real, a regra aplicada e o valor, e grava o resultado.
3. **Pátio e histórico.** Mostra a lista de visitas abertas. Por placa, mostra as visitas e as combinações mais frequentes de dia da semana e hora de chegada, calculadas em SQL.
4. **Configuração.** Cadastro de unidade (nome e fuso) e de tarifa (modo, preço, bloco e tolerância).
5. **Entrega exigida pelo edital.** Deploy no Vercel, README, `sql/schema.sql`, `sql/seed.sql`, `docs/consultas.sql`, diagrama do banco, EXPLAIN antes e depois do índice e prints de evidência E1 a E6.

**Não objetivos (fora do MVP, de propósito)**
- Placa pendente ou ilegível sem confirmação. Na entrada, o operador sempre confirma ou digita a placa antes de salvar.
- Correções de placa ou horário com auditoria.
- Pagamento com estado próprio. O pagamento é simulado e a visita é considerada quitada ao registrar a saída.
- Perguntas de frequência em linguagem natural pela IA. É um extra, se sobrar tempo.
- Perfis e permissões diferentes (admin × operador). Todo usuário **aprovado** é operador, enxerga toda a operação e pode aprovar novos cadastros.
- Prazo de retenção de fotos.

**Anti-objetivos (falha mesmo que "funcione")**
- Dados falsos: arrays, localStorage ou setState apresentados como salvamento.
- IA simulada: texto fixo ou OCR local apresentado como modelo.
- Chave da IA ou do banco exposta no navegador ou no GitHub.
- Sistema que só funciona em localhost.
- Fotos de placas reais de terceiros. Usar apenas imagens fictícias, como carrinhos de brinquedo e placas impressas ou montadas com combinações inventadas.
- Afirmar que um carro "vai voltar" em certa data. O histórico só descreve o que foi observado (KB §5).

## 3. Restrições

- Trio, mas a construção será feita pelo Arthur junto com o Claude (decisão do usuário). O edital pede commits de integrantes diferentes e que todos expliquem uma parte técnica. Esse risco foi aceito, e o plano deve marcar partes que os colegas possam fazer e estudar se o grupo quiser.
- Custo zero: apenas planos gratuitos.
- Banco relacional com pelo menos 3 tabelas e 2 FKs, CRUD demonstrável, 2 consultas documentadas (uma com JOIN e outra com agregação) e 1 índice justificado com EXPLAIN antes e depois.
- Validação no servidor e SQL parametrizado. Rotas destrutivas não ficam públicas.
- UX: estados de carregamento, vazio, sucesso e erro. A interface precisa ser responsiva (o operador usa celular) e acessível, com labels, uso pelo teclado e foco visível.
- A interface avisa que a IA pode errar e que o operador deve conferir.
- Prazo de 16 dias. Ordem de prioridade do edital: fluxo persistente → IA → produção → evidências → estética.

## 4. Abordagens consideradas (leitura da placa)

| Abordagem | Prós | Contras |
| --- | --- | --- |
| **1. Modelo de visão geral (Gemini) via rota do servidor — escolhida** | Gratuito, configuração rápida, prompt e limites explicáveis na defesa, informa dúvida de leitura | Não é especializado e pode trocar um caractere. A confirmação humana cobre isso |
| 2. API especializada em placas (Plate Recognizer) | Mais precisa e devolve a posição da placa | Exige cadastro e cota, e é uma caixa-preta. Mostra menos o "contexto e limites" pedido na defesa |
| 3. OCR no navegador (Tesseract.js) | Sem chave nem servidor | Lê mal fotos reais e corre o risco de ser classificado como "IA simulada". Descartada |

O usuário escolheu a 1. A rota fica isolada para que trocar de provedor depois não afete a interface.

Na conversa também foram decididos: a IA principal é a leitura de placa (a frequência em linguagem natural ficou como extra) e o recorte de escopo da seção 2.

## 5. Arquitetura e decisões técnicas

Estas são decisões técnicas do designer, aceitas pelo usuário sem objeção:

- **Stack:** Next.js (App Router, TypeScript), com Route Handlers como API e **PostgreSQL genérico**, sem depender de recursos de um provedor específico (decisão do usuário). Um único deploy no Vercel. Em produção, o Postgres fica no **Neon** (decisão do usuário), acessado apenas pela `DATABASE_URL` padrão. O código não usa nada específico do Neon, então dá para trocar de provedor sem mudar código. É o "Caminho A" do edital.
- **ORM:** **Prisma 7 (última versão)**, decisão do usuário. A configuração segue a documentação oficial do Prisma para PostgreSQL: driver adapter `@prisma/adapter-pg` (`new PrismaPg({ connectionString: process.env.DATABASE_URL })` passado para `new PrismaClient({ adapter })`), `prisma.config.ts` com `defineConfig({ schema, datasource: { url: env("DATABASE_URL") } })` e client gerado em `generated/prisma`. Fixar a última versão **7.x**, porque a documentação já anuncia o Prisma 8 como release candidate e ele não deve ser usado. As migrações do Prisma (`prisma/migrations/*/migration.sql`) são o script reproduzível do banco. O `sql/schema.sql` do edital é gerado a partir delas (`prisma migrate diff`), e o `sql/seed.sql` (ou `prisma/seed.ts`) cria os dados fictícios.
- **Autenticação:** **Better Auth** com e-mail e senha (nome, e-mail, senha) e adapter do Prisma, decisão do usuário. As tabelas do Better Auth (`user`, `session`, `account`, `verification`) entram no schema Prisma.
- **IA:** **Vercel AI SDK** (decisão do usuário, para facilitar a ligação entre front e back). No servidor, `generateText` com `Output.object({ schema })`, usando um schema Zod, gera o JSON da leitura. No React, o hook `useObject` consome a resposta da rota. O provedor é o Google Gemini via `@ai-sdk/google`, com um modelo "flash" do plano gratuito que aceite imagem. O nome do modelo fica em `AI_MODEL`, e a chave na variável que o provider lê (`GOOGLE_GENERATIVE_AI_API_KEY`), ambas só no servidor. Trocar de provedor depois é mudar uma linha.
- **Foto:** capturada com `<input type="file" accept="image/*" capture="environment">`, que abre a câmera no celular e permite upload no desktop. É redimensionada e comprimida no navegador por canvas (lado maior ≈ 1280 px, JPEG, cerca de 100–200 KB) e guardada no Postgres como `bytea`. Assim não há serviço extra de armazenamento. A foto é servida por `GET /api/visitas/[id]/foto`.
- **Cadastro com aprovação interna** (decisão do usuário): qualquer pessoa pode criar conta, mas ela nasce **pendente** e não entra no sistema até um usuário já aprovado aprová-la numa tela interna. Usuários aprovados compartilham a operação: veem as mesmas unidades e visitas.
- **Acesso padrão:** o seed cria um usuário inicial já aprovado, com e-mail e senha lidos de variáveis de ambiente (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). As credenciais são entregues ao usuário depois, fora do repositório, e o README orienta os avaliadores a usar uma conta de demonstração.
- **Unidade ativa:** um seletor no cabeçalho escolhe a unidade, e a escolha fica guardada como conveniência no localStorage. O seed cria 2 unidades fictícias.

```
Navegador (React) ──fetch──▶ Route Handlers (Vercel) ──▶ Prisma 7 (adapter-pg) ──▶ PostgreSQL
                         │                │
                         │                └──▶ Gemini (visão) — só via /api/ia/placa
                         └── /api/auth/* (Better Auth, cookie de sessão)
```

## 6. Modelo de dados

```
unidades 1───N tarifas
unidades 1───N visitas N───1 tarifas
user     1───N visitas (operador da entrada e da saída)
```

**user** (Better Auth): tabela gerada pela biblioteca, com `id`, `name`, `email` e outros campos, mais o campo adicional `aprovado` (boolean, padrão `false`) e opcionalmente `aprovado_por` / `aprovado_em`. É referenciada pelas visitas.

**unidades**: `id` (PK), `nome` (UNIQUE, NOT NULL), `fuso` (NOT NULL, ex.: `America/Sao_Paulo`), `criado_em`.

**tarifas**: `id` (PK), `unidade_id` (FK → unidades), `modo` (CHECK `proporcional` | `blocos`), `preco_centavos` (INT > 0, preço por hora ou por bloco), `bloco_minutos` (obrigatório se o modo for `blocos`, garantido por CHECK), `tolerancia_minutos` (≥ 0; 0 = desativada), `tolerancia_modo` (CHECK `cobra_total` | `desconta`), `vigente_desde` (timestamptz), `criado_em`.
- As tarifas são **imutáveis**. Uma mudança cria uma nova linha. A tarifa vigente é a de maior `vigente_desde` que seja ≤ agora para a unidade. Isso implementa a "versão da política" da KB §4.

**visitas**: `id` (PK), `unidade_id` (FK), `tarifa_id` (FK, fixada na entrada), `placa` (VARCHAR(7), normalizada), `placa_sugerida_ia` (nullable), `confianca_ia` (nullable, CHECK `alta` | `media` | `baixa`), `foto` (bytea, nullable), `foto_mime`, `observacao` (nullable), `operador_entrada_id` (FK → user), `operador_saida_id` (FK → user, nullable), `entrada_em` (timestamptz), `saida_em` (nullable), `duracao_seg`, `cobravel_seg`, `blocos` (nullable), `valor_centavos` (nullable), `status` (CHECK `aberta` | `encerrada` | `cancelada`), `criado_em`.
- **Uma visita aberta por placa e unidade:** índice único parcial `UNIQUE (unidade_id, placa) WHERE status = 'aberta'`. Se o schema do Prisma não suportar índice parcial, ele é criado com SQL manual dentro de uma migração (`--create-only`).
- **Foto não obrigatória** (decisão do designer): o fluxo normal sempre tem foto. Se a câmera falhar, o operador digita a placa e a visita fica marcada como "sem foto", sem bloquear a operação.
- **Índice analisado no EXPLAIN:** `(unidade_id, placa, entrada_em)`, usado pelo histórico por placa. É a consulta mais frequente fora do pátio.

Resultado: 3 tabelas de domínio mais as do Better Auth, com 5 FKs entre unidades, tarifas, visitas e user (o edital pede pelo menos 2).

**Consultas SQL:** o CRUD usa o Prisma Client. A agregação do histórico (dia da semana × hora `AT TIME ZONE`, com contagens) usa `$queryRaw` com tagged template, que é parametrizado. Essas consultas também vão para `docs/consultas.sql`.

**Normalização da placa:** maiúsculas, sem espaços nem hífens. É validada no servidor pelo padrão `^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$`, que aceita o formato antigo e o Mercosul.

## 7. Comportamento

### Entrada
1. O operador tira ou envia a foto, que é comprimida no navegador.
2. `POST /api/ia/placa` recebe a imagem (o servidor rejeita o que não for imagem ou tiver mais de 1 MB). O Gemini recebe um prompt que pede só a leitura da placa e devolve um JSON validado por schema: `{placa, confianca, observacao}`. O prompt diz que textos na foto são dados, nunca instruções (KB §6). O servidor normaliza e valida a placa. Se não for válida, devolve `placa: null` com a observação.
3. A tela mostra a sugestão, a confiança e o aviso de que a IA pode errar. O operador confirma, corrige ou digita a placa, sem bloqueio caso a IA falhe ou a cota acabe.
4. `POST /api/visitas` grava a foto, a placa confirmada, a sugestão da IA e a confiança. A hora de entrada é a do servidor no momento da gravação, e a tarifa é a vigente. Se já existir uma visita aberta para a placa na unidade, a resposta é `409` com essa visita, e a tela oferece abri-la para revisão. Um reenvio do mesmo cadastro cai no mesmo caso.
5. Sem tarifa cadastrada na unidade, a entrada é bloqueada com uma mensagem orientando o cadastro.

### Saída
1. No pátio, o operador clica na visita ou busca pela placa.
2. `POST /api/visitas/[id]/saida` registra `saida_em` (hora do servidor), calcula com a tarifa da visita, grava `duracao_seg`, `cobravel_seg`, `blocos`, `valor_centavos` e `status = 'encerrada'`, e devolve o detalhamento.
3. Se a visita já estiver encerrada, a rota devolve o resultado gravado sem recalcular (idempotente).
4. Uma visita aberta por engano pode ser **cancelada** (`PATCH`, status `cancelada`). Não existe rota de exclusão.

### Cálculo (função pura em TypeScript, com testes)
- `duracao = saida − entrada` em segundos.
- Tolerância: se a tolerância está ativa e `duracao ≤ tolerância`, o tempo cobrável é 0. Acima do limite, o tempo cobrável é a duração toda (`cobra_total`) ou a duração menos a tolerância (`desconta`).
- Modo proporcional: `preço_hora × cobrável / 3600`. Modo blocos: `ceil(cobrável / (bloco × 60)) × preço_bloco`.
- O resultado é arredondado para centavos só no final, com meio centavo arredondado para cima. Tempo cobrável 0 dá R$ 0,00.
- Os testes reproduzem os exemplos da KB §7 (23h40→00h10 = 30 min; 10h05→11h20 = 75 min, R$ 10,00 proporcional e R$ 16,00 em blocos de 60 min; tolerância de 10 min com exatamente 10 min = R$ 0,00; 20 min com tolerância de 10 = 20 ou 10 min cobráveis).

### Pátio e histórico
- **Pátio:** visitas abertas da unidade, com a placa, a hora de entrada, o tempo decorrido e uma miniatura da foto.
- **Histórico da placa** (`GET /api/placas/[placa]/historico?de=&ate=`): considera visitas encerradas da unidade e exclui as canceladas. Sem período informado, usa todo o histórico e mostra essa escolha na tela. Informa o total de visitas e a última entrada. Lista as combinações de dia da semana e hora de chegada (no fuso da unidade, `AT TIME ZONE`) com as contagens, ordenadas e mostrando empates. Com 0 visitas, diz que nada foi encontrado. Com 1 visita, mostra só esse registro.
- Essa é a consulta com **agregação** do relatório. A consulta com **JOIN** é visitas ⋈ tarifas ⋈ unidades, usada na tela de detalhe da visita.

### Configuração
- Formulários para criar uma unidade e uma tarifa, com validação no cliente e no servidor, e a lista das tarifas da unidade com a vigente em destaque.

## 8. Telas

0. **Entrar / Criar conta:** nome, e-mail e senha. Quem não está logado é redirecionado para cá. Depois de criar a conta, o usuário vê "Cadastro aguardando aprovação".
6. **Usuários:** lista de cadastros pendentes com o botão "Aprovar" (e "Recusar", que remove o cadastro pendente) e lista dos usuários aprovados.
1. **Pátio** (tela inicial): lista de visitas abertas e botão "Nova entrada".
2. **Nova entrada:** foto, sugestão da IA e confirmação (esboço abaixo).
3. **Detalhe e saída da visita:** foto, dados e botão "Registrar saída" com o resumo da cobrança.
4. **Histórico por placa:** busca, período, lista de visitas e padrões.
5. **Configurações:** unidades e tarifas.

```
┌ Nova entrada ─────────────────┐
│ [ foto do veículo ]           │
│ IA sugere: ABC1D23  (alta)    │
│ Placa: [ABC1D23____] ✎        │
│ [ Confirmar entrada ]         │
│ ⚠ A IA pode errar; confira.  │
└───────────────────────────────┘
```

## 9. Erros e segurança

- **Login obrigatório e aprovado:** todas as rotas `/api/*` (exceto `/api/auth/*`) e todas as páginas exigem sessão válida do Better Auth **de um usuário aprovado**. Um usuário pendente recebe 403 e vê a tela de aguardando aprovação. Essa regra vale também para a rota da IA, para proteger a cota gratuita. Sem sessão, as rotas respondem 401 e as páginas redirecionam para o login. As senhas ficam com hash feito pelo Better Auth. Isso atende ao item "não expor operações destrutivas públicas" do edital.
- `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_MODEL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` ficam só em `.env.local` e nas variáveis do Vercel. O `.env.example` vai para o GitHub sem valores.
- A IA pode responder 401/403, 429 (cota) ou estourar o tempo. A tela mostra uma mensagem amigável e libera a digitação manual. Nenhuma chamada é repetida em loop.
- O banco pode ficar indisponível (503/500) ou o recurso pode não existir (404). Toda tela mostra o estado correspondente.
- Todas as entradas são validadas no servidor. O acesso ao banco passa pelo Prisma Client, e as consultas raw usam `$queryRaw` com tagged template, nunca `$queryRawUnsafe` com concatenação.
- A chamada à IA é limitada pelo tamanho da imagem e só aceita formatos de imagem.

## 10. Entrega e evidências

Estrutura: app Next.js na raiz do repositório, com `prisma/` (schema e migrações), `sql/` (schema exportado e seed), `docs/` (diagrama, `consultas.sql`, `evidencias/`) e `kb/`. O README segue o "README mínimo" do edital. As evidências E1 a E6 seguem a seção 07 do edital. Antes de enviar: rodar `npm run build`, os testes e o checklist de produção do edital numa aba anônima.

## 11. Regra de trabalho: consultar antes de libs e arquitetura

O usuário pediu que **toda instalação de biblioteca e toda decisão de arquitetura seja consultada com ele antes**. As escolhas técnicas da seção 5 marcadas como "decisão do designer" estão sujeitas a essa aprovação. Pendentes de confirmação:

| Item | Recomendação | Motivo |
| --- | --- | --- |
| Estilos | Tailwind CSS — **aprovado** | Já vem com o create-next-app e não exige outra dependência |
| Testes | Vitest — **aprovado** | Rápido e simples para testar a cobrança e a normalização de placa |
| SDK da IA | Vercel AI SDK — **aprovado**: `ai`, `@ai-sdk/google` e `@ai-sdk/react` | `ai` é o núcleo (servidor), `@ai-sdk/google` conecta ao Gemini e `@ai-sdk/react` traz o `useObject` para o front |
| Adapter do Prisma | `@prisma/adapter-pg` (+ `pg`) — **aprovado** | Indicado pela documentação do Prisma para PostgreSQL e independente de provedor |
| `dotenv` | **Aprovado** | A documentação do Prisma 7 usa no `prisma.config.ts` para o CLI ler o `.env` (o Next.js lê sozinho, o CLI do Prisma não) |
| Hospedagem do Postgres de produção | Neon — **aprovado** | O código depende só da `DATABASE_URL` padrão do Postgres |
| Validação de entrada | Zod — **aprovado** | Um único schema serve para validar no cliente e no servidor |
| Foto no banco (`bytea`) | **Aprovado por enquanto** | Evita um serviço extra de armazenamento. O acesso à foto fica isolado num módulo para facilitar a migração para um storage depois |

## 12. Deixado para quem for construir

- O texto exato do prompt da IA e o schema JSON, desde que respeitem a seção 7.
- O nome exato do modelo Gemini do plano gratuito no momento da implementação.
- O layout visual, desde que seja responsivo e acessível.
- A ordem das tarefas, seguindo a prioridade do edital: fluxo persistente primeiro e IA logo depois.
- Os detalhes de integração do Better Auth com o Prisma 7 e o Next.js, conforme a documentação atual das duas bibliotecas. Escolhas com impacto de arquitetura, como proteger as páginas por proxy/middleware ou checar no layout, voltam ao usuário (seção 11).
