### 4.4. [C4 Level 2] Diagrama de Contenedores (Container Diagram)
#### 4.4.1. Instrucción para Crear Diagramas de Contenedores (C4 Level 2) en PlantUML

##### 4.4.1.1. Concepto y Propósito
**Diagrama de Contenedores (Container Diagram)** — es el diagrama de segundo nivel en la notación C4. Detalla el **sistema** (del diagrama de contexto), mostrando de qué grandes unidades ejecutables (contenedores) consiste y cómo interactúan.

*   **Audiencia:** Desarrolladores, ingenieros DevOps, arquitectos.
*   **Propósito:** Responder a las preguntas: *"¿Cómo funciona el sistema internamente?"*, *"¿De qué componentes grandes consiste?"*, *"¿Cómo se comunican?"*.
*   **Elementos Clave:** Contenedores (aplicaciones, BD), relaciones entre ellos y tecnologías clave.

Prohibición de Especificar Tecnologías Utilizadas: Antes de diseñar diagramas, es necesario aclarar con el usuario la pila de tecnologías utilizadas en el proyecto; si el usuario no puede especificar la pila, excluir la indicación de la pila de tecnologías en todos los niveles de diagramas C4.

Si existe un archivo con el diagrama, es necesario preguntar al usuario si需要 actualizar el archivo actual o guardar el diagrama en un archivo con la siguiente versión.
##### 4.4.1.2. Sintaxis Básica de PlantUML para C4

Para usar la notación C4 en PlantUML, es necesario incluir la biblioteca correspondiente.
El diagrama debe cumplir con la sintaxis especificada en https://github.com/plantuml-stdlib/C4-PlantUML

**Línea obligatoria al inicio del script:**
plantuml
@startuml
!include <C4/C4_Container>
' Tu código del diagrama aquí...
@enduml


##### 4.4.1.3. Elementos Básicos y su Declaración

##### 4.4.1.3.1. Sistema (Aclaración del Contexto)
Elemento de nivel superior que estamos detallando.


System(alias, "label", "optional description")

*   `alias` - identificador único del elemento (latín, sin espacios).
*   `label` - nombre mostrado.
*   `description` - descripción opcional.

**Ejemplo:**
plantuml
System(online_banking, "Banca Online", "Proporciona a los clientes acceso a sus cuentas y transacciones a través de web y móvil")


##### 4.4.1.3.2. Contenedores (Containers)
Bloques de construcción principales del diagrama. Son procesos/aplicaciones ejecutables o almacenes de datos.

**Sintaxis de Declaración:**

Container(alias, "label", "technology", "optional description")

*   `technology` - indicación de tecnología (por ejemplo, "React", "Spring Boot", "PostgreSQL").

**Tipos de Contenedores:**
*   `Container()` - contenedor universal (aplicación, servicio).
*   `ContainerDb()` - contenedor para base de datos.
*   `ContainerQueue()` - contenedor para cola de mensajes (broker).
*   `Container_Ext()` - contenedor externo (gestionado por terceros).

**Ejemplos:**
plantuml
Container(spa, "Aplicación Web", "Single-Page Application para clientes")
ContainerDb(db, "Base de Datos", "Almacena todos los datos financieros e inicios de sesión de usuarios")
Container(backend_api, "Backend API", "Proporciona REST API para clientes web y móviles")
Container_Ext(email_service, "Servicio de Email", "Servicio externo para enviar notificaciones")


##### 4.4.1.3.3. Relaciones (Relationships)
Muestran la interacción entre contenedores. Indican el protocolo o tecnología de interacción.

**Sintaxis:**

Rel(from, to, "label", "technology")

*   `from`, `to` - alias de los elementos conectados.
*   `label` - descripción de la interacción (por ejemplo, "Lee/Escribe").
*   `technology` - tecnología/protocolo (por ejemplo, "REST API", "JDBC", "Kafka").

