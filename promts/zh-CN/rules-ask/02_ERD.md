### 4.4. ER图 (ERD)
**使用PlantUML为AI代理创建ER图的说明**

#### 4.4.1. 内容
1. [语法基础](#语法基础)
2. [质量指标](#质量指标)
3. [验证规则](#验证规则)
4. [基本元素](#基本元素)
5. [关系类型](#关系类型)
6. [创建SQL脚本](#创建sql脚本)
7. [最佳实践](#最佳实践)
8. [场景示例](#场景示例)
9. [质量检查清单](#质量检查清单)

---

#### 4.4.2. 语法基础

##### 4.4.2.1. 基本文件结构:
plantuml
@startuml
!define ENTITY_STYLE fill:#E1F5FE,stroke:#01579B,stroke-width:2px

entity "实体名称" as alias {
  * 字段1 : 类型 [PK]
  --
  * 字段2 : 类型 [NOT NULL]
  字段3 : 类型 [NULL]
  --
  字段4 : 类型 [FK]
}

@enduml


##### 4.4.2.2. 符号说明:
- `*` - 必填字段 (NOT NULL)
- `--` - 部分分隔符  
- `[PK]` - 主键
- `[FK]` - 外键
- `[UK]` - 唯一键

---

#### 4.4.3. 质量指标

##### 4.4.3.1. 目标指标:
- **规范化**: 符合3NF (第三范式)
- **关系覆盖**: 100% FK必须连接到PK
- **命名**: 实体和字段名称的统一性
- **字段分组**: 逻辑分部分离
- **SQL符合性**: ERD和SQL脚本100%对应

##### 4.4.3.2. 评分系统:
- **优秀质量**: 3NF + 所有关系 + 统一性 + SQL = ≥90%
- **良好质量**: 2NF + 大多数关系 + SQL = 70-89%
- **需要改进**: 规范化或SQL问题 = <70%

---

#### 4.4.4. 验证规则

##### 4.4.4.1. 自动检查:

✓ 所有实体都有主键 [PK]
✓ 外键 [FK] 连接到相应的 [PK]
✓ 关系正确类型化 (1:1, 1:N, N:M)
✓ 名称风格统一 (snake_case 或 camelCase)
✓ 必填字段用 * 标记
✓ 保持字段分组 (分隔符 --)
✓ SQL脚本完全对应ERD图
✓ SQL中的所有表在ERD中有相应的实体


---

#### 4.4.5. 基本元素

##### 4.4.5.1. 创建带分组的实体:
plantuml
entity User {
  ' 主键
  * id : int [PK]
  --
  ' 主要信息
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  first_name : varchar(100)
  last_name : varchar(100)
  --
  ' 系统字段
  * created_at : timestamp
  * updated_at : timestamp
  deleted_at : timestamp
}


##### 4.4.5.2. 推荐部分:
1. **主键** - 始终第一
2. **主要信息** - 业务字段
3. **关系** - 外键
4. **系统字段** - created_at, updated_at, deleted_at

---

#### 4.4.6. 关系类型

##### 4.4.6.1. 关系语法:
| 关系类型 | 语法 | 使用示例 |
|-----------|-----------|---------------------|
| **1:1** | `\|\|--\|\|` | User ↔ UserProfile |
| **1:N** | `\|\|--o{` | Category → Products |
| **N:M** | `}o--o{` | Products ↔ Tags (通过连接表) |
| **1:0..1** | `\|\|--o\|` | User → PasswordReset |

##### 4.4.6.2. 关系示例:

###### 4.4.6.2.1. 一对一 (1:1)
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

User ||--|| UserProfile : "拥有资料"


###### 4.4.6.2.2. 一对多 (1:N)
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

Category ||--o{ Product : "包含"


###### 4.4.6.2.3. 多对多 (N:M) 通过连接表
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

#### 4.4.7. 创建SQL脚本

##### 4.4.7.1. 强制性要求:
**每个ERD图必须创建相应真实数据库的SQL脚本 (优先SQLite)。**

##### 4.4.7.2. ERD → SQL对应原则:
- **每个实体** = SQL中的表
- **每个ERD字段** = 表中的列
- **ERD关系** = SQL中的FOREIGN KEY
- **数据类型** = 相应的SQL类型

##### 4.4.7.3. 对应示例:

###### 4.4.7.3.1. ERD图:
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

User ||--o{ Order : "下订单"


###### 4.4.7.3.2. 相应SQL脚本 (SQLite):
sql
-- 创建SQLite数据库
-- 文件: database.sql

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 优化索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 插入测试数据
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('user1@example.com', 'hash1', '伊万', '伊万诺夫'),
('user2@example.com', 'hash2', '彼得', '彼得罗夫');

INSERT INTO orders (user_id, status, total_amount) VALUES
(1, 'completed', 1500.00),
(1, 'pending', 750.50),
(2, 'completed', 2200.00);


##### 4.4.7.4. 数据类型对应:

| ERD类型 | SQLite类型 | 描述 |
|---------|------------|----------|
| `int` | `INTEGER` | 整数 |
| `varchar(n)` | `VARCHAR(n)` | 固定长度字符串 |
| `text` | `TEXT` | 无限制长度文本 |
| `decimal(m,n)` | `DECIMAL(m,n)` | 十进制数 |
| `timestamp` | `TIMESTAMP` | 日期和时间 |
| `boolean` | `BOOLEAN` | 布尔类型 |

##### 4.4.7.5. SQL文件结构:
1. **注释** - 数据库目的描述
2. **DROP TABLE** - 用于重新创建 (可选)
3. **CREATE TABLE** - 创建所有表
4. **ALTER TABLE** - 添加外键 (如果需要)
5. **CREATE INDEX** - 性能索引
6. **INSERT** - 测试数据 (每表最少2-3条记录)

---

#### 4.4.8. 最佳实践

##### 4.4.8.1. 命名
- **实体**: PascalCase 或 snake_case (统一)
- **字段**: snake_case 带清晰名称
- **关系**：中文中有意义的描述

##### 4.4.8.2. 字段结构化
plantuml
entity Product {
  ' 主键
  * id : int [PK]
  --
  ' 主要信息
  * name : varchar(255)
  * description : text
  * sku : varchar(100) [UK]
  --
  ' 价格信息  
  * price : decimal(10,2)
  discount_price : decimal(10,2)
  --
  ' 关系
  * category_id : int [FK]
  * brand_id : int [FK]
  --
  ' 系统字段
  * is_active : boolean
  * created_at : timestamp
  * updated_at : timestamp
}


##### 4.4.8.3. 样式化 (可选)
plantuml
!define MAIN_ENTITY fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
!define LOOKUP_ENTITY fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
!define JUNCTION_ENTITY fill:#FFF3E0,stroke:#F57C00,stroke-width:2px

entity User <<MAIN_ENTITY>>
entity Role <<LOOKUP_ENTITY>>  
entity UserRole <<JUNCTION_ENTITY>>


---

#### 4.4.9. 场景示例

##### 4.4.9.1. 电子商务系统
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

' 关系
User ||--o{ Order : "下订单"
Category ||--o{ Product : "包含"
Category ||--o{ Category : "包括"
Order ||--o{ OrderItem : "包含"
Product ||--o{ OrderItem : "被包含在"
@enduml


---

#### 4.4.10. 常见错误

##### 4.4.9.1. ❌ 错误:
plantuml
' 缺少主键
entity User {
  email : varchar(255)
  name : varchar(100)
}

' 错误的多对多关系
User ||--o{ Role : "拥有角色"


##### 4.4.9.2. ✅ 正确:
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

#### 4.4.11. 质量检查清单

##### 4.4.11.1. 结构检查:
- [ ] ✅ 所有实体都有主键 [PK]
- [ ] ✅ 外键 [FK] 正确标记
- [ ] ✅ 必填字段用 * 标记
- [ ] ✅ 字段逻辑分组 (分隔符 --)

##### 4.4.11.2. 规范化检查:
- [ ] ✅ **1NF**: 所有字段都是原子的 (无复合值)
- [ ] ✅ **2NF**: 无对复合键的部分依赖
- [ ] ✅ **3NF**: 无传递依赖

##### 4.4.11.3. 关系检查:
- [ ] ✅ 1:1 关系合理且正确
- [ ] ✅ 1:N 关系在子表中有FK
- [ ] ✅ N:M 关系通过连接表实现
- [ ] ✅ 所有FK引用存在的PK

##### 4.4.11.4. SQL脚本检查:
- [ ] ✅ **SQL文件已创建** 并附加到ERD
- [ ] ✅ ERD中的**所有表**都存在于SQL中
- [ ] ✅ **数据类型** 符合ERD规范
- [ ] ✅ **主键** 正确定义
- [ ] ✅ **外键** 以正确关系创建
- [ ] ✅ 为FK和常用字段添加**索引**
- [ ] ✅ 包含**测试数据** (每表最少2-3条记录)
- [ ] ✅ **SQL语法** 对SQLite正确

##### 4.4.11.5. 质量检查:
- [ ] 🎯 名称符合业务术语
- [ ] 🎯 结构支持所有业务流程
- [ ] 🎯 无数据冗余
- [ ] 🎯 模型可扩展

##### 4.4.11.6. 集成检查:
- [ ] 🔗 实体对应Use Case中的对象
- [ ] 🔗 关系反映业务规则
- [ ] 🔗 字段覆盖User Stories中的所有属性
- [ ] 🔗 SQL脚本可无错误执行

**目标**: 创建带有即用SQL脚本的ERD图，用于立即数据库部署。

---

#### 4.4.12. 优化建议

##### 4.4.12.1. 性能:
- 为常用字段添加索引
- 为关键查询反规范化
- 大表分区

##### 4.4.12.2. 维护:
- 描述性表和字段名称
- 复杂关系的注释
- 结构版本控制

##### 4.4.12.3. 最终检查示例:
✅ "用户表规范化为3NF"  
✅ "订单 → 订单项关系正确实现"  
✅ "所有FK都有相应索引"  
✅ "SQL脚本在SQLite中无错误执行"  

❌ "表看起来正常"  
❌ "关系工作"  
❌ "数据保存"

