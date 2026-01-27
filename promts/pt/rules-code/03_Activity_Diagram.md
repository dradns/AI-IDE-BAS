### 4.5. Diagrama de Atividades do Processo de Negócio em Formato PlantUML (Activity Diagram)
**Instruções para criar diagramas de Atividades para um agente de IA**

#### 4.5.1. Conteúdo
1. [Básicos e Requisitos](#básicos-e-requisitos)
2. [Estrutura do Diagrama](#estrutura-do-diagrama)
3. [Métricas de Qualidade](#métricas-de-qualidade)
4. [Regras de Validação](#regras-de-validação)
5. [Template Básico](#template-básico)
6. [Elementos do Diagrama](#elementos-do-diagrama)
7. [Construções de Controle](#construções-de-controle)
8. [Tratamento de Concorrência](#tratamento-de-concorrência)
9. [Integração com Artefatos](#integração-com-artefatos)
10. [Padrões Standard](#padrões-standard)
11. [Checklist de Qualidade](#checklist-de-qualidade)

---

#### 4.5.2. Básicos e Requisitos

##### 4.5.2.1. Artefatos de Entrada Obrigatórios:
- **User Story** - para entender o objetivo de negócio e limites do processo
- **Use Case** - para descrição detalhada do fluxo de ações
- **Descrição do Processo de Negócio** - para entender a lógica e regras

##### 4.5.2.2. Artefatos Adicionais:
- Especificação técnica, Regras de Negócio, documentação de Workflow
- Diagramas de sequência para entender interações

##### 4.5.2.3. Propósito do Diagrama de Atividades:
- Modelagem do fluxo de ações e tomada de decisão
- Visualização de processos paralelos e sincronização
- Demonstração da lógica do processo de negócio do início ao fim
- Identificação de pontos de decisão e caminhos alternativos

---

#### 4.5.3. Estrutura do Diagrama

##### 4.5.3.1. Título e Configurações
plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title Nome do Processo do User Story


##### 4.5.3.2. Swimlanes (Raias de Responsabilidade)
plantuml
||Papel 1|
start
:Ação 1;

||Papel 2|
:Ação 2;

||Sistema|
:Ação Automática;


##### 4.5.3.3. Organização Estrutural
- **Início**: ponto de partida obrigatório
- **Ações**: descrição de passos específicos
- **Decisões**: pontos de ramificação lógica
- **Concorrência**: fork/join para ações concorrentes
- **Término**: end ou stop

---

#### 4.5.4. Métricas de Qualidade

##### 4.5.4.1. Indicadores Alvo:
- **Cobertura de Fluxo**: 100% dos passos do Use Case estão representados
- **Agrupamento Lógico**: uso de swimlanes para papéis
- **Detalhamento de Decisão**: todo 'if' tem todos os resultados possíveis
- **Concorrência**: processos concorrentes são identificados e modelados
- **Tratamento de Erros**: mínimo de 2 fluxos de tratamento de erro

##### 4.5.4.2. Sistema de Pontuação:
- **Excelente Qualidade**: ≥90% de conformidade com métricas + cobertura total de Use Case
- **Boa Qualidade**: 70-89% de conformidade com métricas
- **Precisa Melhorar**: <70% de conformidade com métricas

##### 4.5.4.3. Métricas Específicas:
- Número de swimlanes: 2-6 (de acordo com papéis do Use Case)
- Número de decisões: 1-5 para cada 10 ações
- Profundidade de aninhamento: não mais que 3 níveis
- Fluxos paralelos: todos os processos paralelos possíveis são identificados

---

#### 4.5.5. Regras de Validação

##### 4.5.5.1. Verificações Automáticas:

✓ Começa com @startuml, termina com @enduml
✓ Tem um único ponto de início
✓ Todos os caminhos levam a end/stop
✓ Todo 'if' tem ramificações then/else correspondentes
✓ Todos os forks têm joins correspondentes
✓ Swimlanes correspondem a papéis do Use Case
✓ Ações contêm verbos ativos
✓ Sem ações "penduradas" sem entrada/saída
✓ Decisões são formuladas como perguntas


##### 4.5.5.2. Verificações Semânticas:

✓ Toda ação corresponde a um passo do Use Case
✓ A sequência de ações está logicamente conectada
✓ Papéis em swimlanes correspondem a atores do User Story
✓ Todos os fluxos alternativos do Use Case estão representados
✓ Tratamento de erros cobre principais exceções


#### 4.5.6. Template Básico

plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title [Nome do Processo do User Story]

||[Papel do User Story]|
start
:[Ação Inicial];

if ([Condição de Decisão]?) then (sim)
  :[Ação em Resultado Positivo];
else (não)
  :[Ação em Resultado Negativo];
  stop
endif

||[Sistema/Outro Papel]|
:[Ação Automática ou Delegada];

||[Papel do User Story]|
:[Ação Final];
end

@enduml


---

#### 4.5.7. Elementos do Diagrama

##### 4.5.7.1. Elementos Básicos:

###### 4.5.7.1.1. Início e Fim
plantuml
start                    // Ponto de entrada único
end                      // Conclusão normal
stop                     // Terminação de emergência
kill                     // Terminação forçada
detach                   // Terminação assíncrona


###### 4.5.7.1.2. Atividades
plantuml
:Ação com verbo ativo;
:Validar correção dos dados;
:Enviar notificação;
:[Ação entre colchetes para sistema];


**Regras de Nomenclatura de Atividades:**
- Comece com verbo ativo na forma infinitiva
- Seja específico e mensurável
- Evite detalhes técnicos, foque na lógica de negócio
- Comprimento: 2-6 palavras

###### 4.5.7.1.3. Pontos de Decisão
plantuml
if (Dados são válidos?) then (sim)
  :Continuar processamento;
else (não)
  :Retornar erro de validação;
  stop
endif

// Múltiplas opções
switch (Tipo de usuário?)
case (Admin)
  :Mostrar painel admin;
case (Usuário)
  :Mostrar interface de usuário;
case (Visitante)
  :Mostrar página de visitante;
endswitch


###### 4.5.7.1.4. Processamento Paralelo
plantuml
fork
  :Enviar email;
fork again
  :Enviar SMS;
fork again
  :Escrever no log de auditoria;
end fork

// Com sincronização
fork
  :Processar pagamento;
fork again
  :Reservar produto;
end merge  // Aguardar conclusão de todas as ramificações


###### 4.5.7.1.5. Loops e Repetições
plantuml
// Loop simples
repeat
  :Obter próximo item;
  :Processar item;
repeat while (Existem mais itens?)

// Loop while
while (Condição de continuação?)
  :Realizar ação;
endwhile

// Loop for
repeat :i = 1;
  :Processar item i;
  :i = i + 1;
repeat while (i <= count?)


---

#### 4.5.8. Construções de Controle

##### 4.5.8.1. Ramificação Simples
plantuml
if (Usuário está autenticado?) then (sim)
  :Mostrar dados pessoais;
else (não)
  :Redirecionar para página de login;
  stop
endif


##### 4.5.8.2. Ramificação Múltipla
plantuml
switch (Status do pedido?)
case (Novo)
  :Enviar para processamento;
case (Em Progresso)
  :Continuar processamento;
case (Concluído)
  :Enviar ao cliente;
case (Cancelado)
  :Reembolsar pagamento;
  stop
endswitch


##### 4.5.8.3. Condições Aninhadas
plantuml
if (Usuário está autenticado?) then (sim)
  if (Tem direitos de admin?) then (sim)
    :Mostrar funções admin;
  else (não)
    :Mostrar interface regular;
  endif
else (não)
  :Mostrar formulário de login;
endif


##### 4.5.8.4. Tratamento de Exceções
plantuml
:Tentar realizar operação;
note right: Pode gerar erro

if (Operação bem-sucedida?) then (sim)
  :Continuar execução;
else (não)
  if (Erro crítico?) then (sim)
    :Registrar erro;
    :Notificar administrador;
    stop
  else (não)
    :Mostrar mensagem ao usuário;
    :Oferecer nova tentativa;
  endif
endif


---

#### 4.5.9. Tratamento de Concorrência

##### 4.5.9.1. Processos Paralelos Independentes
plantuml
fork
  :Enviar notificação por email;
fork again
  :Enviar notificação push;
fork again
  :Escrever no log de auditoria;
end fork

:Continuar processo principal;


##### 4.5.9.2. Processos Sincronizados
plantuml
fork
  :Verificar disponibilidade do produto;
fork again
  :Verificar limite de crédito;
fork again
  :Verificar endereço de entrega;
end merge

if (Todas as verificações passaram?) then (sim)
  :Criar pedido;
else (não)
  :Rejeitar pedido;
  stop
endif


##### 4.5.9.3. Concorrência Condicional
plantuml
if (Entrega expressa necessária?) then (sim)
  fork
    :Reservar produto;
  fork again
    :Encontrar armazém mais próximo;
  fork again
    :Preparar entregador;
  end merge
else (não)
  :Processamento padrão de pedido;
endif


---

#### 4.5.10. Integração com Artefatos

##### 4.5.10.1. Conexão com User Story:
- **Papéis em swimlanes** = papéis de "Como [papel]"
- **Fluxo principal** = implementação de "Eu quero [ação]"
- **Resultado do diagrama** = alcançar "Para que [benefício]"

##### 4.5.10.2. Conexão com Use Case:
- **Fluxo principal do UC** = sequência principal de ações
- **Fluxos alternativos do UC** = ramificações else/case
- **Exceções do UC** = blocos de tratamento de erro
- **Pré-condições do UC** = condições no início do diagrama
- **Pós-condições do UC** = estados nos pontos finais

##### 4.5.10.3. Conexão com Regras de Negócio:
- **Regras de decisão** = condições em if/switch
- **Restrições de negócio** = blocos de validação
- **Processos de aprovação** = sequências em swimlanes correspondentes

##### 4.5.10.4. Conexão com artefatos técnicos:
- **Especificação de API** = ações automatizadas
- **Schema de banco de dados** = ações de persistência de dados
- **Diagramas de sequência** = detalhamento de interações entre swimlanes

---

#### 4.5.11. Checklist de Qualidade

##### 4.5.11.1. Verificação Estrutural:
- [ ] Diagrama começa com `@startuml` e termina com `@enduml`
- [ ] Há um único ponto `start`
- [ ] Todos os caminhos levam a `end`, `stop`, `kill` ou `detach`
- [ ] Todo `if` tem `endif` correspondente
- [ ] Todo `fork` tem `end fork` ou `end merge` correspondente
- [ ] Todo `repeat` tem `repeat while` correspondente
- [ ] Todas as swimlanes têm nomes significativos

##### 4.5.11.2. Verificação Semântica:
- [ ] Diagrama cobre o fluxo principal do Use Case
- [ ] Fluxos alternativos do Use Case estão representados
- [ ] Papéis em swimlanes correspondem ao User Story
- [ ] Toda ação começa com verbo ativo
- [ ] Decisões são formuladas como perguntas com opções de resposta claras
- [ ] Tratamento de erros está presente para operações críticas
- [ ] Processos paralelos são identificados e modelados corretamente

##### 4.5.11.3. Verificação de Legibilidade:
- [ ] Número de swimlanes: 2-6
- [ ] Profundidade de aninhamento de condições: não mais que 3 níveis
- [ ] Comprimento de ação: 2-6 palavras
- [ ] Grupos lógicos de ação podem ser visualmente distinguidos
- [ ] Diagrama cabe em uma página A4

##### 4.5.11.4. Verificação de Conformidade com Requisitos:
- [ ] Todos os passos do Use Case estão representados
- [ ] Regras de negócio são refletidas em condições
- [ ] Papéis e responsabilidades estão claramente separados
- [ ] Pontos de decisão correspondem à lógica de negócio
- [ ] Resultado do diagrama alcança o objetivo do User Story

##### 4.5.11.5. Verificação Final:
- [ ] Diagrama compila sem erros em PlantUML
- [ ] Título reflete a essência do processo
- [ ] Design visual está em conformidade com padrões
- [ ] Diagrama pode ser entendido por stakeholders sem explicações adicionais

---

Esta instrução garante a criação de diagramas de Atividades de alta qualidade que refletem com precisão os processos de negócio e são facilmente legíveis por todos os stakeholders.
