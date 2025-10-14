### 4.3. Descripción de Lógica de Backend
**Instrucciones para describir lógica de operación de funcionalidad (Backend Logic)**

#### 4.3.1. Contenido
1. [Plantilla de descripción de lógica de funcionalidad](#plantilla-de-descripción-de-lógica-de-funcionalidad)
2. [Métricas de Calidad](#métricas-de-calidad)
3. [Reglas de Validación](#reglas-de-validación)
4. [Metodología de Análisis](#metodología-de-análisis)
5. [Ejemplos de Descripción de Lógica](#ejemplos-de-descripción-de-lógica)
6. [Criterios de Calidad](#criterios-de-calidad)
7. [Lista de Verificación para Agente de IA](#lista-de-verificación-para-agente-de-ia)

---

#### 4.3.2. Plantilla de Descripción de Lógica de Funcionalidad

##### 4.3.2.1. Estructura Obligatoria (8 bloques principales):

| № | Bloque | Descripción | Obligatoriedad |
|---|--------|-------------|----------------|
| 1 | **Descripción General** | Propósito de la funcionalidad y lógica de alto nivel | ✅ Obligatorio |
| 2 | **Datos de Entrada** | Parámetros, sus tipos, restricciones | ✅ Obligatorio |
| 3 | **Validaciones** | Verificaciones de datos, reglas de negocio | ✅ Obligatorio |
| 4 | **Lógica Principal** | Algoritmos, procesos, cálculos | ✅ Obligatorio |
| 5 | **Integraciones** | Interacción con sistemas externos | ✅ Obligatorio |
| 6 | **Situaciones Excepcionales** | Manejo de errores, reversiones | ✅ Obligatorio |
| 7 | **Datos de Salida** | Resultado de operación, formatos de respuesta | ✅ Obligatorio |
| 8 | **Rendimiento** | Optimizaciones, caché, limitaciones | 🔶 Recomendado |

---

#### 4.3.3. Métricas de Calidad

##### 4.3.3.1. Indicadores Objetivo:
- **Completitud de estructura**: 7/7 bloques obligatorios = 100%
- **Cobertura de validaciones**: Mínimo 5 tipos diferentes de verificaciones
- **Detalle de algoritmos**: Descripción paso a paso con condiciones
- **Cobertura de errores**: Mínimo 80% de excepciones posibles
- **Conectividad de integración**: 100% cumplimiento de arquitectura

##### 4.3.3.2. Sistema de Puntuación:
- **Calidad excelente**: 90-100% cumplimiento de métricas
- **Buena calidad**: 70-89% cumplimiento de métricas
- **Requiere mejora**: <70% cumplimiento de métricas

---

#### 4.3.4. Reglas de Validación

##### 4.3.4.1. Verificaciones Automáticas:

###### 4.3.4.1.1. Validación Estructural

✓ Todos los 7 bloques obligatorios presentes
✓ Cada bloque contiene mínimo 3 puntos
✓ Validaciones estructuradas por tipos
✓ Algoritmos descritos paso a paso

###### 4.3.4.1.2. Validación Lógica

✓ Datos de entrada corresponden a especificación API
✓ Validaciones cubren todos los parámetros de entrada
✓ Algoritmos son lógicamente secuenciales
✓ Excepciones corresponden a escenarios reales

###### 4.3.4.1.3. Validación de Integración

✓ Integraciones corresponden al diagrama arquitectónico
✓ Validaciones coordinadas con Use Case
✓ Errores corresponden a estados HTTP en API
✓ Rendimiento considera requisitos no funcionales

---

#### 4.3.5. Metodología de Análisis

##### 4.3.5.1. Paso 1: Recopilación de Datos Fuente
**Fuentes de análisis:**
- User Story y Use Case
- Especificación API (OpenAPI)
- Diagrama arquitectónico
- Diagrama ERD
- Diagramas de secuencia

##### 4.3.5.2. Paso 2: Identificación de Datos de Entrada
**Analizar:**
- Parámetros de solicitud de API spec
- Campos de formulario de User Story
- Datos de otros servicios (integraciones)
- Información contextual (usuario, sesión)

##### 4.3.5.3. Paso 3: Definición de Validaciones
**Tipos de validaciones:**
- **Estructurales**: tipo de datos, formato, longitud
- **Validaciones de negocio**: reglas del dominio
- **Seguridad**: autorización, derechos de acceso
- **Integración**: verificaciones de datos relacionados
- **Restricciones**: límites, cuotas, ventanas temporales

##### 4.3.5.4. Paso 4: Descripción de Lógica Principal
**Enfoques de estructuración:**
- División en etapas lógicas
- Ramificación condicional (if-then-else)
- Operaciones cíclicas
- Procesos paralelos
- Bloques transaccionales

##### 4.3.5.5. Paso 5: Identificación de Integraciones
**Analizar interacción con:**
- Base de datos (operaciones CRUD)
- APIs externas
- Colas de mensajes
- Sistemas de caché
- Almacenamiento de archivos

##### 4.3.5.6. Paso 6: Manejo de Errores
**Categorías de excepciones:**
- Errores de validación (400)
- Autorización (401, 403)
- No encontrado (404)
- Conflictos (409)
- Errores de servidor (500)
- Indisponibilidad de servicios (503)

#### 4.3.6. Ejemplos de descripción de lógica

##### 4.3.6.1. Ejemplo 1: Transferencia bancaria

###### 4.3.6.1.1. Descripción general
**Propósito:** Procesar transferencias de dinero entre cuentas con verificación de límites y guardado del historial.
**Lógica de alto nivel:** Validación → Verificación de límites → Reserva de fondos → Ejecución de transferencia → Notificaciones

###### 4.3.6.1.2. Datos de entrada
typescript
interface TransferRequest {
  fromAccountId: string;     // UUID de la cuenta del remitente
  toAccountId: string;       // UUID de la cuenta del destinatario
  amount: number;            // Monto (número positivo, hasta 2 decimales)
  currency: string;          // Código de moneda (ISO 4217, 3 caracteres)
  comment?: string;          // Comentario (hasta 200 caracteres)
  userId: string;            // UUID del usuario desde el token
}


###### 4.3.6.1.3. Validaciones
**3.1. Validaciones estructurales:**
- `amount` > 0 y <= 999999.99
- `fromAccountId` y `toAccountId` - UUID válidos
- `currency` - existe en el directorio de monedas
- `comment` - no contiene caracteres prohibidos (<, >, &, ")

**3.2. Validaciones de negocio:**
- El usuario es propietario de la cuenta `fromAccountId`
- La cuenta del remitente está activa (status = 'ACTIVE')
- La cuenta del destinatario existe y está activa
- La moneda de las cuentas coincide con la moneda de la transferencia
- Hay fondos suficientes en la cuenta (saldo >= amount + comisión)

**3.3. Validaciones de límites:**
- No se excedió el límite diario
- No se excedió el límite mensual
- Cantidad de operaciones por día <= máximo permitido

###### 4.3.6.1.4. Lógica principal
**Paso 1: Obtención de información de cuentas**
sql
SELECT id, balance, currency, status, daily_limit, monthly_limit
FROM accounts
WHERE id IN (fromAccountId, toAccountId)


**Paso 2: Verificación de límites diarios**
sql
SELECT SUM(amount) as daily_spent
FROM transfers
WHERE from_account_id = fromAccountId
  AND created_at >= CURRENT_DATE


**Paso 3: Cálculo de comisión**
javascript
function calculateFee(amount, fromAccount, toAccount) {
  if (fromAccount.bank_id === toAccount.bank_id) {
    return 0; // Transferencia dentro del mismo banco
  }
  return Math.min(amount * 0.015, 100); // 1.5%, máximo 100
}


**Paso 4: Creación de transacción**
sql
BEGIN TRANSACTION;

-- Reserva de fondos
UPDATE accounts
SET balance = balance - (amount + fee),
    reserved = reserved + (amount + fee)
WHERE id = fromAccountId;

-- Creación de registro de transferencia
INSERT INTO transfers (id, from_account_id, to_account_id, amount, fee, status)
VALUES (uuid(), fromAccountId, toAccountId, amount, fee, 'PROCESSING');

COMMIT;


**Paso 5: Ejecución de transferencia**
sql
BEGIN TRANSACTION;

-- Débito del remitente
UPDATE accounts
SET reserved = reserved - (amount + fee)
WHERE id = fromAccountId;

-- Crédito al destinatario
UPDATE accounts
SET balance = balance + amount
WHERE id = toAccountId;

-- Actualización de estado
UPDATE transfers
SET status = 'COMPLETED', completed_at = NOW()
WHERE id = transferId;

COMMIT;


###### 4.3.6.1.5. Integraciones
**5.1. Base de datos:**
- Lectura: accounts, transfer_limits, exchange_rates
- Escritura: transfers, account_transactions

**5.2. Servicios externos:**
- **NotificationService**: envío de notificaciones SMS/push
- **AuditService**: registro de operaciones
- **FraudService**: verificación de fraude

**5.3. Caché (Redis):**
- Límites de usuario (TTL: 24 horas)
- Tipos de cambio (TTL: 1 hora)

###### 4.3.6.1.6. Situaciones excepcionales
**6.1. Errores de validación (400):**
- Monto incorrecto → "El monto debe ser mayor a 0"
- Fondos insuficientes → "Fondos insuficientes en la cuenta"
- Límite excedido → "Límite diario de transferencias excedido"

**6.2. Errores de autorización (403):**
- No es propietario de la cuenta → "Sin acceso a esta cuenta"
- Cuenta bloqueada → "Cuenta bloqueada"

**6.3. Errores de servidor (500):**
- Error de base de datos → Reversión de transacción + reintento
- Indisponibilidad de servicio externo → Procesamiento diferido

**6.4. Estrategias de recuperación:**
- **Reversiones transaccionales**: rollback automático en errores
- **Operaciones compensatorias**: cancelación de reserva en error
- **Reintentos**: hasta 3 veces con retraso exponencial (exponential backoff)

###### 4.3.6.1.7. Datos de salida
**7.1. Respuesta exitosa (201):**
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


**7.2. Error de validación (400):**
json
{
  "error": "VALIDATION_ERROR",
  "message": "Fondos insuficientes en la cuenta",
  "details": {
    "field": "amount",
    "available": 500.00,
    "requested": 1000.00
  }
}


###### 4.3.6.1.8. Rendimiento
**8.1. Optimizaciones:**
- Índices en (from_account_id, created_at) para límites
- Caché de límites de usuario
- Envío asíncrono de notificaciones

**8.2. Limitaciones:**
- Carga máxima: 1000 transferencias/segundo
- Tiempo de respuesta: < 2 segundos (percentil 99)
- Disponibilidad: 99.9%

---

##### 4.3.6.2. Ejemplo 2: Creación de pedido en e-commerce

###### 4.3.6.2.1. Descripción general
**Propósito:** Crear pedido con reserva de productos, cálculo de costos e inicio del proceso de entrega.
**Lógica de alto nivel:** Validación de carrito → Reserva de productos → Cálculo de costos → Creación de pedido → Inicio de pago

###### 4.3.6.2.2. Datos de entrada
typescript
interface CreateOrderRequest {
  items: OrderItem[];        // Productos en el pedido
  deliveryAddress: Address;  // Dirección de entrega
  paymentMethod: string;     // Método de pago
  promoCode?: string;        // Código promocional
  userId: string;            // ID de usuario
}

interface OrderItem {
  productId: string;    // UUID del producto
  quantity: number;     // Cantidad (1-100)
  variant?: string;     // Variante del producto (talla, color)
}


###### 4.3.6.2.3. Validaciones
**3.1. Validaciones estructurales:**
- `items` contiene de 1 a 50 ítems
- `quantity` para cada producto de 1 a 100
- `deliveryAddress` contiene todos los campos obligatorios
- `paymentMethod` de la lista permitida

**3.2. Validaciones de negocio:**
- Todos los productos existen y están disponibles para venta
- Cantidad suficiente en almacén
- Los productos se pueden entregar a la dirección indicada
- El código promocional es válido y aplicable

**3.3. Validaciones de usuario:**
- El usuario está activo y no bloqueado
- La dirección de entrega pertenece al usuario
- El método de pago está vinculado al usuario

###### 4.3.6.2.4. Lógica principal
**Paso 1: Verificación de disponibilidad de productos**
sql
SELECT p.id, p.name, p.price, s.quantity as stock_quantity
FROM products p
JOIN stock s ON p.id = s.product_id
WHERE p.id IN (...) AND p.status = 'ACTIVE'


**Paso 2: Reserva de productos**
sql
BEGIN TRANSACTION;

UPDATE stock
SET quantity = quantity - reserved_quantity,
    reserved = reserved + reserved_quantity
WHERE product_id = ? AND quantity >= reserved_quantity;

-- Verificación de éxito de reserva
IF @@ROWCOUNT = 0 THEN
  ROLLBACK;
  THROW 'Cantidad insuficiente de producto en almacén';
END IF;

COMMIT;


**Paso 3: Cálculo de costos**
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


**Paso 4: Creación de pedido**
sql
INSERT INTO orders (id, user_id, status, items_total, delivery_fee,
                   discount, total, delivery_address, created_at)
VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, NOW());

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (...);


###### 4.3.6.2.5. Integraciones
**5.1. Microservicios:**
- **InventoryService**: verificación y reserva de productos
- **PricingService**: cálculo de descuentos y precios
- **DeliveryService**: cálculo de costo de entrega
- **PaymentService**: inicio de pago
- **NotificationService**: notificaciones de usuario

**5.2. Base de datos:**
- Lectura: products, stock, users, promo_codes
- Escritura: orders, order_items, stock_reservations

###### 4.3.6.2.6. Situaciones excepcionales
**6.1. Producto no disponible (409):**
- Producto agotado → Ofrecer alternativas
- Producto descontinuado → Eliminar del carrito

**6.2. Errores de integración (503):**
- Indisponibilidad de InventoryService → Reintento
- Error de PaymentService → Guardar pedido como DRAFT

**6.3. Operaciones compensatorias:**
- Cancelación de reserva en error de creación de pedido
- Reembolso en cancelación de pedido

###### 4.3.6.2.7. Datos de salida
**Respuesta exitosa:**
json
{
  "orderId": "ord_123456",
  "status": "PENDING",
  "total": 2500.00,
  "paymentUrl": "https://payment.service/pay/...",
  "estimatedDelivery": "2024-01-20"
}


###### 4.3.6.2.8. Rendimiento
**Optimizaciones:**
- Caché de precios de productos (TTL: 1 hora)
- Envío asíncrono de notificaciones
- Agrupación de consultas SQL

---

#### 4.3.7. Criterios de calidad para IA

##### 4.3.7.1. Integridad de la descripción
- **Obligatorio**: Todos los 7 bloques principales están completos
- **Recomendado**: Se agregó el bloque de rendimiento
- **Detalle**: Cada bloque contiene mínimo 3 puntos

##### 4.3.7.2. Precisión técnica
- **Validaciones**: Cubren todos los parámetros de entrada
- **Algoritmos**: Descritos paso a paso con ejemplos de código/SQL
- **Integraciones**: Corresponden a la arquitectura del sistema
- **Errores**: Incluyen estados HTTP y estrategias de recuperación

##### 4.3.7.3. Coherencia con arquitectura
- **API**: Corresponde a especificación OpenAPI
- **Base de datos**: Utiliza entidades del ERD
- **Servicios**: Menciona componentes del diagrama arquitectónico
- **Flujos**: Corresponden a diagramas de secuencia

##### 4.3.7.4. Aplicabilidad práctica
- **Implementabilidad**: Los algoritmos se pueden implementar en código
- **Rendimiento**: Se consideran limitaciones y optimizaciones
- **Seguridad**: Se describen verificaciones de autorización
- **Monitoreo**: Se mencionan métricas y registro

---

#### 4.3.8. Lista de verificación para agente de IA

##### 4.3.8.1. Verificación obligatoria:
- [ ] ✅ Todos los 7 bloques obligatorios están presentes
- [ ] ✅ Los datos de entrada corresponden a la especificación API
- [ ] ✅ Las validaciones cubren todos los parámetros (estructurales + negocio)
- [ ] ✅ La lógica principal está dividida en pasos claros
- [ ] ✅ Las integraciones corresponden al diagrama arquitectónico
- [ ] ✅ Se describe el manejo de mínimo 5 tipos de errores
- [ ] ✅ Los datos de salida incluyen ejemplos JSON
- [ ] ✅ Se utilizaron ejemplos de código/SQL para lógica compleja

##### 4.3.8.2. Verificación cualitativa:
- [ ] 🎯 Los algoritmos son lógicamente secuenciales
- [ ] 🎯 Las validaciones son realistas para el dominio
- [ ] 🎯 Los errores incluyen mensajes comprensibles para el usuario
- [ ] 🎯 El rendimiento considera requisitos no funcionales
- [ ] 🎯 La seguridad incluye autorización y auditoría
- [ ] 🎯 Las integraciones incluyen manejo de fallas

##### 4.3.8.3. Verificación adicional:
- [ ] 🔍 Los ejemplos de código son sintácticamente correctos
- [ ] 🔍 Las consultas SQL son ejecutables (nombres correctos de tablas/campos)
- [ ] 🔍 Los estados HTTP corresponden a los tipos de error
- [ ] 🔍 Las limitaciones de tiempo son realistas
- [ ] 🔍 Los volúmenes de datos corresponden a la escala del sistema

**Objetivo**: Crear descripciones de lógica listas para entregar al equipo de desarrollo sin aclaraciones adicionales y completamente implementables en código.

---

#### 4.3.9. Recomendaciones adicionales

##### 4.3.9.1. Estilo de escritura:
- **Estructura**: Usar listas numeradas y subtítulos
- **Concreción**: Evitar formulaciones abstractas
- **Ejemplos**: Incluir código, SQL, JSON para ilustración
- **Medibilidad**: Indicar números y limitaciones específicas

##### 4.3.9.2. Detalles técnicos:
- **Tipos de datos**: Indicar explícitamente los tipos de parámetros
- **Formatos**: Describir formatos de fechas, números, cadenas
- **Limitaciones**: Especificar valores mín/máx
- **Rendimiento**: Agregar información sobre carga

##### 4.3.9.3. Integración con otros artefactos:
- **Caso de uso (Use Case)**: La lógica debe cubrir todos los escenarios
- **API**: Los parámetros y respuestas deben coincidir
- **ERD**: Usar nombres correctos de tablas y campos
- **Arquitectura**: Mencionar componentes existentes

