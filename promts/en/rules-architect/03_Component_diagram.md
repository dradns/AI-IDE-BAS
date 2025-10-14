### 4.5. [C4 Level 3] Component Diagram
#### 4.5.1. Instruction for Creating Component Diagram (C4 Level 3) in PlantUML
##### 4.5.1.1. Concept and Purpose

**Component Diagram** is the third level diagram in C4 notation. It details each of the **containers** (from the container diagram), showing which logical components (modules, services) it consists of and how they interact inside it.

In case when asked to draw a component diagram, it is necessary to request from the user for which containers component diagrams are needed (giving him a choice option).

Prohibition on specifying used technologies: Before designing diagrams, it is necessary to clarify with the user the technology stack used in the project; if the user cannot specify the stack, then exclude the indication of the technology stack on all levels of C4 diagrams

*   **Audience:** Developers, architects.
*   **Purpose:** Answer the questions: *"How is the container structured internally?"*, *"What components does it consist of?"*, *"How do these components interact with each other?"*
*   **Key Elements:** Components, interfaces (API), relationships between them.

If a file with the diagram exists, it is necessary to ask the user whether to update the current file or save the diagram to a file with the next version.

During diagram creation, apply the KISS principle (Keep It Simple, Stupid or Keep It Short and Simple) - this is a fundamental design and development principle, according to which most systems work best when they remain simple, rather than being unnecessarily complicated.
##### 4.5.1.2. Basic PlantUML Syntax for C4


To use C4 notation in PlantUML, it is necessary to include the corresponding library.
The diagram must comply with the syntax specified in https://github.com/plantuml-stdlib/C4-PlantUML


Ask the user for which containers it is necessary to draw a component diagram, taking the list of containers from the container diagram (if it is created), if not created then create it.


**Mandatory line at the beginning of the script:**
plantuml
@startuml
!include <C4/C4_Component>
' Your diagram code here...
@enduml

##### 4.5.1.3. Basic Elements and Their Declaration
###### 4.5.1.3.1. Container
The top-level element that we are detailing. It must be declared on the container diagram.


Container(alias, "label", "technology", "optional description")


###### 4.5.1.3.2. Components
The main building blocks of the diagram. These are logically grouped modules, services or libraries inside the container.

**Declaration Syntax:**

Component(alias, "label", "technology", "optional description")

*   `alias` - unique element identifier (Latin, no spaces).
*   `label` - displayed component name.
*   `technology` - indication of technology (e.g., "Java Class", "REST Controller", "Spring Service").
*   `description` - optional description of component responsibility.

**Example:**
plantuml
Component(controller, "OrderController", "Spring REST Controller", "Handles HTTP requests related to orders")
Component(service, "OrderService", "Spring Service", "Encapsulates business logic of order processing")
Component(repository, "OrderRepository", "JPA Repository", "Provides order data persistence")


###### 4.5.1.3.3. Interfaces
Show how components provide functionality to each other or to the external world (e.g., API).

**Syntax:**

Rel_U(to, from, "interface label", "technology")

*   `to`, `from` - aliases of connected elements.
*   `interface label` - name of interface/API (e.g., "getOrderById").
*   `technology` - technology/protocol (e.g., "REST", "Java Interface").

**Example:**
plantuml
Rel_U(controller, service, "Order API", "Java Interface")


###### 4.5.1.3.4. Relationships
Show interaction between components. Indicate the nature of interaction.

**Syntax:**

Rel(from, to, "label", "technology")

*   `from`, `to` - aliases of connected elements.
*   `label` - description of interaction (e.g., "calls", "uses").
*   `technology` - technology/protocol (e.g., "method call", "REST").

**Example:**
plantuml
Rel(service, repository, "uses", "JPA")


###### 4.5.1.3.5. Databases and External Dependencies
To show interaction with DB or external services inside the container.


ContainerDb(alias, "label", "technology", "optional description")


**Example:**
plantuml
ContainerDb(database, "Orders Database", "PostgreSQL", "Stores order data")


##### 4.5.1.4. Component Grouping
For visual organization of components by responsibilities or layers.


Boundary(alias, "label") {
    Component(component1, "Component1")
    Component(component2, "Component2")
}


**Example:**
plantuml
Boundary(web_layer, "Web Layer") {
    Component(controller, "OrderController")
}
Boundary(service_layer, "Service Layer") {
    Component(service, "OrderService")
}
Boundary(persistence_layer, "Persistence Layer") {
    Component(repository, "OrderRepository")
}


##### 4.5.1.5. Legend
For official documentation, it is recommended to add a legend.


SHOW_LEGEND()


##### 4.5.1.6. Complete Diagram Example

plantuml
@startuml
!include <C4/C4_Component>

Title Component Diagram - Backend API (order microservice)

Container(api, "Order Service", "Spring Boot", "Microservice for order management")

Boundary(api_boundary, "Order Service Components") {
    Component(order_controller, "OrderController", "REST Controller", "Handles HTTP requests")
    Component(order_service, "OrderService", "Spring Service", "Order business logic")
    Component(order_repository, "OrderRepository", "JPA Repository", "Data access")
    Component(inventory_client, "InventoryClient", "Feign Client", "Calls inventory service")
    Component(notification_service, "NotificationService", "Spring Service", "Sending notifications")
}

ContainerDb(order_db, "Order Database", "PostgreSQL", "Order storage")
System_Ext(inventory_service, "Inventory Service", "Inventory management service")
System_Ext(email_service, "Email Service", "Email sending service")

Rel(order_controller, order_service, "calls", "Java Interface")
Rel(order_service, order_repository, "uses", "JPA")
Rel(order_service, inventory_client, "checks availability", "REST")
Rel(order_service, notification_service, "requests notification", "Java Interface")
Rel(order_repository, order_db, "saves to", "JDBC")
Rel(inventory_client, inventory_service, "calls API", "HTTP/REST")
Rel(notification_service, email_service, "sends request", "SMTP")

SHOW_LEGEND()

@enduml


##### 4.5.1.7. Diagram Quality Checklist
Before saving, check the diagram:
1.  [ ] **Directive included** `!include <C4/C4_Component>`
2.  [ ] **Has clear title** (`Title`) with indication of detailed container.
3.  [ ] **All relationships** are labeled (what action is performed).
4.  [ ] **Key interfaces** between components are shown.
5.  [ ] **No excessive details** (no need to show all methods and classes).
6.  [ ] **Aliases** of elements are unique and written in Latin with English decoding in brackets.
7.  [ ] **Legend** (`SHOW_LEGEND()`) added for official artifacts.
8.  [ ] **Syntax** Quality of PlantUML diagrams in C4 notation: Diagrams must not contradict the syntax specified in https://github.com/plantuml-stdlib/C4-PlantUML
9.  [ ] Ask the user for which other containers it is necessary to draw a component diagram
10. [ ] **Upon completion** Ask the user which other documents need to be generated or adjusted, providing him with a list.

**File name format:** `c4_Level_3_component_diagram_[ProjectName]_([ContainerName])_v[version number (starting from 1)].plantuml`

