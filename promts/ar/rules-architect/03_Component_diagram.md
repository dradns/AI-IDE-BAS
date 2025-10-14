### 4.5. [C4 Level 3] مخطط المكونات (Component Diagram)
#### 4.5.1. تعليمات إنشاء مخطط المكونات (C4 Level 3) في PlantUML
##### 4.5.1.1. المفهوم والهدف

**مخطط المكونات (Component Diagram)** - هو المخطط من المستوى الثالث في تدوين C4. يقوم بتفصيل كل من **الحاويات** (من مخطط الحاويات)، موضحًا من أي مكونات منطقية (وحدات، خدمات) تتكون وكيف تتفاعل داخلها.

في الحالة التي يُطلب فيها رسم مخطط المكونات، من الضروري طلب من المستخدم لأي الحاويات تحتاج مخططات المكونات (مع إعطائه خيار الاختيار).

حظر تحديد التقنيات المستخدمة: قبل تصميم المخططات، من الضروري التوضيح مع المستخدم مجموعة التقنيات المستخدمة في المشروع؛ إذا لم يتمكن المستخدم من تحديد المجموعة، فاستبعد الإشارة إلى مجموعة التقنيات على جميع مستويات مخططات C4

*   **الجمهور:** المطورون، المهندسون المعماريون.
*   **الهدف:** الإجابة على الأسئلة: *"كيف يتم هيكلة الحاوية داخليًا؟"*, *"من أي مكونات تتكون؟"*, *"كيف تتفاعل هذه المكونات مع بعضها البعض؟"*
*   **العناصر الرئيسية:** المكونات، الواجهات (API)، العلاقات بينها.

إذا كان ملف المخطط موجودًا، فمن الضروري سؤال المستخدم عما إذا كان需要 تحديث الملف الحالي أو حفظ المخطط في ملف بالإصدار التالي.

أثناء إنشاء المخطط، طبق مبدأ KISS (Keep It Simple, Stupid أو Keep It Short and Simple) - هذا مبدأ تصميم وتطوير أساسي، وفقًا له تعمل معظم الأنظمة بشكل أفضل عندما تبقى بسيطة، بدلاً من أن تكون معقدة بشكل غير ضروري.
##### 4.5.1.2. التركيب النحوي الأساسي لـ PlantUML لـ C4


لاستخدام تدوين C4 في PlantUML، من الضروري تضمين المكتبة المقابلة.
يجب أن يتوافق المخطط مع التركيب النحوي المحدد في https://github.com/plantuml-stdlib/C4-PlantUML


اسأل المستخدم عن أي الحاويات تحتاج إلى رسم مخطط مكونات، مع أخذ قائمة الحاويات من مخطط الحاويات (إذا تم إنشاؤه)، إذا لم يتم إنشاؤه فقم بإنشائه.


**سطر إلزامي في بداية النص البرمجي:**
plantuml
@startuml
!include <C4/C4_Component>
' كود المخطط الخاص بك هنا...
@enduml

##### 4.5.1.3. العناصر الأساسية وإعلانها
###### 4.5.1.3.1. الحاوية (Container)
العنصر ذو المستوى الأعلى الذي نقوم بتفصيله. يجب الإعلان عنه في مخطط الحاويات.


Container(alias, "label", "technology", "optional description")


###### 4.5.1.3.2. المكونات (Components)
الكتل البنائية الرئيسية للمخطط. هذه هي وحدات أو خدمات أو مكتبات مجمعة منطقيًا داخل الحاوية.

**تركيب الإعلان:**

Component(alias, "label", "technology", "optional description")

*   `alias` - معرف فريد للعنصر (لاتيني، بدون مسافات).
*   `label` - اسم المكون المعروض.
*   `technology` - إشارة إلى التقنية (على سبيل المثال، "Java Class", "REST Controller", "Spring Service").
*   `description` - وصف اختياري لمسؤولية المكون.

**مثال:**
plantuml
Component(controller, "OrderController", "Spring REST Controller", "يعالج طلبات HTTP المتعلقة بالطلبات")
Component(service, "OrderService", "Spring Service", "يغلف منطق الأعمال لمعالجة الطلبات")
Component(repository, "OrderRepository", "JPA Repository", "يوفر استمرارية بيانات الطلب")


###### 4.5.1.3.3. الواجهات (Interfaces)
تظهر كيف تقدم المكونات الوظائف لبعضها البعض أو للعالم الخارجي (مثل API).

**التركيب النحوي:**

Rel_U(to, from, "interface label", "technology")

*   `to`, `from` - أسماء مستعارة للعناصر المرتبطة.
*   `interface label` - اسم الواجهة/API (على سبيل المثال، "getOrderById").
*   `technology` - التقنية/البروتوكول (على سبيل المثال، "REST", "Java Interface").

**مثال:**
plantuml
Rel_U(controller, service, "Order API", "Java Interface")


###### 4.5.1.3.4. العلاقات (Relationships)
تظهر التفاعل بين المكونات. تشير إلى طبيعة التفاعل.

