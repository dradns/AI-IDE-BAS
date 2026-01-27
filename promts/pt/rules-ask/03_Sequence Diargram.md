### 4.5. Diagrama de Sequência
**Instruções para criar diagramas de Sequência para agente de IA**

#### 4.5.1. Conteúdo
1. [Básicos e requisitos](#básicos-e-requisitos)
2. [Estrutura do diagrama](#estrutura-do-diagrama)
3. [Métricas de qualidade](#métricas-de-qualidade)
4. [Regras de validação](#regras-de-validação)
5. [Template básico](#template-básico)
6. [Tipos de interação](#tipos-de-interação)
7. [Integração com artefatos](#integração-com-artefatos)
8. [Checklist de qualidade](#checklist-de-qualidade)

---

#### 4.5.2. Básicos e requisitos

##### 4.5.2.1. Artefatos de entrada obrigatórios:
- **User Story** - para entender o cenário de negócio
- **Use Case** - para fluxo de interação detalhado
- **Diagrama de arquitetura** - para participantes e conexões

##### 4.5.2.2. Artefatos adicionais:
- Documentação de API, especificação técnica, diagrama de implantação

---

#### 4.5.3. Estrutura do diagrama

##### 4.5.3.1. Cabeçalho e configurações
plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 


##### 4.5.3.2. Participantes (tipagem estrita)
plantuml
actor User as "Papel do User Story"
participant Browser as "Navegador"
participant "Servidor Web" as WebServer
participant "Servidor de Aplicação" as AppServer
participant "Servidor de Banco de Dados" as DBServer


##### 4.5.3.3. Agrupamento de estágios
plantuml
== Nome do estágio lógico ==


##### 4.5.3.4. Interações com protocolos
plantuml
User -> Browser : Ação de negócio
Browser -> WebServer : HTTP GET/POST /endpoint
WebServer -> AppServer : REST API: método
AppServer -> DBServer : JDBC: SELECT/INSERT


---

#### 4.5.4. Métricas de qualidade

##### 4.5.4.1. Indicadores alvo:
- **Cobertura de participantes**: 100% do diagrama de arquitetura
- **Agrupamento lógico**: 3-7 estágios com nomes claros
- **Detalhamento de protocolo**: 90% das interações com especificação de tecnologia
- **Tratamento de erros**: mínimo 2 cenários alternativos

##### 4.5.4.2. Sistema de pontuação:
- **Excelente qualidade**: ≥90% de conformidade com métricas
- **Boa qualidade**: 70-89% de conformidade com métricas
- **Precisa melhorar**: <70% de conformidade com métricas

---

#### 4.5.5. Regras de validação

##### 4.5.5.1. Verificações automáticas:

✓ Começa com @startuml, termina com @enduml
✓ Papel do ator corresponde ao User Story
✓ Participantes presentes no diagrama de arquitetura
✓ Cada estágio tem nome no formato "== Nome =="
✓ Protocolos especificados para interações técnicas
✓ Setas síncronas/assíncronas usadas corretamente
✓ Tem mínimo 1 fluxo alternativo (alt/opt/loop)


---

#### 4.5.6. Template básico

plantuml
@startuml
autonumber "<b><color:DarkSlateBlue>.</color></b> " 

actor User as "[Papel do User Story]"
participant Browser as "Navegador"
participant "Servidor Web" as WebServer
participant "Servidor de Aplicação" as AppServer
participant "Servidor de Banco de Dados" as DBServer

== Iniciação da ação ==
User -> Browser : [Ação de negócio]
Browser -> WebServer : HTTP [método] /[endpoint]

== Processamento da requisição ==
WebServer -> AppServer : REST API: [método]

== Operações de dados ==
AppServer -> DBServer : JDBC: [operação SQL]
DBServer --> AppServer : [Resultado]

== Retorno do resultado ==
AppServer --> WebServer : JSON: [dados]
WebServer --> Browser : HTTP 200 OK
Browser --> User : [Exibição do resultado]

@enduml


---

#### 4.5.7. Tipos de interação

##### 4.5.7.1. Protocolos e sintaxe:
| Tipo | Sintaxe | Exemplo |
|-----|-----------|--------|
| **HTTP** | `HTTP [método] /endpoint` | `HTTP GET /api/users` |
| **REST API** | `REST API: [operação]` | `REST API: getUserData` |
| **Banco de Dados** | `JDBC: [SQL]` | `JDBC: SELECT * FROM users` |
| **Fila de Mensagens** | `MQ: [operação]` | `MQ: publish userCreated` |
| **gRPC** | `gRPC: [método]` | `gRPC: GetUserProfile` |

##### 4.5.7.2. Tipos de seta:
- `->` e `-->` - chamadas/respostas síncronas
- `->>` e `-->>` - chamadas/respostas assíncronas
- `->` para si mesmo - processamento interno

##### 4.5.7.3. Construções de controle:
plantuml
alt Cenário de sucesso
    // fluxo principal
else Erro
    // tratamento de erro
end

opt Execução condicional
    // ações opcionais
end

loop Repetição
    // ações cíclicas
end


---

#### 4.5.8. Integração com artefatos

##### 4.5.8.1. Conexão com User Story:
- **Ator do diagrama** = papel do US
- **Fluxo principal** = descrição da ação do US
- **Resultado** = benefício esperado do US

##### 4.5.8.2. Conexão com Use Case:
- **Cenário principal do UC** = sequência principal
- **Fluxos alternativos do UC** = blocos alt/opt no diagrama
- **Exceções do UC** = blocos de tratamento de erro

##### 4.5.8.3. Conexão com arquitetura:
- **Participantes da sequência** = componentes da arquitetura
- **Interações** = conexões entre componentes
- **Protocolos** = tecnologias de integração

---

#### 4.5.9. Estágios e nomes padrão

##### 4.5.9.1. Grupos típicos:
1. **Iniciação**: "Usuário inicia ação"
2. **Autenticação**: "Verificação de direitos de acesso"
3. **Validação**: "Validação de dados de entrada"
4. **Processamento**: "Lógica de negócio e cálculos"
5. **Armazenamento**: "Operações de banco de dados"
6. **Notificações**: "Envio de mensagens"
7. **Resposta**: "Retornando resultado ao usuário"

##### 4.5.9.2. Exemplos de nomes específicos:
- "== Carregando lista de pedidos =="
- "== Verificação de correção de dados de pagamento =="
- "== Geração de relatório de vendas =="

---

#### 4.5.10. Tratamento de erros

##### 4.5.10.1. Cenários de erro obrigatórios:
plantuml
alt Execução bem-sucedida
    AppServer -> DBServer : Query SELECT
    DBServer --> AppServer : Dados retornados
else Erro de conexão com banco de dados
    AppServer -> DBServer : Query SELECT
    DBServer --> AppServer : Erro: Connection timeout
    AppServer --> WebServer : HTTP 500 Internal Error
    WebServer --> Browser : Página de erro
else Erro de validação de dados
    AppServer -> AppServer : Validar entrada
    AppServer --> WebServer : HTTP 400 Bad Request
    WebServer --> Browser : Mensagem de erro
end


---

#### 4.5.11. Checklist de qualidade

##### 4.5.11.1. Verificação estrutural:
- [ ] ✅ Arquivo começa com `@startuml` e termina com `@enduml`
- [ ] ✅ autonumber usado para numeração de passos
- [ ] ✅ Ator corresponde ao papel do User Story
- [ ] ✅ Todos os participantes presentes no diagrama de arquitetura

##### 4.5.11.2. Verificação lógica:
- [ ] ✅ 3-7 estágios lógicos com nomes claros
- [ ] ✅ Sequência de passos corresponde ao Use Case
- [ ] ✅ Tem fluxos alternativos (alt/opt/loop)
- [ ] ✅ Tratamento de mínimo 2 tipos de erro

##### 4.5.11.3. Verificação técnica:
- [ ] ✅ Protocolos especificados para todas as chamadas técnicas
- [ ] ✅ Métodos HTTP e endpoints especificados
- [ ] ✅ Operações SQL detalhadas
- [ ] ✅ Chamadas síncronas/assíncronas corretas

##### 4.5.11.4. Verificação de integração:
- [ ] 🔗 Correspondência ao cenário principal do Use Case
- [ ] 🔗 Cobertura de todos os atores da arquitetura
- [ ] 🔗 Detalhes técnicos correspondem à especificação de API

**Objetivo**: Criar diagramas de Sequência prontos para implementação técnica e teste.

---

#### 4.5.12. Recomendações de estilo

##### 4.5.12.1. Nomenclatura:
- **Atores**: papéis de negócio específicos
- **Participantes**: componentes arquiteturais
- **Mensagens**: termos de negócio para usuários, técnicos para sistemas

##### 4.5.12.2. Detalhamento:
- **Brevidade**: mensagens até 50 caracteres
- **Clareza**: terminologia compreensível
- **Sequência**: ordem lógica de chamadas
- **Agrupamento**: combinando ações relacionadas

##### 4.5.12.3. Exemplos de descrição de qualidade:
✅ "HTTP POST /api/orders - criação de pedido"  
✅ "JDBC: INSERT INTO orders (user_id, total)"  
✅ "Exibindo página de confirmação de pedido"  

❌ "Faz requisição"  
❌ "Retorna dados"  
❌ "Sistema processa"
