# Relatório técnico do VagaCerta

O VagaCerta atende operadores de estacionamento que precisam registrar visitas, calcular cobrança pelo tempo e consultar os padrões de chegada de uma placa. O operador confirma a sugestão da IA antes de gravar a entrada. A saída representa uma quitação simulada.

## Arquitetura e dados

O Next.js reúne a interface React e os controladores HTTP. O Better Auth controla a sessão e a aprovação da conta. Os serviços aplicam as regras de negócio, enquanto os repositórios acessam PostgreSQL via Prisma ou SQL parametrizado. A versão da tarifa fica vinculada à visita, e o índice único parcial protege contra duplicidades de entradas abertas.

Use o [diagrama](diagrama-banco.md) para explicar as chaves estrangeiras e o [wireframe](wireframe.md) para mostrar a navegação. Os arquivos de [esquema](../sql/schema.sql) e [seed](../sql/seed.sql) reproduzem o banco e a amostra fictícia.

## Consultas e índice

Em PostgreSQL 18, o `JOIN` de exemplo devolveu a visita `ABC1D23` da unidade Centro, com tarifa proporcional de 800 centavos por hora e total de 800 centavos. A agregação devolveu duas chegadas às segundas entre 8h e 9h e duas entre 14h e 15h no fuso `America/Sao_Paulo`. [Consultas reproduzíveis](consultas.sql)

O índice põe primeiro as igualdades de unidade e placa e depois o horário, usado para intervalo e ordenação. Com quatro visitas na amostra, os dois planos usaram `Seq Scan` e `Sort`, com uma página de dados lida do cache em cada execução. O custo estimado do `Sort` foi `1.11..1.12` com e sem índice. A amostra pequena explica a leitura sequencial. Os tempos de uma única execução dessa amostra não permitem medir ganho de desempenho.

## IA e demonstração

O servidor valida a imagem e envia a foto ao Grok. O operador confere ou corrige a sugestão e pode registrar a entrada manualmente em caso de imagem ilegível, erro ou limite do provedor. A demonstração deve usar uma foto de placa fictícia e mostrar a própria imagem, a sugestão e a confirmação, com as credenciais protegidas no servidor.

## Evidências da entrega

| ID | Evidência e procedimento |
| --- | --- |
| E1 | Capturar no GitHub o README, as pastas e os commits dos três integrantes. Registrar os nomes e a divisão real de trabalho. |
| E2 | Registrar uma placa fictícia, recarregar o pátio e conferir a mesma visita no PostgreSQL. |
| E3 | Mostrar o diagrama e o resultado do `JOIN` em `consultas.sql`. |
| E4 | Capturar os planos antes e depois do índice e explicar a leitura sequencial observada. |
| E5 | Capturar uma sugestão real do Grok em uma foto fictícia e a revisão pelo operador. |
| E6 | Abrir o link de produção em aba anônima e capturar a tela em largura de celular e um estado de erro ou carregamento. |

Para a defesa de 8 a 10 minutos, distribuir entre os três integrantes o fluxo principal, a IA e as consultas com o deploy. Registrar o link e as capturas depois da validação em produção. [Edital](../kb/EDITAL-PROJETO-INTEGRADOR.md)
