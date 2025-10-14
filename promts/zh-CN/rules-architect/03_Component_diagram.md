### 4.5. [C4 Level 3] 组件图 (Component Diagram)
#### 4.5.1. 在 PlantUML 中创建组件图 (C4 Level 3) 的说明
##### 4.5.1.1. 概念和目的

**组件图 (Component Diagram)** — 是 C4 表示法中的第三级图表。它详细说明了每个**容器**（来自容器图），显示了它由哪些逻辑组件（模块、服务）组成以及它们如何在内部交互。

当要求绘制组件图时，必须向用户询问需要为哪些容器绘制组件图（给他选择的机会）。

禁止指定使用的技术：在设计图表之前，必须向用户澄清项目中使用的技术栈；如果用户无法指定技术栈，则在所有级别的 C4 图表上排除技术栈的指示

*   **受众：** 开发人员、架构师。
*   **目的：** 回答问题：*"容器内部是如何构造的？"*, *"它由哪些组件组成？"*, *"这些组件如何相互交互？"*
*   **关键元素：** 组件、接口（API）、它们之间的关系。

如果图表文件存在，必须询问用户是需要更新当前文件还是将图表保存到具有下一版本的文件中。

在创建图表期间应用 KISS 原则（Keep It Simple, Stupid 或 Keep It Short and Simple） - 这是一个基本的设计和开发原则，根据该原则，大多数系统在保持简单而不是不必要地复杂化时效果最佳。
##### 4.5.1.2. PlantUML 的基本语法 for C4


要在 PlantUML 中使用 C4 表示法，必须包含相应的库。
图表必须符合 https://github.com/plantuml-stdlib/C4-PlantUML 中指定的语法


向用户询问需要为哪些容器绘制组件图，从容器的图表中获取容器列表（如果已创建），如果未创建则创建它。


**脚本开头的强制行：**
plantuml
@startuml
!include <C4/C4_Component>
' 你的图表代码在这里...
@enduml

##### 4.5.1.3. 基本元素及其声明
###### 4.5.1.3.1. 容器 (Container)
我们正在详细说明的顶级元素。它必须在容器图上声明。


Container(alias, "label", "technology", "optional description")


###### 4.5.1.3.2. 组件 (Components)
图表的主要构建块。这些是容器内逻辑分组的模块、服务或库。

**声明语法：**

Component(alias, "label", "technology", "optional description")

*   `alias` - 元素的唯一标识符（拉丁文，无空格）。
*   `label` - 显示的组件名称。
*   `technology` - 技术指示（例如，"Java Class", "REST Controller", "Spring Service"）。
*   `description` - 组件职责的可选描述。

**示例：**
plantuml
Component(controller, "OrderController", "Spring REST Controller", "处理与订单相关的 HTTP 请求")
Component(service, "OrderService", "Spring Service", "封装订单处理的业务逻辑")
Component(repository, "OrderRepository", "JPA Repository", "提供订单数据持久性")


###### 4.5.1.3.3. 接口 (Interfaces)
显示组件如何相互或向外部世界（例如 API）提供功能。

**语法：**

Rel_U(to, from, "interface label", "technology")

*   `to`, `from` - 连接元素的别名。
*   `interface label` - 接口/API 的名称（例如，"getOrderById"）。
*   `technology` - 技术/协议（例如，"REST", "Java Interface"）。

**示例：**
plantuml
Rel_U(controller, service, "Order API", "Java Interface")


###### 4.5.1.3.4. 关系 (Relationships)
显示组件之间的交互。指示交互的性质。

**语法：**

Rel(from, to, "label", "technology")

*   `from`, `to` - 连接元素的别名。
*   `label` - 交互描述（例如，"调用", "使用"）。
*   `technology` - 技术/协议（例如，"method call", "REST"）。

**示例：**
plantuml
Rel(service, repository, "使用", "JPA")


###### 4.5.1.3.5. 数据库和外部依赖项
用于显示与容器内的数据库或外部服务的交互。


ContainerDb(alias, "label", "technology", "optional description")


**示例：**
plantuml
ContainerDb(database, "订单数据库", "PostgreSQL", "存储订单数据")


##### 4.5.1.4. 组件分组
用于按职责或层对组件进行视觉组织。


Boundary(alias, "label") {
    Component(component1, "Component1")
    Component(component2, "Component2")
}


**示例：**
plantuml
Boundary(web_layer, "Web 层") {
    Component(controller, "OrderController")
}
Boundary(service_layer, "服务层") {
    Component(service, "OrderService")
}
Boundary(persistence_layer, "持久层") {
    Component(repository, "OrderRepository")
}


##### 4.5.1.5. 图例 (Legend)
对于官方文档，建议添加图例。


SHOW_LEGEND()


##### 4.5.1.6. 完整图表示例

plantuml
@startuml
!include <C4/C4_Component>

Title 组件图 - 后端 API（订单微服务）

Container(api, "订单服务", "Spring Boot", "用于订单管理的微服务")

Boundary(api_boundary, "订单服务组件") {
    Component(order_controller, "OrderController", "REST Controller", "处理 HTTP 请求")
    Component(order_service, "OrderService", "Spring Service", "订单业务逻辑")
    Component(order_repository, "OrderRepository", "JPA Repository", "数据访问")
    Component(inventory_client, "InventoryClient", "Feign Client", "调用库存服务")
    Component(notification_service, "NotificationService", "Spring Service", "发送通知")
}

ContainerDb(order_db, "订单数据库", "PostgreSQL", "订单存储")
System_Ext(inventory_service, "库存服务", "库存管理服务")
System_Ext(email_service, "电子邮件服务", "电子邮件发送服务")

Rel(order_controller, order_service, "调用", "Java Interface")
Rel(order_service, order_repository, "使用", "JPA")
Rel(order_service, inventory_client, "检查可用性", "REST")
Rel(order_service, notification_service, "请求通知", "Java Interface")
Rel(order_repository, order_db, "保存到", "JDBC")
Rel(inventory_client, inventory_service, "调用 API", "HTTP/REST")
Rel(notification_service, email_service, "发送请求", "SMTP")

SHOW_LEGEND()

@enduml


##### 4.5.1.7. 图表质量检查清单
保存前检查图表：
1.  [ ] **包含指令** `!include <C4/C4_Component>`
2.  [ ] **有清晰的标题** (`Title`) 并带有详细容器的指示。
3.  [ ] **所有关系** 都有标签（执行什么动作）。
4.  [ ] **显示了组件之间的关键接口**。
5.  [ ] **没有过多细节**（无需显示所有方法和类）。
6.  [ ] **元素的别名** 它是独一无二的，用拉丁文书写，并在括号中附有中文抄本。
7.  [ ] **图例** (`SHOW_LEGEND()`) 已为官方工件添加。
8.  [ ] **语法** PlantUML 图表在 C4 表示法中的质量：图表不得与 https://github.com/plantuml-stdlib/C4-PlantUML 中指定的语法相矛盾
9.  [ ] 向用户询问需要为哪些其他容器绘制组件图
10. [ ] **完成时** 询问用户需要生成或调整哪些其他文档，并向他提供列表。

**文件名称格式：** `c4_Level_3_component_diagram_[项目名称]_([容器名称])_v[版本号（从1开始）].plantuml`

