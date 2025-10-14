### 4.3. [C4 level 1] Context Diagram
#### 4.3.1. Instruction for Creating Context Diagram (C4 Level 1) in PlantUML
##### 4.3.1.1. Concept and Purpose
**Context Diagram** is the highest level diagram (Level 1) in C4 notation. It shows the system as a whole block and its interaction with the external world.
**Audience:** All stakeholders, including non-technical ones (business customers, managers).
**Purpose:** Answer the questions: *"What does the system do?"*, *"Who uses it?"*, *"What external systems does it interact with?"*
**Key Elements:** System, people/roles (actors), external systems.
Prohibition on specifying used technologies: Before designing diagrams, it is necessary to clarify with the user the technology stack used in the project; if the user cannot specify the stack, then exclude the indication of the technology stack on all levels of C4 diagrams.
If a file with the diagram exists, it is necessary to ask the user whether to update the current file or save the diagram to a file with the next version.
##### 4.3.1.2. Basic PlantUML Syntax for C4
To use C4 notation in PlantUML, it is necessary to include the corresponding library.
**Mandatory line at the beginning of the script:**
plantuml
@startuml
!include <C4/C4_Context>
' Your diagram code here...
@enduml

##### 4.3.1.3. Basic Elements and Their Declaration
###### 4.3.1.3.1. System
The central element of the diagram, which we are designing.

System(alias, "label", "optional description")

*   `alias` - unique element identifier (Latin, no spaces).
*   `label` - displayed system name.
*   `description` - optional brief description of the system's purpose.

**Example:**
plantuml
System(system_a, "Order Management System", "Processes customer orders, manages warehouse and delivery")

###### 4.3.1.3.2. Actors (People/Person)
People or roles who interact with the system.

Person(alias, "label", "optional description")

*   `alias` - unique identifier.
*   `label` - displayed role/person name.

**Example:**
plantuml
Person(customer, "Customer", "Buyer of goods in the online store")
Person(admin, "Administrator", "Manages goods and tracks orders")

###### 4.3.1.3.3. External Systems
Software systems that are outside your team's control but with which your system interacts.

System_Ext(alias, "label", "optional description")

*   `alias` - unique identifier.
*   `label` - displayed external system name.
**Example:**
plantuml
System_Ext(payment_gateway, "Payment Gateway", "Processes credit card payments")
System_Ext(email_service, "Email Notification Service", "Sends emails to customers")

###### 4.3.1.3.4. Relationships
Show interaction between elements. Indicate the nature of interaction.

**Syntax:**

Rel(from, to, "label", "technology")

*   `from`, `to` - aliases of connected elements.
*   `label` - description of interaction (e.g., "Buys goods", "Receives notifications").
*   `technology` - optional indication of technology/protocol (e.g., "Web UI", "REST API"). *Often omitted on context diagram.*

**Example:**
plantuml
Rel(customer, system_a, "Buys goods", "Web UI")
Rel(system_a, payment_gateway, "Initiates payment", "REST API")
Rel(system_a, email_service, "Sends data for notification", "SMTP")
Rel(admin, system_a, "Manages goods", "Web UI")

##### 4.3.1.4. Element Grouping (Boundaries)
To visually highlight internal and external environment, boundaries can be used.


Enterprise_Boundary(alias, "label") {
    ' Elements inside enterprise boundary
}


**Example:**
plantuml
Enterprise_Boundary(enterprise_a, "Our Company") {
    Person(admin, "Administrator")
    System(system_a, "Order Management System")
}
Enterprise_Boundary(enterprise_b, "Partner") {
    System_Ext(payment_gateway, "Payment Gateway")
}

##### 4.3.1.5. Legend
For official documentation, it is recommended to add a legend.


SHOW_LEGEND()

##### 4.3.1.6. Complete Diagram Example

plantuml
@startuml
!include <C4/C4_Context>

Title Context Diagram - Order Management System

Person(customer, "Customer", "Buys goods in the online store")
Person(admin, "Administrator", "Manages catalog and orders")

System(system_a, "Order Management System", "Accepts and processes orders, manages warehouse")

System_Ext(payment_gateway, "Payment Gateway", "Processes card payments")
System_Ext(email_service, "Email Service", "Sends notifications to customers")
System_Ext(erp_system, "ERP System", "Receives data for accounting")

Rel(customer, system_a, "Views catalog, buys goods")
Rel(admin, system_a, "Manages goods and tracks orders")
Rel(system_a, payment_gateway, "Initiates payment", "REST API")
Rel(system_a, email_service, "Sends data for notifications", "SMTP")
Rel(system_a, erp_system, "Exports sales data", "SFTP")

SHOW_LEGEND()

@enduml

##### 4.3.1.7. Diagram Quality Checklist
Before saving, check the diagram:
1.  [ ] **Directive included** `!include <C4/C4_Context>`
2.  [ ] **Has clear title** (`Title`).
3.  [ ] **Only one central system** (the one you are designing).
4.  [ ] **All key users** (actors) and **external systems** are shown.
5.  [ ] **Relationships** are labeled in clear business language (what they do, not how technically implemented).
6.  [ ] **No technical details** of internal system structure (this is the task of container diagram).
7.  [ ] **Aliases** of elements are unique and written in Latin.
8.  [ ] **Legend** (`SHOW_LEGEND()`) added for official artifacts.
9.  [ ] **After saving the file** Ask the user which other documents need to be generated or adjusted, providing him with a list.
**File name format:** `c4_Level_1_context_diagram_[ProjectName]_v[version number (starting from 1)].plantuml`
#### 4.3.2 Quality Metrics
1. Completeness:
   * All key actors present
   * Main integrations reflected
2. Consistency:
   * Names correspond to other artifacts
   * No contradictions with reality
3. Relevance:
   * Diagram version specified
   * Has last update date
#### 4.3.3 Integration with Other Artifacts
1. With User Story:
   * Actors must be coordinated
   * Main scenarios reflected
2. With Component Diagram:
   * External systems duplicated
   * Detail level coordinated
3. With ERD:
   * External DBs correspond to entities

