# VagaCerta pronto para entrega

## Objetivo

Entregar até 4 de dezembro de 2026 o VagaCerta publicado e demonstrável. O operador registra uma visita a partir de uma foto ou de uma placa digitada, encontra o veículo no pátio, registra a saída com cobrança e consulta o histórico. A demonstração usa dados fictícios e comprova o percurso entre React, API, PostgreSQL e Grok.

## Abordagens

- **Escolhida.** Fechar primeiro a operação manual persistente e validar cedo, em paralelo, uma chamada de teste ao Grok. A sequência permite verificar as regras de cobrança e concorrência com dados reais no PostgreSQL enquanto a equipe confirma o acesso ao provedor.
- **Considerada.** Montar primeiro uma demonstração publicada com unidade e tarifa pré-configuradas, foto, saída e histórico. A sequência mostraria a integração externa mais cedo e deixaria a gestão de unidades e tarifas e os casos de exceção para depois.

## Operação manual

A pessoa aprovada escolhe ou cadastra uma unidade com nome e fuso, e publica uma versão de tarifa com preço, modo de cobrança, duração do bloco quando aplicável e regra de tolerância. A entrada exige uma tarifa vigente e uma placa brasileira válida e confirmada. O servidor normaliza a placa e registra o instante, operador, observação opcional e versão vigente da tarifa. Uma entrada duplicada apresenta a visita aberta existente, inclusive em requisições concorrentes.

O pátio lista visitas abertas da unidade, com busca por placa, horário de entrada, tempo decorrido e miniatura quando disponível. O detalhe permite cancelar a visita aberta ou registrar a saída. O servidor aplica o cálculo existente à tarifa fixada na entrada e grava horário, operador, duração, tempo cobrável, blocos quando aplicáveis e total. O encerramento representa quitação simulada. Uma saída repetida apresenta o resultado persistido. Cancelamento e saída concorrem pela mesma transição de estado, com apenas uma mudança vencedora.

Os Route Handlers validam a sessão aprovada e os dados, chamam serviços e convertem os resultados em respostas HTTP. Serviços coordenam as regras e repositórios concentram Prisma e SQL. Código novo usa nomes técnicos em inglês, com interface em português. Preservar os caminhos existentes de acesso e o banco já migrado.

## Foto e Grok

Na entrada, o operador pode usar a câmera ou enviar uma imagem. A aplicação comprime a imagem no navegador e valida no servidor o conteúdo JPEG ou PNG e o limite de 1 MB tanto na leitura quanto na gravação. O servidor guarda a foto validada na visita em PostgreSQL, com consulta protegida e acesso à persistência isolado.

O servidor usa o Vercel AI SDK para chamar um modelo Grok com visão, configurado em `AI_MODEL`, com `XAI_API_KEY` disponível apenas no servidor. A resposta validada descreve a placa sugerida, a confiança e uma observação quando houver. O sistema trata conteúdo da imagem como dados. A sugestão é editável e a placa persistida exige confirmação. Durante o processamento a interface indica carregamento. Foto ilegível, falha do provedor ou limite de uso permitem continuar digitando a placa.

Validar cedo uma chamada real com foto fictícia, incluindo suporte do modelo à imagem e à resposta estruturada, latência e acesso compatível com o requisito acadêmico de infraestrutura sem gasto obrigatório. Se a conta disponível exigir pagamento, confirmar com a equipe e os docentes uma forma de acesso compatível antes de declarar a entrega pronta. Usar Grok no desenho, sem troca automática de provedor. A implementação fixa o modelo inicial e publica as variáveis necessárias na documentação de ambiente.

## Histórico e evidências

Consultar por unidade, placa completa normalizada e período opcional. Considerar visitas encerradas e mostrar o intervalo consultado, total, última entrada e os dias da semana e faixas de hora mais frequentes no fuso da unidade, incluindo empates. A ausência de datas consulta todo o histórico da unidade. A consulta usa SQL parametrizado.

Publicar no Vercel com Neon e validar em aba anônima com conta de demonstração entregue em privado. Verificar o percurso completo, persistência após recarregar, acesso por teclado, foco, contraste, rótulos, desktop, celular e estados de carregamento, vazio, sucesso e erro. Reproduzir também no PostgreSQL entradas concorrentes, mudanças de tarifa entre entrada e saída e saídas repetidas.

O pacote inclui README, exemplo de variáveis, esquema e dados fictícios reproduzíveis, wireframe, diagrama do banco, `JOIN` do detalhe, agregação do histórico, comparação `EXPLAIN` com e sem o índice, capturas E1 a E6, link de produção e relatório técnico. Os três integrantes registram contribuições próprias e dividem a defesa de 8 a 10 minutos. Conferir os itens no [edital](../../../kb/EDITAL-PROJETO-INTEGRADOR.md).

Os responsáveis pelo acesso à xAI, pela configuração do Vercel e do Neon e pela coordenação das contribuições da equipe ficam a confirmar. Essas definições são necessárias para a demonstração real, a publicação e as evidências de colaboração.

## Limites e decisões da implementação

O escopo segue as [regras do MVP](../../../kb/KB-ESTACIONAMENTO.md). Pagamento separado, perfis distintos, correções auditadas, retenção de fotos e perguntas em linguagem natural ficam fora da entrega. A implementação define os nomes das novas rotas, o desenho visual, a estratégia de concorrência e o formato do contrato da IA. Preservar os fluxos já entregues de login, cadastro e aprovação.
