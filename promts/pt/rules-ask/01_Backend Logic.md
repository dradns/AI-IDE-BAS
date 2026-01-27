### 4.3. Descrição de Lógica de Backend
**Instruções para descrever lógica de operação de funcionalidade (Backend Logic)**

#### 4.3.1. Conteúdo
1. [Template de Descrição de Lógica de Funcionalidade](#template-de-descrição-de-lógica-de-funcionalidade)
2. [Métricas de Qualidade](#métricas-de-qualidade)
3. [Regras de Validação](#regras-de-validação)
4. [Metodologia de Análise](#metodologia-de-análise)
5. [Exemplos de Descrição de Lógica](#exemplos-de-descrição-de-lógica)
6. [Critérios de Qualidade](#critérios-de-qualidade)
7. [Checklist para Agente de IA](#checklist-para-agente-de-ia)

---

#### 4.3.2. Template de Descrição de Lógica de Funcionalidade

##### 4.3.2.1. Estrutura Obrigatória (8 blocos principais):

| № | Bloco | Descrição | Obrigatório |
|---|-------|-----------|-------------|
| 1 | **Visão Geral** | Propósito da funcionalidade e lógica de alto nível | ✅ Obrigatório |
| 2 | **Dados de Entrada** | Parâmetros, seus tipos, restrições | ✅ Obrigatório |
| 3 | **Validações** | Verificações de dados, regras de negócio | ✅ Obrigatório |
| 4 | **Lógica Principal** | Algoritmos, processos, cálculos | ✅ Obrigatório |
| 5 | **Integrações** | Interação com sistemas externos | ✅ Obrigatório |
| 6 | **Situações Excepcionais** | Tratamento de erros, rollbacks | ✅ Obrigatório |
| 7 | **Dados de Saída** | Resultado da operação, formatos de resposta | ✅ Obrigatório |
| 8 | **Desempenho** | Otimizações, cache, limitações | 🔶 Recomendado |

---

#### 4.3.3. Métricas de Qualidade

##### 4.3.3.1. Indicadores Alvo:
- **Completude da estrutura**: 7/7 blocos obrigatórios = 100%
- **Cobertura de validação**: Mínimo 5 tipos diferentes de verificação
- **Detalhe do algoritmo**: Descrição passo a passo com condições
- **Cobertura de erros**: Mínimo 80% das exceções possíveis
- **Conectividade de integração**: 100% de conformidade com arquitetura

##### 4.3.3.2. Sistema de Pontuação:
- **Excelente qualidade**: 90-100% de conformidade com métricas
- **Boa qualidade**: 70-89% de conformidade com métricas
- **Precisa melhorar**: <70% de conformidade com métricas

---

#### 4.3.4. Regras de Validação

##### 4.3.4.1. Verificações Automáticas:

###### 4.3.4.1.1. Validação Estrutural

✓ Todos os 7 blocos obrigatórios presentes
✓ Cada bloco contém mínimo 3 itens
✓ Validações estruturadas por tipos
✓ Algoritmos descritos passo a passo

###### 4.3.4.1.2. Validação Lógica

✓ Dados de entrada correspondem à especificação de API
✓ Validações cobrem todos os parâmetros de entrada
✓ Algoritmos são logicamente sequenciais
✓ Exceções correspondem a cenários reais

###### 4.3.4.1.3. Validação de Integração

✓ Integrações correspondem ao diagrama arquitetural
✓ Validações coordenadas com Use Case
✓ Erros correspondem a status HTTP na API
✓ Desempenho considera requisitos não-funcionais

---

#### 4.3.5. Metodologia de Análise

##### 4.3.5.1. Passo 1: Coleta de Dados de Origem
**Fontes de análise:**
- User Story e Use Case
- Especificação de API (OpenAPI)
- Diagrama arquitetural
- Diagrama ERD
- Diagramas de sequência

##### 4.3.5.2. Passo 2: Identificação de Dados de Entrada
**Analise:**
- Parâmetros de requisição da especificação de API
- Campos de formulário do User Story
- Dados de outros serviços (integrações)
- Informação contextual (usuário, sessão)

##### 4.3.5.3. Passo 3: Definição de Validação
**Tipos de validação:**
- **Estrutural**: tipo de dado, formato, comprimento
- **Validações de negócio**: regras de domínio
- **Segurança**: autorização, direitos de acesso
- **Integração**: verificações de dados relacionados
- **Restrições**: limites, cotas, janelas de tempo

##### 4.3.5.4. Passo 4: Descrição da Lógica Principal
**Abordagens de estruturação:**
- Divisão em estágios lógicos
- Ramificação condicional (if-then-else)
- Operações cíclicas
- Processos paralelos
- Blocos transacionais

##### 4.3.5.5. Passo 5: Identificação de Integração
**Analise interação com:**
- Banco de dados (operações CRUD)
- APIs externas
- Filas de mensagens
- Sistemas de cache
- Armazenamento de arquivos

##### 4.3.5.6. Passo 6: Tratamento de Erros
**Categorias de exceção:**
- Erros de validação (400)
- Autorização (401, 403)
- Não encontrado (404)
- Conflitos (409)
- Erros de servidor (500)
- Indisponibilidade de serviço (503)

#### 4.3.6. Exemplos de Descrição de Lógica

##### 4.3.6.1. Exemplo 1: Transferência Bancária

###### 4.3.6.1.1. Visão Geral
**Propósito:** Processamento de transferência de dinheiro entre contas com verificações de limite e preservação de histórico.
**Lógica de alto nível:** Validação → Verificações de limite → Reserva de fundos → Execução de transferência → Notificações

###### 4.3.6.1.2. Dados de Entrada
interface TransferRequest {
  fromAccountId: string;     // UUID da conta remetente
  toAccountId: string;       // UUID da conta destinatária
  amount: number;            // Valor (número positivo, até 2 decimais)
  currency: string;          // Código de moeda (ISO 4217, 3 caracteres)
  comment?: string;          // Comentário (até 200 caracteres)
  userId: string;            // UUID do usuário do token
}

###### 4.3.6.1.3. Validações
**3.1. Validações Estruturais:**
- amount > 0 e <= 999999.99
- fromAccountId e toAccountId - UUIDs válidos
- currency - existe no diretório de moedas
- comment - não contém caracteres proibidos (<, >, &, ")

**3.2. Validações de Negócio:**
- Usuário é proprietário da conta fromAccountId
- Conta remetente está ativa (status = 'ACTIVE')
- Conta destinatária existe e está ativa
- Moedas das contas correspondem à moeda da transferência
- Fundos suficientes na conta (saldo >= valor + taxa)

**3.3. Validações de Limite:**
- Limite diário não excedido
- Limite mensal não excedido
- Contagem de operações diárias <= máximo

###### 4.3.6.1.4. Lógica Principal
**Passo 1: Recuperação de Informações de Conta**
SELECT id, balance, currency, status, daily_limit, monthly_limit 
FROM accounts 
WHERE id IN (fromAccountId, toAccountId)

**Passo 2: Verificação de Limite Diário**
SELECT SUM(amount) as daily_spent 
FROM transfers 
WHERE from_account_id = fromAccountId 
  AND created_at >= CURRENT_DATE

**Passo 3: Cálculo de Taxa**
function calculateFee(amount, fromAccount, toAccount) {
  if (fromAccount.bank_id === toAccount.bank_id) {
    return 0; // Transferência interna do banco
  }
  return Math.min(amount * 0.015, 100); // 1.5%, máximo 100
}

**Passo 4: Criação de Transação**
BEGIN TRANSACTION;

UPDATE accounts 
SET balance = balance - (amount + fee), 
    reserved = reserved + (amount + fee)
WHERE id = fromAccountId;

INSERT INTO transfers (id, from_account_id, to_account_id, amount, fee, status)
VALUES (uuid(), fromAccountId, toAccountId, amount, fee, 'PROCESSING');

COMMIT;

**Passo 5: Execução de Transferência**
BEGIN TRANSACTION;

UPDATE accounts 
SET reserved = reserved - (amount + fee)
WHERE id = fromAccountId;

UPDATE accounts 
SET balance = balance + amount
WHERE id = toAccountId;

UPDATE transfers 
SET status = 'COMPLETED', completed_at = NOW()
WHERE id = transferId;

COMMIT;

###### 4.3.6.1.5. Integrações
**5.1. Banco de Dados:**
- Leitura: accounts, transfer_limits, exchange_rates
- Escrita: transfers, account_transactions

**5.2. Serviços Externos:**
- NotificationService: envio de notificações SMS/push
- AuditService: registro de operações
- FraudService: verificação de fraude

**5.3. Cache (Redis):**
- Limites do usuário (TTL: 24 horas)
- Taxas de câmbio (TTL: 1 hora)

###### 4.3.6.1.6. Situações Excepcionais
**6.1. Erros de Validação (400):**
- Valor incorreto → "Valor deve ser maior que 0"
- Fundos insuficientes → "Fundos insuficientes na conta"
- Limite excedido → "Limite diário de transferência excedido"

**6.2. Erros de Autorização (403):**
- Não é proprietário da conta → "Sem acesso a esta conta"
- Conta bloqueada → "Conta está bloqueada"

**6.3. Erros de Servidor (500):**
- Erro de banco de dados → Rollback de transação + retry
- Indisponibilidade de serviço externo → Processamento adiado

**6.4. Estratégias de Recuperação:**
- Rollbacks transacionais: rollback automático em erros
- Operações compensatórias: cancelamento de reserva em erro
- Tentativas de retry: até 3 vezes com delay exponencial

###### 4.3.6.1.7. Dados de Saída
**7.1. Resposta de Sucesso (201):**
{
  "transferId": "uuid",
  "status": "COMPLETED",
  "amount": 1000.00,
  "fee": 0.00,
  "fromAccount": "xxx-1234",
  "toAccount": "xxx-5678",
  "timestamp": "2024-01-15T10:30:00Z"
}

**7.2. Erro de Validação (400):**
{
  "error": "VALIDATION_ERROR",
  "message": "Fundos insuficientes na conta",
  "details": {
    "field": "amount",
    "available": 500.00,
    "requested": 1000.00
  }
}

###### 4.3.6.1.8. Desempenho
**8.1. Otimizações:**
- Índices em (from_account_id, created_at) para limites
- Cache de limites do usuário
- Envio assíncrono de notificações

**8.2. Limitações:**
- Carga máxima: 1000 transferências/segundo
- Tempo de resposta: < 2 segundos (percentil 99)
- Disponibilidade: 99.9%

---

##### 4.3.6.2. Exemplo 2: Criação de Pedido E-commerce

###### 4.3.6.2.1. Visão Geral
**Propósito:** Criação de pedido com reserva de produto, cálculo de custo e início do processo de entrega.
**Lógica de alto nível:** Validação do carrinho → Reserva de produto → Cálculo de custo → Criação de pedido → Início de pagamento

###### 4.3.6.2.2. Dados de Entrada
interface CreateOrderRequest {
  items: OrderItem[];        // Produtos no pedido
  deliveryAddress: Address;  // Endereço de entrega
  paymentMethod: string;     // Método de pagamento
  promoCode?: string;        // Código promocional
  userId: string;            // ID do usuário
}

interface OrderItem {
  productId: string;    // UUID do produto
  quantity: number;     // Quantidade (1-100)
  variant?: string;     // Variante do produto (tamanho, cor)
}

###### 4.3.6.2.3. Validações
**3.1. Validações Estruturais:**
- items contém de 1 a 50 posições
- quantity para cada produto de 1 a 100
- deliveryAddress contém todos os campos obrigatórios
- paymentMethod da lista permitida

**3.2. Validações de Negócio:**
- Todos os produtos existem e estão disponíveis para venda
- Quantidade suficiente em estoque
- Produtos podem ser entregues no endereço especificado
- Código promocional é válido e aplicável

**3.3. Validações de Usuário:**
- Usuário está ativo e não bloqueado
- Endereço de entrega pertence ao usuário
- Método de pagamento vinculado ao usuário

###### 4.3.6.2.4. Lógica Principal
**Passo 1: Verificação de Disponibilidade de Produto**
SELECT p.id, p.name, p.price, s.quantity as stock_quantity
FROM products p
JOIN stock s ON p.id = s.product_id
WHERE p.id IN (...) AND p.status = 'ACTIVE'

**Passo 2: Reserva de Produto**
BEGIN TRANSACTION;

UPDATE stock 
SET quantity = quantity - reserved_quantity,
    reserved = reserved + reserved_quantity
WHERE product_id = ? AND quantity >= reserved_quantity;

IF @@ROWCOUNT = 0 THEN
  ROLLBACK;
  THROW 'Produto insuficiente em estoque';
END IF;

COMMIT;

**Passo 3: Cálculo de Custo**
function calculateOrderTotal(items, deliveryAddress, promoCode) {
  let itemsTotal = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  
  let deliveryFee = calculateDeliveryFee(deliveryAddress, itemsTotal);
  let discount = applyPromoCode(promoCode, itemsTotal);
  
  return {
    itemsTotal,
    deliveryFee,
    discount,
    total: itemsTotal + deliveryFee - discount
  };
}

**Passo 4: Criação de Pedido**
INSERT INTO orders (id, user_id, status, items_total, delivery_fee, 
                   discount, total, delivery_address, created_at)
VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, NOW());

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (...);

###### 4.3.6.2.5. Integrações
**5.1. Microserviços:**
- InventoryService: verificação e reserva de produto
- PricingService: cálculo de desconto e preço
- DeliveryService: cálculo de custo de entrega
- PaymentService: início de pagamento
- NotificationService: notificações do usuário

**5.2. Banco de Dados:**
- Leitura: products, stock, users, promo_codes
- Escrita: orders, order_items, stock_reservations

###### 4.3.6.2.6. Situações Excepcionais
**6.1. Indisponibilidade de Produto (409):**
- Produto fora de estoque → Sugerir alternativas
- Produto descontinuado → Remover do carrinho

**6.2. Erros de Integração (503):**
- Indisponibilidade do InventoryService → Retry
- Erro do PaymentService → Salvar pedido como DRAFT

**6.3. Operações Compensatórias:**
- Cancelamento de reserva em erro de criação de pedido
- Reembolso em cancelamento de pedido

###### 4.3.6.2.7. Dados de Saída
**Resposta de Sucesso:**
{
  "orderId": "ord_123456",
  "status": "PENDING",
  "total": 2500.00,
  "paymentUrl": "https://payment.service/pay/...",
  "estimatedDelivery": "2024-01-20"
}

###### 4.3.6.2.8. Desempenho
**Otimizações:**
- Cache de preço de produto (TTL: 1 hora)
- Envio assíncrono de notificações
- Agrupamento de queries SQL

---

#### 4.3.7. Critérios de Qualidade para IA

##### 4.3.7.1. Completude da Descrição
- **Obrigatório**: Todos os 7 blocos principais preenchidos
- **Recomendado**: Bloco de desempenho adicionado
- **Detalhe**: Cada bloco contém mínimo 3 itens

##### 4.3.7.2. Precisão Técnica
- **Validações**: Cobrem todos os parâmetros de entrada
- **Algoritmos**: Descritos passo a passo com exemplos de código/SQL
- **Integrações**: Correspondem à arquitetura do sistema
- **Erros**: Incluem status HTTP e estratégias de recuperação

##### 4.3.7.3. Conectividade de Arquitetura
- **API**: Corresponde à especificação OpenAPI
- **Banco de Dados**: Usa entidades do ERD
- **Serviços**: Menciona componentes do diagrama arquitetural
- **Fluxos**: Correspondem a diagramas de sequência

##### 4.3.7.4. Aplicabilidade Prática
- **Implementabilidade**: Algoritmos podem ser implementados em código
- **Desempenho**: Limitações e otimizações consideradas
- **Segurança**: Verificações de autorização descritas
- **Monitoramento**: Métricas e logging mencionados

---

#### 4.3.8. Checklist para Agente de IA

##### 4.3.8.1. Verificação Obrigatória:
- [ ] ✅ Todos os 7 blocos obrigatórios presentes
- [ ] ✅ Dados de entrada correspondem à especificação de API
- [ ] ✅ Validações cobrem todos os parâmetros (estrutural + negócio)
- [ ] ✅ Lógica principal dividida em passos claros
- [ ] ✅ Integrações correspondem ao diagrama arquitetural
- [ ] ✅ Tratamento de mínimo 5 tipos de erro descrito
- [ ] ✅ Dados de saída incluem exemplos JSON
- [ ] ✅ Exemplos de código/SQL usados para lógica complexa

##### 4.3.8.2. Verificação de Qualidade:
- [ ] 🎯 Algoritmos logicamente sequenciais
- [ ] 🎯 Validações realistas para área de assunto
- [ ] 🎯 Erros incluem mensagens claras para usuário
- [ ] 🎯 Desempenho considera requisitos não-funcionais
- [ ] 🎯 Segurança inclui autorização e auditoria
- [ ] 🎯 Integrações incluem tratamento de falha

##### 4.3.8.3. Verificação Adicional:
- [ ] 🔍 Exemplos de código sintaticamente corretos
- [ ] 🔍 Queries SQL executáveis (nomes corretos de tabela/campo)
- [ ] 🔍 Status HTTP correspondem a tipos de erro
- [ ] 🔍 Limitações de tempo realistas
- [ ] 🔍 Volumes de dados correspondem à escala do sistema

**Objetivo**: Criar descrições de lógica prontas para entrega à equipe de desenvolvimento sem esclarecimentos adicionais e totalmente implementáveis em código.

---

#### 4.3.9. Recomendações Adicionais

##### 4.3.9.1. Estilo de Escrita:
- **Estruturação**: Use listas numeradas e subtítulos
- **Concretude**: Evite formulações abstratas
- **Exemplos**: Inclua código, SQL, JSON para ilustração
- **Mensurabilidade**: Especifique números e limitações específicas

##### 4.3.9.2. Detalhes Técnicos:
- **Tipos de Dados**: Especifique explicitamente tipos de parâmetros
- **Formatos**: Descreva formatos de data, número, string
- **Restrições**: Especifique valores min/max
- **Desempenho**: Adicione informação de carga

##### 4.3.9.3. Integração com Outros Artefatos:
- **Use Case**: Lógica deve cobrir todos os cenários
- **API**: Parâmetros e respostas devem corresponder
- **ERD**: Use nomes corretos de tabelas e campos
- **Arquitetura**: Mencione componentes existentes
