### 4.3. 后端逻辑描述
**描述功能操作逻辑的说明（后端逻辑）**

#### 4.3.1. 内容
1. [功能逻辑描述模板](#功能逻辑描述模板)
2. [质量指标](#质量指标)
3. [验证规则](#验证规则)
4. [分析方法论](#分析方法论)
5. [逻辑描述示例](#逻辑描述示例)
6. [质量标准](#质量标准)
7. [AI代理检查清单](#ai代理检查清单)

---

#### 4.3.2. 功能逻辑描述模板

##### 4.3.2.1. 强制性结构（8个主要块）：

| № | 块 | 描述 | 强制性 |
|---|----|------|--------|
| 1 | **总体概述** | 功能目的和高级逻辑 | ✅ 强制 |
| 2 | **输入数据** | 参数、类型、约束 | ✅ 强制 |
| 3 | **验证** | 数据检查、业务规则 | ✅ 强制 |
| 4 | **主要逻辑** | 算法、过程、计算 | ✅ 强制 |
| 5 | **集成** | 与外部系统的交互 | ✅ 强制 |
| 6 | **异常情况** | 错误处理、回滚 | ✅ 强制 |
| 7 | **输出数据** | 操作结果、响应格式 | ✅ 强制 |
| 8 | **性能** | 优化、缓存、限制 | 🔶 推荐 |

---

#### 4.3.3. 质量指标

##### 4.3.3.1. 目标指标：
- **结构完整性**：7/7个强制块 = 100%
- **验证覆盖**：最少5种不同类型的检查
- **算法细节**：带条件的逐步描述
- **错误覆盖**：最少80%可能的异常
- **集成连接性**：100%架构符合性

##### 4.3.3.2. 评分系统：
- **优秀质量**：90-100%指标符合性
- **良好质量**：70-89%指标符合性
- **需要改进**：<70%指标符合性

---

#### 4.3.4. 验证规则

##### 4.3.4.1. 自动检查：

###### 4.3.4.1.1. 结构验证

✓ 所有7个强制块存在
✓ 每个块包含最少3个项目
✓ 验证按类型结构化
✓ 算法逐步描述

###### 4.3.4.1.2. 逻辑验证

✓ 输入数据对应API规范
✓ 验证覆盖所有输入参数
✓ 算法逻辑顺序
✓ 异常对应真实场景

###### 4.3.4.1.3. 集成验证

✓ 集成对应架构图
✓ 验证与Use Case协调
✓ 错误对应API中的HTTP状态
✓ 性能考虑非功能性需求

---

#### 4.3.5. 分析方法论

##### 4.3.5.1. 步骤1：源数据收集
**分析来源：**
- User Story和Use Case
- API规范（OpenAPI）
- 架构图
- ERD图
- 序列图

##### 4.3.5.2. 步骤2：输入数据识别
**分析：**
- 来自API规范的请求参数
- 来自User Story的表单字段
- 来自其他服务的数据（集成）
- 上下文信息（用户、会话）

##### 4.3.5.3. 步骤3：验证定义
**验证类型：**
- **结构性**：数据类型、格式、长度
- **业务验证**：领域规则
- **安全性**：授权、访问权限
- **集成**：相关数据检查
- **约束**：限制、配额、时间窗口

##### 4.3.5.4. 步骤4：主要逻辑描述
**结构化方法：**
- 分解为逻辑阶段
- 条件分支（if-then-else）
- 循环操作
- 并行过程
- 事务块

##### 4.3.5.5. 步骤5：集成识别
**分析与以下交互：**
- 数据库（CRUD操作）
- 外部API
- 消息队列
- 缓存系统
- 文件存储

##### 4.3.5.6. 步骤6：错误处理
**异常类别：**
- 验证错误（400）
- 授权（401、403）
- 未找到（404）
- 冲突（409）
- 服务器错误（500）
- 服务不可用（503）

#### 4.3.6. 逻辑描述示例

##### 4.3.6.1. 示例1：银行转账

###### 4.3.6.1.1. 概述
**目的：** 处理账户间的资金转账，包括限额检查和历史记录保存。
**高层逻辑：** 验证 → 限额检查 → 资金预留 → 执行转账 → 通知

###### 4.3.6.1.2. 输入数据
typescript
interface TransferRequest {
  fromAccountId: string;     // 发送方账户UUID
  toAccountId: string;       // 接收方账户UUID
  amount: number;            // 金额（正数，最多2位小数）
  currency: string;          // 货币代码（ISO 4217，3个字符）
  comment?: string;          // 注释（最多200个字符）
  userId: string;            // 来自令牌的用户UUID
}


###### 4.3.6.1.3. 验证
**3.1. 结构验证：**
- `amount` > 0 且 <= 999999.99
- `fromAccountId` 和 `toAccountId` - 有效的UUID
- `currency` - 存在于货币目录中
- `comment` - 不包含禁止字符（<, >, &, ")

**3.2. 业务验证：**
- 用户是 `fromAccountId` 账户的所有者
- 发送方账户处于活动状态（status = 'ACTIVE'）
- 接收方账户存在且处于活动状态
- 账户货币与转账货币匹配
- 账户中有足够资金（余额 >= amount + 手续费）

**3.3. 限额验证：**
- 未超过每日限额
- 未超过每月限额
- 每日操作次数 <= 最大允许值

###### 4.3.6.1.4. 主要逻辑
**步骤1：获取账户信息**
sql
SELECT id, balance, currency, status, daily_limit, monthly_limit
FROM accounts
WHERE id IN (fromAccountId, toAccountId)


**步骤2：检查每日限额**
sql
SELECT SUM(amount) as daily_spent
FROM transfers
WHERE from_account_id = fromAccountId
  AND created_at >= CURRENT_DATE


**步骤3：计算手续费**
javascript
function calculateFee(amount, fromAccount, toAccount) {
  if (fromAccount.bank_id === toAccount.bank_id) {
    return 0; // 行内转账
  }
  return Math.min(amount * 0.015, 100); // 1.5%，最高100
}


**步骤4：创建交易**
sql
BEGIN TRANSACTION;

-- 预留资金
UPDATE accounts
SET balance = balance - (amount + fee),
    reserved = reserved + (amount + fee)
WHERE id = fromAccountId;

-- 创建转账记录
INSERT INTO transfers (id, from_account_id, to_account_id, amount, fee, status)
VALUES (uuid(), fromAccountId, toAccountId, amount, fee, 'PROCESSING');

COMMIT;


**步骤5：执行转账**
sql
BEGIN TRANSACTION;

-- 从发送方扣款
UPDATE accounts
SET reserved = reserved - (amount + fee)
WHERE id = fromAccountId;

-- 向接收方入账
UPDATE accounts
SET balance = balance + amount
WHERE id = toAccountId;

-- 更新状态
UPDATE transfers
SET status = 'COMPLETED', completed_at = NOW()
WHERE id = transferId;

COMMIT;


###### 4.3.6.1.5. 集成
**5.1. 数据库：**
- 读取：accounts, transfer_limits, exchange_rates
- 写入：transfers, account_transactions

**5.2. 外部服务：**
- **NotificationService**：发送SMS/push通知
- **AuditService**：操作日志记录
- **FraudService**：欺诈检查

**5.3. 缓存（Redis）：**
- 用户限额（TTL：24小时）
- 汇率（TTL：1小时）

###### 4.3.6.1.6. 异常情况
**6.1. 验证错误（400）：**
- 金额不正确 → "金额必须大于0"
- 资金不足 → "账户资金不足"
- 超过限额 → "超过每日转账限额"

**6.2. 授权错误（403）：**
- 非账户所有者 → "无此账户访问权限"
- 账户被锁定 → "账户已被锁定"

**6.3. 服务器错误（500）：**
- 数据库错误 → 回滚交易 + 重试
- 外部服务不可用 → 延迟处理

**6.4. 恢复策略：**
- **交易回滚**：出错时自动回滚
- **补偿操作**：出错时取消预留
- **重试**：最多3次，使用指数退避（exponential backoff）

###### 4.3.6.1.7. 输出数据
**7.1. 成功响应（201）：**
json
{
  "transferId": "uuid",
  "status": "COMPLETED",
  "amount": 1000.00,
  "fee": 0.00,
  "fromAccount": "xxx-1234",
  "toAccount": "xxx-5678",
  "timestamp": "2024-01-15T10:30:00Z"
}


**7.2. 验证错误（400）：**
json
{
  "error": "VALIDATION_ERROR",
  "message": "账户资金不足",
  "details": {
    "field": "amount",
    "available": 500.00,
    "requested": 1000.00
  }
}


###### 4.3.6.1.8. 性能
**8.1. 优化：**
- 在 (from_account_id, created_at) 上建立索引以处理限额
- 缓存用户限额
- 异步发送通知

**8.2. 限制：**
- 最大负载：1000 笔转账/秒
- 响应时间：< 2 秒（第99百分位）
- 可用性：99.9%

---

##### 4.3.6.2. 示例2：电子商务创建订单

###### 4.3.6.2.1. 概述
**目的：** 创建订单，包括商品预留、成本计算和启动配送流程。
**高层逻辑：** 购物车验证 → 商品预留 → 成本计算 → 创建订单 → 启动支付

###### 4.3.6.2.2. 输入数据
typescript
interface CreateOrderRequest {
  items: OrderItem[];        // 订单中的商品
  deliveryAddress: Address;  // 配送地址
  paymentMethod: string;     // 支付方式
  promoCode?: string;        // 促销代码
  userId: string;            // 用户ID
}

interface OrderItem {
  productId: string;    // 商品UUID
  quantity: number;     // 数量（1-100）
  variant?: string;     // 商品变体（尺寸，颜色）
}


###### 4.3.6.2.3. 验证
**3.1. 结构验证：**
- `items` 包含1到50个项目
- 每个商品的 `quantity` 为1到100
- `deliveryAddress` 包含所有必填字段
- `paymentMethod` 来自允许的列表

**3.2. 业务验证：**
- 所有商品存在且可销售
- 仓库中有足够数量
- 商品可以配送到指定地址
- 促销代码有效且适用

**3.3. 用户验证：**
- 用户活跃且未被锁定
- 配送地址属于用户
- 支付方式已绑定用户

###### 4.3.6.2.4. 主要逻辑
**步骤1：检查商品可用性**
sql
SELECT p.id, p.name, p.price, s.quantity as stock_quantity
FROM products p
JOIN stock s ON p.id = s.product_id
WHERE p.id IN (...) AND p.status = 'ACTIVE'


**步骤2：预留商品**
sql
BEGIN TRANSACTION;

UPDATE stock
SET quantity = quantity - reserved_quantity,
    reserved = reserved + reserved_quantity
WHERE product_id = ? AND quantity >= reserved_quantity;

-- 检查预留是否成功
IF @@ROWCOUNT = 0 THEN
  ROLLBACK;
  THROW '仓库中商品数量不足';
END IF;

COMMIT;


**步骤3：计算成本**
javascript
function calculateOrderTotal(items, deliveryAddress, promoCode) {
  let itemsTotal = items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0);

  let deliveryFee = calculateDeliveryFee(deliveryAddress, itemsTotal);
  let discount = applyPromoCode(promoCode, itemsTotal);

  return {
    itemsTotal,
    deliveryFee,
    discount,
    total: itemsTotal + deliveryFee - discount
  };
}


**步骤4：创建订单**
sql
INSERT INTO orders (id, user_id, status, items_total, delivery_fee,
                   discount, total, delivery_address, created_at)
VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, NOW());

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (...);


###### 4.3.6.2.5. 集成
**5.1. 微服务：**
- **InventoryService**：商品检查和预留
- **PricingService**：折扣和价格计算
- **DeliveryService**：配送成本计算
- **PaymentService**：启动支付
- **NotificationService**：用户通知

**5.2. 数据库：**
- 读取：products, stock, users, promo_codes
- 写入：orders, order_items, stock_reservations

###### 4.3.6.2.6. 异常情况
**6.1. 商品不可用（409）：**
- 商品售完 → 提供替代品
- 商品已下架 → 从购物车中移除

**6.2. 集成错误（503）：**
- InventoryService不可用 → 重试
- PaymentService错误 → 将订单保存为DRAFT

**6.3. 补偿操作：**
- 创建订单出错时取消预留
- 取消订单时退款

###### 4.3.6.2.7. 输出数据
**成功响应：**
json
{
  "orderId": "ord_123456",
  "status": "PENDING",
  "total": 2500.00,
  "paymentUrl": "https://payment.service/pay/...",
  "estimatedDelivery": "2024-01-20"
}


###### 4.3.6.2.8. 性能
**优化：**
- 缓存商品价格（TTL：1小时）
- 异步发送通知
- 分组SQL查询

---

#### 4.3.7. AI质量标准

##### 4.3.7.1. 描述完整性
- **必须：** 所有7个主要模块已填写
- **推荐：** 添加性能模块
- **详细程度：** 每个模块至少包含3个点

##### 4.3.7.2. 技术准确性
- **验证：** 覆盖所有输入参数
- **算法：** 分步描述，带有代码/SQL示例
- **集成：** 符合系统架构
- **错误：** 包括HTTP状态码和恢复策略

##### 4.3.7.3. 与架构的关联性
- **API：** 符合OpenAPI规范
- **数据库：** 使用ERD中的实体
- **服务：** 提及架构图中的组件
- **流程：** 符合序列图（sequence diagrams）

##### 4.3.7.4. 实际适用性
- **可实施性：** 算法可以在代码中实现
- **性能：** 考虑了限制和优化
- **安全性：** 描述了授权检查
- **监控：** 提到了指标和日志记录

---

#### 4.3.8. AI代理检查清单

##### 4.3.8.1. 强制性检查：
- [ ] ✅ 所有7个必填模块都存在
- [ ] ✅ 输入数据符合API规范
- [ ] ✅ 验证覆盖所有参数（结构 + 业务）
- [ ] ✅ 主要逻辑分为清晰的步骤
- [ ] ✅ 集成符合架构图
- [ ] ✅ 描述了至少5种错误类型的处理
- [ ] ✅ 输出数据包括JSON示例
- [ ] ✅ 对复杂逻辑使用了代码/SQL示例

##### 4.3.8.2. 质量检查：
- [ ] 🎯 算法逻辑顺序合理
- [ ] 🎯 验证对于问题域是现实的
- [ ] 🎯 错误包含用户可理解的消息
- [ ] 🎯 性能考虑了非功能性需求
- [ ] 🎯 安全性包括授权和审计
- [ ] 🎯 集成包括故障处理

##### 4.3.8.3. 附加检查：
- [ ] 🔍 代码示例语法正确
- [ ] 🔍 SQL查询可执行（正确的表名/字段名）
- [ ] 🔍 HTTP状态码与错误类型对应
- [ ] 🔍 时间限制是现实的
- [ ] 🔍 数据量符合系统规模

**目标：** 创建逻辑描述，无需额外澄清即可交付开发团队，并且完全可以在代码中实现。

---

#### 4.3.9. 附加建议

##### 4.3.9.1. 写作风格：
- **结构化：** 使用编号列表和副标题
- **具体性：** 避免抽象表述
- **示例：** 包含代码、SQL、JSON进行说明
- **可衡量性：** 指定具体数字和限制

##### 4.3.9.2. 技术细节：
- **数据类型：** 明确指定参数类型
- **格式：** 描述日期、数字、字符串的格式
- **限制：** 指定最小/最大值
- **性能：** 添加负载信息

##### 4.3.9.3. 与其他工件的集成：
- **用例（Use Case）：** 逻辑应覆盖所有场景
- **API：** 参数和响应应匹配
- **ERD：** 使用正确的表名和字段名
- **架构：** 提及现有组件

