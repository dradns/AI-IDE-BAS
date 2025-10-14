### 4.6. مواصفات OpenAPI
**تعليمات كتابة مواصفات OpenAPI لوكيل الذكاء الاصطناعي**

#### 4.6.1. المحتوى
1. [أساسيات الهيكل](#أساسيات-الهيكل)
2. [مقاييس الجودة](#مقاييس-الجودة)
3. [قواعد التحقق](#قواعد-التحقق)
4. [الأقسام الإلزامية](#الأقسام-الإلزامية)
5. [وصف نقاط النهاية](#وصف-نقاط-النهاية)
6. [المكونات والمخططات](#المكونات-والمخططات)
7. [أفضل الممارسات](#أفضل-الممارسات)
8. [قائمة مراجعة الجودة](#قائمة-مراجعة-الجودة)

---

#### 4.6.2. أساسيات الهيكل

##### 4.6.2.1. الحد الأدنى لهيكل الملف:
yaml
openapi: 3.0.3
info:
  title: اسم API
  description: وصف غرض وميزات API
  version: '1.0.0'
servers:
  - url: https://api.example.com/v1
    description: خادم الإنتاج
tags:
  - name: users
    description: عمليات المستخدم
paths: {}
components:
  schemas: {}


---

#### 4.6.3. مقاييس الجودة

##### 4.6.3.1. المؤشرات المستهدفة:
- **اكتمال CRUD**: 100% تغطية لعمليات الإنشاء، القراءة، التحديث، الحذف
- **التوثيق**: جميع نقاط النهاية تحتوي على description و examples
- **الصحة**: صحة بناء YAML/JSON
- **مخططات البيانات**: 95% إعادة استخدام عبر components

##### 4.6.3.2. نظام التقييم:
- **جودة ممتازة**: CRUD + التوثيق + الصحة = ≥90%
- **جودة جيدة**: CRUD جزئي + التوثيق = 70-89%
- **يحتاج تحسين**: وظائف أساسية = <70%

---

#### 4.6.4. قواعد التحقق

##### 4.6.4.1 فحوصات تلقائية:

✓ إصدار openapi 3.0.0 أو أعلى
✓ info يحتوي على title, version, description
✓ servers محددة مع URL و description
✓ جميع paths تحتوي على عمليات (get, post, put, delete)
✓ responses تحتوي على 200 و 400/500 كحد أدنى
✓ schemas تستخدم $ref لإعادة الاستخدام
✓ parameters تحتوي على description و schema
✓ requestBody يحتوي على content مع schema


---

#### 4.6.5. الأقسام الإلزامية

##### 4.6.5.1. info - معلومات المشروع
yaml
info:
  title: User Management API
  description: |
    REST API لإدارة المستخدمين في النظام.
    يدعم CRUD كامل للمستخدمين والأدوار.
  version: '1.0.0'
  contact:
    name: دعم API
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT


##### 4.6.5.2. servers - خوادم API
yaml
servers:
  - url: https://api.example.com/v1
    description: خادم الإنتاج
  - url: https://staging-api.example.com/v1
    description: خادم التجارب


##### 4.6.5.3. tags - تجميع العمليات
yaml
tags:
  - name: users
    description: إدارة المستخدمين
  - name: auth
    description: المصادقة والتفويض


---

#### 4.6.6. وصف نقاط النهاية

##### 4.6.6.1. هيكل العملية:
yaml
/users/{id}:
  get:
    tags: [users]
    summary: الحصول على المستخدم بالمعرف
    description: إرجاع معلومات مفصلة عن المستخدم
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: معرف المستخدم الفريد
    responses:
      '200':
        description: تم العثور على المستخدم
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              id: 1
              email: "user@example.com"
              name: "John Doe"
      '404':
        description: المستخدم غير موجود
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'


##### 4.6.6.2. عناصر العملية الإلزامية:
- **tags**: التجميع حسب الوظيفة
- **summary**: وصف مختصر (حتى 50 حرفًا)
- **description**: وصف مفصل
- **parameters**: وصف جميع المعاملات
- **responses**: 200 وأكواد الأخطاء كحد أدنى
- **examples**: أمثلة الطلبات والاستجابات

---

#### 4.6.7. المكونات والمخططات

##### 4.6.7.1. المخططات القابلة لإعادة الاستخدام:
yaml
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          description: المعرف الفريد
          example: 1
        email:
          type: string
          format: email
          description: بريد المستخدم الإلكتروني
          example: "user@example.com"
        name:
          type: string
          description: الاسم الكامل للمستخدم
          example: "John Doe"
        created_at:
          type: string
          format: date-time
          description: تاريخ الإنشاء
          example: "2024-01-15T10:30:00Z"
    
    UserCreateRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
    
    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: integer
          description: رمز الخطأ
        message:
          type: string
          description: وصف الخطأ
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: رقم الصفحة للترقيم
  
  responses:
    NotFound:
      description: لم يتم العثور على المورد
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'


---

#### 4.6.8. أفضل الممارسات

##### 4.6.8.1. التسمية والهيكل
- **المسارات**: استخدام kebab-case (`/user-profiles`)
- **المخططات**: استخدام PascalCase (`UserProfile`)
- **المعاملات**: استخدام snake_case (`user_id`)
- **العمليات**: التجميع المنطقي حسب tags

##### 4.6.8.2. رموز الحالة
| العملية | النجاح | خطأ العميل | خطأ الخادم |
|----------|--------|----------------|----------------|
| **GET** | 200 | 404, 400 | 500 |
| **POST** | 201 | 400, 409 | 500 |
| **PUT** | 200 | 400, 404 | 500 |
| **DELETE** | 204 | 404 | 500 |

##### 4.6.8.3. التحقق من البيانات
yaml
properties:
  email:
    type: string
    format: email
    maxLength: 255
  age:
    type: integer
    minimum: 0
    maximum: 150
  status:
    type: string
    enum: [active, inactive, pending]


##### 4.6.8.4. الأمثلة والتوثيق
- إضافة `example` لكل حقل
- استخدام `description` لجميع العناصر
- تضمين أمثلة واقعية للطلبات/الاستجابات
- توثيق منطق الأعمال في `description`

---

#### 4.6.9. مثال API كامل

yaml
openapi: 3.0.3
info:
  title: User Management API
  description: REST API لإدارة المستخدمين
  version: '1.0.0'

servers:
  - url: https://api.example.com/v1
    description: خادم الإنتاج

tags:
  - name: users
    description: عمليات المستخدم

paths:
  /users:
    get:
      tags: [users]
      summary: الحصول على قائمة المستخدمين
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
          description: عدد المستخدمين في الصفحة
      responses:
        '200':
          description: قائمة المستخدمين
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  total:
                    type: integer
    
    post:
      tags: [users]
      summary: إنشاء مستخدم
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: تم إنشاء المستخدم
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      tags: [users]
      summary: الحصول على المستخدم
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: تم العثور على المستخدم
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
    
    UserCreateRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: رقم الصفحة
  
  responses:
    BadRequest:
      description: طلب غير صحيح
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
    
    NotFound:
      description: لم يتم العثور على المورد
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string


---

#### 4.6.10. قائمة مراجعة الجودة

##### 4.6.10.1. التحقق الهيكلي:
- [ ] ✅ إصدار openapi 3.0.0+
- [ ] ✅ info يحتوي على title, version, description
- [ ] ✅ servers محددة مع description
- [ ] ✅ tags محددة للتجميع

##### 4.6.10.2. التحقق من نقاط النهاية:
- [ ] ✅ جميع عمليات CRUD موضحة
- [ ] ✅ كل عملية تحتوي على summary و description
- [ ] ✅ parameters تحتوي على schema و description
- [ ] ✅ responses تغطي حالات النجاح والخطأ

##### 4.6.10.3. التحقق من المخططات:
- [ ] ✅ المخططات منقولة إلى components لإعادة الاستخدام
- [ ] ✅ الحقول الإلزامية محددة في required
- [ ] ✅ أنواع البيانات والتنسيقات صحيحة
- [ ] ✅ تمت إضافة examples للحقول

##### 4.6.10.4. التحقق النوعي:
- [ ] 🎯 جميع عمليات الأعمال مغطاة
- [ ] 🎯 التحقق يتوافق مع قواعد الأعمال
- [ ] 🎯 رموز الأخطاء مبررة منطقيًا
- [ ] 🎯 التوثيق مفهوم للمطورين

##### 4.6.10.5. التحقق التكاملي:
- [ ] 🔗 API يتوافق مع بنية النظام
- [ ] 🔗 مخططات البيانات تتوافق مع ERD
- [ ] 🔗 العمليات تغطي سيناريوهات Use Case

**الهدف**: إنشاء مواصفات OpenAPI جاهزة لتوليد كود العميل والتوثيق.

---

#### 4.6.11. توصيات التحقق

##### 4.6.11.1. أدوات التحقق:
- [Swagger Editor](https://editor.swagger.io/) - مدقق عبر الإنترنت
- OpenAPI Generator - توليد الكود
- Spectral - أداة فحص لـ OpenAPI

##### 4.6.11.2. أمثلة توثيق جودة:
✅ "إرجاع قائمة المستخدمين مع الترقيم"  
✅ "إنشاء مستخدم جديد مع التحقق من البريد الإلكتروني"  
✅ "خطأ 409 لتكرار البريد الإلكتروني"  

❌ "الحصول على البيانات"  
❌ "إنشاء كائن"  
❌ "إرجاع خطأ"


