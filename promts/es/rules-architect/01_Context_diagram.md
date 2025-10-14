### 4.3. [C4 level 1] Diagrama de Contexto (Context Diagram)
#### 4.3.1. Instrucción para Crear Diagrama de Contexto (C4 Level 1) en PlantUML
##### 4.3.1.1. Concepto y Propósito
**Diagrama de Contexto (Context Diagram)** — es el diagrama de nivel más alto (Level 1) en la notación C4. Muestra el sistema como un bloque completo y su interacción con el mundo exterior.
**Audiencia:** Todas las partes interesadas, incluyendo las no técnicas (clientes empresariales, gerentes).
**Propósito:** Responder a las preguntas: *"¿Qué hace el sistema?"*, *"¿Quién lo usa?"*, *"¿Con qué sistemas externos interactúa?"*
**Elementos Clave:** Sistema, personas/roles (actores), sistemas externos.
Prohibición de Especificar Tecnologías Utilizadas: Antes de diseñar diagramas, es necesario aclarar con el usuario la pila de tecnologías utilizadas en el proyecto; si el usuario no puede especificar la pila, excluir la indicación de la pila de tecnologías en todos los niveles de diagramas C4.
Si existe un archivo con el diagrama, es necesario preguntar al usuario si需要 actualizar el archivo actual o guardar el diagrama en un archivo con la siguiente versión.
##### 4.3.1.2. Sintaxis Básica de PlantUML para C4
Para usar la notación C4 en PlantUML, es necesario incluir la biblioteca correspondiente.
**Línea obligatoria al inicio del script:**
plantuml
@startuml
!include <C4/C4_Context>
' Tu código del diagrama aquí...
@enduml

##### 4.3.1.3. Elementos Básicos y su Declaración
###### 4.3.1.3.1. Sistema (System)
Elemento central del diagrama, que estamos diseñando.

System(alias, "label", "optional description")

*   `alias` - identificador único del elemento (latín, sin espacios).
*   `label` - nombre del sistema mostrado.
*   `description` - descripción breve opcional del propósito del sistema.

**Ejemplo:**
plantuml
System(system_a, "Sistema de Gestión de Pedidos", "Procesa pedidos de clientes, gestiona almacén y entrega")

###### 4.3.1.3.2. Actores (People/Person)
Personas o roles que interactúan con el sistema.

Person(alias, "label", "optional description")

*   `alias` - identificador único.
*   `label` - nombre del rol/persona mostrado.

**Ejemplo:**
plantuml
Person(customer, "Cliente", "Comprador de productos en la tienda online")
Person(admin, "Administrador", "Gestiona productos y rastrea pedidos")

###### 4.3.1.3.3. Sistemas Externos (External Systems)
Sistemas de software que están fuera del control de tu equipo pero con los que tu sistema interactúa.

System_Ext(alias, "label", "optional description")

*   `alias` - identificador único.
*   `label` - nombre del sistema externo mostrado.
**Ejemplo:**
plantuml
System_Ext(payment_gateway, "Pasarela de Pago", "Procesa pagos con tarjeta de crédito")
System_Ext(email_service, "Servicio de Notificaciones por Email", "Envía correos electrónicos a los clientes")

###### 4.3.1.3.4. Relaciones (Relationships)
Muestran la interacción entre elementos. Indican la naturaleza de la interacción.

**Sintaxis:**

Rel(from, to, "label", "technology")

*   `from`, `to` - alias de los elementos conectados.
*   `label` - descripción de la interacción (por ejemplo, "Compra productos", "Recibe notificaciones").
*   `technology` - indicación opcional de tecnología/protocolo (por ejemplo, "Web UI", "REST API"). *A menudo se omite en el diagrama de contexto.*

