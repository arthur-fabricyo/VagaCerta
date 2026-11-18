# VagaCerta

Sistema web de operação de estacionamento para o Projeto Integrador de Desenvolvimento Web, IA e Banco de Dados.

## Desenvolvimento local

Requer npm e Node.js 22 a partir da versão 22.12, ou Node.js 24 em diante.

```bash
npm ci
npm run dev
```

A aplicação abre em `http://localhost:3000`. A etapa inicial inclui a página do projeto, as regras de placa e cobrança e a migração inicial do PostgreSQL.

## Banco de dados

Copie `.env.example` para `.env.local` e preencha `DATABASE_URL` com a conexão de um banco PostgreSQL de desenvolvimento.

```bash
npm run db:generate
npm run db:migrate
```

O teste de integridade usa um banco de teste com a migração aplicada e desfaz os dados que cria.

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres/integridade.sql
```

## Verificação

```bash
npm test
npm run typecheck
npm run build
```

Consulte [as regras do estacionamento](kb/KB-ESTACIONAMENTO.md), [as decisões técnicas](kb/DECISOES-TECNICAS.md) e [o plano inicial](docs/superpowers/plans/2026-11-18-vagacerta-fundacao.md).
