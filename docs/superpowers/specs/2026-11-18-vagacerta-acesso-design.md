# Login, cadastro e aprovação no VagaCerta

## Objetivo

Permitir que uma pessoa se cadastre com nome, e-mail e senha e que um operador aprovado libere seu acesso. A primeira conta aprovada é criada pelo seed. Todos os operadores aprovados têm as mesmas permissões.

## Abordagens

- **Verificação centralizada no servidor, proposta.** Páginas e APIs protegidas consultam a mesma função para validar a sessão do Better Auth e a aprovação registrada no banco. Cada ponto de entrada decide como responder.
- **Verificação no servidor com proxy.** A mesma verificação protege os dados. Um proxy também antecipa o redirecionamento ao login quando falta o cookie, com uma configuração adicional de rotas.

A primeira abordagem cobre os três estados de acesso previstos para o MVP e concentra a regra de autorização em um ponto.

## Comportamento

- **Entrar e criar conta.** Better Auth com e-mail e senha, adapter Prisma e as tabelas existentes. O cadastro começa pendente. O campo de aprovação é controlado pelo servidor.
- **Aguardar aprovação.** Uma conta pendente pode ver a mensagem de espera, conferir novamente o acesso e sair da sessão. Após aprovação, a próxima verificação libera a operação.
- **Operação.** Páginas protegidas encaminham visitantes anônimos ao login e contas pendentes à tela de espera. APIs protegidas retornam `401` sem sessão e `403` para contas pendentes.
- **Usuários.** Operadores aprovados veem cadastros pendentes e aprovados. Aprovar libera o acesso. Recusar remove um cadastro ainda pendente. Duas decisões simultâneas sobre a mesma conta só podem produzir uma mudança de estado. As alterações exigem sessão aprovada e requisição da própria aplicação.
- **Primeiro operador.** O seed usa `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. A criação da conta aprovada e da credencial é atômica. Reexecutar o seed preserva o operador já criado. Um cadastro pendente com o mesmo e-mail exige resolução explícita antes do seed.

```text
Entrar / Criar conta → Cadastro aguardando aprovação
                       Conferir acesso · Sair

Usuários → Pendentes  Nome · E-mail · Aprovar · Recusar
           Aprovados  Nome · E-mail
```

## Aceitação

Verificar com PostgreSQL real que uma pessoa consegue se cadastrar, permanecer pendente, entrar após aprovação e perder a sessão após recusa. Testar acesso anônimo e pendente às rotas protegidas, tentativa de enviar aprovação no próprio cadastro, reexecução do seed e decisões concorrentes.

Fonte das regras de negócio em [Cadastro e aprovação](../../../kb/KB-ESTACIONAMENTO.md#8-cadastro-e-aprovação) e dos requisitos técnicos em [Sessão, aprovação e ambiente](../../../kb/DECISOES-TECNICAS.md#sessão-aprovação-e-ambiente).
