### 4.5. PlantUML格式的业务流程活动图 (活动图)
**为AI代理创建活动图的说明**

#### 4.5.1. 内容
1. [基础和要求](#基础和要求)
2. [图表结构](#图表结构)
3. [质量指标](#质量指标)
4. [验证规则](#验证规则)
5. [基本模板](#基本模板)
6. [图表元素](#图表元素)
7. [控制结构](#控制结构)
8. [并发处理](#并发处理)
9. [与工件的集成](#与工件的集成)
10. [标准模式](#标准模式)
11. [质量检查清单](#质量检查清单)

---

#### 4.5.2. 基础和要求

##### 4.5.2.1. 强制性输入工件：
- **User Story** - 用于理解业务目标和流程边界
- **Use Case** - 用于详细描述操作流程
- **Business Process Description** - 用于理解逻辑和规则

##### 4.5.2.2. 附加工件：
- 技术规范，Business Rules，Workflow 文档
- 用于理解交互的顺序图

##### 4.5.2.3. 活动图目的：
- 对操作流程和决策进行建模
- 并行处理和同步的可视化
- 从头到尾展示业务流程逻辑
- 识别决策点和替代路径

---

#### 4.5.3. 图表结构

##### 4.5.3.1. 标题和设置
plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title 来自 User Story 的流程名称


##### 4.5.3.2. Swimlanes (职责通道)
plantuml
|角色1|
start
:操作1;

|角色2|
:操作2;

|系统|
:自动操作;


##### 4.5.3.3. 结构组织
- **开始**：强制性起点
- **操作**：具体步骤的描述
- **决策**：逻辑分支点
- **并发**：用于并发操作的 fork/join
- **完成**：end 或 stop

---

#### 4.5.4. 质量指标

##### 4.5.4.1. 目标指标：
- **流程覆盖度**：Use Case 中 100% 的步骤得到体现
- **逻辑分组**：使用 swimlanes 表示角色
- **决策详细程度**：每个 'if' 都有所有可能的出口
- **并发性**：识别并建模了并发流程
- **错误处理**：至少 2 个错误处理流程

##### 4.5.4.2. 评分系统：
- **优秀质量**：≥90% 符合指标 + 完整的 Use Case 覆盖
- **良好质量**：70-89% 符合指标
- **需要改进**：<70% 符合指标

##### 4.5.4.3. 具体指标：
- Swimlanes 数量：2-6（根据 Use Case 中的角色）
- 决策数量：每 10 个操作有 1-5 个决策
- 嵌套深度：不超过 3 层
- 并行流：识别了所有可能的并行流程

---

#### 4.5.5. 验证规则

##### 4.5.5.1. 自动检查：

✓ 以 @startuml 开始，以 @enduml 结束
✓ 有唯一的起点
✓ 所有路径都通向 end/stop
✓ 每个 'if' 都有相应的 then/else 分支
✓ 所有 fork 都有相应的 join
✓ Swimlanes 与 Use Case 中的角色对应
✓ 操作包含主动动词
✓ 没有无输入/输出的"悬挂"操作
✓ 决策以问题的形式表述


##### 4.5.5.2. 语义检查：

✓ 每个操作对应于 Use Case 中的一个步骤
✓ 操作序列在逻辑上是连贯的
✓ Swimlanes 中的角色与 User Story 中的参与者对应
✓ 体现了 Use Case 中的所有替代流程
✓ 错误处理涵盖了主要异常


---

#### 4.5.6. 基本模板

plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title [来自 User Story 的流程名称]

|[来自 User Story 的角色]|
start
:[初始操作];

if ([决策条件]?) then (yes)
  :[积极结果时的操作];
else (no)
  :[消极结果时的操作];
  stop
endif

|[系统/其他角色]|
:[自动或委托的操作];

|[来自 User Story 的角色]|
:[最终操作];
end

@enduml


---

#### 4.5.7. 图表元素

##### 4.5.7.1. 基本元素:

###### 4.5.7.1.1. 开始和结束
plantuml
start                    // 单一入口点
end                      // 正常完成
stop                     // 紧急终止
kill                     // 强制终止
detach                   // 异步终止


###### 4.5.7.1.2. 活动
plantuml
:使用主动动词的操作;
:检查数据正确性;
:发送通知;
:[系统操作放在方括号中];


**活动命名规则:**
- 以不定式的主动动词开头
- 具体且可衡量
- 避免技术细节，专注于业务逻辑
- 长度：2-6个词

###### 4.5.7.1.3. 决策点
plantuml
if (数据有效吗?) then (yes)
  :继续处理;
else (no)
  :返回验证错误;
  stop
endif

// 多个选项
switch (用户类型?)
case (Admin)
  :显示管理员面板;
case (User)
  :显示用户界面;
case (Guest)
  :显示访客页面;
endswitch


###### 4.5.7.1.4. 并行处理
plantuml
fork
  :发送电子邮件;
fork again
  :发送短信;
fork again
  :写入审计日志;
end fork

// 带同步
fork
  :处理付款;
fork again
  :预留产品;
end merge  // 等待所有分支完成


###### 4.5.7.1.5. 循环和重复
plantuml
// 简单循环
repeat
  :获取下一个项目;
  :处理项目;
repeat while (还有更多项目吗?)

// While 循环
while (继续条件?)
  :执行操作;
endwhile

// For 循环
repeat :i = 1;
  :处理项目 i;
  :i = i + 1;
repeat while (i <= 数量?)


---

#### 4.5.8. 控制结构

##### 4.5.8.1. 简单分支
plantuml
if (用户已认证吗?) then (yes)
  :显示个人数据;
else (no)
  :重定向到登录页面;
  stop
endif


##### 4.5.8.2. 多重分支
plantuml
switch (订单状态?)
case (新建)
  :发送处理;
case (处理中)
  :继续处理;
case (已完成)
  :发送给客户;
case (已取消)
  :退款;
  stop
endswitch


##### 4.5.8.3. 嵌套条件
plantuml
if (用户已认证吗?) then (yes)
  if (有管理员权限吗?) then (yes)
    :显示管理员功能;
  else (no)
    :显示常规界面;
  endif
else (no)
  :显示登录表单;
endif


##### 4.5.8.4. 异常处理
plantuml
:尝试执行操作;
note right: 可能产生错误

if (操作成功吗?) then (yes)
  :继续执行;
else (no)
  if (关键错误吗?) then (yes)
    :记录错误;
    :通知管理员;
    stop
  else (no)
    :向用户显示消息;
    :建议重试;
  endif
endif


---

#### 4.5.9. 并发处理

##### 4.5.9.1. 独立并行流程
plantuml
fork
  :发送电子邮件通知;
fork again
  :发送推送通知;
fork again
  :写入审计日志;
end fork

:继续主流程;


##### 4.5.9.2. 同步流程
plantuml
fork
  :检查产品可用性;
fork again
  :检查信用额度;
fork again
  :检查送货地址;
end merge

if (所有检查都通过了吗?) then (yes)
  :创建订单;
else (no)
  :拒绝订单;
  stop
endif


##### 4.5.9.3. 条件并发
plantuml
if (需要加急交付吗?) then (yes)
  fork
    :预留产品;
  fork again
    :查找最近仓库;
  fork again
    :准备快递员;
  end merge
else (no)
  :标准订单处理;
endif


---

#### 4.5.10. 与工件的集成

##### 4.5.10.1. 与 User Story 的连接：
- **Swimlanes 中的角色** = 来自 "As a [role]" 的角色
- **主流程** = "I want to [action]" 的实现
- **图表结果** = "So that [benefit]" 的达成

##### 4.5.10.2. 与 Use Case 的连接：
- **UC 主流程** = 操作的主序列
- **UC 替代流程** = else/case 分支
- **UC 异常** = 错误处理块
- **UC 前置条件** = 图表开始时的条件
- **UC 后置条件** = 结束点的状态

##### 4.5.10.3. 与 Business Rules 的连接：
- **决策规则** = if/switch 中的条件
- **业务约束** = 验证块
- **审批流程** = 相应 swimlanes 中的序列

##### 4.5.10.4. 与技术工件的连接：
- **API 规范** = 自动化操作
- **数据库模式** = 数据持久化操作
- **顺序图** = swimlanes 之间交互的详细说明

---

#### 4.5.11. 标准模式

##### 4.5.11.1. "请求-处理-响应" 模式
plantuml
|用户|
start
:发送请求;

|系统|
:接收请求;
:验证数据;

if (数据有效吗?) then (yes)
  :处理请求;
  :形成响应;
else (no)
  :形成错误;
endif

|用户|
:接收响应;
end


##### 4.5.11.2. "审批工作流" 模式
plantuml
|发起者|
start
:创建请求;

|经理|
:审查请求;

if (批准吗?) then (yes)
  if (金额 > 限制吗?) then (yes)
    |总监|
    :最终批准;
    
    if (批准吗?) then (yes)
      |系统|
      :执行操作;
    else (no)
      :拒绝;
      stop
    endif
  else (no)
    |系统|
    :执行操作;
  endif
else (no)
  :拒绝;
  stop
endif

|发起者|
:接收通知;
end


##### 4.5.11.3. "批处理" 模式
plantuml
|系统|
start
:获取项目列表;

repeat
  :取下一个项目;
  
  fork
    :处理项目;
  fork again
    :记录进度;
  end fork
  
repeat while (存在未处理的项目吗?)

:生成报告;
:发送完成通知;
end


##### 4.5.11.4. "错误恢复" 模式
plantuml
|系统|
start
:retry_count = 0;

repeat
  :尝试执行操作;
  
  if (操作成功吗?) then (yes)
    :记录结果;
    end
  else (no)
    :retry_count++;
    
    if (retry_count < 最大重试次数?) then (yes)
      :等待间隔;
    else (no)
      :记录关键错误;
      :通知管理员;
      stop
    endif
  endif
repeat while (retry_count < 最大重试次数?)


---

#### 4.5.12. Swimlanes 和角色

##### 4.5.12.1. Swimlanes 使用规则：
1. **一个 swimlane = 一个角色/系统**
2. **最多 6 个 swimlanes**（为了可读性）
3. **角色来自 User Story 和 Use Case**
4. **系统与人类角色分开**

##### 4.5.12.2. 标准 swimlanes：
plantuml
|用户|        // 来自 User Story 的主要角色
|系统|             // 自动化流程
|管理员|       // 管理操作
|外部系统|     // 集成
|数据库|         // 仅用于复杂流程


##### 4.5.12.3. Swimlanes 之间的转换：
- 控制转移 = 转换到另一个 swimlane 中的操作
- 并行工作 = 在不同 swimlanes 中具有操作的 fork
- 同步 = 合并来自不同 swimlanes 的操作

---

#### 4.5.13. 典型错误及如何避免

##### 4.5.13.1. 过于技术化的细节
❌ **错误：**
plantuml
:对 users 表执行 SQL SELECT 查询;
:反序列化 JSON 响应;
:更新 Redux store;


✅ **正确：**
plantuml
:获取用户数据;
:处理接收到的信息;
:更新显示;


##### 4.5.13.2. 混合抽象级别
❌ **错误：**
plantuml
:点击"发送"按钮;
:验证电子邮件地址;
:发送 HTTP POST 请求;
:显示成功消息;


✅ **正确：**
plantuml
:启动表单提交;
:检查数据正确性;
:将数据传输到系统;
:通知结果;


##### 4.5.13.3. 缺乏错误处理
❌ **错误：**
plantuml
:发送请求;
:接收响应;
:显示结果;


✅ **正确：**
plantuml
:发送请求;

if (请求成功吗?) then (yes)
  :显示结果;
else (no)
  :显示错误消息;
endif


##### 4.5.13.4. 错误的并发使用
❌ **错误：**（顺序操作作为并行）
plantuml
fork
  :认证;
fork again
  :获取个人资料数据;
end fork


✅ **正确：**
plantuml
:认证;

fork
  :发送欢迎电子邮件;
fork again
  :记录审计事件;
end fork

:重定向到主页;


---

#### 4.5.14. 特殊元素

##### 4.5.14.1. 注释和评论
plantuml
:执行复杂操作;
note right
  此操作可能需要
  最多30秒
end note

:另一个操作;
note left: 快速操作


##### 4.5.14.2. 相关子流程
plantuml
:启动审批流程;
note right: 参见单独的图表"审批流程"

:等待审批结果;


##### 4.5.14.3. 入口/出口点
plantuml
// 多个入口点
start
:正常入口;
end

(*) --> :紧急入口;


##### 4.5.14.4. 时间限制
plantuml
:发送请求;
:等待响应30秒;

if (按时收到响应吗?) then (yes)
  :处理响应;
else (no)
  :处理超时;
  stop
endif


---

#### 4.5.15. 质量检查清单

##### 4.5.15.1. 结构验证：
- [ ] 图表以 `@startuml` 开始并以 `@enduml` 结束
- [ ] 有唯一的 `start` 点
- [ ] 所有路径都通向 `end`、`stop`、`kill` 或 `detach`
- [ ] 每个 `if` 都有相应的 `endif`
- [ ] 每个 `fork` 都有相应的 `end fork` 或 `end merge`
- [ ] 每个 `repeat` 都有相应的 `repeat while`
- [ ] 所有 swimlanes 都有有意义的名称

##### 4.5.15.2. 语义验证：
- [ ] 图表覆盖了 Use Case 中的主流程
- [ ] 体现了 Use Case 中的替代流程
- [ ] Swimlanes 中的角色与 User Story 对应
- [ ] 每个操作都以主动动词开头
- [ ] 决策以具有清晰答案选项的问题形式表述
- [ ] 关键操作存在错误处理
- [ ] 并行流程已正确识别和建模

##### 4.5.15.3. 可读性检查：
- [ ] Swimlanes 数量：2-6
- [ ] 条件嵌套深度：不超过 3 层
- [ ] 操作长度：2-6 个词
- [ ] 可以直观区分逻辑操作组
- [ ] 图表适合一张 A4 纸

##### 4.5.15.4. 需求符合性检查：
- [ ] 体现了 Use Case 中的所有步骤
- [ ] 业务规则反映在条件中
- [ ] 角色和职责清晰分离
- [ ] 决策点符合业务逻辑
- [ ] 图表结果达到了 User Story 的目标

##### 4.5.15.5. 最终检查：
- [ ] 图表在 PlantUML 中编译无错误
- [ ] 标题反映了流程的本质
- [ ] 视觉设计符合标准
- [ ] 利益相关者无需额外解释即可理解图表

---

#### 4.5.16. 典型图表示例

##### 4.5.16.1. 简单线性流程
plantuml
@startuml
title 用户注册流程

|用户|
start
:填写注册表单;
:点击"注册";

|系统|
:获取表单数据;
:验证数据;

if (数据有效吗?) then (yes)
  :创建账户;
  :发送确认电子邮件;
  
  |用户|
  :接收电子邮件;
  :点击确认链接;
  
  |系统|
  :激活账户;
  :重定向到主页;
  
  |用户|
  :开始使用系统;
  end
else (no)
  |用户|
  :看到错误消息;
  :更正数据;
  stop
endif

@enduml


##### 4.5.16.2. 具有并行任务的流程
plantuml
@startuml
title 订单处理流程

|客户|
start
:添加商品到购物车;
:进行结算;
:指定送货地址;
:选择付款方式;

|系统|
fork
  :计算送货成本;
fork again
  :检查商品可用性;
fork again
  :验证付款数据;
end merge

if (所有检查都成功吗?) then (yes)
  :创建订单;
  
  fork
    :预留商品;
  fork again
    :发送通知给卖家;
  fork again
    :启动付款流程;
  end fork
  
  |客户|
  :接收订单确认;
  end
else (no)
  :显示错误;
  
  |客户|
  :更正订单数据;
  stop
endif

@enduml


本说明确保创建高质量的活动图，准确反映业务流程，并且所有利益相关者都能轻松阅读。

