### 4.6. Especificación en formato OpenAPI
**Instrucciones para escribir especificación OpenAPI para agente de IA**

#### 4.6.1. Contenido
1. [Bases de estructura](#bases-de-estructura)
2. [Métricas de calidad](#métricas-de-calidad)
3. [Reglas de validación](#reglas-de-validación)
4. [Secciones obligatorias](#secciones-obligatorias)
5. [Descripción de endpoints](#descripción-de-endpoints)
6. [Componentes y esquemas](#componentes-y-esquemas)
7. [Mejores prácticas](#mejores-prácticas)
8. [Lista de verificación de calidad](#lista-de-verificación-de-calidad)

---

#### 4.6.2. Bases de estructura

##### 4.6.2.1. Estructura mínima de archivo:
yaml
openapi: 3.0.3
info:
  title: Nombre de API
  description: Descripción del propósito y características de API
  version: '1.0.0'
servers:
  - url: https://api.example.com/v1
    description: Servidor de producción
tags:
  - name: users
    description: Operaciones de usuario
paths: {}
components:
  schemas: {}


---

#### 4.6.3. Métricas de calidad

##### 4.6.3.1. Indicadores objetivo:
- **Completitud CRUD**: 100% cobertura de operaciones Create, Read, Update, Delete
- **Documentación**: todos los endpoints tienen description y examples
- **Validez**: corrección sintáctica YAML/JSON
- **Esquemas de datos**: 95% reutilización mediante components

##### 4.6.3.2. Sistema de puntuación:
- **Calidad excelente**: CRUD + documentación + validez = ≥90%
- **Buena calidad**: CRUD parcial + documentación = 70-89%
- **Requiere mejora**: funcionalidad básica = <70%

---

#### 4.6.4. Reglas de validación

##### 4.6.4.1 Comprobaciones automáticas:

✓ versión openapi 3.0.0 o superior
✓ info contiene title, version, description
✓ servers especificados con URL y description
✓ todos los paths tienen operaciones (get, post, put, delete)
✓ responses contienen mínimo 200 y 400/500 códigos
✓ schemas usan $ref para reutilización
✓ parameters tienen description y schema
✓ requestBody contiene content con schema


---

#### 4.6.5. Secciones obligatorias

##### 4.6.5.1. info - información del proyecto
yaml
info:
  title: User Management API
  description: |
    REST API para gestión de usuarios en el sistema.
    Soporta CRUD completo para usuarios y roles.
  version: '1.0.0'
  contact:
    name: Soporte API
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT


##### 4.6.5.2. servers - servidores de API
yaml
servers:
  - url: https://api.example.com/v1
    description: Servidor de producción
  - url: https://staging-api.example.com/v1
    description: Servidor de staging


##### 4.6.5.3. tags - agrupación de operaciones
yaml
tags:
  - name: users
    description: Gestión de usuarios
  - name: auth
    description: Autenticación y autorización


---

#### 4.6.6. Descripción de endpoints

##### 4.6.6.1. Estructura de operación:
yaml
/users/{id}:
  get:
    tags: [users]
    summary: Obtener usuario por ID
    description: Retorna información detallada del usuario
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Identificador único de usuario
    responses:
      '200':
        description: Usuario encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              id: 1
              email: "user@example.com"
              name: "John Doe"
      '404':
        description: Usuario no encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'


##### 4.6.6.2. Elementos obligatorios de operación:
- **tags**: agrupación por funcionalidad
- **summary**: descripción breve (hasta 50 caracteres)
- **description**: descripción detallada
- **parameters**: descripción de todos los parámetros
- **responses**: mínimo 200 y códigos de error
- **examples**: ejemplos de solicitud y respuesta

---

#### 4.6.7. Componentes y esquemas

##### 4.6.7.1. Esquemas reutilizables:
yaml
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: integer
          description: Identificador único
          example: 1
        email:
          type: string
          format: email
          description: Email del usuario
          example: "user@example.com"
        name:
          type: string
          description: Nombre completo del usuario
          example: "John Doe"
        created_at:
          type: string
          format: date-time
          description: Fecha de creación
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
          description: Código de error
        message:
          type: string
          description: Descripción del error
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: Número de página para paginación
  
  responses:
    NotFound:
      description: Recurso no encontrado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'


---

#### 4.6.8. Mejores prácticas

##### 4.6.8.1. Nomenclatura y estructura
- **Rutas**: usar kebab-case (`/user-profiles`)
- **Esquemas**: usar PascalCase (`UserProfile`)
- **Parámetros**: usar snake_case (`user_id`)
- **Operaciones**: agrupar lógicamente por tags

##### 4.6.8.2. Códigos de estado
| Operación | Éxito | Error cliente | Error servidor |
|----------|--------|----------------|----------------|
| **GET** | 200 | 404, 400 | 500 |
| **POST** | 201 | 400, 409 | 500 |
| **PUT** | 200 | 400, 404 | 500 |
| **DELETE** | 204 | 404 | 500 |

##### 4.6.8.3. Validación de datos
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


##### 4.6.8.4. Ejemplos y documentación
- Añadir `example` para cada campo
- Usar `description` para todos los elementos
- Incluir ejemplos realistas de solicitud/respuesta
- Documentar lógica de negocio en `description`

---

#### 4.6.9. Ejemplo completo de API

yaml
openapi: 3.0.3
info:
  title: User Management API
  description: REST API para gestión de usuarios
  version: '1.0.0'

servers:
  - url: https://api.example.com/v1
    description: Servidor de producción

tags:
  - name: users
    description: Operaciones de usuario

paths:
  /users:
    get:
      tags: [users]
      summary: Obtener lista de usuarios
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
          description: Número de usuarios por página
      responses:
        '200':
          description: Lista de usuarios
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
      summary: Crear usuario
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: Usuario creado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      tags: [users]
      summary: Obtener usuario
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Usuario encontrado
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
      description: Número de página
  
  responses:
    BadRequest:
      description: Solicitud incorrecta
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
    
    NotFound:
      description: Recurso no encontrado
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string


---

#### 4.6.10. Lista de verificación de calidad

##### 4.6.10.1. Verificación estructural:
- [ ] ✅ versión openapi 3.0.0+
- [ ] ✅ info contiene title, version, description
- [ ] ✅ servers especificados con description
- [ ] ✅ tags definidas para agrupación

##### 4.6.10.2. Verificación de endpoints:
- [ ] ✅ Todas las operaciones CRUD descritas
- [ ] ✅ Cada operación tiene summary y description
- [ ] ✅ parameters contienen schema y description
- [ ] ✅ responses cubren casos de éxito y error

##### 4.6.10.3. Verificación de esquemas:
- [ ] ✅ Esquemas movidos a components para reutilización
- [ ] ✅ Campos obligatorios especificados en required
- [ ] ✅ Tipos de datos y formatos correctos
- [ ] ✅ examples añadidos para campos

##### 4.6.10.4. Verificación de calidad:
- [ ] 🎯 Todas las operaciones de negocio cubiertas
- [ ] 🎯 Validación corresponde a reglas de negocio
- [ ] 🎯 Códigos de error lógicamente justificados
- [ ] 🎯 Documentación comprensible para desarrolladores

##### 4.6.10.5. Verificación de integración:
- [ ] 🔗 API corresponde a arquitectura del sistema
- [ ] 🔗 Esquemas de datos corresponden a ERD
- [ ] 🔗 Operaciones cubren escenarios Use Case

**Objetivo**: Crear especificaciones OpenAPI listas para generación de código cliente y documentación.

---

#### 4.6.11. Recomendaciones de validación

##### 4.6.11.1. Herramientas de verificación:
- [Swagger Editor](https://editor.swagger.io/) - validador online
- OpenAPI Generator - generación de código
- Spectral - linter para OpenAPI

##### 4.6.11.2. Ejemplos de documentación de calidad:
✅ "Retorna lista de usuarios con paginación"  
✅ "Crea nuevo usuario con validación de email"  
✅ "Error 409 por duplicación de email"  

❌ "Obtiene datos"  
❌ "Crea objeto"  
❌ "Retorna error"


