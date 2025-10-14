### 4.6. OpenAPI格式规范
**为AI代理编写OpenAPI规范的说明**

#### 4.6.1. 内容
1. [结构基础](#结构基础)
2. [质量指标](#质量指标)
3. [验证规则](#验证规则)
4. [强制性部分](#强制性部分)
5. [端点描述](#端点描述)
6. [组件和模式](#组件和模式)
7. [最佳实践](#最佳实践)
8. [质量检查清单](#质量检查清单)

---

#### 4.6.2. 结构基础

##### 4.6.2.1. 最小文件结构:
yaml
openapi: 3.0.3
info:
  title: API名称
  description: API目的和特性的描述
  version: '1.0.0'
servers:
  - url: https://api.example.com/v1
    description: 生产服务器
tags:
  - name: users
    description: 用户操作
paths: {}
components:
  schemas: {}


---

#### 4.6.3. 质量指标

##### 4.6.3.1. 目标指标:
- **CRUD完整性**: 100%覆盖Create, Read, Update, Delete操作
- **文档**: 所有端点都有description和examples
- **有效性**: YAML/JSON语法正确性
- **数据模式**: 通过components实现95%重用

##### 4.6.3.2. 评分系统:
- **优秀质量**: CRUD + 文档 + 有效性 = ≥90%
- **良好质量**: 部分CRUD + 文档 = 70-89%
- **需要改进**: 基本功能 = <70%

---

#### 4.6.4. 验证规则

##### 4.6.4.1 自动检查:

✓ openapi版本3.0.0或更高
✓ info包含title, version, description
✓ servers使用URL和description指定
✓ 所有paths都有操作(get, post, put, delete)
✓ responses包含至少200和400/500代码
✓ schemas使用$ref进行重用
✓ parameters有description和schema
✓ requestBody包含带schema的content


---

#### 4.6.5. 强制性部分

##### 4.6.5.1. info - 项目信息
yaml
info:
  title: User Management API
  description: |
    系统中用户管理的REST API。
    支持用户和角色的完整CRUD。
  version: '1.0.0'
  contact:
    name: API支持
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT


##### 4.6.5.2. servers - API服务器
yaml
servers:
  - url: https://api.example.com/v1
    description: 生产服务器
  - url: https://staging-api.example.com/v1
    description: 预发布服务器


##### 4.6.5.3. tags - 操作分组
yaml
tags:
  - name: users
    description: 用户管理
  - name: auth
    description: 认证和授权


---

#### 4.6.6. 端点描述

##### 4.6.6.1. 操作结构:
yaml
/users/{id}:
  get:
    tags: [users]
    summary: 按ID获取用户
    description: 返回详细的用户信息
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: 唯一用户标识符
    responses:
      '200':
        description: 找到用户
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              id: 1
              email: "user@example.com"
              name: "John Doe"
      '404':
        description: 用户未找到
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'


##### 4.6.6.2. 强制性操作元素:
- **tags**: 按功能分组
- **summary**: 简要描述(最多50个字符)
- **description**: 详细描述
- **parameters**: 所有参数的描述
- **responses**: 至少200和错误代码
- **examples**: 请求和响应示例

---

#### 4.6.7. 组件和模式

##### 4.6.7.1. 可重用模式:
yaml
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          description: 唯一标识符
          example: 1
        email:
          type: string
          format: email
          description: 用户邮箱
          example: "user@example.com"
        name:
          type: string
          description: 用户全名
          example: "John Doe"
        created_at:
          type: string
          format: date-time
          description: 创建日期
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
          description: 错误代码
        message:
          type: string
          description: 错误描述
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: 分页页码
  
  responses:
    NotFound:
      description: 资源未找到
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'


---

#### 4.6.8. 最佳实践

##### 4.6.8.1. 命名和结构
- **路径**: 使用kebab-case(`/user-profiles`)
- **模式**: 使用PascalCase(`UserProfile`)
- **参数**: 使用snake_case(`user_id`)
- **操作**: 按标签逻辑分组

##### 4.6.8.2. 状态代码
| 操作 | 成功 | 客户端错误 | 服务器错误 |
|----------|--------|----------------|----------------|
| **GET** | 200 | 404, 400 | 500 |
| **POST** | 201 | 400, 409 | 500 |
| **PUT** | 200 | 400, 404 | 500 |
| **DELETE** | 204 | 404 | 500 |

##### 4.6.8.3. 数据验证
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


##### 4.6.8.4. 示例和文档
- 为每个字段添加`example`
- 对所有元素使用`description`
- 包含现实的请求/响应示例
- 在`description`中记录业务逻辑

---

#### 4.6.9. 完整API示例

yaml
openapi: 3.0.3
info:
  title: User Management API
  description: 用户管理的REST API
  version: '1.0.0'

servers:
  - url: https://api.example.com/v1
    description: 生产服务器

tags:
  - name: users
    description: 用户操作

paths:
  /users:
    get:
      tags: [users]
      summary: 获取用户列表
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
          description: 每页用户数
      responses:
        '200':
          description: 用户列表
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
      summary: 创建用户
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: 用户已创建
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      tags: [users]
      summary: 获取用户
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: 找到用户
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
      description: 页码
  
  responses:
    BadRequest:
      description: 无效请求
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
    
    NotFound:
      description: 资源未找到
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string


---

#### 4.6.10. 质量检查清单

##### 4.6.10.1. 结构验证:
- [ ] ✅ openapi版本3.0.0+
- [ ] ✅ info包含title, version, description
- [ ] ✅ servers使用description指定
- [ ] ✅ tags为分组定义

##### 4.6.10.2. 端点验证:
- [ ] ✅ 所有CRUD操作已描述
- [ ] ✅ 每个操作都有summary和description
- [ ] ✅ parameters包含schema和description
- [ ] ✅ responses覆盖成功和错误情况

##### 4.6.10.3. 模式验证:
- [ ] ✅ 模式移至components以便重用
- [ ] ✅ 必需字段在required中指定
- [ ] ✅ 数据类型和格式正确
- [ ] ✅ 为字段添加了examples

##### 4.6.10.4. 质量验证:
- [ ] 🎯 所有业务操作已覆盖
- [ ] 🎯 验证符合业务规则
- [ ] 🎯 错误代码逻辑合理
- [ ] 🎯 文档对开发人员可理解

##### 4.6.10.5. 集成验证:
- [ ] 🔗 API符合系统架构
- [ ] 🔗 数据模式符合ERD
- [ ] 🔗 操作覆盖Use Case场景

**目标**: 创建准备好用于客户端代码生成和文档的OpenAPI规范。

---

#### 4.6.11. 验证建议

##### 4.6.11.1. 验证工具:
- [Swagger Editor](https://editor.swagger.io/) - 在线验证器
- OpenAPI Generator - 代码生成
- Spectral - OpenAPI的linter

##### 4.6.11.2. 质量文档示例:
✅ "返回带分页的用户列表"  
✅ "创建带邮箱验证的新用户"  
✅ "邮箱重复时错误409"  

❌ "获取数据"  
❌ "创建对象"  
❌ "返回错误"