**التركيب النحوي:**

Rel(from, to, "label", "technology")

*   `from`, `to` - أسماء مستعارة للعناصر المرتبطة.
*   `label` - وصف التفاعل (على سبيل المثال، "يستدعي", "يستخدم").
*   `technology` - التقنية/البروتوكول (على سبيل المثال، "method call", "REST").

**مثال:**
plantuml
Rel(service, repository, "يستخدم", "JPA")


###### 4.5.1.3.5. قواعد البيانات والتبعيات الخارجية
لإظهار التفاعل مع قاعدة البيانات أو الخدمات الخارجية داخل الحاوية.


ContainerDb(alias, "label", "technology", "optional description")


**مثال:**
plantuml
ContainerDb(database, "قاعدة بيانات الطلبات", "PostgreSQL", "تخزن بيانات الطلبات")


##### 4.5.1.4. تجميع المكونات
لتنظيم المكونات بصريًا حسب المسؤوليات أو الطبقات.


Boundary(alias, "label") {
    Component(component1, "Component1")
    Component(component2, "Component2")
}


**مثال:**
plantuml
Boundary(web_layer, "طبقة الويب") {
    Component(controller, "OrderController")
}
Boundary(service_layer, "طبقة الخدمة") {
    Component(service, "OrderService")
}
Boundary(persistence_layer, "طبقة الاستمرارية") {
    Component(repository, "OrderRepository")
}


##### 4.5.1.5. وسيلة الإيضاح (Legend)
للوثائق الرسمية، يوصى بإضافة وسيلة إيضاح.


SHOW_LEGEND()


##### 4.5.1.6. مثال كامل للمخطط

plantuml
@startuml
!include <C4/C4_Component>

Title مخطط المكونات - Backend API (خدمة الطلبات المصغرة)

Container(api, "Order Service", "Spring Boot", "خدمة مصغرة لإدارة الطلبات")

Boundary(api_boundary, "مكونات خدمة الطلبات") {
    Component(order_controller, "OrderController", "REST Controller", "يعالج طلبات HTTP")
    Component(order_service, "OrderService", "Spring Service", "منطق أعمال الطلبات")
    Component(order_repository, "OrderRepository", "JPA Repository", "الوصول إلى البيانات")
    Component(inventory_client, "InventoryClient", "Feign Client", "استدعاء خدمة inventory")
    Component(notification_service, "NotificationService", "Spring Service", "إرسال الإشعارات")
}

ContainerDb(order_db, "قاعدة بيانات الطلبات", "PostgreSQL", "تخزين الطلبات")
System_Ext(inventory_service, "خدمة Inventory", "خدمة إدارة المخزون")
System_Ext(email_service, "خدمة البريد الإلكتروني", "خدمة إرسال البريد الإلكتروني")

Rel(order_controller, order_service, "يستدعي", "Java Interface")
Rel(order_service, order_repository, "يستخدم", "JPA")
Rel(order_service, inventory_client, "يفحص التوفر", "REST")
Rel(order_service, notification_service, "يطلب إشعار", "Java Interface")
Rel(order_repository, order_db, "يحفظ في", "JDBC")
Rel(inventory_client, inventory_service, "يستدعي API", "HTTP/REST")
Rel(notification_service, email_service, "يرسل طلب", "SMTP")

SHOW_LEGEND()

@enduml


##### 4.5.1.7. قائمة التحقق من جودة المخطط
قبل الحفظ، تحقق من المخطط:
1.  [ ] **تم تضمين التوجيه** `!include <C4/C4_Component>`
2.  [ ] **يوجد عنوان واضح** (`Title`) مع الإشارة إلى الحاوية المفصلة.
3.  [ ] **جميع العلاقات** موسومة (ما الإجراء الذي يتم تنفيذه).
4.  [ ] **تم عرض الواجهات الرئيسية** بين المكونات.
5.  [ ] **لا توجد تفاصيل مفرطة** (لا حاجة لعرض جميع الطرق والفئات).
6.  [ ] **الأسماء المستعارة** العناصر فريدة من نوعها ومكتوبة باللغة اللاتينية مع النص العربي بين قوسين.
7.  [ ] **تمت إضافة وسيلة الإيضاح** (`SHOW_LEGEND()`) للمنتجات الرسمية.
8.  [ ] **التركيب النحوي** جودة مخططات PlantUML بتدوين C4: يجب ألا تتعارض المخططات مع التركيب النحوي المحدد في https://github.com/plantuml-stdlib/C4-PlantUML
9.  [ ] اسأل المستخدم عن أي حاويات أخرى تحتاج إلى رسم مخطط مكونات
10. [ ] **بعد الانتهاء** اسأل المستخدم عن المستندات الأخرى التي تحتاج إلى إنشاء أو تعديل، مع تزويده بقائمة.

**تنسيق اسم الملف:** `c4_Level_3_component_diagram_[اسم المشروع]_([اسم الحاوية])_v[رقم الإصدار (بدءًا من 1)].plantuml`

