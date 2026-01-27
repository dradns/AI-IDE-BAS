### 4.4. Diagrama ER (ERD)
**Instruções para criar diagramas ER com PlantUML para agente de IA**

#### 4.4.1. Conteúdo
1. [Básicos de sintaxe](#básicos-de-sintaxe)
2. [Métricas de qualidade](#métricas-de-qualidade)
3. [Regras de validação](#regras-de-validação)
4. [Elementos básicos](#elementos-básicos)
5. [Tipos de relacionamento](#tipos-de-relacionamento)
6. [Criação de script SQL](#criação-de-script-sql)
7. [Melhores práticas](#melhores-práticas)
8. [Exemplos de cenário](#exemplos-de-cenário)
9. [Checklist de qualidade](#checklist-de-qualidade)

---

#### 4.4.2. Básicos de Sintaxe

##### 4.4.2.1. Estrutura básica do arquivo:
plantuml
@startuml
!define ENTITY_STYLE fill:#E1F5FE,stroke:#01579B,stroke-width:2px

entity "Nome_Entidade" as alias {
  * campo1 : tipo [PK]
  --
  * campo2 : tipo [NOT NULL]
  campo3 : tipo [NULL]
  --
  campo4 : tipo [FK]
}

@enduml


##### 4.4.2.2. Notações:
- `*` - campo obrigatório (NOT NULL)
- `--` - separador de seção  
- `[PK]` - chave primária
- `[FK]` - chave estrangeira
- `[UK]` - chave única

---

#### 4.4.3. Métricas de Qualidade

##### 4.4.3.1. Indicadores alvo:
- **Normalização**: conformidade com 3FN (terceira forma normal)
- **Cobertura de relacionamento**: 100% FK devem estar conectados a PK
- **Nomenclatura**: uniformidade de nomes de entidades e campos
- **Agrupamento de campos**: separação lógica em seções
- **Conformidade SQL**: 100% de correspondência entre ERD e script SQL

##### 4.4.3.2. Sistema de pontuação:
- **Excelente qualidade**: 3FN + todos relacionamentos + uniformidade + SQL = ≥90%
- **Boa qualidade**: 2FN + maioria dos relacionamentos + SQL = 70-89%
- **Precisa melhorar**: problemas de normalização ou SQL = <70%

---

#### 4.4.4. Regras de Validação

##### 4.4.4.1. Verificações automáticas:

✓ Todas as entidades têm chave primária [PK]
✓ Chaves estrangeiras [FK] estão conectadas a [PK] correspondentes
✓ Relacionamentos estão corretamente tipados (1:1, 1:N, N:M)
✓ Nomes em estilo uniforme (snake_case ou camelCase)
✓ Campos obrigatórios marcados com *
✓ Agrupamento de campos mantido (separadores --)
✓ Script SQL corresponde totalmente ao diagrama ERD
✓ Todas as tabelas no SQL têm entidades correspondentes no ERD


---

#### 4.4.5. Elementos Básicos

##### 4.4.5.1. Criando entidade com agrupamento:
plantuml
entity User {
  ' Chave primária
  * id : int [PK]
  --
  ' Informação principal
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  first_name : varchar(100)
  last_name : varchar(100)
  --
  ' Campos de sistema
  * created_at : timestamp
  * updated_at : timestamp
  deleted_at : timestamp
}


##### 4.4.5.2. Seções recomendadas:
1. **Chave primária** - sempre primeiro
2. **Informação principal** - campos de negócio
3. **Relacionamentos** - chaves estrangeiras
4. **Campos de sistema** - created_at, updated_at, deleted_at

---

#### 4.4.6. Tipos de Relacionamento

##### 4.4.6.1. Sintaxe de relacionamento:
| Tipo de Relacionamento | Sintaxe | Exemplo de Uso |
|-----------|-----------|---------------------|
| **1:1** | `\|\|--\|\|` | User ↔ UserProfile |
| **1:N** | `\|\|--o{` | Category → Products |
| **N:M** | `}o--o{` | Products ↔ Tags (via junção) |
| **1:0..1** | `\|\|--o\|` | User → PasswordReset |

##### 4.4.6.2. Exemplos de relacionamento:

###### 4.4.6.2.1. Um para um (1:1)
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255)
}

entity UserProfile {
  * user_id : int [PK, FK]
  * first_name : varchar(100)
  * last_name : varchar(100)
}

User ||--|| UserProfile : "tem perfil"


###### 4.4.6.2.2. Um para muitos (1:N)
plantuml
entity Category {
  * id : int [PK]
  * name : varchar(255)
}

entity Product {
  * id : int [PK]
  * name : varchar(255)
  * category_id : int [FK]
}

Category ||--o{ Product : "contém"


###### 4.4.6.2.3. Muitos para muitos (N:M) via tabela de junção
plantuml
entity Product {
  * id : int [PK]
  * name : varchar(255)
}

entity Tag {
  * id : int [PK]
  * name : varchar(255)
}

entity ProductTag {
  * product_id : int [PK, FK]
  * tag_id : int [PK, FK]
}

Product ||--o{ ProductTag
Tag ||--o{ ProductTag


---

#### 4.4.7. Criação de Script SQL

##### 4.4.7.1. Requisito obrigatório:
**Com cada diagrama ERD, é OBRIGATÓRIO criar script SQL correspondente para banco de dados real (preferencialmente SQLite).**

##### 4.4.7.2. Princípios de correspondência ERD → SQL:
- **Cada entidade** = tabela no SQL
- **Cada campo do ERD** = coluna na tabela
- **Relacionamentos do ERD** = FOREIGN KEY no SQL
- **Tipos de dados** = tipos SQL correspondentes

##### 4.4.7.3. Exemplo de correspondência:

###### 4.4.7.3.1. Diagrama ERD:
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  first_name : varchar(100)
  last_name : varchar(100)
  * created_at : timestamp
}

entity Order {
  * id : int [PK]
  * user_id : int [FK]
  * status : varchar(50)
  * total_amount : decimal(10,2)
  * created_at : timestamp
}

User ||--o{ Order : "faz"


###### 4.4.7.3.2. Script SQL correspondente (SQLite):
sql
-- Criando banco de dados SQLite
-- Arquivo: database.sql

-- Tabela de usuários
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para otimização
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Inserção de dados de teste
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('user1@example.com', 'hash1', 'João', 'Silva'),
('user2@example.com', 'hash2', 'Maria', 'Santos');

INSERT INTO orders (user_id, status, total_amount) VALUES
(1, 'completed', 1500.00),
(1, 'pending', 750.50),
(2, 'completed', 2200.00);


##### 4.4.7.4. Correspondência de tipos de dados:

| Tipo ERD | Tipo SQLite | Descrição |
|---------|------------|----------|
| `int` | `INTEGER` | Inteiros |
| `varchar(n)` | `VARCHAR(n)` | Strings de comprimento fixo |
| `text` | `TEXT` | Texto de comprimento ilimitado |
| `decimal(m,n)` | `DECIMAL(m,n)` | Números decimais |
| `timestamp` | `TIMESTAMP` | Data e hora |
| `boolean` | `BOOLEAN` | Tipo booleano |

##### 4.4.7.5. Estrutura do arquivo SQL:
1. **Comentários** - descrição do propósito do banco
2. **DROP TABLE** - para recriação (opcional)
3. **CREATE TABLE** - criando todas as tabelas
4. **ALTER TABLE** - adicionando chaves estrangeiras (se necessário)
5. **CREATE INDEX** - índices para desempenho
6. **INSERT** - dados de teste (mínimo 2-3 registros por tabela)

---

#### 4.4.8. Melhores Práticas

##### 4.4.8.1. Nomenclatura
- **Entidades**: PascalCase ou snake_case (uniformemente)
- **Campos**: snake_case com nomes claros
- **Relacionamentos**: descrições significativas em português

##### 4.4.8.2. Estruturação de campos
plantuml
entity Product {
  ' Chave primária
  * id : int [PK]
  --
  ' Informação principal
  * name : varchar(255)
  * description : text
  * sku : varchar(100) [UK]
  --
  ' Informação de preço  
  * price : decimal(10,2)
  discount_price : decimal(10,2)
  --
  ' Relacionamentos
  * category_id : int [FK]
  * brand_id : int [FK]
  --
  ' Campos de sistema
  * is_active : boolean
  * created_at : timestamp
  * updated_at : timestamp
}


##### 4.4.8.3. Estilização (opcional)
plantuml
!define MAIN_ENTITY fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
!define LOOKUP_ENTITY fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
!define JUNCTION_ENTITY fill:#FFF3E0,stroke:#F57C00,stroke-width:2px

entity User <<MAIN_ENTITY>>
entity Role <<LOOKUP_ENTITY>>  
entity UserRole <<JUNCTION_ENTITY>>


---

#### 4.4.9. Exemplos de Cenário

##### 4.4.9.1. Sistema de e-commerce
plantuml
@startuml
entity User {
  * id : int [PK]
  * email : varchar(255) [UK]
  * password_hash : varchar(255)
  * first_name : varchar(100)
  * last_name : varchar(100)
  * phone : varchar(20)
  * is_active : boolean
  * created_at : timestamp
  * updated_at : timestamp
}

entity Category {
  * id : int [PK]
  * name : varchar(255)
  * description : text
  * parent_id : int [FK]
  * is_active : boolean
}

entity Product {
  * id : int [PK]
  * name : varchar(255)
  * description : text
  * sku : varchar(100) [UK]
  * price : decimal(10,2)
  * stock_quantity : int
  * category_id : int [FK]
  * is_active : boolean
  * created_at : timestamp
}

entity Order {
  * id : int [PK]
  * user_id : int [FK]
  * status : varchar(50)
  * total_amount : decimal(10,2)
  * created_at : timestamp
}

entity OrderItem {
  * id : int [PK]
  * order_id : int [FK]
  * product_id : int [FK]
  * quantity : int
  * unit_price : decimal(10,2)
  * total_price : decimal(10,2)
}

' Relacionamentos
User ||--o{ Order : "faz"
Category ||--o{ Product : "contém"
Category ||--o{ Category : "inclui"
Order ||--o{ OrderItem : "contém"
Product ||--o{ OrderItem : "incluído em"
@enduml


---

#### 4.4.10. Erros Comuns

##### 4.4.9.1. ❌ Incorreto:
plantuml
' Faltando chave primária
entity User {
  email : varchar(255)
  name : varchar(100)
}

' Relacionamento muitos-para-muitos incorreto
User ||--o{ Role : "tem papéis"


##### 4.4.9.2. ✅ Correto:
plantuml
entity User {
  * id : int [PK]
  * email : varchar(255)
  * name : varchar(100)
}

entity UserRole {
  * user_id : int [PK, FK]
  * role_id : int [PK, FK]
}

entity Role {
  * id : int [PK]
  * name : varchar(100)
}

User ||--o{ UserRole
Role ||--o{ UserRole


---

#### 4.4.11. Checklist de Qualidade

##### 4.4.11.1. Verificação estrutural:
- [ ] ✅ Todas as entidades têm chave primária [PK]
- [ ] ✅ Chaves estrangeiras [FK] estão corretamente marcadas
- [ ] ✅ Campos obrigatórios marcados com *
- [ ] ✅ Campos logicamente agrupados (separadores --)

##### 4.4.11.2. Verificação de normalização:
- [ ] ✅ **1FN**: Todos os campos são atômicos (sem valores compostos)
- [ ] ✅ **2FN**: Sem dependências parciais de chave composta
- [ ] ✅ **3FN**: Sem dependências transitivas

##### 4.4.11.3. Verificação de relacionamento:
- [ ] ✅ Relacionamentos 1:1 são justificados e corretos
- [ ] ✅ Relacionamentos 1:N têm FK na tabela filha
- [ ] ✅ Relacionamentos N:M são implementados via tabela de junção
- [ ] ✅ Todos os FK referenciam PK existentes

##### 4.4.11.4. Verificação de script SQL:
- [ ] ✅ **Arquivo SQL criado** e anexado ao ERD
- [ ] ✅ **Todas as tabelas** do ERD estão presentes no SQL
- [ ] ✅ **Tipos de dados** correspondem à especificação do ERD
- [ ] ✅ **Chaves primárias** corretamente definidas
- [ ] ✅ **Chaves estrangeiras** criadas com relacionamentos corretos
- [ ] ✅ **Índices** adicionados para FK e campos frequentemente usados
- [ ] ✅ **Dados de teste** incluídos (mínimo 2-3 registros por tabela)
- [ ] ✅ **Sintaxe SQL** correta para SQLite

##### 4.4.11.5. Verificação de qualidade:
- [ ] 🎯 Nomes correspondem à terminologia de negócio
- [ ] 🎯 Estrutura suporta todos os processos de negócio
- [ ] 🎯 Sem redundância de dados
- [ ] 🎯 Modelo é escalável

##### 4.4.11.6. Verificação de integração:
- [ ] 🔗 Entidades correspondem a objetos do Use Case
- [ ] 🔗 Relacionamentos refletem regras de negócio
- [ ] 🔗 Campos cobrem todos os atributos dos User Stories
- [ ] 🔗 Script SQL pode ser executado sem erros

**Objetivo**: Criar diagramas ERD com script SQL pronto para implantação imediata de banco de dados.

---

#### 4.4.12. Recomendações de Otimização

##### 4.4.12.1. Desempenho:
- Índices para campos frequentemente usados
- Desnormalização para queries críticas
- Particionamento de tabelas grandes

##### 4.4.12.2. Manutenção:
- Nomes descritivos de campos e tabelas
- Comentários para relacionamentos complexos
- Versionamento de estrutura

##### 4.4.12.3. Exemplos de verificação final:
✅ "Tabela de usuários normalizada para 3FN"  
✅ "Relacionamento Orders → order_items implementado corretamente"  
✅ "Todos os FK têm índices correspondentes"  
✅ "Script SQL executa sem erros no SQLite"  

❌ "Tabela parece normal"  
❌ "Relacionamentos funcionam"  
❌ "Dados são salvos"
