### 4.7. Glossário do Projeto
**Instruções de Gestão de Terminologia do Projeto**

Este documento é destinado ao agente de IA responsável por coletar, estruturar e atualizar o glossário de terminologia do projeto. O objetivo é garantir consistência terminológica em todos os artefatos do projeto.

**Fontes de Termos:** artefatos no diretório de trabalho
**Local de Salvamento do Glossário:** `*_glossary.md` na raiz do projeto
**Formato de Atualização:** adição de novos termos e atualização de existentes

---

#### 4.7.1. Índice
1. [Princípios de Gestão do Glossário](#princípios-de-gestão-do-glossário)
2. [Fontes de Termos](#fontes-de-termos)
3. [Estrutura do Glossário](#estrutura-do-glossário)
4. [Procedimentos de Coleta de Termos](#procedimentos-de-coleta-de-termos)
5. [Categorização de Termos](#categorização-de-termos)
6. [Verificação de Consistência](#verificação-de-consistência)
7. [Procedimentos de Atualização](#procedimentos-de-atualização)

---

#### 4.7.2. Princípios de Gestão do Glossário

##### 4.7.2.1. Princípios Chave:
- **Consistência**: um termo - uma definição em todo o projeto
- **Completude**: cobertura de todos os conceitos chave do domínio
- **Relevância**: atualizações regulares de definições
- **Hierarquia**: relacionamentos entre termos e seu agrupamento
- **Contextualidade**: consideração de especificidades do domínio

##### 4.7.2.2. Critérios de Inclusão de Termos:
- **Termos de Negócio**: conceitos do domínio
- **Termos Técnicos**: conceitos arquiteturais e tecnológicos
- **Siglas e Abreviações**: todas as abreviações do projeto
- **Papéis e Atores**: participantes do sistema
- **Processos e Estados**: processos de negócio chave
- **Entidades de Dados**: objetos principais do sistema

---

#### 4.7.3. Fontes de Termos

##### 4.7.3.1. Requisitos de Negócio
**Arquivos para Análise:**
- `*_us.md` (User Stories)
- `*_uc.md` (Use Cases)
- `README.md` em pastas do projeto

**Tipos de Termos:**
- [ ] Papéis de Usuário
- [ ] Processos de Negócio
- [ ] Regras de Negócio
- [ ] Critérios de Aceitação
- [ ] Áreas Funcionais

##### 4.7.3.2. Arquitetura de Sistema
**Arquivos para Análise:**
- `*.puml` (diagramas PlantUML)

**Tipos de Termos:**
- [ ] Componentes do Sistema
- [ ] Camadas de Arquitetura
- [ ] Interfaces
- [ ] Protocolos
- [ ] Tecnologias

##### 4.7.3.3. Modelo de Dados
**Arquivos para Análise:**
- Diagramas ER
- Arquivos SQL
- Especificações de API

**Tipos de Termos:**
- [ ] Entidades
- [ ] Atributos
- [ ] Relacionamentos
- [ ] Restrições
- [ ] Índices

##### 4.7.3.4. APIs e Interfaces
**Arquivos para Análise:**
- `*.yaml` (especificações OpenAPI)
- Diagramas de sequência

**Tipos de Termos:**
- [ ] Endpoints
- [ ] Métodos HTTP
- [ ] Parâmetros de Requisição
- [ ] Códigos de Resposta
- [ ] Schemas de Dados

---

#### 4.7.4. Estrutura do Glossário
##### 4.7.4.1. Formato de Entrada de Termo:
### [Termo]
**Categoria:** [Negócio/Técnico/Dados/API/Papel]  
**Sinônimos:** [nomes alternativos]  
**Abreviações:** [abreviações]  
**Definição:** [definição clara do termo]  
**Contexto:** [onde é usado no projeto]  
**Termos Relacionados:** [links para outros termos]  
**Fonte:** [arquivo onde aparece primeiro]  
**Última Atualização:** [data]
**Exemplos de Uso:**- [exemplo 1] - [exemplo 2]

##### 4.7.4.2. Agrupamento de Termos:
###### 4.7.4.2.1. Termos de Negócio
- Domínio
- Processos de Negócio
- Papéis e Participantes
- Produtos e Serviços

###### 4.7.4.2.2. Termos Técnicos
- Componentes Arquiteturais
- Tecnologias e Ferramentas
- Protocolos e Padrões
- Infraestrutura

###### 4.7.4.2.3. Termos de Dados
- Entidades
- Atributos
- Relacionamentos
- Restrições

###### 4.7.4.2.4. Termos de API
- Endpoints
- Métodos
- Parâmetros
- Schemas

###### 4.7.4.2.5. Siglas e Abreviações
- Abreviações Técnicas
- Abreviações de Negócio
- Abreviações Organizacionais

#### 4.7.5. Procedimentos de Coleta de Termos

##### 4.7.5.1. Estágio 1: Coleta Automática

**1.1. Escaneamento de Arquivos**
- [ ] Busca de termos em User Stories (papéis após "Como")
- [ ] Extração de atores de Use Cases
- [ ] Coleta de nomes de componentes de diagramas
- [ ] Busca de entidades em ERD
- [ ] Extração de endpoints de OpenAPI

**1.2. Padrões de Busca**
- Papéis: `Como [papel]`, `Ator: [papel]`
- Componentes: `component`, `interface`, `service`
- Entidades: `entity`, `table`, nomes em ERD
- API: `paths:`, `endpoints`, métodos HTTP
- Siglas: palavras em maiúsculas

##### 4.7.5.2. Estágio 2: Análise de Contexto

**2.1. Determinação de Significado**
- [ ] Análise de contexto de uso
- [ ] Busca de definição no texto
- [ ] Identificação de sinônimos
- [ ] Determinação de escopo

**2.2. Agrupamento**
- [ ] Categorização por tipos
- [ ] Identificação de hierarquia
- [ ] Vinculação de termos relacionados
- [ ] Determinação de dependências

##### 4.7.5.3. Estágio 3: Validação e Limpeza

**3.1. Verificação de Duplicados**
- [ ] Busca de termos idênticos
- [ ] Identificação de sinônimos
- [ ] Verificação de abreviações
- [ ] Mesclagem de duplicados

**3.2. Verificação de Qualidade**
- [ ] Completude da definição
- [ ] Correção da categorização
- [ ] Disponibilidade de exemplos
- [ ] Relevância da fonte

#### 4.7.6. Categorização de Termos

##### 4.7.6.1. Termos de Negócio
**Critérios:**
- Relacionado ao domínio
- Usado em User Stories e Use Cases
- Compreensível para usuários de negócio
- Não requer conhecimento técnico

**Exemplos:**
- Cliente, Usuário, Administrador
- Pedido, Pagamento, Fatura
- Registro, Autorização
- Produto, Serviço, Tarifa

##### 4.7.6.2. Termos Técnicos
**Critérios:**
- Relacionado à arquitetura de TI
- Usado em diagramas técnicos
- Requer conhecimento técnico
- Relacionado à implementação

**Exemplos:**
- API Gateway, Microserviço
- Banco de Dados, Cache
- Load Balancer, Firewall
- REST, HTTP, JSON

##### 4.7.6.3. Termos de Dados
**Critérios:**
- Relacionado ao modelo de dados
- Usado em ERD
- Descreve estrutura de dados
- Relacionado a armazenamento de informações

**Exemplos:**
- Usuário, Pedido, Pagamento (entidades)
- user_id, email, created_at (atributos)
- um-para-muitos, chave estrangeira (relacionamentos)

##### 4.7.6.4. Termos de API
**Critérios:**
- Relacionado a interfaces
- Usado em OpenAPI
- Descreve interação
- Relacionado a protocolos

**Exemplos:**
- /api/users, /login, /orders
- GET, POST, PUT, DELETE
- Header Authorization, Bearer token
- 200 OK, 404 Not Found
---

#### 4.7.7. Verificação de Consistência

##### 4.7.7.1. Análise de Uso de Termos

**1. Verificação de Uniformidade**
- [ ] Um termo = um significado
- [ ] Sem contradições em definições
- [ ] Escrita uniforme (maiúsculas/minúsculas, hífens)
- [ ] Consistência em traduções

**2. Cobertura de Termos**
- [ ] Todos os conceitos chave definidos
- [ ] Sem termos indefinidos em documentos
- [ ] Todos os domínios cobertos
- [ ] Todas as siglas definidas

**3. Qualidade de Definição**
- [ ] Definições claras e inequívocas
- [ ] Sem definições circulares
- [ ] Definições não contêm jargão
- [ ] Exemplos de uso disponíveis

##### 4.7.7.2. Identificação de Problemas

**Tipos de Problemas:**
- **Duplicados:** termos idênticos com definições diferentes
- **Sinônimos:** termos diferentes com mesmo significado
- **Termos indefinidos:** termos sem definições
- **Termos obsoletos:** termos não usados no projeto
- **Contradições:** definições conflitantes

**Procedimento de Resolução:**
1. Identificar todas as ocorrências do termo problemático
2. Analisar contexto de uso
3. Selecionar definição primária
4. Atualizar todos os documentos
5. Adicionar sinônimos ao glossário

---

#### 4.7.8. Procedimentos de Atualização

##### 4.7.8.1. Atualizações Regulares

**Gatilhos de Atualização:**
- [ ] Criação de novos artefatos de requisitos
- [ ] Mudanças em documentos existentes
- [ ] Adição de novos diagramas
- [ ] Atualizações de especificação de API
- [ ] Aparecimento de novos relatórios

**Frequência de Verificação:**
- **Após cada mudança:** termos críticos
- **Semanalmente:** análise completa de consistência
- **Durante releases:** verificação abrangente do glossário

##### 4.7.8.2. Processo de Atualização

**1. Coleta de Mudanças**
- [ ] Escaneamento de arquivos modificados
- [ ] Identificação de novos termos
- [ ] Análise de termos deletados
- [ ] Verificação de definições atualizadas

**2. Análise de Impacto**
- [ ] Determinação de documentos afetados
- [ ] Verificação de termos relacionados
- [ ] Avaliação de necessidade de atualização
- [ ] Planejamento de mudanças

**3. Atualização do Glossário**
- [ ] Adição de novos termos
- [ ] Atualização de definições existentes
- [ ] Remoção de termos obsoletos
- [ ] Atualização de relacionamentos de termos

**4. Validação de Mudanças**
- [ ] Verificação de correção de definição
- [ ] Teste de links
- [ ] Verificação de formatação
- [ ] Validação de estrutura

**Use esta instrução para manter um glossário de terminologia do projeto atual e de alta qualidade garantindo consistência terminológica em todos os artefatos.**
