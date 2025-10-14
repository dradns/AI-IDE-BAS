### 4.5. [C4 Level 3] Diagrama de Componentes (Component Diagram)
#### 4.5.1. Instrucción para Crear Diagrama de Componentes (C4 Level 3) en PlantUML
##### 4.5.1.1. Concepto y Propósito

**Diagrama de Componentes (Component Diagram)** — es el diagrama de tercer nivel en la notación C4. Detalla cada uno de los **contenedores** (del diagrama de contenedores), mostrando de qué componentes lógicos (módulos, servicios) consiste y cómo interactúan dentro de él.

En caso de que se solicite dibujar un diagrama de componentes, es necesario solicitar al usuario para qué contenedores se necesitan diagramas de componentes (dándole la opción de elegir).

Prohibición de Especificar Tecnologías Utilizadas: Antes de diseñar diagramas, es necesario aclarar con el usuario la pila de tecnologías utilizadas en el proyecto; si el usuario no puede especificar la pila, excluir la indicación de la pila de tecnologías en todos los niveles de diagramas C4

*   **Audiencia:** Desarrolladores, arquitectos.
*   **Propósito:** Responder a las preguntas: *"¿Cómo está estructurado el contenedor internamente?"*, *"¿De qué componentes consiste?"*, *"¿Cómo interactúan estos componentes entre sí?"*
*   **Elementos Clave:** Componentes, interfaces (API), relaciones entre ellos.

Si existe un archivo con el diagrama, es necesario preguntar al usuario si需要 actualizar el archivo actual o guardar el diagrama en un archivo con la siguiente versión.

Durante la creación del diagrama, aplicar el principio KISS (Keep It Simple, Stupid o Keep It Short and Simple) - este es un principio fundamental de diseño y desarrollo, según el cual la mayoría de los sistemas funcionan mejor cuando se mantienen simples, en lugar de complicarse innecesariamente.
##### 4.5.1.2. Sintaxis Básica de PlantUML para C4


Para usar la notación C4 en PlantUML, es necesario incluir la biblioteca correspondiente.
El diagrama debe cumplir con la sintaxis especificada en https://github.com/plantuml-stdlib/C4-PlantUML


Preguntar al usuario para qué contenedores es necesario dibujar un diagrama de componentes tomando la lista de contenedores del diagrama de contenedores (si está creado), si no está creado, crearlo.


**Línea obligatoria al inicio del script:**
plantuml
@startuml
!include <C4/C4_Component>
' Tu código del diagrama aquí...
@enduml

##### 4.5.1.3. Elementos Básicos y su Declaración
###### 4.5.1.3.1. Contenedor (Container)
Elemento de nivel superior que estamos detallando. Debe declararse en el diagrama de contenedores.


Container(alias, "label", "technology", "optional description")


###### 4.5.1.3.2. Componentes (Components)
Bloques de construcción principales del diagrama. Son módulos, servicios o bibliotecas agrupados lógicamente dentro del contenedor.

**Sintaxis de Declaración:**

Component(alias, "label", "technology", "optional description")

*   `alias` - identificador único del elemento (latín, sin espacios).
*   `label` - nombre del componente mostrado.
*   `technology` - indicación de tecnología (por ejemplo, "Java Class", "REST Controller", "Spring Service").
*   `description` - descripción opcional de la responsabilidad del componente.

**Ejemplo:**
plantuml
Component(controller, "OrderController", "Spring REST Controller", "Maneja solicitudes HTTP relacionadas con pedidos")
Component(service, "OrderService", "Spring Service", "Encapsula la lógica de negocio del procesamiento de pedidos")
Component(repository, "OrderRepository", "JPA Repository", "Proporciona persistencia de datos del pedido")


###### 4.5.1.3.3. Interfaces (Interfaces)
Muestran cómo los componentes proporcionan funcionalidad entre sí o al mundo exterior (por ejemplo, API).

**Sintaxis:**

Rel_U(to, from, "interface label", "technology")

*   `to`, `from` - alias de los elementos conectados.
*   `interface label` - nombre de la interfaz/API (por ejemplo, "getOrderById").
*   `technology` - tecnología/protocolo (por ejemplo, "REST", "Java Interface").

**Ejemplo:**
plantuml
Rel_U(controller, service, "Order API", "Java Interface")


###### 4.5.1.3.4. Relaciones (Relationships)
Muestran la interacción entre componentes. Indican la naturaleza de la interacción.

