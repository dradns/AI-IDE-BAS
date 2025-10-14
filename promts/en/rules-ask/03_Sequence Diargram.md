### 4.5. Sequence Diagram
**Instructions for creating Sequence diagrams for AI agent**

#### 4.5.1. Content
1. [Basics and requirements](#basics-and-requirements)
2. [Diagram structure](#diagram-structure)
3. [Quality metrics](#quality-metrics)
4. [Validation rules](#validation-rules)
5. [Basic template](#basic-template)
6. [Interaction types](#interaction-types)
7. [Integration with artifacts](#integration-with-artifacts)
8. [Quality checklist](#quality-checklist)

---

#### 4.5.2. Basics and requirements

##### 4.5.2.1. Mandatory input artifacts:
- **User Story** - for understanding business scenario
- **Use Case** - for detailed interaction flow
- **Architecture diagram** - for participants and connections

##### 4.5.2.2. Additional artifacts:
- API documentation, technical specification, deployment diagram

---

#### 4.5.3. Diagram structure

##### 4.5.3.1. Header and settings
plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 


##### 4.5.3.2. Participants (strict typing)
plantuml
actor User as "Role from User Story"
participant Browser as "Browser"
participant "Web Server" as WebServer
participant "Application Server" as AppServer
participant "Database Server" as DBServer


##### 4.5.3.3. Stage grouping
plantuml
== Logical stage name ==


##### 4.5.3.4. Interactions with protocols
plantuml
User -> Browser : Business action
Browser -> WebServer : HTTP GET/POST /endpoint
WebServer -> AppServer : REST API: method
AppServer -> DBServer : JDBC: SELECT/INSERT


---

#### 4.5.4. Quality metrics

##### 4.5.4.1. Target indicators:
- **Participant coverage**: 100% from architecture diagram
- **Logical grouping**: 3-7 stages with clear names
- **Protocol detailing**: 90% interactions with technology specification
- **Error handling**: minimum 2 alternative scenarios

##### 4.5.4.2. Scoring system:
- **Excellent quality**: ≥90% metric compliance
- **Good quality**: 70-89% metric compliance
- **Needs improvement**: <70% metric compliance

---

#### 4.5.5. Validation rules

##### 4.5.5.1. Automatic checks:

✓ Starts with @startuml, ends with @enduml
✓ Actor role corresponds to User Story
✓ Participants present in architecture diagram
✓ Each stage has name in format "== Name =="
✓ Protocols specified for technical interactions
✓ Synchronous/asynchronous arrows used correctly
✓ Has minimum 1 alternative flow (alt/opt/loop)


---

#### 4.5.6. Basic template

plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 

actor User as "[Role from User Story]"
participant Browser as "Browser"
participant "Web Server" as WebServer
participant "Application Server" as AppServer
participant "Database Server" as DBServer

== Action initiation ==
User -> Browser : [Business action]
Browser -> WebServer : HTTP [method] /[endpoint]

== Request processing ==
WebServer -> AppServer : REST API: [method]

== Data operations ==
AppServer -> DBServer : JDBC: [SQL operation]
DBServer --> AppServer : [Result]

== Result return ==
AppServer --> WebServer : JSON: [data]
WebServer --> Browser : HTTP 200 OK
Browser --> User : [Result display]

@enduml


---

#### 4.5.7. Interaction types

##### 4.5.7.1. Protocols and syntax:
| Type | Syntax | Example |
|-----|-----------|--------|
| **HTTP** | `HTTP [method] /endpoint` | `HTTP GET /api/users` |
| **REST API** | `REST API: [operation]` | `REST API: getUserData` |
| **Database** | `JDBC: [SQL]` | `JDBC: SELECT * FROM users` |
| **Message Queue** | `MQ: [operation]` | `MQ: publish userCreated` |
| **gRPC** | `gRPC: [method]` | `gRPC: GetUserProfile` |

##### 4.5.7.2. Arrow types:
- `->` and `-->` - synchronous calls/responses
- `->>` and `-->>` - asynchronous calls/responses
- `->` to self - internal processing

##### 4.5.7.3. Control constructs:
plantuml
alt Successful scenario
    // main flow
else Error
    // error handling
end

opt Conditional execution
    // optional actions
end

loop Repetition
    // cyclic actions
end


---

#### 4.5.8. Integration with artifacts

##### 4.5.8.1. Connection with User Story:
- **Diagram actor** = role from US
- **Main flow** = action description from US
- **Result** = expected benefit from US

##### 4.5.8.2. Connection with Use Case:
- **Main UC scenario** = main sequence
- **Alternative UC flows** = alt/opt blocks in diagram
- **UC exceptions** = error handling blocks

##### 4.5.8.3. Connection with architecture:
- **Sequence participants** = components from architecture
- **Interactions** = connections between components
- **Protocols** = integration technologies

---

#### 4.5.9. Standard stages and names

##### 4.5.9.1. Typical groups:
1. **Initiation**: "User initiates action"
2. **Authentication**: "Access rights verification"
3. **Validation**: "Input data validation"
4. **Processing**: "Business logic and calculations"
5. **Storage**: "Database operations"
6. **Notifications**: "Message sending"
7. **Response**: "Returning result to user"

##### 4.5.9.2. Specific name examples:
- "== Loading orders list =="
- "== Payment data correctness verification =="
- "== Sales report generation =="

---

#### 4.5.10. Error handling

##### 4.5.10.1. Mandatory error scenarios:
plantuml
alt Successful execution
    AppServer -> DBServer : SELECT query
    DBServer --> AppServer : Data returned
else Database connection error
    AppServer -> DBServer : SELECT query
    DBServer --> AppServer : Error: Connection timeout
    AppServer --> WebServer : HTTP 500 Internal Error
    WebServer --> Browser : Error page
else Data validation error
    AppServer -> AppServer : Validate input
    AppServer --> WebServer : HTTP 400 Bad Request
    WebServer --> Browser : Error message
end


---

#### 4.5.11. Quality checklist

##### 4.5.11.1. Structural verification:
- [ ] ✅ File starts with `@startuml` and ends with `@enduml`
- [ ] ✅ autonumber used for step numbering
- [ ] ✅ Actor corresponds to role from User Story
- [ ] ✅ All participants present in architecture diagram

##### 4.5.11.2. Logical verification:
- [ ] ✅ 3-7 logical stages with clear names
- [ ] ✅ Step sequence corresponds to Use Case
- [ ] ✅ Has alternative flows (alt/opt/loop)
- [ ] ✅ Handling of minimum 2 error types

##### 4.5.11.3. Technical verification:
- [ ] ✅ Protocols specified for all technical calls
- [ ] ✅ HTTP methods and endpoints specified
- [ ] ✅ SQL operations detailed
- [ ] ✅ Synchronous/asynchronous calls correct

##### 4.5.11.4. Integration verification:
- [ ] 🔗 Correspondence to main Use Case scenario
- [ ] 🔗 Coverage of all actors from architecture
- [ ] 🔗 Technical details correspond to API specification

**Goal**: Create Sequence diagrams ready for technical implementation and testing.

---

#### 4.5.12. Style recommendations

##### 4.5.12.1. Naming:
- **Actors**: specific business roles
- **Participants**: architectural components
- **Messages**: business terms for users, technical for systems

##### 4.5.12.2. Detailing:
- **Brevity**: messages up to 50 characters
- **Clarity**: understandable terminology
- **Sequence**: logical call order
- **Grouping**: combining related actions

##### 4.5.12.3. Quality description examples:
✅ "HTTP POST /api/orders - order creation"  
✅ "JDBC: INSERT INTO orders (user_id, total)"  
✅ "Displaying order confirmation page"  

❌ "Makes request"  
❌ "Returns data"  
❌ "System processes"

