### 4.6. Especificação em Formato OpenAPI
**Instruções para escrever especificação OpenAPI para agente de IA**

#### 4.6.1. Conteúdo
1. [Básicos de estrutura](#básicos-de-estrutura)
2. [Métricas de qualidade](#métricas-de-qualidade)
3. [Regras de validação](#regras-de-validação)
4. [Seções obrigatórias](#seções-obrigatórias)
5. [Descrição de endpoint](#descrição-de-endpoint)
6. [Componentes e schemas](#componentes-e-schemas)
7. [Melhores práticas](#melhores-práticas)
8. [Checklist de qualidade](#checklist-de-qualidade)

---

#### 4.6.2. Básicos de estrutura

##### 4.6.2.1. Estrutura mínima de arquivo:
yaml
openapi: 3.0.3
info:
  title: Nome da API
  description: Descrição do propósito e funcionalidades da API
  version: '1.0.0'
servers:
  - url: https://api.example.com/v1
    description: Servidor de produção
tags:
  - name: users
    description: Operações de usuários
paths: {}
components:
  schemas: {}


---

#### 4.6.3. Métricas de qualidade

##### 4.6.3.1. Indicadores alvo:
- **Completude CRUD**: 100% de cobertura de operações Create, Read, Update, Delete
- **Documentação**: todos endpoints têm descrição e exemplos
- **Validade**: correção sintática YAML/JSON
- **Schemas de dados**: 95% de reuso através de components

##### 4.6.3.2. Sistema de pontuação:
- **Excelente qualidade**: CRUD + documentação + validade = ≥90%
- **Boa qualidade**: CRUD parcial + documentação = 70-89%
- **Precisa melhorar**: funcionalidade básica = <70%

---

#### 4.6.4. Regras de validação

##### 4.6.4.1 Verificações automáticas:

✓ versão openapi 3.0.0 ou superior
✓ info contém title, version, description
✓ servers especificado com URL e descrição
✓ todos os paths têm operações (get, post, put, delete)
✓ responses contêm mínimo 200 e códigos 400/500
✓ schemas usam $ref para reuso
✓ parameters têm description e schema
✓ requestBody contém content com schema


---

#### 4.6.5. Seções obrigatórias

##### 4.6.5.1. info - informação do projeto
yaml
info:
  title: API de Gestão de Usuários
  description: |
    API REST para gestão de usuários no sistema.
    Suporta CRUD completo para usuários e papéis.
  version: '1.0.0'
  contact:
    name: Suporte da API
    email: suporte@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT


##### 4.6.5.2. servers - servidores da API
yaml
servers:
  - url: https://api.example.com/v1
    description: Servidor de produção
  - url: https://staging-api.example.com/v1
    description: Servidor de staging


##### 4.6.5.3. tags - agrupamento de operações
yaml
tags:
  - name: users
    description: Gestão de usuários
  - name: auth
    description: Autenticação e autorização


---

#### 4.6.6. Descrição de endpoint

##### 4.6.6.1. Estrutura de operação:
yaml
/users/{id}:
  get:
    tags: [users]
    summary: Obter usuário por ID
    description: Retorna informações detalhadas do usuário
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Identificador único do usuário
    responses:
      '200':
        description: Usuário encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              id: 1
              email: "user@example.com"
              name: "João Silva"
      '404':
        description: Usuário não encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'


##### 4.6.6.2. Elementos obrigatórios de operação:
- **tags**: agrupamento por funcionalidade
- **summary**: descrição breve (até 50 caracteres)
- **description**: descrição detalhada
- **parameters**: descrição de todos os parâmetros
- **responses**: mínimo 200 e códigos de erro
- **examples**: exemplos de requisição e resposta

---

#### 4.6.7. Componentes e schemas

##### 4.6.7.1. Schemas reutilizáveis:
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
          description: Email do usuário
          example: "user@example.com"
        name:
          type: string
          description: Nome completo do usuário
          example: "João Silva"
        created_at:
          type: string
          format: date-time
          description: Data de criação
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
          description: Código do erro
        message:
          type: string
          description: Descrição do erro
  
  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
      description: Número da página para paginação
  
  responses:
    NotFound:
      description: Recurso não encontrado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'


---

#### 4.6.8. Melhores práticas

##### 4.6.8.1. Nomenclatura e estrutura
- **Paths**: use kebab-case (`/user-profiles`)
- **Schemas**: use PascalCase (`UserProfile`)
- **Parameters**: use snake_case (`user_id`)
- **Operações**: agrupe logicamente por tags

##### 4.6.8.2. Códigos de status
| Operação | Sucesso | Erro do cliente | Erro do servidor |
|----------|--------|----------------|----------------|
| **GET** | 200 | 404, 400 | 500 |
| **POST** | 201 | 400, 409 | 500 |
| **PUT** | 200 | 400, 404 | 500 |
| **DELETE** | 204 | 404 | 500 |

##### 4.6.8.3. Validação de dados
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


##### 4.6.8.4. Exemplos e documentação
- Adicione `example` para cada campo
- Use `description` para todos os elementos
- Inclua exemplos realistas de requisição/resposta
- Documente lógica de negócio em `description`

---

#### 4.6.9. Exemplo completo de API

yaml
openapi: 3.0.3
info:
  title: API de Gestão de Usuários
  description: API REST para gestão de usuários
  version: '1.0.0'

servers:
  - url: https://api.example.com/v1
    description: Servidor de produção

tags:
  - name: users
    description: Operações de usuários

paths:
  /users:
    get:
      tags: [users]
      summary: Obter lista de usuários
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
          description: Número de usuários por página
      responses:
        '200':
          description: Lista de usuários
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
      summary: Criar usuário
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: Usuário criado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      tags: [users]
      summary: Obter usuário
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Usuário encontrado
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
          example: "João Silva"
    
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
      description: Número da página
  
  responses:
    BadRequest:
      description: Requisição inválida
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
    
    NotFound:
      description: Recurso não encontrado
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string


---

#### 4.6.10. Checklist de qualidade

##### 4.6.10.1. Verificação estrutural:
- [ ] ✅ versão openapi 3.0.0+
- [ ] ✅ info contém title, version, description
- [ ] ✅ servers especificado com descrição
- [ ] ✅ tags definidas para agrupamento

##### 4.6.10.2. Verificação de endpoint:
- [ ] ✅ Todas as operações CRUD descritas
- [ ] ✅ Cada operação tem summary e description
- [ ] ✅ parameters contêm schema e description
- [ ] ✅ responses cobrem casos de sucesso e erro

##### 4.6.10.3. Verificação de schema:
- [ ] ✅ Schemas movidos para components para reuso
- [ ] ✅ Campos obrigatórios especificados em required
- [ ] ✅ Tipos e formatos de dados corretos
- [ ] ✅ examples adicionados para campos

##### 4.6.10.4. Verificação de qualidade:
- [ ] 🎯 Todas as operações de negócio cobertas
- [ ] 🎯 Validação corresponde a regras de negócio
- [ ] 🎯 Códigos de erro logicamente justificados
- [ ] 🎯 Documentação compreensível para desenvolvedores

##### 4.6.10.5. Verificação de integração:
- [ ] 🔗 API corresponde à arquitetura do sistema
- [ ] 🔗 Schemas de dados correspondem ao ERD
- [ ] 🔗 Operações cobrem cenários de Use Case

**Objetivo**: Criar especificações OpenAPI prontas para geração de código cliente e documentação.

---

#### 4.6.11. Recomendações de validação

##### 4.6.11.1. Ferramentas de verificação:
- [Swagger Editor](https://editor.swagger.io/) - validador online
- OpenAPI Generator - geração de código
- Spectral - linter para OpenAPI

##### 4.6.11.2. Exemplos de documentação de qualidade:
✅ "Retorna lista de usuários com paginação"  
✅ "Cria novo usuário com validação de email"  
✅ "Erro 409 para duplicação de email"  

❌ "Obtém dados"  
❌ "Cria objeto"  
❌ "Retorna erro"
