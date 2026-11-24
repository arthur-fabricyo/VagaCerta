# VagaCerta

Sistema web de operação de estacionamento para o Projeto Integrador de Desenvolvimento Web, IA e Banco de Dados.

Operadores aprovados registram reservas, localizam veículos no pátio, encerram visitas com cobrança simulada e consultam o histórico por placa. A leitura por foto usa IA pela Groq para sugerir uma placa que o operador pode corrigir antes de confirmar a reserva.

## Arquitetura

O padrão adotado para código novo e refatorações do backend é MVC com três camadas. O fluxo de dependências é `Controller → Service → Repository`.

- **Controller** recebe a requisição pelos Route Handlers do Next.js, valida os dados de entrada, chama o serviço e monta a resposta HTTP.
- **Service** implementa os casos de uso e as regras de negócio e coordena o acesso aos repositórios.
- **Repository** concentra a persistência e as consultas ao PostgreSQL, incluindo o acesso via Prisma e SQL.

Escreva o código e os identificadores técnicos em inglês, incluindo entidades, campos do banco, rotas do backend, nomes de classes e métodos, testes e comentários de código. Na criação de classes, aplique Clean Code, SOLID e orientação a objetos, com responsabilidades claras, encapsulamento e dependências explícitas. [Convenções para agentes e colaboradores](AGENTS.md)

## Branches e deploy

- `origin/develop` é a branch de integração. Crie branches de trabalho a partir de `develop` e abra os PRs de funcionalidades, correções e documentação com destino a `develop`.
- `origin/prod` é a branch reservada para produção. Para publicar uma versão validada, abra um PR de `develop` para `prod` e faça o merge após a revisão.

No GitHub, um administrador deve definir `develop` como branch padrão do repositório. No projeto Vercel conectado ao repositório, selecione `prod` em **Settings → Environments → Production → Branch Tracking**. Com essa configuração ativa, o merge em `prod` dispara o deploy de produção. Consulte a [documentação do Vercel](https://vercel.com/docs/git#customizing-the-production-branch).

## Desenvolvimento local

Requer pnpm 10.34.9 e Node.js 22 a partir da versão 22.12, ou Node.js 24 em diante.

```bash
pnpm install --frozen-lockfile
```

## Banco de dados e primeiro acesso

Para iniciar um PostgreSQL 18 com `pgvector` em Docker, rode `docker compose up -d --wait`. O banco local fica em `127.0.0.1:55440`, com dados em um volume persistente. A extensão `vector` é ativada na criação do volume. Para usar essa base na aplicação, configure `DATABASE_URL` em `.env.local` como `postgresql://vagacerta:vagacerta-local@127.0.0.1:55440/vagacerta?schema=public` e execute as migrações e o seed abaixo. A porta e a senha de inicialização podem ser definidas no ambiente do Compose com `VAGACERTA_DB_PORT` e `VAGACERTA_DB_PASSWORD`.

Copie `.env.example` para `.env.local` e preencha as variáveis abaixo.

- `DATABASE_URL` com a conexão do PostgreSQL de desenvolvimento.
- `BETTER_AUTH_URL` com a origem da aplicação, por exemplo `http://localhost:3000`.
- `BETTER_AUTH_SECRET` com um segredo aleatório. Gere um com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` com as credenciais do primeiro operador.
- `GROQ_API_KEY` e `GROQ_MODEL` para sugerir placas a partir de fotos. Configure um modelo Groq com visão. A reserva manual está disponível mesmo quando a leitura por foto falha.

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abra a origem configurada e entre com a conta do seed. Em **Usuários**, um operador aprovado pode aprovar ou recusar os cadastros feitos pela tela **Criar conta**.

Na operação, cadastre uma unidade com seu fuso horário e publique uma tarifa. Confirme uma reserva com placa digitada ou conferida a partir de uma foto. Abra a visita pelo pátio para registrar a saída ou cancelar. Consulte **Histórico** para ver chegadas de uma placa na unidade e no período escolhidos.

Para preparar uma base de demonstração, aplique as migrações, crie o primeiro operador e execute `psql` com `sql/seed.sql`. O arquivo `sql/schema.sql` reproduz o esquema num banco vazio via `psql` como alternativa para a demonstração SQL isolada. O deploy usa as migrações do Prisma.

| Área | Rotas da API |
| --- | --- |
| Unidades e tarifas | `GET /api/units`, `POST /api/units`, `POST /api/units/[id]/rates` |
| Entradas e pátio | `GET /api/visits?unitId=…`, `POST /api/visits` |
| Detalhe, saída e cancelamento | `GET /api/visits/[id]`, `PATCH /api/visits/[id]` |
| Fotos e leitura | `POST /api/ai/plate`, `GET /api/visits/[id]/photo` |
| Histórico | `GET /api/history?unitId=…&plate=…` com `start` e `end` opcionais |

O teste de integridade usa um banco de teste com a migração aplicada e desfaz os dados que cria.

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/integridade.sql
```

## Verificação

```bash
pnpm test
pnpm typecheck
pnpm build
```

Para verificar login, cadastro e aprovação via HTTP, use um banco de teste separado. Aplique a migração e o seed e inicie a aplicação com a mesma configuração usada pela suíte. A suíte lê `.env.local` ou as variáveis do terminal e cria contas fictícias no banco de teste.

```bash
pnpm test:acesso
pnpm test:operations
pnpm test:photo
```

O [relatório técnico](docs/relatorio-tecnico.md) reúne o diagrama, as consultas, os resultados locais e o procedimento de validação para a entrega.

Consulte [as regras do estacionamento](kb/KB-ESTACIONAMENTO.md), [as decisões técnicas](kb/DECISOES-TECNICAS.md) e [o plano inicial](docs/superpowers/plans/2026-11-18-vagacerta-fundacao.md).
