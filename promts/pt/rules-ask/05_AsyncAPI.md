### 4.7. Especificação para Kafka Message Broker em Formato AsyncAPI

**Instruções para descrever Kafka message broker**

**Idioma de execução:** Português
**Formato do resultado:** Especificação AsyncAPI em formato YAML
**Local de salvamento:** Pasta do projeto com nome `{feature-name}_asyncapi.yaml`
**Padrão:** AsyncAPI 2.6.0 ou superior

#### 4.7.1. Conteúdo
1. [Formato do arquivo de saída](#formato-do-arquivo-de-saída)
2. [Template de descrição de arquitetura Kafka](#template-de-descrição-de-arquitetura-kafka)
3. [Métricas de qualidade](#métricas-de-qualidade)
4. [Regras de validação](#regras-de-validação)
5. [Metodologia de design](#metodologia-de-design)
6. [Exemplos de descrição Kafka](#exemplos-de-descrição-kafka)
7. [Critérios de qualidade](#critérios-de-qualidade)
8. [Checklist para agente de IA](#checklist-para-agente-de-ia)

---

#### 4.7.2. Formato do arquivo de saída

##### 4.7.2.1. Estrutura obrigatória de arquivo YAML AsyncAPI:

yaml
{feature-name}_asyncapi.yaml
asyncapi: '2.6.0'
info:
  title: '{Feature Name} Kafka Events API'
  version: '1.0.0'
  description: |
    Descrição de eventos assíncronos para {feature-name} via Apache Kafka
    
    ## Propósito
    {Descrição do propósito do sistema de eventos}
    
    ## Papel arquitetural
    {Papel na arquitetura geral do sistema}
    
  contact:
    name: 'Equipe de Desenvolvimento'
    email: 'dev-team@company.com'
  license:
    name: 'MIT'

servers:
  kafka-cluster:
    url: '{kafka-broker-urls}'
    protocol: kafka
    description: 'Cluster Kafka de produção'
    bindings:
      kafka:
        schemaRegistryUrl: 'http://schema-registry:8081'
        schemaRegistryVendor: 'confluent'
    security:
      - saslScram: []

defaultContentType: application/json

channels:
  'domain.entity.events':
    description: 'Eventos de ciclo de vida de {entidade}'
    bindings:
      kafka:
        topic: 'domain.entity.events'
        partitions: 12
        replicas: 3
        configs:
          retention.ms: 2592000000  # 30 dias
          cleanup.policy: 'delete'
          compression.type: 'snappy'
    publish:
      summary: 'Publicação de eventos de {entidade}'
      operationId: 'publishEntityEvent'
      bindings:
        kafka:
          groupId: 'entity-producers'
          clientId: 'entity-service'
          acks: 'all'
          key:
            type: string
            description: 'ID da entidade para particionamento'
      message:
        $ref: '#/components/messages/EntityEvent'
    subscribe:
      summary: 'Assinatura de eventos de {entidade}'
      operationId: 'subscribeEntityEvent'
      bindings:
        kafka:
          groupId: 'entity-consumers'
          clientId: 'consumer-service'
      message:
        $ref: '#/components/messages/EntityEvent'

components:
  messages:
    EntityEvent:
      name: 'EntityEvent'
      title: 'Evento de Entidade'
      summary: 'Evento de mudança de estado da entidade'
      contentType: application/json
      headers:
        type: object
        properties:
          eventType:
            type: string
            enum: ['CREATED', 'UPDATED', 'DELETED']
          source:
            type: string
            description: 'Origem do evento'
          timestamp:
            type: string
            format: date-time
      payload:
        $ref: '#/components/schemas/EntityEventPayload'
      examples:
        - name: 'entityCreated'
          summary: 'Criação de entidade'
          headers:
            eventType: 'CREATED'
            source: 'entity-service'
            timestamp: '2024-01-15T10:30:00Z'
          payload:
            entityId: 'uuid-here'
            status: 'ACTIVE'
            createdAt: '2024-01-15T10:30:00Z'

  schemas:
    EntityEventPayload:
      type: object
      required:
        - entityId
        - status
        - createdAt
      properties:
        entityId:
          type: string
          format: uuid
          description: 'Identificador único da entidade'
        status:
          type: string
          enum: ['ACTIVE', 'INACTIVE', 'PENDING']
          description: 'Status da entidade'
        createdAt:
          type: string
          format: date-time
          description: 'Hora de criação do evento'
        metadata:
          type: object
          description: 'Dados adicionais'
          additionalProperties: true

  securitySchemes:
    saslScram:
      type: scramSha512
      description: 'Autenticação SASL/SCRAM'


##### 4.7.2.2. Regras de nomenclatura de arquivos:
- `{feature-name}_asyncapi.yaml` - para funcionalidades principais
- `{domain}_events_asyncapi.yaml` - para soluções de domínio
- `{system-name}_kafka_asyncapi.yaml` - para integrações de sistema

**Exemplos:**
- `banking_transfer_asyncapi.yaml`
- `ecommerce_orders_asyncapi.yaml`
- `notification_events_asyncapi.yaml`

##### 4.7.2.3. Seções AsyncAPI obrigatórias:
1. **asyncapi**: versão da especificação (2.6.0+)
2. **info**: metadados da API
3. **servers**: configuração do cluster Kafka
4. **channels**: tópicos e sua configuração
5. **components**: schemas de mensagens, esquemas de segurança
6. **x-kafka-config**: configuração estendida do Kafka (opcional)

---

#### 4.7.3. Template de descrição de arquitetura Kafka

##### 4.7.3.1. Estrutura obrigatória (9 blocos principais):

| № | Bloco | Descrição | Obrigatório |
|---|------|----------|----------------|
| 1 | **Visão geral** | Propósito do Kafka no sistema, papel na arquitetura | ✅ Obrigatório |
| 2 | **Tópicos e schemas** | Estrutura de tópicos, schemas de mensagens, particionamento | ✅ Obrigatório |
| 3 | **Produtores** | Serviços remetentes, estratégias de envio | ✅ Obrigatório |
| 4 | **Consumidores** | Serviços receptores, grupos de consumidores | ✅ Obrigatório |
| 5 | **Configuração de cluster** | Configurações de broker, replicação, tolerância a falhas | ✅ Obrigatório |
| 6 | **Schemas de dados** | Schemas Avro/JSON, Schema Registry, versionamento | ✅ Obrigatório |
| 7 | **Segurança** | Autenticação, autorização, criptografia | 🔶 Recomendado |
| 8 | **Monitoramento e alertas** | Métricas, logging, SLA | 🔶 Recomendado |
| 9 | **Desempenho** | Throughput, latência, otimizações | 🔶 Recomendado |

---

#### 4.7.4. Métricas de qualidade

##### 4.7.4.1. Indicadores alvo:
- **Completude de estrutura**: 6/6 blocos obrigatórios = 100%
- **Cobertura de tópicos**: Descrição de todos os tópicos principais do sistema
- **Schemas de dados**: 100% dos tópicos têm descrição de schema
- **Grupos de consumidores**: Separação clara de responsabilidades
- **Tolerância a falhas**: Mínimo 2x replicação para tópicos críticos

##### 4.7.4.2. Sistema de pontuação:
- **Pronto para produção**: 95-100% de conformidade + segurança + monitoramento
- **Excelente qualidade**: 85-94% de conformidade com métricas
- **Boa qualidade**: 70-84% de conformidade com métricas  
- **Precisa melhorar**: <70% de conformidade com métricas

---

#### 4.7.5. Regras de validação

##### 4.7.5.1. Verificações automáticas:

###### 4.7.5.1.1. Validação estrutural

✓ Todos os 6 blocos obrigatórios presentes
✓ Cada tópico tem descrição de schema
✓ Produtores e consumidores claramente identificados
✓ Estratégia de particionamento especificada


###### 4.7.5.1.2. Validação arquitetural

✓ Tópicos logicamente conectados a domínios do sistema
✓ Schemas de dados correspondem a especificações de API
✓ Grupos de consumidores não se sobrepõem em responsabilidade
✓ Replicação configurada para tópicos críticos


###### 4.7.5.1.3. Validação de produção

✓ Políticas de retenção especificadas para todos os tópicos
✓ Estratégia de tratamento de erros descrita
✓ Monitoramento e alertas configurados
✓ Procedimentos de recuperação de desastres documentados


---

#### 4.7.6. Metodologia de design

##### 4.7.6.1. Passo 1: Análise de eventos de domínio
**Fontes para análise:**
- User Stories e Use Cases
- Diagramas de sequência
- Diagrama de arquitetura do sistema
- Especificações de API (para operações síncronas)

##### 4.7.6.2. Passo 2: Identificação de eventos
**Tipos de eventos:**
- **Eventos de Domínio**: mudanças de estado de entidades de negócio
- **Eventos de Integração**: comunicação entre serviços
- **Eventos de Sistema**: eventos técnicos (logs, métricas)
- **Eventos de Comando**: comandos assíncronos

##### 4.7.6.3. Passo 3: Design de tópicos
**Princípios de nomenclatura:**

{domain}.{entity}.{event-type}
Exemplos:
- banking.transfer.created
- banking.transfer.completed
- ecommerce.order.placed
- notification.email.sent


##### 4.7.6.4. Passo 4: Definição de schema
**Formatos de schema:**
- **Avro**: tipagem estrita, evolução de schema
- **JSON Schema**: flexibilidade, simplicidade
- **Protobuf**: desempenho, compatibilidade

##### 4.7.6.5. Passo 5: Planejamento de partições
**Estratégias de particionamento:**
- Por ID de usuário (user-based)
- Por ID de entidade (entity-based)
- Por timestamps (time-based)
- Round-robin (distribuição uniforme)

##### 4.7.6.6. Passo 6: Configuração de consumidores
**Padrões de consumo:**
- **Single Consumer**: processamento em ordem
- **Consumer Group**: processamento paralelo
- **Multiple Groups**: lógica de negócio diferente

---

#### 4.7.7. Checklist para agente de IA

##### 4.7.7.1. Verificação obrigatória:
- [ ] ✅ Arquivo YAML AsyncAPI criado com nome correto
- [ ] ✅ Versão AsyncAPI especificada (2.6.0+)
- [ ] ✅ Seção info completamente preenchida
- [ ] ✅ Servers contém configuração Kafka
- [ ] ✅ Channels descrevem todos os tópicos
- [ ] ✅ Cada channel tem operações publish/subscribe
- [ ] ✅ Components contém schemas de mensagens
- [ ] ✅ Estratégia de particionamento definida em bindings
- [ ] ✅ Replicação configurada em kafka bindings
- [ ] ✅ Políticas de retenção descritas em configs
- [ ] ✅ Schemas de dados válidos (JSON Schema)
- [ ] ✅ Grupos de consumidores especificados em bindings
- [ ] ✅ Sintaxe YAML AsyncAPI correta

##### 4.7.7.2. Verificação de qualidade:
- [ ] 🎯 Tópicos logicamente conectados a domínios
- [ ] 🎯 Schemas suportam evolução (compatibilidade retroativa)
- [ ] 🎯 Tratamento de erros via DLQ descrito
- [ ] 🎯 Processamento idempotente garantido
- [ ] 🎯 Acknowledgements de produtor configurados corretamente
- [ ] 🎯 Gestão de offset de consumidor definida

##### 4.7.7.3. Verificação de prontidão para produção:
- [ ] 🚀 Segurança: SASL/SSL, ACL configurados
- [ ] 🚀 Monitoramento: métricas e alertas definidos
- [ ] 🚀 Desempenho: SLA e otimizações descritas
- [ ] 🚀 Procedimentos de backup e recuperação de desastres
- [ ] 🚀 Schema Registry configurado
- [ ] 🚀 Monitoramento de lag de consumidor
- [ ] 🚀 Processamento de Dead Letter Queue
- [ ] 🚀 Planejamento de capacidade (partições, brokers)

##### 4.7.7.4. Verificação de integração:
- [ ] 🔗 Eventos correspondem a Use Cases
- [ ] 🔗 Schemas compatíveis com especificações de API
- [ ] 🔗 Serviços produtores existem no diagrama de arquitetura
- [ ] 🔗 Grupos de consumidores não conflitam em responsabilidade
- [ ] 🔗 Características de tempo realistas
- [ ] 🔗 Volumes de dados correspondem à escala do sistema

**Objetivo**: Criar arquivos YAML com descrição de arquitetura Kafka, prontos para implantação em produção com cobertura total de requisitos funcionais e não-funcionais.
