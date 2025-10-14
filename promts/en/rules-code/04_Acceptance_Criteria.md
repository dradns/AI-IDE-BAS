### 4.6. Acceptance Criteria (AC) 
**Acceptance Criteria Template**

#### 4.6.1. Important: Output Format

All results (templates, examples, checklists) should be output in markdown format. Use markup for lists, tables, code, and headings.

#### 4.6.2. Contents
1. [Introduction](#introduction)
2. [AC Structure](#ac-structure)
3. [Universal AC Template](#universal-ac-template)
4. [Examples of Formulations and Filling](#examples-of-formulations-and-filling)
5. [Quality AC Checklist](#quality-ac-checklist)
6. [Recommendations and Typical Errors](#recommendations-and-typical-errors)
7. [Glossary and Useful Links](#glossary-and-useful-links)

---

#### 4.6.3. Introduction
Acceptance Criteria (AC) are clear, measurable conditions that must be met for a requirement to be considered implemented and accepted. AC serve as the basis for testing, acceptance, and quality control.

##### Key Characteristics of Quality AC:
- **Measurability** — specific indicators for verification
- **Testability** — possibility of objective verification
- **Specificity** — clear and unambiguous formulations
- **Completeness** — coverage of all usage scenarios
- **User-Orientation** — description from the user's perspective
- **Realism** — achievability within the project scope

---

#### 4.6.4. AC Structure

##### 4.6.4.1. Importance of Preconditions and Postconditions

**Preconditions** describe what must be fulfilled or in what state the system should be before starting the AC verification. **Postconditions** record what should change or in what state the system should be after AC execution. These sections make acceptance criteria complete, unambiguous, and suitable for test automation.

##### 4.6.4.2. Header and Identification
- **Criterion ID**: AC-XXX
- **Criterion Name**: briefly reflects the essence of the verification
- **Requirement Link**: ID User Story, Use Case, NFR
- **Version and Creation Date**
- **Author and Responsible Persons**

##### 4.6.4.3. Main Elements
- **Description**: clear, unambiguous description of the expected result
- **Preconditions**: what must be fulfilled before starting verification
- **Verification Conditions**: specific, measurable conditions that must be met
- **Postconditions**: system state after verification completion
- **Priority**: Critical/High/Medium/Low
- **Rationale**: why this criterion is important for business/project
- **Verification Methods and Tools**: what and how it is verified
- **Success Criteria**: what is considered successful completion

---

#### 4.6.5. Universal AC Template

AC-XXX: [Criterion Name]
Requirement Link: [ID User Story / Use Case / NFR]
Version: [number]  Date: [date]
Author: [Full Name]  Responsible: [Full Name/Roles]

Description: [Clear, unambiguous description of expected result]

Preconditions:
- [What must be fulfilled before starting verification]

Verification Conditions:
- [Condition 1: specific measurable condition]
- [Condition 2: specific measurable condition]
- [Condition 3: specific measurable condition]

Postconditions:
- [System state after verification completion]

Priority: [Critical/High/Medium/Low]
Rationale: [Why this criterion is important for business/project]

Verification Methods and Tools:
- [Tool/method 1]
- [Tool/method 2]

Success Criteria:
- [What is considered successful completion]
- [Failure criteria, boundary values]

---

#### 4.6.6. Examples of Formulations and Filling

##### 4.6.6.1. Example 1: Functional Criterion (Web Application)

AC-001: User Creation
Requirement Link: US-001
Version: 1.0  Date: 2024-06-01
Author: Ivanov I.I.  Responsible: Development Team

Description: System should allow creating a new user with mandatory fields.

Preconditions:
- Registration form is available to unauthorized users
- Database is available for writing

Verification Conditions:
- User fills registration form (email, password, name)
- System validates email for correct format
- System checks email uniqueness in database
- Upon successful registration, record is created in DB
- User receives confirmation email
- In case of error, clear message is displayed

Postconditions:
- New user created in system
- Confirmation email sent
- User can log into system

Priority: Critical
Rationale: User registration is the foundation for system operation

Verification Methods and Tools:
- Manual testing: form filling, email verification
- Automation: Selenium for UI tests, API tests for validation

Success Criteria:
- User created, email sent, no errors
- Validation error, email duplication, DB unavailability — failure criteria

##### 4.6.6.2. Example 2: Non-functional Criterion (Performance)

AC-002: Page Load Time
Requirement Link: NFR-001
Version: 1.0  Date: 2024-06-01
Author: Petrov P.P.  Responsible: QA

Description: Main page should load within specified time under various load levels.

Preconditions:
- Server operating in normal mode
- Network connection stable

Verification Conditions:
- Under normal load (up to 100 users): no more than 2 seconds
- Under high load (up to 1000 users): no more than 5 seconds
- Under critical load (up to 5000 users): no more than 10 seconds
- Performance measured with Apache JMeter tool
- Time measured from request to full DOM load

Postconditions:
- Page fully loaded and functional
- All resources (CSS, JS, images) loaded

Priority: High
Rationale: Load speed directly affects conversion and user retention

Verification Methods and Tools:
- Apache JMeter for load testing
- Lighthouse for performance analysis
- Production environment monitoring

Success Criteria:
- Load time within limits for all load levels
- Exceeding load time limits — failure criterion

##### 4.6.6.3. Example 3: Integration Criterion (API)

AC-003: REST API Endpoint
Requirement Link: NFR-API-001
Version: 1.0  Date: 2024-06-01
Author: Sidorov S.S.  Responsible: Backend

Description: API should correctly process HTTP requests.

Preconditions:
- API server available
- Test data prepared

Verification Conditions:
- GET request returns data in JSON format
- POST request creates new record and returns 201 status
- PUT request updates existing record
- DELETE request deletes record and returns 204 status
- On error, appropriate HTTP status returned (400, 404, 500)
- Response contains Content-Type: application/json header
- Pagination supported via page and limit parameters
- API returns errors in unified format with code and message
- Response time does not exceed 1 second for simple requests

Postconditions:
- Data correctly processed
- Errors correctly returned

Priority: High
Rationale: API is the foundation for integration with external systems

Verification Methods and Tools:
- Postman, Insomnia for manual testing
- Automation: API tests in CI/CD pipeline

Success Criteria:
- All requests and responses comply with specification
- Errors correctly handled

---

#### 4.6.7. Quality AC Checklist
- [ ] Criterion is measurable and testable
- [ ] Specific values and conditions specified
- [ ] Priority defined
- [ ] Criterion does not contradict others
- [ ] Criterion is realistic and achievable
- [ ] Rationale provided
- [ ] Preconditions and postconditions described
- [ ] Verification methods and tools specified
- [ ] Criterion understandable to all project participants
- [ ] Criterion covers all scenarios (positive, negative, boundary)

---

#### 4.6.8. Recommendations and Typical Errors

##### 4.6.8.1. Common Errors:
1. **Vague Formulations**: "fast" instead of "no more than 2 seconds"
2. **Missing Units of Measurement**: "1000 users" instead of "1000 concurrent users"
3. **Unrealistic Requirements**: "10 milliseconds" instead of "100 milliseconds"
4. **Missing Rationale**: AC without indicating business importance
5. **Incomplete Scenario Coverage**: only positive scenarios
6. **Technical Orientation Instead of User Orientation**: "System saves data to DB" instead of "User receives save confirmation"

##### 4.6.8.2. Practical Recommendations:
- Use specific, measurable formulations
- Include negative and boundary scenarios
- Specify verification methods and tools
- Link AC with requirements (US, UC, NFR)
- Regularly review and update AC
- Ensure consistency with other artifacts

**Use this template as a standard for writing acceptance criteria — it is suitable for automated and manual AC creation, ensures compliance with standards and high quality results.**

