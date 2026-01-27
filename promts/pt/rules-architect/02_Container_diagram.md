### 4.4. [C4 Nível 2] Diagrama de Contêineres
#### 4.4.1. Instrução para Criar Diagramas de Contêineres (C4 Nível 2) em PlantUML

##### 4.4.1.1. Conceito e Propósito
**Diagrama de Contêineres** é o diagrama de segundo nível na notação C4. Ele detalha o **sistema** (do diagrama de contexto), mostrando quais unidades executáveis grandes (contêineres) o compõem e como elas interagem.

*   **Público:** Desenvolvedores, engenheiros DevOps, arquitetos.
*   **Propósito:** Responder às perguntas: *"Como o sistema funciona por baixo?"*, *"De quais componentes grandes ele consiste?"*, *"Como eles se comunicam?"*.
*   **Elementos Chave:** Contêineres (aplicações, BDs), relacionamentos entre eles e tecnologias chave.

Proibição de especificar tecnologias utilizadas: Antes de projetar diagramas, é necessário esclarecer com o usuário o stack tecnológico utilizado no projeto; se o usuário não puder especificar o stack, então excluir a indicação do stack tecnológico em todos os níveis de diagramas C4.

Se um arquivo com o diagrama existir, é necessário perguntar ao usuário se deve atualizar o arquivo atual ou salvar o diagrama em um arquivo com a próxima versão.
##### 4.4.1.2. Sintaxe Básica PlantUML para C4

Para usar notação C4 em PlantUML, é necessário incluir a biblioteca correspondente.
O diagrama deve estar em conformidade com a sintaxe especificada em https://github.com/plantuml-stdlib/C4-PlantUML

**Linha obrigatória no início do script:**
plantuml
@startuml
!include <C4/C4_Container>
' Seu código de diagrama aqui...
@enduml


##### 4.4.1.3. Elementos Básicos e Sua Declaração

##### 4.4.1.3.1. Sistema (Esclarecimento de Contexto)
O elemento de nível superior que estamos detalhando.


System(alias, "rótulo", "descrição opcional")

*   `alias` - identificador único do elemento (latino, sem espaços).
*   `label` - nome exibido.
*   `description` - descrição opcional.

**Exemplo:**
plantuml
System(online_banking, "Internet Banking", "Fornece aos clientes acesso às suas contas e transações via web e mobile")


##### 4.4.1.3.2. Contêineres
Os principais blocos de construção do diagrama. Estes são processos/aplicações executáveis ou armazenamentos de dados.

**Sintaxe de Declaração:**

Container(alias, "rótulo", "tecnologia", "descrição opcional")

*   `technology` - indicação de tecnologia (ex., "React", "Spring Boot", "PostgreSQL").

**Tipos de Contêiner:**
*   `Container()` - contêiner universal (aplicação, serviço).
*   `ContainerDb()` - contêiner para banco de dados.
*   `ContainerQueue()` - contêiner para fila de mensagens (broker).
*   `Container_Ext()` - contêiner externo (gerenciado por terceiros).

**Exemplos:**
plantuml
Container(spa, "Aplicação Web", "Aplicação Single-Page para clientes")
ContainerDb(db, "Banco de Dados", "Armazena todos os dados financeiros e logins de usuários")
Container(backend_api, "API Backend", "Fornece API REST para clientes web e mobile")
Container_Ext(email_service, "Serviço de Email", "Serviço externo para envio de notificações")


##### 4.4.1.3.3. Relacionamentos
Mostram interação entre contêineres. Indicam o protocolo ou tecnologia de interação.

**Sintaxe:**

Rel(de, para, "rótulo", "tecnologia")

*   `from`, `to` - aliases dos elementos conectados.
*   `label` - descrição da interação (ex., "Lê/Escreve").
*   `technology` - tecnologia/protocolo (ex., "REST API", "JDBC", "Kafka").

**Exemplo:**
plantuml
Rel(spa, backend_api, "Chama API")
Rel(backend_api, db, "Lê/escreve")
Rel(backend_api, email_service, "Envia notificações")


#### 4.4.1.4. Agrupamento e Limites (Boundaries)
Para destacar visualmente partes do sistema pertencentes a diferentes domínios ou equipes, use limites.

**Sintaxe:**

Boundary(alias, "rótulo") {
    container1 = Container(...)
    container2 = Container(...)
    Rel(container1, container2, ...)
}


**Exemplo:**
plantuml
Boundary(boundary_backend, "Domínio Backend") {
    Container(api_gateway, "API Gateway")
    Container(user_service, "Serviço de Usuário")
    Container(account_service, "Serviço de Conta")
    Rel(api_gateway, user_service, "Chama")
    Rel(api_gateway, account_service, "Chama")
}


#### 4.4.1.5. Legenda
Para documentação oficial, recomenda-se adicionar uma legenda explicando os elementos do diagrama.


SHOW_LEGEND()


#### 4.4.1.6. Exemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Container>

Title "Diagrama de Contêineres - Sistema de Internet Banking"

Person(customer, "Cliente", "Usa internet banking")

System_Boundary(online_banking_system, "Internet Banking") {
    Container(spa, "Aplicação Web","Aplicação Single-Page")
    Container(mobile_app, "Aplicação Mobile","Aplicação mobile nativa")
    Container(backend_api, "API Backend", "Serviço principal de lógica de negócio")
    ContainerDb(db, "Banco de Dados",  "Armazena dados de usuários e transações")
}

System_Ext(processing_system, "Sistema de Pagamento", "Sistema externo para processamento de pagamentos")

Rel(customer, spa, "Visita website")
Rel(customer, mobile_app, "Usa aplicação")
Rel(spa, backend_api, "Chama API")
Rel(mobile_app, backend_api, "Chama API")
Rel(backend_api, db, "Lê/escreve")
Rel(backend_api, processing_system, "Envia requisição de pagamento")

SHOW_LEGEND()
@enduml


#### 4.4.1.7. Checklist de Qualidade do Diagrama
Antes de salvar, verifique o diagrama:
1.  [ ] **Diretiva incluída** `!include <C4/C4_Container>`
2.  [ ] **Papéis** Todos os papéis de usuário especificados em outros arquivos devem ser contabilizados neste diagrama.
3.  [ ] **Tem título claro** (`Title`).
4.  [ ] **Todos os contêineres** Não têm indicação de tecnologia.
5.  [ ] **Todos os relacionamentos** são rotulados (qual ação é realizada sem indicação de protocolo).
6.  [ ] **Sem detalhes excessivos** (não é necessário mostrar todos os microserviços se houver dezenas).
7.  [ ] **Aliases** dos elementos são únicos e escritos em latino.
8.  [ ] **Legenda** (`SHOW_LEGEND()`) adicionada para artefatos oficiais.
9.  [ ] **Em caso de arquitetura de microserviços:** Um serviço não deve criar mais de dois bancos de dados do mesmo tipo.
10. [ ] **Proibição de especificar tecnologias utilizadas:** Antes de projetar diagramas, é necessário esclarecer com o usuário o stack tecnológico utilizado no projeto; se o usuário não puder especificar o stack, então excluir a indicação do stack tecnológico em todos os níveis de diagramas C4.
11. [ ] **Verificação de papéis de usuário** O diagrama deve indicar todos os papéis de usuário que estão no diagrama de contexto (C4 Nível 1).
12. [ ] **Ao concluir** Pergunte ao usuário quais outros documentos precisam ser gerados ou ajustados, fornecendo uma lista.

**Formato do nome do arquivo:** `c4_Level_2_containers_diagram_[NomeProjeto]_v[número da versão (começando de 1)].plantuml`
