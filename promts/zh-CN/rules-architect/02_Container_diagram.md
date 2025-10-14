### 4.4. [C4 Level 2] 容器图 (Container Diagram)
#### 4.4.1. 在 PlantUML 中创建容器图 (C4 Level 2) 的说明

##### 4.4.1.1. 概念和目的
**容器图 (Container Diagram)** — 是 C4 表示法中的第二级图表。它详细说明了**系统**（来自上下文图），显示了它由哪些大型可执行单元（容器）组成以及它们如何交互。

*   **受众：** 开发人员、DevOps 工程师、架构师。
*   **目的：** 回答问题：*"系统在底层如何工作？"*, *"它由哪些大型组件组成？"*, *"它们如何通信？"*。
*   **关键元素：** 容器（应用程序、数据库）、它们之间的关系和关键技术。

禁止指定使用的技术：在设计图表之前，必须向用户澄清项目中使用的技术栈；如果用户无法指定技术栈，则在所有级别的 C4 图表上排除技术栈的指示。

如果图表文件存在，必须询问用户是需要更新当前文件还是将图表保存到具有下一版本的文件中。
##### 4.4.1.2. PlantUML 的基本语法 for C4

要在 PlantUML 中使用 C4 表示法，必须包含相应的库。
图表必须符合 https://github.com/plantuml-stdlib/C4-PlantUML 中指定的语法

**脚本开头的强制行：**
plantuml
@startuml
!include <C4/C4_Container>
' 你的图表代码在这里...
@enduml


##### 4.4.1.3. 基本元素及其声明

##### 4.4.1.3.1. 系统（上下文澄清）
我们正在详细说明的顶级元素。


System(alias, "label", "optional description")

*   `alias` - 元素的唯一标识符（拉丁文，无空格）。
*   `label` - 显示的名称。
*   `description` - 可选描述。

**示例：**
plantuml
System(online_banking, "网上银行", "通过网页和移动设备为客户提供对其账户和交易的访问")


##### 4.4.1.3.2. 容器 (Containers)
图表的主要构建块。这些是可运行的进程/应用程序或数据存储。

**声明语法：**

Container(alias, "label", "technology", "optional description")

*   `technology` - 技术指示（例如，"React", "Spring Boot", "PostgreSQL"）。

**容器类型：**
*   `Container()` - 通用容器（应用程序、服务）。
*   `ContainerDb()` - 数据库容器。
*   `ContainerQueue()` - 消息队列容器（代理）。
*   `Container_Ext()` - 外部容器（由第三方管理）。

**示例：**
plantuml
Container(spa, "Web 应用程序", "客户的单页应用程序")
ContainerDb(db, "数据库", "存储所有财务数据和用户登录信息")
Container(backend_api, "后端 API", "为网页和移动客户端提供 REST API")
Container_Ext(email_service, "电子邮件服务", "用于发送通知的外部服务")


##### 4.4.1.3.3. 关系 (Relationships)
显示容器之间的交互。指示交互的协议或技术。

**语法：**

Rel(from, to, "label", "technology")

*   `from`, `to` - 连接元素的别名。
*   `label` - 交互描述（例如，"读取/写入"）。
*   `technology` - 技术/协议（例如，"REST API", "JDBC", "Kafka"）。

**示例：**
plantuml
Rel(spa, backend_api, "调用 API")
Rel(backend_api, db, "读取/写入")
Rel(backend_api, email_service, "发送通知")


#### 4.4.1.4. 分组和边界 (Boundaries)
为了直观地突出属于不同领域或团队的系统部分，请使用边界。

**语法：**

Boundary(alias, "label") {
    container1 = Container(...)
    container2 = Container(...)
    Rel(container1, container2, ...)
}


**示例：**
plantuml
Boundary(boundary_backend, "后端领域") {
    Container(api_gateway, "API 网关")
    Container(user_service, "用户服务")
    Container(account_service, "账户服务")
    Rel(api_gateway, user_service, "调用")
    Rel(api_gateway, account_service, "调用")
}


#### 4.4.1.5. 图例 (Legend)
对于官方文档，建议添加解释图表元素的图例。


SHOW_LEGEND()


#### 4.4.1.6. 完整图表示例

plantuml
@startuml
!include <C4/C4_Container>

Title "容器图 - 网上银行系统"

Person(customer, "客户", "使用网上银行")

System_Boundary(online_banking_system, "网上银行") {
    Container(spa, "Web 应用程序","单页应用程序")
    Container(mobile_app, "移动应用程序","原生移动应用程序")
    Container(backend_api, "后端 API", "主要业务逻辑服务")
    ContainerDb(db, "数据库",  "存储用户数据和交易")
}

System_Ext(processing_system, "支付系统", "用于支付处理的外部系统")

Rel(customer, spa, "访问网站")
Rel(customer, mobile_app, "使用应用程序")
Rel(spa, backend_api, "调用 API")
Rel(mobile_app, backend_api, "调用 API")
Rel(backend_api, db, "读取/写入")
Rel(backend_api, processing_system, "发送支付请求")

SHOW_LEGEND()
@enduml


#### 4.4.1.7. 图表质量检查清单
保存前检查图表：
1.  [ ] **包含指令** `!include <C4/C4_Container>`
2.  [ ] **角色** 其他文件中指定的所有用户角色必须在此图表中考虑。
3.  [ ] **有清晰的标题** (`Title`)。
4.  [ ] **所有容器** 没有技术指示。
5.  [ ] **所有关系** 都有标签（执行什么动作，没有协议指示）。
6.  [ ] **没有过多细节**（如果有数十个微服务，则无需显示所有微服务）。
7.  [ ] **元素的别名** 是唯一的并且用拉丁文书写。
8.  [ ] **图例** (`SHOW_LEGEND()`) 已为官方工件添加。
9.  [ ] **在微服务架构的情况下：** 一个服务不允许创建超过两个同类型的数据库。
10. [ ] **禁止指定使用的技术：** 在设计图表之前，必须向用户澄清项目中使用的技术栈；如果用户无法指定技术栈，则在所有级别的 C4 图表上排除技术栈的指示。
11. [ ] **用户角色检查** 图表必须指示上下文图 (C4 Level 1) 中存在的所有用户角色。
12. [ ] **完成时** 询问用户需要生成或调整哪些其他文档，并向他提供列表。

**文件名称格式：** `c4_Level_2_containers_diagram_[项目名称]_v[版本号（从1开始）].plantuml`