**Sintaxis:**

Rel(from, to, "label", "technology")

*   `from`, `to` - alias de los elementos conectados.
*   `label` - descripción de la interacción (por ejemplo, "llama", "utiliza").
*   `technology` - tecnología/protocolo (por ejemplo, "method call", "REST").

**Ejemplo:**
plantuml
Rel(service, repository, "utiliza", "JPA")


###### 4.5.1.3.5. Bases de Datos y Dependencias Externas
Para mostrar la interacción con BD o servicios externos dentro del contenedor.


ContainerDb(alias, "label", "technology", "optional description")


**Ejemplo:**
plantuml
ContainerDb(database, "Base de Datos de Pedidos", "PostgreSQL", "Almacena datos de pedidos")


##### 4.5.1.4. Agrupación de Componentes
Para organizar visualmente los componentes por responsabilidades o capas.


Boundary(alias, "label") {
    Component(component1, "Component1")
    Component(component2, "Component2")
}


**Ejemplo:**
plantuml
Boundary(web_layer, "Capa Web") {
    Component(controller, "OrderController")
}
Boundary(service_layer, "Capa de Servicio") {
    Component(service, "OrderService")
}
Boundary(persistence_layer, "Capa de Persistencia") {
    Component(repository, "OrderRepository")
}


##### 4.5.1.5. Leyenda (Legend)
Para documentación oficial, se recomienda añadir una leyenda.


SHOW_LEGEND()


##### 4.5.1.6. Ejemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Component>

Title Diagrama de Componentes - Backend API (microservicio de pedidos)

Container(api, "Order Service", "Spring Boot", "Microservicio para gestión de pedidos")

Boundary(api_boundary, "Componentes del Order Service") {
    Component(order_controller, "OrderController", "REST Controller", "Maneja solicitudes HTTP")
    Component(order_service, "OrderService", "Spring Service", "Lógica de negocio de pedidos")
    Component(order_repository, "OrderRepository", "JPA Repository", "Acceso a datos")
    Component(inventory_client, "InventoryClient", "Feign Client", "Llamada al servicio inventory")
    Component(notification_service, "NotificationService", "Spring Service", "Envío de notificaciones")
}

ContainerDb(order_db, "Base de Datos de Pedidos", "PostgreSQL", "Almacenamiento de pedidos")
System_Ext(inventory_service, "Inventory Service", "Servicio de gestión de inventario")
System_Ext(email_service, "Email Service", "Servicio de envío de email")

Rel(order_controller, order_service, "llama", "Java Interface")
Rel(order_service, order_repository, "utiliza", "JPA")
Rel(order_service, inventory_client, "verifica disponibilidad", "REST")
Rel(order_service, notification_service, "solicita notificación", "Java Interface")
Rel(order_repository, order_db, "guarda en", "JDBC")
Rel(inventory_client, inventory_service, "llama a la API", "HTTP/REST")
Rel(notification_service, email_service, "envía solicitud", "SMTP")

SHOW_LEGEND()

@enduml


##### 4.5.1.7. Lista de Verificación de Calidad del Diagrama
Antes de guardar, verifica el diagrama:
1.  [ ] **Se incluyó la directiva** `!include <C4/C4_Component>`
2.  [ ] **Hay un título claro** (`Title`) con indicación del contenedor detallado.
3.  [ ] **Todas las relaciones** están etiquetadas (qué acción se realiza).
4.  [ ] **Se muestran las interfaces clave** entre componentes.
5.  [ ] **No hay detalles excesivos** (no es necesario mostrar todos los métodos y clases).
6.  [ ] **Los alias** Los elementos son únicos y están escritos en latín con la traducción al español entre paréntesis.
7.  [ ] **Se añadió la leyenda** (`SHOW_LEGEND()`) para artefactos oficiales.
8.  [ ] **Sintaxis** Calidad de diagramas PlantUML en notación C4: Los diagramas no deben contradecir la sintaxis especificada en https://github.com/plantuml-stdlib/C4-PlantUML
9.  [ ] Preguntar al usuario para qué otros contenedores es necesario dibujar un diagrama de componentes
10. [ ] **Al finalizar** Pregunta al usuario qué otros documentos necesitan generarse o ajustarse, proporcionándole una lista.

**Formato del nombre del archivo:** `c4_Level_3_component_diagram_[NombreProyecto]_([NombreContenedor])_v[número de versión (comenzando desde 1)].plantuml`

