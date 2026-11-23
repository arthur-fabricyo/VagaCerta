# Plano de implementação da entrega do VagaCerta

**Entrega até 4 de dezembro de 2026.** O resultado é a aplicação publicada, com o fluxo manual completo, leitura real de placa com Grok, histórico e o pacote de evidências do edital. [Desenho aprovado](../specs/2026-11-19-vagacerta-entrega-design.md)

## 1. Validar as dependências externas em paralelo

- [ ] Confirmar quem tem acesso aos projetos da xAI, Vercel e Neon, e quem coordena a divisão do trabalho e da defesa entre os três integrantes.
- [ ] Executar uma chamada de teste com foto fictícia e um modelo Grok com visão. Confirmar a resposta estruturada, a disponibilidade do modelo, o tempo de resposta e o acesso sem gasto obrigatório para a equipe. Se o acesso depender de pagamento, levar a questão à equipe e aos docentes enquanto o fluxo manual avança.
- [ ] Conferir a branch de produção `prod` no Vercel e preparar os ambientes para uma validação publicada. Manter credenciais em variáveis privadas e usar `develop` como destino dos PRs de trabalho.

## 2. Fechar a operação manual

- [ ] Desenhar a navegação e o wireframe da seleção de unidade, tarifas, entrada, pátio, detalhe e histórico. Reutilizar a sessão aprovada do Better Auth. Usar identificadores técnicos em inglês, interface em português e camada Controller → Service → Repository para o código novo. Preservar os caminhos de autenticação e o esquema persistido.
- [ ] Implementar cadastro e seleção de unidade e publicação de versões de tarifa. Validar fuso horário, preço, modo, blocos e tolerância. A alteração publica uma nova versão. Exibir orientação quando uma unidade estiver sem tarifa vigente.
- [ ] Registrar entrada pelo formulário com placa confirmada, unidade e observação opcional. Reutilizar a normalização existente e gravar horário do servidor, operador e tarifa vigente. Usar a restrição de visita aberta do PostgreSQL para resolver concorrência e retornar a visita existente em caso de duplicidade.
- [ ] Listar no pátio as visitas abertas da unidade e permitir busca por placa. No detalhe, exibir unidade, tarifa e informações da visita. Implementar cancelamento e saída como transições protegidas da visita aberta. Reutilizar o cálculo de cobrança e gravar o resultado. Uma saída repetida retorna os valores gravados.
- [ ] Verificar com PostgreSQL o percurso pela interface antes de integrar a foto. Cobrir ausência de sessão, conta pendente, placa inválida, unidade sem tarifa, duplicidade concorrente, cancelamento concorrente com saída, mudança de tarifa durante a visita, saída repetida e persistência após recarregar.

## 3. Integrar foto e Grok

- [ ] Integrar o provedor xAI ao Vercel AI SDK. Atualizar `.env.example` e as decisões técnicas para usar `XAI_API_KEY` e `AI_MODEL`. Validar a saída estruturada com placa, confiança e observação. Tratar o conteúdo da imagem como dado e mapear falhas e limite do provedor para mensagens da interface.
- [ ] Adicionar captura por câmera e upload à entrada, com compressão no navegador, carregamento, correção da sugestão e digitação manual. Validar formatos JPEG/PNG e limite de 1 MB no servidor tanto na leitura quanto no registro. Persistir a foto em PostgreSQL, proteger a consulta e exibir miniatura ou indicação de ausência.
- [ ] Testar leitura real com foto fictícia, ausência de placa legível, falha ou cota, foto inválida e tentativa de leitura sem acesso aprovado. Confirmar que só a placa revisada pelo operador se torna a placa oficial.

## 4. Entregar histórico e consultas

- [ ] Implementar consulta parametrizada e tela de histórico por unidade, placa completa e período opcional. Calcular limites de datas no fuso da unidade, agregar visitas encerradas por dia da semana e hora local e preservar empates. Exibir período, total, última entrada e estados vazio e com uma visita.
- [ ] Preparar dados fictícios reproduzíveis, diagrama do banco e `docs/consultas.sql` com o `JOIN` do detalhe, agregação e comparação `EXPLAIN` com e sem o índice de histórico em banco descartável. Registrar o plano observado e explicar a escolha do índice.

## 5. Publicar e comprovar a entrega

- [ ] Executar `pnpm test`, `pnpm typecheck`, `pnpm build` e a suíte HTTP de acesso e operação com PostgreSQL. Conferir navegação, formulários, foco, teclado, contraste e estados nas larguras de celular e desktop.
- [ ] Aplicar as migrações no Neon, preparar a conta e os dados de demonstração e publicar via PR de `develop` para `prod`. Em aba anônima, conferir login, gravação, consulta após recarregar, leitura real pelo Grok e experiência móvel. Entregar a credencial de demonstração em privado.
- [ ] Completar o README, wireframe, diagrama, esquema e seed SQL, consultas, capturas E1 a E6 com legendas, link de produção e relatório técnico conjunto. Conferir acesso dos docentes ao repositório, créditos dos três integrantes e roteiro da defesa de 8 a 10 minutos. [Lista do edital](../../../kb/EDITAL-PROJETO-INTEGRADOR.md)
