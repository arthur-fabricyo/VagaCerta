# Dashboard diário e navegação do VagaCerta

## Objetivo

Receber o operador aprovado com uma visão rápida do dia e acesso direto às tarefas de estacionamento. Organizar a aplicação em páginas que possam ser abertas por link direto.

## Abordagens

- **Páginas com layout compartilhado.** Opção aprovada. A sidebar conecta rotas próprias e indica a seção ativa. Exige reorganizar os componentes e manter a compatibilidade dos links atuais.
- **Seções na página inicial.** Aproveitaria a navegação local existente, com menos mudanças iniciais. Exigiria sincronizar a seleção das seções com a URL e manter suas responsabilidades na mesma página.

## Navegação e conta

- Usar a sidebar do shadcn/ui nas páginas autenticadas de operação, histórico, detalhes de visita e configurações. No celular, abrir pelo botão de navegação. Exibir a seção ativa e disponibilizar os controles pelo teclado.
- Exibir **Dashboard** em `/`, **Reservas** em `/reservations` e **Configurações** em `/settings`. Em Configurações, reaproveitar Unidades e tarifas e adicionar o link para a tela existente de Usuários em `/usuarios`.
- No rodapé da sidebar, mostrar as iniciais e o nome do operador autenticado, com a ação **Sair** no menu. Reaproveitar a ação de saída atual.
- Em Reservas, apresentar um estado informativo de recurso futuro. A criação de reservas fica para outra etapa.
- Preservar as verificações de acesso, links de histórico e detalhes de visita, e o retorno ao pátio por `/?unitId=…&section=yard`. Os atalhos de entrada e pátio podem usar a seleção de seção na própria rota do Dashboard, com a unidade na URL ao navegar. Os formulários existentes permanecem disponíveis.

## Dashboard

- Abrir com **Olá, {nome}!**, seletor de unidade e os atalhos **Registrar entrada**, **Ver pátio** e **Consultar histórico**. Usar a unidade da URL quando válida e a primeira unidade disponível como padrão.
- Mostrar **No pátio agora** (visitas abertas), **Entradas hoje** (visitas abertas ou encerradas iniciadas hoje) e **Saídas hoje** (visitas encerradas com saída hoje, inclusive as que começaram em outro dia). Excluir cancelamentos. Usar o fuso cadastrado na unidade para determinar o dia e as horas.
- Mostrar **Movimento de hoje**, um gráfico de barras do shadcn/ui com entradas e saídas agrupadas pela hora local. Os cartões e o gráfico usam os mesmos critérios e a mesma unidade. Usar dados reais das visitas. Capacidade percentual e indicadores financeiros ficam fora desta entrega.
- Carregar os indicadores ao abrir o Dashboard, ao voltar a ele após operar e ao trocar de unidade. Apresentar zero para um dia sem movimento, opção de tentar novamente em caso de erro e orientação para cadastrar uma unidade quando nenhuma estiver disponível.

## Implementação e verificação

Organizar a leitura dos indicadores em controller, service e repository. O repository consulta os registros por unidade e retorna agregados, sem transferir visitas individuais ao navegador. Manter identificadores técnicos novos em inglês e a interface em português. O detalhamento das consultas e dos componentes fica a cargo da implementação.

Verificar troca de unidade, fuso e virada do dia, cancelamentos, estado sem movimento, acesso autenticado, navegação móvel e retorno de um detalhe de visita ao pátio.
