### 4.5. 序列图
**为AI代理创建序列图的说明**

#### 4.5.1. 内容
1. [基础和要求](#基础和要求)
2. [图表结构](#图表结构)
3. [质量指标](#质量指标)
4. [验证规则](#验证规则)
5. [基本模板](#基本模板)
6. [交互类型](#交互类型)
7. [与工件的集成](#与工件的集成)
8. [质量检查清单](#质量检查清单)

---

#### 4.5.2. 基础和要求

##### 4.5.2.1. 强制性输入工件:
- **User Story** - 用于理解业务场景
- **Use Case** - 用于详细的交互流程
- **架构图** - 用于参与者和连接

##### 4.5.2.2. 附加工件:
- API文档，技术规范，部署图

---

#### 4.5.3. 图表结构

##### 4.5.3.1. 标题和设置
plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 


##### 4.5.3.2. 参与者（严格类型）
plantuml
actor User as "来自User Story的角色"
participant Browser as "浏览器"
participant "Web Server" as WebServer
participant "Application Server" as AppServer
participant "Database Server" as DBServer


##### 4.5.3.3. 阶段分组
plantuml
== 逻辑阶段名称 ==


##### 4.5.3.4. 与协议的交互
plantuml
User -> Browser : 业务操作
Browser -> WebServer : HTTP GET/POST /endpoint
WebServer -> AppServer : REST API: 方法
AppServer -> DBServer : JDBC: SELECT/INSERT


---

#### 4.5.4. 质量指标

##### 4.5.4.1. 目标指标:
- **参与者覆盖**: 100%来自架构图
- **逻辑分组**: 3-7个具有清晰名称的阶段
- **协议详细程度**: 90%交互带有技术规范
- **错误处理**: 最少2个备选场景

##### 4.5.4.2. 评分系统:
- **优秀质量**: ≥90%符合指标
- **良好质量**: 70-89%符合指标
- **需要改进**: <70%符合指标

---

#### 4.5.5. 验证规则

##### 4.5.5.1. 自动检查:

✓ 以@startuml开始，以@enduml结束
✓ 参与者角色对应于User Story
✓ 参与者存在于架构图中
✓ 每个阶段都有"== 名称 =="格式的名称
✓ 为技术交互指定了协议
✓ 同步/异步箭头使用正确
✓ 至少有1个备选流程(alt/opt/loop)


---

#### 4.5.6. 基本模板

plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 

actor User as "[来自User Story的角色]"
participant Browser as "浏览器"
participant "Web Server" as WebServer
participant "Application Server" as AppServer
participant "Database Server" as DBServer

== 操作启动 ==
User -> Browser : [业务操作]
Browser -> WebServer : HTTP [方法] /[端点]

== 请求处理 ==
WebServer -> AppServer : REST API: [方法]

== 数据操作 ==
AppServer -> DBServer : JDBC: [SQL操作]
DBServer --> AppServer : [结果]

== 结果返回 ==
AppServer --> WebServer : JSON: [数据]
WebServer --> Browser : HTTP 200 OK
Browser --> User : [结果显示]

@enduml


---

#### 4.5.7. 交互类型

##### 4.5.7.1. 协议和语法:
| 类型 | 语法 | 示例 |
|-----|-----------|--------|
| **HTTP** | `HTTP [方法] /端点` | `HTTP GET /api/users` |
| **REST API** | `REST API: [操作]` | `REST API: getUserData` |
| **数据库** | `JDBC: [SQL]` | `JDBC: SELECT * FROM users` |
| **消息队列** | `MQ: [操作]` | `MQ: publish userCreated` |
| **gRPC** | `gRPC: [方法]` | `gRPC: GetUserProfile` |

##### 4.5.7.2. 箭头类型:
- `->` 和 `-->` - 同步调用/响应
- `->>` 和 `-->>` - 异步调用/响应
- `->` 到自身 - 内部处理

##### 4.5.7.3. 控制结构:
plantuml
alt 成功场景
    // 主流程
else 错误
    // 错误处理
end

opt 条件执行
    // 可选操作
end

loop 重复
    // 循环操作
end


---

#### 4.5.8. 与工件的集成

##### 4.5.8.1. 与User Story的连接:
- **图表参与者** = 来自US的角色
- **主流程** = 来自US的操作描述
- **结果** = 来自US的预期收益

##### 4.5.8.2. 与Use Case的连接:
- **主UC场景** = 主序列
- **备选UC流程** = 图表中的alt/opt块
- **UC异常** = 错误处理块

##### 4.5.8.3. 与架构的连接:
- **序列参与者** = 来自架构的组件
- **交互** = 组件之间的连接
- **协议** = 集成技术

---

#### 4.5.9. 标准阶段和名称

##### 4.5.9.1. 典型组:
1. **启动**: "用户启动操作"
2. **认证**: "访问权限验证"
3. **验证**: "输入数据验证"
4. **处理**: "业务逻辑和计算"
5. **存储**: "数据库操作"
6. **通知**: "消息发送"
7. **响应**: "向用户返回结果"

##### 4.5.9.2. 具体名称示例:
- "== 加载订单列表 =="
- "== 验证支付数据正确性 =="
- "== 生成销售报告 =="

---

#### 4.5.10. 错误处理

##### 4.5.10.1. 强制性错误场景:
plantuml
alt 成功执行
    AppServer -> DBServer : SELECT查询
    DBServer --> AppServer : 返回数据
else 数据库连接错误
    AppServer -> DBServer : SELECT查询
    DBServer --> AppServer : 错误: 连接超时
    AppServer --> WebServer : HTTP 500 Internal Error
    WebServer --> Browser : 错误页面
else 数据验证错误
    AppServer -> AppServer : 验证输入
    AppServer --> WebServer : HTTP 400 Bad Request
    WebServer --> Browser : 错误消息
end


---

#### 4.5.11. 质量检查清单

##### 4.5.11.1. 结构验证:
- [ ] ✅ 文件以`@startuml`开始，以`@enduml`结束
- [ ] ✅ 使用autonumber进行步骤编号
- [ ] ✅ 参与者对应于User Story中的角色
- [ ] ✅ 所有参与者都在架构图中

##### 4.5.11.2. 逻辑验证:
- [ ] ✅ 3-7个具有清晰名称的逻辑阶段
- [ ] ✅ 步骤序列对应于Use Case
- [ ] ✅ 有备选流程(alt/opt/loop)
- [ ] ✅ 处理至少2种错误类型

##### 4.5.11.3. 技术验证:
- [ ] ✅ 为所有技术调用指定了协议
- [ ] ✅ HTTP方法和端点已具体化
- [ ] ✅ SQL操作已详细说明
- [ ] ✅ 同步/异步调用正确

##### 4.5.11.4. 集成验证:
- [ ] 🔗 与主Use Case场景一致
- [ ] 🔗 覆盖架构中的所有参与者
- [ ] 🔗 技术细节符合API规范

**目标**: 创建准备好进行技术实现和测试的序列图。

---

#### 4.5.12. 样式建议

##### 4.5.12.1. 命名:
- **参与者**: 具体的业务角色
- **参与者**: 架构组件
- **消息**: 面向用户的业务术语，面向系统的技术术语

##### 4.5.12.2. 详细程度:
- **简洁性**: 消息最多50个字符
- **清晰性**: 可理解的术语
- **顺序性**: 逻辑调用顺序
- **分组**: 合并相关操作

##### 4.5.12.3. 质量描述示例:
✅ "HTTP POST /api/orders - 创建订单"  
✅ "JDBC: INSERT INTO orders (user_id, total)"  
✅ "显示订单确认页面"  

❌ "发出请求"  
❌ "返回数据"  
❌ "系统处理"

