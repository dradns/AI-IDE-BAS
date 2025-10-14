### 4.4. [C4 Level 2] Container Diagram
#### 4.4.1. Instruction for Creating Container Diagrams (C4 Level 2) in PlantUML

##### 4.4.1.1. Concept and Purpose
**Container Diagram** is the second level diagram in C4 notation. It details the **system** (from the context diagram), showing which large executable units (containers) it consists of and how they interact.

*   **Audience:** Developers, DevOps engineers, architects.
*   **Purpose:** Answer the questions: *"How does the system work under the hood?"*, *"What large components does it consist of?"*, *"How do they communicate?"*.
*   **Key Elements:** Containers (applications, DBs), relationships between them and key technologies.

Prohibition on specifying used technologies: Before designing diagrams, it is necessary to clarify with the user the technology stack used in the project; if the user cannot specify the stack, then exclude the indication of the technology stack on all levels of C4 diagrams.

If a file with the diagram exists, it is necessary to ask the user whether to update the current file or save the diagram to a file with the next version.
##### 4.4.1.2. Basic PlantUML Syntax for C4

To use C4 notation in PlantUML, it is necessary to include the corresponding library.
The diagram must comply with the syntax specified in https://github.com/plantuml-stdlib/C4-PlantUML

**Mandatory line at the beginning of the script:**
plantuml
@startuml
!include <C4/C4_Container>
' Your diagram code here...
@enduml


##### 4.4.1.3. Basic Elements and Their Declaration

##### 4.4.1.3.1. System (Context Clarification)
The top-level element that we are detailing.


System(alias, "label", "optional description")

*   `alias` - unique element identifier (Latin, no spaces).
*   `label` - displayed name.
*   `description` - optional description.

**Example:**
plantuml
System(online_banking, "Online Banking", "Provides customers with access to their accounts and transactions via web and mobile")


##### 4.4.1.3.2. Containers
The main building blocks of the diagram. These are runnable processes/applications or data stores.

**Declaration Syntax:**

Container(alias, "label", "technology", "optional description")

*   `technology` - indication of technology (e.g., "React", "Spring Boot", "PostgreSQL").

**Container Types:**
*   `Container()` - universal container (application, service).
*   `ContainerDb()` - container for database.
*   `ContainerQueue()` - container for message queue (broker).
*   `Container_Ext()` - external container (managed by third party).

**Examples:**
plantuml
Container(spa, "Web Application", "Single-Page Application for customers")
ContainerDb(db, "Database", "Stores all financial data and user logins")
Container(backend_api, "Backend API", "Provides REST API for web and mobile clients")
Container_Ext(email_service, "Email Service", "External service for sending notifications")


##### 4.4.1.3.3. Relationships
Show interaction between containers. Indicate the protocol or technology of interaction.

**Syntax:**

Rel(from, to, "label", "technology")

*   `from`, `to` - aliases of connected elements.
*   `label` - description of interaction (e.g., "Reads/Writes").
*   `technology` - technology/protocol (e.g., "REST API", "JDBC", "Kafka").

**Example:**
plantuml
Rel(spa, backend_api, "Calls API")
Rel(backend_api, db, "Reads/writes")
Rel(backend_api, email_service, "Sends notifications")


#### 4.4.1.4. Grouping and Boundaries (Boundaries)
To visually highlight parts of the system belonging to different domains or teams, use boundaries.

**Syntax:**

Boundary(alias, "label") {
    container1 = Container(...)
    container2 = Container(...)
    Rel(container1, container2, ...)
}


**Example:**
plantuml
Boundary(boundary_backend, "Backend Domain") {
    Container(api_gateway, "API Gateway")
    Container(user_service, "User Service")
    Container(account_service, "Account Service")
    Rel(api_gateway, user_service, "Calls")
    Rel(api_gateway, account_service, "Calls")
}


#### 4.4.1.5. Legend
For official documentation, it is recommended to add a legend explaining the diagram elements.


SHOW_LEGEND()


#### 4.4.1.6. Complete Diagram Example

plantuml
@startuml
!include <C4/C4_Container>

Title "Container Diagram - Online Banking System"

Person(customer, "Customer", "Uses online banking")

System_Boundary(online_banking_system, "Online Banking") {
    Container(spa, "Web Application","Single-Page Application")
    Container(mobile_app, "Mobile Application","Native mobile application")
    Container(backend_api, "Backend API", "Main business logic service")
    ContainerDb(db, "Database",  "Stores user data and transactions")
}

System_Ext(processing_system, "Payment System", "External system for payment processing")

Rel(customer, spa, "Visits website")
Rel(customer, mobile_app, "Uses application")
Rel(spa, backend_api, "Calls API")
Rel(mobile_app, backend_api, "Calls API")
Rel(backend_api, db, "Reads/writes")
Rel(backend_api, processing_system, "Sends payment request")

SHOW_LEGEND()
@enduml


#### 4.4.1.7. Diagram Quality Checklist
Before saving, check the diagram:
1.  [ ] **Directive included** `!include <C4/C4_Container>`
2.  [ ] **Roles** All user roles specified in other files must be accounted for on this diagram.
3.  [ ] **Has clear title** (`Title`).
4.  [ ] **All containers** Do not have technology indication.
5.  [ ] **All relationships** are labeled (what action is performed without protocol indication).
6.  [ ] **No excessive details** (no need to show all microservices if there are dozens).
7.  [ ] **Aliases** of elements are unique and written in Latin.
8.  [ ] **Legend** (`SHOW_LEGEND()`) added for official artifacts.
9.  [ ] **In case of microservice architecture:** A service must not create more than two databases of the same type.
10. [ ] **Prohibition on specifying used technologies:** Before designing diagrams, it is necessary to clarify with the user the technology stack used in the project; if the user cannot specify the stack, then exclude the indication of the technology stack on all levels of C4 diagrams.
11. [ ] **User roles check** The diagram must indicate all user roles that are on the context diagram (C4 Level 1).
12. [ ] **Upon completion** Ask the user which other documents need to be generated or adjusted, providing him with a list.

**File name format:** `c4_Level_2_containers_diagram_[ProjectName]_v[version number (starting from 1)].plantuml`

