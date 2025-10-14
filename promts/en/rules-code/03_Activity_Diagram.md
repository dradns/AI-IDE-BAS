### 4.5. Activity Diagram of the Business Process in PlantUML Format (Activity Diagram)
**Instructions for creating Activity diagrams for an AI agent**

#### 4.5.1. Contents
1. [Basics and Requirements](#basics-and-requirements)
2. [Diagram Structure](#diagram-structure)
3. [Quality Metrics](#quality-metrics)
4. [Validation Rules](#validation-rules)
5. [Basic Template](#basic-template)
6. [Diagram Elements](#diagram-elements)
7. [Control Constructs](#control-constructs)
8. [Concurrency Handling](#concurrency-handling)
9. [Integration with Artifacts](#integration-with-artifacts)
10. [Standard Patterns](#standard-patterns)
11. [Quality Checklist](#quality-checklist)

---

#### 4.5.2. Basics and Requirements

##### 4.5.2.1. Mandatory Input Artifacts:
- **User Story** - to understand the business goal and process boundaries
- **Use Case** - for a detailed description of the action flow
- **Business Process Description** - to understand the logic and rules

##### 4.5.2.2. Additional Artifacts:
- Technical specification, Business Rules, Workflow documentation
- Sequence diagrams for understanding interactions

##### 4.5.2.3. Activity Diagram Purpose:
- Modeling the flow of actions and decision making
- Visualization of parallel processes and synchronization
- Demonstrating business process logic from start to finish
- Identifying decision points and alternative paths

---

#### 4.5.3. Diagram Structure

##### 4.5.3.1. Title and Settings
plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title Process Name from User Story


##### 4.5.3.2. Swimlanes (Responsibility Lanes)
plantuml
|Role 1|
start
:Action 1;

|Role 2|
:Action 2;

|System|
:Automatic Action;


##### 4.5.3.3. Structural Organization
- **Start**: mandatory starting point
- **Actions**: description of specific steps
- **Decisions**: logic branching points
- **Concurrency**: fork/join for concurrent actions
- **Completion**: end or stop

---

#### 4.5.4. Quality Metrics

##### 4.5.4.1. Target Indicators:
- **Flow Coverage**: 100% of steps from the Use Case are represented
- **Logical Grouping**: use of swimlanes for roles
- **Decision Detailing**: every 'if' has all possible outcomes
- **Concurrency**: concurrent processes are identified and modeled
- **Error Handling**: minimum of 2 error handling flows

##### 4.5.4.2. Scoring System:
- **Excellent Quality**: ≥90% compliance with metrics + full Use Case coverage
- **Good Quality**: 70-89% compliance with metrics
- **Needs Improvement**: <70% compliance with metrics

##### 4.5.4.3. Specific Metrics:
- Number of swimlanes: 2-6 (according to roles from the Use Case)
- Number of decisions: 1-5 for every 10 actions
- Nesting depth: no more than 3 levels
- Parallel flows: all possible parallel processes are identified

---

#### 4.5.5. Validation Rules

##### 4.5.5.1. Automatic Checks:

✓ Starts with @startuml, ends with @enduml
✓ Has a single start point
✓ All paths lead to end/stop
✓ Every 'if' has corresponding then/else branches
✓ All forks have corresponding joins
✓ Swimlanes correspond to roles from the Use Case
✓ Actions contain active verbs
✓ No "dangling" actions without input/output
✓ Decisions are formulated as questions


##### 4.5.5.2. Semantic Checks:

✓ Every action corresponds to a step from the Use Case
✓ The sequence of actions is logically connected
✓ Roles in swimlanes correspond to actors from the User Story
✓ All alternative flows from the Use Case are represented
✓ Error handling covers main exceptions

#### 4.5.6. Basic Template

plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title [Process Name from User Story]

|[Role from User Story]|
start
:[Initial Action];

if ([Decision Condition]?) then (yes)
  :[Action on Positive Outcome];
else (no)
  :[Action on Negative Outcome];
  stop
endif

|[System/Other Role]|
:[Automatic or Delegated Action];

|[Role from User Story]|
:[Final Action];
end

@enduml


---

#### 4.5.7. Diagram Elements

##### 4.5.7.1. Basic Elements:

###### 4.5.7.1.1. Start and End
plantuml
start                    // Single entry point
end                      // Normal completion
stop                     // Emergency termination
kill                     // Forced termination
detach                   // Asynchronous termination


###### 4.5.7.1.2. Activities
plantuml
:Action with active verb;
:Validate data correctness;
:Send notification;
:[Action in square brackets for system];


**Activity Naming Rules:**
- Start with an active verb in infinitive form
- Be specific and measurable
- Avoid technical details, focus on business logic
- Length: 2-6 words

###### 4.5.7.1.3. Decision Points
plantuml
if (Data is valid?) then (yes)
  :Continue processing;
else (no)
  :Return validation error;
  stop
endif

// Multiple options
switch (User type?)
case (Admin)
  :Show admin panel;
case (User)
  :Show user interface;
case (Guest)
  :Show guest page;
endswitch


###### 4.5.7.1.4. Parallel Processing
plantuml
fork
  :Send email;
fork again
  :Send SMS;
fork again
  :Write to audit log;
end fork

// With synchronization
fork
  :Process payment;
fork again
  :Reserve product;
end merge  // Wait for all branches to complete


###### 4.5.7.1.5. Loops and Repetitions
plantuml
// Simple loop
repeat
  :Get next item;
  :Process item;
repeat while (More items exist?)

// While loop
while (Continue condition?)
  :Perform action;
endwhile

// For loop
repeat :i = 1;
  :Process item i;
  :i = i + 1;
repeat while (i <= count?)


---

#### 4.5.8. Control Constructs

##### 4.5.8.1. Simple Branching
plantuml
if (User is authenticated?) then (yes)
  :Show personal data;
else (no)
  :Redirect to login page;
  stop
endif


##### 4.5.8.2. Multiple Branching
plantuml
switch (Order status?)
case (New)
  :Send for processing;
case (In Progress)
  :Continue processing;
case (Completed)
  :Send to customer;
case (Cancelled)
  :Refund payment;
  stop
endswitch


##### 4.5.8.3. Nested Conditions
plantuml
if (User is authenticated?) then (yes)
  if (Has admin rights?) then (yes)
    :Show admin functions;
  else (no)
    :Show regular interface;
  endif
else (no)
  :Show login form;
endif


##### 4.5.8.4. Exception Handling
plantuml
:Attempt to perform operation;
note right: May generate error

if (Operation successful?) then (yes)
  :Continue execution;
else (no)
  if (Critical error?) then (yes)
    :Log error;
    :Notify administrator;
    stop
  else (no)
    :Show message to user;
    :Offer to retry;
  endif
endif


---

#### 4.5.9. Concurrency Handling

##### 4.5.9.1. Independent Parallel Processes
plantuml
fork
  :Send email notification;
fork again
  :Send push notification;
fork again
  :Write to audit log;
end fork

:Continue main process;


##### 4.5.9.2. Synchronized Processes
plantuml
fork
  :Check product availability;
fork again
  :Check credit limit;
fork again
  :Check delivery address;
end merge

if (All checks passed?) then (yes)
  :Create order;
else (no)
  :Reject order;
  stop
endif


##### 4.5.9.3. Conditional Concurrency
plantuml
if (Express delivery required?) then (yes)
  fork
    :Reserve product;
  fork again
    :Find nearest warehouse;
  fork again
    :Prepare courier;
  end merge
else (no)
  :Standard order processing;
endif


---

#### 4.5.10. Integration with Artifacts

##### 4.5.10.1. Connection with User Story:
- **Roles in swimlanes** = roles from "As a [role]"
- **Main flow** = implementation of "I want to [action]"
- **Diagram result** = achievement of "So that [benefit]"

##### 4.5.10.2. Connection with Use Case:
- **Main UC flow** = main sequence of actions
- **Alternative UC flows** = else/case branches
- **UC exceptions** = error handling blocks
- **UC preconditions** = conditions at the beginning of the diagram
- **UC postconditions** = states at end points

##### 4.5.10.3. Connection with Business Rules:
- **Decision rules** = conditions in if/switch
- **Business constraints** = validation blocks
- **Approval processes** = sequences in corresponding swimlanes

##### 4.5.10.4. Connection with technical artifacts:
- **API specification** = automated actions
- **Database schema** = data persistence actions
- **Sequence diagrams** = detailing interactions between swimlanes

---

#### 4.5.11. Standard Patterns

##### 4.5.11.1. "Request-Processing-Response" Pattern
plantuml
|User|
start
:Send request;

|System|
:Receive request;
:Validate data;

if (Data valid?) then (yes)
  :Process request;
  :Form response;
else (no)
  :Form error;
endif

|User|
:Receive response;
end


##### 4.5.11.2. "Approval Workflow" Pattern
plantuml
|Initiator|
start
:Create request;

|Manager|
:Review request;

if (Approve?) then (yes)
  if (Amount > limit?) then (yes)
    |Director|
    :Final approval;
    
    if (Approve?) then (yes)
      |System|
      :Execute operation;
    else (no)
      :Reject;
      stop
    endif
  else (no)
    |System|
    :Execute operation;
  endif
else (no)
  :Reject;
  stop
endif

|Initiator|
:Receive notification;
end


##### 4.5.11.3. "Batch Processing" Pattern
plantuml
|System|
start
:Get item list;

repeat
  :Take next item;
  
  fork
    :Process item;
  fork again
    :Record progress;
  end fork
  
repeat while (Unprocessed items exist?)

:Generate report;
:Send completion notification;
end


##### 4.5.11.4. "Error Recovery" Pattern
plantuml
|System|
start
:retry_count = 0;

repeat
  :Attempt to perform operation;
  
  if (Operation successful?) then (yes)
    :Record result;
    end
  else (no)
    :retry_count++;
    
    if (retry_count < max_retries?) then (yes)
      :Wait interval;
    else (no)
      :Log critical error;
      :Notify administrator;
      stop
    endif
  endif
repeat while (retry_count < max_retries?)


---

#### 4.5.12. Swimlanes and Roles

##### 4.5.12.1. Swimlanes usage rules:
1. **One swimlane = one role/system**
2. **Maximum 6 swimlanes** (for readability)
3. **Roles taken from User Story and Use Case**
4. **Systems separated from human roles**

##### 4.5.12.2. Standard swimlanes:
plantuml
|User|        // Main role from User Story
|System|             // Automated processes
|Administrator|       // Management actions
|External System|     // Integrations
|Database|         // Only for complex processes


##### 4.5.12.3. Transitions between swimlanes:
- Control transfer = transition to action in another swimlane
- Parallel work = fork with actions in different swimlanes
- Synchronization = merge of actions from different swimlanes

---

#### 4.5.13. Typical Errors and How to Avoid Them

##### 4.5.13.1. Overly Technical Detail
❌ **Incorrect:**
plantuml
:Execute SQL SELECT query on users table;
:Deserialize JSON response;
:Update Redux store;


✅ **Correct:**
plantuml
:Get user data;
:Process received information;
:Update display;


##### 4.5.13.2. Mixing Abstraction Levels
❌ **Incorrect:**
plantuml
:Click "Send" button;
:Validate email address;
:Send HTTP POST request;
:Show success message;


✅ **Correct:**
plantuml
:Initiate form submission;
:Check data correctness;
:Transfer data to system;
:Notify about result;


##### 4.5.13.3. Lack of Error Handling
❌ **Incorrect:**
plantuml
:Send request;
:Receive response;
:Show result;


✅ **Correct:**
plantuml
:Send request;

if (Request successful?) then (yes)
  :Show result;
else (no)
  :Show error message;
endif


##### 4.5.13.4. Incorrect Concurrency Usage
❌ **Incorrect:** (sequential actions as parallel)
plantuml
fork
  :Authenticate;
fork again
  :Get profile data;
end fork


✅ **Correct:**
plantuml
:Authenticate;

fork
  :Send welcome email;
fork again
  :Record audit event;
end fork

:Redirect to main page;


---

#### 4.5.14. Special Elements

##### 4.5.14.1. Notes and Comments
plantuml
:Perform complex operation;
note right
  This operation may take
  up to 30 seconds
end note

:Another action;
note left: Quick operation


##### 4.5.14.2. Related Subprocesses
plantuml
:Initiate approval process;
note right: See separate diagram "Approval Process"

:Wait for approval result;


##### 4.5.14.3. Entry/Exit Points
plantuml
// Multiple entry points
start
:Normal entry;
end

(*) --> :Emergency entry;


##### 4.5.14.4. Time Constraints
plantuml
:Send request;
:Wait for response for 30 sec;

if (Response received on time?) then (yes)
  :Process response;
else (no)
  :Handle timeout;
  stop
endif


---

#### 4.5.15. Quality Checklist

##### 4.5.15.1. Structural Verification:
- [ ] Diagram starts with `@startuml` and ends with `@enduml`
- [ ] There is a single `start` point
- [ ] All paths lead to `end`, `stop`, `kill` or `detach`
- [ ] Every `if` has corresponding `endif`
- [ ] Every `fork` has corresponding `end fork` or `end merge`
- [ ] Every `repeat` has corresponding `repeat while`
- [ ] All swimlanes have meaningful names

##### 4.5.15.2. Semantic Verification:
- [ ] Diagram covers the main flow from Use Case
- [ ] Alternative flows from Use Case are represented
- [ ] Roles in swimlanes correspond to User Story
- [ ] Every action starts with an active verb
- [ ] Decisions are formulated as questions with clear answer options
- [ ] Error handling is present for critical operations
- [ ] Parallel processes are identified and modeled correctly

##### 4.5.15.3. Readability Check:
- [ ] Number of swimlanes: 2-6
- [ ] Condition nesting depth: no more than 3 levels
- [ ] Action length: 2-6 words
- [ ] Logical action groups can be visually distinguished
- [ ] Diagram fits on one A4 page

##### 4.5.15.4. Requirements Compliance Check:
- [ ] All steps from Use Case are represented
- [ ] Business rules are reflected in conditions
- [ ] Roles and responsibilities are clearly separated
- [ ] Decision points correspond to business logic
- [ ] Diagram result achieves the goal from User Story

##### 4.5.15.5. Final Check:
- [ ] Diagram compiles without errors in PlantUML
- [ ] Title reflects the essence of the process
- [ ] Visual design complies with standards
- [ ] Diagram can be understood by stakeholders without additional explanations

---

#### 4.5.16. Typical Diagram Examples

##### 4.5.16.1. Simple Linear Process
plantuml
@startuml
title User Registration Process

|User|
start
:Fill registration form;
:Click "Register";

|System|
:Get form data;
:Validate data;

if (Data valid?) then (yes)
  :Create account;
  :Send confirmation email;
  
  |User|
  :Receive email;
  :Follow confirmation link;
  
  |System|
  :Activate account;
  :Redirect to main page;
  
  |User|
  :Start working with system;
  end
else (no)
  |User|
  :See error messages;
  :Correct data;
  stop
endif

@enduml


##### 4.5.16.2. Process with Parallel Tasks
plantuml
@startuml
title Order Processing

|Customer|
start
:Add items to cart;
:Proceed to checkout;
:Specify delivery address;
:Select payment method;

|System|
fork
  :Calculate delivery cost;
fork again
  :Check item availability;
fork again
  :Validate payment data;
end merge

if (All checks successful?) then (yes)
  :Create order;
  
  fork
    :Reserve items;
  fork again
    :Send notification to seller;
  fork again
    :Initiate payment process;
  end fork
  
  |Customer|
  :Receive order confirmation;
  end
else (no)
  :Show errors;
  
  |Customer|
  :Correct order data;
  stop
endif

@enduml


This instruction ensures the creation of high-quality Activity diagrams that accurately reflect business processes and are easily readable by all stakeholders.

