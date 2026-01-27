### 4.5. [C4 Nível 3] Diagrama de Componentes
#### 4.5.1. Instrução para Criar Diagrama de Componentes (C4 Nível 3) em PlantUML
##### 4.5.1.1. Conceito e Propósito

**Diagrama de Componentes** é o diagrama de terceiro nível na notação C4. Ele detalha cada um dos **contêineres** (do diagrama de contêineres), mostrando quais componentes lógicos (módulos, serviços) o compõem e como eles interagem dentro dele.

Caso seja solicitado desenhar um diagrama de componentes, é necessário solicitar ao usuário para quais contêineres são necessários diagramas de componentes (dando-lhe uma opção de escolha).

Proibição de especificar tecnologias utilizadas: Antes de projetar diagramas, é necessário esclarecer com o usuário o stack tecnológico utilizado no projeto; se o usuário não puder especificar o stack, então excluir a indicação do stack tecnológico em todos os níveis de diagramas C4

*   **Público:** Desenvolvedores, arquitetos.
*   **Propósito:** Responder às perguntas: *"Como o contêiner é estruturado internamente?"*, *"De quais componentes ele consiste?"*, *"Como esses componentes interagem entre si?"*
*   **Elementos Chave:** Componentes, interfaces (API), relacionamentos entre eles.

Se um arquivo com o diagrama existir, é necessário perguntar ao usuário se deve atualizar o arquivo atual ou salvar o diagrama em um arquivo com a próxima versão.

Durante a criação do diagrama, aplique o princípio KISS (Keep It Simple, Stupid ou Keep It Short and Simple) - este é um princípio fundamental de design e desenvolvimento, segundo o qual a maioria dos sistemas funciona melhor quando permanece simples, em vez de ser desnecessariamente complicada.
##### 4.5.1.2. Sintaxe Básica PlantUML para C4


Para usar notação C4 em PlantUML, é necessário incluir a biblioteca correspondente.
O diagrama deve estar em conformidade com a sintaxe especificada em https://github.com/plantuml-stdlib/C4-PlantUML


Pergunte ao usuário para quais contêineres é necessário desenhar um diagrama de componentes, pegando a lista de contêineres do diagrama de contêineres (se estiver criado), se não estiver criado então crie-o.


**Linha obrigatória no início do script:**
plantuml
@startuml
!include <C4/C4_Component>
' Seu código de diagrama aqui...
@enduml

##### 4.5.1.3. Elementos Básicos e Sua Declaração
###### 4.5.1.3.1. Contêiner
O elemento de nível superior que estamos detalhando. Ele deve ser declarado no diagrama de contêineres.


Container(alias, "rótulo", "tecnologia", "descrição opcional")


###### 4.5.1.3.2. Componentes
Os principais blocos de construção do diagrama. Estes são módulos, serviços ou bibliotecas logicamente agrupados dentro do contêiner.

**Sintaxe de Declaração:**

Component(alias, "rótulo", "tecnologia", "descrição opcional")

*   `alias` - identificador único do elemento (latino, sem espaços).
*   `label` - nome do componente exibido.
*   `technology` - indicação de tecnologia (ex., "Java Class", "REST Controller", "Spring Service").
*   `description` - descrição opcional da responsabilidade do componente.

**Exemplo:**
plantuml
Component(controller, "OrderController", "Spring REST Controller", "Manipula requisições HTTP relacionadas a pedidos")
Component(service, "OrderService", "Spring Service", "Encapsula lógica de negócio de processamento de pedidos")
Component(repository, "OrderRepository", "JPA Repository", "Fornece persistência de dados de pedidos")


###### 4.5.1.3.3. Interfaces
Mostram como componentes fornecem funcionalidade uns aos outros ou ao mundo externo (ex., API).

**Sintaxe:**

Rel_U(para, de, "rótulo da interface", "tecnologia")

*   `to`, `from` - aliases dos elementos conectados.
*   `interface label` - nome da interface/API (ex., "getOrderById").
*   `technology` - tecnologia/protocolo (ex., "REST", "Java Interface").

**Exemplo:**
plantuml
Rel_U(controller, service, "Order API", "Java Interface")


###### 4.5.1.3.4. Relacionamentos
Mostram interação entre componentes. Indicam a natureza da interação.

**Sintaxe:**

Rel(de, para, "rótulo", "tecnologia")

