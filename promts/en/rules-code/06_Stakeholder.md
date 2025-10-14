### 4.8. Project Stakeholder Information
**Instructions for Gathering the Project Stakeholder List**

#### 4.8.1. Purpose
To provide the AI agent with a step-by-step process for identifying and documenting all stakeholders of a project initiative.

#### 4.8.2. Required Inputs
1.  **Project Vision / Charter** – goals, scope, success criteria.
2.  **Organizational Structure** – org chart, list of departments, or public company information.
3.  **Existing Requirements Artifacts** – BRD, User Story, RFP, etc.
4.  **Regulatory and Compliance Context** (if applicable).

> **Tip:** If any data is missing, ask the user to provide it or clarify assumptions.

#### 4.8.3. Stakeholder Categories

| Category        | Typical Roles                                  | Examples                           |
|-----------------|------------------------------------------------|------------------------------------|
| **Sponsors**    | Executive Sponsor, Steering Committee member   | CFO, CTO                          |
| **Management**  | Product Owner, Program Manager, Department Head| Head of Operations                |
| **Users**       | End User, Power-user, Support Service          | Cashier, Mobile App User          |
| **Technical**   | Architects, Developers, QA, DevOps             | Lead Backend Developer            |
| **Compliance**  | Legal, Security, Risk Management, Audit        | DPO, CISO                         |
| **External**    | Suppliers, Partners, Regulators                | Payment Provider, Central Bank    |
| **Other**       | Training, Marketing, Customer Success          | L&D Manager                       |

#### 4.8.4. Information Gathering Steps

1.  **Initial Scan**
    -   Analyze the provided documents for names, departments, and job titles.
    -   Form a preliminary list of candidates.

2.  **Role Classification**
    -   Assign each candidate to one of the categories above.
    -   Mark duplicates or aliases (e.g., "IT" vs "Information Technology").

3.  **Gap Analysis**
    -   Check the list against the category checklist; find missing ones.
    -   Request clarification if a critical category is empty.

4.  **Attribute Enrichment**
    -   For each stakeholder, record:
        -   `Name`
        -   `Job Title`
        -   `Department`
        -   `Influence Level (H/M/L)`
        -   `Interest Level (H/M/L)`
        -   `Contacts (if available)`

5.  **Validation**
    -   Create a final table and show it to the user for confirmation.
    -   Clarify edits and update the list until approved.

#### 4.8.5. 📄 Output Format (Markdown Table)

| Name         | Job Title       | Category   | Influence | Interest | Notes             |
|--------------|-----------------|------------|-----------|----------|-------------------|
| Ivan Ivanov  | Product Owner   | Management | H         | H        | Key Decision Maker|

#### 4.8.6. Acceptance Criteria
- [ ] All seven stakeholder categories have been assessed.
- [ ] Six attributes are filled out for each stakeholder.
- [ ] There are no duplicates in names or roles.
- [ ] The user confirms completeness.
- [ ] The final list is exported in Markdown table format.

#### 4.8.7. Recommendations and Standards
- BABOK v3 – Stakeholder Analysis
- PMBOK – Identify Stakeholders Process
- ISO 21500 – Guidance on Project Management

*Last updated: {{DATE}}*