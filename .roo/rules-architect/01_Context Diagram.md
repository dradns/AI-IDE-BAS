#Инструкция по созданию контекстных диаграмм (C4 Level 1) в PlantUML
##ОБЩИЕ ПРИНЦИПЫ
### Что такое контекстная диаграмма


Контекстная диаграмма - это отправная точка архитектурного описания системы, показывающая:
* Систему в целом как единый компонент
* Все ключевые взаимодействия с внешними акторами и системами
* Границы ответственности системы
### Когда использовать контекстную диаграмму


Контекстная диаграмма (C4 Level 1) используется на старте проекта для согласования границ системы с бизнесом, при онбординге команды для быстрого понимания ключевых интеграций, при изменениях архитектуры для оценки влияния на внешние системы, для аудита и документирования соответствия стандартам, а также при инцидентах для оперативного определения зоны ответственности. Это живой артефакт, который должен обновляться при всех значимых изменениях во внешних взаимодействиях системы.
## Обязательная структура файла
`plantuml
@startuml ContextDiagram_[SystemName]_v[Версия]


title Контекстная диаграмма - [Название системы] (C4 Level 1)
' Цель: [Краткое описание цели диаграммы]
' Область: [Что охватывает диаграмма]
' Автор: [ФИО]
' Дата: [ГГГГ-ММ-ДД]


skinparam component {
    BackgroundColor #E8F4FD
    BorderColor #2E5A87
    FontSize 14
    FontName Arial
}


skinparam actor {
    BackgroundColor #F0FFF0
    BorderColor #2E8B57
    FontSize 12
}


skinparam node {
    BackgroundColor #FFF0F5
    BorderColor #DB7093
    FontSize 12
}


skinparam arrow {
    Color #2E5A87
    FontSize 10
    FontName Arial
}


' Основное содержимое диаграммы...


@enduml


## Элементы диаграммы
### 1. Система (центральный элемент)
component "[Название системы]" as system_name <<System>> {
    ' Опциональное краткое описание
    [Краткое назначение]
}


### 2. Акторы


actor "[Роль актора]" as actor_name <<Person>>
  ' Например: "Клиент", "Администратор"
  
actor "[Системный актор]" as system_actor <<Automated>>
  ' Например: "Платежный бот", "Система мониторинга"


###3. Внешние системы


component "[Название системы]" as external_system <<External>>
  ' Например: "Платежный шлюз", "CRM система"


database "[Название БД]" as external_db <<Database>>
  ' Внешние базы данных


queue "[Очередь]" as external_queue <<Queue>>
  ' Внешние очереди сообщений


###4. Взаимодействия
actor_name --> system_name : "[Бизнес-действие]"
  ' Например: "Оформляет заказ"


system_name --> external_system : "[Тип интеграции]"
  ' Например: "Отправляет данные о платеже"


external_system --> system_name : "[Обратное взаимодействие]"
  ' Например: "Возвращает статус обработки"


##ЛУЧШИЕ ПРАКТИКИ
###1. Именование
* Система: официальное название продукта/сервиса
* Акторы: роли в бизнес-процессах
* Внешние системы: общепринятые названия
###2. Организация
* Система - строго в центре
* Люди-акторы - слева
* Системные акторы - снизу
* Внешние системы - справа
###3. Визуальные стандарты
' Цветовая схема
component <<System>> #lightblue
actor <<Person>> #lightgreen
actor <<Automated>> #lightyellow
component <<External>> #lightcoral
database <<Database>> #lightpink
queue <<Queue>> #lightsalmon
## ПРИМЕРЫ
###1. Электронная коммерция
plantuml
@startuml ContextDiagram_ECommerce_v1.0


title Контекстная диаграмма - Система электронной коммерции (C4 Level 1)
' Цель: Показать ключевые взаимодействия системы
' Область: Основные бизнес-процессы
' Автор: Иванов И.И.
' Дата: 2023-11-15


skinparam component {
    BackgroundColor #E8F4FD
    BorderColor #2E5A87
    FontSize 14
}


component "Интернет-магазин" as store <<System>> {
    Продажа товаров онлайн
}


actor "Покупатель" as customer <<Person>>
actor "Менеджер" as manager <<Person>>
actor "Платежный бот" as bot <<Automated>>


component "Платежный шлюз" as payment <<External>>
component "CRM система" as crm <<External>>
database "База товаров" as products <<Database>>


customer --> store : "Просматривает каталог, оформляет заказы"
manager --> store : "Управляет ассортиментом"
store --> payment : "Передает данные для оплаты"
payment --> store : "Возвращает статус платежа"
store --> crm : "Синхронизирует данные клиентов"
store --> products : "Запрашивает информацию о товарах"
bot --> store : "Автоматически обрабатывает возвраты"


@enduml


###2.  Мобильное приложение такси


@startuml ContextDiagram_TaxiApp_v1.2


title Контекстная диаграмма - Приложение такси (C4 Level 1)


actor "Пассажир" as passenger <<Person>>
actor "Водитель" as driver <<Person>>


component "Taxi App" as app <<System>> {
    Сервис заказа поездок
}


component "Google Maps" as maps <<External>>
component "Платежная система" as payments <<External>>
database "База пользователей" as user_db <<Database>>


passenger --> app : "Заказывает поездку"
driver --> app : "Принимает заказы"
app --> maps : "Запрашивает маршруты (gRPC)"
app --> payments : "Списывает оплату (REST)"
app --> user_db : "Проверяет данные (SQL)"


@enduml


###3. Медицинский портал


@startuml ContextDiagram_HealthPortal_v2.0


title Контекстная диаграмма - Медицинский портал (C4 Level 1)


actor "Пациент" as patient <<Person>>
actor "Врач" as doctor <<Person>>


component "HealthPortal" as portal <<System>> {
    Запись к врачам и ЭМК
}


component "Госуслуги" as gosuslugi <<External>>
component "Лаборатория" as lab <<External>>
database "Медицинские записи" as emr <<Database>>


patient --> portal : "Записывается на прием"
doctor --> portal : "Просматривает историю болезней"
portal --> gosuslugi : "Проверяет полис (SOAP)"
portal --> lab : "Получает анализы (HL7)"
portal --> emr : "Хранит данные (FHIR)"


@enduml
 
###4. Система с AI-ассистентом


plantuml
@startuml  
title Контекстная диаграмма - Умный дом (C4 Level 1)  


actor "AI-ассистент" as ai <<AI>>  
actor "Датчик движения" as sensor <<IoT>>  
component "Управляющий сервер" as hub <<System>>  


ai --> hub : "Включает свет по голосу"  
sensor --> hub : "Обнаруживает движение"  
@enduml  


###5. Поддержка клиентов с чат-ботом


plantuml
@startuml  
title Контекстная диаграмма - Поддержка (C4 Level 1)  


actor "Клиент" as user <<Person>>  
actor "Чат-бот" as bot <<Automated>>  
component "Helpdesk" as helpdesk <<System>>  


user --> bot : "Задает вопрос"  
bot --> helpdesk : "Переводит на оператора (если не может ответить)"  
@enduml  




## СПЕЦИАЛИЗИРОВАННЫЕ ЭЛЕМЕНТЫ


###1. Легаси-системы


component "Унаследованная CRM" as legacy_crm <<Legacy>> {
    Версия 1.2.3, поддержка до 2025
}


banking_system --> legacy_crm : "Синхронизирует данные (CSV)"


###2. Облачные сервисы


cloud "AWS S3" as s3 <<Cloud>>
cloud "Azure AD" as azure <<Cloud>>


banking_system --> s3 : "Сохраняет документы"
banking_system --> azure : "Аутентификация"


###3 Сложные взаимодействия


' Асинхронное взаимодействие
banking_system --> event_queue : "Публикует события (Avro)"
event_queue --> analytics_bot : "Отправляет данные"


' Двусторонняя интеграция
banking_system --> payment_gateway : "Инициирует платеж"
payment_gateway --> banking_system : "Возвращает статус (webhook)"


## АНТИПАТТЕРНЫ
###1. Типичные ошибки
* Включение внутренних компонентов
* Избыточная техническая детализация
* Несогласованность с другими диаграммами
* Отсутствие версионирования
###2. Плохие примеры
' Слишком технично
component "MainSystem" as sys
sys --> "MySQL" : "JDBC connection"


' Неясные роли
actor "Вася" as user
user --> sys : "Работает"


' Слишком много элементов
actor "User1" as u1
actor "User2" as u2
component "System" as sys
component "DB1" as db1
component "DB2" as db2
component "API1" as api1
component "API2" as api2
u1 --> sys
u2 --> sys
sys --> db1
sys --> db2
sys --> api1
sys --> api2


'  Избыточные детали
component "Frontend" as fe
component "Backend" as be
fe --> be : "HTTP/1.1 JSON\nHeaders: {auth: Bearer...}"
## ПРОЦЕСС СОЗДАНИЯ
### Шаг 1:Сбор информации:
   * Интервью с продукт-менеджерами
   * Анализ существующей документации
   * Обзор интеграционных точек
### Шаг 2:Проектирование:
   * Определение границ системы
   * Выявление ключевых акторов
   * Описание взаимодействий
### Шаг 3: Валидация:
   * Проверка с техническими специалистами
   * Согласование с бизнес-аналитиками
   * Обновление при изменениях
##ГОТОВЫЕ ФРАГМЕНТЫ КОДА
###1 Веб-приложение
plantuml
@startuml ContextDiagram_WebApp_v1.0


title Контекстная диаграмма - Веб-приложение (C4 Level 1)


actor "Пользователь" as user <<Person>>
component "Веб-приложение" as app <<System>> {
    Основной функционал
}


component "Платежный шлюз" as payment <<External>>
database "База данных" as db <<Database>>


user --> app : "Работает с интерфейсом"
app --> payment : "Отправляет платежи (REST)"
app --> db : "Хранит данные (SQL)"


@enduml




###2 Микросервисная архитектура


plantuml
@startuml ContextDiagram_Microservice_v2.1


title Контекстная диаграмма - Микросервис (C4 Level 1)


actor "Клиентский сервис" as client <<System>>
component "Микросервис X" as service <<System>> {
    Обработка заказов
}


queue "Kafka" as kafka <<Queue>>
database "PostgreSQL" as db <<Database>>


client --> service : "Вызывает API (gRPC)"
service --> kafka : "Публикует события"
service --> db : "Сохраняет состояние"


@enduml


###3 Мобильное приложение с облачной интеграцией


plantuml
@startuml ContextDiagram_MobileApp_v1.3


title Контекстная диаграмма - Мобильное приложение (C4 Level 1)


actor "Пользователь" as user <<Person>>
component "Мобильное приложение" as app <<System>>


cloud "Firebase" as firebase <<Cloud>>
component "Analytics API" as analytics <<External>>


user --> app : "Взаимодействует"
app --> firebase : "Синхронизация данных"
app --> analytics : "Отправка метрик"


@enduml


 
###4 Унаследованная система
 
plantuml


@startuml ContextDiagram_Legacy_v1.0


title Контекстная диаграмма - Легаси система (C4 Level 1)


actor "Оператор" as operator <<Person>>
component "Mainframe" as legacy <<Legacy>> {
    Устаревшая система
}


database "DB2" as db2 <<Database>>
component "Файловое хранилище" as files <<External>>


operator --> legacy : "Вводит данные"
legacy --> db2 : "SQL-запросы"
legacy --> files : "Экспорт в CSV"


@enduml




###5 Интеграционный хаб


plantuml


@startuml ContextDiagram_IntegrationHub_v3.2


title Контекстная диаграмма - Интеграционный хаб (C4 Level 1)


component "Интеграционный хаб" as hub <<System>> {
    Централизованная маршрутизация
}


component "CRM система" as crm <<External>>
component "ERP система" as erp <<External>>
queue "RabbitMQ" as mq <<Queue>>


hub --> crm : "Синхронизация клиентов"
hub --> erp : "Передача заказов"
hub --> mq : "Асинхронные события"


@enduml


###6 IoT-система


plantuml


@startuml ContextDiagram_IoT_v1.0  


title Контекстная диаграмма - Система мониторинга IoT (C4 Level 1)  


actor "Датчик температуры" as sensor <<IoT>>  
component "Аналитическая платформа" as platform <<System>> {  
  Сбор и анализ данных с датчиков  
}  


cloud "AWS IoT Core" as aws <<Cloud>>  
database "TimescaleDB" as tsdb <<Database>>  


sensor --> platform : "Отправляет показания (MQTT)"  
platform --> aws : "Синхронизация устройств"  
platform --> tsdb : "Сохраняет метрики (SQL)"  


@enduml  


##МЕТРИКИ КАЧЕСТВА
1. Полнота:
   * Все ключевые акторы присутствуют
   * Основные интеграции отражены
2. Согласованность:
   * Имена соответствуют другим артефактам
   * Нет противоречий с реальностью
3. Актуальность:
   * Указана версия диаграммы
   * Есть дата последнего обновления


###ИНТЕГРАЦИЯ С ДРУГИМИ АРТЕФАКТАМИ
1. С User Story:
   * Акторы должны быть согласованы
   * Основные сценарии отражены
2. С Component Diagram:
   * Внешние системы дублируются
   * Уровень детализации согласован
3. С ERD:
   * Внешние БД соответствуют сущностям