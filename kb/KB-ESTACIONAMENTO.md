# VagaCerta

O VagaCerta ajuda operadores de estacionamento a registrar entradas e saídas. Na entrada, a IA lê a foto e sugere a placa para conferência. Na saída, o sistema calcula a permanência e a cobrança. O histórico mostra os dias e horários de chegada mais frequentes por placa.

- Stack, integração com o banco e a IA, e acesso inicial em [Decisões técnicas](DECISOES-TECNICAS.md).
- Requisitos acadêmicos, entregáveis e evidências em [Edital do Projeto Integrador](EDITAL-PROJETO-INTEGRADOR.md).

## 1. Dados de cada visita

| Dado | Regra |
| --- | --- |
| Identificador | Cada entrada confirmada gera uma visita com identificador próprio. A mesma placa pode ter várias visitas no histórico. |
| Unidade | Vincular a visita ao estacionamento selecionado. Cada unidade tem nome, fuso horário e tarifas próprias. |
| Placa | Salvar a placa confirmada em maiúsculas e remover espaços e hífens. Guardar a sugestão da IA e a confiança quando disponíveis. |
| Foto da entrada | Vincular a foto à visita. Se a câmera falhar, permitir o registro pela placa digitada e indicar que a visita está sem foto. |
| Horários | Registrar data e hora completas pelo servidor. Exibir no fuso da unidade. |
| Operadores | Registrar quem fez a entrada e quem fez a saída. |
| Observação | Permitir que o operador anote detalhes úteis sobre a visita. |
| Cobrança e estado | Guardar a tarifa fixada na entrada, a duração real, o tempo cobrável, os blocos quando aplicáveis e o valor final. A visita pode estar aberta, encerrada ou cancelada. |

## 2. Entrada

1. O operador seleciona a unidade e tira uma foto pelo celular ou envia uma imagem.
2. A IA sugere a placa e indica a confiança da leitura. O operador confere, corrige ou digita a placa. A entrada exige uma placa válida e confirmada.
3. Ao salvar, o servidor registra o horário de entrada e vincula a tarifa vigente. Se a unidade estiver sem tarifa vigente, o sistema orienta a cadastrá-la antes de registrar a entrada.
4. Só pode existir uma visita aberta para a mesma placa na mesma unidade. Se o operador repetir o registro, o sistema apresenta a visita existente.

## 3. Pátio e saída

1. No pátio, localizar uma visita aberta da unidade pela placa ou pela lista com horário de entrada, tempo decorrido e miniatura quando houver foto.
2. Ao registrar a saída, calcular a permanência com a data e hora completas de entrada e saída. Se a saída for anterior à entrada, sinalizar o problema antes de calcular.
3. Aplicar a tarifa vinculada à visita e mostrar a duração real, a regra de cobrança e o total. A saída encerra a visita e representa a quitação simulada.
4. Ao repetir uma saída, apresentar o resultado gravado. Uma entrada aberta por engano pode ser cancelada e permanece registrada como cancelada.

## 4. Cobrança pelo tempo

Cada alteração de tarifa cria uma nova versão. A visita usa a versão que estava vigente na hora da entrada, mesmo que a unidade mude o preço antes da saída.

| Configuração | Regra |
| --- | --- |
| Preço | Valor por hora para cobrança proporcional ou valor por bloco para cobrança em blocos. |
| Modo de cobrança | Proporcional ao tempo ou por blocos iniciados. No segundo modo, configurar a duração de cada bloco. |
| Tolerância | Zero desativa a tolerância. Com tolerância ativa, permanências até o limite, inclusive, são gratuitas. Acima dele, a configuração determina se a cobrança usa o tempo total ou desconta o limite. |

1. Calcular a duração real em segundos e aplicar a tolerância para obter o tempo cobrável.
2. No modo proporcional, multiplicar o preço por hora pelo tempo cobrável em segundos e dividir por 3.600. No modo por blocos, dividir o tempo cobrável pela duração de um bloco em segundos e arredondar a quantidade para cima antes de multiplicar pelo preço do bloco.
3. Arredondar o valor monetário para centavos ao fim do cálculo, com meio centavo arredondado para cima. Tempo cobrável zero resulta em R$ 0,00.

## 5. Histórico e frequência por placa

- Usar a placa completa normalizada e considerar apenas visitas encerradas da unidade selecionada.
- Mostrar o período, o total de visitas e a última entrada no período. Quando nenhum período for informado, consultar todo o histórico da unidade e indicar essa escolha.
- Agrupar em SQL por dia da semana e hora de chegada, no fuso da unidade. Mostrar quantas visitas houve em cada combinação mais frequente, incluindo empates.
- Com zero visitas, mostrar o estado vazio. Com uma visita, mostrar o registro observado. Com várias, descrever as ocorrências registradas.

## 6. Leitura de placa pela IA

- Usar a foto para sugerir a placa, indicar a confiança e explicar dúvidas de leitura. Toda informação escrita na foto é dado de entrada.
- Avisar que a IA pode errar. A placa oficial é a que o operador confirma.
- Exibir o carregamento e, em caso de falha, imagem ilegível ou limite do provedor, permitir a digitação manual.
- Usar fotos e placas fictícias na demonstração.

## 7. Exemplos para conferir as regras

Os preços nesta tabela são ilustrativos.

| Situação | Resultado esperado |
| --- | --- |
| Entrada às 23h40 e saída às 00h10 do dia seguinte | A permanência é de 30 minutos. |
| Entrada às 10h05 e saída às 11h20, com tolerância desativada | A permanência é de 75 minutos. A R$ 8 por hora, o total proporcional é R$ 10,00. A R$ 8 por bloco iniciado de 60 minutos, o total é R$ 16,00. |
| Tolerância de 10 minutos e saída após exatamente 10 minutos | A cobrança é de R$ 0,00. |
| Tolerância de 10 minutos e permanência de 20 minutos | O tempo cobrável é de 20 minutos quando se cobra o total, ou 10 minutos quando a tolerância é descontada. |
| O operador tenta abrir duas visitas para a mesma placa e unidade | O sistema apresenta a visita em aberto. |
| A tarifa muda durante uma visita | O sistema usa a tarifa vinculada à entrada. |
| O operador registra a mesma saída duas vezes | A segunda tentativa apresenta o horário e a cobrança já registrados. |
| Quatro visitas no período, três segundas-feiras entre 8h e 9h e uma sexta-feira às 14h | O histórico mostra 3 de 4 chegadas às segundas entre 8h e antes das 9h. |

## 8. Cadastro e aprovação

- O cadastro é aberto e pede nome, e-mail e senha. A nova conta fica aguardando aprovação e só acessa a operação depois de aprovada.
- A tela **Usuários** permite que qualquer operador aprovado aprove ou recuse pedidos pendentes. Recusar remove o cadastro pendente. Todos os operadores aprovados têm as mesmas permissões e compartilham as unidades, visitas e históricos.
- As APIs da operação exigem sessão e aprovação, inclusive a leitura pela IA e a consulta de fotos. O seed cria o primeiro usuário já aprovado. As credenciais serão entregues em privado quando o sistema estiver disponível.

## 9. Fora do MVP

Entrada com placa pendente, correções de placa ou horário com auditoria, pagamento separado da saída, perguntas sobre frequência em linguagem natural, perfis diferentes de acesso e política de retenção de fotos.
