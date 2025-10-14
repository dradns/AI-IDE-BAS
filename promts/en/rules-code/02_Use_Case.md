### 4.4. Use Cases (UC, Use Cases, UC, use cases)
**Instructions for Writing Use Cases for an AI Agent**

#### 4.4.1. Content
1. [Use Case Template](#use-case-template)
2. [Quality Metrics](#quality-metrics)
3. [Validation Rules](#validation-rules)
4. [Use Case Examples](#use-case-examples)
5. [Quality Criteria](#quality-criteria)

---

#### 4.4.2. Use Case Template

##### 4.4.2.1. Mandatory Structure (9 elements):

| № | Element | Description | Example |
|---|---------|----------|---------|
| 1 | **Name** | Verb + Noun + Context | "Creating an Order by a Customer" |
| 2 | **User Story (US)** | "As a [role], I want [functionality], so that [value]" | US-1: As a customer, I want to create an order... |
| 3 | **Participants** | Primary actor + secondary actors | Customer, System, CRM, Email service |
| 4 | **Preconditions** | What must be completed before start | User is authorized |
| 5 | **Constraints** | System/business constraints | Maximum 10 items per order |
| 6 | **Trigger** | Event that initiates the scenario | Clicking the "Place Order" button |
| 7 | **Main Scenario** | Happy path - sequence of steps | 1. User selects items... |
| 8 | **Alternative Scenarios** | Branching from the main flow | Step 3: If item is out of stock... |
| 9 | **Postconditions** | Result of scenario execution | Order created and saved in DB |

---

#### 4.4.3. Quality Metrics

##### 4.4.3.1. Target Indicators:
- **Structure Completeness**: 9/9 mandatory elements = 100%
- **Scenario Coverage**: Main + minimum 2 alternative = excellent quality
- **Step Detail**: 5-15 steps in main scenario = optimal
- **Architecture Cohesion**: 100% of actors must be present in the system architecture

##### 4.4.3.2. Scoring System:
- **Excellent Quality**: 90-100% compliance with metrics
- **Good Quality**: 70-89% compliance with metrics
- **Needs Improvement**: <70% compliance with metrics

---

#### 4.4.4. Validation Rules

##### 4.4.4.1. Automatic Checks:

###### 4.4.4.1.1. Structural Validation

✓ All 9 mandatory elements are present
✓ Name contains an action verb
✓ User Story conforms to the "As a-I want-So that" format
✓ Minimum 1 primary actor specified


###### 4.4.4.1.2. Logical Validation

✓ Trigger is logically connected to the main scenario
✓ Alternative scenarios reference steps from the main one
✓ Postconditions are achievable through the main scenario
✓ Preconditions do not contradict business logic


###### 4.4.4.1.3. Integration Validation

✓ Actors correspond to roles from User Stories
✓ System components are present in the architecture diagram
✓ API methods are specified in the technical specification


---

#### 4.4.5. Use Case Examples

##### 4.4.5.1. Example 1: Quick Feedback Request

| **Element** | **Description** |
|-------------|--------------|
| **Name** | UC-1. Submitting a Quick Request via Feedback Form |
| **User Story** | US-1: As a system user, I want to quickly submit a request to save time filling out the form |
| **Participants** | • Primary: System User<br>• Secondary: Web Interface, Backend API, CRM system |
| **Preconditions** | • User is authorized<br>• Request submission form is open<br>• Quick access feature toggle is enabled |
| **Constraints** | • Drawer is only available when creating a request<br>• Maximum 5 templates to choose from |
| **Trigger** | User clicks the quick access element in the form |
| **Main Scenario** | 1. User opens the request submission form<br>2. System displays the form with the quick access element<br>3. User clicks on the quick access element<br>4. System opens a drawer with link-buttons to templates<br>5. User selects a suitable template<br>6. System redirects to a pre-filled form<br>7. User supplements the missing data<br>8. System saves the request |
| **Alternative Scenarios** | **Step 3**: If user is new → show "Support" notification<br>**Step 4**: When loading templates → show loader<br>**Step 5**: 4XX/5XX error → message "Loading error, please try again later"<br>**Step 6**: Closing drawer via "X" or outside click → return to main form |
| **Postconditions** | • Request created and saved in CRM<br>• User received confirmation<br>• Function usage metrics sent |

##### 4.4.5.2. Example 2: User Registration

| **Element** | **Description** |
|-------------|--------------|
| **Name** | UC-2. Registering a New User in the System |
| **User Story** | US-2: As a new user, I want to register in the system to get access to personal functions |
| **Participants** | • Primary: Unregistered User<br>• Secondary: Web Form, Registration API, Email Service, Database |
| **Preconditions** | • User is on the registration page<br>• Email service is available<br>• Database is available |
| **Constraints** | • Email must be unique<br>• Password minimum 8 characters<br>• Registration only available with confirmed email |
| **Trigger** | User clicks the "Register" button |
| **Main Scenario** | 1. User fills out the form (name, email, password)<br>2. System validates entered data<br>3. System checks email uniqueness<br>4. System creates an account with "unconfirmed" status<br>5. System sends confirmation email<br>6. User clicks the link in the email<br>7. System activates the account<br>8. System displays successful registration message |
| **Alternative Scenarios** | **Step 2**: Data is invalid → show validation errors<br>**Step 3**: Email already exists → offer password recovery<br>**Step 5**: Email sending error → save account, show instructions<br>**Step 6**: Link expired → offer to resend |
| **Postconditions** | • Account created and activated<br>• User can log in<br>• Welcome email sent |

---

#### 4.4.6. Quality Criteria for AI

##### 4.4.6.1. Structural Requirements
- **Completeness**: All 9 elements must be filled
- **Detail**: Main scenario 5-15 steps
- **Coverage**: Minimum 2-3 alternative scenarios

##### 4.4.6.2. Logical Requirements
- **Sequence**: Steps are logically connected
- **Realism**: Scenarios are feasible within the system
- **Branching Completeness**: Main error cases covered

##### 4.4.6.3. Integration Requirements
- **Cohesion**: Actors correspond to architecture
- **Traceability**: Use Case is linked to User Story
- **Technical Feasibility**: System constraints considered

##### 4.4.6.4. Special Requirements
- **Feature Toggles**: Consider conditional functions (test:true)
- **Platform Specificity**: Web/mobile differences explicitly stated
- **Error Handling**: Behavior for 4XX/5XX described
- **UX**: Loaders, notifications, form closing considered

---

#### 4.4.7. Use Case Validation Checklist

##### 4.4.7.1. Mandatory Check:
- [ ] ✅ Name contains action and context
- [ ] ✅ User Story in "As a-I want-So that" format
- [ ] ✅ All participants specified (primary + secondary)
- [ ] ✅ Preconditions are achievable
- [ ] ✅ Constraints are realistic
- [ ] ✅ Trigger clearly defined
- [ ] ✅ Main scenario 5-15 steps
- [ ] ✅ Alternative scenarios reference the main one
- [ ] ✅ Postconditions are achievable

##### 4.4.7.2. Quality Check:
- [ ] 🎯 Scenarios cover 80%+ of real cases
- [ ] 🎯 Actors are in the system architecture
- [ ] 🎯 Technical feasibility confirmed
- [ ] 🎯 Error handling detailed

**Goal**: Create Use Cases ready for handoff to development without additional clarifications.

