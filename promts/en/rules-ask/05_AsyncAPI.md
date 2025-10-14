### 4.7. Specification for Kafka Message Broker in AsyncAPI Format

**Instructions for describing Kafka message broker**

**Execution language:** English
**Result format:** AsyncAPI specification in YAML format
**Save location:** Project folder with name `{feature-name}_asyncapi.yaml`
**Standard:** AsyncAPI 2.6.0 or higher

#### 4.7.1. Content
1. [Output file format](#output-file-format)
2. [Kafka architecture description template](#kafka-architecture-description-template)
3. [Quality metrics](#quality-metrics)
4. [Validation rules](#validation-rules)
5. [Design methodology](#design-methodology)
6. [Kafka description examples](#kafka-description-examples)
7. [Quality criteria](#quality-criteria)
8. [Checklist for AI agent](#checklist-for-ai-agent)

---

#### 4.7.2. Output file format

##### 4.7.2.1. Mandatory AsyncAPI YAML file structure:

yaml
{feature-name}_asyncapi.yaml
asyncapi: '2.6.0'
info:
  title: '{Feature Name} Kafka Events API'
  version: '1.0.0'
  description: |
    Description of asynchronous events for {feature-name} via Apache Kafka
    
    ## Purpose
    {Description of event system purpose}
    
    ## Architectural role
    {Role in overall system architecture}
    
  contact:
    name: 'Development Team'
    email: 'dev-team@company.com'
  license:
    name: 'MIT'

servers:
  kafka-cluster:
    url: '{kafka-broker-urls}'
    protocol: kafka
    description: 'Production Kafka cluster'
    bindings:
      kafka:
        schemaRegistryUrl: 'http://schema-registry:8081'
        schemaRegistryVendor: 'confluent'
    security:
      - saslScram: []

defaultContentType: application/json

channels:
  'domain.entity.events':
    description: 'Lifecycle events of {entity}'
    bindings:
      kafka:
        topic: 'domain.entity.events'
        partitions: 12
        replicas: 3
        configs:
          retention.ms: 2592000000  # 30 days
          cleanup.policy: 'delete'
          compression.type: 'snappy'
    publish:
      summary: 'Publishing {entity} events'
      operationId: 'publishEntityEvent'
      bindings:
        kafka:
          groupId: 'entity-producers'
          clientId: 'entity-service'
          acks: 'all'
          key:
            type: string
            description: 'Entity ID for partitioning'
      message:
        $ref: '#/components/messages/EntityEvent'
    subscribe:
      summary: 'Subscribing to {entity} events'
      operationId: 'subscribeEntityEvent'
      bindings:
        kafka:
          groupId: 'entity-consumers'
          clientId: 'consumer-service'
      message:
        $ref: '#/components/messages/EntityEvent'

components:
  messages:
    EntityEvent:
      name: 'EntityEvent'
      title: 'Entity Event'
      summary: 'Entity state change event'
      contentType: application/json
      headers:
        type: object
        properties:
          eventType:
            type: string
            enum: ['CREATED', 'UPDATED', 'DELETED']
          source:
            type: string
            description: 'Event source'
          timestamp:
            type: string
            format: date-time
      payload:
        $ref: '#/components/schemas/EntityEventPayload'
      examples:
        - name: 'entityCreated'
          summary: 'Entity creation'
          headers:
            eventType: 'CREATED'
            source: 'entity-service'
            timestamp: '2024-01-15T10:30:00Z'
          payload:
            entityId: 'uuid-here'
            status: 'ACTIVE'
            createdAt: '2024-01-15T10:30:00Z'

  schemas:
    EntityEventPayload:
      type: object
      required:
        - entityId
        - status
        - createdAt
      properties:
        entityId:
          type: string
          format: uuid
          description: 'Unique entity identifier'
        status:
          type: string
          enum: ['ACTIVE', 'INACTIVE', 'PENDING']
          description: 'Entity status'
        createdAt:
          type: string
          format: date-time
          description: 'Event creation time'
        metadata:
          type: object
          description: 'Additional data'
          additionalProperties: true
      example:
        entityId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        status: 'ACTIVE'
        createdAt: '2024-01-15T10:30:00Z'
        metadata:
          source: 'web-app'
          userId: 'user-123'

  securitySchemes:
    saslScram:
      type: scramSha512
      description: 'SASL/SCRAM authentication'

  parameters:
    EntityId:
      description: 'Entity identifier'
      schema:
        type: string
        format: uuid

Additional Kafka configuration (in x-kafka-config section)
x-kafka-config:
  cluster:
    brokers: 3
    replication:
      default: 2
      critical_topics: 3
    resources:
      broker_memory: '4Gi'
      broker_cpu: '2'
      broker_storage: '100Gi'
  
  producers:
    default_config:
      acks: 'all'
      retries: 10
      batch.size: 100000
      linger.ms: 5
      enable.idempotence: true
      compression.type: 'snappy'
    
  consumers:
    default_config:
      auto.commit.enable: false
      max.poll.records: 500
      session.timeout.ms: 30000
      fetch.min.bytes: 1
      
  monitoring:
    metrics:
      - 'kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec'
      - 'kafka.consumer:type=consumer-fetch-manager-metrics'
      - 'kafka.producer:type=producer-metrics'
    alerts:
      - name: 'high_consumer_lag'
        condition: 'consumer_lag > 10000'
        severity: 'critical'
      - name: 'broker_down'
        condition: 'broker_availability < 100%'
        severity: 'critical'
        
  security:
    authentication:
      protocol: 'SASL_SSL'
      mechanism: 'SCRAM-SHA-512'
    acls:
      - principal: 'User:entity-service'
        operations: ['Write', 'Describe']
        resources: ['Topic:domain.entity.events']
      - principal: 'User:consumer-service'
        operations: ['Read', 'Describe']
        resources: ['Topic:domain.entity.events', 'Group:entity-consumers']


##### 4.7.2.2. File naming rules:
- `{feature-name}_asyncapi.yaml` - for main features
- `{domain}_events_asyncapi.yaml` - for domain solutions
- `{system-name}_kafka_asyncapi.yaml` - for system integrations

**Examples:**
- `banking_transfer_asyncapi.yaml`
- `ecommerce_orders_asyncapi.yaml`
- `notification_events_asyncapi.yaml`

##### 4.7.2.3. Mandatory AsyncAPI sections:
1. **asyncapi**: specification version (2.6.0+)
2. **info**: API metadata
3. **servers**: Kafka cluster configuration
4. **channels**: topics and their configuration
5. **components**: message schemas, security schemes
6. **x-kafka-config**: extended Kafka configuration (optional)

---

#### 4.7.3. Kafka architecture description template

##### 4.7.3.1. Mandatory structure (9 main blocks):

| № | Block | Description | Mandatory |
|---|------|----------|----------------|
| 1 | **General overview** | Kafka purpose in system, role in architecture | ✅ Mandatory |
| 2 | **Topics and schemas** | Topic structure, message schemas, partitioning | ✅ Mandatory |
| 3 | **Producers** | Sender services, sending strategies | ✅ Mandatory |
| 4 | **Consumers** | Receiver services, consumer groups | ✅ Mandatory |
| 5 | **Cluster configuration** | Broker settings, replication, fault tolerance | ✅ Mandatory |
| 6 | **Data schemas** | Avro/JSON schemas, Schema Registry, versioning | ✅ Mandatory |
| 7 | **Security** | Authentication, authorization, encryption | 🔶 Recommended |
| 8 | **Monitoring and alerts** | Metrics, logging, SLA | 🔶 Recommended |
| 9 | **Performance** | Throughput, latency, optimizations | 🔶 Recommended |

---

#### 4.7.4. Quality metrics

##### 4.7.4.1. Target indicators:
- **Structure completeness**: 6/6 mandatory blocks = 100%
- **Topic coverage**: Description of all main system topics
- **Data schemas**: 100% topics have schema description
- **Consumer groups**: Clear responsibility separation
- **Fault tolerance**: Minimum 2x replication for critical topics

##### 4.7.4.2. Scoring system:
- **Production-ready**: 95-100% compliance + security + monitoring
- **Excellent quality**: 85-94% metric compliance
- **Good quality**: 70-84% metric compliance  
- **Needs improvement**: <70% metric compliance

---

#### 4.7.5. Validation rules

##### 4.7.5.1. Automatic checks:

###### 4.7.5.1.1. Structural validation

✓ All 6 mandatory blocks present
✓ Each topic has schema description
✓ Producers and consumers clearly identified
✓ Partitioning strategy specified


###### 4.7.5.1.2. Architectural validation

✓ Topics logically connected to system domains
✓ Data schemas correspond to API specifications
✓ Consumer groups don't overlap in responsibility
✓ Replication configured for critical topics


###### 4.7.5.1.3. Production validation

✓ Retention policies specified for all topics
✓ Error handling strategy described
✓ Monitoring and alerting configured
✓ Disaster recovery procedures documented


---

#### 4.7.6. Design methodology

##### 4.7.6.1. Step 1: Domain events analysis
**Sources for analysis:**
- User Stories and Use Cases
- Sequence diagrams
- System architecture diagram
- API specifications (for synchronous operations)

##### 4.7.6.2. Step 2: Events identification
**Event types:**
- **Domain Events**: business entity state changes
- **Integration Events**: inter-service communication
- **System Events**: technical events (logs, metrics)
- **Command Events**: asynchronous commands

##### 4.7.6.3. Step 3: Topics design
**Naming principles:**

{domain}.{entity}.{event-type}
Examples:
- banking.transfer.created
- banking.transfer.completed
- ecommerce.order.placed
- notification.email.sent


##### 4.7.6.4. Step 4: Schema definition
**Schema formats:**
- **Avro**: strict typing, schema evolution
- **JSON Schema**: flexibility, simplicity
- **Protobuf**: performance, compatibility

##### 4.7.6.5. Step 5: Partitions planning
**Partitioning strategies:**
- By user ID (user-based)
- By entity ID (entity-based)
- By timestamps (time-based)
- Round-robin (even distribution)

##### 4.7.6.6. Step 6: Consumers configuration
**Consumption patterns:**
- **Single Consumer**: in-order processing
- **Consumer Group**: parallel processing
- **Multiple Groups**: different business logic

---

#### 4.7.7. Kafka description examples

##### 4.7.7.1. Example 1: Banking transfer system

###### 4.7.7.1.1. General overview
**Purpose:** Asynchronous processing of banking transfers with delivery guarantees and operation auditing.
**Role in architecture:** Central event bus between Banking, Notification, Audit, Fraud Detection microservices.

###### 4.7.7.1.2. Topics and schemas

**2.1. Topic: `banking.transfer.events`**
yaml
Purpose: Transfer lifecycle events
Partitions: 12 (by account_id % 12)
Replication Factor: 3
Retention: 30 days
Cleanup Policy: delete


**Message schema (Avro):**
json
{
  "type": "record",
  "name": "TransferEvent",
  "namespace": "com.bank.events",
  "fields": [
    {"name": "transferId", "type": "string"},
    {"name": "fromAccountId", "type": "string"},
    {"name": "toAccountId", "type": "string"},
    {"name": "amount", "type": {"type": "fixed", "name": "Decimal", "size": 16}},
    {"name": "currency", "type": "string"},
    {"name": "status", "type": {"type": "enum", "symbols": ["PENDING", "PROCESSING", "COMPLETED", "FAILED"]}},
    {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "userId", "type": "string"},
    {"name": "comment", "type": ["null", "string"], "default": null}
  ]
}


**2.2. Topic: `banking.notifications.requests`**
yaml
Purpose: Notification sending requests
Partitions: 6 (by user_id % 6)
Replication Factor: 2
Retention: 7 days


**2.3. Topic: `banking.audit.log`**
yaml
Purpose: Audit of all operations for compliance
Partitions: 1 (strict order)
Replication Factor: 3
Retention: 7 years (compliance requirements)
Cleanup Policy: compact


###### 4.7.7.1.3. Producers

**3.1. Transfer Service (Main producer)**
yaml
Service: transfer-service
Topics: banking.transfer.events
Strategy: 
  - Idempotence: enabled
  - Acks: all (guarantee of writing to all replicas)
  - Retries: 10
  - Batch Size: 100KB
  - Linger: 5ms
Error handling:
  - Retry with exponential backoff
  - Dead Letter Queue: banking.transfer.dlq


**Code example:**
java
@Service
public class TransferEventProducer {
    
    @Value("${kafka.topic.transfer-events}")
    private String transferEventsTopic;
    
    public void publishTransferEvent(TransferEvent event) {
        kafkaTemplate.send(transferEventsTopic, event.getFromAccountId(), event)
            .addCallback(
                result -> log.info("Event sent: {}", event.getTransferId()),
                failure -> log.error("Failed to send event", failure)
            );
    }
}


**3.2. Notification Service**
yaml
Service: notification-service  
Topics: banking.notifications.requests
Strategy: Fire-and-forget (acks=1)


###### 4.7.7.1.4. Consumers

**4.1. Fraud Detection Service**
yaml
Group: fraud-detection-group
Topics: banking.transfer.events
Strategy:
  - Auto Commit: false (manual acknowledgment)
  - Max Poll Records: 50
  - Session Timeout: 30s
  - Partition Assignment: cooperative-sticky
Logic:
  - Fraud analysis
  - Result publication in fraud.detection.results


**4.2. Audit Service**
yaml
Group: audit-group
Topics: 
  - banking.transfer.events
  - banking.notifications.requests
Strategy:
  - Earliest offset (processing all events)
  - Batch processing (100 records at a time)
  - Idempotent processing


**4.3. Notification Consumer**
yaml
Group: notification-consumers
Topics: banking.notifications.requests
Parallelism: 3 instances
Retry Policy:
  - Max retries: 5
  - Backoff: exponential (1s, 2s, 4s, 8s, 16s)
  - DLQ: banking.notifications.dlq


###### 4.7.7.1.5. Cluster configuration

**5.1. Brokers**
yaml
Number of brokers: 3
Placement: 3 different AZs
Configuration:
  - log.retention.hours: 168 (7 days by default)
  - log.segment.bytes: 1GB
  - num.network.threads: 8
  - num.io.threads: 8
  - socket.send.buffer.bytes: 102400
  - socket.receive.buffer.bytes: 102400


**5.2. Zookeeper**
yaml
Nodes: 3 (quorum)
Configuration:
  - tickTime: 2000
  - initLimit: 10  
  - syncLimit: 5
  - maxClientCnxns: 60


**5.3. Replication**
yaml
Critical topics (transfers, audit): RF=3, min.insync.replicas=2
Regular topics (notifications): RF=2, min.insync.replicas=1
Test topics: RF=1


###### 4.7.7.1.6. Data schemas

**6.1. Schema Registry**
yaml
URL: http://schema-registry:8081
Compatibility: BACKWARD
Versioning: automatic
Subjects:
  - banking.transfer.events-value (v1, v2)
  - banking.notifications.requests-value (v1)
  - banking.audit.log-value (v1)


**6.2. Schema evolution**
json
// v1 -> v2: adding metadata field
{
  "type": "record",
  "name": "TransferEvent",
  "fields": [
    // ... existing fields ...
    {"name": "metadata", "type": ["null", "string"], "default": null}
  ]
}


###### 4.7.7.1.7. Security

**7.1. Authentication**
yaml
Protocol: SASL_SSL
Mechanism: SCRAM-SHA-512
Users:
  - transfer-service: RW access to banking.transfer.*
  - notification-service: RW access to banking.notifications.*
  - audit-service: R access to all topics
  - fraud-detection: R access to banking.transfer.events


**7.2. Authorization (ACL)**
bash
 Transfer Service
kafka-acls --add --allow-principal User:transfer-service \
  --operation Write --topic banking.transfer.events

 Fraud Detection
kafka-acls --add --allow-principal User:fraud-detection \
  --operation Read --topic banking.transfer.events \
  --group fraud-detection-group


**7.3. Encryption**
yaml
In-transit: TLS 1.3
At-rest: LUKS disk encryption
Schema Registry: mTLS + basic auth


###### 4.7.7.1.8. Monitoring and alerts

**8.1. Key metrics**
yaml
Broker metrics:
  - kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec
  - kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec
  - kafka.server:type=ReplicaManager,name=LeaderCount

Consumer Lag:
  - kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*

Producer metrics:
  - kafka.producer:type=producer-metrics,client-id=*


**8.2. Alerts**
yaml
Critical:
  - Consumer Lag > 10000 messages
  - Broker unavailable > 1 minute
  - Disk usage > 85%

Warnings:
  - Producer errors > 1%
  - Replication lag > 5 seconds
  - Consumer group rebalance


**8.3. Dashboards**
yaml
Grafana panels:
  - Kafka Cluster Overview
  - Topic Performance
  - Consumer Groups Status
  - Producer Performance
  - Error Rates


###### 4.7.7.1.9. Performance

**9.1. Throughput characteristics**
yaml
Target indicators:
  - Transfers: 10,000 msg/sec
  - Notifications: 5,000 msg/sec
  - Audit: 15,000 msg/sec

Latency (p99):
  - Producer: < 50ms
  - Consumer: < 100ms
  - End-to-end: < 200ms


**9.2. Optimizations**
yaml
Producer:
  - Batch size: 100KB
  - Linger: 5ms
  - Compression: snappy

Consumer:
  - Fetch size: 1MB
  - Max poll records: 500
  - Parallel processing

Broker:
  - Log segment: 1GB
  - Log flush: async
  - Page cache: 70% RAM


---

##### 4.7.7.2. Example 2: E-commerce platform

###### 4.7.7.2.1. General overview
**Purpose:** Event-driven architecture for e-commerce with order processing, inventory, and notifications.
**Role in architecture:** Main event bus between Order Service, Inventory Service, Payment Service, Notification Service.

###### 4.7.7.2.2. Topics and schemas

**2.1. Topic: `ecommerce.orders.events`**
yaml
Purpose: Order lifecycle events
Partitions: 8 (by order_id hash)
Replication Factor: 2
Retention: 14 days


**Schema (JSON Schema):**
json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "orderId": {"type": "string", "format": "uuid"},
    "customerId": {"type": "string", "format": "uuid"},
    "status": {"enum": ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]},
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "productId": {"type": "string"},
          "quantity": {"type": "integer", "minimum": 1},
          "price": {"type": "number", "minimum": 0}
        }
      }
    },
    "totalAmount": {"type": "number", "minimum": 0},
    "timestamp": {"type": "string", "format": "date-time"}
  },
  "required": ["orderId", "customerId", "status", "items", "totalAmount", "timestamp"]
}


**2.2. Topic: `ecommerce.inventory.updates`**
yaml
Purpose: Product stock updates
Partitions: 4 (by product_id hash)
Replication Factor: 2
Retention: 7 days
Cleanup Policy: compact (latest state)


**2.3. Topic: `ecommerce.payments.events`**
yaml
Purpose: Payment events
Partitions: 6
Replication Factor: 3 (critical data)
Retention: 365 days (compliance)


###### 4.7.7.2.3. Producers

**3.1. Order Service**
yaml
Topics: ecommerce.orders.events
Configuration:
  - acks: all
  - enable.idempotence: true
  - retries: Integer.MAX_VALUE
  - max.in.flight.requests.per.connection: 5

Outbox Pattern:
  - Transactional writing to DB + Kafka
  - Eventual consistency guarantees


**3.2. Inventory Service**
yaml
Topics: ecommerce.inventory.updates
Strategy: Compacted topic for current state


###### 4.7.7.2.4. Consumers

**4.1. Payment Service**
yaml
Group: payment-processors
Topics: ecommerce.orders.events
Filter: status = "PLACED"
Logic: Payment initiation
Result: Publication in ecommerce.payments.events


**4.2. Inventory Service**  
yaml
Group: inventory-updaters
Topics: ecommerce.orders.events
Logic: Product reservation/release
Idempotence: By order_id + item_id


**4.3. Notification Service**
yaml
Group: notification-senders
Topics: 
  - ecommerce.orders.events
  - ecommerce.payments.events
Parallelism: 5 consumers
Retry: 3 attempts with backoff


###### 4.7.7.2.5. Cluster configuration

**5.1. Deployment**
yaml
Environment: Kubernetes
Brokers: 3 pods
Resources:
  - CPU: 2 cores
  - Memory: 4GB
  - Storage: 100GB SSD per broker


**5.2. Performance settings**
yaml
log.retention.bytes: 10GB per partition
log.segment.bytes: 512MB
compression.type: snappy
num.replica.fetchers: 4


###### 4.7.7.2.6. Monitoring

**6.1. Business metrics**
yaml
- Orders processed per minute
- Payment success rate
- Inventory sync delay
- Customer notification delivery rate


**6.2. Technical metrics**
yaml
- Consumer lag per topic
- Producer throughput
- Error rates by service
- Partition distribution


---

#### 4.7.8. Quality criteria for AI

##### 4.7.8.1. Architectural maturity
- **Mandatory**: All 6 main blocks filled
- **Production**: Security, monitoring, performance blocks added
- **Enterprise**: Disaster recovery, compliance, governance added

##### 4.7.8.2. Technical detailing
- **Topics**: Clear partitioning scheme and retention policies
- **Schemas**: Valid Avro/JSON Schema with examples
- **Configuration**: Realistic settings for target load
- **Security**: ACL, authentication, encryption

##### 4.7.8.3. Operational readiness
- **Monitoring**: Key metrics and alerts defined
- **Error handling**: DLQ, retry policies, circuit breakers
- **Performance**: SLA, throughput, latency requirements
- **Disaster Recovery**: Backup, restore, failover procedures

##### 4.7.8.4. System integration
- **Domain Events**: Correspond to business logic from Use Cases
- **API Integration**: Complement REST API architecture
- **Data Flow**: Consistent with Sequence diagrams
- **Services**: Correspond to component architecture

---

#### 4.7.9. Checklist for AI agent

##### 4.7.9.1. Mandatory verification:
- [ ] ✅ AsyncAPI YAML file created with correct name
- [ ] ✅ AsyncAPI version specified (2.6.0+)
- [ ] ✅ info section completely filled
- [ ] ✅ Servers contains Kafka configuration
- [ ] ✅ Channels describe all topics
- [ ] ✅ Each channel has publish/subscribe operations
- [ ] ✅ Components contain message schemas
- [ ] ✅ Partitioning strategy defined in bindings
- [ ] ✅ Replication configured in kafka bindings
- [ ] ✅ Retention policies described in configs
- [ ] ✅ Data schemas valid (JSON Schema)
- [ ] ✅ Consumer groups specified in bindings
- [ ] ✅ AsyncAPI YAML syntax correct

##### 4.7.9.2. Quality verification:
- [ ] 🎯 Topics logically connected to domains
- [ ] 🎯 Schemas support evolution (backward compatibility)
- [ ] 🎯 Error handling via DLQ described
- [ ] 🎯 Idempotent processing ensured
- [ ] 🎯 Producer acknowledgements configured correctly
- [ ] 🎯 Consumer offset management defined

##### 4.7.9.3. Production-ready verification:
- [ ] 🚀 Security: SASL/SSL, ACL configured
- [ ] 🚀 Monitoring: metrics and alerts defined
- [ ] 🚀 Performance: SLA and optimizations described
- [ ] 🚀 Backup and disaster recovery procedures
- [ ] 🚀 Schema Registry configured
- [ ] 🚀 Consumer lag monitoring
- [ ] 🚀 Dead Letter Queue processing
- [ ] 🚀 Capacity planning (partitions, brokers)

##### 4.7.9.4. Integration verification:
- [ ] 🔗 Events correspond to Use Cases
- [ ] 🔗 Schemas compatible with API specifications
- [ ] 🔗 Producer services exist in architecture diagram
- [ ] 🔗 Consumer groups don't conflict in responsibility
- [ ] 🔗 Time characteristics realistic
- [ ] 🔗 Data volumes correspond to system scale

**Goal**: Create YAML files with Kafka architecture description, ready for production deployment with full coverage of functional and non-functional requirements.

##### 4.7.9.5. Final AsyncAPI YAML verification:
- [ ] 📄 File saved with .yaml extension
- [ ] 📄 File name follows naming convention
- [ ] 📄 AsyncAPI structure corresponds to specification
- [ ] 📄 All string values enclosed in quotes
- [ ] 📄 Indentation done with spaces (not tabs)
- [ ] 📄 JSON Schema correctly defined in components
- [ ] 📄 Kafka bindings configured for channels
- [ ] 📄 Security schemes defined when necessary
- [ ] 📄 Examples included for each message type

---

#### 4.7.10. Additional recommendations

##### 4.7.10.1. Documentation style:
- **Structuredness**: Use YAML for configurations
- **Specificity**: Specify exact numbers of partitions, retention, throughput
- **Examples**: Include real Avro/JSON Schema examples
- **Visualization**: ASCII diagrams for topology

##### 4.7.10.2. Production aspects:
- **Naming**: Follow {domain}.{entity}.{event} conventions
- **Partitioning**: Justify partitioning key choice
- **Retention**: Consider compliance and storage costs
- **Versioning**: Plan schema evolution in advance

##### 4.7.10.3. DevOps integration:
- **Infrastructure as Code**: Terraform/Helm configurations
- **CI/CD**: Schema validation in pipeline
- **Monitoring**: Prometheus/Grafana metrics
- **Alerting**: PagerDuty/Slack integrations

##### 4.7.10.4. Disaster Recovery:
- **Backup**: MirrorMaker 2.0 for replication
- **Recovery**: RTO/RPO requirements
- **Testing**: Chaos engineering practices
- **Documentation**: Runbooks for operations team