*   `from`, `to` - aliases dos elementos conectados.
*   `label` - descrição da interação (ex., "chama", "usa").
*   `technology` - tecnologia/protocolo (ex., "chamada de método", "REST").

**Exemplo:**
plantuml
Rel(service, repository, "usa", "JPA")


###### 4.5.1.3.5. Bancos de Dados e Dependências Externas
Para mostrar interação com BD ou serviços externos dentro do contêiner.


ContainerDb(alias, "rótulo", "tecnologia", "descrição opcional")


**Exemplo:**
plantuml
ContainerDb(database, "Banco de Dados de Pedidos", "PostgreSQL", "Armazena dados de pedidos")


##### 4.5.1.4. Agrupamento de Componentes
Para organização visual de componentes por responsabilidades ou camadas.


Boundary(alias, "rótulo") {
    Component(component1, "Component1")
    Component(component2, "Component2")
}


**Exemplo:**
plantuml
Boundary(web_layer, "Camada Web") {
    Component(controller, "OrderController")
}
Boundary(service_layer, "Camada de Serviço") {
    Component(service, "OrderService")
}
Boundary(persistence_layer, "Camada de Persistência") {
    Component(repository, "OrderRepository")
}


##### 4.5.1.5. Legenda
Para documentação oficial, recomenda-se adicionar uma legenda.


SHOW_LEGEND()


##### 4.5.1.6. Exemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Component>

Title Diagrama de Componentes - API Backend (microserviço de pedidos)

Container(api, "Serviço de Pedidos", "Spring Boot", "Microserviço para gestão de pedidos")

Boundary(api_boundary, "Componentes do Serviço de Pedidos") {
    Component(order_controller, "OrderController", "REST Controller", "Manipula requisições HTTP")
    Component(order_service, "OrderService", "Spring Service", "Lógica de negócio de pedidos")
    Component(order_repository, "OrderRepository", "JPA Repository", "Acesso a dados")
    Component(inventory_client, "InventoryClient", "Feign Client", "Chama serviço de inventário")
    Component(notification_service, "NotificationService", "Spring Service", "Envio de notificações")
}

ContainerDb(order_db, "Banco de Dados de Pedidos", "PostgreSQL", "Armazenamento de pedidos")
System_Ext(inventory_service, "Serviço de Inventário", "Serviço de gestão de inventário")
System_Ext(email_service, "Serviço de Email", "Serviço de envio de email")

Rel(order_controller, order_service, "chama", "Java Interface")
Rel(order_service, order_repository, "usa", "JPA")
Rel(order_service, inventory_client, "verifica disponibilidade", "REST")
Rel(order_service, notification_service, "solicita notificação", "Java Interface")
Rel(order_repository, order_db, "salva em", "JDBC")
Rel(inventory_client, inventory_service, "chama API", "HTTP/REST")
Rel(notification_service, email_service, "envia requisição", "SMTP")

SHOW_LEGEND()

@enduml


##### 4.5.1.7. Checklist de Qualidade do Diagrama
Antes de salvar, verifique o diagrama:
1.  [ ] **Diretiva incluída** `!include <C4/C4_Component>`
2.  [ ] **Tem título claro** (`Title`) com indicação do contêiner detalhado.
3.  [ ] **Todos os relacionamentos** são rotulados (qual ação é realizada).
4.  [ ] **Interfaces chave** entre componentes são mostradas.
5.  [ ] **Sem detalhes excessivos** (não é necessário mostrar todos os métodos e classes).
6.  [ ] **Aliases** dos elementos são únicos e escritos em latino com decodificação em inglês entre parênteses.
7.  [ ] **Legenda** (`SHOW_LEGEND()`) adicionada para artefatos oficiais.
8.  [ ] **Sintaxe** Qualidade dos diagramas PlantUML em notação C4: Diagramas não devem contradizer a sintaxe especificada em https://github.com/plantuml-stdlib/C4-PlantUML
9.  [ ] Pergunte ao usuário para quais outros contêineres é necessário desenhar um diagrama de componentes
10. [ ] **Ao concluir** Pergunte ao usuário quais outros documentos precisam ser gerados ou ajustados, fornecendo uma lista.

**Formato do nome do arquivo:** `c4_Level_3_component_diagram_[NomeProjeto]_([NomeConteiner])_v[número da versão (começando de 1)].plantuml`
