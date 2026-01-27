### 4.3. User Stories (US, Stories)
**Instruções para Escrever User Stories para um Agente de IA**

#### 4.3.1. Conteúdo
1. [Estrutura de User Story](#estrutura-de-user-story)
2. [Métricas de Qualidade](#métricas-de-qualidade)
3. [Regras de Validação](#regras-de-validação)
4. [Templates Baseados em Papéis](#templates-baseados-em-papéis)
5. [Exemplos de User Story](#exemplos-de-user-story)
6. [Checklist de Qualidade](#checklist-de-qualidade)

---

#### 4.3.2. Estrutura de User Story

##### 4.3.2.1. Formato Obrigatório:

US-XXX: [Nome breve da funcionalidade]
Como <papel do usuário>,
Eu quero <ação/funcionalidade desejada>,
Para que <resultado/benefício esperado>.



---

#### 4.3.3. Métricas de Qualidade

##### 4.3.3.1. Indicadores Alvo:
- **Conformidade de Formato**: 100% estrutura "Como-Eu quero-Para que"
- **Coesão**: 100% das US devem estar vinculadas a um Use Case

##### 4.3.3.2. Sistema de Pontuação:
- **Excelente Qualidade**: ≥90% de conformidade com métricas
- **Boa Qualidade**: 70-89% de conformidade com métricas
- **Precisa Melhorar**: <70% de conformidade com métricas

---

#### 4.3.4. Regras de Validação

##### 4.3.4.1. Verificações Automáticas:

✓ Todas as 3 partes estão presentes: papel + ação + resultado
✓ Papel corresponde ao diretório de papéis do sistema
✓ Ação é formulada como um verbo
✓ Resultado contém um benefício mensurável


---

#### 4.3.5. Templates Baseados em Papéis

##### 4.3.5.1. Papéis de Negócio:
- **Analista de Negócios**: análise, documentação, planejamento
- **Gerente de Projeto**: tarefas de gestão
- **Product Owner**: decisões de produto

##### 4.3.5.2. Papéis Técnicos:
- **Arquiteto de Sistemas**: decisões arquiteturais
- **Designer de Banco de Dados**: modelagem de dados
- **Desenvolvedor**: implementação técnica

##### 4.3.5.3. Template Universal:

US-XXX: [Funcionalidade]
Como [papel do diretório],
Eu quero [ação específica do sistema],
Para que [benefício de negócio ou simplificação de processo].



---

#### 4.3.6. Exemplos de User Story

##### 4.3.6.1. Tarefa Analítica - Gestão de Stakeholders

US-001: Coleta de Lista de Stakeholders do Projeto
Como Analista de Negócios,
Eu quero ter uma lista pronta de stakeholders do projeto,
Para que eu possa entender rapidamente a estrutura de participantes e não perder tempo com coleta manual.



##### 4.3.6.2. Tarefa Técnica - Geração de Diagrama

US-005: Geração de ERD a partir de Modelo de Dados
Como Designer de Banco de Dados,
Eu quero obter automaticamente um diagrama ERD a partir de uma descrição textual,
Para que eu possa visualizar a estrutura sem desenho manual.



##### 4.3.6.3. Tarefa Arquitetural

US-004: Criação de Use Case a partir de Template
Como Arquiteto de Sistemas,
Eu quero formar um Use Case de acordo com um template estabelecido,
Para que eu possa descrever interações e integrá-las à documentação.



---

#### 4.3.7. Checklist de Qualidade

##### 4.3.7.1. Verificação Estrutural:
- [ ] ✅ Nome reflete a essência da funcionalidade
- [ ] ✅ Papel do usuário é do diretório do sistema
- [ ] ✅ Ação é formulada como verbo específico
- [ ] ✅ Resultado contém benefício mensurável


##### 4.3.7.2. Verificação de Qualidade:
- [ ] 🎯 US está vinculada a componentes arquiteturais
- [ ] 🎯 Viabilidade técnica está confirmada

##### 4.3.7.3. Verificação de Integração:
- [ ] 🔗 Papel corresponde a atores no Use Case
- [ ] 🔗 Funcionalidade está refletida na arquitetura
- [ ] 🔗 Dados correspondem ao modelo ERD
- [ ] 🔗 Métodos de API estão descritos na especificação técnica

**Objetivo**: Criar User Stories prontas para estimativa, planejamento e desenvolvimento sem esclarecimentos adicionais.

---

#### 4.3.8. Recomendações de Estilo

##### 4.3.8.1. Formulações:
- **Comece com uma ação**: "O sistema fornece...", "Capacidade de adicionar..."
- **Especificidade**: indique números, formatos, restrições
- [ ] ✅ Consistência: use estilo e terminologia unificados
