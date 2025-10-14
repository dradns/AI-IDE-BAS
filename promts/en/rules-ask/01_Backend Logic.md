### 4.3. Backend Logic Description
**Instructions for describing feature operation logic (Backend Logic)**

#### 4.3.1. Content
1. [Feature Logic Description Template](#feature-logic-description-template)
2. [Quality Metrics](#quality-metrics)
3. [Validation Rules](#validation-rules)
4. [Analysis Methodology](#analysis-methodology)
5. [Logic Description Examples](#logic-description-examples)
6. [Quality Criteria](#quality-criteria)
7. [Checklist for AI Agent](#checklist-for-ai-agent)

---

#### 4.3.2. Feature Logic Description Template

##### 4.3.2.1. Mandatory Structure (8 main blocks):

| № | Block | Description | Mandatory |
|---|-------|-------------|-----------|
| 1 | **General Overview** | Feature purpose and high-level logic | ✅ Mandatory |
| 2 | **Input Data** | Parameters, their types, constraints | ✅ Mandatory |
| 3 | **Validations** | Data checks, business rules | ✅ Mandatory |
| 4 | **Main Logic** | Algorithms, processes, calculations | ✅ Mandatory |
| 5 | **Integrations** | Interaction with external systems | ✅ Mandatory |
| 6 | **Exceptional Situations** | Error handling, rollbacks | ✅ Mandatory |
| 7 | **Output Data** | Operation result, response formats | ✅ Mandatory |
| 8 | **Performance** | Optimizations, caching, limitations | 🔶 Recommended |

---

#### 4.3.3. Quality Metrics

##### 4.3.3.1. Target Indicators:
- **Structure completeness**: 7/7 mandatory blocks = 100%
- **Validation coverage**: Minimum 5 different check types
- **Algorithm detail**: Step-by-step description with conditions
- **Error coverage**: Minimum 80% of possible exceptions
- **Integration connectivity**: 100% architecture compliance

##### 4.3.3.2. Scoring System:
- **Excellent quality**: 90-100% metric compliance
- **Good quality**: 70-89% metric compliance
- **Needs improvement**: <70% metric compliance

---

#### 4.3.4. Validation Rules

##### 4.3.4.1. Automatic Checks:

###### 4.3.4.1.1. Structural Validation

✓ All 7 mandatory blocks present
✓ Each block contains minimum 3 items
✓ Validations structured by types
✓ Algorithms described step-by-step

###### 4.3.4.1.2. Logical Validation

✓ Input data corresponds to API specification
✓ Validations cover all input parameters
✓ Algorithms are logically sequential
✓ Exceptions correspond to real scenarios

###### 4.3.4.1.3. Integration Validation

✓ Integrations correspond to architectural diagram
✓ Validations coordinated with Use Case
✓ Errors correspond to HTTP statuses in API
✓ Performance considers non-functional requirements

---

#### 4.3.5. Analysis Methodology

##### 4.3.5.1. Step 1: Source Data Collection
**Analysis sources:**
- User Story and Use Case
- API specification (OpenAPI)
- Architectural diagram
- ERD diagram
- Sequence diagrams

##### 4.3.5.2. Step 2: Input Data Identification
**Analyze:**
- Request parameters from API spec
- Form fields from User Story
- Data from other services (integrations)
- Contextual information (user, session)

##### 4.3.5.3. Step 3: Validation Definition
**Validation types:**
- **Structural**: data type, format, length
- **Business validations**: domain rules
- **Security**: authorization, access rights
- **Integration**: related data checks
- **Constraints**: limits, quotas, time windows

##### 4.3.5.4. Step 4: Main Logic Description
**Structuring approaches:**
- Breakdown into logical stages
- Conditional branching (if-then-else)
- Cyclical operations
- Parallel processes
- Transactional blocks

##### 4.3.5.5. Step 5: Integration Identification
**Analyze interaction with:**
- Database (CRUD operations)
- External APIs
- Message queues
- Cache systems
- File storage

##### 4.3.5.6. Step 6: Error Handling
**Exception categories:**
- Validation errors (400)
- Authorization (401, 403)
- Not found (404)
- Conflicts (409)
- Server errors (500)
- Service unavailability (503)

#### 4.3.6. Logic Description Examples

##### 4.3.6.1. Example 1: Bank Transfer

###### 4.3.6.1.1. General Overview
**Purpose:** Processing money transfer between accounts with limit checks and history preservation.
**High-level logic:** Validation → Limit checks → Fund reservation → Transfer execution → Notifications

###### 4.3.6.1.2. Input Data
interface TransferRequest {
  fromAccountId: string;     // Sender account UUID
  toAccountId: string;       // Recipient account UUID
  amount: number;            // Amount (positive number, up to 2 decimals)
  currency: string;          // Currency code (ISO 4217, 3 characters)
  comment?: string;          // Comment (up to 200 characters)
  userId: string;            // User UUID from token
}

###### 4.3.6.1.3. Validations
**3.1. Structural Validations:**
- amount > 0 and <= 999999.99
- fromAccountId and toAccountId - valid UUIDs
- currency - exists in currency directory
- comment - doesn't contain forbidden characters (<, >, &, ")

**3.2. Business Validations:**
- User is owner of fromAccountId account
- Sender account is active (status = 'ACTIVE')
- Recipient account exists and is active
- Account currencies match transfer currency
- Sufficient funds on account (balance >= amount + fee)

**3.3. Limit Validations:**
- Daily limit not exceeded
- Monthly limit not exceeded
- Daily operations count <= maximum

###### 4.3.6.1.4. Main Logic
**Step 1: Account Information Retrieval**
SELECT id, balance, currency, status, daily_limit, monthly_limit 
FROM accounts 
WHERE id IN (fromAccountId, toAccountId)

**Step 2: Daily Limit Check**
SELECT SUM(amount) as daily_spent 
FROM transfers 
WHERE from_account_id = fromAccountId 
  AND created_at >= CURRENT_DATE

**Step 3: Fee Calculation**
function calculateFee(amount, fromAccount, toAccount) {
  if (fromAccount.bank_id === toAccount.bank_id) {
    return 0; // Internal bank transfer
  }
  return Math.min(amount * 0.015, 100); // 1.5%, maximum 100
}

**Step 4: Transaction Creation**
BEGIN TRANSACTION;

UPDATE accounts 
SET balance = balance - (amount + fee), 
    reserved = reserved + (amount + fee)
WHERE id = fromAccountId;

INSERT INTO transfers (id, from_account_id, to_account_id, amount, fee, status)
VALUES (uuid(), fromAccountId, toAccountId, amount, fee, 'PROCESSING');

COMMIT;

**Step 5: Transfer Execution**
BEGIN TRANSACTION;

UPDATE accounts 
SET reserved = reserved - (amount + fee)
WHERE id = fromAccountId;

UPDATE accounts 
SET balance = balance + amount
WHERE id = toAccountId;

UPDATE transfers 
SET status = 'COMPLETED', completed_at = NOW()
WHERE id = transferId;

COMMIT;

###### 4.3.6.1.5. Integrations
**5.1. Database:**
- Read: accounts, transfer_limits, exchange_rates
- Write: transfers, account_transactions

**5.2. External Services:**
- NotificationService: SMS/push notifications sending
- AuditService: operations logging
- FraudService: fraud checking

**5.3. Cache (Redis):**
- User limits (TTL: 24 hours)
- Currency rates (TTL: 1 hour)

###### 4.3.6.1.6. Exceptional Situations
**6.1. Validation Errors (400):**
- Incorrect amount → "Amount must be greater than 0"
- Insufficient funds → "Insufficient funds on account"
- Limit exceeded → "Daily transfer limit exceeded"

**6.2. Authorization Errors (403):**
- Not account owner → "No access to this account"
- Blocked account → "Account is blocked"

**6.3. Server Errors (500):**
- Database error → Transaction rollback + retry
- External service unavailability → Delayed processing

**6.4. Recovery Strategies:**
- Transactional rollbacks: automatic rollback on errors
- Compensating operations: reservation cancellation on error
- Retry attempts: up to 3 times with exponential delay

###### 4.3.6.1.7. Output Data
**7.1. Successful Response (201):**
{
  "transferId": "uuid",
  "status": "COMPLETED",
  "amount": 1000.00,
  "fee": 0.00,
  "fromAccount": "xxx-1234",
  "toAccount": "xxx-5678",
  "timestamp": "2024-01-15T10:30:00Z"
}

**7.2. Validation Error (400):**
{
  "error": "VALIDATION_ERROR",
  "message": "Insufficient funds on account",
  "details": {
    "field": "amount",
    "available": 500.00,
    "requested": 1000.00
  }
}

###### 4.3.6.1.8. Performance
**8.1. Optimizations:**
- Indexes on (from_account_id, created_at) for limits
- User limits caching
- Asynchronous notifications sending

**8.2. Limitations:**
- Maximum load: 1000 transfers/second
- Response time: < 2 seconds (99th percentile)
- Availability: 99.9%

---

##### 4.3.6.2. Example 2: E-commerce Order Creation

###### 4.3.6.2.1. General Overview
**Purpose:** Order creation with product reservation, cost calculation and delivery process initiation.
**High-level logic:** Cart validation → Product reservation → Cost calculation → Order creation → Payment initiation

###### 4.3.6.2.2. Input Data
interface CreateOrderRequest {
  items: OrderItem[];        // Products in order
  deliveryAddress: Address;  // Delivery address
  paymentMethod: string;     // Payment method
  promoCode?: string;        // Promo code
  userId: string;            // User ID
}

interface OrderItem {
  productId: string;    // Product UUID
  quantity: number;     // Quantity (1-100)
  variant?: string;     // Product variant (size, color)
}

###### 4.3.6.2.3. Validations
**3.1. Structural Validations:**
- items contains from 1 to 50 positions
- quantity for each product from 1 to 100
- deliveryAddress contains all required fields
- paymentMethod from allowed list

**3.2. Business Validations:**
- All products exist and available for sale
- Sufficient quantity in stock
- Products can be delivered to specified address
- Promo code is valid and applicable

**3.3. User Validations:**
- User is active and not blocked
- Delivery address belongs to user
- Payment method linked to user

###### 4.3.6.2.4. Main Logic
**Step 1: Product Availability Check**
SELECT p.id, p.name, p.price, s.quantity as stock_quantity
FROM products p
JOIN stock s ON p.id = s.product_id
WHERE p.id IN (...) AND p.status = 'ACTIVE'

**Step 2: Product Reservation**
BEGIN TRANSACTION;

UPDATE stock 
SET quantity = quantity - reserved_quantity,
    reserved = reserved + reserved_quantity
WHERE product_id = ? AND quantity >= reserved_quantity;

IF @@ROWCOUNT = 0 THEN
  ROLLBACK;
  THROW 'Insufficient product in stock';
END IF;

COMMIT;

**Step 3: Cost Calculation**
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

**Step 4: Order Creation**
INSERT INTO orders (id, user_id, status, items_total, delivery_fee, 
                   discount, total, delivery_address, created_at)
VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, NOW());

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (...);

###### 4.3.6.2.5. Integrations
**5.1. Microservices:**
- InventoryService: product check and reservation
- PricingService: discount and price calculation
- DeliveryService: delivery cost calculation
- PaymentService: payment initiation
- NotificationService: user notifications

**5.2. Database:**
- Read: products, stock, users, promo_codes
- Write: orders, order_items, stock_reservations

###### 4.3.6.2.6. Exceptional Situations
**6.1. Product Unavailability (409):**
- Product out of stock → Suggest alternatives
- Product discontinued → Remove from cart

**6.2. Integration Errors (503):**
- InventoryService unavailability → Retry
- PaymentService error → Save order as DRAFT

**6.3. Compensating Operations:**
- Reservation cancellation on order creation error
- Refund on order cancellation

###### 4.3.6.2.7. Output Data
**Successful Response:**
{
  "orderId": "ord_123456",
  "status": "PENDING",
  "total": 2500.00,
  "paymentUrl": "https://payment.service/pay/...",
  "estimatedDelivery": "2024-01-20"
}

###### 4.3.6.2.8. Performance
**Optimizations:**
- Product price caching (TTL: 1 hour)
- Asynchronous notifications sending
- SQL queries grouping

---

#### 4.3.7. Quality Criteria for AI

##### 4.3.7.1. Description Completeness
- **Mandatory**: All 7 main blocks filled
- **Recommended**: Performance block added
- **Detail**: Each block contains minimum 3 items

##### 4.3.7.2. Technical Accuracy
- **Validations**: Cover all input parameters
- **Algorithms**: Described step-by-step with code/SQL examples
- **Integrations**: Correspond to system architecture
- **Errors**: Include HTTP statuses and recovery strategies

##### 4.3.7.3. Architecture Connectivity
- **API**: Corresponds to OpenAPI specification
- **Database**: Uses entities from ERD
- **Services**: Mentions components from architectural diagram
- **Flows**: Correspond to sequence diagrams

##### 4.3.7.4. Practical Applicability
- **Implementability**: Algorithms can be implemented in code
- **Performance**: Limitations and optimizations considered
- **Security**: Authorization checks described
- **Monitoring**: Metrics and logging mentioned

---

#### 4.3.8. Checklist for AI Agent

##### 4.3.8.1. Mandatory Check:
- [ ] ✅ All 7 mandatory blocks present
- [ ] ✅ Input data corresponds to API specification
- [ ] ✅ Validations cover all parameters (structural + business)
- [ ] ✅ Main logic broken into clear steps
- [ ] ✅ Integrations correspond to architectural diagram
- [ ] ✅ Handling of minimum 5 error types described
- [ ] ✅ Output data includes JSON examples
- [ ] ✅ Code/SQL examples used for complex logic

##### 4.3.8.2. Quality Check:
- [ ] 🎯 Algorithms logically sequential
- [ ] 🎯 Validations realistic for subject area
- [ ] 🎯 Errors include clear user messages
- [ ] 🎯 Performance considers non-functional requirements
- [ ] 🎯 Security includes authorization and audit
- [ ] 🎯 Integrations include failure handling

##### 4.3.8.3. Additional Check:
- [ ] 🔍 Code examples syntactically correct
- [ ] 🔍 SQL queries executable (correct table/field names)
- [ ] 🔍 HTTP statuses correspond to error types
- [ ] 🔍 Time limitations realistic
- [ ] 🔍 Data volumes correspond to system scale

**Goal**: Create logic descriptions ready for handover to development team without additional clarifications and fully implementable in code.

---

#### 4.3.9. Additional Recommendations

##### 4.3.9.1. Writing Style:
- **Structuredness**: Use numbered lists and subheadings
- **Concreteness**: Avoid abstract formulations
- **Examples**: Include code, SQL, JSON for illustration
- **Measurability**: Specify specific numbers and limitations

##### 4.3.9.2. Technical Details:
- **Data Types**: Explicitly specify parameter types
- **Formats**: Describe date, number, string formats
- **Constraints**: Specify min/max values
- **Performance**: Add load information

##### 4.3.9.3. Integration with Other Artifacts:
- **Use Case**: Logic should cover all scenarios
- **API**: Parameters and responses should match
- **ERD**: Use correct table and field names
- **Architecture**: Mention existing components
