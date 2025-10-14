### 4.3. [C4 level 1] 上下文图 (Context Diagram)
#### 4.3.1. 在 PlantUML 中创建上下文图 (C4 Level 1) 的说明
##### 4.3.1.1. 概念和目的
**上下文图 (Context Diagram)** — 是 C4 表示法中的最高级别图表 (Level 1)。它将系统显示为一个完整的块及其与外部世界的交互。
**受众：** 所有利益相关者，包括非技术人员（业务客户、经理）。
**目的：** 回答问题：*"系统做什么？"*, *"谁使用它？"*, *"它与哪些外部系统交互？"*
**关键元素：** 系统、人员/角色（参与者）、外部系统。
禁止指定使用的技术：在设计图表之前，必须向用户澄清项目中使用的技术栈；如果用户无法指定技术栈，则在所有级别的 C4 图表上排除技术栈的指示。
如果图表文件存在，必须询问用户是需要更新当前文件还是将图表保存到具有下一版本的文件中。
##### 4.3.1.2. PlantUML 的基本语法 for C4
要在 PlantUML 中使用 C4 表示法，必须包含相应的库。
**脚本开头的强制行：**
plantuml
@startuml
!include <C4/C4_Context>
' 你的图表代码在这里...
@enduml

##### 4.3.1.3. 基本元素及其声明
###### 4.3.1.3.1. 系统 (System)
图表的中心元素，我们正在设计它。

System(alias, "label", "optional description")

*   `alias` - 元素的唯一标识符（拉丁文，无空格）。
*   `label` - 显示的系统名称。
*   `description` - 可选的系统用途简要说明。

**示例：**
plantuml
System(system_a, "订单管理系统", "处理客户订单，管理仓库和交付")

###### 4.3.1.3.2. 参与者 (People/Person)
与系统交互的人员或角色。

Person(alias, "label", "optional description")

*   `alias` - 唯一标识符。
*   `label` - 显示的角色/人员名称。

**示例：**
plantuml
Person(customer, "客户", "在线商店的商品购买者")
Person(admin, "管理员", "管理商品并跟踪订单")

###### 4.3.1.3.3. 外部系统 (External Systems)
在您团队控制之外的软件系统，但您的系统与之交互。

System_Ext(alias, "label", "optional description")

*   `alias` - 唯一标识符。
*   `label` - 显示的外部系统名称。
**示例：**
plantuml
System_Ext(payment_gateway, "支付网关", "处理信用卡支付")
System_Ext(email_service, "电子邮件通知服务", "向客户发送电子邮件")

###### 4.3.1.3.4. 关系 (Relationships)
显示元素之间的交互。指示交互的性质。

**语法：**

Rel(from, to, "label", "technology")

*   `from`, `to` - 连接元素的别名。
*   `label` - 交互描述（例如，"购买商品", "接收通知"）。
*   `technology` - 可选的技术/协议指示（例如，"Web UI", "REST API"）。*在上下文图上通常省略。*

**示例：**
plantuml
Rel(customer, system_a, "购买商品", "Web UI")
Rel(system_a, payment_gateway, "发起支付", "REST API")
Rel(system_a, email_service, "发送通知数据", "SMTP")
Rel(admin, system_a, "管理商品", "Web UI")

##### 4.3.1.4. 元素分组 (Boundaries)
为了直观地突出内部和外部环境，可以使用边界。


Enterprise_Boundary(alias, "label") {
    ' 企业边界内的元素
}


**示例：**
plantuml
Enterprise_Boundary(enterprise_a, "我们公司") {
    Person(admin, "管理员")
    System(system_a, "订单管理系统")
}
Enterprise_Boundary(enterprise_b, "合作伙伴") {
    System_Ext(payment_gateway, "支付网关")
}

##### 4.3.1.5. 图例 (Legend)
对于官方文档，建议添加图例。


SHOW_LEGEND()

##### 4.3.1.6. 完整图表示例

plantuml
@startuml
!include <C4/C4_Context>

Title 上下文图 - 订单管理系统

Person(customer, "客户", "在在线商店购买商品")
Person(admin, "管理员", "管理目录和订单")

System(system_a, "订单管理系统", "接受和处理订单，管理仓库")

System_Ext(payment_gateway, "支付网关", "处理卡片支付")
System_Ext(email_service, "电子邮件服务", "向客户发送通知")
System_Ext(erp_system, "ERP 系统", "接收会计数据")

Rel(customer, system_a, "浏览目录，购买商品")
Rel(admin, system_a, "管理商品并跟踪订单")
Rel(system_a, payment_gateway, "发起支付", "REST API")
Rel(system_a, email_service, "发送通知数据", "SMTP")
Rel(system_a, erp_system, "导出销售数据", "SFTP")

SHOW_LEGEND()

@enduml

##### 4.3.1.7. 图表质量检查清单
保存前检查图表：
1.  [ ] **包含指令** `!include <C4/C4_Context>`
2.  [ ] **有清晰的标题** (`Title`)。
3.  [ ] **只有一个中心系统**（您正在设计的那个）。
4.  [ ] **显示所有关键用户**（参与者）和**外部系统**。
5.  [ ] **关系** 使用清晰的业务语言标记（它们做什么，而不是如何技术实现）。
6.  [ ] **没有技术细节** 关于系统的内部结构（这是容器图的任务）。
7.  [ ] **元素的别名** 是唯一的并且用拉丁文书写。
8.  [ ] **图例** (`SHOW_LEGEND()`) 已为官方工件添加。
9.  [ ] **保存文件后** 询问用户需要生成或调整哪些其他文档，并向他提供列表。
**文件名称格式：** `c4_Level_1_context_diagram_[项目名称]_v[版本号（从1开始）].plantuml`
#### 4.3.2 质量指标
1. 完整性：
   * 所有关键参与者都在场
   * 反映了主要集成
2. 一致性：
   * 名称与其他工件一致
   * 与现实没有矛盾
3. 相关性：
   * 指定了图表版本
   * 有最后更新日期
#### 4.3.3 与其他工件的集成
1. 与 User Story：
   * 参与者必须协调一致
   * 反映了主要场景
2. 与 Component Diagram：
   * 外部系统被复制
   * 详细程度协调一致
3. 与 ERD：
   * 外部数据库与实体对应

