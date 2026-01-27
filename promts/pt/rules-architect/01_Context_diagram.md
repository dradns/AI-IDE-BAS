### 4.3. [C4 nível 1] Diagrama de Contexto
#### 4.3.1. Instrução para Criar Diagrama de Contexto (C4 Nível 1) em PlantUML
##### 4.3.1.1. Conceito e Propósito
**Diagrama de Contexto** é o diagrama de nível mais alto (Nível 1) na notação C4. Ele mostra o sistema como um bloco inteiro e sua interação com o mundo externo.
**Público:** Todos os stakeholders, incluindo não-técnicos (clientes de negócio, gerentes).
**Propósito:** Responder às perguntas: *"O que o sistema faz?"*, *"Quem o usa?"*, *"Com quais sistemas externos ele interage?"*
**Elementos Chave:** Sistema, pessoas/papéis (atores), sistemas externos.
Proibição de especificar tecnologias utilizadas: Antes de projetar diagramas, é necessário esclarecer com o usuário o stack tecnológico utilizado no projeto; se o usuário não puder especificar o stack, então excluir a indicação do stack tecnológico em todos os níveis de diagramas C4.
Se um arquivo com o diagrama existir, é necessário perguntar ao usuário se deve atualizar o arquivo atual ou salvar o diagrama em um arquivo com a próxima versão.
##### 4.3.1.2. Sintaxe Básica PlantUML para C4
Para usar notação C4 em PlantUML, é necessário incluir a biblioteca correspondente.
**Linha obrigatória no início do script:**
plantuml
@startuml
!include <C4/C4_Context>
' Seu código de diagrama aqui...
@enduml

##### 4.3.1.3. Elementos Básicos e Sua Declaração
###### 4.3.1.3.1. Sistema
O elemento central do diagrama, que estamos projetando.

System(alias, "rótulo", "descrição opcional")

*   `alias` - identificador único do elemento (latino, sem espaços).
*   `label` - nome do sistema exibido.
*   `description` - breve descrição opcional do propósito do sistema.

**Exemplo:**
plantuml
System(system_a, "Sistema de Gestão de Pedidos", "Processa pedidos de clientes, gerencia estoque e entrega")

###### 4.3.1.3.2. Atores (Pessoas/Person)
Pessoas ou papéis que interagem com o sistema.

Person(alias, "rótulo", "descrição opcional")

*   `alias` - identificador único.
*   `label` - nome do papel/pessoa exibido.

**Exemplo:**
plantuml
Person(customer, "Cliente", "Comprador de produtos na loja online")
Person(admin, "Administrador", "Gerencia produtos e rastreia pedidos")

###### 4.3.1.3.3. Sistemas Externos
Sistemas de software que estão fora do controle da sua equipe mas com os quais seu sistema interage.

System_Ext(alias, "rótulo", "descrição opcional")

*   `alias` - identificador único.
*   `label` - nome do sistema externo exibido.
**Exemplo:**
plantuml
System_Ext(payment_gateway, "Gateway de Pagamento", "Processa pagamentos com cartão de crédito")
System_Ext(email_service, "Serviço de Notificação por Email", "Envia emails para clientes")

###### 4.3.1.3.4. Relacionamentos
Mostram interação entre elementos. Indicam a natureza da interação.

**Sintaxe:**

Rel(de, para, "rótulo", "tecnologia")

*   `from`, `to` - aliases dos elementos conectados.
*   `label` - descrição da interação (ex., "Compra produtos", "Recebe notificações").
*   `technology` - indicação opcional de tecnologia/protocolo (ex., "Web UI", "REST API"). *Frequentemente omitido no diagrama de contexto.*

**Exemplo:**
plantuml
Rel(customer, system_a, "Compra produtos", "Web UI")
Rel(system_a, payment_gateway, "Inicia pagamento", "REST API")
Rel(system_a, email_service, "Envia dados para notificação", "SMTP")
Rel(admin, system_a, "Gerencia produtos", "Web UI")

##### 4.3.1.4. Agrupamento de Elementos (Limites)
Para destacar visualmente ambiente interno e externo, limites podem ser usados.


Enterprise_Boundary(alias, "rótulo") {
    ' Elementos dentro do limite empresarial
}


**Exemplo:**
plantuml
Enterprise_Boundary(enterprise_a, "Nossa Empresa") {
    Person(admin, "Administrador")
    System(system_a, "Sistema de Gestão de Pedidos")
}
Enterprise_Boundary(enterprise_b, "Parceiro") {
    System_Ext(payment_gateway, "Gateway de Pagamento")
}

##### 4.3.1.5. Legenda
Para documentação oficial, recomenda-se adicionar uma legenda.


SHOW_LEGEND()

##### 4.3.1.6. Exemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Context>

Title Diagrama de Contexto - Sistema de Gestão de Pedidos

Person(customer, "Cliente", "Compra produtos na loja online")
Person(admin, "Administrador", "Gerencia catálogo e pedidos")

System(system_a, "Sistema de Gestão de Pedidos", "Aceita e processa pedidos, gerencia estoque")

System_Ext(payment_gateway, "Gateway de Pagamento", "Processa pagamentos com cartão")
System_Ext(email_service, "Serviço de Email", "Envia notificações para clientes")
System_Ext(erp_system, "Sistema ERP", "Recebe dados para contabilidade")

Rel(customer, system_a, "Visualiza catálogo, compra produtos")
Rel(admin, system_a, "Gerencia produtos e rastreia pedidos")
Rel(system_a, payment_gateway, "Inicia pagamento", "REST API")
Rel(system_a, email_service, "Envia dados para notificações", "SMTP")
Rel(system_a, erp_system, "Exporta dados de vendas", "SFTP")

SHOW_LEGEND()

@enduml

##### 4.3.1.7. Checklist de Qualidade do Diagrama
Antes de salvar, verifique o diagrama:
1.  [ ] **Diretiva incluída** `!include <C4/C4_Context>`
2.  [ ] **Tem título claro** (`Title`).
3.  [ ] **Apenas um sistema central** (o que você está projetando).
4.  [ ] **Todos os usuários chave** (atores) e **sistemas externos** são mostrados.
5.  [ ] **Relacionamentos** são rotulados em linguagem de negócio clara (o que fazem, não como são tecnicamente implementados).
6.  [ ] **Sem detalhes técnicos** da estrutura interna do sistema (isso é tarefa do diagrama de contêineres).
7.  [ ] **Aliases** dos elementos são únicos e escritos em latino.
8.  [ ] **Legenda** (`SHOW_LEGEND()`) adicionada para artefatos oficiais.
9.  [ ] **Após salvar o arquivo** Pergunte ao usuário quais outros documentos precisam ser gerados ou ajustados, fornecendo uma lista.
**Formato do nome do arquivo:** `c4_Level_1_context_diagram_[NomeProjeto]_v[número da versão (começando de 1)].plantuml`
#### 4.3.2 Métricas de Qualidade
1. Completude:
   * Todos os atores chave presentes
   * Integrações principais refletidas
2. Consistência:
   * Nomes correspondem a outros artefatos
   * Sem contradições com a realidade
3. Relevância:
   * Versão do diagrama especificada
   * Tem data da última atualização
#### 4.3.3 Integração com Outros Artefatos
1. Com User Story:
   * Atores devem ser coordenados
   * Cenários principais refletidos
2. Com Diagrama de Componentes:
   * Sistemas externos duplicados
   * Nível de detalhe coordenado
3. Com ERD:
   * BDs externos correspondem a entidades