**Ejemplo:**
plantuml
Rel(spa, backend_api, "Llama a la API")
Rel(backend_api, db, "Lee/escribe")
Rel(backend_api, email_service, "Envía notificaciones")


#### 4.4.1.4. Agrupación y Límites (Boundaries)
Para resaltar visualmente partes del sistema que pertenecen a diferentes dominios o equipos, use límites.

**Sintaxis:**

Boundary(alias, "label") {
    container1 = Container(...)
    container2 = Container(...)
    Rel(container1, container2, ...)
}


**Ejemplo:**
plantuml
Boundary(boundary_backend, "Dominio Backend") {
    Container(api_gateway, "API Gateway")
    Container(user_service, "User Service")
    Container(account_service, "Account Service")
    Rel(api_gateway, user_service, "Llama")
    Rel(api_gateway, account_service, "Llama")
}


#### 4.4.1.5. Leyenda (Legend)
Para documentación oficial, se recomienda añadir una leyenda que explique los elementos del diagrama.


SHOW_LEGEND()


#### 4.4.1.6. Ejemplo Completo de Diagrama

plantuml
@startuml
!include <C4/C4_Container>

Title "Diagrama de Contenedores - Sistema de Banca Online"

Person(customer, "Cliente", "Utiliza la banca online")

System_Boundary(online_banking_system, "Banca Online") {
    Container(spa, "Aplicación Web","Single-Page Application")
    Container(mobile_app, "Aplicación Móvil","Aplicación móvil nativa")
    Container(backend_api, "Backend API", "Servicio principal de lógica de negocio")
    ContainerDb(db, "Base de Datos",  "Almacena datos de usuarios y transacciones")
}

System_Ext(processing_system, "Sistema de Pagos", "Sistema externo para procesamiento de pagos")

Rel(customer, spa, "Visita el sitio web")
Rel(customer, mobile_app, "Utiliza la aplicación")
Rel(spa, backend_api, "Llama a la API")
Rel(mobile_app, backend_api, "Llama a la API")
Rel(backend_api, db, "Lee/escribe")
Rel(backend_api, processing_system, "Envía solicitud de pago")

SHOW_LEGEND()
@enduml


#### 4.4.1.7. Lista de Verificación de Calidad del Diagrama
Antes de guardar, verifica el diagrama:
1.  [ ] **Se incluyó la directiva** `!include <C4/C4_Container>`
2.  [ ] **Roles** Todos los roles de usuario especificados en otros archivos deben tenerse en cuenta en este diagrama.
3.  [ ] **Hay un título claro** (`Title`).
4.  [ ] **Todos los contenedores** No tienen indicación de tecnología.
5.  [ ] **Todas las relaciones** están etiquetadas (qué acción se realiza sin indicación de protocolo).
6.  [ ] **No hay detalles excesivos** (no es necesario mostrar todos los microservicios si hay docenas).
7.  [ ] **Los alias** de los elementos son únicos y están escritos en latín.
8.  [ ] **Se añadió la leyenda** (`SHOW_LEGEND()`) para artefactos oficiales.
9.  [ ] **En caso de arquitectura de microservicios:** Para un servicio no es admisible la creación de más de dos bases de datos del mismo tipo.
10. [ ] **Prohibición de Especificar Tecnologías Utilizadas:** Antes de diseñar diagramas, es necesario aclarar con el usuario la pila de tecnologías utilizadas en el proyecto; si el usuario no puede especificar la pila, excluir la indicación de la pila de tecnologías en todos los niveles de diagramas C4.
11. [ ] **Verificación de roles de usuario** El diagrama debe indicar todos los roles de usuario que están en el diagrama de contexto (C4 Level 1).
12. [ ] **Al finalizar** Pregunta al usuario qué otros documentos necesitan generarse o ajustarse, proporcionándole una lista.

**Formato del nombre del archivo:** `c4_Level_2_containers_diagram_[NombreProyecto]_v[número de versión (comenzando desde 1)].plantuml`

