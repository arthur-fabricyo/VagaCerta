# VagaCerta — plano de implementação do acesso

> Execução incremental com testes HTTP contra Next.js e PostgreSQL.

**Objetivo** — disponibilizar login, cadastro pendente, aprovação e recusa, com a proteção das páginas e APIs da operação.

**Arquitetura** — Better Auth com adapter Prisma e uma verificação de sessão e aprovação compartilhada no servidor.

**Stack** — Next.js, Better Auth, Prisma 7 e PostgreSQL.

**Design** — [Login, cadastro e aprovação](../specs/2026-11-18-vagacerta-acesso-design.md).

## Implementação

- [x] Criar o teste HTTP `tests/integration/acesso.mjs`. Confirmar a resposta `404` para `GET /api/usuarios` no build anterior à implementação.
- [x] Montar o Better Auth em `app/api/auth/[...all]/route.ts` e declarar o campo `aprovado` como controlado pelo servidor. Implementar `consultarAcesso(headers)` e `exigirOperador()` em `lib/acesso.ts`. Ler o estado atual da sessão a cada verificação protegida.
- [x] Criar `/entrar`, `/cadastro`, `/aguardando-aprovacao`, proteger a página inicial e criar `/usuarios`. Expor `GET /api/usuarios` e `PATCH /api/usuarios/[id]` com validação de decisão e origem. Condicionar mudanças ao cadastro continuar pendente.
- [x] Criar `prisma/seed.mjs` e o comando `pnpm db:seed`. Gravar a conta e a credencial do Better Auth de forma atômica, preservar operador aprovado existente e falhar se o e-mail já pertence a uma conta pendente.
- [ ] Aplicar a migração em um PostgreSQL descartável, executar o seed e iniciar o build de produção. Rodar a suíte HTTP, a suíte unitária, a checagem de tipos e o build.

## Casos de revisão

- Sessão ausente, pendente e aprovada recebem respostas distintas nas páginas e APIs.
- Cadastro público não permite escolher o valor de `aprovado`.
- Sessão pendente recebe acesso depois da aprovação sem novo login e perde acesso após recusa.
- Aprovação e recusa concorrentes produzem uma única mudança.
- Requisição de outra origem não altera cadastros.
- Seed repetido preserva a credencial válida e não promove um usuário pendente por coincidência de e-mail.
