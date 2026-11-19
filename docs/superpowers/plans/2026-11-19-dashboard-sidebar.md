# Plano de implementação do Dashboard e da sidebar

O operador aprovado abre o VagaCerta no Dashboard e vê a situação da unidade e os atalhos da operação. A sidebar dá acesso ao Dashboard, a Reservas, a Configurações e à conta. [Desenho aprovado](../specs/2026-11-19-dashboard-sidebar-design.md)

## 1. Preparar os componentes do shadcn/ui

- [ ] Configurar o registro do shadcn/ui para o Next.js e Tailwind CSS 4 usados no projeto. Adicionar o alias de importação definido em `tsconfig.json` e integrar os tokens dos componentes a `app/globals.css`, preservando os estilos das telas públicas.
- [ ] Adicionar `sidebar`, `dropdown-menu`, `avatar` e `chart` com o gerenciador pnpm. Revisar os componentes gerados, as dependências e o lockfile. Executar `pnpm typecheck` antes de integrar os componentes às páginas. [Sidebar](https://ui.shadcn.com/docs/components/sidebar) · [Chart](https://ui.shadcn.com/docs/components/chart)

## 2. Organizar as páginas protegidas

- [ ] Criar `app/(operator)/layout.tsx` com `exigirOperador`, `SidebarProvider`, sidebar, área principal e botão de abertura no celular. Mover as páginas de `/`, `/history`, `/visits/[id]` e `/usuarios` para o grupo e ajustar os imports. Manter a autorização em pontos de leitura sensível e nos Route Handlers, inclusive para acessos diretos. [Layouts do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [ ] Criar `app/(operator)/reservations/page.tsx` com uma mensagem informativa. Criar `app/(operator)/settings/page.tsx` com o fluxo de Unidades e tarifas e link para `/usuarios`. Extrair do `OperationsDashboard` o seletor e a lógica de carregamento compartilhados com Configurações, incluindo o fluxo de primeira unidade e a seleção após cadastro.
- [ ] Indicar a página ativa pelo caminho, associando Histórico e detalhe ao Dashboard e Usuários a Configurações. Exibir iniciais e nome no rodapé. Integrar a saída atual ao menu, com foco e acionamento por teclado. Conferir navegação e fechamento da sidebar no celular.
- [ ] Preservar os links existentes de detalhe, Histórico e `/?unitId=…&section=yard`. Usar `/?unitId=…&section=entry` para abrir Entrada. Levar a unidade selecionada ao navegar entre os atalhos da operação e ao abrir Configurações a partir do formulário de entrada.

## 3. Implementar a leitura dos indicadores

- [ ] Criar `GET /api/dashboard?unitId=<uuid>` em `app/api/dashboard/route.ts`. Reaproveitar a verificação de operador da API operacional. Validar um único `unitId` em formato UUID e mapear entrada inválida para `400`, unidade inexistente para `404` e restrições de acesso para `401` ou `403`.
- [ ] Criar `lib/dashboard/dashboard-service.ts` e `lib/dashboard/dashboard-repository.ts`. O serviço recebe o repositório por construtor e fornece um instante de referência único por consulta. O repositório obtém o fuso da unidade, calcula os limites UTC a partir das duas meias-noites locais consecutivas e agrega no PostgreSQL usando parâmetros e uma única instrução SQL. Aplicar o intervalo semiaberto `[início, fim)` e agrupar pelos rótulos da hora local, somando eventos de horas repetidas em transições de horário. Calcular pátio pelo estado aberto, inclusive para visitas iniciadas antes de hoje.
- [ ] Retornar `unitId`, `localDate`, `timeZone`, `vehiclesOnSite`, `entriesToday`, `exitsToday` e `hourly` com `hour`, `entries` e `exits`. Preencher horas ausentes com zero e calcular os totais do dia usando as mesmas contagens da série. Usar os estados persistidos `aberta`, `encerrada` e `cancelada` no repositório. A consulta usa o esquema atual.

## 4. Integrar o Dashboard

- [ ] Exibir “Olá, {nome}!”, o seletor de unidade e os três atalhos em `/` quando nenhuma seção de operação estiver selecionada. Usar o ID válido informado na URL ou a primeira unidade da lista. Renderizar apenas o formulário de Entrada ou o Pátio quando a seção correspondente estiver selecionada.
- [ ] Carregar os indicadores somente na visão inicial e repetir a leitura após a troca de unidade ou retorno da operação. Cancelar a consulta anterior ou ignorar sua resposta quando a seleção mudar. Exibir carregamento, valores zerados para dia sem movimento, erro com nova tentativa e orientação para cadastrar a primeira unidade.
- [ ] Exibir os três indicadores em cartões e **Movimento de hoje** em barras agrupadas com duas séries. Usar a camada de acessibilidade do gráfico, legenda e tooltip em português. Conferir contraste e leitura numa tela estreita.

## 5. Verificar a entrega

- [ ] Cobrir a API com PostgreSQL de teste e dados controlados. Verificar resposta para unidade vazia, isolamento entre duas unidades, visita aberta desde ontem, entrada e saída no mesmo dia, saída hoje com entrada ontem, cancelamento e eventos exatamente no início e no fim do intervalo. Usar unidades com fusos distintos e confirmar que os totais dos cartões batem com a série.
- [ ] Executar `pnpm typecheck`, `pnpm test` e `pnpm build`. Com a aplicação local e um banco de teste configurados, executar `pnpm test:acesso` e `pnpm test:operations`.
- [ ] Em desktop e celular, abrir as páginas por link direto com conta aprovada, conta pendente e sessão ausente. Com acesso aprovado, testar troca de unidade, os três atalhos, retorno do detalhe ao pátio, atualização do Dashboard após uma entrada e uma saída, cadastro da primeira unidade, abertura do menu da conta e saída. Confirmar que o Dashboard informa falhas de carregamento e permite tentar novamente.
