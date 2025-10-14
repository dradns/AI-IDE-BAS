### 4.5. Diagrama de Actividad del Proceso de Negocio en Formato PlantUML (Diagrama de Actividad)
**Instrucciones para crear Diagramas de Actividad para un agente de IA**

#### 4.5.1. Contenidos
1. [Bases y Requisitos](#bases-y-requisitos)
2. [Estructura del Diagrama](#estructura-del-diagrama)
3. [Métricas de Calidad](#métricas-de-calidad)
4. [Reglas de Validación](#reglas-de-validación)
5. [Plantilla Básica](#plantilla-básica)
6. [Elementos del Diagrama](#elementos-del-diagrama)
7. [Construcciones de Control](#construcciones-de-control)
8. [Manejo de Concurrencia](#manejo-de-concurrencia)
9. [Integración con Artefactos](#integración-con-artefactos)
10. [Patrones Estándar](#patrones-estándar)
11. [Lista de Verificación de Calidad](#lista-de-verificación-de-calidad)

---

#### 4.5.2. Bases y Requisitos

##### 4.5.2.1. Artefactos de Entrada Obligatorios:
- **User Story** - para comprender el objetivo de negocio y los límites del proceso
- **Use Case** - para una descripción detallada del flujo de acciones
- **Business Process Description** - para comprender la lógica y las reglas

##### 4.5.2.2. Artefactos Adicionales:
- Especificación técnica, Business Rules, documentación de Workflow
- Diagramas de Secuencia para comprender las interacciones

##### 4.5.2.3. Propósito del Diagrama de Actividad:
- Modelar el flujo de acciones y la toma de decisiones
- Visualización de procesos paralelos y sincronización
- Demostrar la lógica del proceso de negocio de principio a fin
- Identificar puntos de decisión y caminos alternativos

---

#### 4.5.3. Estructura del Diagrama

##### 4.5.3.1. Título y Configuraciones
plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title Nombre del Proceso desde User Story


##### 4.5.3.2. Swimlanes (Carriles de Responsabilidad)
plantuml
|Rol 1|
start
:Acción 1;

|Rol 2|
:Acción 2;

|Sistema|
:Acción Automática;


##### 4.5.3.3. Organización Estructural
- **Inicio**: punto de partida obligatorio
- **Acciones**: descripción de pasos específicos
- **Decisiones**: puntos de bifurcación lógica
- **Concurrencia**: fork/join para acciones concurrentes
- **Finalización**: end o stop

---

#### 4.5.4. Métricas de Calidad

##### 4.5.4.1. Indicadores Objetivo:
- **Cobertura del Flujo**: 100% de los pasos del Use Case están representados
- **Agrupación Lógica**: uso de swimlanes para roles
- **Detalle de Decisiones**: cada 'if' tiene todas las salidas posibles
- **Concurrencia**: los procesos concurrentes están identificados y modelados
- **Manejo de Errores**: mínimo 2 flujos de manejo de errores

##### 4.5.4.2. Sistema de Puntuación:
- **Calidad Excelente**: ≥90% de cumplimiento de métricas + cobertura completa del Use Case
- **Buena Calidad**: 70-89% de cumplimiento de métricas
- **Requiere Mejoras**: <70% de cumplimiento de métricas

##### 4.5.4.3. Métricas Específicas:
- Número de swimlanes: 2-6 (según los roles del Use Case)
- Número de decisiones: 1-5 por cada 10 acciones
- Profundidad de anidamiento: no más de 3 niveles
- Flujos paralelos: todos los procesos paralelos posibles están identificados

---

#### 4.5.5. Reglas de Validación

##### 4.5.5.1. Comprobaciones Automáticas:

✓ Comienza con @startuml, termina con @enduml
✓ Tiene un único punto de inicio
✓ Todos los caminos conducen a end/stop
✓ Cada 'if' tiene ramas then/else correspondientes
✓ Todos los fork tienen join correspondientes
✓ Los Swimlanes corresponden a los roles del Use Case
✓ Las acciones contienen verbos activos
✓ No hay acciones "sueltas" sin entrada/salida
✓ Las decisiones se formulan como preguntas


##### 4.5.5.2. Comprobaciones Semánticas:

✓ Cada acción corresponde a un paso del Use Case
✓ La secuencia de acciones está lógicamente conectada
✓ Los roles en los swimlanes corresponden a los actores de la User Story
✓ Todos los flujos alternativos del Use Case están representados
✓ El manejo de errores cubre las principales excepciones


---

#### 4.5.6. Plantilla Básica

plantuml
@startuml
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 10
skinparam backgroundColor #FFFFFF

title [Nombre del Proceso desde User Story]

|[Rol de User Story]|
start
:[Acción Inicial];

if ([Condición de Decisión]?) then (yes)
  :[Acción en Resultado Positivo];
else (no)
  :[Acción en Resultado Negativo];
  stop
endif

|[Sistema/Otro Rol]|
:[Acción Automática o Delegada];

|[Rol de User Story]|
:[Acción Final];
end

@enduml


---

#### 4.5.7. Elementos del Diagrama

##### 4.5.7.1. Elementos Básicos:

###### 4.5.7.1.1. Inicio y Fin
plantuml
start                    // Punto de entrada único
end                      // Finalización normal
stop                     // Terminación de emergencia
kill                     // Terminación forzada
detach                   // Terminación asíncrona


###### 4.5.7.1.2. Actividades
plantuml
:Acción con verbo activo;
:Validar corrección de datos;
:Enviar notificación;
:[Acción entre corchetes para sistema];


**Reglas de Nomenclatura de Actividades:**
- Comenzar con un verbo activo en infinitivo
- Ser específico y medible
- Evitar detalles técnicos, enfocarse en lógica de negocio
- Longitud: 2-6 palabras

###### 4.5.7.1.3. Puntos de Decisión
plantuml
if (¿Datos válidos?) then (yes)
  :Continuar procesamiento;
else (no)
  :Devolver error de validación;
  stop
endif

// Múltiples opciones
switch (¿Tipo de usuario?)
case (Admin)
  :Mostrar panel de administración;
case (User)
  :Mostrar interfaz de usuario;
case (Guest)
  :Mostrar página de invitado;
endswitch


###### 4.5.7.1.4. Procesamiento Paralelo
plantuml
fork
  :Enviar correo electrónico;
fork again
  :Enviar SMS;
fork again
  :Escribir en registro de auditoría;
end fork

// Con sincronización
fork
  :Procesar pago;
fork again
  :Reservar producto;
end merge  // Esperar a que completen todas las ramas


###### 4.5.7.1.5. Bucles y Repeticiones
plantuml
// Bucle simple
repeat
  :Obtener siguiente elemento;
  :Procesar elemento;
repeat while (¿Existen más elementos?)

// Bucle while
while (¿Condición de continuación?)
  :Ejecutar acción;
endwhile

// Bucle for
repeat :i = 1;
  :Procesar elemento i;
  :i = i + 1;
repeat while (i <= ¿cantidad?)


---

#### 4.5.8. Construcciones de Control

##### 4.5.8.1. Ramificación Simple
plantuml
if (¿Usuario autenticado?) then (yes)
  :Mostrar datos personales;
else (no)
  :Redirigir a página de inicio de sesión;
  stop
endif


##### 4.5.8.2. Ramificación Múltiple
plantuml
switch (¿Estado del pedido?)
case (Nuevo)
  :Enviar para procesamiento;
case (En Proceso)
  :Continuar procesamiento;
case (Completado)
  :Enviar al cliente;
case (Cancelado)
  :Reembolsar pago;
  stop
endswitch


##### 4.5.8.3. Condiciones Anidadas
plantuml
if (¿Usuario autenticado?) then (yes)
  if (¿Tiene derechos de administrador?) then (yes)
    :Mostrar funciones de administración;
  else (no)
    :Mostrar interfaz regular;
  endif
else (no)
  :Mostrar formulario de inicio de sesión;
endif


##### 4.5.8.4. Manejo de Excepciones
plantuml
:Intentar realizar operación;
note right: Puede generar error

if (¿Operación exitosa?) then (yes)
  :Continuar ejecución;
else (no)
  if (¿Error crítico?) then (yes)
    :Registrar error;
    :Notificar al administrador;
    stop
  else (no)
    :Mostrar mensaje al usuario;
    :Ofrecer reintentar;
  endif
endif


---

#### 4.5.9. Manejo de Concurrencia

##### 4.5.9.1. Procesos Paralelos Independientes
plantuml
fork
  :Enviar notificación por correo electrónico;
fork again
  :Enviar notificación push;
fork again
  :Escribir en registro de auditoría;
end fork

:Continuar proceso principal;


##### 4.5.9.2. Procesos Sincronizados
plantuml
fork
  :Verificar disponibilidad de producto;
fork again
  :Verificar límite de crédito;
fork again
  :Verificar dirección de entrega;
end merge

if (¿Todas las verificaciones pasaron?) then (yes)
  :Crear pedido;
else (no)
  :Rechazar pedido;
  stop
endif


##### 4.5.9.3. Concurrencia Condicional
plantuml
if (¿Se requiere entrega exprés?) then (yes)
  fork
    :Reservar producto;
  fork again
    :Encontrar almacén más cercano;
  fork again
    :Preparar mensajero;
  end merge
else (no)
  :Procesamiento estándar de pedido;
endif


---

#### 4.5.10. التكامل مع القطع الأثرية

##### 4.5.10.1. الارتباط مع User Story:
- **الأدوار في swimlanes** = الأدوار من "As a [role]"
- **التدفق الرئيسي** = تنفيذ "I want to [action]"
- **نتيجة المخطط** = تحقيق "So that [benefit]"

##### 4.5.10.2. الارتباط مع Use Case:
- **التدفق الرئيسي لـ UC** = التسلسل الرئيسي للإجراءات
- **التدفقات البديلة لـ UC** = فروع else/case
- **استثناءات UC** = كتل معالجة الأخطاء
- **شروط UC المسبقة** = الشروط في بداية المخطط
- **شروط UC اللاحقة** = الحالات في نقاط النهاية

##### 4.5.10.3. الارتباط مع Business Rules:
- **قواعد اتخاذ القرار** = الشروط في if/switch
- **قيود الأعمال** = كتل التحقق
- **عمليات الموافقة** = تسلسلات في swimlanes المقابلة

##### 4.5.10.4. الارتباط مع القطع الأثرية التقنية:
- **مواصفات API** = الإجراءات الآلية
- **مخطط قاعدة البيانات** = إجراءات استمرارية البيانات
- **مخططات التسلسل** = تفصيل التفاعلات بين swimlanes

---

#### 4.5.11. الأنماط القياسية

##### 4.5.11.1. نمط "الطلب-المعالجة-الاستجابة"
plantuml
|المستخدم|
start
:إرسال طلب;

|النظام|
:استلام الطلب;
:التحقق من البيانات;

if (البيانات صالحة؟) then (yes)
  :معالجة الطلب;
  :تكوين الاستجابة;
else (no)
  :تكوين خطأ;
endif

|المستخدم|
:استلام الاستجابة;
end


##### 4.5.11.2. نمط "سير عمل الموافقة"
plantuml
|المبادر|
start
:إنشاء طلب;

|المدير|
:مراجعة الطلب;

if (الموافقة؟) then (yes)
  if (المبلغ > الحد؟) then (yes)
    |المدير التنفيذي|
    :الموافقة النهائية;
    
    if (الموافقة؟) then (yes)
      |النظام|
      :تنفيذ العملية;
    else (no)
      :الرفض;
      stop
    endif
  else (no)
    |النظام|
    :تنفيذ العملية;
  endif
else (no)
  :الرفض;
  stop
endif

|المبادر|
:استلام الإشعار;
end


##### 4.5.11.3. نمط "المعالجة الدفعية"
plantuml
|النظام|
start
:الحصول على قائمة العناصر;

repeat
  :أخذ العنصر التالي;
  
  fork
    :معالجة العنصر;
  fork again
    :تسجيل التقدم;
  end fork
  
repeat while (هل توجد عناصر غير معالجة؟)

:توليد التقرير;
:إرسال إشعار الإكمال;
end


##### 4.5.11.4. نمط "استعادة الخطأ"
plantuml
|النظام|
start
:retry_count = 0;

repeat
  :محاولة تنفيذ العملية;
  
  if (العملية ناجحة؟) then (yes)
    :تسجيل النتيجة;
    end
  else (no)
    :retry_count++;
    
    if (retry_count < max_retries؟) then (yes)
      :انتظار الفاصل;
    else (no)
      :تسجيل خطأ حرج;
      :إشعار المسؤول;
      stop
    endif
  endif
repeat while (retry_count < max_retries؟)


---

#### 4.5.12. Swimlanes والأدوار

##### 4.5.12.1. قواعد استخدام swimlanes:
1. **swimlane واحدة = دور/نظام واحد**
2. **الحد الأقصى 6 swimlanes** (للسهولة القراءة)
3. **الأدوار مأخوذة من User Story و Use Case**
4. **يتم فصل الأنظمة عن الأدوار البشرية**

##### 4.5.12.2. swimlanes القياسية:
plantuml
|المستخدم|        // الدور الرئيسي من User Story
|النظام|             // العمليات الآلية
|المسؤول|       // إجراءات الإدارة
|النظام الخارجي|     // التكاملات
|قاعدة البيانات|         // فقط للعمليات المعقدة


##### 4.5.12.3. الانتقالات بين swimlanes:
- نقل التحكم = الانتقال إلى إجراء في swimlane أخرى
- العمل المتوازي = fork مع إجراءات في swimlanes مختلفة
- المزامنة = دمج الإجراءات من swimlanes مختلفة

---

#### 4.5.13. الأخطاء الشائعة وكيفية تجنبها

##### 4.5.13.1. التفاصيل التقنية المفرطة
❌ **غير صحيح:**
plantuml
:تنفيذ استعلام SQL SELECT على جدول users;
:فك ترميز استجابة JSON;
:تحديث Redux store;


✅ **صحيح:**
plantuml
:الحصول على بيانات المستخدم;
:معالجة المعلومات المستلمة;
:تحديث العرض;


##### 4.5.13.2. خلط مستويات التجريد
❌ **غير صحيح:**
plantuml
:النقر على زر "إرسال";
:التحقق من صحة عنوان البريد الإلكتروني;
:إرسال طلب HTTP POST;
:عرض رسالة النجاح;


✅ **صحيح:**
plantuml
:بدء إرسال النموذج;
:التحقق من صحة البيانات;
:نقل البيانات إلى النظام;
:الإخطار بالنتيجة;


##### 4.5.13.3. عدم وجود معالجة الأخطاء
❌ **غير صحيح:**
plantuml
:إرسال طلب;
:استلام الرد;
:عرض النتيجة;


✅ **صحيح:**
plantuml
:إرسال طلب;

if (الطلب ناجح؟) then (yes)
  :عرض النتيجة;
else (no)
  :عرض رسالة خطأ;
endif


##### 4.5.13.4. الاستخدام غير الصحيح للتزامن
❌ **غير صحيح:** (إجراءات متسلسلة كمتوازية)
plantuml
fork
  :المصادقة;
fork again
  :الحصول على بيانات الملف الشخصي;
end fork


✅ **صحيح:**
plantuml
:المصادقة;

fork
  :إرسال بريد إلكتروني ترحيبي;
fork again
  :تسجيل حدث التدقيق;
end fork

:إعادة التوجيه إلى الصفحة الرئيسية;


---

#### 4.5.14. العناصر الخاصة

##### 4.5.14.1. الملاحظات والتعليقات
plantuml
:تنفيذ عملية معقدة;
note right
  هذه العملية قد تستغرق
  حتى 30 ثانية
end note

:إجراء آخر;
note left: عملية سريعة


##### 4.5.14.2. العمليات الفرعية المرتبطة
plantuml
:بدء عملية الموافقة;
note right: انظر المخطط المنفصل "عملية الموافقة"

:انتظار نتيجة الموافقة;


##### 4.5.14.3. نقاط الدخول/الخروج
plantuml
// نقاط دخول متعددة
start
:الدخول العادي;
end

(*) --> :الدخول الطارئ;


##### 4.5.14.4. القيود الزمنية
plantuml
:إرسال طلب;
:انتظار الرد لمدة 30 ثانية;

if (تم استلام الرد في الوقت المحدد؟) then (yes)
  :معالجة الرد;
else (no)
  :معالجة timeout;
  stop
endif


---

#### 4.5.15. Lista de Verificación de Calidad

##### 4.5.15.1. Verificación Estructural:
- [ ] El diagrama comienza con `@startuml` y termina con `@enduml`
- [ ] Hay un único punto `start`
- [ ] Todos los caminos conducen a `end`, `stop`, `kill` o `detach`
- [ ] Cada `if` tiene su `endif` correspondiente
- [ ] Cada `fork` tiene su `end fork` o `end merge` correspondiente
- [ ] Cada `repeat` tiene su `repeat while` correspondiente
- [ ] Todos los swimlanes tienen nombres significativos

##### 4.5.15.2. Verificación Semántica:
- [ ] El diagrama cubre el flujo principal del Use Case
- [ ] Los flujos alternativos del Use Case están representados
- [ ] Los roles en los swimlanes corresponden al User Story
- [ ] Cada acción comienza con un verbo activo
- [ ] Las decisiones se formulan como preguntas con opciones de respuesta claras
- [ ] El manejo de errores está presente para operaciones críticas
- [ ] Los procesos paralelos están identificados y modelados correctamente

##### 4.5.15.3. Verificación de Legibilidad:
- [ ] Número de swimlanes: 2-6
- [ ] Profundidad de anidamiento de condiciones: no más de 3 niveles
- [ ] Longitud de acciones: 2-6 palabras
- [ ] Los grupos lógicos de acciones se pueden distinguir visualmente
- [ ] El diagrama cabe en una página A4

##### 4.5.15.4. Verificación de Cumplimiento de Requisitos:
- [ ] Todos los pasos del Use Case están representados
- [ ] Las reglas de negocio se reflejan en las condiciones
- [ ] Los roles y responsabilidades están claramente separados
- [ ] Los puntos de decisión corresponden a la lógica de negocio
- [ ] El resultado del diagrama alcanza el objetivo del User Story

##### 4.5.15.5. Verificación Final:
- [ ] El diagrama se compila sin errores en PlantUML
- [ ] El título refleja la esencia del proceso
- [ ] El diseño visual cumple con los estándares
- [ ] El diagrama puede ser entendido por los interesados sin explicaciones adicionales

---

#### 4.5.16. Ejemplos de Diagramas Típicos

##### 4.5.16.1. Proceso Lineal Simple
plantuml
@startuml
title Proceso de Registro de Usuario

|Usuario|
start
:Llenar formulario de registro;
:Hacer clic en "Registrar";

|Sistema|
:Obtener datos del formulario;
:Validar datos;

if (¿Datos válidos?) then (yes)
  :Crear cuenta;
  :Enviar correo de confirmación;
  
  |Usuario|
  :Recibir correo;
  :Seguir enlace de confirmación;
  
  |Sistema|
  :Activar cuenta;
  :Redirigir a página principal;
  
  |Usuario|
  :Comenzar a trabajar con el sistema;
  end
else (no)
  |Usuario|
  :Ver mensajes de error;
  :Corregir datos;
  stop
endif

@enduml


##### 4.5.16.2. Proceso con Tareas Paralelas
plantuml
@startuml
title Procesamiento de Pedido

|Cliente|
start
:Agregar items al carrito;
:Proceder al pago;
:Especificar dirección de entrega;
:Seleccionar método de pago;

|Sistema|
fork
  :Calcular costo de entrega;
fork again
  :Verificar disponibilidad de items;
fork again
  :Validar datos de pago;
end merge

if (¿Todas las verificaciones exitosas?) then (yes)
  :Crear pedido;
  
  fork
    :Reservar items;
  fork again
    :Enviar notificación al vendedor;
  fork again
    :Iniciar proceso de pago;
  end fork
  
  |Cliente|
  :Recibir confirmación de pedido;
  end
else (no)
  :Mostrar errores;
  
  |Cliente|
  :Corregir datos del pedido;
  stop
endif

@enduml


Esta instrucción asegura la creación de diagramas de Actividad de alta calidad que reflejan con precisión los procesos de negocio y son fácilmente legibles por todos los interesados.

