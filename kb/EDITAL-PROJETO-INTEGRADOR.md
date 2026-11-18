# Edital do Projeto Integrador

**Desenvolvimento Web para IA + Banco de Dados · entrega até 04/12/2026 · equipe de três integrantes.**

A entrega é um sistema web em React com integração demonstrável entre interface, API e banco relacional, e uma funcionalidade real de IA. No VagaCerta, o fluxo central é **foto → sugestão da placa → confirmação → visita persistida → saída com cobrança**. O tema é livre, os dados da demonstração são fictícios e a infraestrutura deve estar disponível sem gasto obrigatório. [Regras do VagaCerta](KB-ESTACIONAMENTO.md)

## Requisitos verificáveis

- [ ] **Escopo e colaboração.** Definir o público, o problema, o fluxo principal e o papel da IA. Ter wireframe, diagrama das tabelas e divisão de trabalho. Registrar contribuições dos três integrantes em um repositório GitHub acessível aos docentes, com mensagens de commit sobre avanços reais em dias diferentes.
- [ ] **React.** Ter pelo menos três áreas ou fluxos funcionais, navegação, formulário validado e listagem de dados da API atualizada após mudanças. Mostrar estados de carregamento, vazio, sucesso e erro. Testar celular, desktop, teclado, foco visível, contraste e rótulos dos campos.
- [ ] **Persistência e integridade.** Ter pelo menos três tabelas com chave primária e duas relações por chaves estrangeiras. Usar tipos e restrições adequados. Demonstrar criação, consulta e atualização ou exclusão controlada. Confirmar que o registro continua no banco após recarregar e reabrir a aplicação.
- [ ] **API.** Integrar as rotas às telas, validar entradas no servidor e usar ORM ou SQL parametrizado. Tratar entrada inválida, recurso inexistente e falha de infraestrutura. Proteger ações que modificam registros e manter as credenciais no servidor.
- [ ] **Consultas e índice.** Documentar duas consultas executadas com dados de demonstração, uma com `JOIN` e outra com filtro, ordenação ou agregação. No VagaCerta, usar o detalhe da visita e a agregação do histórico por placa. Justificar um índice e registrar o `EXPLAIN` antes e depois. Em tabelas pequenas, o PostgreSQL pode manter a leitura sequencial. O relatório deve explicar o plano observado.
- [ ] **IA real.** Demonstrar uma chamada ao modelo, a entrada e a saída, a utilidade para o operador e os limites. Manter a chave no servidor. Explicar a revisão humana e mostrar o que a tela faz enquanto espera ou quando a cota acaba ou o provedor falha.
- [ ] **Produção.** Configurar as variáveis em Production no Vercel e refazer o deploy quando elas mudarem. Em aba anônima, abrir o link público e entrar com a conta de demonstração. Conferir a API, a gravação e a consulta após F5, a leitura pela IA, os estados de erro e a versão móvel. Executar `npm run build` ou verificação equivalente antes de submeter.

A ordem sugerida pelo edital é comprovar a persistência ponta a ponta, integrar a IA, publicar, reunir evidências e refinar a interface.

## Pacote de entrega

Enviar um repositório GitHub, o link de produção no Vercel e um relatório técnico conjunto. Os caminhos refletem a estrutura sugerida no edital.

| Entregável | Conteúdo esperado |
| --- | --- |
| `README.md` | Projeto, integrantes, público, problema, o que foi implementado, stack, arquitetura, instalação, banco, variáveis, uso, rotas, consultas, índice, limitações, link de produção e orientação para testar. |
| `.env.example` | Nomes das variáveis sem valores privados. Os arquivos locais com credenciais ficam fora do Git. |
| `sql/schema.sql` e `sql/seed.sql` | Esquema reproduzível a partir do SQL ou das migrações e dados fictícios para demonstração. |
| `docs/diagrama-banco.png` | Diagrama com entidades, chaves primárias e relações. O formato pode variar. |
| `docs/consultas.sql` | `JOIN`, consulta agregada, SQL do índice e comandos usados na comparação dos planos. |
| `docs/evidencias/` | Capturas E1 a E6 com legenda, procedimento e explicação do que cada uma comprova. |
| Relatório técnico | Arquitetura, diagrama, SQL, decisão sobre o índice, interpretação do `EXPLAIN`, papel da IA e evidências. |

## Evidências

| ID | Captura | O que explicar |
| --- | --- | --- |
| E1 | GitHub com pastas, README e commits de integrantes diferentes. | Divisão de tarefas e evolução do projeto. |
| E2 | Entrada registrada pela interface, visível após F5 e confirmada no banco. | Qual rota gravou a visita e em qual tabela o dado ficou. |
| E3 | Diagrama ou tabelas com FKs e resultado do `JOIN` de visitas, tarifas e unidades. | Por que as tabelas se relacionam e o que a consulta retorna. |
| E4 | SQL do índice do histórico e planos `EXPLAIN` antes e depois. | Por que o índice foi escolhido e o que o plano observado mostra. |
| E5 | Foto fictícia e sugestão real da placa na tela, com os segredos fora da captura. | Que dados foram enviados, como a chamada passa pelo servidor, o que a IA facilita e quando revisar. |
| E6 | Link do Vercel aberto, tela em largura de celular e estado de erro ou carregamento. | Como a equipe conferiu o funcionamento em produção. |

## Avaliação e apresentação

A divisão de referência por disciplina é **5,0 para projeto e código, 2,0 para relatório e 3,0 para defesa**. A distribuição final cabe aos docentes. Todos os integrantes precisam demonstrar e explicar uma parte técnica na defesa de **8 a 10 minutos**.

| Tempo sugerido | Demonstrar |
| --- | --- |
| 0:00–1:00 | Problema, público e objetivo. |
| 1:00–3:30 | Fluxo principal com interface, API e persistência. |
| 3:30–5:00 | Leitura real de placa, utilidade e limites. |
| 5:00–6:30 | Entidades, FKs, consultas, índice e `EXPLAIN`. |
| 6:30–8:00 | GitHub, Vercel, variáveis, segurança e evidências. |
| 8:00–10:00 | Perguntas e defesa técnica com participação dos três. |

Fonte conferida no checkout principal em `kb/EDITAL_PROJETO_INTEGRADOR_FRONTEND_BANCO_IA.html`, seções 01 e 05 a 09.
