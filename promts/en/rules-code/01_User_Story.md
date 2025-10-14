### 4.3. User Stories (US, Stories)
**Instructions for Writing User Stories for an AI Agent**

#### 4.3.1. Content
1. [User Story Structure](#user-story-structure)
2. [Quality Metrics](#quality-metrics)
3. [Validation Rules](#validation-rules)
4. [Role-Based Templates](#role-based-templates)
5. [User Story Examples](#user-story-examples)
6. [Quality Checklist](#quality-checklist)

---

#### 4.3.2. User Story Structure

##### 4.3.2.1. Mandatory Format:

US-XXX: [Brief feature name]
As a <user role>,
I want <desired action/functionality>,
so that <expected outcome/benefit>.



---

#### 4.3.3. Quality Metrics

##### 4.3.3.1. Target Indicators:
- **Format Compliance**: 100% structure "As a-I want-So that"
- **Cohesion**: 100% of US must be linked to a Use Case

##### 4.3.3.2. Scoring System:
- **Excellent Quality**: ≥90% compliance with metrics
- **Good Quality**: 70-89% compliance with metrics
- **Needs Improvement**: <70% compliance with metrics

---

#### 4.3.4. Validation Rules

##### 4.3.4.1. Automatic Checks:

✓ All 3 parts are present: role + action + result
✓ Role corresponds to the system's role directory
✓ Action is formulated as a verb
✓ Result contains a measurable benefit


---

#### 4.3.5. Role-Based Templates

##### 4.3.5.1. Business Roles:
- **Business Analyst**: analysis, documentation, planning
- **Project Manager**: management tasks
- **Product Owner**: product decisions

##### 4.3.5.2. Technical Roles:
- **System Architect**: architectural decisions
- **Database Designer**: data modeling
- **Developer**: technical implementation

##### 4.3.5.3. Universal Template:

US-XXX: [Functionality]
As a [role from the directory],
I want [specific system action],
so that [business benefit or process simplification].



---

#### 4.3.6. User Story Examples

##### 4.3.6.1. Analytical Task - Stakeholder Management

US-001: Collecting Project Stakeholder List
As a Business Analyst,
I want to have a ready-made list of project stakeholders,
so that I can quickly understand the participant structure and not waste time on manual collection.



##### 4.3.6.2. Technical Task - Diagram Generation

US-005: Generating ERD from Data Model
As a Database Designer,
I want to automatically get an ERD diagram from a text description,
so that I can visualize the structure without manual drawing.



##### 4.3.6.3. Architectural Task

US-004: Creating Use Case from Template
As a System Architect,
I want to form a Use Case according to an established template,
so that I can describe interactions and integrate them into the documentation.



---

#### 4.3.7. Quality Checklist

##### 4.3.7.1. Structural Check:
- [ ] ✅ Name reflects the essence of the functionality
- [ ] ✅ User role is from the system directory
- [ ] ✅ Action is formulated as a specific verb
- [ ] ✅ Result contains a measurable benefit


##### 4.3.7.2. Quality Check:
- [ ] 🎯 US is linked to architectural components
- [ ] 🎯 Technical feasibility is confirmed

##### 4.3.7.3. Integration Check:
- [ ] 🔗 Role corresponds to actors in the Use Case
- [ ] 🔗 Functionality is reflected in the architecture
- [ ] 🔗 Data corresponds to the ERD model
- [ ] 🔗 API methods are described in the technical specification

**Goal**: Create User Stories ready for estimation, planning, and development without additional clarifications.

---

#### 4.3.8. Style Recommendations

##### 4.3.8.1. Formulations:
- **Start with an action**: "The system provides...", "Ability to add..."
- **Specificity**: indicate numbers, formats, constraints
- [ ] ✅ Consistency: use a unified style and terminology

