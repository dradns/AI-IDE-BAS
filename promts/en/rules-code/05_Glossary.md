### 4.7. Project Glossary
**Project Terminology Management Instructions**

This document is intended for the AI agent responsible for collecting, structuring, and updating the project terminology glossary. The goal is to ensure terminology consistency across all project artifacts.

**Term Sources:** artifacts in the working directory
**Glossary Save Location:** `*_glossary.md` in the project root
**Update Format:** adding new terms and updating existing ones

---

#### 4.7.1. Table of Contents
1. [Glossary Management Principles](#glossary-management-principles)
2. [Term Sources](#term-sources)
3. [Glossary Structure](#glossary-structure)
4. [Term Collection Procedures](#term-collection-procedures)
5. [Term Categorization](#term-categorization)
6. [Consistency Check](#consistency-check)
7. [Update Procedures](#update-procedures)

---

#### 4.7.2. Glossary Management Principles

##### 4.7.2.1. Key Principles:
- **Consistency**: one term - one definition throughout the project
- **Completeness**: coverage of all key domain concepts
- **Relevance**: regular definition updates
- **Hierarchy**: relationships between terms and their grouping
- **Contextuality**: consideration of domain specifics

##### 4.7.2.2. Term Inclusion Criteria:
- **Business Terms**: domain concepts
- **Technical Terms**: architectural and technological concepts
- **Acronyms and Abbreviations**: all project abbreviations
- **Roles and Actors**: system participants
- **Processes and States**: key business processes
- **Data Entities**: main system objects

---

#### 4.7.3. Term Sources

##### 4.7.3.1. Business Requirements
**Files for Analysis:**
- `*_us.md` (User Stories)
- `*_uc.md` (Use Cases)
- `README.md` in project folders

**Term Types:**
- [ ] User Roles
- [ ] Business Processes
- [ ] Business Rules
- [ ] Acceptance Criteria
- [ ] Functional Areas

##### 4.7.3.2. System Architecture
**Files for Analysis:**
- `*.puml` (PlantUML diagrams)

**Term Types:**
- [ ] System Components
- [ ] Architecture Layers
- [ ] Interfaces
- [ ] Protocols
- [ ] Technologies

##### 4.7.3.3. Data Model
**Files for Analysis:**
- ER diagrams
- SQL files
- API specifications

**Term Types:**
- [ ] Entities
- [ ] Attributes
- [ ] Relationships
- [ ] Constraints
- [ ] Indexes

##### 4.7.3.4. APIs and Interfaces
**Files for Analysis:**
- `*.yaml` (OpenAPI specifications)
- Sequence diagrams

**Term Types:**
- [ ] Endpoints
- [ ] HTTP Methods
- [ ] Request Parameters
- [ ] Response Codes
- [ ] Data Schemas

---

#### 4.7.4. Glossary Structure
##### 4.7.4.1. Term Entry Format:
### [Term]
**Category:** [Business/Technical/Data/API/Role]  
**Synonyms:** [alternative names]  
**Abbreviations:** [abbreviations]  
**Definition:** [clear term definition]  
**Context:** [where it is used in the project]  
**Related Terms:** [links to other terms]  
**Source:** [file where it first appears]  
**Last Updated:** [date]
**Usage Examples:**- [example 1] - [example 2]

##### 4.7.4.2. Term Grouping:
###### 4.7.4.2.1. Business Terms
- Domain
- Business Processes
- Roles and Participants
- Products and Services

###### 4.7.4.2.2. Technical Terms
- Architectural Components
- Technologies and Tools
- Protocols and Standards
- Infrastructure

###### 4.7.4.2.3. Data Terms
- Entities
- Attributes
- Relationships
- Constraints

###### 4.7.4.2.4. API Terms
- Endpoints
- Methods
- Parameters
- Schemas

###### 4.7.4.2.5. Acronyms and Abbreviations
- Technical Abbreviations
- Business Abbreviations
- Organizational Abbreviations

#### 4.7.5. Term Collection Procedures

##### 4.7.5.1. Stage 1: Automatic Collection

**1.1. File Scanning**
- [ ] Term search in User Stories (roles after "As a")
- [ ] Actor extraction from Use Cases
- [ ] Component name collection from diagrams
- [ ] Entity search in ERD
- [ ] Endpoint extraction from OpenAPI

**1.2. Search Patterns**
- Roles: `As a [role]`, `Actor: [role]`
- Components: `component`, `interface`, `service`
- Entities: `entity`, `table`, names in ERD
- API: `paths:`, `endpoints`, HTTP methods
- Acronyms: uppercase words

##### 4.7.5.2. Stage 2: Context Analysis

**2.1. Meaning Determination**
- [ ] Usage context analysis
- [ ] Definition search in text
- [ ] Synonym identification
- [ ] Scope determination

**2.2. Grouping**
- [ ] Categorization by types
- [ ] Hierarchy identification
- [ ] Related term linking
- [ ] Dependency determination

##### 4.7.5.3. Stage 3: Validation and Cleaning

**3.1. Duplicate Check**
- [ ] Search for identical terms
- [ ] Synonym identification
- [ ] Abbreviation verification
- [ ] Duplicate merging

**3.2. Quality Check**
- [ ] Definition completeness
- [ ] Categorization correctness
- [ ] Example availability
- [ ] Source relevance

#### 4.7.6. Term Categorization

##### 4.7.6.1. Business Terms
**Criteria:**
- Related to domain
- Used in User Stories and Use Cases
- Understandable to business users
- Don't require technical knowledge

**Examples:**
- Customer, User, Administrator
- Order, Payment, Invoice
- Registration, Authorization
- Product, Service, Tariff

##### 4.7.6.2. Technical Terms
**Criteria:**
- Related to IT architecture
- Used in technical diagrams
- Require technical knowledge
- Related to implementation

**Examples:**
- API Gateway, Microservice
- Database, Cache
- Load Balancer, Firewall
- REST, HTTP, JSON

##### 4.7.6.3. Data Terms
**Criteria:**
- Related to data model
- Used in ERD
- Describe data structure
- Related to information storage

**Examples:**
- User, Order, Payment (entities)
- user_id, email, created_at (attributes)
- one-to-many, foreign key (relationships)

##### 4.7.6.4. API Terms
**Criteria:**
- Related to interfaces
- Used in OpenAPI
- Describe interaction
- Related to protocols

**Examples:**
- /api/users, /login, /orders
- GET, POST, PUT, DELETE
- Authorization header, Bearer token
- 200 OK, 404 Not Found
---

#### 4.7.7. Consistency Check

##### 4.7.7.1. Term Usage Analysis

**1. Uniformity Check**
- [ ] One term = one meaning
- [ ] No contradictions in definitions
- [ ] Uniform writing (case, hyphens)
- [ ] Consistency in translations

**2. Term Coverage**
- [ ] All key concepts defined
- [ ] No undefined terms in documents
- [ ] All domains covered
- [ ] All acronyms defined

**3. Definition Quality**
- [ ] Definitions clear and unambiguous
- [ ] No circular definitions
- [ ] Definitions contain no jargon
- [ ] Usage examples available

##### 4.7.7.2. Problem Identification

**Problem Types:**
- **Duplicates:** identical terms with different definitions
- **Synonyms:** different terms with same meaning
- **Undefined terms:** terms without definitions
- **Obsolete terms:** terms not used in project
- **Contradictions:** conflicting definitions

**Resolution Procedure:**
1. Identify all occurrences of problematic term
2. Analyze usage context
3. Select primary definition
4. Update all documents
5. Add synonyms to glossary

---

#### 4.7.8. Update Procedures

##### 4.7.8.1. Regular Updates

**Update Triggers:**
- [ ] Creation of new requirement artifacts
- [ ] Changes in existing documents
- [ ] Addition of new diagrams
- [ ] API specification updates
- [ ] Appearance of new reports

**Check Frequency:**
- **After each change:** critical terms
- **Weekly:** full consistency analysis
- **During releases:** comprehensive glossary check

##### 4.7.8.2. Update Process

**1. Change Collection**
- [ ] Scanning modified files
- [ ] New term identification
- [ ] Deleted term analysis
- [ ] Updated definition verification

**2. Impact Analysis**
- [ ] Determining affected documents
- [ ] Checking related terms
- [ ] Assessing update necessity
- [ ] Planning changes

**3. Glossary Update**
- [ ] Adding new terms
- [ ] Updating existing definitions
- [ ] Removing obsolete terms
- [ ] Updating term relationships

**4. Change Validation**
- [ ] Checking definition correctness
- [ ] Testing links
- [ ] Verifying formatting
- [ ] Validating structure

##### 4.7.8.3. Change Notifications

**Change Log:**
markdown
## Glossary Change History

### [Date] - Version X.Y
**Added Terms:**
- [Term 1]: [brief description]
- [Term 2]: [brief description]

**Updated Terms:**
- [Term 3]: [what changed]

**Removed Terms:**
- [Term 4]: [removal reason]

**Affected Documents:**
- [file list]

---

#### 4.7.9. Project Process Integration

##### 4.7.9.1. Requirements Review Integration

**During requirements review:**
- [ ] Check glossary term usage
- [ ] Identify new undefined terms
- [ ] Suggest terminology standardization
- [ ] Update glossary if necessary

##### 4.7.9.2. Development Integration

**When creating new artifacts:**
- [ ] Use glossary terms
- [ ] Add new terms to glossary
- [ ] Maintain naming consistency
- [ ] Document deviations from standards

##### 4.7.9.3. Glossary Quality Metrics

**Coverage Indicators:**
- [ ] % of defined terms from total
- [ ] Number of terms by categories
- [ ] Term usage frequency
- [ ] Number of synonyms and duplicates

**Quality Indicators:**
- [ ] Average definition length
- [ ] % of terms with examples
- [ ] % of terms with relationships
- [ ] Number of updates per period
---

#### 4.7.10. Glossary Status Report Template

markdown
# Glossary Status Report

**Date:** [date]  
**Glossary Version:** [version]

## Statistics
- **Total number of terms:** [number]
- **Business terms:** [number]
- **Technical terms:** [number]
- **Data terms:** [number]
- **API terms:** [number]
- **Acronyms:** [number]

## Quality
- **Terms with complete definitions:** [%]
- **Terms with examples:** [%]
- **Terms with relationships:** [%]
- **Problematic terms:** [number]

## Identified Issues
- [issue description]

## Recommendations
- [improvement recommendations]

## Changes Since Last Report
- [list of changes]


**Use this instruction to maintain an up-to-date and high-quality project terminology glossary ensuring terminology consistency across all artifacts.** 

