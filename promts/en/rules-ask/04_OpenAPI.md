### 4.6. OpenAPI Format Specification
**Instructions for writing OpenAPI specification for AI agent**

#### 4.6.1. Content
1. [Structure basics](#structure-basics)
2. [Quality metrics](#quality-metrics)
3. [Validation rules](#validation-rules)
4. [Mandatory sections](#mandatory-sections)
5. [Endpoint description](#endpoint-description)
6. [Components and schemas](#components-and-schemas)
7. [Best practices](#best-practices)
8. [Quality checklist](#quality-checklist)

---

#### 4.6.2. Structure basics

##### 4.6.2.1. Minimum file structure:
yaml
openapi: 3.0.3
info:
  title: API Name
  description: Description of API purpose and features
  version: '1.0.0'
servers:
  - url: https://api.example.com/v1
    description: Production server
tags:
  - name: users
    description: User operations
paths: {}
components:
  schemas: {}


---

#### 4.6.3. Quality metrics

##### 4.6.3.1. Target indicators:
- **CRUD completeness**: 100% coverage of Create, Read, Update, Delete operations
- **Documentation**: all endpoints have description and examples
- **Validity**: YAML/JSON syntactic correctness
- **Data schemas**: 95% reuse through components

##### 4.6.3.2. Scoring system:
- **Excellent quality**: CRUD + documentation + validity = ≥90%
- **Good quality**: partial CRUD + documentation = 70-89%
- **Needs improvement**: basic functionality = <70%

---

#### 4.6.4. Validation rules

##### 4.6.4.1 Automatic checks:

✓ openapi version 3.0.0 or higher
✓ info contains title, version, description
✓ servers specified with URL and description
✓ all paths have operations (get, post, put, delete)
✓ responses contain minimum 200 and 400/500 codes
✓ schemas use $ref for reuse
✓ parameters have description and schema
✓ requestBody contains content with schema


---

#### 4.6.5. Mandatory sections

##### 4.6.5.1. info - project information
yaml
info:
  title: User Management API
  description: |
    REST API for user management in the system.
    Supports full CRUD for users and roles.
  version: '1.0.0'
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT


##### 4.6.5.2. servers - API servers
yaml
servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server


##### 4.6.5.3. tags - operation grouping
yaml
tags:
  - name: users
    description: User management
  - name: auth
    description: Authentication and authorization


---

#### 4.6.6. Endpoint description

##### 4.6.6.1. Operation structure:
yaml
/users/{id}:
  get:
    tags: [users]
    summary: Get user by ID
    description: Returns detailed user information
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Unique user identifier
    responses:
      '200':
        description: User found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              id: 1
              email: "user@example.com"
              name: "John Doe"
      '404':
        description: User not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'


##### 4.6.6.2. Mandatory operation elements:
- **tags**: grouping by functionality
- **summary**: brief description (up to 50 characters)
- **description**: detailed description
- **parameters**: description of all parameters
- **responses**: minimum 200 and error codes
- **examples**: request and response examples

---

#### 4.6.7. Components and schemas

##### 4.6.7.1. Reusable schemas:
yaml
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          description: Unique identifier
          example: 1
        email:
          type: string
          format: email
          description: User email
          example: "user@example.com"
        name:
          type: string
          description: User full name
          example: "John Doe"
        created_at:
          type: string
          format: date-time
          description: Creation date
          example: "2024-01-15T10:30:00Z"
    
    UserCreateRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
    
    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: integer
          description: Error code
        message:
          type: string
          description: Error description
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: Page number for pagination
  
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'


---

#### 4.6.8. Best practices

##### 4.6.8.1. Naming and structure
- **Paths**: use kebab-case (`/user-profiles`)
- **Schemas**: use PascalCase (`UserProfile`)
- **Parameters**: use snake_case (`user_id`)
- **Operations**: group logically by tags

##### 4.6.8.2. Status codes
| Operation | Success | Client error | Server error |
|----------|--------|----------------|----------------|
| **GET** | 200 | 404, 400 | 500 |
| **POST** | 201 | 400, 409 | 500 |
| **PUT** | 200 | 400, 404 | 500 |
| **DELETE** | 204 | 404 | 500 |

##### 4.6.8.3. Data validation
yaml
properties:
  email:
    type: string
    format: email
    maxLength: 255
  age:
    type: integer
    minimum: 0
    maximum: 150
  status:
    type: string
    enum: [active, inactive, pending]


##### 4.6.8.4. Examples and documentation
- Add `example` for each field
- Use `description` for all elements
- Include realistic request/response examples
- Document business logic in `description`

---

#### 4.6.9. Complete API example

yaml
openapi: 3.0.3
info:
  title: User Management API
  description: REST API for user management
  version: '1.0.0'

servers:
  - url: https://api.example.com/v1
    description: Production server

tags:
  - name: users
    description: User operations

paths:
  /users:
    get:
      tags: [users]
      summary: Get users list
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
          description: Number of users per page
      responses:
        '200':
          description: Users list
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  total:
                    type: integer
    
    post:
      tags: [users]
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      tags: [users]
      summary: Get user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
    
    UserCreateRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: Page number
  
  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string


---

#### 4.6.10. Quality checklist

##### 4.6.10.1. Structural verification:
- [ ] ✅ openapi version 3.0.0+
- [ ] ✅ info contains title, version, description
- [ ] ✅ servers specified with description
- [ ] ✅ tags defined for grouping

##### 4.6.10.2. Endpoint verification:
- [ ] ✅ All CRUD operations described
- [ ] ✅ Each operation has summary and description
- [ ] ✅ parameters contain schema and description
- [ ] ✅ responses cover success and error cases

##### 4.6.10.3. Schema verification:
- [ ] ✅ Schemas moved to components for reuse
- [ ] ✅ Required fields specified in required
- [ ] ✅ Data types and formats correct
- [ ] ✅ examples added for fields

##### 4.6.10.4. Quality verification:
- [ ] 🎯 All business operations covered
- [ ] 🎯 Validation corresponds to business rules
- [ ] 🎯 Error codes logically justified
- [ ] 🎯 Documentation understandable for developers

##### 4.6.10.5. Integration verification:
- [ ] 🔗 API corresponds to system architecture
- [ ] 🔗 Data schemas correspond to ERD
- [ ] 🔗 Operations cover Use Case scenarios

**Goal**: Create OpenAPI specifications ready for client code generation and documentation.

---

#### 4.6.11. Validation recommendations

##### 4.6.11.1. Verification tools:
- [Swagger Editor](https://editor.swagger.io/) - online validator
- OpenAPI Generator - code generation
- Spectral - linter for OpenAPI

##### 4.6.11.2. Quality documentation examples:
✅ "Returns users list with pagination"  
✅ "Creates new user with email validation"  
✅ "Error 409 for email duplication"  

❌ "Gets data"  
❌ "Creates object"  
❌ "Returns error"

