# Evidências do VagaCerta

- **E2, teste local.** Após registrar a placa fictícia `VCF6261`, a tela do pátio ainda exibiu a mesma visita após um recarregamento completo. A consulta ao PostgreSQL encontrou a visita `0b54aa11-71af-4e13-8cc2-7b57a62a9baa` após registrar a saída. [Captura do pátio](E2-visita-apos-recarregar.png)
- **E3 e E4, teste local.** O `JOIN` retornou visita, unidade e tarifa. Com quatro visitas, `EXPLAIN` usou leitura sequencial e ordenação antes e depois de criar o índice. [Saída registrada](E3-E4-consultas.md) · [Relatório](../relatorio-tecnico.md)
- **Celular, teste local.** A operação foi conferida no Edge a 390 px, com foco de teclado visível e sem rolagem horizontal. [Captura em celular](operacao-celular-teste-local.png)

Ainda é preciso reunir as contribuições dos três integrantes (E1), capturar uma resposta real do IA (E5) e repetir a verificação móvel no link público (E6). O edital pede capturas para E3 e E4. A saída em texto registra os resultados para reproduzir essas capturas.
