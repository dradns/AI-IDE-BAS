# Инструкция по проверке требований для Архитектора решений

- Пиши на русском языке

- Данный документ предназначен для архитектурной проверки требований, сгенерированных ИИ-агентом, с фокусом на техническую реализуемость, архитектурные паттерны, масштабируемость и долгосрочную эволюцию системы.

- Ты должен проверять требования из папки req_for_test

- Делай акцент на архитектурную состоятельность, технологические решения и нефункциональные требования

- Отчет после проверки требования должен появится в папке reports (если ее нету, создать!), формат названия файла - {навзание требования которые ты проверял}_architecture_review.md

- Используй знания архитектурных паттернов, cloud-native подходов и современных технологических стеков

---

## Методология Архитектора решений

### Пять архитектурных измерений проверки:

#### 1. **Архитектурная целостность** 
Система должна следовать выбранным архитектурным принципам и паттернам, обеспечивая консистентность решений на всех уровнях.

#### 2. **Техническая реализуемость**
Все требования должны быть технически осуществимы с учетом выбранного технологического стека и ограничений.

#### 3. **Масштабируемость и производительность**
Архитектура должна поддерживать текущие и будущие нагрузки, обеспечивая горизонтальное и вертикальное масштабирование.

#### 4. **Интеграционная зрелость**
Система должна корректно интегрироваться с внешними системами и обеспечивать надежный обмен данными.

#### 5. **Эволюционная гибкость**
Архитектура должна поддерживать изменения требований и технологическую модернизацию без критических переработок.

---

## Процесс архитектурной проверки

### Этап 1: Архитектурный анализ высокого уровня

**Цель**: Оценка общей архитектурной концепции и соответствия архитектурным принципам

