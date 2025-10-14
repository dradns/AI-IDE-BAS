


### 4.4. ER Diagram (ERD)
**Instructions for creating ER diagrams with PlantUML for AI agent**

#### 4.4.1. Content
1. [Syntax basics](#syntax-basics)
2. [Quality metrics](#quality-metrics)
3. [Validation rules](#validation-rules)
4. [Basic elements](#basic-elements)
5. [Relationship types](#relationship-types)
6. [SQL script creation](#sql-script-creation)
7. [Best practices](#best-practices)
8. [Scenario examples](#scenario-examples)
9. [Quality checklist](#quality-checklist)

---

#### 4.4.2. Syntax Basics

##### 4.4.2.1. Basic file structure:
plantuml
@startuml
!define ENTITY_STYLE fill:#E1F5FE,stroke:#01579B,stroke-width:2px

entity "Entity_Name" as alias {
  * field1 : type [PK]
  --
  * field2 : type [NOT NULL]
  field3 : type [NULL]
  --
  field4 : type [FK]
}

@enduml


##### 4.4.2.2. Notations:
- `*` - required field (NOT NULL)
- `--` - section separator  
- `[PK]` - primary key
- `[FK]` - foreign key
- `[UK]` - unique key

---

#### 4.4.3. Quality Metrics

##### 4.4.3.1. Target indicators:
- **Normalization**: compliance with 3NF (third normal form)
- **Relationship coverage**: 100% FK must be connected to PK
- **Naming**: uniformity of entity and field names
- **Field grouping**: logical separation into sections
- **SQL compliance**: 100% correspondence between ERD and SQL script

##### 4.4.3.2. Scoring system:
- **Excellent quality**: 3NF + all relationships + uniformity + SQL = ≥90%
- **Good quality**: 2NF + most relationships + SQL = 70-89%
- **Needs improvement**: normalization or SQL issues = <70%

---

#### 4.4.4. Validation Rules

##### 4.4.4.1. Automatic checks:

✓ All entities have primary key [PK]
✓ Foreign keys [FK] are connected to corresponding [PK]
✓ Relationships are correctly typed (1:1, 1:N, N:M)
✓ Names are in uniform style (snake_case or camelCase)
✓ Required fields are marked with *
✓ Field grouping is maintained (separators --)
✓ SQL script fully corresponds to ERD diagram
✓ All tables in SQL have corresponding entities in ERD


---

#### 4.4.5. Basic Elements

##### 4.4.5.1. Creating entity with grouping:
plantuml
entity User {
  ' Primary key
  * id : int [PK]
  --
  ' Main information
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  first_name : varchar(100)
  last_name : varchar(100)
  --
  ' System fields
  * created_at : timestamp
  * updated_at : timestamp
  deleted_at : timestamp
}


##### 4.4.5.2. Recommended sections:
1. **Primary key** - always first
2. **Main information** - business fields
3. **Relationships** - foreign keys
4. **System fields** - created_at, updated_at, deleted_at

---

#### 4.4.6. Relationship Types

##### 4.4.6.1. Relationship syntax:
| Relationship Type | Syntax | Usage Example |
|-----------|-----------|---------------------|
| **1:1** | `\|\|--\|\|` | User ↔ UserProfile |
| **1:N** | `\|\|--o{` | Category → Products |
| **N:M** | `}o--o{` | Products ↔ Tags (via junction) |
| **1:0..1** | `\|\|--o\|` | User → PasswordReset |

##### 4.4.6.2. Relationship examples:

###### 4.4.6.2.1. One to one (1:1)
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255)
}

entity UserProfile {
  * user_id : int [PK, FK]
  * first_name : varchar(100)
  * last_name : varchar(100)
}

User ||--|| UserProfile : "has profile"


###### 4.4.6.2.2. One to many (1:N)
plantuml
entity Category {
  * id : int [PK]
  * name : varchar(255)
}

entity Product {
  * id : int [PK]
  * name : varchar(255)
  * category_id : int [FK]
}

Category ||--o{ Product : "contains"


###### 4.4.6.2.3. Many to many (N:M) via junction table
plantuml
entity Product {
  * id : int [PK]
  * name : varchar(255)
}

entity Tag {
  * id : int [PK]
  * name : varchar(255)
}

entity ProductTag {
  * product_id : int [PK, FK]
  * tag_id : int [PK, FK]
}

Product ||--o{ ProductTag
Tag ||--o{ ProductTag


---

#### 4.4.7. SQL Script Creation

##### 4.4.7.1. Mandatory requirement:
**With each ERD diagram, it is MANDATORY to create corresponding SQL script for real database (preferably SQLite).**

##### 4.4.7.2. ERD → SQL correspondence principles:
- **Each entity** = table in SQL
- **Each ERD field** = column in table
- **ERD relationships** = FOREIGN KEY in SQL
- **Data types** = corresponding SQL types

##### 4.4.7.3. Correspondence example:

###### 4.4.7.3.1. ERD diagram:
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  first_name : varchar(100)
  last_name : varchar(100)
  * created_at : timestamp
}

entity Order {
  * id : int [PK]
  * user_id : int [FK]
  * status : varchar(50)
  * total_amount : decimal(10,2)
  * created_at : timestamp
}

User ||--o{ Order : "places"


###### 4.4.7.3.2. Corresponding SQL script (SQLite):
sql
-- Creating SQLite database
-- File: database.sql

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Test data insertion
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('user1@example.com', 'hash1', 'Ivan', 'Ivanov'),
('user2@example.com', 'hash2', 'Petr', 'Petrov');

INSERT INTO orders (user_id, status, total_amount) VALUES
(1, 'completed', 1500.00),
(1, 'pending', 750.50),
(2, 'completed', 2200.00);


##### 4.4.7.4. Data type correspondence:

| ERD type | SQLite type | Description |
|---------|------------|----------|
| `int` | `INTEGER` | Integers |
| `varchar(n)` | `VARCHAR(n)` | Fixed-length strings |
| `text` | `TEXT` | Unlimited length text |
| `decimal(m,n)` | `DECIMAL(m,n)` | Decimal numbers |
| `timestamp` | `TIMESTAMP` | Date and time |
| `boolean` | `BOOLEAN` | Boolean type |

##### 4.4.7.5. SQL file structure:
1. **Comments** - database purpose description
2. **DROP TABLE** - for recreation (optional)
3. **CREATE TABLE** - creating all tables
4. **ALTER TABLE** - adding foreign keys (if needed)
5. **CREATE INDEX** - indexes for performance
6. **INSERT** - test data (minimum 2-3 records per table)

---

#### 4.4.8. Best Practices

##### 4.4.8.1. Naming
- **Entities**: PascalCase or snake_case (uniformly)
- **Fields**: snake_case with clear names
- **Relationships**: meaningful descriptions in English

##### 4.4.8.2. Field structuring
plantuml
entity Product {
  ' Primary key
  * id : int [PK]
  --
  ' Main information
  * name : varchar(255)
  * description : text
  * sku : varchar(100) [UK]
  --
  ' Price information  
  * price : decimal(10,2)
  discount_price : decimal(10,2)
  --
  ' Relationships
  * category_id : int [FK]
  * brand_id : int [FK]
  --
  ' System fields
  * is_active : boolean
  * created_at : timestamp
  * updated_at : timestamp
}


##### 4.4.8.3. Styling (optional)
plantuml
!define MAIN_ENTITY fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
!define LOOKUP_ENTITY fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
!define JUNCTION_ENTITY fill:#FFF3E0,stroke:#F57C00,stroke-width:2px

entity User <<MAIN_ENTITY>>
entity Role <<LOOKUP_ENTITY>>  
entity UserRole <<JUNCTION_ENTITY>>


---

#### 4.4.9. Scenario Examples

##### 4.4.9.1. E-commerce system
plantuml
@startuml
entity User {
  * id : int [PK]
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  * first_name : varchar(100)
  * last_name : varchar(100)
  * phone : varchar(20)
  * is_active : boolean
  * created_at : timestamp
  * updated_at : timestamp
}

entity Category {
  * id : int [PK]
  * name : varchar(255)
  * description : text
  * parent_id : int [FK]
  * is_active : boolean
}

entity Product {
  * id : int [PK]
  * name : varchar(255)
  * description : text
  * sku : varchar(100) [UK]
  * price : decimal(10,2)
  * stock_quantity : int
  * category_id : int [FK]
  * is_active : boolean
  * created_at : timestamp
}

entity Order {
  * id : int [PK]
  * user_id : int [FK]
  * status : varchar(50)
  * total_amount : decimal(10,2)
  * created_at : timestamp
}

entity OrderItem {
  * id : int [PK]
  * order_id : int [FK]
  * product_id : int [FK]
  * quantity : int
  * unit_price : decimal(10,2)
  * total_price : decimal(10,2)
}

' Relationships
User ||--o{ Order : "places"
Category ||--o{ Product : "contains"
Category ||--o{ Category : "includes"
Order ||--o{ OrderItem : "contains"
Product ||--o{ OrderItem : "included in"
@enduml


---

#### 4.4.10. Common Errors

##### 4.4.9.1. ❌ Incorrect:
plantuml
' Missing primary key
entity User {
  email : varchar(255)
  name : varchar(100)
}

' Incorrect many-to-many relationship
User ||--o{ Role : "has roles"


##### 4.4.9.2. ✅ Correct:
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255)
  * name : varchar(100)
}

entity UserRole {
  * user_id : int [PK, FK]
  * role_id : int [PK, FK]
}

entity Role {
  * id : int [PK]
  * name : varchar(100)
}

User ||--o{ UserRole
Role ||--o{ UserRole


---

#### 4.4.11. Quality Checklist

##### 4.4.11.1. Structural check:
- [ ] ✅ All entities have primary key [PK]
- [ ] ✅ Foreign keys [FK] are correctly marked
- [ ] ✅ Required fields are marked with *
- [ ] ✅ Fields are logically grouped (separators --)

##### 4.4.11.2. Normalization check:
- [ ] ✅ **1NF**: All fields are atomic (no composite values)
- [ ] ✅ **2NF**: No partial dependencies on composite key
- [ ] ✅ **3NF**: No transitive dependencies

##### 4.4.11.3. Relationship check:
- [ ] ✅ 1:1 relationships are justified and correct
- [ ] ✅ 1:N relationships have FK in child table
- [ ] ✅ N:M relationships are implemented via junction table
- [ ] ✅ All FK reference existing PK

##### 4.4.11.4. SQL script check:
- [ ] ✅ **SQL file created** and attached to ERD
- [ ] ✅ **All tables** from ERD are present in SQL
- [ ] ✅ **Data types** correspond to ERD specification
- [ ] ✅ **Primary keys** are correctly defined
- [ ] ✅ **Foreign keys** created with correct relationships
- [ ] ✅ **Indexes** added for FK and frequently used fields
- [ ] ✅ **Test data** included (minimum 2-3 records per table)
- [ ] ✅ **SQL syntax** is correct for SQLite

##### 4.4.11.5. Quality check:
- [ ] 🎯 Names correspond to business terminology
- [ ] 🎯 Structure supports all business processes
- [ ] 🎯 No data redundancy
- [ ] 🎯 Model is scalable

##### 4.4.11.6. Integration check:
- [ ] 🔗 Entities correspond to objects from Use Case
- [ ] 🔗 Relationships reflect business rules
- [ ] 🔗 Fields cover all attributes from User Stories
- [ ] 🔗 SQL script can be executed without errors

**Goal**: Create ERD diagrams with ready SQL script for immediate database deployment.

---

#### 4.4.12. Optimization Recommendations

##### 4.4.12.1. Performance:
- Indexes for frequently used fields
- Denormalization for critical queries
- Partitioning of large tables

##### 4.4.12.2. Maintenance:
- Descriptive field and table names
- Comments for complex relationships
- Structure versioning

##### 4.4.12.3. Final check examples:
✅ "Users table normalized to 3NF"  
✅ "Orders → order_items relationship implemented correctly"  
✅ "All FK have corresponding indexes"  
✅ "SQL script executes without errors in SQLite"  

❌ "Table looks normal"  
❌ "Relationships work"  
❌ "Data is saved"

