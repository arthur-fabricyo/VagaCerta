# VagaCerta

Sistema web de operação de estacionamento para o Projeto Integrador de Desenvolvimento Web, IA e Banco de Dados.

## Desenvolvimento local

Requer pnpm 10.34.9 e Node.js 22 a partir da versão 22.12, ou Node.js 24 em diante.

```bash
pnpm install --frozen-lockfile
```

## Banco de dados e primeiro acesso

Copie `.env.example` para `.env.local` e preencha as variáveis abaixo.

- `DATABASE_URL` com a conexão do PostgreSQL de desenvolvimento.
- `BETTER_AUTH_URL` com a origem da aplicação, por exemplo `http://localhost:3000`.
- `BETTER_AUTH_SECRET` com um segredo aleatório. Gere um com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` com as credenciais do primeiro operador.

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abra a origem configurada e entre com a conta do seed. Em **Usuários**, um operador aprovado pode aprovar ou recusar os cadastros feitos pela tela **Criar conta**.

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
```

Consulte [as regras do estacionamento](kb/KB-ESTACIONAMENTO.md), [as decisões técnicas](kb/DECISOES-TECNICAS.md) e [o plano inicial](docs/superpowers/plans/2026-11-18-vagacerta-fundacao.md).
