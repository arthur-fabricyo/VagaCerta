# Roteiro de defesa — VagaCerta

Este roteiro é uma preparação; as respostas e demonstrações devem refletir apenas o que foi efetivamente verificado. O edital prevê três integrantes, mas foi informado que Arthur desenvolveu o projeto sozinho. Confirmar essa situação com os docentes.

## Apresentação de 8 a 10 minutos

**0:00–1:00 — Problema.** O VagaCerta apoia operadores de estacionamento no registro de veículos, na consulta ao pátio e na cobrança simulada. O objetivo é manter os registros organizados e facilitar a entrada com uma sugestão de placa por foto.

**1:00–3:30 — Fluxo.** Entrar no sistema, selecionar unidade e tarifa, registrar uma placa fictícia, localizar a visita e recarregar a página. Mostrar a saída e o histórico. A interface envia a requisição à API, que valida os dados e usa os serviços e repositórios para persistir no PostgreSQL.

**3:30–5:00 — IA.** Mostrar uma foto fictícia e solicitar leitura, se o serviço estiver disponível. A imagem passa pelo servidor para a Groq; a resposta é uma sugestão que o operador deve conferir ou corrigir. Se houver erro ou limite, mostrar a entrada manual. Não afirmar que uma leitura funcionou sem demonstrá-la.

**5:00–6:30 — Banco.** Explicar unidades, tarifas e visitas e suas chaves estrangeiras. Mostrar o diagrama e o JOIN em `docs/consultas.sql`. O índice do histórico usa unidade, placa e horário. Na amostra de quatro visitas, o PostgreSQL usou leitura sequencial antes e depois; isso não demonstra ganho de desempenho.

**6:30–8:00 — Entrega.** Mostrar repositório, variáveis sem segredos, relatório e site publicado. Demonstrar a tela móvel e um estado de carregamento ou erro, se disponíveis. Explicar que a cobrança é simulada.

**8:00–10:00 — Perguntas.** Reservar tempo para defesa e apresentar limitações e pendências com transparência.

## Perguntas de preparação

Estas são perguntas possíveis, não uma lista oficial dos docentes.

1. **Qual problema é resolvido?** Organização das visitas de estacionamento, consulta ao pátio e cálculo de cobrança simulada.
2. **Como os dados chegam ao banco?** React chama um Route Handler, que valida a requisição; o serviço aplica regras e o repositório acessa PostgreSQL.
3. **Como comprovar persistência?** Criar visita fictícia, atualizar a página e consultar o registro no banco; repetir em produção antes da apresentação.
4. **Quais são as relações?** Uma unidade possui tarifas e visitas; cada visita referencia unidade e tarifa. A chave composta protege a coerência entre tarifa e unidade.
5. **O que o JOIN mostra?** Dados de visita junto com sua unidade e tarifa. O SQL e o resultado local estão em `docs/consultas.sql` e `docs/evidencias/E3-E4-consultas.md`.
6. **Por que o índice?** Para apoiar a busca por unidade e placa e o intervalo/ordenação por horário. A amostra pequena manteve `Seq Scan`; não se deve alegar melhoria comprovada.
7. **Qual o papel da IA?** Sugerir a placa a partir de uma imagem; não decide sozinha o valor gravado. O operador precisa conferir e pode digitar manualmente.
8. **Onde está a chave da IA?** Em variável de ambiente no servidor, não no navegador nem no repositório.
9. **O que acontece em falha da IA?** O operador recebe a indicação de indisponibilidade ou limite e pode continuar manualmente.
10. **Como se protege a aplicação?** A sessão e a aprovação de operadores controlam acesso; o servidor valida entradas e usa credenciais por variáveis de ambiente. Não prometer segurança absoluta.
11. **Quais são as limitações?** Cobrança simulada; a leitura depende de qualidade da imagem e disponibilidade do provedor; validação e evidências de produção devem estar concluídas antes de alegar funcionamento completo.
12. **Quem participou?** Arthur informou desenvolvimento individual. O requisito de trio deve ser esclarecido com os docentes.

## Checklist antes da defesa

- [ ] Confirmar com os docentes a aceitação de trabalho individual.
- [ ] Abrir o site em aba anônima e entrar com a conta de demonstração, sem mostrar senha.
- [ ] Registrar visita fictícia, recarregar, confirmar persistência e testar saída e histórico.
- [ ] Configurar e testar a IA com uma foto fictícia; capturar a sugestão real sem expor segredos.
- [ ] Capturar GitHub, diagrama/JOIN, planos EXPLAIN e versão móvel em produção, com legendas.
- [ ] Verificar estados de erro e carregamento, teclado, foco e contraste.
- [ ] Rodar build e registrar os resultados finais, o link e as evidências no relatório.
- [ ] Ensaiar a apresentação com cronômetro e preparar alternativa manual para falhas da IA.