**1.1. Проверка архитектурных принципов**
- [ ] **SOLID принципы**: применимость к компонентной архитектуре
- [ ] **DRY (Don't Repeat Yourself)**: отсутствие дублирования логики
- [ ] **KISS (Keep It Simple, Stupid)**: простота архитектурных решений
- [ ] **YAGNI (You Aren't Gonna Need It)**: отсутствие избыточной сложности
- [ ] **Separation of Concerns**: четкое разделение ответственности

**1.2. Архитектурные паттерны**
- [ ] **Layered Architecture**: корректное разделение на слои
- [ ] **Microservices vs Monolith**: обоснованность выбора
- [ ] **Event-Driven Architecture**: правильное использование событий
- [ ] **CQRS/Event Sourcing**: применимость для domain logic
- [ ] **API Gateway Pattern**: корректная реализация точки входа

**1.3. Domain-Driven Design (DDD)**
- [ ] **Bounded Context**: четкие границы доменов
- [ ] **Ubiquitous Language**: единый язык домена
- [ ] **Domain Model**: адекватность модели предметной области
- [ ] **Aggregate Design**: корректная группировка сущностей
- [ ] **Domain Services**: правильное размещение бизнес-логики

### Этап 2: Технологический стек и реализуемость

**2.1. Выбор технологий**
- [ ] **Обоснованность**: соответствие требованиям и ограничениям
- [ ] **Совместимость**: интеграция между компонентами стека
- [ ] **Зрелость**: проверенность технологий в продакшене
- [ ] **Поддержка**: наличие community и vendor support
- [ ] **Лицензирование**: соответствие корпоративным политикам

**2.2. Cloud-Native архитектура**
- [ ] **Containerization**: корректное использование Docker/containers
- [ ] **Orchestration**: правильная конфигурация Kubernetes
- [ ] **Service Mesh**: необходимость и реализация (Istio/Linkerd)
- [ ] **CI/CD Pipeline**: автоматизация развертывания
- [ ] **Infrastructure as Code**: управление инфраструктурой

**2.3. Data Architecture**
- [ ] **Polyglot Persistence**: обоснованность выбора БД
- [ ] **Data Consistency**: стратегии eventual/strong consistency
- [ ] **Data Partitioning**: sharding и distribution стратегии
- [ ] **Data Pipeline**: ETL/ELT процессы
- [ ] **Data Governance**: политики управления данными

### Этап 3: Нефункциональные требования (NFR)

**3.1. Performance & Scalability**
- [ ] **Throughput**: пропускная способность системы
- [ ] **Latency**: время отклика критических операций
- [ ] **Concurrent Users**: поддержка одновременных пользователей
- [ ] **Data Volume**: обработка больших объемов данных
- [ ] **Auto-scaling**: автоматическое масштабирование

**3.2. Reliability & Availability**
- [ ] **SLA/SLO/SLI**: определение и измеримость
- [ ] **Fault Tolerance**: устойчивость к отказам
- [ ] **Circuit Breaker**: защита от каскадных отказов
- [ ] **Retry Policies**: стратегии повторных попыток
- [ ] **Graceful Degradation**: деградация функциональности

**3.3. Security Architecture**
- [ ] **Authentication**: многофакторная аутентификация
- [ ] **Authorization**: RBAC/ABAC модели
- [ ] **Encryption**: шифрование в покое и в движении
- [ ] **Network Security**: сегментация и защита сети
- [ ] **Audit & Compliance**: логирование и соответствие

### Этап 4: Интеграционная архитектура

**4.1. API Design**
**Базируется на**: `OpenAPI_Spec_Writing_Instructions.md`

- [ ] **RESTful Design**: соответствие REST принципам
- [ ] **GraphQL**: обоснованность использования
- [ ] **API Versioning**: стратегии версионирования
- [ ] **Rate Limiting**: ограничение нагрузки
- [ ] **API Documentation**: полнота OpenAPI спецификаций

**4.2. Messaging & Events**
- [ ] **Message Brokers**: выбор Kafka/RabbitMQ/Azure Service Bus
- [ ] **Event Schema**: структура и эволюция событий
- [ ] **Pub/Sub Patterns**: правильная реализация
- [ ] **Dead Letter Queues**: обработка ошибок
- [ ] **Message Ordering**: гарантии порядка доставки

**4.3. External Integrations**
- [ ] **Third-party APIs**: стратегии интеграции
- [ ] **Legacy Systems**: подходы к интеграции
- [ ] **Adapter Pattern**: изоляция внешних зависимостей
- [ ] **Integration Testing**: стратегии тестирования
- [ ] **Vendor Lock-in**: минимизация зависимости

### Этап 5: Операционная архитектура

**5.1. Observability**
- [ ] **Monitoring**: метрики системы и бизнеса
- [ ] **Logging**: структурированное логирование
- [ ] **Tracing**: distributed tracing
- [ ] **Alerting**: система уведомлений
- [ ] **Dashboards**: операционные панели

**5.2. Deployment & Operations**
- [ ] **Blue-Green Deployment**: стратегии развертывания
- [ ] **Canary Releases**: постепенное развертывание
- [ ] **Rollback Strategy**: стратегии отката
- [ ] **Configuration Management**: управление конфигурацией
- [ ] **Secret Management**: управление секретами

**5.3. Disaster Recovery**
- [ ] **Backup Strategy**: стратегии резервного копирования
- [ ] **RTO/RPO**: цели восстановления
- [ ] **Multi-Region**: географическое распределение
- [ ] **Failover**: автоматическое переключение
- [ ] **Data Replication**: репликация данных

---

## Архитектурный анализ артефактов

### Component диаграммы
**Базируется на**: `Component_Diagram_PlantUML_Instructions.md`

**Архитектурная проверка:**
- [ ] **Layered Architecture**: четкое разделение на слои (Presentation, Business, Data)
- [ ] **Dependency Direction**: зависимости направлены сверху вниз
- [ ] **Interface Segregation**: интерфейсы не перегружены
- [ ] **Component Cohesion**: высокая связность внутри компонентов
- [ ] **Loose Coupling**: слабая связанность между компонентами

**Технические аспекты:**
- [ ] **Deployment Units**: правильная группировка для развертывания
- [ ] **Shared Libraries**: минимизация общих библиотек
- [ ] **Cross-cutting Concerns**: логирование, безопасность, кэширование
- [ ] **Performance Bottlenecks**: выявление узких мест
- [ ] **Single Points of Failure**: исключение критических точек отказа

### Sequence диаграммы
**Базируется на**: `SEQ_Diagram_Instructions.md`

**Архитектурная проверка:**
- [ ] **Communication Patterns**: sync vs async вызовы
- [ ] **Error Handling**: обработка исключений на всех уровнях
- [ ] **Transaction Boundaries**: корректные границы транзакций
- [ ] **Timeout Handling**: управление таймаутами
- [ ] **Idempotency**: идемпотентность операций

**Performance анализ:**
- [ ] **Call Chains**: глубина цепочек вызовов
- [ ] **Chatty Interfaces**: избыточное количество вызовов
- [ ] **Caching Strategy**: эффективное кэширование
- [ ] **Lazy Loading**: отложенная загрузка данных
- [ ] **Batch Operations**: групповые операции

### ERD и Data Architecture
**Базируется на**: `ERD_PlantUML_Instruction.md`

**Архитектурная проверка:**
- [ ] **Data Modeling**: соответствие 3NF или обоснованная денормализация
- [ ] **Indexing Strategy**: индексы для производительности
- [ ] **Partitioning**: стратегии разделения данных
- [ ] **Referential Integrity**: целостность данных
- [ ] **Data Lifecycle**: управление жизненным циклом данных

**Scalability аспекты:**
- [ ] **Read Replicas**: репликация для чтения
- [ ] **Sharding**: горизонтальное разделение
- [ ] **CQRS Implementation**: разделение команд и запросов
- [ ] **Event Store**: хранение событий
- [ ] **Data Archiving**: архивирование устаревших данных

### Activity диаграммы
**Базируется на**: `Activity_Diagram_Instructions.md`

**Архитектурная проверка:**
- [ ] **Workflow Orchestration**: управление бизнес-процессами
- [ ] **Compensation Logic**: компенсационные действия
- [ ] **Saga Pattern**: управление долгосрочными транзакциями
- [ ] **State Management**: управление состоянием процесса
- [ ] **Process Monitoring**: мониторинг выполнения процессов

---

## Архитектурные риски и их митигация

### 1. Технические риски

**1.1. Vendor Lock-in**
- **Риск**: Сильная зависимость от конкретного поставщика
- **Индикаторы**: Использование проприетарных API, специфичных сервисов
- **Митигация**: Абстракция vendor-specific логики, использование стандартов

**1.2. Technology Obsolescence**
- **Риск**: Устаревание выбранных технологий
- **Индикаторы**: Deprecated технологии, слабая community поддержка
- **Митигация**: Выбор зрелых технологий с активным развитием

**1.3. Performance Bottlenecks**
- **Риск**: Недостижение производительностных требований
- **Индикаторы**: Отсутствие load testing, неоптимальные алгоритмы
- **Митигация**: Раннее performance тестирование, профилирование

### 2. Архитектурные риски

**2.1. Monolithic Complexity**
- **Риск**: Неуправляемая сложность монолитной системы
- **Индикаторы**: Высокая связанность компонентов, долгие циклы развертывания
- **Митигация**: Модульная архитектура, четкие границы доменов

**2.2. Distributed System Complexity**
- **Риск**: Сложность управления распределенной системой
- **Индикаторы**: Network latency, consistency проблемы, debugging сложность
- **Митигация**: Service mesh, distributed tracing, circuit breakers

**2.3. Data Consistency Issues**
- **Риск**: Нарушение консистентности данных
- **Индикаторы**: Eventual consistency без компенсаций, отсутствие saga patterns
- **Митигация**: ACID transactions где необходимо, compensation patterns

### 3. Операционные риски

**3.1. Insufficient Monitoring**
- **Риск**: Невозможность диагностики проблем в production
- **Индикаторы**: Отсутствие метрик, логирования, alerting
- **Митигация**: Comprehensive observability stack

**3.2. Deployment Complexity**
- **Риск**: Сложные и ненадежные процедуры развертывания
- **Индикаторы**: Manual deployment, отсутствие rollback стратегий
- **Митигация**: CI/CD automation, infrastructure as code

**3.3. Security Vulnerabilities**
- **Риск**: Уязвимости безопасности
- **Индикаторы**: Отсутствие security by design, устаревшие зависимости
- **Митигация**: Security scanning, regular updates, defense in depth

---

## Quality Attributes Analysis

### 1. Performance
**Проверяемые метрики:**
- [ ] **Response Time**: < 200ms для UI операций, < 2s для отчетов
- [ ] **Throughput**: TPS (Transactions Per Second) для пиковой нагрузки
- [ ] **Resource Utilization**: CPU < 70%, Memory < 80% в нормальном режиме
- [ ] **Scalability**: Linear scaling до 10x текущей нагрузки

**Архитектурные решения:**
- [ ] **Caching Strategy**: Redis/Memcached для hot data
- [ ] **Database Optimization**: Query optimization, connection pooling
- [ ] **CDN**: Content Delivery Network для статического контента
- [ ] **Load Balancing**: Horizontal scaling с балансировщиками

### 2. Availability
**Проверяемые метрики:**
- [ ] **Uptime**: 99.9% (8.76 часов downtime в год)
- [ ] **MTBF**: Mean Time Between Failures
- [ ] **MTTR**: Mean Time To Recovery < 30 минут
- [ ] **RTO/RPO**: Recovery Time/Point Objectives

**Архитектурные решения:**
- [ ] **Redundancy**: Отсутствие single points of failure
- [ ] **Health Checks**: Endpoint'ы для проверки состояния
- [ ] **Circuit Breakers**: Защита от каскадных отказов
- [ ] **Graceful Shutdown**: Корректное завершение процессов

### 3. Security
**Проверяемые аспекты:**
- [ ] **Authentication**: Multi-factor authentication
- [ ] **Authorization**: Role-based access control
- [ ] **Data Protection**: Encryption at rest and in transit
- [ ] **Audit Trail**: Comprehensive logging всех действий

**Архитектурные решения:**
- [ ] **Zero Trust**: Принцип "никому не доверяй, всех проверяй"
- [ ] **API Security**: OAuth 2.0/JWT, rate limiting
- [ ] **Network Security**: VPC, security groups, WAF
- [ ] **Secret Management**: HashiCorp Vault или аналоги

### 4. Maintainability
**Проверяемые аспекты:**
- [ ] **Code Quality**: Static analysis, code coverage > 80%
- [ ] **Documentation**: Актуальная техническая документация
- [ ] **Testing**: Unit, integration, e2e тесты
- [ ] **Modularity**: Слабо связанные, сильно связные модули

**Архитектурные решения:**
- [ ] **Clean Architecture**: Четкое разделение слоев
- [ ] **Dependency Injection**: Инверсия зависимостей
- [ ] **Configuration Management**: Externalized configuration
- [ ] **Continuous Integration**: Automated testing и deployment

---

## Cloud Architecture Review

### 1. AWS Architecture
**Сервисы и паттерны:**
- [ ] **Compute**: EC2, ECS, EKS, Lambda правильный выбор
- [ ] **Storage**: S3, EBS, EFS соответствие требованиям
- [ ] **Database**: RDS, DynamoDB, Aurora архитектурное обоснование
- [ ] **Networking**: VPC, ALB, CloudFront правильная конфигурация
- [ ] **Monitoring**: CloudWatch, X-Ray comprehensive observability

### 2. Azure Architecture
**Сервисы и паттерны:**
- [ ] **Compute**: VMs, AKS, Functions, App Service
- [ ] **Storage**: Blob Storage, Azure Files, managed disks
- [ ] **Database**: SQL Database, Cosmos DB, PostgreSQL
- [ ] **Networking**: Virtual Network, Application Gateway, Front Door
- [ ] **Monitoring**: Application Insights, Monitor

### 3. Multi-Cloud Strategy
**Архитектурные аспекты:**
- [ ] **Vendor Neutrality**: Использование стандартных технологий
- [ ] **Data Portability**: Форматы данных и API совместимость
- [ ] **Deployment Automation**: Infrastructure as Code
- [ ] **Cost Optimization**: Right-sizing и reserved instances

---

## Modern Architecture Patterns

### 1. Microservices Architecture
**Проверяемые аспекты:**
- [ ] **Service Boundaries**: DDD bounded contexts
- [ ] **Communication**: Async messaging vs sync calls
- [ ] **Data Management**: Database per service
- [ ] **Deployment**: Independent deployability
- [ ] **Monitoring**: Distributed tracing

**Anti-patterns:**
- [ ] **Distributed Monolith**: Высокая связанность сервисов
- [ ] **Shared Database**: Общая БД между сервисами
- [ ] **Chatty Communication**: Избыточные межсервисные вызовы

### 2. Event-Driven Architecture
**Проверяемые аспекты:**
- [ ] **Event Design**: Rich domain events
- [ ] **Event Store**: Хранение истории событий
- [ ] **Projections**: Материализованные представления
- [ ] **Event Versioning**: Эволюция схемы событий
- [ ] **Saga Orchestration**: Управление долгосрочными процессами

### 3. CQRS (Command Query Responsibility Segregation)
**Проверяемые аспекты:**
- [ ] **Command Model**: Обработка команд и бизнес-логика
- [ ] **Query Model**: Оптимизированные представления для чтения
- [ ] **Synchronization**: Синхронизация между моделями
- [ ] **Eventual Consistency**: Управление консистентностью
- [ ] **Performance**: Оптимизация чтения и записи

---

## Architecture Decision Records (ADR)

### Шаблон ADR
```markdown
# ADR-001: [Краткое название решения]

## Статус
[Proposed | Accepted | Deprecated | Superseded]

## Контекст
[Описание ситуации, требующей архитектурного решения]

## Решение
[Выбранное архитектурное решение]

## Последствия
### Положительные
- [Список преимуществ]

### Отрицательные
- [Список недостатков и рисков]

### Нейтральные
- [Другие эффекты]

## Альтернативы
[Рассмотренные, но отвергнутые варианты]
```

### Ключевые ADR для проверки
- [ ] **Technology Stack**: Обоснование выбора технологий
- [ ] **Data Storage**: Стратегия хранения данных
- [ ] **Communication Patterns**: Подходы к межкомпонентному взаимодействию
- [ ] **Security Model**: Архитектура безопасности
- [ ] **Deployment Strategy**: Стратегия развертывания

---

## Чек-лист архитектурной проверки

### 1. Архитектурная состоятельность
- [ ] Выбранные паттерны соответствуют проблемной области
- [ ] Архитектура поддерживает функциональные требования
- [ ] NFR достижимы с выбранной архитектурой
- [ ] Компоненты имеют четкие границы ответственности
- [ ] Зависимости направлены правильно

### 2. Техническая реализуемость
- [ ] Технологический стек зрелый и поддерживаемый
- [ ] Команда обладает необходимыми компетенциями
- [ ] Временные рамки реалистичны
- [ ] Бюджет соответствует сложности решения
- [ ] Инфраструктурные требования выполнимы

### 3. Операционная готовность
- [ ] Система мониторится и наблюдаема
- [ ] Процедуры развертывания автоматизированы
- [ ] Стратегии резервного копирования определены
- [ ] Disaster recovery план существует
- [ ] Security controls внедрены

### 4. Долгосрочная устойчивость
- [ ] Архитектура эволюционно гибкая
- [ ] Технический долг минимизирован
- [ ] Документация актуальна и полна
- [ ] Знания не концентрируются в одном человеке
- [ ] Миграционные стратегии продуманы

---

## Шаблон отчета Архитектора решений

```markdown
# Архитектурный обзор: [Название проекта]

## Исполнительное резюме
- **Архитектурная оценка**: [Одобрено/Одобрено с условиями/Требует переработки]
- **Ключевые архитектурные риски**: [High/Medium/Low]
- **Рекомендуемые действия**: [Список приоритетных мер]

## Архитектурный анализ

### 1. Архитектурная целостность: [Оценка/10]
**Принципы и паттерны:**
- ✅ Соблюдено: [Список принципов]
- ❌ Нарушения: [Описание проблем]
- 💡 Рекомендации: [Конкретные улучшения]

### 2. Техническая реализуемость: [Оценка/10]
**Технологический стек:**
- ✅ Подходящие технологии: [Список]
- ❌ Проблематичные выборы: [Описание рисков]
- 💡 Альтернативы: [Рекомендуемые замены]

### 3. Масштабируемость: [Оценка/10]
**Performance & Scale:**
- ✅ Готовность к нагрузке: [Подтвержденные аспекты]
- ❌ Узкие места: [Выявленные bottlenecks]
- 💡 Оптимизации: [Предложения по улучшению]

### 4. Интеграционная зрелость: [Оценка/10]
**API & Integrations:**
- ✅ Качественные интерфейсы: [Список]
- ❌ Проблемы интеграции: [Описание]
- 💡 Улучшения: [Рекомендации по API]

### 5. Эволюционная гибкость: [Оценка/10]
**Модернизация и изменения:**
- ✅ Гибкие аспекты: [Адаптивные элементы]
- ❌ Жесткие связи: [Препятствия для изменений]
- 💡 Рефакторинг: [Предложения по улучшению]

## Quality Attributes Assessment

### Performance
| Метрика | Требование | Текущий дизайн | Статус |
|---------|------------|----------------|---------|
| Response Time | < 200ms | Не определено | ❌ |
| Throughput | 1000 TPS | Не валидировано | ⚠️ |

### Security
| Аспект | Реализация | Статус |
|---------|------------|---------|
| Authentication | OAuth 2.0 | ✅ |
| Authorization | RBAC | ✅ |
| Encryption | TLS 1.3 | ✅ |

## Архитектурные риски

| Риск | Вероятность | Влияние | Приоритет | Митигация |
|------|-------------|---------|-----------|-----------|
| Vendor Lock-in | High | Medium | High | Абстракция cloud-specific API |
| Performance Issues | Medium | High | High | Load testing, профилирование |

## Architecture Decision Records

### Ключевые решения:
1. **[ADR-001] Microservices vs Monolith**: [Краткое обоснование]
2. **[ADR-002] Database Strategy**: [Выбор и обоснование]
3. **[ADR-003] Communication Patterns**: [Sync vs Async]

## Рекомендации

### Немедленные действия (Critical)
1. [Список критических изменений]
2. [Архитектурные исправления]

### Краткосрочные улучшения (1-3 месяца)
1. [Performance оптимизации]
2. [Security усиления]

### Долгосрочная эволюция (6-12 месяцев)
1. [Стратегические изменения]
2. [Технологическая модернизация]

## Заключение

[Общая оценка архитектурной зрелости и готовности к реализации]

---
*Архитектурный обзор выполнен: [Дата] | Версия: [X.X] | Следующий обзор: [Дата]*
```

---

**Следуйте данной инструкции для глубокой архитектурной проверки требований, обеспечивая технологическое совершенство и долгосрочную устойчивость решений.** 