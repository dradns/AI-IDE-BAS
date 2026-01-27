### 4.4. Use Cases (UC, Use Cases, UC, casos de uso)
**Instruções para Escrever Use Cases para um Agente de IA**

#### 4.4.1. Conteúdo
1. [Template de Use Case](#template-de-use-case)
2. [Métricas de Qualidade](#métricas-de-qualidade)
3. [Regras de Validação](#regras-de-validação)
4. [Exemplos de Use Case](#exemplos-de-use-case)
5. [Critérios de Qualidade](#critérios-de-qualidade)

---

#### 4.4.2. Template de Use Case

##### 4.4.2.1. Estrutura Obrigatória (9 elementos):

| № | Elemento | Descrição | Exemplo |
|---|---------|----------|---------|
| 1 | **Nome** | Verbo + Substantivo + Contexto | "Criação de Pedido pelo Cliente" |
| 2 | **User Story (US)** | "Como [papel], Eu quero [funcionalidade], Para que [valor]" | US-1: Como cliente, eu quero criar um pedido... |
| 3 | **Participantes** | Ator primário + atores secundários | Cliente, Sistema, CRM, Serviço de email |
| 4 | **Pré-condições** | O que deve estar completo antes do início | Usuário está autorizado |
| 5 | **Restrições** | Restrições de sistema/negócio | Máximo 10 itens por pedido |
| 6 | **Gatilho** | Evento que inicia o cenário | Clique no botão "Fazer Pedido" |
| 7 | **Cenário Principal** | Caminho feliz - sequência de passos | 1. Usuário seleciona itens... |
| 8 | **Cenários Alternativos** | Ramificação do fluxo principal | Passo 3: Se item estiver fora de estoque... |
| 9 | **Pós-condições** | Resultado da execução do cenário | Pedido criado e salvo no BD |

---

#### 4.4.3. Métricas de Qualidade

##### 4.4.3.1. Indicadores Alvo:
- **Completude da Estrutura**: 9/9 elementos obrigatórios = 100%
- **Cobertura de Cenário**: Principal + mínimo 2 alternativos = excelente qualidade
- **Detalhe de Passo**: 5-15 passos no cenário principal = ótimo
- **Coesão de Arquitetura**: 100% dos atores devem estar presentes na arquitetura do sistema

##### 4.4.3.2. Sistema de Pontuação:
- **Excelente Qualidade**: 90-100% de conformidade com métricas
- **Boa Qualidade**: 70-89% de conformidade com métricas
- **Precisa Melhorar**: <70% de conformidade com métricas

---

#### 4.4.4. Regras de Validação

##### 4.4.4.1. Verificações Automáticas:

###### 4.4.4.1.1. Validação Estrutural

✓ Todos os 9 elementos obrigatórios estão presentes
✓ Nome contém verbo de ação
✓ User Story está no formato "Como-Eu quero-Para que"
✓ Mínimo 1 ator primário especificado


###### 4.4.4.1.2. Validação Lógica

✓ Gatilho está logicamente conectado ao cenário principal
✓ Cenários alternativos referenciam passos do principal
✓ Pós-condições são alcançáveis através do cenário principal
✓ Pré-condições não contradizem lógica de negócio


###### 4.4.4.1.3. Validação de Integração

✓ Atores correspondem a papéis dos User Stories
✓ Componentes do sistema estão presentes no diagrama de arquitetura
✓ Métodos de API estão especificados na especificação técnica


---

#### 4.4.5. Exemplos de Use Case

##### 4.4.5.1. Exemplo 1: Solicitação Rápida de Feedback

| **Elemento** | **Descrição** |
|-------------|--------------|
| **Nome** | UC-1. Enviando uma Solicitação Rápida via Formulário de Feedback |
| **User Story** | US-1: Como usuário do sistema, eu quero enviar rapidamente uma solicitação para economizar tempo preenchendo o formulário |
| **Participantes** | • Primário: Usuário do Sistema<br>• Secundário: Interface Web, API Backend, sistema CRM |
| **Pré-condições** | • Usuário está autorizado<br>• Formulário de envio de solicitação está aberto<br>• Feature toggle de acesso rápido está ativado |
| **Restrições** | • Drawer só está disponível ao criar uma solicitação<br>• Máximo 5 templates para escolher |
| **Gatilho** | Usuário clica no elemento de acesso rápido no formulário |
| **Cenário Principal** | 1. Usuário abre o formulário de envio de solicitação<br>2. Sistema exibe o formulário com o elemento de acesso rápido<br>3. Usuário clica no elemento de acesso rápido<br>4. Sistema abre um drawer com botões-link para templates<br>5. Usuário seleciona um template adequado<br>6. Sistema redireciona para um formulário pré-preenchido<br>7. Usuário complementa os dados faltantes<br>8. Sistema salva a solicitação |
| **Cenários Alternativos** | **Passo 3**: Se usuário for novo → mostrar notificação "Suporte"<br>**Passo 4**: Ao carregar templates → mostrar loader<br>**Passo 5**: Erro 4XX/5XX → mensagem "Erro de carregamento, por favor tente novamente mais tarde"<br>**Passo 6**: Fechar drawer via "X" ou clique fora → retornar ao formulário principal |
| **Pós-condições** | • Solicitação criada e salva no CRM<br>• Usuário recebeu confirmação<br>• Métricas de uso da função enviadas |

##### 4.4.5.2. Exemplo 2: Registro de Usuário

| **Elemento** | **Descrição** |
|-------------|--------------|
| **Nome** | UC-2. Registrando um Novo Usuário no Sistema |
| **User Story** | US-2: Como novo usuário, eu quero me registrar no sistema para obter acesso a funções pessoais |
| **Participantes** | • Primário: Usuário Não Registrado<br>• Secundário: Formulário Web, API de Registro, Serviço de Email, Banco de Dados |
| **Pré-condições** | • Usuário está na página de registro<br>• Serviço de email está disponível<br>• Banco de dados está disponível |
| **Restrições** | • Email deve ser único<br>• Senha mínimo 8 caracteres<br>• Registro só disponível com email confirmado |
| **Gatilho** | Usuário clica no botão "Registrar" |
| **Cenário Principal** | 1. Usuário preenche o formulário (nome, email, senha)<br>2. Sistema valida dados inseridos<br>3. Sistema verifica unicidade do email<br>4. Sistema cria uma conta com status "não confirmada"<br>5. Sistema envia email de confirmação<br>6. Usuário clica no link no email<br>7. Sistema ativa a conta<br>8. Sistema exibe mensagem de registro bem-sucedido |
| **Cenários Alternativos** | **Passo 2**: Dados são inválidos → mostrar erros de validação<br>**Passo 3**: Email já existe → oferecer recuperação de senha<br>**Passo 5**: Erro de envio de email → salvar conta, mostrar instruções<br>**Passo 6**: Link expirou → oferecer reenvio |
| **Pós-condições** | • Conta criada e ativada<br>• Usuário pode fazer login<br>• Email de boas-vindas enviado |

---

#### 4.4.6. Critérios de Qualidade para IA

##### 4.4.6.1. Requisitos Estruturais
- **Completude**: Todos os 9 elementos devem estar preenchidos
- **Detalhe**: Cenário principal 5-15 passos
- **Cobertura**: Mínimo 2-3 cenários alternativos

##### 4.4.6.2. Requisitos Lógicos
- **Sequência**: Passos estão logicamente conectados
- **Realismo**: Cenários são viáveis dentro do sistema
- **Completude de Ramificação**: Principais casos de erro cobertos

##### 4.4.6.3. Requisitos de Integração
- **Coesão**: Atores correspondem à arquitetura
- **Rastreabilidade**: Use Case está vinculado a User Story
- **Viabilidade Técnica**: Restrições do sistema consideradas

##### 4.4.6.4. Requisitos Especiais
- **Feature Toggles**: Considere funções condicionais (test:true)
- **Especificidade de Plataforma**: Diferenças Web/mobile explicitamente declaradas
- **Tratamento de Erros**: Comportamento para 4XX/5XX descrito
- **UX**: Loaders, notificações, fechamento de formulário considerados

---

#### 4.4.7. Checklist de Validação de Use Case

##### 4.4.7.1. Verificação Obrigatória:
- [ ] ✅ Nome contém ação e contexto
- [ ] ✅ User Story no formato "Como-Eu quero-Para que"
- [ ] ✅ Todos os participantes especificados (primário + secundário)
- [ ] ✅ Pré-condições são alcançáveis
- [ ] ✅ Restrições são realistas
- [ ] ✅ Gatilho claramente definido
- [ ] ✅ Cenário principal 5-15 passos
- [ ] ✅ Cenários alternativos referenciam o principal
- [ ] ✅ Pós-condições são alcançáveis

##### 4.4.7.2. Verificação de Qualidade:
- [ ] 🎯 Cenários cobrem 80%+ dos casos reais
- [ ] 🎯 Atores estão na arquitetura do sistema
- [ ] 🎯 Viabilidade técnica confirmada
- [ ] 🎯 Tratamento de erros detalhado

**Objetivo**: Criar Use Cases prontos para entrega ao desenvolvimento sem esclarecimentos adicionais.