**Ejemplo:**
plantuml
Rel(customer, system_a, "Compra productos", "Web UI")
Rel(system_a, payment_gateway, "Inicia pago", "REST API")
Rel(system_a, email_service, "Envía datos para notificación", "SMTP")
Rel(admin, system_a, "Gestiona productos", "Web UI")

##### 4.3.1.4. Agrupación de Elementos (Boundaries)
Para resaltar visualmente el entorno interno y externo, se pueden usar límites.


Enterprise_Boundary(alias, "label") {
    ' Elementos dentro del límite empresarial
}


**Ejemplo:**
plantuml
Enterprise_Boundary(enterprise_a, "Nuestra Empresa") {
    Person(admin, "Administrador")
    System(system_a, "Sistema de Gestión de Pedidos")
}
Enterprise_Boundary(enterprise_b, "Socio") {
    System_Ext(payment_gateway, "Pasarela de Pago")
}

##### 4.3.1.5. Leyenda (Legend)
Para documentación oficial, se recomienda añadir una leyenda.


SHOW_LEGEND()

##### 4.3.1.6. Ejemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Context>

Title Diagrama de Contexto - Sistema de Gestión de Pedidos

Person(customer, "Cliente", "Compra productos en la tienda online")
Person(admin, "Administrador", "Gestiona catálogo y pedidos")

System(system_a, "Sistema de Gestión de Pedidos", "Acepta y procesa pedidos, gestiona almacén")

System_Ext(payment_gateway, "Pasarela de Pago", "Procesa pagos con tarjeta")
System_Ext(email_service, "Servicio de Email", "Envía notificaciones a clientes")
System_Ext(erp_system, "Sistema ERP", "Recibe datos para contabilidad")

Rel(customer, system_a, "Visualiza catálogo, compra productos")
Rel(admin, system_a, "Gestiona productos y rastrea pedidos")
Rel(system_a, payment_gateway, "Inicia pago", "REST API")
Rel(system_a, email_service, "Envía datos para notificaciones", "SMTP")
Rel(system_a, erp_system, "Exporta datos de ventas", "SFTP")

SHOW_LEGEND()

@enduml

##### 4.3.1.7. Lista de Verificación de Calidad del Diagrama
Antes de guardar, verifica el diagrama:
1.  [ ] **Se incluyó la directiva** `!include <C4/C4_Context>`
2.  [ ] **Hay un título claro** (`Title`).
3.  [ ] **Solo un sistema central** (el que estás diseñando).
4.  [ ] **Se muestran todos los usuarios clave** (actores) y **sistemas externos**.
5.  [ ] **Las relaciones** están etiquetadas en un lenguaje empresarial claro (qué hacen, no cómo se implementan técnicamente).
6.  [ ] **No hay detalles técnicos** de la estructura interna del sistema (esta es la tarea del diagrama de contenedores).
7.  [ ] **Los alias** de los elementos son únicos y están escritos en latín.
8.  [ ] **Se añadió la leyenda** (`SHOW_LEGEND()`) para artefactos oficiales.
9.  [ ] **Después de guardar el archivo** Pregunta al usuario qué otros documentos necesitan generarse o ajustarse, proporcionándole una lista.
**Formato del nombre del archivo:** `c4_Level_1_context_diagram_[NombreProyecto]_v[número de versión (comenzando desde 1)].plantuml`
#### 4.3.2 Métricas de Calidad
1. Integridad:
   * Están presentes todos los actores clave
   * Se reflejan las integraciones principales
2. Coherencia:
   * Los nombres coinciden con otros artefactos
   * No hay contradicciones con la realidad
3. Actualidad:
   * Se especifica la versión del diagrama
   * Hay fecha de última actualización
#### 4.3.3 Integración con Otros Artefactos
1. Con User Story:
   * Los actores deben estar coordinados
   * Se reflejan los escenarios principales
2. Con Component Diagram:
   * Los sistemas externos se duplican
   * El nivel de detalle está coordinado
3. Con ERD:
   * Las BD externas corresponden a las entidades

