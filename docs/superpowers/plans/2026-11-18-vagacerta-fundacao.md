# VagaCerta — plano de implementação da fundação

> Execução nesta sessão, em etapas verificáveis com teste antes das regras de negócio.

**Objetivo** — iniciar o MVP com um projeto Next.js executável e as regras reutilizáveis da placa e da cobrança.

**Stack** — Next.js com App Router, React, TypeScript, Tailwind CSS, Zod e Vitest.

**Especificação** — [Regras do estacionamento](../../../kb/KB-ESTACIONAMENTO.md) e [decisões técnicas](../../../kb/DECISOES-TECNICAS.md).

## Primeira etapa

- [x] Criar `tests/placa.test.ts` e `tests/cobranca.test.ts`. Rodar `npm test` e verificar que os módulos de domínio ainda não existem.
- [x] Implementar `placaSchema` em `lib/placa.ts`, aceitando ` abc-1234 ` e `abc 1d23`, rejeitando formato, comprimento e caracteres inválidos.
- [x] Implementar `calcularCobranca(entrada: Date, saida: Date, tarifa: TarifaCobranca): ResultadoCobranca` em `lib/cobranca.ts`. Conferir virada de dia, modos proporcional e por blocos, tolerância inclusiva, desconto, meio centavo e saída anterior à entrada.
- [x] Criar `app/layout.tsx`, `app/page.tsx` e `app/globals.css` com a página inicial do projeto e idioma `pt-BR`. Guardar os nomes de configuração da especificação em `.env.example`.
- [x] Preparar o Prisma 7 e aplicar a migração inicial em PostgreSQL 17. Conferir com `tests/postgres/integridade.sql` que a mesma placa pode ter histórico e visitas em unidades diferentes, mas apenas uma visita aberta na mesma unidade.
- [x] Rodar `npm test`, `npm run typecheck` e `npm run build`. Abrir a página inicial pela aplicação compilada e conferir HTTP 200.

## Etapas seguintes do MVP

1. Integrar o seed e Better Auth, confirmando a estratégia de proteção de páginas antes de implementá-la. Testar sessões anônimas, pendentes e aprovadas.
2. Entregar o fluxo manual persistente de unidade, tarifa, entrada, pátio, detalhe, cancelamento e saída. Testar entradas concorrentes e saídas repetidas no PostgreSQL, inclusive quando a tarifa mudar durante a visita.
3. Adicionar foto e leitura real via Grok e AI SDK. Mostrar falhas de leitura e de cota e manter a opção de entrada manual. Validar a foto também ao gravar a visita.
4. Entregar histórico por placa e fuso da unidade, preservando empates e excluindo visitas canceladas. Preparar consultas, esquema, dados de demonstração e comparação do índice com `EXPLAIN`.
5. Verificar a aplicação publicada no Vercel com Neon e reunir as evidências do edital, incluindo celular, teclado, consulta após recarregar e chamada real de IA.
