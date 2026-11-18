# Decisões técnicas do VagaCerta

Registro da especificação de 18/11/2026 e das decisões confirmadas na conversa do projeto. O comportamento do MVP está em [Regras do estacionamento](KB-ESTACIONAMENTO.md).

| Área | Decisão |
| --- | --- |
| Aplicação | Next.js com App Router, React e TypeScript. Os Route Handlers ligam a interface ao banco e à IA em um único deploy no Vercel. |
| Banco | PostgreSQL padrão hospedado no Neon em produção. A integração usa a string de conexão do Postgres e pode ser levada a outro provedor por configuração. |
| ORM | Prisma na linha 7.x com `@prisma/adapter-pg` e `pg`. |
| Autenticação | Better Auth com e-mail e senha, adapter Prisma e aprovação interna. |
| IA | Vercel AI SDK com `ai` no servidor, `@ai-sdk/google` como provedor Gemini e `@ai-sdk/react` na interface. O pacote `@google/genai` foi recusado. |
| Foto | Por enquanto, as fotos ficam no PostgreSQL em `bytea`, com o acesso isolado para facilitar uma futura migração. |
| Outras bibliotecas aprovadas | Tailwind CSS para estilos, Vitest para testes, Zod para validação e `dotenv` para o CLI do Prisma. |

Consulte o responsável antes de instalar bibliotecas ou tomar decisões de arquitetura. As aprovações já dadas estão registradas acima.

## PostgreSQL e Prisma

- Use `provider = "postgresql"` no schema e `DATABASE_URL` para a conexão. Configure a URL do CLI no arquivo de configuração do Prisma com `defineConfig` e carregue o ambiente local com `dotenv`. O arquivo previsto é `prisma.config.ts`. A partir da versão 7.10, se o CLI gerar `prisma7.config.ts`, use o arquivo gerado. [Documentação do Prisma 7 para PostgreSQL](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql)
- Gere o cliente em `generated/prisma`. No servidor, use `PrismaPg` com a `DATABASE_URL` e entregue o adapter ao `PrismaClient`. Mantenha o CLI e o client na linha 7.x. [Quickstart do Prisma 7 com PostgreSQL](https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql)
- As tabelas de domínio são `unidades`, `tarifas` e `visitas`. A tarifa pertence a uma unidade. A visita referencia a unidade, a versão da tarifa e os usuários da entrada e da saída.
- Garanta no banco uma visita aberta por placa e unidade com um índice único parcial sobre `(unidade_id, placa)` para `status = 'aberta'`. O índice a analisar com `EXPLAIN` é `(unidade_id, placa, entrada_em)`, voltado ao histórico.
- Use o Prisma para as operações de cadastro e SQL parametrizado para a agregação do histórico. A consulta com `JOIN` relaciona visitas, tarifas e unidades no detalhe. A agregação conta chegadas por dia da semana e hora no fuso da unidade.
- As migrações em `prisma/migrations/` permitem reproduzir o banco. O pacote de entrega inclui o esquema SQL e dados fictícios. [Entregáveis do edital](EDITAL-PROJETO-INTEGRADOR.md#pacote-de-entrega)

## IA e fotos

- A validação no servidor aceita o formato brasileiro antigo e o Mercosul após normalizar a placa. O padrão é `^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$`.
- A rota protegida `POST /api/ia/placa` recebe a imagem e chama o Gemini no servidor. A resposta estruturada usa Zod e descreve placa, confiança e observação. A chave fica em `GOOGLE_GENERATIVE_AI_API_KEY`. O identificador em `AI_MODEL` deve apontar para um modelo Gemini Flash que aceite imagens e esteja disponível no plano gratuito na implementação. [Provedor Google no AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/google)
- A tela usa `useObject`. A especificação cita `generateText` com `Output.object`. Ao implementar, confira o formato da resposta da rota com o hook. O exemplo do SDK para receber o objeto em partes usa `streamText` com `Output.object` e uma resposta de texto. [Geração de objetos no AI SDK](https://ai-sdk.dev/docs/ai-sdk-ui/object-generation)
- A foto pode vir da câmera ou de um upload. O desenho prevê compressão no navegador, rejeição de arquivos acima de 1 MB na rota de IA e leitura da foto da visita pela rota autenticada `GET /api/visitas/[id]/foto`.

## Sessão, aprovação e ambiente

- A conta nasce pendente. As rotas da operação verificam a sessão do Better Auth e o estado da conta no servidor. Sem sessão, devolvem `401`. Com sessão pendente, devolvem `403`. As rotas públicas de autenticação dão acesso ao login e ao cadastro.
- O seed cria o primeiro operador já aprovado a partir de `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. Esses nomes identificam a conta inicial. Qualquer operador aprovado pode aprovar cadastros.
- Declare em `.env.example` os nomes `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_MODEL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. Os valores ficam no ambiente local privado e nas variáveis do deploy. Garanta que o CLI leia o arquivo de ambiente escolhido para migrações e seed.
- Na implementação ficam o identificador do modelo, o prompt, o schema final da resposta e os detalhes de integração do Better Auth com Next.js e Prisma 7.

Fonte do projeto consultada no checkout principal em `docs/superpowers/specs/2026-11-18-vagacerta-design.md`.
