# Escopo do projeto — Gerador de cronograma de disciplina

## 1. Objetivo

Auxiliar a supervisão universitária na criação e manutenção de cronogramas de disciplinas, incluindo disciplinas paralelas que atendem às mesmas turmas. Oferecer uma visão integrada, visual e intuitiva, com ajustes manuais e prevenção de conflitos.

## 2. Status das definições

A modalidade manual assistida foi escolhida pelo responsável pelo projeto. Os requisitos explicitamente solicitados estão registrados como confirmados. Detalhamentos discutidos, mas ainda não validados individualmente, permanecem como propostas. Este documento não define tecnologia, banco de dados ou arquitetura e não autoriza a implementação do aplicativo.

## 3. Requisitos confirmados

- Cadastrar professores que atuam nas disciplinas.
- Cadastrar disciplinas, aulas/conteúdos e turmas.
- Associar aulas aos professores cadastrados.
- Definir dias, horários e turmas de cada aula.
- Registrar datas sem aula regular: feriados, recessos, provas e outras exceções.
- Planejar disciplinas em paralelo para as mesmas turmas e semestres.
- Evitar aulas simultâneas do mesmo professor em turmas diferentes.
- Disponibilizar panorama visual dos dias de aula e permitir ajustes intuitivos.
- Utilizar montagem manual assistida: o usuário decide as alocações e o aplicativo verifica conflitos e acompanha pendências.

## 4. Princípios da montagem manual assistida

- O usuário escolhe o conteúdo, a turma, os responsáveis, a data e o horário.
- O aplicativo não escolhe datas nem professores automaticamente.
- Mover uma aula não deve reorganizar silenciosamente as demais.
- Alterar uma turma não deve modificar automaticamente a outra.
- A interface deve identificar claramente conflitos e pendências.

## 5. Modelo funcional proposto

### Planejamento letivo

Agrupar período inicial e final, ano/semestre, disciplinas, turmas, professores e grade recorrente de horários.

### Professores

Manter cadastro reutilizável. Como detalhamento a validar, incluir disciplinas de atuação, disponibilidade, indisponibilidades pontuais e preferências, distinguindo restrições de preferências.

### Conteúdos e encontros

Separar conteúdo cadastrado de encontro agendado. Um conteúdo pode exigir vários encontros e ser realizado separadamente para cada turma. Permitir, como proposta, mais de um professor responsável por encontro.

### Grade e calendário

Definir os horários recorrentes por disciplina e turma e apresentar as datas concretas do período letivo. Permitir disciplinas paralelas com alternância de turmas entre horários.

### Exceções e eventos

Distinguir bloqueios de horário de atividades acadêmicas, como provas e devolutivas. Propor alcance configurável por planejamento, disciplina, turma e faixa de horário. Uma prova de uma disciplina não deve ser interpretada automaticamente como cancelamento de todas as atividades do dia; seu alcance deverá ser informado.

## 6. Fluxo de uso proposto

1. Criar o planejamento letivo.
2. Cadastrar ou selecionar disciplinas, turmas e professores.
3. Definir a grade de dias e horários.
4. Registrar eventos e bloqueios.
5. Cadastrar conteúdos, responsáveis e encontros previstos por turma.
6. Selecionar uma aula pendente e um espaço no calendário.
7. Verificar conflitos antes de confirmar a alocação.
8. Mover, editar ou retirar encontros conforme necessário.
9. Revisar pendências e preparar a saída do cronograma.

Ao retirar um encontro do calendário, a proposta é devolvê-lo às pendências sem excluir seu conteúdo cadastrado.

## 7. Validações

### Regra confirmada

Evitar que um professor seja alocado em encontros com horários sobrepostos para turmas diferentes.

### Detalhamento proposto para validação

- Bloquear a confirmação de sobreposição de professor, indicando o encontro conflitante.
- Verificar todos os responsáveis em aulas com múltiplos professores.
- Impedir duas atividades simultâneas para a mesma turma.
- Impedir alocações em períodos bloqueados ou de indisponibilidade docente.
- Considerar sobreposição de intervalos, não apenas igualdade do horário inicial; horários adjacentes, sem sobreposição, não constituem conflito.
- Emitir avisos, sem reorganização automática, para sequência de conteúdos divergente e progresso diferente entre turmas.

## 8. Interface proposta

- Calendário integrado com disciplinas e turmas em paralelo.
- Lista de conteúdos e encontros ainda não distribuídos.
- Filtros ou visões por disciplina, turma e professor.
- Montagem por seleção da aula e do destino; arrastar e soltar como interação complementar a validar.
- Identificação textual de aulas, professores e conflitos; cores como apoio visual.
- Confirmação explícita antes de alterações que afetem vários encontros.

## 9. Acompanhamento de pendências proposto

Acompanhar a distribuição por conteúdo, encontro e turma. Uma aula destinada às turmas A e B só estará totalmente distribuída quando os encontros previstos para ambas estiverem agendados. Mostrar conteúdos sem data, encontros sem responsável e conflitos pendentes. Definir posteriormente quais campos serão obrigatórios em rascunhos.

## 10. Saída do cronograma — proposta

Disponibilizar uma tabela com data, disciplina/módulo, turma, horário, sala quando aplicável, conteúdo e professor(es), inspirada no cronograma fornecido pelo responsável. Formatos de exportação e regras de impressão ainda serão definidos. O planejamento deverá continuar editável após a exportação.

## 11. Critérios de aceite iniciais

- É possível cadastrar os elementos confirmados e montar manualmente um cronograma.
- É possível visualizar duas disciplinas paralelas para as mesmas turmas.
- Uma tentativa de sobreposição de professor é identificada antes da confirmação.
- Eventos e bloqueios ficam visíveis no planejamento.
- Ajustar uma aula não redistribui outras aulas automaticamente.

Critérios adicionais para interface, persistência, exportação e validações propostas serão detalhados após aprovação dessas funções.

## 12. Fora do escopo inicial

- Geração automática ou semiautomática da distribuição.
- Otimização automática de horários ou escolha automática de docentes.
- Redistribuição em cascata sem ação explícita do usuário.

## 13. Decisões em aberto

- Disponibilidades e preferências docentes na primeira versão.
- Tratamento de salas e eventual detecção de conflitos de sala.
- Duração dos encontros, intervalos e unidade de carga horária.
- Edição de séries recorrentes e alterações em lote.
- Formatos de exportação e apresentação para impressão.
- Salvamento, recuperação, histórico e reutilização entre semestres.
- Acesso individual ou colaboração entre usuários.
- Tecnologia, hospedagem e arquitetura.

## 14. Referência de domínio

Cronograma integrado de MORFO Abdome e Pelve e Ciências Médicas fornecido na conversa, usado para compreender alternância de turmas, disciplinas paralelas, conteúdos repetidos por turma, múltiplos responsáveis e avaliações. O arquivo original não está sendo adicionado ao repositório nesta ação. Datas, títulos e identificação do semestre do exemplo deverão ser conferidos antes de eventual importação.
